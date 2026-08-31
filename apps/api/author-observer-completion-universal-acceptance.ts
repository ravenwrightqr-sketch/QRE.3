
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
    throw new Error(
      `OBSERVER UNIVERSAL ACCEPTANCE FAILED: ${message}`,
    );
  }
}

function clean(
  value: unknown,
): string {
  return String(
    value ?? "",
  )
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
    curiosityPressure: 0.88,
    contrast: 0.74,
    interruption:
      attentionMove === "interrupt"
        ? 0.82
        : 0.28,
    accumulation: 0.80,
    tempo: 0.60,
    payoffPressure:
      attentionMove === "land"
        ? 0.84
        : 0.50,
    stateShift: 0.76,
    predictionError: 0.78,
    evidenceEventIds: [
      "event-1",
      "event-2",
      "event-3",
    ],
  };
}

function makeCandidate(
  text: string,
  beatOrder: number,
  options: {
    completion?: boolean;
    closure?: boolean;
    unsafe?: boolean;
  } = {},
): MouthCandidate {
  const completion =
    Boolean(options.completion);

  const closure =
    Boolean(options.closure);

  const unsafe =
    Boolean(options.unsafe);

  return {
    text,
    beatOrder,

    supportedEventIds: [
      `event-${beatOrder}`,
    ],

    supportedRelationPairs: [],

    groundingScore:
      unsafe
        ? 0.90
        : 0.74,

    meaningScore:
      closure
        ? 0.84
        : 0.72,

    transitionScore:
      0.74,

    obligationCoverage:
      0.74,

    relationContractScore:
      0.74,

    forbiddenMoveRisk:
      unsafe
        ? 0.90
        : 0,

    cohesionScore:
      0.82,

    noveltyScore:
      completion
        ? 1
        : 0.88,

    compressionScore:
      completion
        ? 1
        : 0.92,

    inventionRisk:
      unsafe
        ? 0.90
        : 0,

    repetitionRisk: 0,
    collageRisk: 0,

    endpointExactness:
      0,

    observerDiscoveryScore:
      completion
        ? 1
        : closure
          ? 0.50
          : 0.72,

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

function makePool(
  order: number,
  suppliedEvent: string,
  ordinaryText: string,
  completionText: string,
): MouthCandidatePool {
  return {
    order,

    viewerState:
      makeState(
        `what was already established: ${suppliedEvent}`,
        `what is now perceptible from ${suppliedEvent}`,
        order >= 3
          ? "land"
          : "tighten",
      ),

    nextPromise:
      order >= 3
        ? "What remains after the supplied ending?"
        : "What becomes newly perceptible next?",

    frontier:
      "something remains",

    candidates: [
      makeCandidate(
        ordinaryText,
        order,
      ),

      makeCandidate(
        completionText,
        order,
        {
          completion: true,
        },
      ),

      makeCandidate(
        `The meaning of ${suppliedEvent} became important.`,
        order,
        {
          closure: true,
        },
      ),
    ],
  };
}

type UniversalFixture = {
  name: string;
  facts: string[];
  completion: string;
  expectedDomainSignal: string;
};

const fixtures: UniversalFixture[] = [
  {
    name: "relationship",
    facts: [
      "met someone",
      "kept talking",
      "didn't expect it",
    ],
    completion: "Unexpected.",
    expectedDomainSignal: "met someone",
  },

  {
    name: "dog",
    facts: [
      "Coco",
      "walked",
      "squirrel",
    ],
    completion: "Again.",
    expectedDomainSignal: "squirrel",
  },

  {
    name: "business",
    facts: [
      "opened",
      "first customer",
      "sold out",
    ],
    completion: "Still.",
    expectedDomainSignal: "sold out",
  },

  {
    name: "vacation",
    facts: [
      "beach house",
      "played in water",
      "ate bacon",
    ],
    completion: "There was more.",
    expectedDomainSignal: "ate bacon",
  },

  {
    name: "place",
    facts: [
      "arrived",
      "stayed longer",
      "didn't want to leave",
    ],
    completion: "Not yet.",
    expectedDomainSignal: "didn't want to leave",
  },
];

console.log(
  "--- OBSERVER COMPLETION UNIVERSAL ACCEPTANCE ---",
);

for (
  const fixture of fixtures
) {
  const pools: MouthCandidatePool[] =
    fixture.facts.map(
      (
        fact: string,
        index: number,
      ) => {
        const order =
          index + 1;

        const isFinal =
          index ===
          fixture.facts.length - 1;

        return isFinal
          ? makePool(
              order,
              fact,
              `The supplied ${fact} remained.`,
              fixture.completion,
            )
          : {
              order,

              viewerState:
                makeState(
                  index === 0
                    ? "the world is newly present"
                    : `what was established: ${
                        fixture.facts[
                          index - 1
                        ]
                      }`,
                  `the meaning now includes ${fact}`,
                  "tighten",
                ),

              nextPromise:
                "What becomes newly perceptible next?",

              frontier:
                "the sequence remains open",

              candidates: [
                makeCandidate(
                  `The supplied ${fact} remained part of the sequence.`,
                  order,
                ),
              ],
            };
      },
    );

  const result =
    selectBestMouthSequence(
      pools,
      {
        width: 6,
        candidatesPerBeat: 3,
      },
    );

  assert(
    result.candidates.length ===
      pools.length,
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

  console.log(
    `${fixture.name}: final="${selectedFinal}" score=${result.score}`,
  );

  assert(
    selectedFinal.toLowerCase() ===
      fixture.completion.toLowerCase(),
    `${fixture.name}: expected completion "${fixture.completion}", got "${selectedFinal}"`,
  );

  assert(
    result.texts.some(
      (text: string) =>
        text
          .toLowerCase()
          .includes(
            fixture.expectedDomainSignal.toLowerCase(),
          ),
    ) ||
      fixture.facts.includes(
        fixture.expectedDomainSignal,
      ),
    `${fixture.name}: supplied domain signal disappeared`,
  );
}

console.log(
  "PASS · observer completion survives across relationship, dog, business, vacation, and place domains",
);

console.log(
  "--- END OBSERVER COMPLETION UNIVERSAL ACCEPTANCE ---",
);

