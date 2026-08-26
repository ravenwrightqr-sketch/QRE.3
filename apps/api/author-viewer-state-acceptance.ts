import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { rerankByViewerState, scoreViewerStateTrajectory } from "./src/services/authorViewerState.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const graph: RealityGraph = {
  events: [
    {
      id: "event-1",
      label: "Came in nervous.",
      sourceIds: ["source-1"],
      entities: ["Coco"],
      salient: true,
      provenance: "explicit",
    },
    {
      id: "event-2",
      label: "Got a bath.",
      sourceIds: ["source-2"],
      entities: ["Coco", "bath"],
      salient: true,
      provenance: "explicit",
    },
    {
      id: "event-3",
      label: "Stole the red bow.",
      sourceIds: ["source-3"],
      entities: ["Coco", "red bow"],
      salient: true,
      provenance: "explicit",
    },
    {
      id: "event-4",
      label: "Left looking fabulous.",
      sourceIds: ["source-4"],
      entities: ["Coco"],
      salient: true,
      provenance: "explicit",
    },
  ],
  relations: [
    { from: "event-1", to: "event-2", kind: "changes", strength: 0.72 },
    { from: "event-2", to: "event-3", kind: "recontextualizes", strength: 0.88 },
    { from: "event-3", to: "event-4", kind: "contrasts", strength: 0.84 },
  ],
  unresolvedTensions: ["nervousness becomes confidence"],
  recurringSignals: ["Coco", "bow"],
  sensorySignals: ["bath", "red bow"],
  evidence: [],
};

const base = (trajectory: LatentMovieCandidate["trajectory"]): LatentMovieCandidate => ({
  id: "candidate",
  lens: "neutral",
  anchorEventIds: ["event-1", "event-4"],
  supportingRelationKinds: ["changes", "recontextualizes", "contrasts"],
  trajectory,
  payoff: "Left looking fabulous.",
  unresolvedQuestion: "What changed?",
  evidence: graph.events.map((event) => event.label),
  hypothesis: ["same reality"],
  truthRisk: 0.1,
  novelty: 0.7,
  specificity: 0.8,
  informationValue: 0.8,
  uncertainty: 0.8,
  attentionPotential: 0.7,
  consequencePotential: 0.8,
  callbackPotential: 0.7,
  compressionPotential: 0.8,
  repetitionRisk: 0.1,
  distinctiveness: 0.8,
  score: 0.7,
});

const flat = base([
  {
    order: 1,
    operation: "establish",
    eventIds: ["event-1"],
    viewerChange: "Establish supplied evidence.",
    nextQuestion: "What relationship deserves the next cut?",
  },
  {
    order: 2,
    operation: "reveal",
    eventIds: ["event-1", "event-2"],
    viewerChange: "The supplied event is shown.",
    nextQuestion: "What relationship deserves the next cut?",
  },
  {
    order: 3,
    operation: "reveal",
    eventIds: ["event-2", "event-3"],
    viewerChange: "The supplied event is shown.",
    nextQuestion: "What relationship deserves the next cut?",
  },
  {
    order: 4,
    operation: "payoff",
    eventIds: ["event-3", "event-4"],
    viewerChange: "The supplied endpoint lands.",
    nextQuestion: "What is now true at the supplied ending?",
  },
]);

const active = base([
  {
    order: 1,
    operation: "establish",
    eventIds: ["event-1"],
    viewerChange: "Came in nervous.",
    nextQuestion: "What changes next?",
  },
  {
    order: 2,
    operation: "reframe",
    eventIds: ["event-1", "event-2"],
    viewerChange: "The nervousness meets the bath.",
    nextQuestion: "What changes after that?",
  },
  {
    order: 3,
    operation: "contrast",
    eventIds: ["event-2", "event-3"],
    viewerChange: "Then the bow enters the story.",
    nextQuestion: "So what did the bow change?",
  },
  {
    order: 4,
    operation: "recontextualize",
    eventIds: ["event-1", "event-3"],
    viewerChange: "That earlier nervousness reads differently now.",
    nextQuestion: "What does the ending reveal?",
  },
  {
    order: 5,
    operation: "payoff",
    eventIds: ["event-3", "event-4"],
    viewerChange: "The supplied ending lands.",
    nextQuestion: "What is now true at the supplied ending?",
  },
]);

const flatDynamics = scoreViewerStateTrajectory(graph, flat);
const activeDynamics = scoreViewerStateTrajectory(graph, active);

assert(
  activeDynamics.attention > flatDynamics.attention,
  "VIEWER STATE FAILURE: active trajectory did not improve attention change.",
);
assert(
  activeDynamics.contrast > flatDynamics.contrast,
  "VIEWER STATE FAILURE: active trajectory did not improve contrast.",
);
assert(
  activeDynamics.accumulation > flatDynamics.accumulation,
  "VIEWER STATE FAILURE: active trajectory did not improve accumulation.",
);
assert(
  activeDynamics.payoff > 0.7,
  "VIEWER STATE FAILURE: payoff did not register as earned.",
);

const reranked = rerankByViewerState(graph, [flat, active]);

assert(
  reranked[0]?.id === "candidate" || reranked[0]?.viewerStateDynamics?.score,
  "VIEWER STATE FAILURE: reranker returned no scored candidate.",
);

const activeRank = reranked.findIndex((candidate) =>
  candidate.trajectory.length === active.trajectory.length,
);
assert(
  activeRank === 0,
  "VIEWER STATE FAILURE: stronger viewer-state trajectory was not ranked first.",
);

console.log("AUTHOR VIEWER STATE ACCEPTANCE: PASS");
console.log(`Flat=${JSON.stringify(flatDynamics)}`);
console.log(`Active=${JSON.stringify(activeDynamics)}`);
console.log(`WinnerViewerState=${reranked[0]?.viewerStateDynamics?.score ?? "n/a"}`);
