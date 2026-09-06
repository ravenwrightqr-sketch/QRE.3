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
    { order: 2, operation: "recur", eventIds: ["event-2"], viewerChange: "The pattern keeps returning through a different sensory detail", nextQuestion: "What completes the pattern?" },
    { order: 3, operation: "payoff", eventIds: ["event-3"], viewerChange: "The ordinary details form one particular world", nextQuestion: "What lands?" },
  ],
  payoff: "The same small world keeps returning in different forms.",
  hypothesis: ["Walks, grass and bacon are three different doors into the same particular pleasure-seeking world."],
  storyThesis: {
    initialReading: "Coco has a few ordinary favorite things.",
    semanticTurn: "Three unrelated details start reading like one unmistakable world.",
    beforeMeaning: ["walks", "grass"],
    afterMeaning: ["a particular pattern of simple pleasures"],
    beforeEventIds: ["event-1"],
    afterEventIds: ["event-3"],
    relationKind: "repeats",
    carrierEventIds: ["event-2"],
    sealingEventIds: ["event-3"],
    payoffDependency: "The final favorite completes the pattern begun by the earlier details.",
    counterfactualDependency: 0.15,
    semanticRealization: {
      mechanism: "recurrence",
      evidenceEventIds: ["event-1", "event-2", "event-3"],
      beforeEventIds: ["event-1"],
      afterEventIds: ["event-3"],
      before: "ordinary favorites",
      after: "one recognizable world",
      subject: "Coco",
      realizationMove: "recognize_callback",
      creativeOpportunity: "recognition",
      feltEffect: "recognition",
      viewerShift: "the viewer connects the details",
      languageAim: "imply the pattern; do not explain it",
      confidence: 0.92,
    },
    observerExperience: {
      objective: "Let the viewer connect the repeated details themselves.",
      surprise: "The details become more specific together than separately.",
      curiosity: "What small detail completes the pattern?",
      attention: ["walks", "grass", "bacon"],
      landing: "Recognition rather than explanation.",
      explanationForbidden: true,
      feltEffect: "Ohhh.",
      viewerShift: "from separate facts to a connected identity",
      realizationDirection: "adjacency, callback, omission",
    },
  },
  truthRisk: 0.05,
  novelty: 0.7,
  distinctiveness: 0.82,
} as unknown as LatentMovieCandidate;

const missingThesis = {
  ...strong,
  id: "missing-thesis",
  storyThesis: undefined,
} as unknown as LatentMovieCandidate;

const weakResult = evaluateLatentMovie(weak, graph);
assert.equal(weakResult.accepted, false, `weak Movie passed: ${weakResult.reasons.join("; ")}`);
assert.ok(weakResult.reasons.some((reason) => /summary|movement|unsupported|thesis/i.test(reason)));

const missingResult = evaluateLatentMovie(missingThesis, graph);
assert.equal(missingResult.accepted, false, `Movie without rich thesis passed: ${missingResult.reasons.join("; ")}`);
assert.ok(missingResult.reasons.some((reason) => /LatentStoryThesis|semanticTurn|semanticRealization|observer/i.test(reason)));

const strongResult = evaluateLatentMovie(strong, graph);
assert.equal(strongResult.accepted, true, `strong Movie rejected: ${strongResult.reasons.join("; ")}`);
assert.ok(strongResult.signals.thesisStructure >= 0.9);
assert.ok(strongResult.signals.observerContract >= 0.9);

console.log("AUTHOR SEMANTIC GATE ACCEPTANCE: COMPLETE");
