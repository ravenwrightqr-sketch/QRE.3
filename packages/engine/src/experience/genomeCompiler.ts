import type { ExperienceWorld } from "@qre/contracts";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type StoryCompilerContext,
} from "./universalStoryCompiler.js";

/**
 * Compatibility boundary for callers that still request a `world` field.
 *
 * The universal story compiler is the creative authority.
 * `world` is now a neutral projection and never decides what a prompt means.
 */
export type CompiledGenomeExperience = CompiledStoryExperience & { world: ExperienceWorld };

function compatibilityWorld(result: CompiledStoryExperience): ExperienceWorld {
  const { observation, story } = result;

  return {
    domain: "experience_world",
    archetype: "adaptive_story",
    atmosphere: story.tone,
    journey: story.beats.map((beat) => beat.kind),
    atoms: [...new Set([
      observation.subject,
      observation.activity,
      ...observation.affordances,
    ])],
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
