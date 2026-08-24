import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { buildMovieCognition } from "./src/services/authorMovieCognition.js";

const facts = [
  "Coco entered nervous",
  "Coco got a bath",
  "Coco stole a blue bow",
  "Coco left looking fabulous",
];
const now = "2026-08-23T22:40:00Z";
const entityId = "coco";
const events = facts.map((summary, index) => ({ id: `event-${index + 1}`, type: "supplied_fact", summary, occurredAt: new Date(Date.parse(now) + index * 1000).toISOString(), source: "event" as const, confidence: 1, entityIds: [entityId] }));
const cognitiveState = buildCognitiveState({
  prompt: "Make this attention-grabbing and cinematic. Five lines.",
  subjectTruth: { name: "Coco", kind: "animal", identityFacts: [], provenance: "prompt" },
  memoryContext: {
    assetId: entityId,
    generatedAt: now,
    entities: [{ id: entityId, kind: "animal", name: "Coco", canonicalKey: entityId, confidence: 1, visibility: "shared", createdAt: now, updatedAt: now }],
    facts: facts.map((value, index) => ({ id: `fact-${index + 1}`, entityId, kind: "event" as const, predicate: "experienced", value, confidence: 1, source: "user" as const, status: "active" as const, observedAt: now, visibility: "shared" as const })),
    relations: [],
    events,
  },
  experienceGoal: "identity",
  presentation: "cinematic",
});
const context: CognitiveAuthorContext = {
  cognitiveState,
  domain: { mode: "identity" },
  creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.9 },
  creativeSafety: { class: "ordinary", confidence: 1, evidence: [] },
  provenanceFacts: facts.map((text) => ({ text, provenance: { source: "prompt", permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"], forbiddenExpansions: [] } })),
  identityState: null,
  geo: null,
  presence: { isReturning: false, visitNumber: 1, summary: [], places: [] },
  analytics: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0 },
  media: [],
  authorizedCreativeInstructions: [],
  textBeatTarget: 5,
  photoBeatsAreSilent: true,
};
const input: AuthorBrainTruth = {
  prompt: "Make this attention-grabbing and cinematic. Five lines.",
  subject: "Coco",
  lens: "attention",
  cognitiveContext: context,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  returning: false,
  visitNumber: 1,
  presenceSummary: [],
};

const cognition = buildMovieCognition(input, "");
const beam = cognition.hypotheses.slice(0, 6);
const lenses = new Set(beam.map((item) => item.lens.id));
const operations = new Set(beam.map((item) => item.operation));

console.log("AUTHOR COGNITIVE DIVERSITY ACCEPTANCE");
console.log(`beam=${beam.length}`);
console.log(`lenses=${[...lenses].join(",")}`);
console.log(`operations=${[...operations].join(",")}`);
console.log(`selected=${cognition.selected.lens.id}/${cognition.selected.operation}`);

assert.ok(beam.length >= 4, "creative beam must contain at least four hypotheses");
assert.ok(lenses.size >= 3, `creative beam needs at least three distinct lenses, got ${lenses.size}`);
assert.ok(operations.size >= 3, `creative beam needs at least three distinct operations, got ${operations.size}`);

console.log("AUTHOR COGNITIVE DIVERSITY ACCEPTANCE: PASS");
