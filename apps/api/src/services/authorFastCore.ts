import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrain } from "./authorBrainMomentum.js";

const SEQUENCE_PRINCIPLES = [
  "Goal 1: discover the strongest valid sequence hidden inside supplied reality.",
  "Identity and established facts are baseline world state. They do not earn attention cuts unless the identity itself is the surprise.",
  "A cut earns existence only when it changes the viewer's mental model or future desire.",
  "Before every cut privately test expectation, curiosity gap, prediction shift, subject relevance, next desire, unrevealed information, and counterfactual necessity.",
  "Do not invent reality. Reframe and compress supplied material instead.",
  "Sequence roles are viewer-attention jobs only. Never use actor or service roles as sequence roles.",
  "Spend output budget on the actual finished cuts. Sequence cognition must stay compact.",
];

export async function authorFast(input: AuthorBrainTruth) {
  return authorBrain({
    ...input,
    creativeLearningContext: [...(input.creativeLearningContext ?? []), ...SEQUENCE_PRINCIPLES],
  });
}
