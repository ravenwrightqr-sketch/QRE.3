import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainMomentum } from "./authorBrainMomentum.js";

/**
 * QRE FAST AUTHOR LEARNING BRIDGE
 *
 * This layer makes accumulated author intelligence visible to the live local
 * model. `creativeLearningContext` remains typed world metadata while this
 * bridge exposes the generalized laws as prompt-visible cognition.
 *
 * Expand only with principles that generalize across domains. Do not turn a
 * benchmark-specific trick into permanent author law.
 */
const SEQUENCE_PRINCIPLES = [
  "Goal 1: discover the strongest valid sequence hidden inside supplied reality.",
  "Identity and established facts are baseline world state. They do not earn attention cuts unless the identity itself is the surprise.",
  "A cut earns existence only when it changes the viewer's mental model or future desire.",
  "Before every cut privately test expectation, curiosity gap, prediction shift, subject relevance, next desire, unrevealed information, and counterfactual necessity.",
  "Do not invent reality. Reframe and compress supplied material instead.",
  "Sequence roles are viewer-attention jobs only. Never use actor or service roles as sequence roles.",
  "Spend output budget on the actual finished cuts. Sequence cognition must stay compact.",
  "A creative implication may arise from the relationship between known facts without inventing a new event.",
  "Abstract source states do not authorize concrete physical performances unless the source supports that behavior.",
  "Questions belong in hidden viewer cognition. Do not make the narrator ask literal questions unless the source explicitly calls for question language.",
  "Do not let a generic emotional arc become the movie. Search for contradiction, recurrence, image, status shift, implication, callback, or consequence grounded in known material.",
  "Service roles are usually stage context. Do not invent provider behavior, personality, dialogue, or actions.",
  "One cut is one attention moment. Prefer implication over explanation when the viewer can reconstruct the missing context.",
];

export async function authorFast(input: AuthorBrainTruth) {
  const learned = [
    ...SEQUENCE_PRINCIPLES,
    ...(input.creativeLearningContext ?? []),
  ];

  return authorBrainMomentum({
    ...input,
    prompt: [
      input.prompt,
      "AUTHOR LEARNING LAW:",
      ...learned,
    ].filter(Boolean).join("\n"),
    creativeLearningContext: learned,
  });
}
