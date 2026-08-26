import {
  evaluateAttentionCut,
} from "./src/services/authorMouthAttentionGate.js";

import {
  mouthQualityPenalty,
} from "./src/services/authorMouthCraft.js";

import type {
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
      label: "Coco was groomed at Elm Street Grooming.",
      sourceIds: ["evidence-1"],
      entities: [
        "Coco",
        "Elm Street Grooming",
      ],
    },
    {
      id: "event-2",
      label: "Coco stole the red bow.",
      sourceIds: ["evidence-2"],
      entities: [
        "Coco",
        "red bow",
      ],
    },
  ],
  relations: [],
  suppliedTerms: [
    "coco",
    "was",
    "groomed",
    "at",
    "elm",
    "street",
    "grooming",
    "stole",
    "red",
    "bow",
  ],
  suppliedPhrases: [
    "Coco was groomed at Elm Street Grooming.",
    "Coco stole the red bow.",
  ],
  suppliedEntities: [
    "Coco",
    "Elm Street Grooming",
    "red bow",
  ],
  suppliedActions: [
    "groomed",
    "stole",
  ],
  suppliedStates: [],
  openingEventIds: ["event-1"],
  endpointEventId: "event-2",
  carrierEventIds: ["event-1"],
  unresolvedTensions: [
    "routine grooming becomes a sharper memory through the stolen bow",
  ],
  recurringSignals: [],
  sensorySignals: [],
};

const beat: MouthCandidateBeat = {
  order: 2,
  role: "reframe",
  attentionFunction: "reframe",
  creativeMove: "status-turn",
  realizationMode: "semantic-realization",
  eventIds: [
    "event-1",
    "event-2",
  ],
  change:
    "The stolen bow changes the meaning of the grooming.",
  next:
    "The object carries a new social meaning.",
  frontier:
    "What the stolen bow means after the grooming.",
  setsUp: ["event-1"],
  paysOff: [],
  obligations: [],
  forbiddenMoves: [],
  relationKinds: ["recontextualizes"],
  relationStrength: 0.82,
};

const literal =
  "Coco stole the red bow.";

const semantic =
  "The red bow owned the moment.";
const generic =
  "A special moment.";

const literalAttention =
  evaluateAttentionCut({
    text: literal,
    beat,
    envelope,
  });

const semanticAttention =
  evaluateAttentionCut({
    text: semantic,
    beat,
    envelope,
  });

const genericPenalty =
  mouthQualityPenalty(
    generic,
  );

const semanticPenalty =
  mouthQualityPenalty(
    semantic,
  );

/*
 * The literal line is truthful, but it is a restatement of
 * the exact source event. It should therefore register as
 * source restatement.
 */
assert(
  literalAttention.sourceRestatement > 0,
  "MEANING GATE FAILURE: literal source restatement was not detected.",
);

/*
 * The semantic line should not be treated as a literal
 * restatement of the source event.
 */
assert(
  semanticAttention.sourceRestatement === 0,
  "MEANING GATE FAILURE: semantic realization was misclassified as source restatement.",
);

/*
 * The semantic realization should preserve forward movement.
 */
assert(
  semanticAttention.forwardPull >= 0.5,
  "MEANING GATE FAILURE: semantic realization has insufficient forward pull.",
);

/*
 * Generic cinematic filler must incur a quality penalty.
 */
assert(
  genericPenalty > 0,
  "MEANING GATE FAILURE: generic filler received no quality penalty.",
);

/*
 * A source-specific semantic realization must not receive the
 * generic filler penalty.
 */
assert(
  semanticPenalty <
    genericPenalty,
  "MEANING GATE FAILURE: source-specific semantic realization was treated like generic filler.",
);

/*
 * The semantic line must be compact enough for a moving cut.
 */
assert(
  semanticAttention.independence >= 0.8,
  "MEANING GATE FAILURE: semantic realization is not sufficiently cut-like.",
);

console.log(
  "AUTHOR MEANING EXECUTION ACCEPTANCE: PASS",
);

console.log(
  `LiteralRestatement=${literalAttention.sourceRestatement}`,
);

console.log(
  `SemanticRestatement=${semanticAttention.sourceRestatement}`,
);

console.log(
  `SemanticForwardPull=${semanticAttention.forwardPull}`,
);

console.log(
  `GenericPenalty=${genericPenalty}`,
);

console.log(
  `SemanticPenalty=${semanticPenalty}`,
);