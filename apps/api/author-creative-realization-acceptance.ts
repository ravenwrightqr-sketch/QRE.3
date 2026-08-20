import type { AuthorBrainTruth } from "@qre/contracts";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildCreativeRealizationForBeat } from "./src/services/authorRealizationStrategyLattice.js";

const input: AuthorBrainTruth = {
  prompt: "Dog grooming service receipt",
  subject: "Coco",
  place: "",
  lens: "",
  facts: [
    "poodle",
    "nervous",
    "fierce",
    "cool",
    "came in nervous",
    "stole a blue bow",
    "left looking fabulous",
  ],
  sourceMoments: [
    "came in nervous",
    "stole a blue bow",
    "left looking fabulous",
  ],
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
};

const graph = buildAuthorRealityGraph({
  prompt: input.prompt,
  subject: input.subject,
  place: input.place,
  facts: input.facts,
  sourceMoments: input.sourceMoments,
  memoryContext: [],
  trajectory: [],
});

const envelope = buildAuthorRealityEnvelope({
  graph,
  subject: input.subject,
});

const beat = {
  order: 1,
  role: "reframe",
  attentionFunction: "reframe",
  creativeMove: "contrast",
  realizationMode: "reframe",
  eventIds: envelope.events.slice(0, 2).map((event) => event.id),
  change: "nervous meets fierce",
  next: "the bow changes the reading",
  frontier: "the bow changes the reading",
  relationKinds: [],
  relationStrength: 0.8,
} as const;

const { strategies, realization } = buildCreativeRealizationForBeat(
  beat,
  envelope,
);

console.log("=== QRE CREATIVE REALIZATION ACCEPTANCE ===");
console.log(`STRATEGIES: ${strategies.map((item) => item.strategy).join(", ")}`);
console.log(`SELECTED STRATEGY: ${realization.strategy}`);
console.log(`OPPORTUNITY: ${realization.creativeOpportunity}`);
console.log(`INTENT: ${realization.realizationIntent}`);
console.log(`VIEWER EFFECT: ${realization.viewerEffect}`);
console.log(`SCORE: ${realization.score}`);

if (!strategies.length) {
  throw new Error("CREATIVE REALIZATION FAILED: no safe strategies");
}
if (!realization.creativeOpportunity) {
  throw new Error("CREATIVE REALIZATION FAILED: no creative opportunity");
}
if (!realization.realizationIntent) {
  throw new Error("CREATIVE REALIZATION FAILED: no realization intent");
}
if (realization.score < 0.3) {
  throw new Error(`CREATIVE REALIZATION FAILED: low score ${realization.score}`);
}

console.log("CREATIVE REALIZATION ACCEPTANCE: PASS");
