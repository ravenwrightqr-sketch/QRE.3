import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";
import { deriveCreativeRelationCandidates } from "./creativeRelationOps.js";

/**
 * QRE FAST AUTHOR LEARNING BRIDGE · CANONICAL
 *
 * This is the live universal-author learning channel.
 * Add only generalized intelligence laws that survive unrelated-domain tests.
 *
 * Candidate operations are search hints only. They never become source truth.
 */
const SEQUENCE_PRINCIPLES = [
  "Goal 1: discover the strongest valid sequence hidden inside supplied reality.",
  "Identity and established facts are baseline world state. They do not earn attention cuts unless the identity itself is the surprise.",
  "A cut earns existence only when it changes the viewer's mental model or future desire.",
  "Before every cut privately test expectation, curiosity gap, prediction shift, subject relevance, next desire, unrevealed information, and counterfactual necessity.",
  "Do not invent reality. Reframe, compress, imply, contrast, and juxtapose supplied material instead.",
  "A source state is evidence about the world, not an instruction to build a generic emotional arc.",
  "Abstract source states do not authorize concrete physical performances unless the source supports that behavior.",
  "Questions belong in hidden viewer cognition. Do not make the narrator ask literal questions unless the source explicitly calls for question language.",
  "A creative implication may arise from the relationship between known facts without inventing a new physical event.",
  "Predicate-to-attitude compression may turn a supplied dislike, love, status, history, recurrence, or contradiction into a sharp line.",
  "Search contradiction, recurrence, image, status shift, implication, callback, consequence, or withheld meaning before defaulting to transformation.",
  "Service roles are usually stage context, not protagonists.",
  "One cut is one attention moment. Prefer implication over explanation when context supports it.",
  "Use recurrence compression only when recurrence is supported by memory, trajectory, or repeated supplied evidence.",
  "Cognitive questions are hidden controls. Finished cuts should express the discovery rather than explain the question.",
  "Interpretation may be creative. Evidence may not be invented.",
  "When the supplied world is sparse, prefer smaller stronger implications over adding people, history, objects, events, dialogue, or hidden backstory.",
  "Optional relation candidates are hypotheses. Use, alter, combine, or reject them. Never promote them to canonical facts.",
];

export async function authorFast(input: AuthorBrainTruth) {
  const learned = [...SEQUENCE_PRINCIPLES, ...(input.creativeLearningContext ?? [])];
  const relationCandidates = deriveCreativeRelationCandidates(input)
    .map((candidate) => candidate.text)
    .filter(Boolean)
    .slice(0, 8);

  const enrichedPrompt = [
    input.prompt,
    "AUTHOR LEARNING LAW:",
    ...learned,
    relationCandidates.length > 0 ? "OPTIONAL CREATIVE RELATION CANDIDATES — NOT FACTS:" : "",
    ...relationCandidates,
  ].filter(Boolean).join("\n");

  return authorBrainUniversal({
    ...input,
    prompt: enrichedPrompt,
    creativeLearningContext: learned,
  });
}
