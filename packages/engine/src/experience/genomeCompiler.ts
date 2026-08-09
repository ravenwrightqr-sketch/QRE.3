/**
 * =============================================================
 * QRE EXPERIENCE COMPILER — COGNITIVE ENTRYPOINT
 * =============================================================
 *
 * The universal experience compiler now delegates semantic decisions
 * to Super Cog. This file remains as the compatibility entrypoint for
 * existing callers of compileExperienceGenome.
 *
 * Canonical pipeline:
 *
 * Prompt
 *   ↓
 * Super Cog
 *   ↓
 * Understanding / Evidence / Hypotheses / Plan
 *   ↓
 * Genome / World / Blueprint
 *   ↓
 * Flow / Moments / Cinematic Scenes
 *
 * There is no template selector in this path.
 *
 * =============================================================
 */

import {
  compileCognitiveExperience,
} from "./cognitiveExperienceCompiler.js";

import type {
  CompiledCognitiveExperience,
} from "@qre/contracts";

export type CompiledGenomeExperience = CompiledCognitiveExperience;

export function compileExperienceGenome(
  prompt: string,
): CompiledGenomeExperience {
  return compileCognitiveExperience(prompt);
}

export const genomeCompiler = compileExperienceGenome;
export const experienceCompiler = compileExperienceGenome;
