import {
  buildExperienceAnalytics,
  buildExperienceContextArtifacts,
  buildMemoryWriteBatch,
  compileCognitiveExperience,
  memoryContextToCompilerMemories,
  getExperienceAnalytics,
} from "@qre/engine";
import type { MemoryContext } from "@qre/contracts";

import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";

export type CompiledExperienceResult = {
  title: string;
  blueprint: any;
  flowSteps: any[];
  moments: any[];
  cinematicScenes: any[];
  estimatedDuration: number;
  momentCount: number;
  cognition?: any;
  geoStory: any;
  memorySnapshot: any;
  analytics: any;
  memory?: { entities: number; facts: number; relations: number; events: number };
  [key: string]: unknown;
};

/** Compile a prompt against durable memory. Every response carries memory, geo, and analytics context. */
export async function compileExperience(input: {
  prompt: string;
  assetId?: string;
  userId?: string;
  memoryRepository?: MemoryRepository;
}): Promise<CompiledExperienceResult> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Experience prompt required");

  let memoryContext: MemoryContext | undefined;
  if (input.assetId && input.memoryRepository) {
    memoryContext = await input.memoryRepository.loadContext({
      assetId: input.assetId,
      userId: input.userId,
    });
  }

  const compiled = compileCognitiveExperience(prompt, {
    memories: memoryContext ? memoryContextToCompilerMemories(memoryContext) : [],
  });

  const artifacts = buildExperienceContextArtifacts(prompt, compiled, {
    assetId: input.assetId,
  });
  let analytics = buildExperienceAnalytics([], { assetId: input.assetId });
  let memoryCounts: CompiledExperienceResult["memory"];

  if (input.assetId && input.memoryRepository) {
    const batch = buildMemoryWriteBatch({
      assetId: input.assetId,
      userId: input.userId,
      prompt,
      plan: compiled.cognition.plan,
      source: "prompt",
    });
    await input.memoryRepository.writeBatch(batch);
    memoryCounts = {
      entities: batch.entities.length,
      facts: batch.facts.length,
      relations: batch.relations.length,
      events: batch.events.length,
    };

    const analyticsRepository = createAnalyticsRepository();
    await analyticsRepository.trackEvent({
      assetId: input.assetId,
      type: "EXPERIENCE_COMPILED",
      meta: { promptLength: prompt.length, direction: compiled.cognition.plan.direction },
    });
    await analyticsRepository.trackEvent({
      assetId: input.assetId,
      type: "GEO_STORY_BUILT",
      meta: { mode: artifacts.geoStory.mode, sceneCount: artifacts.geoStory.scenes.length },
    });
    await analyticsRepository.trackEvent({
      assetId: input.assetId,
      type: "MEMORY_SNAPSHOT_BUILT",
      meta: {
        memoryType: artifacts.memorySnapshot.type,
        highlightCount: artifacts.memorySnapshot.highlights.length,
      },
    });
    analytics = await getExperienceAnalytics(input.assetId, analyticsRepository);
  }

  return {
    ...compiled,
    ...artifacts,
    analytics,
    ...(memoryCounts ? { memory: memoryCounts } : {}),
  } as CompiledExperienceResult;
}
