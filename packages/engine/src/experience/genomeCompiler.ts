/**
 * QRE EXPERIENCE COMPILER — compatibility boundary.
 *
 * The old genome/world/blueprint chain is intentionally no longer the
 * creative authority. Story generation lives in storyCompiler.ts.
 *
 * Prompt → observation → affordances → narrative candidates → beats → story
 * → runtime projection.
 */

import type {
  ExperienceWorld,
} from "@qre/contracts";

import {
  compileStoryExperience,
  type CompiledStoryExperience,
} from "./storyCompiler.js";

export type CompiledGenomeExperience = CompiledStoryExperience & {
  world: ExperienceWorld;
};

function compatibilityWorld(result: CompiledStoryExperience): ExperienceWorld {
  const { observation, story } = result;

  const domain = observation.context.includes("memory")
    ? "memory_world"
    : observation.context.includes("event")
      ? "community_world"
      : observation.context.includes("work")
        ? "identity_world"
        : "discovery_world";

  return {
    domain,
    archetype: "evidence_driven_story",
    atmosphere: story.tone,
    journey: story.beats.map((beat) => beat.kind),
    atoms: [...new Set([observation.subject, observation.activity, ...observation.affordances])],
    themes: observation.context,
  };
}

export function compileExperienceGenome(prompt: string): CompiledGenomeExperience {
  const result = compileStoryExperience(prompt);
  return {
    ...result,
    world: compatibilityWorld(result),
  };
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
