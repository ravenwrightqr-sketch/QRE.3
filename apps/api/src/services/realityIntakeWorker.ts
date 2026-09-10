import { db } from "@qre/db";
import { analyzeImageForReality, type RealityEntity, type RealityGraph, type RealityRelation } from "./realityEngine.js";
import { decodeDataUrl } from "./documentKnowledge.js";
import { mediaDataUrl, readKnowledgeMedia } from "./knowledgeMedia.js";

const MAX_REALITY_ATTEMPTS = 3;
let started = false;
let busy = false;
const pendingJobIds = new Set<string>();

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s._-]/gu, "");
}

function fingerprint(entity: RealityEntity): string {
  const identity = normalize(entity.name || entity.label || entity.textEvidence?.[0] || entity.kind || "object");
  return `${normalize(entity.kind)}:${identity}`;
}

async function storedImage(job: { payload: unknown }): Promise<string | undefined> {
  if (!job.payload || typeof job.payload !== "object" || Array.isArray(job.payload)) return undefined;
  const payload = job.payload as Record<string, unknown>;
  if (typeof payload.imageDataUrl === "string" && payload.imageDataUrl.startsWith("data:image/")) return payload.imageDataUrl;
  if (typeof payload.storageKey !== "string" || !payload.storageKey) return undefined;
  const bytes = await readKnowledgeMedia(payload.storageKey);
  const mimeType = typeof payload.mimeType === "string" && payload.mimeType.startsWith("image/") ? payload.mimeType : "image/jpeg";
  return mediaDataUrl(bytes, mimeType);
}

function resultRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function recentSceneObservations(assetId: string, limit = 12, excludeEvidenceId?: string) {
  return db.knowledgeObservation.findMany({
    where: {
      assetId,
      type: "REALITY_SCENE",
      ...(excludeEvidenceId ? { evidenceId: { not: excludeEvidenceId } } : {}),
    },
    orderBy: { observedAt: "desc" },
    take: limit,
    select: { id: true, value: true, evidenceId: true, observedAt: true },
  });
}

function entityMap(graph: RealityGraph): Map<string, RealityEntity> {
  const map = new Map<string, RealityEntity>();
  for (const entity of graph.entities) map.set(fingerprint(entity), entity);
  return map;
}

function entityCounts(graph: RealityGraph): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entity of graph.entities) {
    const key = fingerprint(entity);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function graphFromObservation(value: unknown): RealityGraph | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== 1 || !record.entities) return null;
  return record as unknown as RealityGraph;
}

function relationKey(relation: RealityRelation, graph: RealityGraph): string {
  const subject = graph.entities.find((entity) => entity.id === relation.subjectId);
  const object = graph.entities.find((entity) => entity.id === relation.objectId);
  return `${fingerprint(subject ?? { kind: "object", id: relation.subjectId, visibility: "ambiguous", state: "unknown", confidence: 0.2 })}|${relation.predicate}|${fingerprint(object ?? { kind: "object", id: relation.objectId, visibility: "ambiguous", state: "unknown", confidence: 0.2 })}`;
}

async function upsertPattern(args: {
  assetId: string;
  catalogItemId?: string;
  type: string;
  statement: string;
  confidence: number;
  strength: number;
  evidenceIds: string[];
  firstObservedAt?: Date;
  lastObservedAt?: Date;
  metadata?: Record<string, unknown>;
}) {
  const existing = await db.knowledgePattern.findFirst({
    where: { assetId: args.assetId, catalogItemId: args.catalogItemId, type: args.type },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    const previousEvidenceIds = Array.isArray(existing.evidenceIds) ? existing.evidenceIds.filter((value): value is string => typeof value === "string") : [];
    const evidenceIds = [...new Set([...previousEvidenceIds, ...args.evidenceIds])].slice(-64);
    const metadata = args.metadata ?? resultRecord(existing.metadata);
    await db.knowledgePattern.update({
      where: { id: existing.id },
      data: {
        statement: args.statement,
        confidence: args.confidence,
        strength: args.strength,
        evidenceIds,
        firstObservedAt: existing.firstObservedAt ?? args.firstObservedAt,
        lastObservedAt: args.lastObservedAt ?? new Date(),
        metadata: metadata as object,
        status: "active",
      },
    });
    return existing.id;
  }

  const created = await db.knowledgePattern.create({
    data: {
      assetId: args.assetId,
      catalogItemId: args.catalogItemId,
      type: args.type,
      statement: args.statement,
      confidence: args.confidence,
      strength: args.strength,
      evidenceIds: args.evidenceIds,
      firstObservedAt: args.firstObservedAt ?? new Date(),
      lastObservedAt: args.lastObservedAt ?? new Date(),
      metadata: args.metadata as object | undefined,
      status: "active",
    },
  });
  return created.id;
}

async function learnPatterns(assetId: string, current: RealityGraph, evidenceId: string, observedAt: Date) {
  const history = await recentSceneObservations(assetId, 12, evidenceId);
  const priorGraphs = history.map((row) => graphFromObservation(row.value)).filter((value): value is RealityGraph => Boolean(value));
  const previous = priorGraphs[0];

  const currentEntities = entityMap(current);
  const previousEntities = previous ? entityMap(previous) : new Map<string, RealityEntity>();
  const currentKeys = new Set(currentEntities.keys());
  const previousKeys = new Set(previousEntities.keys());

  for (const key of currentKeys) {
    const sightings = priorGraphs.reduce((count, graph) => count + (entityMap(graph).has(key) ? 1 : 0), 0);
    if (sightings >= 1) {
      const total = sightings + 1;
      const entity = currentEntities.get(key)!;
      await upsertPattern({
        assetId,
        type: "REALITY_ENTITY_RECURRING",
        statement: `${entity.name || entity.label || entity.kind} has appeared in ${total} observed scene states.`,
        confidence: Math.min(0.99, 0.55 + sightings * 0.08),
        strength: Math.min(0.99, total / (total + 2)),
        evidenceIds: [evidenceId],
        firstObservedAt: observedAt,
        lastObservedAt: observedAt,
        metadata: { fingerprint: key, kind: entity.kind, visibility: entity.visibility, sampleSize: total },
      });
    }
  }

  if (previous) {
    const disappeared = [...previousKeys].filter((key) => !currentKeys.has(key));
    const appeared = [...currentKeys].filter((key) => !previousKeys.has(key));

    for (const key of disappeared) {
      const entity = previousEntities.get(key)!;
      await upsertPattern({
        assetId,
        type: "REALITY_NOT_OBSERVED",
        statement: `${entity.name || entity.label || entity.kind} was observed previously but is not visible in the latest scene.`,
        confidence: 0.72,
        strength: 0.58,
        evidenceIds: [evidenceId],
        lastObservedAt: observedAt,
        metadata: { fingerprint: key, interpretation: "not_observed", alternatives: ["moved", "sold", "stored", "occluded", "outside_frame"] },
      });
    }

    for (const key of appeared) {
      const entity = currentEntities.get(key)!;
      await upsertPattern({
        assetId,
        type: "REALITY_REAPPEARED_OR_NEW",
        statement: `${entity.name || entity.label || entity.kind} appears in the latest scene and was not visible in the immediately previous scene.`,
        confidence: 0.68,
        strength: 0.54,
        evidenceIds: [evidenceId],
        lastObservedAt: observedAt,
        metadata: { fingerprint: key, interpretation: "appeared_or_returned" },
      });
    }

    const shared = [...currentKeys].filter((key) => previousKeys.has(key));
    for (const key of shared) {
      const before = previousEntities.get(key);
      const after = currentEntities.get(key);
      if (!before || !after) continue;
      if (before.regionId && after.regionId && before.regionId !== after.regionId) {
        await upsertPattern({
          assetId,
          type: "REALITY_POSSIBLE_MOVEMENT",
          statement: `${after.name || after.label || after.kind} changed visible region between observations.`,
          confidence: 0.81,
          strength: 0.65,
          evidenceIds: [evidenceId],
          lastObservedAt: observedAt,
          metadata: { fingerprint: key, fromRegion: before.regionId, toRegion: after.regionId, interpretation: "movement_candidate" },
        });
      }
    }
  }

  if (priorGraphs.length >= 3) {
    const allKeys = new Set<string>();
    for (const graph of [current, ...priorGraphs]) for (const key of entityMap(graph).keys()) allKeys.add(key);

    for (const key of allKeys) {
      const presenceCount = priorGraphs.reduce((count, graph) => count + (entityMap(graph).has(key) ? 1 : 0), 0) + (currentEntities.has(key) ? 1 : 0);
      const sampleSize = priorGraphs.length + 1;
      const presenceRate = presenceCount / sampleSize;
      const counts = [current, ...priorGraphs].map((graph) => entityCounts(graph).get(key) ?? 0);
      const nonZero = counts.filter((count) => count > 0);
      if (!nonZero.length) continue;

      if (presenceRate >= 0.7) {
        const entity = currentEntities.get(key) ?? previousEntities.get(key);
        const label = entity?.name || entity?.label || entity?.kind || key;
        await upsertPattern({
          assetId,
          type: "REALITY_EXPECTED_PRESENCE",
          statement: `${label} is usually visible in comparable observations (${Math.round(presenceRate * 100)}% of ${sampleSize}).`,
          confidence: Math.min(0.98, presenceRate * 0.95),
          strength: Math.min(0.98, sampleSize / (sampleSize + 2)),
          evidenceIds: [evidenceId],
          lastObservedAt: observedAt,
          metadata: {
            fingerprint: key,
            sampleSize,
            presenceCount,
            presenceRate,
            prediction: { type: "next_observation_presence", probability: presenceRate },
          },
        });
      }

      if (nonZero.length >= 3) {
        const min = Math.min(...nonZero);
        const max = Math.max(...nonZero);
        const latest = counts[0];
        const previousCount = counts[1];
        if (max > min && latest !== previousCount) {
          const direction = latest > previousCount ? "increased" : "decreased";
          const entity = currentEntities.get(key) ?? previousEntities.get(key);
          const label = entity?.name || entity?.label || entity?.kind || key;
          await upsertPattern({
            assetId,
            type: "REALITY_COUNT_TREND",
            statement: `${label} count ${direction} from ${previousCount} to ${latest}; observed range is ${min}-${max}.`,
            confidence: Math.min(0.95, 0.55 + nonZero.length * 0.06),
            strength: Math.min(0.95, sampleSize / (sampleSize + 3)),
            evidenceIds: [evidenceId],
            lastObservedAt: observedAt,
            metadata: { fingerprint: key, counts, direction, min, max, latest, previousCount, sampleSize },
          });
        }
      }
    }
  }

  const relationCounts = new Map<string, number>();
  for (const graph of [current, ...priorGraphs]) {
    for (const relation of graph.relations) {
      const key = relationKey(relation, graph);
      relationCounts.set(key, (relationCounts.get(key) ?? 0) + 1);
    }
  }

  for (const [key, count] of relationCounts) {
    if (count < 2) continue;
    const parts = key.split("|");
    const confidence = Math.min(0.96, 0.56 + count * 0.07);
    await upsertPattern({
      assetId,
      type: "REALITY_SPATIAL_ASSOCIATION",
      statement: `${parts[0]} is repeatedly ${parts[1]} ${parts[2]}.`,
      confidence,
      strength: Math.min(0.98, count / (count + 2)),
      evidenceIds: [evidenceId],
      lastObservedAt: observedAt,
      metadata: { relationKey: key, occurrences: count },
    });
  }
}

async function processJob(job: { id: string; assetId: string; payload: unknown }) {
  const imageDataUrl = await storedImage(job);
  if (!imageDataUrl) return;

  const raw = decodeDataUrl(imageDataUrl);
  if (!raw) throw new Error("Reality worker could not decode the stored image payload.");

  const graph = await analyzeImageForReality(imageDataUrl);
  const observedAt = new Date();
  const evidence = await db.knowledgeEvidence.findFirst({
    where: { intakeJobId: job.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!evidence) throw new Error("Reality worker could not find durable evidence for the image.");

  const existingScene = await db.knowledgeObservation.findFirst({ where: { assetId: job.assetId, evidenceId: evidence.id, type: "REALITY_SCENE" } });
  if (!existingScene) {
    await db.knowledgeObservation.create({
      data: {
        assetId: job.assetId,
        evidenceId: evidence.id,
        type: "REALITY_SCENE",
        value: graph,
        source: "reality-engine-v1",
        confidence: graph.scene.confidence,
        observedAt,
        metadata: {
          schemaVersion: graph.schemaVersion,
          entityCount: graph.entities.length,
          regionCount: graph.regions.length,
          relationCount: graph.relations.length,
          textCount: graph.text.length,
          unknownCount: graph.unknowns.length,
        },
      },
    });

    for (const entity of graph.entities.slice(0, 250)) {
      await db.knowledgeObservation.create({
        data: {
          assetId: job.assetId,
          evidenceId: evidence.id,
          type: "REALITY_ENTITY",
          value: {
            fingerprint: fingerprint(entity),
            entity,
          },
          source: "reality-engine-v1",
          confidence: entity.confidence,
          observedAt,
          metadata: {
            fingerprint: fingerprint(entity),
            visibility: entity.visibility,
            state: entity.state,
            regionId: entity.regionId,
          },
        },
      });
    }
  }

  await learnPatterns(job.assetId, graph, evidence.id, observedAt);

  const existingJob = await db.knowledgeIntakeJob.findUnique({ where: { id: job.id }, select: { result: true } });
  const result = resultRecord(existingJob?.result);
  await db.knowledgeIntakeJob.update({
    where: { id: job.id },
    data: {
      status: "completed",
      error: null,
      result: {
        ...result,
        stage: "complete",
        realityEngineVersion: "1",
        reality: {
          evidenceId: evidence.id,
          entityCount: graph.entities.length,
          regionCount: graph.regions.length,
          relationCount: graph.relations.length,
          textCount: graph.text.length,
          unknownCount: graph.unknowns.length,
        },
      },
      completedAt: new Date(),
    },
  });
}

async function runJob(jobId: string): Promise<void> {
  if (busy) {
    pendingJobIds.add(jobId);
    return;
  }
  busy = true;
  try {
    const job = await db.knowledgeIntakeJob.findUnique({
      where: { id: jobId },
      select: { id: true, assetId: true, status: true, payload: true, result: true },
    });
    if (!job || !["failed", "completed"].includes(job.status)) return;
    const result = resultRecord(job.result);
    if (result.realityEngineVersion === "1") return;
    if (!(await storedImage(job))) return;

    const attempts = typeof result.realityAttempts === "number" ? result.realityAttempts : 0;
    if (attempts >= MAX_REALITY_ATTEMPTS) return;

    try {
      await processJob(job);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reality learning failed";
      const nextAttempts = attempts + 1;
      console.error("[QRE][RealityWorker] failed", job.id, `attempt=${nextAttempts}`, message, error);
      await db.knowledgeIntakeJob.update({
        where: { id: job.id },
        data: {
          result: {
            ...result,
            realityAttempts: nextAttempts,
            realityStage: nextAttempts >= MAX_REALITY_ATTEMPTS ? "failed" : "retryable",
            ...(nextAttempts >= MAX_REALITY_ATTEMPTS ? { realityEngineVersion: "1" } : {}),
          },
          error: `Reality engine: ${message}`,
        },
      });
    }
  } finally {
    busy = false;
    const nextJobId = pendingJobIds.values().next().value as string | undefined;
    if (nextJobId) {
      pendingJobIds.delete(nextJobId);
      void runJob(nextJobId);
    }
  }
}

export function triggerRealityIntake(jobId: string): void {
  pendingJobIds.add(jobId);
  if (!started) return;
  const nextJobId = pendingJobIds.values().next().value as string | undefined;
  if (!nextJobId || busy) return;
  pendingJobIds.delete(nextJobId);
  void runJob(nextJobId);
}

async function recoverPendingRealityJobs(): Promise<void> {
  try {
    const jobs = await db.knowledgeIntakeJob.findMany({
      where: { sourceType: "photo", status: { in: ["failed", "completed"] } },
      orderBy: { createdAt: "asc" },
      take: 25,
      select: { id: true, result: true },
    });
    for (const job of jobs) {
      const result = resultRecord(job.result);
      if (result.realityEngineVersion !== "1") pendingJobIds.add(job.id);
    }
    const nextJobId = pendingJobIds.values().next().value as string | undefined;
    if (nextJobId && !busy) {
      pendingJobIds.delete(nextJobId);
      void runJob(nextJobId);
    }
  } catch (error) {
    console.error("[QRE][RealityWorker] recovery sweep failed", error);
  }
}

export function startRealityIntakeWorker(): void {
  if (started) return;
  started = true;
  console.log("[QRE][RealityWorker] started (event-driven)");
  void recoverPendingRealityJobs();
}
