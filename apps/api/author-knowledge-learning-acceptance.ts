import assert from "node:assert/strict";
import { persistExplicitAuthorEvidence } from "./src/services/authorLearningLoop.js";

let written: any = null;
let tracked: any = null;

const memoryRepository = {
  async writeBatch(batch: any) {
    written = batch;
  },
};
const analyticsRepository = {
  async trackEvent(event: any) {
    tracked = event;
  },
};

const result = await persistExplicitAuthorEvidence(
  {
    assetId: "knowledge-learning-acceptance",
    userId: "user-knowledge-acceptance",
    text: "kitchen wall paint: Sherwin-Williams Alabaster SW 7008",
    predicate: "kitchen wall paint",
    value: "Sherwin-Williams Alabaster SW 7008",
    sourceRef: "knowledge-row-1",
    metadata: { category: "materials", hasMedia: true },
  },
  { memoryRepository: memoryRepository as any, analyticsRepository: analyticsRepository as any },
);

assert.ok(written);
assert.ok(tracked);
assert.equal(written.assetId, "knowledge-learning-acceptance");
assert.equal(written.userId, "user-knowledge-acceptance");
assert.equal(written.facts.length, 1);
assert.equal(written.facts[0].predicate, "kitchen wall paint");
assert.equal(written.facts[0].value, "Sherwin-Williams Alabaster SW 7008");
assert.equal(written.facts[0].source, "user");
assert.equal(written.facts[0].sourceRef, "knowledge-row-1");
assert.equal(written.events.length, 1);
assert.equal(written.events[0].type, "explicit_evidence_added");
assert.equal(tracked.type, "AUTHOR_INPUT_ACCEPTED");
assert.equal(tracked.meta.source, "explicit_evidence");
assert.equal(result.analyticsType, "AUTHOR_INPUT_ACCEPTED");

console.log("AUTHOR KNOWLEDGE LEARNING ACCEPTANCE: PASS");
console.log(`fact=${written.facts[0].predicate}:${written.facts[0].value}`);
console.log(`source=${written.facts[0].source}`);
console.log(`learning=${tracked.type}`);
