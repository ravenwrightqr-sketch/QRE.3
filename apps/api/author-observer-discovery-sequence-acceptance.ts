import { selectBestMouthSequence } from "./src/services/authorMouthSequenceBeamSearch.ts";

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
    throw new Error(
      `OBSERVER DISCOVERY SEQUENCE ACCEPTANCE FAILED: ${message}`,
    );
  }
}

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeState(
  beforeState: string,
  afterState: string,
  attentionMove: ViewerStateCut["attentionMove"],
): ViewerStateCut {
  return {
    beforeState,
    afterState,
    attentionMove,

    curiosityPressure: 0.86,
    contrast: 0.72,
    interruption:
      attentionMove === "interrupt"
        ? 0.84
        : 0.28,

    accumulation: 0.82,
    tempo: 0.58,

    payoffPressure:
      attentionMove === "land"
        ? 0.88
        : 0.48,

    stateShift: 0.78,
    predictionError: 0.80,

    evidenceEventIds: [
      "event-1",
      "event-2",
      "event-3",
      "event-4",
      "event-5",
      "event-6",
    ],
  };
}

function makeCandidate(
  text: string,
  beatOrder: number,
  options: {
    observerDiscovery?: number;
    completion?: boolean;
    closure?: boolean;
    supportedEvent?: string;
  } = {},
): MouthCandidate {
  const completion =
    Boolean(
      options.completion,
    );

  const closure =
    Boolean(
      options.closure,
    );

  const observerDiscovery =
    options.observerDiscovery ??
    (
      completion
        ? 1
        : closure
          ? 0.12
          : 0.55
    );

  const supportedEvent =
    options.supportedEvent ??
    `event-${beatOrder}`;

  return {
    text,
    beatOrder,

    supportedEventIds: [
      supportedEvent,
    ],

    supportedRelationPairs: [],

    groundingScore:
      completion
        ? 0.78
        : closure
          ? 0.72
          : 0.76,

    meaningScore:
      closure
        ? 0.86
        : completion
          ? 0.64
          : 0.72,

    transitionScore:
      completion
        ? 0.82
        : 0.74,

    obligationCoverage:
      completion
        ? 1
        : 0.74,

    relationContractScore:
      completion
        ? 1
        : 0.74,

    forbiddenMoveRisk: 0,

    cohesionScore:
      completion
        ? 0.88
        : 0.82,

    noveltyScore:
      completion
        ? 1
        : 0.84,

    compressionScore:
      completion
        ? 1
        : 0.92,

    inventionRisk: 0,

    repetitionRisk: 0,
    collageRisk: 0,

    endpointExactness:
      0,

    observerDiscoveryScore:
      observerDiscovery,

    score:
      completion
        ? 0.74
        : closure
          ? 0.84
          : 0.72,

    reasons: [
      "semantic-turn-grounded",
      "approved-semantic-realization",
      ...(completion
        ? [
            "observer-discovery",
            "experiential-realization",
          ]
        : []),
      ...(closure
        ? [
            "semantic-compression",
          ]
        : []),
    ],
  };
}

function makeOrdinaryPool(
  order: number,
  fact: string,
): MouthCandidatePool {
  return {
    order,

    viewerState:
      makeState(
        order === 1
          ? "the world is newly present"
          : `what was established: ${fact}`,
        `the sequence now includes ${fact}`,
        order === 3
          ? "interrupt"
          : "tighten",
      ),

    nextPromise:
      "What becomes newly perceptible next?",

    frontier:
      "the supplied world remains open",

    candidates: [
      makeCandidate(
        `The supplied ${fact} remained part of the sequence.`,
        order,
        {
          observerDiscovery: 0.28,
          supportedEvent: `event-${order}`,
        },
      ),
    ],
  };
}

function makeFinalPool(): MouthCandidatePool {
  return {
    order: 6,

    viewerState:
      makeState(
        "what was established: lots of attention",
        "a small detail becomes newly perceptible",
        "land",
      ),

    nextPromise:
      "What remains after the supplied ending?",

    frontier:
      "something remains",

    candidates: [
      makeCandidate(
        "The meaning of the day became important.",
        6,
        {
          closure: true,
          observerDiscovery: 0.10,
          supportedEvent: "event-6",
        },
      ),

      makeCandidate(
        "Squirrel.",
        6,
        {
          completion: true,
          observerDiscovery: 1,
          supportedEvent: "event-6",
        },
      ),
    ],
  };
}

type DiscoveryFixture = {
  name: string;
  facts: string[];
  peripheralFact: string;
  completion: string;
};

const fixtures: DiscoveryFixture[] = [
  {
    name: "beach-memory",
    facts: [
      "beach house",
      "played in water",
      "ate bacon",
      "lots of attention",
      "Coco loved the day",
      "squirrel",
    ],
    peripheralFact: "squirrel",
    completion: "Squirrel.",
  },

  {
    name: "dog-walk",
    facts: [
      "walked",
      "Coco sniffed everything",
      "stopped at the corner",
      "kept going",
      "came home",
      "squirrel",
    ],
    peripheralFact: "squirrel",
    completion: "Squirrel.",
  },
];

console.log(
  "--- OBSERVER DISCOVERY SEQUENCE ACCEPTANCE ---",
);

for (
  const fixture of fixtures
) {
  const pools: MouthCandidatePool[] =
    fixture.facts.map(
      (
        fact,
        index,
      ) => {
        const order =
          index + 1;

        const isFinal =
          index ===
          fixture.facts.length - 1;

        if (isFinal) {
          return {
            ...makeFinalPool(),
            order,
            candidates:
              makeFinalPool().candidates.map(
                (
                  candidate,
                ) => ({
                  ...candidate,
                  beatOrder:
                    order,
                  supportedEventIds: [
                    `event-${order}`,
                  ],
                }),
              ),
          };
        }

        return makeOrdinaryPool(
          order,
          fact,
        );
      },
    );

  const result =
    selectBestMouthSequence(
      pools,
      {
        width: 8,
        candidatesPerBeat: 4,
      },
    );

  assert(
    result.candidates.length ===
      fixture.facts.length,
    `${fixture.name}: expected one selected candidate per beat`,
  );

  assert(
    result.texts.length ===
      fixture.facts.length,
    `${fixture.name}: sequence length mismatch`,
  );

  const selectedFinal =
    clean(
      result.texts[
        result.texts.length - 1
      ],
    );

  const sequenceText =
    result.texts
      .map(clean)
      .join(" ");

  console.log(
    `${fixture.name}:`,
  );

  console.log(
    `  selectedFinal="${selectedFinal}"`,
  );

  console.log(
    `  score=${result.score}`,
  );

  console.log(
    `  sequence=${sequenceText}`,
  );

  assert(
    selectedFinal.toLowerCase() ===
      fixture.completion.toLowerCase(),
    `${fixture.name}: observer completion did not emerge; expected "${fixture.completion}", got "${selectedFinal}"`,
  );

  assert(
    sequenceText
      .toLowerCase()
      .includes(
        fixture.peripheralFact.toLowerCase(),
      ),
    `${fixture.name}: peripheral supplied fact "${fixture.peripheralFact}" disappeared`,
  );

  assert(
    result.candidates.some(
      (
        candidate,
      ) =>
        candidate.reasons.includes(
          "observer-discovery",
        ),
    ),
    `${fixture.name}: selected sequence contains no observer-discovery realization`,
  );

  assert(
    result.candidates.every(
      (
        candidate,
      ) =>
        candidate.inventionRisk < 0.35 &&
        candidate.forbiddenMoveRisk < 0.35,
    ),
    `${fixture.name}: sequence contains an unsafe candidate`,
  );
}

console.log(
  "PASS · peripheral supplied facts can re-enter the sequence as observer-discovery without inventing new reality",
);

console.log(
  "--- END OBSERVER DISCOVERY SEQUENCE ACCEPTANCE ---",
);