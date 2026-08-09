/**
 * Compatibility entrypoint for the universal experience compiler.
 * Super Cog owns semantic decisions; this alias preserves existing API names.
 */

import { compileSuperCogExperience } from "./superCog.js";
import type { CompiledCognitiveExperience } from "@qre/contracts";

export type CompiledGenomeExperience = CompiledCognitiveExperience;

export function compileExperienceGenome(prompt: string): CompiledGenomeExperience {
  return compileSuperCogExperience(prompt);
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
