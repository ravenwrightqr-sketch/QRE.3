import type { ExperienceWorld } from "@qre/contracts";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type StoryCompilerContext,
} from "./universalStoryCompiler.js";

/**
 * Compatibility boundary for legacy callers.
 *
 * This file does not create meaning. The universal story compiler is the
 * creative authority; this adapter only exposes the legacy `world` shape.
 */
export type CompiledGenomeExperience = CompiledStoryExperience & { world: ExperienceWorld };

function compatibilityWorld(result: CompiledStoryExperience): ExperienceWorld {
  const { observation, story } = result;
  const domain: ExperienceWorld["domain"] = observation.context.includes("memory")
    ? "memory_world"
    : observation.audience.includes("shared")
      ? "community_world"
      : observation.activity === "commerce"
        ? "commerce_world"
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

export function compileExperienceGenome(
  prompt: string,
  context: StoryCompilerContext = {},
): CompiledGenomeExperience {
  const result = compileStoryExperience(prompt, context);
  return { ...result, world: compatibilityWorld(result) };
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
