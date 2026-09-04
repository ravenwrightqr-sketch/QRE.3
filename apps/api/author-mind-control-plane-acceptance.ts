import fs from "node:fs";
import { buildAuthorMindState, buildSelectiveAuthorContext } from "./src/services/authorMindControlPlane.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR MIND CONTROL PLANE ACCEPTANCE FAILED: ${message}`);
  }
}

const graph = buildAuthorRealityGraph({
  prompt: "Build an experience from supplied reality.",
  subject: "Milo",
  facts: [
    "Milo is a Pomeranian",
    "Milo loves walks",
    "Milo loves bacon",
    "Milo likes small dogs",
    "Milo rolls in grass",
    "Milo loves the park",
  ],
  sourceMoments: [],
});

const movie = {
  id: "mind-test-movie",
  trajectory: [
    { order: 1, operation: "establish", eventIds: ["event-1"], viewerChange: "Establish Milo." },
    { order: 2, operation: "reveal", eventIds: ["event-2", "event-3"], viewerChange: "The clues converge." },
    { order: 3, operation: "payoff", eventIds: ["event-4"], viewerChange: "Let the relationship land." },
  ],
  hypothesis: ["supplied clues become a relationship"],
  evidence: ["Milo is a Pomeranian", "Milo loves walks", "Milo loves bacon"],
  payoff: "Milo loves small dogs",
  supportingRelationKinds: ["converges"],
  storyThesis: {
    semanticTurn: "convergence: supplied clues become one memorable relationship",
    relationKind: "converges",
    counterfactualDependency: 0.92,
    carrierEventIds: ["event-2", "event-3"],
    beforeEventIds: ["event-1"],
    afterEventIds: ["event-4"],
    sealingEventIds: ["event-4"],
    semanticRealization: {
      mechanism: "convergence",
      evidenceEventIds: ["event-2", "event-3", "event-4"],
      beforeEventIds: ["event-1"],
      afterEventIds: ["event-4"],
      before: "Milo loves walks",
      after: "Milo likes small dogs",
      subject: "Milo",
      relation: {
        kind: "converges",
        fromEventId: "event-2",
        toEventId: "event-4",
      },
      realizationMove: "recognize",
      creativeOpportunity: "recognition",
      feltEffect: "Separate clues suddenly click together.",
      viewerShift: "The viewer sees the clues as one pattern.",
      languageAim: "Use juxtaposition and implication rather than explanation.",
      confidence: 0.92,
    },
  },
} as any;

const mind = buildAuthorMindState({
  graph,
  subject: "Milo",
  selectedLens: "NONE",
  round: 1,
  movieCandidates: [movie],
  selectedMovie: movie,
});

const compact = buildSelectiveAuthorContext(mind);

assert(mind.version === 1, "version missing");
assert(mind.selectedCapabilityIds.includes("reality_graph"), "reality graph not selected");
assert(mind.selectedCapabilityIds.includes("relationship_search"), "relationship search not selected");
assert(mind.selectedCapabilityIds.includes("story_thesis"), "story thesis not selected");
assert(mind.selectedCapabilityIds.includes("truth_gate"), "truth gate missing");
assert(mind.selectedCapabilityIds.includes("realization_boundary"), "realization boundary missing");
assert(mind.decision.primaryMechanism.length > 0, "primary mechanism missing");
assert(mind.decision.relationKinds.includes("converges"), "relationship did not reach decision state");
assert(mind.decision.evidenceEventIds.every((id) => graph.events.some((event) => event.id === id)), "decision contains foreign evidence");
assert(mind.frontier.nextCutObjective.length > 0, "experience frontier missing");
assert(mind.frontier.unresolvedRelations.length > 0, "frontier lost graph relationships");
assert(compact.selectedCapabilities.length > 0, "selective context empty");
assert(JSON.stringify(compact).length < JSON.stringify(mind).length, "selective context did not compress mind state");

const cognitionSource = fs.readFileSync("apps/api/src/services/authorCognition.ts", "utf8");
const brainSource = fs.readFileSync("apps/api/src/services/authorBrainCanonical.ts", "utf8");
const mouthSource = fs.readFileSync("apps/api/src/services/authorMouth.ts", "utf8");

assert(cognitionSource.includes("buildAuthorMindState"), "Cognition not wired to mind control plane");
assert(cognitionSource.includes("mindState:"), "Cognition plan does not expose mindState");
assert(brainSource.includes("mindState: cognition.mindState"), "Canonical Brain does not pass mindState to Mouth");
assert(mouthSource.includes("authorMind: input.mindState"), "Mouth does not receive Author mind context");

console.log("AUTHOR MIND CONTROL PLANE ACCEPTANCE: PASS");
console.log(`CAPABILITIES_SELECTED=${mind.selectedCapabilityIds.length}`);
console.log(`PRIMARY=${mind.decision.primaryCapability}`);
console.log(`MECHANISM=${mind.decision.primaryMechanism}`);
console.log(`RELATIONS=${mind.decision.relationKinds.join("|")}`);
console.log(`FRONTIER_OBJECTIVE=${mind.frontier.nextCutObjective}`);
console.log("COGNITION_TO_MIND=TRUE");
console.log("MIND_TO_BRAIN=TRUE");
console.log("BRAIN_TO_MOUTH=TRUE");
