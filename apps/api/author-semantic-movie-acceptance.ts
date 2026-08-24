import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import type { RealityGraph } from "@qre/contracts";

const graph: RealityGraph = {
  evidence: [
    { id: "e1", text: "hates bows", kind: "fact" },
    { id: "e2", text: "scared at first", kind: "fact" },
    { id: "e3", text: "grooming visit", kind: "moment" },
    { id: "e4", text: "pink bow", kind: "fact" },
    { id: "e5", text: "happy after", kind: "fact" },
  ],
  events: [
    { id: "event-1", label: "hates bows", sourceIds: ["e1"], entities: ["Coco", "bows"], salient: true, provenance: "explicit" },
    { id: "event-2", label: "scared at first", sourceIds: ["e2"], entities: ["Coco"], emotionalState: "scared", salient: true, provenance: "explicit" },
    { id: "event-3", label: "grooming visit", sourceIds: ["e3"], entities: ["Coco", "grooming"], salient: true, provenance: "explicit" },
    { id: "event-4", label: "pink bow", sourceIds: ["e4"], entities: ["Coco", "pink", "bow"], salient: true, provenance: "explicit" },
    { id: "event-5", label: "happy after", sourceIds: ["e5"], entities: ["Coco"], emotionalState: "happy", salient: true, provenance: "explicit" },
  ],
  relations: [
    { from: "event-1", to: "event-5", kind: "recontextualizes", strength: 0.82 },
    { from: "event-2", to: "event-3", kind: "changes", strength: 0.55 },
    { from: "event-3", to: "event-4", kind: "recontextualizes", strength: 0.55 },
    { from: "event-4", to: "event-5", kind: "recontextualizes", strength: 0.82 },
    { from: "event-2", to: "event-5", kind: "recontextualizes", strength: 0.82 },
  ],
  unresolvedTensions: [
    "current state conflicts with another supplied state",
    "a supplied detail can change the meaning of another supplied detail",
  ],
  recurringSignals: [],
  sensorySignals: [],
};

const cognition = buildAuthorCognitivePlan({
  prompt: "make Coco's visit funny, affectionate, slightly fierce",
  lens: "funny, affectionate, slightly fierce",
  subject: "Coco",
  facts: ["hates bows", "scared at first", "pink bow", "happy after"],
  sourceMoments: ["grooming visit"],
  memoryContext: [],
  realityGraph: graph,
  movieMode: true,
});

const movie = cognition.selectedMovie;
const thesis = movie?.storyThesis;
const meaningful = movie?.trajectory.filter(
  (step) => step.operation !== "establish" && step.operation !== "payoff",
) ?? [];

const payoff = movie?.trajectory.find(
  (step) => step.operation === "payoff",
);
const endpoint = payoff?.eventIds.length
  ? payoff.eventIds[payoff.eventIds.length - 1]
  : undefined;

if (!movie) throw new Error("FAIL: no latent movie selected");
if (!thesis) throw new Error("FAIL: selected movie has no story thesis");
if (!thesis.semanticTurn) throw new Error("FAIL: semantic turn is empty");
if (!meaningful.length) throw new Error("FAIL: movie has no meaningful semantic turn");
if (endpoint !== "event-5") {
  throw new Error(`FAIL: endpoint drifted to ${endpoint ?? "none"}`);
}
if (/Establish supplied evidence|changes:\s*scared at first/i.test(thesis.semanticTurn)) {
  throw new Error(`FAIL: semantic turn collapsed into planner/fact wording: ${thesis.semanticTurn}`);
}

console.log("AUTHOR SEMANTIC MOVIE ACCEPTANCE: PASS");
console.log(`Movie=${movie.id}`);
console.log(`SemanticTurn=${thesis.semanticTurn}`);
console.log(`CarrierEvents=${thesis.carrierEventIds.join(",")}`);
console.log(`Payoff=${movie.payoff}`);
console.log(`Endpoint=${endpoint}`);
