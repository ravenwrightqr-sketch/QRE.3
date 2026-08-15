import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainMomentumV2 } from "./authorBrainMomentumV2.js";

/**
 * QRE FAST AUTHOR LEARNING BRIDGE · CANONICAL
 *
 * This bridge is intentionally small. The canonical V2 brain receives the
 * accumulated generalized learning directly. Add principles only when a
 * lesson survives cross-domain testing.
 */
const SEQUENCE_PRINCIPLES = [
  "Goal 1: discover the strongest valid sequence hidden inside supplied reality.",
  "Identity and established facts are baseline world state. They do not earn attention cuts unless the identity itself is the surprise.",
  "A cut earns existence only when it changes the viewer's mental model or future desire.",
  "Before every cut privately test expectation, curiosity gap, prediction shift, subject relevance, next desire, unrevealed information, and counterfactual necessity.",
  "Do not invent reality. Reframe, compress, imply, contrast, and juxtapose supplied material instead.",
  "Abstract source states do not authorize concrete physical performances unless the source supports that behavior.",
  "Questions belong in hidden viewer cognition. Do not make the narrator ask literal questions unless the source explicitly calls for question language.",
  "A creative implication may arise from the relationship between known facts without inventing a new physical event.",
  "Service roles are usually stage context, not protagonists.",
  "One cut is one attention moment. Prefer implication over explanation when context supports it.",
];

export async function authorFast(input: AuthorBrainTruth) {
  const learned = [...SEQUENCE_PRINCIPLES, ...(input.creativeLearningContext ?? [])];
  return authorBrainMomentumV2({
    ...input,
    creativeLearningContext: learned,
    prompt: input.prompt,
  });
}
