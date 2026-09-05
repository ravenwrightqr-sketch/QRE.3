import assert from "node:assert/strict";
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { evaluateLatentMovie } from "./src/services/authorSemanticGate.js";

const graph = {
  evidence: [],
  events: [
    { id: "event-1", label: "Coco loves walks", entities: ["Coco"], place: undefined, time: undefined },
    { id: "event-2", label: "Coco rolls in grass", entities: ["Coco"], place: undefined, time: undefined },
    { id: "event-3", label: "Coco likes bacon", entities: ["Coco"], place: undefined, time: undefined },
  ],
  relations: [],
  eventStructure: [],
  entityContinuity: [],
  patterns: [],
  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
} as unknown as RealityGraph;

const weak = {
  id: "weak",
  lens: "NONE",
  anchorEventIds: ["event-1"],
  supportingRelationKinds: [],
  trajectory: [
    { order: 1, operation: "establish", eventIds: ["event-1"], viewerChange: "Coco is introduced", nextQuestion: "What else does Coco enjoy?" },
    { order: 2, operation: "confirm", eventIds: ["event-2"], viewerChange: "Coco remains joyful", nextQuestion: "What else?" },
    { order: 3, operation: "confirm", eventIds: ["event-3"], viewerChange: "Coco remains joyful", nextQuestion: "Why is Coco happy?" },
  ],
  payoff: "Coco is consistently joyful and contented.",
  unresolvedQuestion: "What contributes to Coco's happiness?",
  evidence: ["Coco loves walks", "Coco rolls in grass", "Coco likes bacon"],
  hypothesis: ["Coco is consistently joyful because she has simple pleasures and no negative experiences."],
  truthRisk: 0.22,
  novelty: 0.33,
  specificity: 0.66,
  informationValue: 0.55,
  uncertainty: 0.44,
  attentionPotential: 0.66,
  consequencePotential: 0.22,
  callbackPotential: 0.11,
  compressionPotential: 0.44,
  repetitionRisk: 0.22,
  distinctiveness: 0.55,
  score: 0.7,
} as unknown as LatentMovieCandidate;

const strong = {
  ...weak,
  id: "strong",
  trajectory: [
    { order: 1, operation: "establish", eventIds: ["event-1"], viewerChange: "A familiar pleasure appears", nextQuestion: "How specific is this world?" },
    { order: 2, operation: "recur", eventIds: ["event-2"], viewerChange: "The pattern is not generic; it keeps finding simple sensory pleasures", nextQuestion: "What completes the pattern?" },
    { order: 3, operation: "payoff", eventIds: ["event-3"], viewerChange: "The ordinary details form Coco's particular world", nextQuestion: "What lands?" },
  ],
  payoff: "A small, specific world keeps returning in different forms.",
  hypothesis: ["Walks, grass and bacon are three different doors into the same particular pleasure-seeking world."],
  truthRisk: 0.05,
  novelty: 0.7,
  distinctiveness: 0.82,
} as unknown as LatentMovieCandidate;

const weakResult = evaluateLatentMovie(weak, graph);
assert.equal(weakResult.accepted, false, `weak Movie passed: ${weakResult.reasons.join("; ")}`);
assert.ok(weakResult.reasons.some((reason) => /summary|movement|unsupported/i.test(reason)));

const strongResult = evaluateLatentMovie(strong, graph);
assert.equal(strongResult.accepted, true, `strong Movie rejected: ${strongResult.reasons.join("; ")}`);

console.log("AUTHOR SEMANTIC GATE ACCEPTANCE: COMPLETE");
