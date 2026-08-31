import type { LatentMovieCandidate } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { deriveLatentStoryThesis } from "./authorLatentStoryThesis.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`CREATIVE INTERPRETATION INVARIANT FAILED: ${message}`);
  }
}

const graph = buildAuthorRealityGraph({
  prompt:
    "Create the beginning of a living memory about meeting someone who may become important.",
  subject: "New relationship",
  place: "",
  facts: [],
  sourceMoments: [
    "met someone",
    "kept talking",
    "didn't expect it",
    "felt easy",
    "wanted to talk again",
  ],
  memoryContext: [],
  trajectory: [],
});

assert(graph.events.length === 5, "expected all supplied moments to become explicit events");

const candidate: LatentMovieCandidate = {
  id: "creative-interpretation-test",
  lens: "NONE",
  anchorEventIds: graph.events.slice(0, 1).map((event) => event.id),
  supportingRelationKinds: [],
  trajectory: graph.events.map((event, index) => ({
    order: index + 1,
    operation:
      index === 0
        ? "establish"
        : index === graph.events.length - 1
          ? "payoff"
          : "reveal",
    eventIds: [event.id],
    viewerChange: `The supplied sequence includes ${event.label}.`,
    nextQuestion: "What becomes newly meaningful?",
  })),
  payoff: "wanted to talk again",
  unresolvedQuestion: "What becomes newly meaningful?",
  evidence: graph.events.map((event) => event.label),
  hypothesis: ["sparse supplied sequence"],
  truthRisk: 0,
  novelty: 0.5,
  specificity: 0.5,
  informationValue: 0.5,
  uncertainty: 0.5,
  attentionPotential: 0.5,
  consequencePotential: 0.5,
  callbackPotential: 0.5,
  compressionPotential: 0.5,
  repetitionRisk: 0,
  distinctiveness: 0.5,
  score: 0.5,
};

const thesis = deriveLatentStoryThesis(graph, candidate);

assert(thesis.semanticTurn.length > 0, "sparse meaningful sequence must produce a semantic interpretation");
assert(
  /unexpectedly|continue|encounter|became|important part|became/i.test(
    thesis.semanticTurn,
  ),
  `expected a meaningful interpretation, got: ${thesis.semanticTurn}`,
);
assert(
  !thesis.relationKind,
  `sequence-backed interpretation must not claim a graph relation kind, got: ${thesis.relationKind}`,
);
assert(
  thesis.beforeEventIds.length > 0 && thesis.afterEventIds.length > 0,
  "the interpretation must preserve concrete supporting event provenance",
);

console.log("CREATIVE INTERPRETATION ACCEPTANCE PASS");
console.log(`semanticTurn=${thesis.semanticTurn}`);
console.log(`beforeEventIds=${thesis.beforeEventIds.join(",")}`);
console.log(`afterEventIds=${thesis.afterEventIds.join(",")}`);
