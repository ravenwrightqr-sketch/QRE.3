import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const now = "2026-08-23T22:30:00Z";
const entityId = "elm-street-airbnb";
const facts = [
  "9:05 AM arrival",
  "Kitchen cleaned",
  "Bath cleaned",
  "Living room cleaned",
  "Left 11:11 AM",
];

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
  prompt: "Create a five-line housekeeping service video receipt. Make it clever and attention-grabbing without inventing anything.",
  subjectTruth: {
    name: "Elm Street Airbnb",
    kind: "place",
    identityFacts: ["Elm Street Airbnb"],
    provenance: "prompt",
  },
  memoryContext: {
    assetId: entityId,
    generatedAt: now,
    entities: [{ id: entityId, kind: "place", name: "Elm Street Airbnb", canonicalKey: entityId, confidence: 1, visibility: "shared", createdAt: now, updatedAt: now }],
    facts: facts.map((text, index) => ({ id: `fact-${index + 1}`, entityId, kind: "event" as const, predicate: "experienced", value: text, confidence: 1, source: "user" as const, status: "active" as const, observedAt: now, visibility: "shared" as const })),
    relations: [],
    events,
  },
  experienceGoal: "service_receipt",
  presentation: "cinematic",
});

const cognitiveContext: CognitiveAuthorContext = {
  cognitiveState,
  domain: { mode: "service_receipt" },
  creativeLearning: { accepted: [], rejected: [], preferences: ["clever wordplay", "attention loop"], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.95 },
  creativeSafety: { class: "ordinary", confidence: 1, evidence: [] },
  provenanceFacts: facts.map((text) => ({ text, provenance: { source: "prompt", permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"], forbiddenExpansions: [] } })),
  identityState: null,
  geo: { place: "Elm Street Airbnb" },
  presence: { isReturning: false, visitNumber: 1, summary: ["9:05 AM arrival", "11:11 AM departure"], places: ["Elm Street Airbnb"] },
  analytics: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0 },
  media: [{ kind: "photo", url: "media://arrival", source: "user" }],
  authorizedCreativeInstructions: ["Use clever wordplay. Make the sequence create a reason to keep watching. Keep reality closed."],
  textBeatTarget: 5,
  photoBeatsAreSilent: true,
};

const input: AuthorBrainTruth = {
  prompt: "Create a five-line housekeeping service video receipt. Make it clever, memorable, and attention-grabbing. Use the supplied arrival/departure times as presence evidence when useful.",
  subject: "Elm Street Airbnb",
  lens: "attention",
  cognitiveContext,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  returning: false,
  visitNumber: 1,
  presenceSummary: ["9:05 AM arrival", "11:11 AM departure"],
};

const result = await authorBrainUniversal(input);
const lines = result.scenes.map((scene) => scene.text);
const output = lines.join(" ").toLowerCase();

console.log("================================================================");
console.log("QRE BEYOND PRIZE · PRESENCE + ATTENTION + REALITY");
console.log("================================================================");
console.log("SOURCE DROP");
facts.forEach((fact) => console.log(`- ${fact}`));
console.log("PRESENCE");
console.log(`arrival=9:05 AM`);
console.log(`departure=11:11 AM`);
console.log(`place=Elm Street Airbnb`);
console.log("QRE SEQUENCE");
lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));
console.log("DIAGNOSTICS");
console.log(`model=${result.diagnostics?.model}`);
console.log(`modelCalls=${result.diagnostics?.modelCalls}`);
console.log(`quality=${result.diagnostics?.qualityStatus}`);
console.log(`renderable=${result.diagnostics?.renderable}`);
console.log(`provenance=${result.diagnostics?.provenanceGate}`);
console.log(`lens=${result.diagnostics?.selectedMovie?.lens?.id}`);
console.log(`operation=${result.diagnostics?.selectedMovie?.operation}`);
console.log(`score=${result.diagnostics?.selectedScore}`);

assert.equal(result.diagnostics?.modelCalls, 1, "one model call");
assert.equal(result.diagnostics?.qualityStatus, "ACCEPTED", "Author must accept the result");
assert.equal(result.diagnostics?.renderable, true, "result must render");
assert.equal(lines.length, 5, "exactly five beats");
assert.equal(result.diagnostics?.provenanceGate, "passed", "truth gate must pass");
assert.ok(/9:05|11:11/.test(output), "presence/time evidence should remain available to the realization");
assert.equal(output.includes("dog"), false, "service context must not invent pet domain");
assert.equal(output.includes("cat"), false, "service context must not invent pet domain");
assert.equal(output.includes("bathroom") && !output.includes("bath"), false, "do not expand supplied bath into a new unsupported bathroom claim");
assert.equal(output.includes("client"), false, "do not invent client identity");
assert.equal(output.includes("customer"), false, "do not invent customer identity");
assert.equal(output.includes("maria maria"), false, "never duplicate the subject by normalization artifact");
assert.notEqual(lines.at(-1)?.toLowerCase(), "done.", "final beat must not be administrative filler");

console.log("QRE BEYOND PRIZE ACCEPTANCE: PASS");
