import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainMomentum } from "./authorBrainMomentum.js";

/**
 * QRE FAST AUTHOR LEARNING BRIDGE
 *
 * This layer exists to ensure the accumulated author intelligence actually
 * reaches the live local-model prompt. `creativeLearningContext` remains part
 * of the typed world, but the momentum brain must also receive the distilled
 * rules as prompt-visible cognition.
 *
 * Expand principles here only when the lesson generalizes across domains.
 * Do not turn benchmark-specific tricks into permanent author law.
 */
const SEQUENCE_PRINCIPLES = [
  "Goal 1: discover the strongest valid sequence hidden inside supplied reality.",
  "Identity and established facts are baseline world state. They do not earn attention cuts unless the identity itself is the surprise.",
  "A cut earns existence only when it changes the viewer's mental model or future desire.",
  "Before every cut privately test expectation, curiosity gap, prediction shift, subject relevance, next desire, unrevealed information, and counterfactual necessity.",
  "Do not invent reality. Reframe and compress supplied material instead.",
  "Sequence roles are viewer-attention jobs only. Never use actor or service roles as sequence roles.",
  "Spend output budget on the actual finished cuts. Sequence cognition must stay compact.",
  "A creative implication may arise from the relationship between known facts without inventing a new physical event.",
  "Abstract source states do not authorize invented physical performances. For example, fear does not automatically become trembling, jumping, hiding, or crying; happiness does not automatically become wagging, smiling, cheering, or leaping unless the source supports that behavior.",
  "Questions belong in the hidden viewer-state model. Do not make the narrator ask literal questions unless the source explicitly calls for dialogue or question language.",
  "Do not turn generic emotional arcs into the sequence. Search for contradiction, recurrence, image, status shift, implication, callback, or consequence grounded in the supplied world.",
  "The service provider is usually stage context. Do not invent provider behavior, personality, dialogue, or actions.",
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
