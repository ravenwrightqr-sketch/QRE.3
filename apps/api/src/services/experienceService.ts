import {
  buildMemoryWriteBatch,
  compileCognitiveExperience,
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
 * Compile a prompt against durable memory when an asset is supplied.
 *
 * Memory is loaded before cognition and written only after a successful
 * compilation. This keeps the compiler pure while giving the product a
 * persistent learning loop.
 */
export async function compileExperience(input: {
  prompt: string;
  assetId?: string;
  userId?: string;
  memoryRepository?: MemoryRepository;
}): Promise<CompiledExperienceResult> {
  const prompt = input.prompt.trim();

  if (!prompt) {
    throw new Error("Experience prompt required");
  }

  let memoryContext: MemoryContext | undefined;
  if (input.assetId && input.memoryRepository) {
    memoryContext = await input.memoryRepository.loadContext({
      assetId: input.assetId,
      userId: input.userId,
    });
  }

  const compiled = compileCognitiveExperience(prompt, {
    memories: memoryContext
      ? memoryContextToCompilerMemories(memoryContext)
      : [],
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

  return compiled as CompiledExperienceResult;
}
