import crypto from "node:crypto";
import { db } from "@qre/db";
import { analyzeImageForKnowledge } from "./aiProvider.js";
import { learnWebsiteWorld } from "./websiteLearning.js";
import {
  decodeDataUrl,
  extractPdfKnowledge,
  extractSpreadsheetKnowledge,
} from "./documentKnowledge.js";

const WORKER_POLL_MS = 1200;
const STALE_PROCESSING_MS = 30 * 60 * 1000;

type IntakeInput = {
  assetId: string;
  userId: string;
  sourceType: string;
  originalName?: string;
  mimeType?: string;
  content?: string;
  imageDataUrl?: string;
  text?: string;
};

type StoredPayload = {
  assetId: string;
  userId: string;
  sourceType: string;
  originalName?: string;
  mimeType?: string;
  content?: string;
  imageDataUrl?: string;
  text?: string;
};

let workerStarted = false;
let workerBusy = false;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s._-]/gu, "");
}

function clampConfidence(value: unknown): number {
  return Math.max(0, Math.min(1, typeof value === "number" ? value : 0.5));
}

function parseStoredPayload(job: { assetId: string; sourceType: string; originalName: string | null; payload: unknown }): StoredPayload {
  const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload)
    ? job.payload as Record<string, unknown>
    : {};

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
    if (!decoded || !decoded.mimeType.startsWith("text/")) return undefined;
    return decoded.bytes.toString("utf8").trim() || undefined;
  }

  return input.content?.trim() || undefined;
}

function simpleFactsFromText(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 250);
  const facts: Array<{ label: string; value: string; category: string; confidence: number }> = [];

  for (const line of lines) {
    const match = line.match(/^(?:[-*•]\s*)?([^:]{1,120}):\s*(.{1,1000})$/);
    if (match) facts.push({ label: match[1].trim(), value: match[2].trim(), category: "text", confidence: 0.86 });
  }

  if (!facts.length) facts.push({ label: "Owner-provided knowledge", value: text.slice(0, 12000), category: "text", confidence: 0.92 });
  return facts.slice(0, 50);
}

async function learnWebsite(input: StoredPayload, evidenceId: string) {
  const url = input.text?.trim() || input.content?.trim() || "";
  if (!url) throw new Error("Website URL is missing.");

  const learned = await learnWebsiteWorld({ url });
  const world = learned.world;
  const asset = await db.asset.findUnique({ where: { id: input.assetId }, select: { displayName: true, templateData: true } });

  const payload = {
    label: "Business world learned from website",
    value: world.businessName || asset?.displayName || "Business world",
    category: "business_world",
    source: "website",
    sourceUrl: learned.url,
    sourceTitle: learned.title || undefined,
    confidence: 0.9,
    businessName: world.businessName || undefined,
    businessType: world.businessType || undefined,
    businessDescription: world.description || undefined,
    services: world.services,
    differentiators: world.differentiators,
    signals: world.signals,
    subjectKinds: world.subjectKinds,
    importantFacts: world.importantFacts,
    sourceExcerpt: learned.sourceExcerpt,
    evidenceId,
    updatedBy: input.userId,
  };

  const row = await db.insight.create({ data: { assetId: input.assetId, type: "KNOWLEDGE", message: JSON.stringify(payload), impact: world.description || world.businessType || world.businessName || learned.title } });

  const currentData = asset?.templateData && typeof asset.templateData === "object" && !Array.isArray(asset.templateData)
    ? asset.templateData as Record<string, unknown>
    : {};

  const templateData = JSON.parse(JSON.stringify({
    ...currentData,
    businessName: world.businessName || currentData.businessName || asset?.displayName,
    businessType: world.businessType || currentData.businessType || "",
    businessDescription: world.description || currentData.businessDescription || "",
    services: world.services.length ? world.services : currentData.services || [],
    capabilities: world.services.length ? world.services : currentData.capabilities || [],
    contextualSignals: [...new Set([
      ...(Array.isArray(currentData.contextualSignals) ? currentData.contextualSignals.filter((value): value is string => typeof value === "string") : []),
      ...world.signals,
      ...world.differentiators,
    ])].slice(0, 48),
    subjectKinds: world.subjectKinds.length ? world.subjectKinds : currentData.subjectKinds || [],
    websiteKnowledge: {
      sourceUrl: learned.url,
      sourceTitle: learned.title,
      businessName: world.businessName,
      businessType: world.businessType,
      description: world.description,
      services: world.services,
      differentiators: world.differentiators,
      signals: world.signals,
      subjectKinds: world.subjectKinds,
      importantFacts: world.importantFacts,
      learnedAt: new Date().toISOString(),
    },
  }));

  await db.asset.update({ where: { id: input.assetId }, data: { templateData } });
  return { row, factCount: 1, catalogIds: [], observationIds: [] };
}

async function persistFacts(input: StoredPayload, evidenceId: string, facts: Array<{ label: string; value: string; category?: string; unit?: string; notes?: string; confidence?: number }>) {
  const catalogIds: string[] = [];
  const observationIds: string[] = [];

  for (const fact of facts) {
    const normalizedName = normalizeName(fact.label || fact.value);
    if (!normalizedName) continue;

    const existing = await db.catalogItem.findFirst({ where: { assetId: input.assetId, normalizedName } });
    const item = existing
      ? await db.catalogItem.update({ where: { id: existing.id }, data: { category: fact.category || existing.category || undefined, description: existing.description || fact.notes || undefined } })
      : await db.catalogItem.create({ data: { assetId: input.assetId, kind: fact.category || "item", name: fact.label || fact.value, normalizedName, category: fact.category || undefined, description: fact.notes || undefined } });

    catalogIds.push(item.id);

    await db.catalogAttribute.create({ data: { catalogItemId: item.id, key: "value", value: fact.value, unit: fact.unit || undefined, confidence: clampConfidence(fact.confidence), evidenceId } });

    const observation = await db.knowledgeObservation.create({
      data: {
        assetId: input.assetId,
        catalogItemId: item.id,
        evidenceId,
        type: "OBSERVED",
        value: { label: fact.label, value: fact.value, category: fact.category, unit: fact.unit, notes: fact.notes },
        source: input.sourceType,
        confidence: clampConfidence(fact.confidence),
        observedAt: new Date(),
      },
    });

    observationIds.push(observation.id);

    const repeated = await db.knowledgeObservation.count({ where: { assetId: input.assetId, catalogItemId: item.id } });

    if (repeated >= 2) {
      const existingPattern = await db.knowledgePattern.findFirst({ where: { assetId: input.assetId, catalogItemId: item.id, type: "REPEATED_OBSERVATION" }, orderBy: { updatedAt: "desc" } });
      const confidence = Math.min(.99, .55 + Math.log10(repeated + 1) * .45);
      const statement = `${item.name} has been observed repeatedly (${repeated} observations).`;
      const strength = Math.min(.99, repeated / (repeated + 2));

      if (existingPattern) {
        await db.knowledgePattern.update({ where: { id: existingPattern.id }, data: { statement, confidence, strength, lastObservedAt: new Date(), evidenceIds: { push: evidenceId } as never } });
      } else {
        await db.knowledgePattern.create({ data: { assetId: input.assetId, catalogItemId: item.id, type: "REPEATED_OBSERVATION", statement, confidence, strength, evidenceIds: [evidenceId], firstObservedAt: new Date(), lastObservedAt: new Date() } });
      }
    }
  }

  return { catalogIds, observationIds, factCount: facts.length };
}

async function processIntake(jobId: string, input: StoredPayload): Promise<void> {
  try {
    const evidence = await db.knowledgeEvidence.create({
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

    let result: { factCount: number; catalogIds: string[]; observationIds: string[] };

    if (input.sourceType === "website") {
      result = await learnWebsite(input, evidence.id);
    } else if (input.imageDataUrl?.startsWith("data:image/")) {
      result = await persistFacts(input, evidence.id, await analyzeImageForKnowledge(input.imageDataUrl));
    } else if (input.sourceType === "pdf") {
      const decoded = decodeDataUrl(input.content || "");
      if (!decoded) throw new Error("PDF upload is not a valid data URL.");
      const extracted = await extractPdfKnowledge(decoded.bytes);
      await db.knowledgeEvidence.update({ where: { id: evidence.id }, data: { text: extracted.text, metadata: { originalName: input.originalName, mimeType: input.mimeType, userId: input.userId, ...extracted.metadata } } });
      result = await persistFacts(input, evidence.id, extracted.facts);
    } else if (input.sourceType === "spreadsheet") {
      const decoded = decodeDataUrl(input.content || "");
      if (!decoded) throw new Error("Spreadsheet upload is not a valid data URL.");
      const extracted = extractSpreadsheetKnowledge(decoded.bytes, input.originalName);
      await db.knowledgeEvidence.update({ where: { id: evidence.id }, data: { text: extracted.text, metadata: { originalName: input.originalName, mimeType: input.mimeType, userId: input.userId, ...extracted.metadata } } });
      result = await persistFacts(input, evidence.id, extracted.facts);
    } else {
      const text = textFromInput(input);
      result = text
        ? await persistFacts(input, evidence.id, simpleFactsFromText(text))
        : { factCount: 0, catalogIds: [], observationIds: [] };
    }

    await db.knowledgeIntakeJob.update({ where: { id: jobId }, data: { status: "completed", result: { evidenceId: evidence.id, ...result }, completedAt: new Date() } });
  } catch (error) {
    console.error("[KnowledgeIntake] failed", jobId, error);
    try {
      await db.knowledgeIntakeJob.update({ where: { id: jobId }, data: { status: "failed", error: error instanceof Error ? error.message : "Knowledge intake failed", completedAt: new Date() } });
    } catch (updateError) {
      console.error("[KnowledgeIntake] could not record failure", jobId, updateError);
    }
  }
}

async function requeueStaleJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  await db.knowledgeIntakeJob.updateMany({ where: { status: "processing", startedAt: { lt: cutoff } }, data: { status: "queued", startedAt: null } });
}

async function claimQueuedJob() {
  const candidate = await db.knowledgeIntakeJob.findFirst({ where: { status: "queued" }, orderBy: { createdAt: "asc" } });
  if (!candidate) return null;

  const claimed = await db.knowledgeIntakeJob.updateMany({ where: { id: candidate.id, status: "queued" }, data: { status: "processing", startedAt: new Date() } });
  if (claimed.count !== 1) return null;

  return db.knowledgeIntakeJob.findUnique({ where: { id: candidate.id }, select: { id: true, assetId: true, sourceType: true, originalName: true, payload: true } });
}

async function workerTick(): Promise<void> {
  if (workerBusy) return;
  workerBusy = true;
  try {
    await requeueStaleJobs();
    const job = await claimQueuedJob();
    if (job) await processIntake(job.id, parseStoredPayload(job));
  } catch (error) {
    console.error("[KnowledgeIntake] worker tick failed", error);
  } finally {
    workerBusy = false;
  }
}

export function startKnowledgeIntakeWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  console.log("[KnowledgeIntake] durable worker started");

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
    const existing = await db.knowledgeIntakeJob.findFirst({ where: { assetId: input.assetId, contentHash }, orderBy: { createdAt: "desc" } });
    if (existing) return { job: existing, duplicate: true };
  }

  const job = await db.knowledgeIntakeJob.create({
    data: {
      assetId: input.assetId,
      status: "queued",
      sourceType: input.sourceType,
      originalName: input.originalName,
      contentHash,
      payload: { mimeType: input.mimeType, content: input.content, imageDataUrl: input.imageDataUrl, text: input.text, userId: input.userId },
    },
  });

  return { job, duplicate: false };
}
