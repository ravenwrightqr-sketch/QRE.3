/** Compatibility entrypoint. Super Cog is the canonical compiler. */

import { compileSuperCogExperience } from "./superCogCanonical.js";
import type { CompiledCognitiveExperience } from "@qre/contracts";

export type { CompiledCognitiveExperience as CompiledGenomeExperience } from "@qre/contracts";

export function compileExperienceGenome(prompt: string): CompiledCognitiveExperience {
  return compileSuperCogExperience(prompt);
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
