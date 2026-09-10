import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@qre/db";
import { analyzeImageForCatalog, type CatalogVisionItem } from "./catalogVision.js";
import { readKnowledgeMedia, mediaDataUrl, writeKnowledgeMedia } from "./knowledgeMedia.js";
import { learnWebsiteWorld } from "./websiteLearning.js";
import { decodeDataUrl, extractPdfKnowledge, extractSpreadsheetKnowledge } from "./documentKnowledge.js";

const WORKER_POLL_MS = 1200;
const STALE_PROCESSING_MS = 30 * 60 * 1000;
type IntakeStage = "queued" | "evidence" | "website" | "vision" | "extracting" | "persisting" | "complete" | "failed";
type IntakeInput = { assetId: string; userId: string; sourceType: string; originalName?: string; mimeType?: string; content?: string; imageDataUrl?: string; text?: string };
type StoredPayload = IntakeInput & { storageKey?: string };
type Fact = { label: string; value: string; category?: string; unit?: string; notes?: string; confidence?: number };
type Location = { section?: string; shelf?: string; row?: string; position?: string; bbox?: [number, number, number, number] };

let workerStarted = false;
let workerBusy = false;

function sha256(value: string): string { return crypto.createHash("sha256").update(value).digest("hex"); }
function sha256Bytes(value: Buffer): string { return crypto.createHash("sha256").update(value).digest("hex"); }
function normalizeName(value: string): string { return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s._-]/gu, ""); }
function clampConfidence(value: unknown): number { return Math.max(0, Math.min(1, typeof value === "number" ? value : 0.5)); }
function locationSignature(location?: Location): string { return location ? [location.section, location.shelf, location.row, location.position, location.bbox?.join(",")].filter((value): value is string => Boolean(value)).join(" / ") : ""; }
function storedLocation(value: unknown): Location | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const location = source.location;
  if (!location || typeof location !== "object" || Array.isArray(location)) return undefined;
  const raw = location as Record<string, unknown>;
  const bbox = Array.isArray(raw.bbox) && raw.bbox.length === 4 && raw.bbox.every((item) => typeof item === "number") ? raw.bbox as [number, number, number, number] : undefined;
  return { section: typeof raw.section === "string" ? raw.section : undefined, shelf: typeof raw.shelf === "string" ? raw.shelf : undefined, row: typeof raw.row === "string" ? raw.row : undefined, position: typeof raw.position === "string" ? raw.position : undefined, bbox };
}
function parseStoredPayload(job: { assetId: string; sourceType: string; originalName: string | null; payload: unknown }): StoredPayload {
  const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? job.payload as Record<string, unknown> : {};
  return { assetId: job.assetId, userId: typeof payload.userId === "string" ? payload.userId : "system", sourceType: job.sourceType, originalName: job.originalName ?? undefined, mimeType: typeof payload.mimeType === "string" ? payload.mimeType : undefined, content: typeof payload.content === "string" ? payload.content : undefined, imageDataUrl: typeof payload.imageDataUrl === "string" ? payload.imageDataUrl : undefined, text: typeof payload.text === "string" ? payload.text : undefined, storageKey: typeof payload.storageKey === "string" ? payload.storageKey : undefined };
}
function textFromInput(input: StoredPayload): string | undefined {
  if (input.text?.trim()) return input.text.trim();
  if (input.content?.startsWith("data:")) { const decoded = decodeDataUrl(input.content); if (!decoded || !decoded.mimeType.startsWith("text/")) return undefined; return decoded.bytes.toString("utf8").trim() || undefined; }
  return input.content?.trim() || undefined;
}
function simpleFactsFromText(text: string): Fact[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 250);
  const facts: Fact[] = [];
  for (const line of lines) { const match = line.match(/^(?:[-*•]\s*)?([^:]{1,120}):\s*(.{1,1000})$/); if (match) facts.push({ label: match[1].trim(), value: match[2].trim(), category: "text", confidence: 0.86 }); }
  if (!facts.length) facts.push({ label: "Owner-provided knowledge", value: text.slice(0, 12000), category: "text", confidence: 0.92 });
  return facts.slice(0, 50);
}
async function setStage(jobId: string, stage: IntakeStage): Promise<void> { await db.knowledgeIntakeJob.update({ where: { id: jobId }, data: { result: { stage } } }); }
async function ensureMedia(input: StoredPayload, jobId: string, contentHash: string): Promise<{ input: StoredPayload; bytes?: Buffer; mimeType?: string }> {
  if (input.storageKey) return { input, bytes: await readKnowledgeMedia(input.storageKey), mimeType: input.mimeType };
  const dataUrl = input.imageDataUrl || (input.content?.startsWith("data:") ? input.content : undefined);
  if (!dataUrl) return { input };
  const decoded = decodeDataUrl(dataUrl); if (!decoded) throw new Error("Uploaded content is not a valid data URL.");
  const extension = decoded.mimeType === "application/pdf" ? "pdf" : decoded.mimeType.startsWith("image/") ? (decoded.mimeType.split("/", 2)[1] || "bin") : "bin";
  const storageKey = `intake/${input.assetId}/${contentHash}.${extension}`;
  await writeKnowledgeMedia(storageKey, decoded.bytes);
  return { input: { ...input, storageKey, imageDataUrl: undefined, content: input.imageDataUrl ? undefined : input.content }, bytes: decoded.bytes, mimeType: decoded.mimeType };
}
async function learnWebsite(input: StoredPayload, evidenceId: string) {
  const url = input.text?.trim() || input.content?.trim() || ""; if (!url) throw new Error("Website URL is missing.");
  const learned = await learnWebsiteWorld({ url }); const world = learned.world;
  const asset = await db.asset.findUnique({ where: { id: input.assetId }, select: { displayName: true, templateData: true } });
  const payload = { label: "Business world learned from website", value: world.businessName || asset?.displayName || "Business world", category: "business_world", source: "website", sourceUrl: learned.url, sourceTitle: learned.title || undefined, confidence: 0.9, businessName: world.businessName || undefined, businessType: world.businessType || undefined, businessDescription: world.description || undefined, services: world.services, differentiators: world.differentiators, signals: world.signals, subjectKinds: world.subjectKinds, importantFacts: world.importantFacts, sourceExcerpt: learned.sourceExcerpt, evidenceId, updatedBy: input.userId };
  const row = await db.insight.create({ data: { assetId: input.assetId, type: "KNOWLEDGE", message: JSON.stringify(payload), impact: world.description || world.businessType || world.businessName || learned.title } });
  const currentData = asset?.templateData && typeof asset.templateData === "object" && !Array.isArray(asset.templateData) ? asset.templateData as Record<string, unknown> : {};
  const templateData = JSON.parse(JSON.stringify({ ...currentData, businessName: world.businessName || currentData.businessName || asset?.displayName, businessType: world.businessType || currentData.businessType || "", businessDescription: world.description || currentData.businessDescription || "", services: world.services.length ? world.services : currentData.services || [], capabilities: world.services.length ? world.services : currentData.capabilities || [], contextualSignals: [...new Set([...(Array.isArray(currentData.contextualSignals) ? currentData.contextualSignals.filter((value): value is string => typeof value === "string") : []), ...world.signals, ...world.differentiators])].slice(0, 48), subjectKinds: world.subjectKinds.length ? world.subjectKinds : currentData.subjectKinds || [], websiteKnowledge: { sourceUrl: learned.url, sourceTitle: learned.title, businessName: world.businessName, businessType: world.businessType, description: world.description, services: world.services, differentiators: world.differentiators, signals: world.signals, subjectKinds: world.subjectKinds, importantFacts: world.importantFacts, learnedAt: new Date().toISOString() } }));
  await db.asset.update({ where: { id: input.assetId }, data: { templateData } }); return { row, factCount: 1, catalogIds: [], observationIds: [] };
}
async function persistPattern(assetId: string, catalogItemId: string, type: string, statement: string, evidenceId: string, confidence: number, strength: number): Promise<void> {
  const existing = await db.knowledgePattern.findFirst({ where: { assetId, catalogItemId, type }, orderBy: { updatedAt: "desc" } }); const now = new Date();
  if (existing) { const ids = Array.isArray(existing.evidenceIds) ? existing.evidenceIds.filter((value): value is string => typeof value === "string") : []; await db.knowledgePattern.update({ where: { id: existing.id }, data: { statement, confidence, strength, lastObservedAt: now, evidenceIds: [...new Set([...ids, evidenceId])].slice(-32) } }); }
  else await db.knowledgePattern.create({ data: { assetId, catalogItemId, type, statement, confidence, strength, evidenceIds: [evidenceId], firstObservedAt: now, lastObservedAt: now } });
}
async function maybeLearnTemporalPattern(assetId: string, catalogItemId: string, itemName: string, evidenceId: string, currentValue: unknown): Promise<void> {
  const previous = await db.knowledgeObservation.findFirst({ where: { assetId, catalogItemId, type: "VISUAL_OBSERVATION", evidenceId: { not: evidenceId } }, orderBy: { observedAt: "desc" }, select: { value: true, observedAt: true } });
  if (!previous) return; const before = locationSignature(storedLocation(previous.value)); const after = locationSignature(storedLocation(currentValue));
  if (!before || !after || before === after) return;
  await persistPattern(assetId, catalogItemId, "POSITION_CHANGE", `${itemName} changed position from ${before} to ${after}.`, evidenceId, 0.86, 0.78);
}
async function persistFacts(input: StoredPayload, evidenceId: string, facts: Fact[]) {
  const catalogIds: string[] = []; const observationIds: string[] = [];
  for (const fact of facts) {
    const normalizedName = normalizeName(fact.label || fact.value); if (!normalizedName) continue;
    const existing = await db.catalogItem.findFirst({ where: { assetId: input.assetId, normalizedName } });
    const item = existing ? await db.catalogItem.update({ where: { id: existing.id }, data: { category: fact.category || existing.category || undefined, description: existing.description || fact.notes || undefined } }) : await db.catalogItem.create({ data: { assetId: input.assetId, kind: fact.category || "item", name: fact.label || fact.value, normalizedName, category: fact.category || undefined, description: fact.notes || undefined } });
    catalogIds.push(item.id); await db.catalogAttribute.create({ data: { catalogItemId: item.id, key: "value", value: fact.value, unit: fact.unit || undefined, normalizedValue: normalizeName(fact.value), confidence: clampConfidence(fact.confidence), evidenceId } });
    const observation = await db.knowledgeObservation.create({ data: { assetId: input.assetId, catalogItemId: item.id, evidenceId, type: "OBSERVED", value: { label: fact.label, value: fact.value, category: fact.category, unit: fact.unit, notes: fact.notes }, source: input.sourceType, confidence: clampConfidence(fact.confidence), observedAt: new Date() } }); observationIds.push(observation.id);
    const repeated = await db.knowledgeObservation.count({ where: { assetId: input.assetId, catalogItemId: item.id } }); if (repeated >= 2) await persistPattern(input.assetId, item.id, "REPEATED_OBSERVATION", `${item.name} has been observed repeatedly (${repeated} observations).`, evidenceId, Math.min(0.99, 0.55 + Math.log10(repeated + 1) * 0.45), Math.min(0.99, repeated / (repeated + 2)));
  }
  return { catalogIds, observationIds, factCount: facts.length };
}
function visionMetadata(input: StoredPayload, item: CatalogVisionItem): Prisma.InputJsonObject {
  const location: Prisma.InputJsonValue = item.location ? { section: item.location.section ?? null, shelf: item.location.shelf ?? null, row: item.location.row ?? null, position: item.location.position ?? null, bbox: item.location.bbox ? [...item.location.bbox] : null } : null;
  const evidence: Prisma.InputJsonValue = (item.evidence || []).map((entry) => ({ kind: entry.kind, value: entry.value ?? null, confidence: entry.confidence, source: entry.source ?? null }));
  return { recognitionObservationId: item.observationId, recognitionState: item.state, productIdentity: [item.brand, item.product || item.name, item.variant].filter((value): value is string => Boolean(value)).map((value) => normalizeName(value)).filter(Boolean).join("|"), evidence, location };
}
async function persistVision(input: StoredPayload, evidenceId: string, items: CatalogVisionItem[]) {
  const catalogIds: string[] = []; const observationIds: string[] = [];
  for (const item of items) {
    const name = item.name.trim(); const normalizedName = normalizeName(name); if (!normalizedName) continue;
    const metadata = visionMetadata(input, item);
    const existing = await db.catalogItem.findFirst({ where: { assetId: input.assetId, normalizedName } });
    const catalogItem = existing ? await db.catalogItem.update({ where: { id: existing.id }, data: { brand: item.brand || existing.brand || undefined, category: item.category || existing.category || undefined, description: existing.description || item.notes || undefined, metadata } }) : await db.catalogItem.create({ data: { assetId: input.assetId, kind: item.category || "visual_item", name, normalizedName, brand: item.brand || undefined, category: item.category || undefined, description: item.notes || undefined, metadata } });
    catalogIds.push(catalogItem.id);
    const attributes = item.attributes?.length ? item.attributes : [{ key: "observed_name", value: name }];
    for (const attribute of attributes) await db.catalogAttribute.create({ data: { catalogItemId: catalogItem.id, key: attribute.key, value: attribute.value, normalizedValue: normalizeName(attribute.value), confidence: clampConfidence(item.confidence), evidenceId } });
    const observationValue: Prisma.InputJsonObject = { name, brand: item.brand ?? null, product: item.product ?? null, variant: item.variant ?? null, category: item.category ?? null, attributes, evidence: item.evidence || [], location: item.location ?? null, recognitionObservationId: item.observationId, recognitionState: item.state, notes: item.notes ?? null };
    const observation = await db.knowledgeObservation.create({ data: { assetId: input.assetId, catalogItemId: catalogItem.id, evidenceId, type: "VISUAL_OBSERVATION", value: observationValue, metadata, source: input.sourceType, confidence: clampConfidence(item.confidence), observedAt: new Date() } });
    observationIds.push(observation.id); await maybeLearnTemporalPattern(input.assetId, catalogItem.id, catalogItem.name, evidenceId, observationValue);
    const repeated = await db.knowledgeObservation.count({ where: { assetId: input.assetId, catalogItemId: catalogItem.id } }); if (repeated >= 2) await persistPattern(input.assetId, catalogItem.id, "REPEATED_OBSERVATION", `${catalogItem.name} has been observed repeatedly (${repeated} observations).`, evidenceId, Math.min(0.99, 0.55 + Math.log10(repeated + 1) * 0.45), Math.min(0.99, repeated / (repeated + 2)));
  }
  return { catalogIds, observationIds, factCount: items.length };
}
function compactPayload(input: StoredPayload): Prisma.InputJsonObject { return { mimeType: input.mimeType ?? null, text: input.text ?? null, userId: input.userId, storageKey: input.storageKey ?? null }; }
async function processIntake(jobId: string, originalInput: StoredPayload): Promise<void> {
  let evidenceId: string | undefined;
  try {
    await setStage(jobId, "evidence"); const raw = originalInput.imageDataUrl || originalInput.text || originalInput.content || ""; const contentHash = raw ? sha256(raw) : undefined;
    const media = await ensureMedia(originalInput, jobId, contentHash || jobId); const input = media.input; const binary = media.bytes; const mimeType = media.mimeType || input.mimeType;
    const evidence = await db.knowledgeEvidence.create({ data: { assetId: input.assetId, intakeJobId: jobId, type: mimeType || input.sourceType, source: input.sourceType, storageKey: input.storageKey || `intake-job:${jobId}`, contentHash: binary ? sha256Bytes(binary) : contentHash, text: binary && mimeType?.startsWith("text/") ? binary.toString("utf8").trim() || undefined : textFromInput(input), metadata: { originalName: input.originalName, mimeType: mimeType || null, userId: input.userId, storage: input.storageKey ? "knowledge_media" : "legacy_job_payload", byteLength: binary?.length ?? null }, confidence: 1 } }); evidenceId = evidence.id;
    let result: { catalogIds: string[]; observationIds: string[]; factCount: number };
    if (input.sourceType === "website") { await setStage(jobId, "website"); result = await learnWebsite(input, evidence.id); }
    else if ((mimeType || "").startsWith("image/")) { await setStage(jobId, "vision"); const imageDataUrl = binary ? mediaDataUrl(binary, mimeType || "image/jpeg") : input.imageDataUrl; if (!imageDataUrl) throw new Error("Image media is missing from intake storage."); result = await persistVision(input, evidence.id, await analyzeImageForCatalog(imageDataUrl, input.assetId)); await setStage(jobId, "persisting"); }
    else if (input.sourceType === "pdf") { await setStage(jobId, "extracting"); const bytes = binary || decodeDataUrl(input.content || "")?.bytes; if (!bytes) throw new Error("PDF upload is not available in durable storage."); const extracted = await extractPdfKnowledge(bytes); await db.knowledgeEvidence.update({ where: { id: evidence.id }, data: { text: extracted.text, metadata: { ...extracted.metadata, originalName: input.originalName, mimeType: mimeType || null } } }); await setStage(jobId, "persisting"); result = await persistFacts(input, evidence.id, extracted.facts); }
    else if (input.sourceType === "spreadsheet") { await setStage(jobId, "extracting"); const bytes = binary || decodeDataUrl(input.content || "")?.bytes; if (!bytes) throw new Error("Spreadsheet upload is not available in durable storage."); const extracted = extractSpreadsheetKnowledge(bytes, input.originalName); await db.knowledgeEvidence.update({ where: { id: evidence.id }, data: { text: extracted.text, metadata: { ...extracted.metadata, originalName: input.originalName, mimeType: mimeType || null } } }); await setStage(jobId, "persisting"); result = await persistFacts(input, evidence.id, extracted.facts); }
    else { await setStage(jobId, "extracting"); const text = textFromInput(input); await setStage(jobId, "persisting"); result = text ? await persistFacts(input, evidence.id, simpleFactsFromText(text)) : { catalogIds: [], observationIds: [], factCount: 0 }; }
    await db.knowledgeIntakeJob.update({ where: { id: jobId }, data: { status: "completed", payload: compactPayload(input), result: { stage: "complete", evidenceId: evidence.id, ...result }, error: null, completedAt: new Date() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Knowledge intake failed"; console.error("[KnowledgeIntake] failed", jobId, message, error);
    try { await db.knowledgeIntakeJob.update({ where: { id: jobId }, data: { status: "failed", result: { stage: "failed", evidenceId }, error: message, completedAt: new Date() } }); } catch (updateError) { console.error("[KnowledgeIntake] could not record failure", jobId, updateError); }
  }
}
async function requeueStaleJobs(): Promise<void> { const cutoff = new Date(Date.now() - STALE_PROCESSING_MS); await db.knowledgeIntakeJob.updateMany({ where: { status: "processing", startedAt: { lt: cutoff } }, data: { status: "queued", startedAt: null } }); }
async function claimQueuedJob() { const candidate = await db.knowledgeIntakeJob.findFirst({ where: { status: "queued" }, orderBy: { createdAt: "asc" } }); if (!candidate) return null; const claimed = await db.knowledgeIntakeJob.updateMany({ where: { id: candidate.id, status: "queued" }, data: { status: "processing", startedAt: new Date(), result: { stage: "evidence" }, error: null } }); if (claimed.count !== 1) return null; return db.knowledgeIntakeJob.findUnique({ where: { id: candidate.id }, select: { id: true, assetId: true, sourceType: true, originalName: true, payload: true } }); }
async function workerTick(): Promise<void> { if (workerBusy) return; workerBusy = true; try { await requeueStaleJobs(); const job = await claimQueuedJob(); if (job) await processIntake(job.id, parseStoredPayload(job)); } catch (error) { console.error("[KnowledgeIntake] worker tick failed", error); } finally { workerBusy = false; } }
export function startKnowledgeIntakeWorker(): void { if (workerStarted) return; workerStarted = true; console.log("[KnowledgeIntake] durable worker started"); const loop = async () => { await workerTick(); setTimeout(loop, WORKER_POLL_MS); }; void loop(); }
export async function enqueueKnowledgeIntake(input: IntakeInput) {
  const rawContent = input.imageDataUrl || input.text || input.content || ""; const contentHash = rawContent ? sha256(rawContent) : undefined;
  if (contentHash) { const existing = await db.knowledgeIntakeJob.findFirst({ where: { assetId: input.assetId, contentHash }, orderBy: { createdAt: "desc" } }); if (existing) return { job: existing, duplicate: true }; }
  let storageKey: string | undefined;
  if (input.imageDataUrl || input.content?.startsWith("data:")) { const dataUrl = input.imageDataUrl || input.content || ""; const decoded = decodeDataUrl(dataUrl); if (!decoded) throw new Error("Uploaded content is not a valid data URL."); const extension = decoded.mimeType === "application/pdf" ? "pdf" : decoded.mimeType.startsWith("image/") ? (decoded.mimeType.split("/", 2)[1] || "bin") : "bin"; storageKey = `intake/${input.assetId}/${contentHash || sha256Bytes(decoded.bytes)}.${extension}`; await writeKnowledgeMedia(storageKey, decoded.bytes); }
  const job = await db.knowledgeIntakeJob.create({ data: { assetId: input.assetId, status: "queued", sourceType: input.sourceType, originalName: input.originalName, contentHash, payload: compactPayload({ ...input, storageKey }) } });
  return { job, duplicate: false };
}
