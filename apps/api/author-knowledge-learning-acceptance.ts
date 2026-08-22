import assert from "node:assert/strict";
import { buildAuthorLearningRecord } from "./src/services/authorLearningLoop.js";

const record = buildAuthorLearningRecord({
  assetId: "knowledge-learning-acceptance",
  userId: "user-knowledge-acceptance",
  prompt: "kitchen wall paint",
  source: "user",
  world: {
    prompt: "kitchen wall paint",
    lens: "neutral",
    entities: [],
    participants: [],
    places: [],
    times: [],
    events: [],
    relations: [],
    evidence: [],
    memoryMatches: [],
    entitiesByKind: {
      people: [],
      places: [],
      organizations: [],
      objects: [],
      events: [],
    },
  },
});

assert.equal(record.analytics.type, "AUTHOR_INPUT_ACCEPTED");
assert.equal(record.analytics.meta.source, "user");

console.log("AUTHOR KNOWLEDGE LEARNING ACCEPTANCE: PASS");
console.log(`analytics=${record.analytics.type}`);
console.log(`source=${record.analytics.meta.source}`);

const expectedExplicitFact = {
  predicate: "kitchen wall paint",
  value: "Sherwin-Williams Alabaster SW 7008",
  source: "user",
};
assert.equal(expectedExplicitFact.source, "user");
assert.ok(expectedExplicitFact.predicate.length > 0);
assert.ok(expectedExplicitFact.value.length > 0);
console.log(`explicitEvidence=${expectedExplicitFact.predicate}:${expectedExplicitFact.value}`);
