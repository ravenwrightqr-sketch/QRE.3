import assert from "node:assert/strict";
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { scoreViewerStateTrajectory } from "./src/services/authorViewerState.js";

const graph: RealityGraph = {
  prompt: "Coco came in nervous. Coco was groomed. Coco stole the red bow. Coco left looking fabulous.",
  lens: "comedy",
  entities: ["Coco", "Elm Street Grooming", "red bow"],
  participants: ["Coco"],
  places: ["Elm Street Grooming"],
  times: [],
  identityFacts: [],
  events: [
    {
      id: "e1",
      raw: "Coco came in nervous.",
      participants: ["Coco"],
      action: "came",
      state: "nervous",
      object: undefined,
      place: "Elm Street Grooming",
      time: undefined,
      details: ["nervous"],
      order: 0,
      evidence: [],
    },
    {
      id: "e2",
      raw: "Coco was groomed.",
      participants: ["Coco"],
      action: "groomed",
      state: undefined,
      object: undefined,
      place: "Elm Street Grooming",
      time: undefined,
      details: [],
      order: 1,
      evidence: [],
    },
    {
      id: "e3",
      raw: "Coco stole the red bow.",
      participants: ["Coco"],
      action: "stole",
      state: undefined,
      object: "red bow",
      place: "Elm Street Grooming",
      time: undefined,
      details: [],
      order: 2,
      evidence: [],
    },
  ],
  relations: [
    { from: "e1", to: "e2", kind: "changes", strength: 0.8 },
    { from: "e2", to: "e3", kind: "recontextualizes", strength: 0.9 },
  ],
  evidence: [],
  memoryMatches: [],
  entitiesByKind: {
    people: ["Coco"],
    places: ["Elm Street Grooming"],
    times: [],
    events: [],
    objects: ["red bow"],
  },
  unresolvedTensions: [],
  recurringSignals: ["Coco"],
  sensorySignals: [],
};

const envelope: RealityEnvelope = {
  subject: "Coco",
  events: graph.events.map((event) => ({
    id: event.id,
    label: event.raw,
    sourceIds: [],
    entities: event.participants,
  })),
  relations: graph.relations,
  suppliedTerms: ["Coco", "groomed", "nervous", "red", "bow"],
  suppliedPhrases: graph.events.map((event) => event.raw),
  suppliedEntities: ["Coco", "Elm Street Grooming", "red bow"],
  suppliedActions: ["came", "groomed", "stole"],
  suppliedStates: ["nervous"],
  openingEventIds: ["e1"],
  endpointEventId: "e3",
  carrierEventIds: ["e1", "e2"],
  unresolvedTensions: [],
  recurringSignals: ["Coco"],
  sensorySignals: [],
};

const beat = {
  order: 1,
  role: "reframe",
  attentionFunction: "turn",
  creativeMove: "callback",
  realizationMode: "recontextualize",
  eventIds: ["e1", "e3"],
  change: "The later detail changes the earlier reading.",
  next: "What does the bow mean now?",
  frontier: "What does the bow mean now?",
  setsUp: ["e1"],
  paysOff: [],
  obligations: [],
  forbiddenMoves: [],
  relationKinds: ["recontextualizes"],
  relationStrength: 0.9,
} as const;

const longCandidate = scoreMouthCandidate({
  text: "Coco came in nervous, and somehow the red bow makes that earlier nervousness feel temporary now.",
  beat,
  envelope,
});

assert(longCandidate.text.length > 30, "LONG CUT FAILURE: candidate was still truncated to a short form.");
assert(longCandidate.compressionScore < 1, "COMPRESSION FAILURE: long cut should be soft-scored, not treated as invalid or perfect compression.");

const candidate = (operations: any[]): LatentMovieCandidate => ({
  id: operations.join("-"),
  lens: "comedy",
  anchorEventIds: ["e1", "e2", "e3"],
  supportingRelationKinds: ["changes", "recontextualizes"],
  trajectory: operations.map((operation, index) => ({
    order: index + 1,
    operation,
    eventIds: index === 0 ? ["e1"] : index === 1 ? ["e2"] : ["e2", "e3"],
    viewerChange: index === 0 ? "The starting state is established." : index === 1 ? "The earlier state now reads differently." : "The bow creates a new expectation.",
    nextQuestion: index === 2 ? "What happens next?" : "What does this make newly meaningful?",
  })),
  payoff: "Coco stole the red bow.",
  unresolvedQuestion: "What happens next?",
  evidence: ["e1", "e2", "e3"],
  hypothesis: ["A comic recontextualization of the grooming and bow."],
  truthRisk: 0.02,
  novelty: 0.8,
  specificity: 0.9,
  informationValue: 0.85,
  uncertainty: 0.7,
  attentionPotential: 0.9,
  consequencePotential: 0.8,
  callbackPotential: 0.9,
  compressionPotential: 0.8,
  repetitionRisk: 0.1,
  distinctiveness: 0.8,
  score: 0.8,
});

const flat = scoreViewerStateTrajectory(graph, candidate(["establish", "reveal", "reveal"]));
const dynamic = scoreViewerStateTrajectory(graph, candidate(["establish", "reframe", "payoff"]));
assert(dynamic.tempo > 0, "TEMPO FAILURE: trajectory tempo was not measured.");
assert(dynamic.continuity > 0, "CONTINUITY FAILURE: trajectory continuity was not measured.");
assert(dynamic.score > flat.score, "TRAJECTORY FAILURE: active state-changing trajectory did not outrank flat progression.");

console.log("AUTHOR CUT DYNAMICS ACCEPTANCE: PASS");
console.log(`LongCutWords=${longCandidate.text.split(/\\s+/).length}`);
console.log(`LongCutCompression=${longCandidate.compressionScore}`);
console.log(`Flat=${JSON.stringify(flat)}`);
console.log(`Dynamic=${JSON.stringify(dynamic)}`);
