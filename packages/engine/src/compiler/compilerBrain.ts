/**
 * =====================================================
 * QRE COMPILER BRAIN
 * =====================================================
 *
 * Public orchestration boundary for the canonical compiler.
 *
 * The Brain validates the prompt and delegates creation to coreCompiler.
 * It does not contain a second compiler pipeline.
 * =====================================================
 */

import {
  compileExperience,
} from "./coreCompiler.js";

import type {
  CompilerBrainResult,
} from "@qre/contracts";

export type {
  CompilerBrainResult,
} from "@qre/contracts";

export function runCompilerBrain(
  prompt: string,
): CompilerBrainResult {
  if (!prompt.trim()) {
    throw new Error("Compiler brain requires a creative prompt");
  }

  const compiled = compileExperience(prompt);

  return {
    compiled,
    intelligence: compiled.intelligence,
  };
}
