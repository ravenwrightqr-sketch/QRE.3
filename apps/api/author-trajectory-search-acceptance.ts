import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { searchBestMovieTrajectories } from "./src/services/authorTrajectorySearch.js";

const graph: RealityGraph = {
  evidence: [
    { id: "e1", text: "came in nervous", kind: "fact" },
    { id: "e2", text: "got a bath", kind: "fact" },
    { id: "e3", text: "stole a blue bow", kind: "fact" },
    { id: "e4", text: "left looking fabulous", kind: "fact" },
  ],
  events: [
    { id: "event-1", label: "came in nervous", sourceIds: ["e1"], entities: ["Coco", "nervous"], salient: true, provenance: "explicit" },
    { id: "event-2", label: "got a bath", sourceIds: ["e2"], entities: ["Coco", "bath"], salient: true, provenance: "explicit" },
    { id: "event-3", label: "stole a blue bow", sourceIds: ["e3"], entities: ["Coco", "blue", "bow"], salient: true, provenance: "explicit" },
    { id: "event-4", label: "left looking fabulous", sourceIds: ["e4"], entities: ["Coco", "fabulous"], salient: true, provenance: "explicit" },
  ],
  relations: [
    { from: "event-1", to: "event-2", kind: "changes", strength: 0.72 },
    { from: "event-2", to: "event-3", kind: "contrasts", strength: 0.84 },
    { from: "event-3", to: "event-4", kind: "recontextualizes", strength: 0.9 },
  ],
  unresolvedTensions: ["nervousness versus supplied fierce trait", "bow changes the social reading"],
  recurringSignals: ["nervous"],
  sensorySignals: ["stole a blue bow"],
};

const candidate: LatentMovieCandidate = {
  id: "movie-coco-1",
  lens: "comedy",
  anchorEventIds: ["event-1", "event-3", "event-4"],
  supportingRelationKinds: ["changes", "contrasts", "recontextualizes"],
  trajectory: [
    {
      order: 1,
      operation: "establish",
      eventIds: ["event-1"],
      viewerChange: "Nervous arrival is established.",
      nextQuestion: "What will change that reading?",
    },
    {
      order: 2,
      operation: "contrast",
      eventIds: ["event-1", "event-3"],
      viewerChange: "The nervous arrival now reads against the blue bow.",
      nextQuestion: "What does the bow change?",
    },
  ],
  payoff: "The supplied fabulous ending lands after the altered reading.",
  unresolvedQuestion: "What does the bow now mean?",
  evidence: ["came in nervous", "stole a blue bow", "left looking fabulous"],
  hypothesis: ["The bow reframes the arrival."],
  truthRisk: 0,
  novelty: 0.8,
  specificity: 0.9,
  informationValue: 0.72,
  uncertainty: 0.1,
  attentionPotential: 0.75,
  consequencePotential: 0.7,
  callbackPotential: 0.6,
  compressionPotential: 0.8,
  repetitionRisk: 0.1,
  distinctiveness: 0.9,
  score: 0.74,
};

const result = searchBestMovieTrajectories(graph, [candidate], {
  endpointEventId: "event-4",
  beamWidth: 4,
  maxSteps: 5,
  requireEndpoint: true,
});

const selected = result[0];
const failures: string[] = [];

if (!selected) failures.push("trajectory search returned no candidate");
if (selected && !selected.trajectory.some((step) => step.eventIds.includes("event-4"))) {
  failures.push("endpoint event was not preserved");
}
if (selected && selected.trajectory.some((step) => step.eventIds.some((id) => !graph.events.some((event) => event.id === id)))) {
  failures.push("trajectory contains an event outside RealityGraph");
}
if (selected && selected.trajectory.length > 5) failures.push("trajectory exceeded maxSteps");
if (selected && !selected.trajectory.some((step) => step.operation === "payoff")) {
  failures.push("supplied endpoint did not become payoff operation");
}

console.log("QRE TRAJECTORY SEARCH ACCEPTANCE");
console.log(`INPUT EVENTS: ${graph.events.length}`);
console.log(`INPUT CANDIDATES: 1`);
console.log(`RESULTS: ${result.length}`);
console.log(`SELECTED SCORE: ${selected?.score ?? 0}`);
console.log(`SELECTED TRAJECTORY: ${selected?.trajectory.map((step) => `${step.operation}[${step.eventIds.join("+")}]`).join(" -> ") ?? "NONE"}`);

if (failures.length) {
  console.error("FAILURES:");
  for (const failure of failures) console.error(`- ${failure}`);
  throw new Error("TRAJECTORY SEARCH ACCEPTANCE FAILED");
}

console.log("PASS: whole-trajectory search stayed inside the RealityGraph and preserved the supplied endpoint.");
