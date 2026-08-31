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
`OBSERVER COMPLETION ACCEPTANCE FAILED: ${message}`,
);
}
}

function candidate(
text: string,
options: {
beatOrder: number;
observerDiscoveryScore?: number;
groundingScore?: number;
meaningScore?: number;
transitionScore?: number;
score?: number;
reasons?: string[];
inventionRisk?: number;
forbiddenMoveRisk?: number;
endpointExactness?: number;
},
): MouthCandidate {
return {
text,
beatOrder: options.beatOrder,


supportedEventIds: [
  `event-${options.beatOrder}`,
],

supportedRelationPairs: [],

groundingScore:
  options.groundingScore ??
  0.72,

meaningScore:
  options.meaningScore ??
  0.72,

transitionScore:
  options.transitionScore ??
  0.72,

obligationCoverage: 0.72,
relationContractScore: 0.72,

forbiddenMoveRisk:
  options.forbiddenMoveRisk ??
  0,

cohesionScore: 0.80,

noveltyScore: 0.90,

compressionScore: 1,

inventionRisk:
  options.inventionRisk ??
  0,

repetitionRisk: 0,
collageRisk: 0,

endpointExactness:
  options.endpointExactness ??
  0,

observerDiscoveryScore:
  options.observerDiscoveryScore ??
  0.90,

score:
  options.score ??
  0.72,

reasons: [
  "semantic-turn-grounded",
  "approved-semantic-realization",
  ...(options.reasons ?? []),
],


};
}

function state(
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
    ? 0.80
    : 0.30,

accumulation: 0.78,
tempo: 0.62,
payoffPressure:
  attentionMove === "land"
    ? 0.82
    : 0.52,

stateShift: 0.74,
predictionError: 0.76,

evidenceEventIds: [
  "event-1",
  "event-2",
  "event-3",
],


};
}

function pool(
order: number,
candidates: MouthCandidate[],
attentionMove: ViewerStateCut["attentionMove"] = "interrupt",
): MouthCandidatePool {
return {
order,


viewerState: state(
  "meaning already established",
  "meaning remains open",
  attentionMove,
),

nextPromise:
  "What becomes newly perceptible next?",

frontier:
  "something remains unresolved",

candidates,


};
}

const completionLines = [
"Unexpected.",
"Still.",
"Enough.",
"Again.",
"Not yet.",
"It remained.",
"There was more.",
] as const;

const explanatoryClosures = [
"The meaning was clear.",
"This showed the relationship was important.",
"The connection became meaningful.",
"This revealed why it mattered.",
"The observer understood the lesson.",
] as const;

console.log(
"--- OBSERVER COMPLETION SEQUENCE ACCEPTANCE ---",
);

for (
let index = 0;
index < completionLines.length;
index += 1
) {
const completion =
completionLines[index];

const closure =
explanatoryClosures[
index % explanatoryClosures.length
];

const completionCandidate =
candidate(
completion,
{
beatOrder: 3,
observerDiscoveryScore: 1,
groundingScore: 0.72,
meaningScore: 0.72,
transitionScore: 0.72,
score: 0.72,
reasons: [
"observer-discovery",
"experiential-realization",
],
},
);

const closureCandidate =
candidate(
closure,
{
beatOrder: 3,
observerDiscoveryScore: 0.55,
groundingScore: 0.72,
meaningScore: 0.84,
transitionScore: 0.72,
score: 0.84,
reasons: [
"semantic-compression",
],
},
);

const selected =
selectBestMouthSequence([
pool(
3,
[
completionCandidate,
closureCandidate,
],
"land",
),
]);

const selectedText =
selected.texts[0] ?? "";

console.log(
`candidate="${completion}" selected="${selectedText}" score=${selected.score}`,
);

assert(
selectedText.toLowerCase() ===
completion.toLowerCase(),
`expected observer completion "${completion}" to beat explanatory closure "${closure}", got "${selectedText}"`,
);
}

console.log(
"PASS · observer completion forms beat explanatory closure",
);

const unsafeCompletion =
candidate(
"Unexpected.",
{
beatOrder: 3,
observerDiscoveryScore: 1,
groundingScore: 0.90,
meaningScore: 0.90,
transitionScore: 0.90,
score: 1,
inventionRisk: 0.90,
reasons: [
"observer-discovery",
],
},
);

const safeClosure =
candidate(
"The supplied ending remained.",
{
beatOrder: 3,
observerDiscoveryScore: 0.10,
groundingScore: 0.72,
meaningScore: 0.72,
transitionScore: 0.72,
score: 0.72,
},
);

const unsafeSelection =
selectBestMouthSequence([
pool(
3,
[
unsafeCompletion,
safeClosure,
],
"land",
),
]);

assert(
unsafeSelection.texts[0] !==
"Unexpected.",
"observer completion must never rescue an unsafe candidate",
);

console.log(
"PASS · observer completion does not bypass safety",
);

console.log(
"--- END OBSERVER COMPLETION SEQUENCE ACCEPTANCE ---",
);
