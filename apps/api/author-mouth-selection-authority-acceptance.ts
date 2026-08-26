import {
  adaptMouthCandidatePool,
} from "./src/services/authorMouthQualityAdapter.js";

import {
  selectBestMouthSequence,
} from "./src/services/authorMouthSequenceBeamSearch.js";

import type {
  MouthCandidate,
  MouthCandidateBeat,
} from "@qre/contracts";

import type {
  RealityEnvelope,
} from "./src/services/authorRealityEnvelope.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const envelope: RealityEnvelope = {
  subject: "Coco",

  events: [
    {
      id: "event-1",
      label: "Coco stole the red bow.",
      sourceIds: ["evidence-1"],
      entities: ["Coco", "red bow"],
    },
  ],

  relations: [],

  suppliedTerms: [
    "coco",
    "stole",
    "red",
    "bow",
  ],

  suppliedPhrases: [
    "Coco stole the red bow.",
  ],

  suppliedEntities: [
    "Coco",
    "red bow",
  ],

  suppliedActions: [
    "stole",
  ],

  suppliedStates: [],

  openingEventIds: [
    "event-1",
  ],

  endpointEventId:
    "event-1",

  carrierEventIds: [],

  unresolvedTensions: [],
  recurringSignals: [],
  sensorySignals: [],
};

const beat: MouthCandidateBeat = {
  order: 1,
  role: "reframe",
  attentionFunction: "reframe",
  creativeMove: "status-turn",
  realizationMode: "semantic-realization",
  eventIds: [
    "event-1",
  ],
  change:
    "The stolen bow changes the reading of the moment.",
  next:
    "The object now carries a sharper meaning.",
  frontier:
    "What the stolen bow means now.",
  setsUp: [],
  paysOff: [],
  obligations: [],
  forbiddenMoves: [],
  relationKinds: [],
  relationStrength: 0,
};

function candidate(
  text: string,
  overrides: Partial<MouthCandidate> = {},
): MouthCandidate {
  return {
    text,
    beatOrder: beat.order,

    supportedEventIds: [
      "event-1",
    ],

    supportedRelationPairs: [],

    groundingScore: 0.9,
    meaningScore: 0.9,
    transitionScore: 0.9,
    obligationCoverage: 0.9,
    relationContractScore: 0.9,
    compressionScore: 0.9,
    cohesionScore: 0.9,
    noveltyScore: 0.9,

    repetitionRisk: 0,

    inventionRisk: 0,
    forbiddenMoveRisk: 0,
    collageRisk: 0,
    endpointExactness: 0,
    score: 0.9,

    reasons: [
      "semantic-turn-grounded",
    ],

    ...overrides,
  };
}

/*
 * 1. A semantic interpretation is legal.
 */
const semantic =
  candidate(
    "The red bow owned the moment.",
  );

const semanticPool =
  adaptMouthCandidatePool({
    candidates: [
      semantic,
    ],
    beat,
    envelope,
  });

assert(
  semanticPool.some(
    (item) =>
      item.text ===
      semantic.text,
  ),
  "MOUTH AUTHORITY FAILURE: grounded semantic realization was rejected.",
);

/*
 * 2. An invented physical reaction must not survive.
 */
const inventedAction =
  candidate(
    "Coco smiled at the groomer.",
    {
      supportedEventIds: [],
      groundingScore: 0,
      meaningScore: 0,
      transitionScore: 0,
      obligationCoverage: 0,
      relationContractScore: 0,
      reasons: [],
      inventionRisk: 0,
    },
  );

const actionPool =
  adaptMouthCandidatePool({
    candidates: [
      inventedAction,
    ],
    beat,
    envelope,
  });

assert(
  !actionPool.some(
    (item) =>
      item.text ===
      inventedAction.text,
  ),
  "MOUTH AUTHORITY LEAK: invented reaction survived candidate authorization.",
);

/*
 * 3. An invented physical setting must not survive.
 */
const inventedSetting =
  candidate(
    "The bow sat on the table.",
    {
      supportedEventIds: [],
      groundingScore: 0,
      meaningScore: 0,
      transitionScore: 0,
      obligationCoverage: 0,
      relationContractScore: 0,
      reasons: [],
      inventionRisk: 0,
    },
  );

const settingPool =
  adaptMouthCandidatePool({
    candidates: [
      inventedSetting,
    ],
    beat,
    envelope,
  });

assert(
  !settingPool.some(
    (item) =>
      item.text ===
      inventedSetting.text,
  ),
  "MOUTH AUTHORITY LEAK: invented setting survived candidate authorization.",
);

/*
 * 4. Final selection may only choose surviving candidates.
 */
const mixedPool =
  adaptMouthCandidatePool({
    candidates: [
      inventedAction,
      inventedSetting,
      semantic,
    ],
    beat,
    envelope,
  });

const selected =
  selectBestMouthSequence(
    [
      {
        order: 1,
        candidates: mixedPool,
      },
    ],
    {
      width: 12,
      candidatesPerBeat: 8,
    },
  );

assert(
  selected.texts.length === 1,
  "MOUTH SELECTION FAILURE: expected exactly one selected realization.",
);
const selectedText =
  selected.texts[0] ?? "";

assert(
  [
    semantic.text,
    "Coco stole the red bow.",
  ].includes(selectedText),
  `MOUTH SELECTION FAILURE: selected unauthorized candidate: "${selectedText}"`,
);

assert(
  !/smiled|sat on the table/i.test(
    selectedText,
  ),
  "MOUTH SELECTION LEAK: invented concrete realization reached final sequence.",
);

console.log(
  "AUTHOR MOUTH SELECTION AUTHORITY ACCEPTANCE: PASS",
);

console.log(
  `AcceptedSemantic="${semantic.text}"`,
);

console.log(
  `Selected="${selected.texts[0] ?? ""}"`,
);