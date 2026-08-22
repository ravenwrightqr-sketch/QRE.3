import type { MemoryRepository } from "../repositories/memoryRepository.js";
import type { AnalyticsRepository } from "@qre/engine";
import type { MemorySource } from "@qre/contracts";
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

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

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
