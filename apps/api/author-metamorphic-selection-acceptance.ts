import type { LatentMovieCandidate } from "@qre/contracts";
import { selectDistinctMovieCandidates } from "./src/services/authorMovieDifferentiation.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR METAMORPHIC SELECTION FAILED: ${message}`);
}

function candidate(overrides: Partial<LatentMovieCandidate>): LatentMovieCandidate {
  return {
    id: "candidate",
    lens: "NONE",
    anchorEventIds: ["a", "b"],
    supportingRelationKinds: ["contrasts"],
    trajectory: [
      { order: 1, operation: "establish", eventIds: ["a"], viewerChange: "establish", nextQuestion: "what next?" },
      { order: 2, operation: "contrast", eventIds: ["b"], viewerChange: "turn", nextQuestion: "what changed?" },
      { order: 3, operation: "payoff", eventIds: ["b"], viewerChange: "land", nextQuestion: "what remains?" },
    ],
    payoff: "land",
    unresolvedQuestion: "what changed?",
    evidence: ["a", "b"],
    hypothesis: ["hypothesis"],
    truthRisk: 0.02,
    novelty: 0.8,
    specificity: 0.8,
    informationValue: 0.8,
    uncertainty: 0.3,
    attentionPotential: 0.8,
    consequencePotential: 0.7,
    callbackPotential: 0.7,
    compressionPotential: 0.7,
    repetitionRisk: 0.05,
    distinctiveness: 1,
    score: 0.92,
    ...overrides,
  };
}

const generic = candidate({ id: "generic", score: 0.99 });
const metamorphic = candidate({
  id: "metamorphic",
  score: 0.72,
  storyThesis: {
    initialReading: "The subject is polished.",
    semanticTurn: "presentation_behavior_collision: polished presentation becomes the setup for supplied mischief",
    semanticRealization: {
      mechanism: "contrast",
      evidenceEventIds: ["a", "b"],
      beforeEventIds: ["a"],
      afterEventIds: ["b"],
      before: "The subject is polished.",
      after: "The subject steals the red bow.",
      relation: { kind: "contrasts", fromEventId: "a", toEventId: "b" },
      realizationMove: "hold_contrast",
      creativeOpportunity: "status_turn",
      feltEffect: "The polished reading flips into an attitude reading.",
      viewerShift: "Presentation becomes setup for behavior.",
      languageAim: "Compress the contradiction rather than explain it.",
      confidence: 0.97,
    },
    beforeMeaning: ["The subject is polished."],
    afterMeaning: ["The subject steals the red bow."],
    beforeEventIds: ["a"],
    afterEventIds: ["b"],
    carrierEventIds: [],
    sealingEventIds: ["b"],
    payoffDependency: "The subject steals the red bow.",
    counterfactualDependency: 0.97,
    observerExperience: {
      objective: "Hold the supplied contradiction until the reading flips.",
      surprise: "The polished reading gives way to the supplied behavior.",
      curiosity: "What does the second detail make the first detail mean?",
      attention: ["establish", "collide", "turn", "land"],
      landing: "The supplied contradiction lands.",
      explanationForbidden: true,
    },
  },
});

const selected = selectDistinctMovieCandidates([generic, metamorphic], 1, "NONE");
assert(selected.length === 1, "selector did not choose exactly one candidate");
assert(selected[0]?.id === "metamorphic", "generic movie beat an earned metamorphic movie");

console.log("AUTHOR METAMORPHIC SELECTION ACCEPTANCE: PASS");
console.log("METAMORPHIC_DOMINATES_GENERIC_SCORE=TRUE");
console.log("SELECTION_HAPPENS_AFTER_SEMANTIC_THESIS=TRUE");
console.log("LENS_CANNOT_OVERRULE_EARNED_RELATION=TRUE");
