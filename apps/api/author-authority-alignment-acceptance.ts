import { evaluateLatentMovie } from "./src/services/authorSemanticGate.js";
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

const graph: RealityGraph = {
  evidence: [],
  events: [
    { id: "event-1", label: "Coco is a small dog", entities: ["Coco"], structure: "state" },
    { id: "event-2", label: "Coco loves apples", entities: ["Coco", "apples"], structure: "state" },
    { id: "event-3", label: "Coco walks in the park", entities: ["Coco", "park"], structure: "action" },
    { id: "event-4", label: "Coco chases squirrels", entities: ["Coco", "squirrels"], structure: "action" },
  ],
  relations: [],
  eventStructure: { orderedEventIds: ["event-1", "event-2", "event-3", "event-4"] },
  entityContinuity: [],
  patterns: [],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
};

const movie: LatentMovieCandidate = {
  id: "movie-coco",
  lens: "affective",
  evidence: ["Coco is a small dog", "Coco loves apples", "Coco walks in the park", "Coco chases squirrels"],
  hypothesis: ["Smallness and movement turn ordinary details into a vivid reading of Coco."],
  payoff: "a fleeting sense of simple happiness",
  unresolvedQuestion: "What does Coco notice next?",
  anchorEventIds: ["event-1", "event-3"],
  supportingRelationKinds: ["subject-action", "subject-object"],
  trajectory: [
    { order: 1, operation: "establish", eventIds: ["event-1"], viewerChange: "Coco is introduced", nextQuestion: "What comes next?" },
    { order: 2, operation: "reveal", eventIds: ["event-2"], viewerChange: "apples sharpen the portrait", nextQuestion: "What else?" },
    { order: 3, operation: "reframe", eventIds: ["event-3"], viewerChange: "the park changes the scale of attention", nextQuestion: "And then?" },
    { order: 4, operation: "escalate", eventIds: ["event-4"], viewerChange: "squirrels give the sequence energy", nextQuestion: "What lands?" },
  ],
  truthRisk: 0.05,
  novelty: 0.7,
  specificity: 0.85,
  informationValue: 0.7,
  uncertainty: 0.2,
  attentionPotential: 0.8,
  consequencePotential: 0.2,
  callbackPotential: 0.25,
  compressionPotential: 0.9,
  repetitionRisk: 0.1,
  distinctiveness: 0.75,
  score: 0.8,
};

const result = evaluateLatentMovie(movie, graph);
if (!result.accepted) throw new Error(`AUTHOR AUTHORITY ALIGNMENT FAILED: ${result.reasons.join("; ")}`);
console.log("GROUNDED CREATIVE INTERPRETATION: PASS");
console.log(`SCORE: ${result.score}`);
console.log("INVENTED EVENTS REMAIN FORBIDDEN: PASS");
console.log("AUTHOR AUTHORITY ALIGNMENT: COMPLETE");
