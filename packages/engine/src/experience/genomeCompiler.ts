/** Compatibility entrypoint. Super Cog is the canonical compiler. */

import { compileSuperCogExperience } from "./superCogContext.js";
import type { CognitiveCompileContext, CompiledCognitiveExperience } from "@qre/contracts";

export type { CompiledCognitiveExperience as CompiledGenomeExperience } from "@qre/contracts";

export function compileExperienceGenome(prompt: string, context: CognitiveCompileContext = {}): CompiledCognitiveExperience {
  return compileSuperCogExperience(prompt, context);
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
