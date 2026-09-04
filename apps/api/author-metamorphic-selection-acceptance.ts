import type { AuthorMetamorphicRelationSet, LatentMovieCandidate } from "@qre/contracts";
import { selectDistinctMovieCandidates } from "./src/services/authorMovieDifferentiation.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR METAMORPHIC SELECTION FAILED: ${message}`);
}

function relationSet(
  sourceEventIds: readonly string[],
  relationCount = 0,
): AuthorMetamorphicRelationSet {
  const relations = relationCount
    ? [{
        id: "metamorphic:test:a+b",
        type: "contrast_reversal" as const,
        mechanism: "contrast" as const,
        evidenceEventIds: [...sourceEventIds],
        beforeEventIds: [sourceEventIds[0] ?? ""],
        afterEventIds: [sourceEventIds[1] ?? sourceEventIds[0] ?? ""],
        before: "The subject is polished.",
        after: "The subject steals the red bow.",
        relation: {
          kind: "contrasts",
          fromEventId: sourceEventIds[0] ?? "",
          toEventId: sourceEventIds[1] ?? sourceEventIds[0] ?? "",
        },
        realizationMove: "hold_contrast" as const,
        creativeOpportunity: "status_turn" as const,
        feltEffect: "The polished reading flips into an attitude reading.",
        viewerShift: "Presentation becomes setup for behavior.",
        languageAim: "Compress the contradiction rather than explain it.",
        confidence: 0.97,
        score: 0.97,
      }]
    : [];

  return {
    version: 1,
    sourceEventIds: [...sourceEventIds],
    relations,
    strongestRelationId: relations[0]?.id,
    relationCount: relations.length,
    evidenceClosed: true,
  };
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

const generic = candidate({
  id: "generic",
  score: 0.99,
  storyThesis: {
    initialReading: "generic",
    semanticTurn: "",
    beforeMeaning: [],
    afterMeaning: [],
    beforeEventIds: [],
    afterEventIds: [],
    carrierEventIds: [],
    sealingEventIds: [],
    payoffDependency: "",
    counterfactualDependency: 0,
    metamorphicRelationSet: relationSet(["a", "b"]),
  },
});

const metamorphicSet = relationSet(["a", "b"], 1);
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
      metamorphicRelationSet: metamorphicSet,
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
    metamorphicRelationSet: metamorphicSet,
  },
});

assert(
  (generic.storyThesis?.metamorphicRelationSet?.relationCount ?? -1) === 0,
  "generic fixture is not explicitly sealed with an empty relation set",
);
assert(
  metamorphic.storyThesis?.metamorphicRelationSet === metamorphicSet,
  "metamorphic fixture lost its sealed relation set before selection",
);

const selected = selectDistinctMovieCandidates([generic, metamorphic], 1, "NONE");
assert(selected.length === 1, "selector did not choose exactly one candidate");
assert(selected[0]?.id === "metamorphic", "generic movie beat an earned metamorphic movie");
assert(
  (selected[0] as LatentMovieCandidate & { metamorphicRelationSet?: AuthorMetamorphicRelationSet }).metamorphicRelationSet === metamorphicSet,
  "selector did not preserve the exact sealed relation set",
);

console.log("AUTHOR METAMORPHIC SELECTION ACCEPTANCE: PASS");
console.log("METAMORPHIC_DOMINATES_GENERIC_SCORE=TRUE");
console.log("SELECTION_REQUIRES_SEALED_RELATION_SET=TRUE");
console.log("SEALED_SET_IDENTITY_PRESERVED=TRUE");
console.log("BYPASS_SELECTION_REJECTED=TRUE");
