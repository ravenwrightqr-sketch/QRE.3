import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const now = "2026-08-23T22:30:00Z";
const subject = "Maria";
const facts = [
  "9:05 AM arrival",
  "Kitchen cleaned",
  "Bath cleaned",
  "Living room cleaned",
  "Left 11:11 AM",
];
const prompt = [
  "Create a five-line housekeeping service video receipt for a client.",
  "Write it as a memorable QRE sequence, not a conventional invoice and not a raw fact list.",
  "The source is shorthand written by the cleaner; preserve the underlying reality, but do not mechanically prepend Maria to every line.",
  "Use concise fragments, clever wordplay, contrast, implication, or a dry creative frame when earned.",
  "The final beat must feel like an earned creative payoff grounded in the completed service.",
  "No pronouns. Never infer gender, occupants, client relationship, property type, ownership, props, dialogue, or anything else not supplied.",
].join(" ");

const entityId = "elm-street-client-1";
const events = facts.map((summary, index) => ({
  id: `event-${index + 1}`,
  type: "supplied_fact",
  summary,
  occurredAt: new Date(Date.parse(now) + index * 1000).toISOString(),
  source: "event" as const,
  confidence: 1,
  entityIds: [entityId],
}));

const cognitiveState = buildCognitiveState({
  prompt,
  subjectTruth: {
    name: subject,
    kind: "person",
    identityFacts: [],
    provenance: "prompt",
  },
  memoryContext: {
    assetId: entityId,
    generatedAt: now,
    entities: [{
      id: entityId,
      kind: "other",
      name: "Client 1 / Elm Street",
      canonicalKey: entityId,
      confidence: 1,
      visibility: "shared",
      createdAt: now,
      updatedAt: now,
    }],
    facts: facts.map((text, index) => ({
      id: `fact-${index + 1}`,
      entityId,
      kind: "event" as const,
      predicate: "experienced",
      value: text,
      confidence: 1,
      source: "user" as const,
      status: "active" as const,
      observedAt: now,
      visibility: "shared" as const,
    })),
    relations: [],
    events,
  },
  experienceGoal: "service_receipt",
  presentation: "cinematic",
});

const cognitiveContext: CognitiveAuthorContext = {
  cognitiveState,
  domain: { mode: "service_receipt" },
  creativeLearning: {
    accepted: [],
    rejected: [],
    preferences: ["clever wordplay", "short memorable sequences"],
    successfulLenses: [],
    avoidedPatterns: ["fact parade", "repeated subject prefixing"],
    usedPhrases: [],
    noveltyPressure: 0.9,
  },
  creativeSafety: { class: "ordinary", confidence: 1, evidence: [] },
  provenanceFacts: facts.map((text) => ({
    text,
    provenance: {
      source: "prompt",
      permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"],
      forbiddenExpansions: [],
    },
  })),
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
  prompt,
  subject,
  lens: "attention",
  cognitiveContext,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  returning: false,
  visitNumber: 1,
  presenceSummary: [],
};

const result = await authorBrainUniversal(input);
const lines = result.scenes.map((scene) => scene.text);
const output = lines.join(" ").toLowerCase();

console.log("=".repeat(72));
console.log("QRE PRIZE · MARIA REAL SHORTHAND");
console.log("=".repeat(72));
console.log("SOURCE INPUT");
facts.forEach((fact) => console.log(`- ${fact}`));
console.log("\nQRE SEQUENCE");
lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));
console.log("\nDIAGNOSTICS");
console.log(`model=${result.diagnostics?.model}`);
console.log(`modelCalls=${result.diagnostics?.modelCalls}`);
console.log(`quality=${result.diagnostics?.qualityStatus}`);
console.log(`renderable=${result.diagnostics?.renderable}`);
console.log(`lens=${result.diagnostics?.selectedMovie?.lens?.id}`);
console.log(`operation=${result.diagnostics?.selectedMovie?.operation}`);
console.log(`score=${result.diagnostics?.selectedScore}`);
console.log(`creativeBudget=${result.diagnostics?.creativeBudget}`);
console.log(`provenance=${result.diagnostics?.provenanceGate}`);

assert.equal(result.diagnostics?.modelCalls, 1, "prize: exactly one model call");
assert.equal(result.diagnostics?.qualityStatus, "ACCEPTED", "prize: Author must accept output");
assert.equal(result.diagnostics?.renderable, true, "prize: output must render");
assert.equal(lines.length, 5, "prize: exactly five beats");
assert.equal(result.diagnostics?.provenanceGate, "passed", "prize: provenance gate");
assert.equal(/\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i.test(output), false, "prize: no pronoun inference");
assert.equal(/\b(?:bathroom|vacuum|counter|client|customer|house|office|family|owner)\b/i.test(output), false, "prize: no unsupported world expansion");
assert.equal(/\bMaria\s+Maria\b/i.test(output), false, "prize: no repeated subject prefix");
assert.ok(!lines.every((line) => facts.some((fact) => line.toLowerCase().includes(fact.toLowerCase())),), "prize: output cannot be a pure fact transcription");
assert.ok(!/^(done|finished|work complete|back to the day|the sequence landed)\.?$/i.test(lines.at(-1) ?? ""), "prize: final beat must be memorable, not admin filler");

console.log("\nQRE PRIZE MARIA ACCEPTANCE: PASS");
