import type { MemoryRepository } from "../repositories/memoryRepository.js";
import type { AnalyticsRepository } from "@qre/engine";
import type { MemorySource, MemoryWriteBatch } from "@qre/contracts";
import type { WorldModel } from "@qre/engine";
import { buildExperienceMemoryBatch } from "./memoryProjection.js";

export type AuthorLearningRecord = {
  assetId: string;
  userId?: string;
  sessionId?: string;
  prompt: string;
  source?: MemorySource;
  observedAt?: string;
  world: WorldModel;
};

export type AuthorLearningResult = {
  memory: {
    entities: number;
    facts: number;
    relations: number;
    events: number;
  };
  analyticsType: "AUTHOR_INPUT_ACCEPTED";
  observedAt: string;
};

export type ExplicitAuthorEvidence = {
  assetId: string;
  userId?: string;
  sessionId?: string;
  text: string;
  predicate?: string;
  value?: string;
  sourceRef?: string;
  observedAt?: string;
  metadata?: Record<string, unknown>;
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

function explicitEvidenceBatch(input: ExplicitAuthorEvidence): MemoryWriteBatch {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const text = clean(input.text);
  const predicate = clean(input.predicate) || "knowledge";
  const value = clean(input.value) || text;

  return {
    assetId: input.assetId,
    userId: input.userId,
    entities: [],
    facts: [
      {
        kind: "attribute",
        predicate,
        value,
        confidence: 1,
        source: "user",
        sourceRef: input.sourceRef,
        status: "active",
        observedAt,
        visibility: "private",
        metadata: input.metadata,
      },
    ],
    relations: [],
    events: [
      {
        type: "explicit_evidence_added",
        summary: text,
        occurredAt: observedAt,
        source: "user",
        confidence: 1,
        entityIds: [],
        sessionId: input.sessionId,
        metadata: input.metadata,
      },
    ],
  };
}

export function buildAuthorLearningRecord(input: AuthorLearningRecord) {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const batch = buildExperienceMemoryBatch({
    assetId: input.assetId,
    userId: input.userId,
    sessionId: input.sessionId,
    source: input.source ?? "prompt",
    observedAt,
    world: input.world,
  });

  return {
    observedAt,
    prompt: clean(input.prompt).slice(0, 4000),
    batch,
    analytics: {
      type: "AUTHOR_INPUT_ACCEPTED" as const,
      meta: {
        sessionId: input.sessionId ?? null,
        source: input.source ?? "prompt",
        observedAt,
        memory: {
          entities: batch.entities.length,
          facts: batch.facts.length,
          relations: batch.relations.length,
          events: batch.events.length,
        },
      },
    },
  };
}

export async function persistAuthorLearning(
  input: AuthorLearningRecord,
  deps: { memoryRepository: MemoryRepository; analyticsRepository: AnalyticsRepository },
): Promise<AuthorLearningResult> {
  const record = buildAuthorLearningRecord(input);

  await deps.memoryRepository.writeBatch(record.batch);
  await deps.analyticsRepository.trackEvent({
    assetId: input.assetId,
    sessionId: input.sessionId,
    type: record.analytics.type,
    meta: {
      ...record.analytics.meta,
      prompt: record.prompt,
    },
  });

  return {
    memory: record.analytics.meta.memory,
    analyticsType: record.analytics.type,
    observedAt: record.observedAt,
  };
}

export async function persistExplicitAuthorEvidence(
  input: ExplicitAuthorEvidence,
  deps: { memoryRepository: MemoryRepository; analyticsRepository: AnalyticsRepository },
): Promise<AuthorLearningResult> {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const batch = explicitEvidenceBatch(input);

  await deps.memoryRepository.writeBatch(batch);
  await deps.analyticsRepository.trackEvent({
    assetId: input.assetId,
    sessionId: input.sessionId,
    type: "AUTHOR_INPUT_ACCEPTED",
    meta: {
      source: "explicit_evidence",
      observedAt,
      text: clean(input.text).slice(0, 4000),
      predicate: clean(input.predicate) || "knowledge",
      sourceRef: input.sourceRef ?? null,
      memory: {
        entities: 0,
        facts: batch.facts.length,
        relations: 0,
        events: batch.events.length,
      },
    },
  });

  return {
    memory: {
      entities: 0,
      facts: batch.facts.length,
      relations: 0,
      events: batch.events.length,
    },
    analyticsType: "AUTHOR_INPUT_ACCEPTED",
    observedAt,
  };
}
