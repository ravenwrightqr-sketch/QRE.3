import { compileCognitiveExperience } from "@qre/engine";
import type { MemoryContext } from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import {
  buildExperienceMemoryBatch,
  memoryContextToCognitiveSummary,
} from "./memoryProjection.js";

export type CompiledExperienceResult = {
  title: string;
  blueprint: any;
  flowSteps: any[];
  moments: any[];
  cinematicScenes: any[];
  estimatedDuration: number;
  momentCount: number;
  plan: unknown;
  world?: unknown;
  adaptiveQuestions?: string[];
  discoveries?: string[];
  learningSignals?: string[];
  cognition?: unknown;
  memory?: { entities: number; facts: number; relations: number; events: number };
  [key: string]: unknown;
};

/**
 * Production authoring boundary.
 *
 * HUMAN LANGUAGE
 *   ↓
 * UNIVERSAL MIND
 *   ↓
 * WORLD MODEL / EXPERIENCE BLUEPRINT
 *   ↓
 * API MEMORY PROJECTION
 *   ↓
 * MEMORY REPOSITORY
 *
 * Cognition remains database-agnostic. Persistence projection belongs at the
 * application boundary, where the repository is available.
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

  const memorySummary = memoryContext
    ? memoryContextToCognitiveSummary(memoryContext)
    : [];

  const compiled = compileCognitiveExperience(prompt, { memorySummary });

  if (input.assetId && input.memoryRepository) {
    const batch = buildExperienceMemoryBatch({
      assetId: input.assetId,
      userId: input.userId,
      world: compiled.world,
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
    };
  }

  return compiled;
}
