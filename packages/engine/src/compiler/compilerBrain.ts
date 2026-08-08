/**
 * QRE COMPILER BRAIN
 *
 * Compatibility orchestration boundary for the canonical compiler.
 * The brain contains no second compiler pipeline; it delegates directly to
 * the Cognition V2 compiler entrypoint.
 */

import { compileExperience } from "./coreCompilerV2.js";

import type { CompilerBrainResult } from "@qre/contracts";

export type { CompilerBrainResult } from "@qre/contracts";

export function runCompilerBrain(prompt: string): CompilerBrainResult {
  if (!prompt.trim()) {
    throw new Error("Compiler brain requires a creative prompt");
  }

  const compiled = compileExperience(prompt.trim());

  return {
    compiled,
    intelligence: compiled.intelligence,
  };
}
