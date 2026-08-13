import {
  buildMemoryWriteBatch,
  compileExperienceV7,
  memoryContextToCompilerMemories,
} from "@qre/engine";
import type { MemoryContext } from "@qre/contracts";

import type { MemoryRepository } from "../repositories/memoryRepository.js";

export type CompiledExperienceResult = {
  title: string;
  blueprint: any;
  flowSteps: any[];
  moments: any[];
  cinematicScenes: any[];
  estimatedDuration: number;
  momentCount: number;
  cognition?: unknown;
  memory?: {
    entities: number;
    facts: number;
    relations: number;
    events: number;
  };
  [key: string]: unknown;
};

/**
 * Production authoring boundary.
 *
 * HUMAN LANGUAGE
 *   ↓
 * V7 INTENT
 *   ↓
 * COGNITION
 *   ↓
 * EXPERIENCE BLUEPRINT
 *   ↓
 * LATENT MOVIE / CREATIVE REALIZATION
 *   ↓
 * FLOW
 *
 * The old StoryCompiler is no longer on the production experience-creation
 * path. Durable memory is still loaded before cognition and written only after
 * successful compilation.
 */
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

  const compilerMemories = memoryContext
    ? memoryContextToCompilerMemories(memoryContext)
    : [];

  const compiled = compileExperienceV7(prompt, {
    memorySummary: compilerMemories.map((memory) => memory.summary),
  });

  if (input.assetId && input.memoryRepository) {
    const batch = buildMemoryWriteBatch({
      assetId: input.assetId,
      userId: input.userId,
      prompt,
      plan: compiled.cognition.plan,
      source: "prompt",
    });

    await input.memoryRepository.writeBatch(batch);

    return {
      ...compiled,
      memory: {
        entities: batch.entities.length,
        facts: batch.facts.length,
        relations: batch.relations.length,
        events: batch.events.length,
      },
    } as CompiledExperienceResult;
  }

  return compiled as unknown as CompiledExperienceResult;
}
