import crypto from "node:crypto";
import { db } from "@qre/db";
import { analyzeImageForKnowledge } from "./aiProvider.js";
import { learnWebsiteWorld } from "./websiteLearning.js";
import { decodeDataUrl, extractPdfKnowledge, extractSpreadsheetKnowledge } from "./documentKnowledge.js";
import { reconcileCatalogIdentity } from "./knowledgeReconciliation.js";
import { analyzeKnowledgeTimeSeries, recommendationFromTemporalSignal } from "./knowledgeTemporalIntelligence.js";

const WORKER_POLL_MS = 1200;
const LEASE_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = Number(process.env.QRE_KNOWLEDGE_MAX_ATTEMPTS || 8);

export type IntakeInput = {
  assetId: string;
  userId: string;
  sourceType: string;
  originalName?: string;
  mimeType?: string;
  content?: string;
  imageDataUrl?: string;
  text?: string;
};

type StoredPayload = IntakeInput;
type LeaseJob = {
  id: string;
  assetId: string;
  sourceType: string;
  originalName: string | null;
  payload: unknown;
  attemptCount: number;
  leaseToken: string;
};

type KnowledgeFact = {
  label: string;
  value: string;
  category?: string;
  unit?: string;
  notes?: string;
  confidence?: number;
};

const workerId = `${process.pid}-${crypto.randomUUID()}`;
let workerStarted = false;
let workerBusy = false;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function clampConfidence(value: unknown): number {
  return Math.max(0, Math.min(1, typeof value === "number" ? value : 0.5));
}

function payloadRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseStoredPayload(job: LeaseJob): StoredPayload {
  const payload = payloadRecord(job.payload);
  return {
    assetId: job.assetId,
    userId: typeof payload.userId === "string" ? payload.userId : "system",
    sourceType: job.sourceType,
    originalName: job.originalName ?? undefined,
    mimeType: typeof payload.mimeType === "string" ? payload.mimeType : undefined,
    content: typeof payload.content === "string" ? payload.content : undefined,
    imageDataUrl: typeof payload.imageDataUrl === "string" ? payload.imageDataUrl : undefined,
    text: typeof payload.text === "string" ? payload.text : undefined,
  };
}

function textFromInput(input: StoredPayload): string | undefined {
  if (input.text?.trim()) return input.text.trim();
  if (input.content?.startsWith("data:")) {
    const decoded = decodeDataUrl(input.content);
    if (!decoded) return undefined;
    if (!decoded.mimeType.startsWith("text/")) return undefined;
    return decoded.bytes.toString("utf8").trim() || undefined;
  }
  return input.content?.trim() || undefined;
}

function simpleFactsFromText(text: string): KnowledgeFact[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 250);
  const facts: KnowledgeFact[] = [];
  for (const line of lines) {
    const match = line.match(/^(?:[-*•]\s*)?([^:]{1,120}):\s*(.{1,1000})$/);
    if (match) facts.push({ label: match[1].trim(), value: match[2].trim(), category: "text", confidence: 0.86 });
  }
  if (!facts.length) facts.push({ label: "Owner-provided knowledge", value: text.slice(0, 12000), category: "text", confidence: 0.92 });
  return facts.slice(0, 50);
}

async function createEvidence(input: StoredPayload, jobId: string) {
  return db.knowledgeEvidence.create({
    data: {
      assetId: input.assetId,
      intakeJobId: jobId,
      type: input.mimeType || input.sourceType,
      source: input.sourceType,
      contentHash: sha256(input.imageDataUrl || input.text || input.content || ""),
      text: textFromInput(input),
      metadata: { originalName: input.originalName, mimeType: input.mimeType, userId: input.userId },
      confidence: 1,
    },
  });
}

async function persistFacts(input: StoredPayload, evidenceId: string, facts: KnowledgeFact[]) {
  return db.$transaction(async (tx) => {
    const catalogIds: string[] = [];
    const observationIds: string[] = [];
    let factCount = 0;

    for (const fact of facts) {
      const normalizedName = normalize(fact.label || fact.value);
      if (!normalizedName) continue;

      const candidates = await tx.catalogItem.findMany({
        where: { assetId: input.assetId },
        include: { attributes: { select: { key: true, value: true, normalizedValue: true } } },
        take: 250,
      });
      const decision = reconcileCatalogIdentity(fact, candidates);
      const existing = decision.matchId ? candidates.find((candidate) => candidate.id === decision.matchId) : undefined;

      const item = existing
        ? await tx.catalogItem.update({
            where: { id: existing.id },
            data: {
              category: fact.category || existing.category || undefined,
              description: existing.description || fact.notes || undefined,
            },
          })
        : await tx.catalogItem.create({
            data: {
              assetId: input.assetId,
              kind: fact.category || "item",
              name: fact.label || fact.value,
              normalizedName,
              category: fact.category || undefined,
              description: fact.notes || undefined,
              metadata: decision.ambiguous ? { reconciliation: decision.reason, reconciliationConfidence: decision.confidence } : undefined,
            },
          });

      catalogIds.push(item.id);
      await tx.catalogAttribute.create({
        data: {
          catalogItemId: item.id,
          key: "value",
          value: fact.value,
          normalizedValue: normalize(fact.value),
          unit: fact.unit || undefined,
          confidence: clampConfidence(fact.confidence),
          evidenceId,
        },
      });

      const observation = await tx.knowledgeObservation.create({
        data: {
          assetId: input.assetId,
          catalogItemId: item.id,
          evidenceId,
          type: "OBSERVED",
          value: { label: fact.label, value: fact.value, category: fact.category, unit: fact.unit, notes: fact.notes, reconciliation: decision.reason },
          source: input.sourceType,
          confidence: clampConfidence(fact.confidence) * (decision.ambiguous ? 0.85 : 1),
          observedAt: new Date(),
          metadata: { reconciliationConfidence: decision.confidence, ambiguousIdentity: decision.ambiguous },
        },
      });
      observationIds.push(observation.id);
      factCount += 1;

      const observations = await tx.knowledgeObservation.findMany({
        where: { assetId: input.assetId, catalogItemId: item.id },
        orderBy: { observedAt: "asc" },
        take: 60,
        select: { observedAt: true, value: true, evidenceId: true },
      });
      const temporal = analyzeKnowledgeTimeSeries(observations);
      const numericRecommendation = recommendationFromTemporalSignal(temporal.analysis);
      const allEvidenceIds = [...new Set(observations.map((value) => value.evidenceId).filter((value): value is string => Boolean(value)))];

      const patterns = [
        ...(observations.length >= 2 ? [{ type: "REPEATED_OBSERVATION", statement: `${item.name} has been observed ${observations.length} times.` , strength: Math.min(.99, observations.length / (observations.length + 2)), confidence: Math.min(.99, .55 + Math.log10(observations.length + 1) * .45) }] : []),
        ...temporal.analysis.signals.map((signal) => ({ type: signal.kind.toUpperCase(), statement: signal.statement, strength: signal.score, confidence: signal.confidence })),
        ...(temporal.analysis.forecast ? [{ type: "FORECAST", statement: `Projected next value is ${temporal.analysis.forecast.nextValue.toFixed(2)} with range ${temporal.analysis.forecast.range.low.toFixed(2)}–${temporal.analysis.forecast.range.high.toFixed(2)}.`, strength: Math.min(.99, Math.abs(temporal.analysis.forecast.slope) / (Math.abs(temporal.analysis.baseline) + 0.000001)), confidence: temporal.analysis.forecast.confidence }] : []),
        ...(numericRecommendation ? [{ type: "RECOMMENDATION", statement: numericRecommendation.reason, strength: numericRecommendation.priority, confidence: strongestRecommendationConfidence(numericRecommendation) }] : []),
      ];

      for (const pattern of patterns) {
        const existingPattern = await tx.knowledgePattern.findFirst({ where: { assetId: input.assetId, catalogItemId: item.id, type: pattern.type }, orderBy: { updatedAt: "desc" } });
        const metadata = {
          temporal: temporal.analysis,
          reconciliation: decision,
          recommendation: pattern.type === "RECOMMENDATION" ? numericRecommendation : undefined,
        };
        if (existingPattern) {
          const priorIds = Array.isArray(existingPattern.evidenceIds) ? existingPattern.evidenceIds.filter((id): id is string => typeof id === "string") : [];
          await tx.knowledgePattern.update({ where: { id: existingPattern.id }, data: { statement: pattern.statement, strength: pattern.strength, confidence: pattern.confidence, evidenceIds: [...new Set([...priorIds, ...allEvidenceIds, evidenceId])], lastObservedAt: observation.observedAt, metadata } });
        } else {
          await tx.knowledgePattern.create({ data: { assetId: input.assetId, catalogItemId: item.id, type: pattern.type, statement: pattern.statement, strength: pattern.strength, confidence: pattern.confidence, evidenceIds: [...new Set([...allEvidenceIds, evidenceId])], firstObservedAt: observations[0]?.observedAt || observation.observedAt, lastObservedAt: observation.observedAt, metadata } });
        }
      }
    }

    return { catalogIds: [...new Set(catalogIds)], observationIds, factCount };
  }, { timeout: 120000 });
}

function strongestRecommendationConfidence(value: { reason: string; priority: number }): number {
  return Math.max(0, Math.min(1, 0.55 + value.priority * 0.4));
}

async function processIntake(job: LeaseJob): Promise<void> {
  const input = parseStoredPayload(job);
  let evidenceId: string | undefined;
  try {
    evidenceId = (await createEvidence(input, job.id)).id;

    let result: { factCount: number; catalogIds: string[]; observationIds: string[] };
    if (input.sourceType === "website") {
      const url = input.text?.trim() || input.content?.trim() || "";
      if (!url) throw new Error("Website URL is missing.");
      const learned = await learnWebsiteWorld({ url });
      const asset = await db.asset.findUnique({ where: { id: input.assetId }, select: { displayName: true, templateData: true } });
      const payload = { label: "Business world learned from website", value: learned.world.businessName || asset?.displayName || "Business world", category: "business_world", source: "website", sourceUrl: learned.url, sourceTitle: learned.title || undefined, confidence: 0.9, ...learned.world, sourceExcerpt: learned.sourceExcerpt, evidenceId, updatedBy: input.userId };
      const currentData = payloadRecord(asset?.templateData);
      await db.insight.create({ data: { assetId: input.assetId, type: "KNOWLEDGE", message: JSON.stringify(payload), impact: learned.world.description || learned.world.businessType || learned.world.businessName || learned.title } });
      await db.asset.update({ where: { id: input.assetId }, data: { templateData: { ...currentData, businessName: learned.world.businessName || currentData.businessName || asset?.displayName, businessType: learned.world.businessType || currentData.businessType || "", businessDescription: learned.world.description || currentData.businessDescription || "", services: learned.world.services.length ? learned.world.services : currentData.services || [], capabilities: learned.world.services.length ? learned.world.services : currentData.capabilities || [], contextualSignals: [...new Set([...(Array.isArray(currentData.contextualSignals) ? currentData.contextualSignals.filter((v): v is string => typeof v === "string") : []), ...learned.world.signals, ...learned.world.differentiators])].slice(0, 48), subjectKinds: learned.world.subjectKinds.length ? learned.world.subjectKinds : currentData.subjectKinds || [], websiteKnowledge: { ...learned.world, sourceUrl: learned.url, sourceTitle: learned.title, learnedAt: new Date().toISOString() } } });
      result = { factCount: 1, catalogIds: [], observationIds: [] };
    } else if (input.imageDataUrl?.startsWith("data:image/")) {
      result = await persistFacts(input, evidenceId, await analyzeImageForKnowledge(input.imageDataUrl));
    } else if (input.sourceType === "pdf") {
      const decoded = decodeDataUrl(input.content || "");
      if (!decoded) throw new Error("PDF upload is not a valid data URL.");
      const extracted = await extractPdfKnowledge(decoded.bytes);
      await db.knowledgeEvidence.update({ where: { id: evidenceId }, data: { text: extracted.text, metadata: { originalName: input.originalName, mimeType: input.mimeType, userId: input.userId, ...extracted.metadata } } });
      result = await persistFacts(input, evidenceId, extracted.facts);
    } else if (input.sourceType === "spreadsheet") {
      const decoded = decodeDataUrl(input.content || "");
      if (!decoded) throw new Error("Spreadsheet upload is not a valid data URL.");
      const extracted = extractSpreadsheetKnowledge(decoded.bytes, input.originalName);
      await db.knowledgeEvidence.update({ where: { id: evidenceId }, data: { text: extracted.text, metadata: { originalName: input.originalName, mimeType: input.mimeType, userId: input.userId, ...extracted.metadata } });
      result = await persistFacts(input, evidenceId, extracted.facts);
    } else {
      const text = textFromInput(input);
      result = text ? await persistFacts(input, evidenceId, simpleFactsFromText(text)) : { factCount: 0, catalogIds: [], observationIds: [] };
    }

    const finished = await db.$executeRaw`
      UPDATE "KnowledgeIntakeJob"
      SET "status" = 'completed', "result" = ${JSON.stringify({ evidenceId, ...result })}::jsonb,
          "error" = NULL, "lastAttemptError" = NULL, "completedAt" = NOW(),
          "workerId" = NULL, "leaseToken" = NULL, "leaseExpiresAt" = NULL, "heartbeatAt" = NULL
      WHERE "id" = ${job.id} AND "leaseToken" = ${job.leaseToken} AND "workerId" = ${workerId};`;
    if (finished !== 1) console.warn("[KnowledgeIntake] lease lost before completion", job.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Knowledge intake failed";
    const exhausted = job.attemptCount >= MAX_ATTEMPTS;
    const delaySeconds = Math.min(300, 5 * 2 ** Math.max(0, job.attemptCount - 1));
    const result = await db.$executeRaw`
      UPDATE "KnowledgeIntakeJob"
      SET "status" = ${exhausted ? "failed" : "queued"},
          "error" = ${message},
          "lastAttemptError" = ${message},
          "nextAttemptAt" = ${exhausted ? null : new Date(Date.now() + delaySeconds * 1000)},
          "completedAt" = ${exhausted ? new Date() : null},
          "workerId" = NULL, "leaseToken" = NULL, "leaseExpiresAt" = NULL, "heartbeatAt" = NULL
      WHERE "id" = ${job.id} AND "leaseToken" = ${job.leaseToken} AND "workerId" = ${workerId};`;
    if (result !== 1) console.warn("[KnowledgeIntake] lease lost before failure recording", job.id);
    console.error("[KnowledgeIntake] failed", job.id, message, evidenceId ? { evidenceId } : "");
  }
}

async function heartbeat(job: LeaseJob): Promise<boolean> {
  const expires = new Date(Date.now() + LEASE_MS);
  const updated = await db.$executeRaw`
    UPDATE "KnowledgeIntakeJob"
    SET "leaseExpiresAt" = ${expires}, "heartbeatAt" = NOW()
    WHERE "id" = ${job.id} AND "leaseToken" = ${job.leaseToken} AND "workerId" = ${workerId} AND "status" = 'processing';`;
  return updated === 1;
}

async function claimQueuedJob(): Promise<LeaseJob | null> {
  const leaseToken = crypto.randomUUID();
  const expires = new Date(Date.now() + LEASE_MS);
  const rows = await db.$queryRaw<LeaseJob[]>`
    WITH candidate AS (
      SELECT "id"
      FROM "KnowledgeIntakeJob"
      WHERE "status" = 'queued'
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
        AND "attemptCount" < ${MAX_ATTEMPTS}
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "KnowledgeIntakeJob" AS job
    SET "status" = 'processing', "workerId" = ${workerId}, "leaseToken" = ${leaseToken},
        "leaseExpiresAt" = ${expires}, "heartbeatAt" = NOW(), "startedAt" = COALESCE("startedAt", NOW()),
        "attemptCount" = "attemptCount" + 1
    FROM candidate
    WHERE job."id" = candidate."id"
    RETURNING job."id", job."assetId", job."sourceType", job."originalName", job."payload", job."attemptCount", job."leaseToken";`;
  return rows[0] || null;
}

async function recoverExpiredLeases(): Promise<void> {
  await db.$executeRaw`
    UPDATE "KnowledgeIntakeJob"
    SET "status" = CASE WHEN "attemptCount" >= ${MAX_ATTEMPTS} THEN 'failed' ELSE 'queued' END,
        "error" = CASE WHEN "attemptCount" >= ${MAX_ATTEMPTS} THEN COALESCE("lastAttemptError", 'Knowledge worker lease expired.') ELSE "error" END,
        "completedAt" = CASE WHEN "attemptCount" >= ${MAX_ATTEMPTS} THEN NOW() ELSE NULL END,
        "nextAttemptAt" = CASE WHEN "attemptCount" >= ${MAX_ATTEMPTS} THEN NULL ELSE NOW() + INTERVAL '10 seconds' END,
        "workerId" = NULL, "leaseToken" = NULL, "leaseExpiresAt" = NULL, "heartbeatAt" = NULL
    WHERE "status" = 'processing' AND "leaseExpiresAt" < NOW();`;
}

async function workerTick(): Promise<void> {
  if (workerBusy) return;
  workerBusy = true;
  let job: LeaseJob | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  try {
    await recoverExpiredLeases();
    job = await claimQueuedJob();
    if (!job) return;
    timer = setInterval(() => { void heartbeat(job!); }, Math.max(1000, Math.floor(LEASE_MS / 3)));
    await processIntake(job);
  } catch (error) {
    console.error("[KnowledgeIntake] worker tick failed", error);
  } finally {
    if (timer) clearInterval(timer);
    workerBusy = false;
  }
}

export function startKnowledgeIntakeWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  console.log("[KnowledgeIntake] fenced durable worker started", { workerId, leaseMs: LEASE_MS, maxAttempts: MAX_ATTEMPTS });
  const loop = async () => {
    await workerTick();
    setTimeout(loop, WORKER_POLL_MS);
  };
  void loop();
}

export async function enqueueKnowledgeIntake(input: IntakeInput) {
  const rawContent = input.imageDataUrl || input.text || input.content || "";
  const contentHash = rawContent ? sha256(rawContent) : undefined;
  if (contentHash) {
    const existing = await db.knowledgeIntakeJob.findFirst({ where: { assetId: input.assetId, contentHash, status: { in: ["queued", "processing", "completed"] } }, orderBy: { createdAt: "desc" } });
    if (existing) return { job: existing, duplicate: true };
  }
  const job = await db.knowledgeIntakeJob.create({ data: { assetId: input.assetId, status: "queued", sourceType: input.sourceType, originalName: input.originalName, contentHash, payload: { mimeType: input.mimeType, content: input.content, imageDataUrl: input.imageDataUrl, text: input.text, userId: input.userId } } });
  return { job, duplicate: false };
}

export async function retryKnowledgeIntake(jobId: string, assetId: string) {
  const job = await db.knowledgeIntakeJob.findFirst({ where: { id: jobId, assetId } });
  if (!job) return null;
  if (job.status !== "failed") return job;
  await db.$executeRaw`
    UPDATE "KnowledgeIntakeJob"
    SET "status" = 'queued', "error" = NULL, "result" = NULL, "lastAttemptError" = NULL,
        "nextAttemptAt" = NOW(), "completedAt" = NULL,
        "workerId" = NULL, "leaseToken" = NULL, "leaseExpiresAt" = NULL, "heartbeatAt" = NULL
    WHERE "id" = ${job.id} AND "assetId" = ${assetId};`;
  return db.knowledgeIntakeJob.findUnique({ where: { id: job.id } });
}
