import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

const subject = "Maria";
const prompt =
  "Turn this housekeeping work into an attention-grabbing customer receipt. Keep every factual detail grounded and make it play as a short sequence.";

const facts = [
  "Maria arrived at 9:04 AM",
  "Maria cleaned the living room",
  "Maria cleaned the kitchen",
  "Maria left at 11:00 AM",
];

const cognitiveState = buildCognitiveState({
  prompt,
  subjectTruth: {
    name: subject,
    kind: "person",
    identityFacts: [],
    provenance: "prompt",
  },
  memoryContext: {
    assetId: "qre-realization-acceptance",
    generatedAt: new Date().toISOString(),
    entities: [{
      id: "maria",
      kind: "person",
      name: "Maria",
      canonicalKey: "maria",
      confidence: 1,
      visibility: "shared",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }],
    facts: facts.map((text, index) => ({
      id: `fact-${index + 1}`,
      entityId: "maria",
      kind: "event" as const,
      predicate: "did",
      value: text,
      confidence: 1,
      source: "user" as const,
      status: "active" as const,
      observedAt: new Date().toISOString(),
      visibility: "shared" as const,
    })),
    relations: [],
    events: [
      { id: "event-1", type: "arrival", summary: "Maria arrived at 9:04 AM", occurredAt: "2026-08-23T16:04:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
      { id: "event-2", type: "service", summary: "Maria cleaned the living room", occurredAt: "2026-08-23T16:30:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
      { id: "event-3", type: "service", summary: "Maria cleaned the kitchen", occurredAt: "2026-08-23T17:15:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
      { id: "event-4", type: "departure", summary: "Maria left at 11:00 AM", occurredAt: "2026-08-23T18:00:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
    ],
  },
  experienceGoal: "service_receipt",
  presentation: "cinematic",
});

const context: CognitiveAuthorContext = {
  cognitiveState,
  identityState: {
    identityId: "maria",
    kind: "person",
    subject: { value: "Maria", status: "observed", confidence: 1, evidence: [] },
    canonicalFacts: [], currentState: [], traits: [], preferences: [], activities: ["housekeeping"], relationships: [], history: [], recentEvents: facts, recurringPatterns: [], goals: [], intentions: [], unresolvedQuestions: [], locations: [], activeContext: "housekeeping",
    behavioralLearning: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0, accepted: [], rejected: [], preferences: [] },
    creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.5 },
    entityStates: [], sourceMemoryCount: facts.length, sourceEventCount: 4, confidence: 1, generatedAt: new Date().toISOString(),
  },
  geo: undefined,
  presence: { isReturning: false, visitNumber: 1, summary: [], places: [] },
  analytics: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0, accepted: [], rejected: [], preferences: [] },
  creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.5 },
  provenanceFacts: facts.map((text) => ({ text, provenance: { source: "prompt", permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"], forbiddenExpansions: [] } })),
  media: [], authorizedCreativeInstructions: [], textBeatTarget: 5, photoBeatsSilent: true,
};

const input: AuthorBrainTruth = { prompt, subject, lens: "attention", cognitiveContext: context, facts, sourceMoments: facts, memoryContext: [], creativeLearningContext: [], trajectory: [], returning: false, visitNumber: 1, presenceSummary: [] };
const result = await authorMoviePipeline(input);
const beats = result.movieBeatPlan.beats.filter((beat) => beat.kind === "text");
const written = beats.map((beat, index) => `${String(index + 1).padStart(2, "0")} · ${beat.text}`).join("\n");

console.log("================================================================");
console.log("QRE REALIZATION ACCEPTANCE · HUMAN-READABLE OUTPUT");
console.log("================================================================");
console.log("INPUT FACTS");
facts.forEach((fact) => console.log(`- ${fact}`));
console.log("\nCOGNITIVE STATE");
console.log(`subject=${cognitiveState.subject.name}`);
console.log(`facts=${cognitiveState.facts.length}`);
console.log(`events=${cognitiveState.events.length}`);
console.log(`goal=${cognitiveState.experience.goal}`);
console.log(`presentation=${cognitiveState.experience.presentation}`);
console.log("\nQRE WRITTEN SEQUENCE");
console.log(written || "<NO TEXT BEATS>");
console.log("\nRUNTIME");
console.log(`textBeats=${beats.length}`);
console.log(`totalBeats=${result.movieBeatPlan.beats.length}`);
console.log(`modelCalls=${result.authored.diagnostics.modelCalls}`);
console.log(`renderable=${result.authored.diagnostics.renderable}`);
console.log(`rejectedOutputNeverRendered=${result.authored.diagnostics.rejectedOutputNeverRendered}`);
if (!result.authored.diagnostics.renderable || beats.length === 0) {
  console.log("\nREJECTION DIAGNOSTICS");
  console.log(JSON.stringify(result.authored.diagnostics.rejectedCandidates ?? [], null, 2));
  console.log("\nRAW MODEL OUTPUT");
  console.log(result.authored.diagnostics.rawModelOutput ?? "<not captured; set QRE_AUTHOR_DEBUG_RAW=true>");
  console.log("\nRECOVERY USED");
  console.log(String(result.authored.diagnostics.recoveryRendererUsed));
  console.log("\nPROVENANCE VIOLATIONS");
  console.log(JSON.stringify(result.authored.diagnostics.provenanceViolations ?? [], null, 2));
}

assert.ok(beats.length >= 3, "QRE realization must produce at least 3 text beats");
assert.equal(result.authored.diagnostics.modelCalls, 1);
assert.equal(result.authored.diagnostics.renderable, true);
assert.equal(result.authored.diagnostics.rejectedOutputNeverRendered, true);

const output = written.toLowerCase();
for (const forbidden of ["intent:", "domain:", "known asset facts", "current facts", "second meaning", "according to qre"]) {
  assert.equal(output.includes(forbidden), false, `presentation leaked internal text: ${forbidden}`);
}
for (const forbidden of ["bathroom", "dirty dishes", "customer", "vacuum cleaner", "mopping service"]) {
  assert.equal(output.includes(forbidden), false, `unsupported detail appeared: ${forbidden}`);
}

console.log("\nQRE REALIZATION ACCEPTANCE: PASS");
