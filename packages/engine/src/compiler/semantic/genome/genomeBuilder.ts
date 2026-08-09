/**
 * Compatibility facade for the retired semantic genome builder.
 *
 * Super Cog now owns semantic decisions and produces the canonical genome.
 */

import {
  compileCognitiveExperience,
} from "../../../experience/cognitiveExperienceCompiler.js";

import type {
  ExperienceGenome,
} from "@qre/contracts";

export function buildExperienceGenome(
  prompt: string,
): ExperienceGenome {
  return compileCognitiveExperience(prompt).genome;
}

export const genomeBuilder = buildExperienceGenome;
