import assert from "node:assert/strict";
import type { CognitiveAuthorContext, IdentityState, MemoryContext, SubjectTruth } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";
import { buildRealityProvenance } from "./src/services/authorRealityProvenance.js";
import { validateAuthorProvenance } from "./src/services/authorProvenanceGate.js";

const memory: MemoryContext = {
  assetId: "coco",
  generatedAt: "2026-08-23T20:00:00Z",
  entities: [{ id: "coco", kind: "animal", name: "Coco", canonicalKey: "coco", confidence: 1, visibility: "shared", createdAt: "2026-08-23T20:00:00Z", updatedAt: "2026-08-23T20:00:00Z" }],
  facts: [
    { id: "f1", entityId: "coco", kind: "identity", predicate: "is", value: "poodle", confidence: 1, source: "user", status: "active", observedAt: "2026-08-20T20:00:00Z", visibility: "shared" },
    { id: "f2", entityId: "coco", kind: "attribute", predicate: "trait", value: "fierce", confidence: 1, source: "user", status: "active", observedAt: "2026-08-20T20:00:00Z", visibility: "shared" },
    { id: "f3", entityId: "coco", kind: "preference", predicate: "loves", value: "dogs", confidence: 1, source: "user", status: "active", observedAt: "2026-08-20T20:00:00Z", visibility: "shared" },
    { id: "f4", entityId: "coco", kind: "preference", predicate: "loves", value: "bacon", confidence: 1, source: "user", status: "active", observedAt: "2026-08-20T20:00:00Z", visibility: "shared" },
  ],
  relations: [],
  events: [
    { id: "e1", type: "grooming_visit", summary: "Coco came in nervous", occurredAt: "2026-08-23T18:00:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
    { id: "e2", type: "grooming_visit", summary: "Coco got a bath", occurredAt: "2026-08-23T18:05:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
    { id: "e3", type: "grooming_visit", summary: "Coco stole a blue bow", occurredAt: "2026-08-23T18:12:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
    { id: "e4", type: "grooming_visit", summary: "Coco left looking fabulous", occurredAt: "2026-08-23T18:20:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
  ],
};

const subjectTruth: SubjectTruth = { name: "Coco", kind: "animal", identityFacts: ["poodle"], provenance: "memory" };

const tagState = buildCognitiveState({ prompt: "Make a living dog tag for Coco.", subjectTruth, memoryContext: memory, experienceGoal: "identity", presentation: "cinematic" });
const receiptState = buildCognitiveState({ prompt: "Make a grooming receipt movie for Coco.", subjectTruth, memoryContext: memory, experienceGoal: "service_receipt", presentation: "cinematic" });

assert.deepEqual(tagState.facts.map((fact) => fact.id), receiptState.facts.map((fact) => fact.id));
assert.deepEqual(tagState.subject, receiptState.subject);
assert.ok(tagState.facts.some((fact) => fact.value === "bacon"));
assert.ok(tagState.facts.some((fact) => fact.value === "dogs"));
assert.ok(receiptState.events.some((event) => event.summary.includes("stole a blue bow")));
assert.ok(receiptState.events.some((event) => event.summary.includes("left looking fabulous")));
assert.notDeepEqual(tagState.experience.goal, receiptState.experience.goal);

const positiveOnlyFacts = [{ text: "Coco loves dogs.", provenance: buildRealityProvenance("Coco loves dogs.", "memory", { subject: "Coco" }) }];
const inferredNegative = validateAuthorProvenance(["Coco doesn't like humans."], positiveOnlyFacts);
assert.ok(inferredNegative.some((violation) => violation.reason === "unsupported_person"));

const explicitNegativeFacts = [{ text: "Coco doesn't like humans.", provenance: buildRealityProvenance("Coco doesn't like humans.", "prompt", { subject: "Coco" }) }];
assert.equal(validateAuthorProvenance(["Coco doesn't like humans."], explicitNegativeFacts).length, 0);

const identityState = {
  identityId: "coco",
  kind: "pet",
  subject: { value: "Coco", status: "observed", confidence: 1, evidence: [] },
  canonicalFacts: [{ text: "poodle", source: "memory", confidence: 1 }],
  currentState: ["fabulous"],
  traits: [{ text: "fierce", source: "memory", confidence: 1 }],
  preferences: [{ text: "loves dogs", source: "memory", confidence: 1 }, { text: "loves bacon", source: "memory", confidence: 1 }],
  activities: [],
  relationships: [],
  history: [],
  recentEvents: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  recurringPatterns: [],
  goals: [],
  intentions: [],
  unresolvedQuestions: [],
  locations: [],
  activeContext: "groomer",
  behavioralLearning: { scans: 1, completions: 1, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 1, friction: 0, accepted: [], rejected: [], preferences: [] },
  creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.5 },
  entityStates: [],
  sourceMemoryCount: 4,
  sourceEventCount: 4,
  confidence: 1,
  generatedAt: memory.generatedAt,
} as unknown as IdentityState;

const context: CognitiveAuthorContext = {
  identityState,
  cognitiveState: receiptState,
  provenanceFacts: [
    { text: "poodle", provenance: buildRealityProvenance("poodle", "memory", { subject: "Coco" }) },
    { text: "loves dogs", provenance: buildRealityProvenance("loves dogs", "memory", { subject: "Coco" }) },
    { text: "loves bacon", provenance: buildRealityProvenance("loves bacon", "memory", { subject: "Coco" }) },
  ],
  textBeatTarget: 4,
  photoBeatsAreSilent: true,
};

const run = await authorMoviePipeline({
  prompt: "Create a grooming receipt movie for Coco.",
  subject: "Coco",
  cognitiveContext: context,
  facts: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  sourceMoments: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  memoryContext: [],
  trajectory: [],
});

assert.equal(run.authored.diagnostics.modelCalls, 1);
assert.equal(run.authored.diagnostics.rejectedOutputNeverRendered, true);
assert.equal(run.authored.diagnostics.renderable, true);
assert.equal(run.movieBeatPlan.beats.filter((beat) => beat.kind === "text").length, 4);
const rendered = run.movieBeatPlan.beats.map((beat) => beat.text).join(" | ");
assert.doesNotMatch(rendered, /INTENT\s*:|DOMAIN\s*:|KNOWN ASSET FACTS|CURRENT FACTS|second meaning|according to QRE/i);
assert.doesNotMatch(rendered, /doesn't like humans|hates humans|not humans/i);

console.log("AUTHOR SEMANTIC FULL-CIRCLE ACCEPTANCE: PASS");
console.log(`subjectFacts=${tagState.facts.length}`);
console.log(`receiptEvents=${receiptState.events.length}`);
console.log(`tagGoal=${tagState.experience.goal}`);
console.log(`receiptGoal=${receiptState.experience.goal}`);
console.log(`modelCalls=${run.authored.diagnostics.modelCalls}`);
console.log(`renderedBeats=${run.movieBeatPlan.beats.filter((beat) => beat.kind === "text").length}`);
console.log(`renderable=${run.authored.diagnostics.renderable}`);
