/**
 * QRE COGNITIVE SYNTHESIS
 *
 * Thin compatibility boundary between cognition and the compiler.
 *
 * Cognition owns interpretation. This module does not invent additional
 * cognitive personalities, arcs, fields, or hidden narrative rules.
 */

import { buildSemanticIR } from "./semantic/index.js";
import type {
  CompilerMind,
  ExperienceCompilerIntelligence,
} from "@qre/contracts";

export type CognitiveSynthesisOutput = Pick<
  ExperienceCompilerIntelligence,
  "understanding" | "meaningContext" | "meaning" | "genome" | "semanticIR"
>;

export function synthesizeCognitiveExperience(
  mind: CompilerMind,
): CognitiveSynthesisOutput {
  const semanticIR = mind.semanticIR ?? buildSemanticIR(mind);

  return {
    understanding: mind.understanding,
    meaningContext: mind.meaningContext,
    meaning: mind.genome.meaning,
    genome: mind.genome,
    semanticIR,
  };
}
