/** Compatibility entrypoint. Super Cog is the canonical compiler. */

import { compileSuperCogExperience } from "./superCogCanonical.js";
import type { CompiledCognitiveExperience } from "@qre/contracts";

export type CompiledGenomeExperience = CompiledCognitiveExperience;

export function compileExperienceGenome(prompt: string): CompiledGenomeExperience {
  return compileSuperCogExperience(prompt);
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
