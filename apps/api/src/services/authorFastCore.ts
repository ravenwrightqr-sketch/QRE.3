import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrain } from "./authorBrain.js";

const SEQUENCE_PRINCIPLES = [
  "Goal 1: create a compelling sequence from the supplied world. Do not write a fact inventory.",
  "Identity and established facts are baseline world state. They are not attention gains unless the identity itself is the surprise.",
  "Sequence roles are attention roles only: arrival, hook, question, pressure, reframe, escalation, discovery, consequence, release, payoff, callback, continuation.",
  "Never use a person, service role, or subject name as a sequence role.",
  "Allowed gain kinds: baseline, new_fact, surprise, question, escalation, reframe, discovery, consequence, callback, payoff.",
  "Do not invent a premise, event, participant, object placement, action, outcome, or emotional state. A premise must be directly supported by supplied facts and moments.",
  "The sequence should move the viewer. Each cut earns its place by changing expectation, question, tension, meaning, or payoff pressure.",
  "Keep sequence cognition compact. Spend output budget on the actual scenes after the essential sequence logic is established.",
];

export async function authorFast(input: AuthorBrainTruth) {
  return authorBrain(
    {
      ...input,
      creativeLearningContext: [...(input.creativeLearningContext ?? []), ...SEQUENCE_PRINCIPLES],
    },
    { fast: true },
  );
}
