import assert from "node:assert/strict";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCognitionIntelligence } from "./src/services/authorCognitionIntelligence.js";

const housekeepingFacts = [
  "Maria cleaned the kitchen",
  "Maria cleaned bathroom one",
  "Maria cleaned bathroom two",
];

const cocoFacts = [
  "Coco arrived dirty",
  "Coco became clean",
  "Coco wore a blue bow",
  "Coco's parent picked her up",
];

const returnFacts = [
  "Paul played the same song every Sunday",
  "Paul kept every birthday card",
  "Paul is gone",
];

const housekeepingGraph = buildAuthorRealityGraph({
  prompt: housekeepingFacts.join(" / "),
  subject: "Maria",
  facts: housekeepingFacts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});
const cocoGraph = buildAuthorRealityGraph({
  prompt: cocoFacts.join(" / "),
  subject: "Coco",
  facts: cocoFacts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});
const returnGraph = buildAuthorRealityGraph({
  prompt: returnFacts.join(" / "),
  subject: "Paul",
  facts: returnFacts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: ["previous experience used a ritual/callback reading"],
});

const housekeeping = buildAuthorCognitionIntelligence(housekeepingGraph, false);
const coco = buildAuthorCognitionIntelligence(cocoGraph, false, ["LEARNED_PREFERENCE: callbacks", "AUTO_LEARNED_WINNER: compact surprise"]);
const returning = buildAuthorCognitionIntelligence(returnGraph, true);

assert.equal(housekeeping.evidence.eventCount, housekeepingFacts.length);
assert.equal(housekeeping.evidence.timeCount, 0);
assert.ok(housekeeping.compositionRules.some((rule) => /do not shorten/i.test(rule)));
assert.ok(housekeeping.compositionRules.some((rule) => /timestamp|geo|media/i.test(rule)));
assert.ok(housekeeping.semanticSignals.some((signal) => /event-level distinctiveness|relationship/i.test(signal)));
assert.ok(housekeeping.decisionRules.some((rule) => /caption reel/i.test(rule)));
assert.ok(housekeeping.antiFailureChecks.some((rule) => /CAPTION_REEL/i.test(rule)));
assert.ok(housekeeping.antiFailureChecks.some((rule) => /METADATA_NARRATION/i.test(rule)));

assert.equal(coco.evidence.eventCount, cocoFacts.length);
assert.ok(coco.candidateMoves.every((move) => move.eventIds.every((id) => cocoGraph.events.some((event) => event.id === id))));
assert.ok(coco.attention.some((line) => /information density/i.test(line)));
assert.ok(coco.compositionRules.some((rule) => /generic routine|chronological montage/i.test(rule)));
assert.ok(coco.learnedPreferenceSignals.some((line) => /callbacks|surprise/i.test(line)));
assert.ok(coco.decisionRules.some((rule) => /semantic relationships over event coverage/i.test(rule)));

assert.equal(returning.evidence.eventCount, returnFacts.length);
assert.ok(returning.semanticSignals.some((signal) => /return/i.test(signal)));
assert.ok(returning.compositionRules.some((rule) => /new reading|repeat/i.test(rule)));
assert.ok(returning.antiFailureChecks.some((rule) => /RETURN_REPLAY/i.test(rule)));

console.log("HOUSEKEEPING INTELLIGENCE: PASS");
console.log("COCO INTELLIGENCE + LEARNING: PASS");
console.log("RETURN INTELLIGENCE: PASS");
console.log("ANTI-CAPTION / ANTI-METADATA / ANTI-REPLAY: PASS");
console.log("AUTHOR COGNITION INTELLIGENCE: COMPLETE");
