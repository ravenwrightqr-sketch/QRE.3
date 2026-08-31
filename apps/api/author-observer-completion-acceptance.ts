import {
  selectBestMouthSequence,
} from "./src/services/authorMouthSequenceBeamSearch.js";

import type {
  MouthCandidate,
  MouthCandidatePool,
  ViewerStateCut,
} from "@qre/contracts";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const viewerState: ViewerStateCut = {
  beforeState: "baseline",
  afterState: "continuation",
  attentionMove: "interrupt",
  curiosityPressure: 0.8,
  contrast: 0.7,
  interruption: 0.8,
  accumulation: 0.7,
  tempo: 0.5,
  payoffPressure: 0.6,
  stateShift: 0.7,
  predictionError: 0.8,
  evidenceEventIds: ["event-3"],
};

function candidate(
  text: string,
  observerDiscoveryScore: number,
): MouthCandidate {
  return {
    text,
    beatOrder: 3,
    supportedEventIds: ["event-3"],
    supportedRelationPairs: [],
    groundingScore: 0.5,
    meaningScore: 0.7,
    transitionScore: 0.7,
    obligationCoverage: 0.7,
    relationContractScore: 0.7,
    forbiddenMoveRisk: 0,
    cohesionScore: 0.7,
    noveltyScore: 0.9,
    compressionScore: 1,
    inventionRisk: 0,
    repetitionRisk: 0,
    collageRisk: 0,
    endpointExactness: 0,
    observerDiscoveryScore,
    score: 0.7,
    reasons: [
      "semantic-turn-grounded",
      "bounded-creative-bet",
      "approved-semantic-realization",
    ],
  };
}

const pool: MouthCandidatePool = {
  order: 3,
  viewerState,
  nextPromise: "",
  frontier: "",
  candidates: [
    candidate("Unexpected.", 1),
    candidate("The meaning was clear.", 0),
  ],
};

const result = selectBestMouthSequence(
  [pool],
  {
    width: 2,
    candidatesPerBeat: 2,
  },
);

console.log(
  "\n--- OBSERVER COMPLETION ACCEPTANCE ---",
);

console.log(
  `selected=${result.texts[0] ?? "<none>"}`,
);

console.log(
  `score=${result.score}`,
);

assert(
  result.texts.length === 1,
  "expected exactly one selected cut",
);

assert(
  result.texts[0] === "Unexpected.",
  `observer-completion candidate did not win: ${result.texts[0]}`,
);

console.log(
  "PASS · observer completion beats explanatory closure",
);

console.log(
  "--- END OBSERVER COMPLETION ACCEPTANCE ---\n",
);