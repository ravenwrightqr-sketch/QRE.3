import { isAuthorizedMouthCandidate, selectBestMouthSequence } from "./src/services/authorMouthSequenceBeamSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`SATANICO FAST CALIBRATION FAILED: ${message}`);
}

const candidate = (text: string, beatOrder: number, overrides: Record<string, unknown> = {}) =>
  ({
    text,
    beatOrder,
    inventionRisk: 0,
    forbiddenMoveRisk: 0,
    groundingScore: 0.82,
    obligationCoverage: 0.82,
    meaningScore: 0.82,
    observerDiscoveryScore: 0.88,
    transitionScore: 0.86,
    compressionScore: 0.9,
    noveltyScore: 0.82,
    endpointExactness: 1,
    score: 0.82,
    supportedEventIds: [`event-${beatOrder}`],
    supportedRelationPairs: [],
    reasons: ["semantic-turn-grounded", "bounded-creative-bet", "distinctive-realization"],
    ...overrides,
  }) as any;

const state = (beforeState: string, afterState: string, nextPromise: string) =>
  ({
    beforeState,
    afterState,
    stateShift: 0.8,
    predictionError: 0.72,
    curiosityPressure: 0.82,
    contrast: 0.7,
    interruption: 0.55,
    accumulation: 0.72,
    attentionMove: "advance",
    accepted: true,
  }) as any;

const pools = [
  {
    order: 1,
    viewerState: state("nothing started", "the kitchen is cleared", "bathrooms"),
    nextPromise: "bathrooms",
    frontier: "bathrooms",
    candidates: [
      candidate("BOOTING ROUND 1", 1),
      candidate("Author chapter: establish → contrast → reveal → payoff", 1, {
        reasons: ["semantic-turn-grounded", "bounded-creative-bet", "internal-viewer-state-language"],
      }),
    ],
  },
  {
    order: 2,
    viewerState: state("the kitchen is cleared", "two bathrooms are cleared", "final inspection"),
    nextPromise: "final inspection",
    frontier: "final inspection",
    candidates: [
      candidate("SUPER LEVEL UP", 2),
      candidate("future:event-9", 2, { reasons: ["semantic-turn-grounded", "bounded-creative-bet", "internal-viewer-state-language"] }),
    ],
  },
  {
    order: 3,
    viewerState: state("two bathrooms are cleared", "Elm House is cleared", "next round"),
    nextPromise: "next round",
    frontier: "next round",
    candidates: [
      candidate("ELM HOUSE CLEARED", 3),
      candidate("Reality anchors: kitchen | bathrooms | house", 3, { reasons: ["semantic-turn-grounded", "bounded-creative-bet", "internal-viewer-state-language"] }),
    ],
  },
];

const result = selectBestMouthSequence(pools as any, { width: 4, candidatesPerBeat: 4 });

assert(result.candidates.length === 3, `expected 3 selected cuts, got ${result.candidates.length}`);
assert(!result.texts.some((text) => /occurred:|future:event-|author chapter|reality anchors/i.test(text)), "internal language survived selection");
assert(result.texts[0] === "BOOTING ROUND 1", `expected creative first cut, got ${result.texts[0]}`);
assert(result.texts[1] === "SUPER LEVEL UP", `expected creative second cut, got ${result.texts[1]}`);
assert(result.texts[2] === "ELM HOUSE CLEARED", `expected grounded payoff, got ${result.texts[2]}`);
assert(result.score > 0.5, `expected nontrivial sequence score, got ${result.score}`);

const unsafe = candidate("future:event-9", 99, {
  reasons: ["internal-viewer-state-language", "bounded-creative-bet"],
});
assert(isAuthorizedMouthCandidate(unsafe) === false, "internal machine language was authorized");

console.log("--- SATANICO FAST CALIBRATION ---");
console.log(`USER SEES`);
for (const [index, text] of result.texts.entries()) console.log(`${index + 1}. ${text}`);
console.log(`score=${result.score}`);
console.log("PASS · Beam rejects internal language and selects creative grounded sequence in fast mode");
