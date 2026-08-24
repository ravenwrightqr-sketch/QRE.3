import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const now = "2026-08-23T22:30:00Z";

const facts = [
  "9:05 AM arrival",
  "Kitchen cleaned",
  "Bath cleaned",
  "Living room cleaned",
  "Left 11:11 AM",
];

const subject = "Maria";
const entityId = "maria-housekeeping";

const events = facts.map((summary, index) => ({
  id: `attention-event-${index + 1}`,
  type: "supplied_fact",
  summary,
  occurredAt: new Date(Date.parse(now) + index * 1000).toISOString(),
  source: "event" as const,
  confidence: 1,
  entityIds: [entityId],
}));

const cognitiveState = buildCognitiveState({
  prompt: "Make this five-line housekeeping service receipt feel like a tiny movie with a reason to keep watching.",
  subjectTruth: {
    name: subject,
    kind: "person",
    identityFacts: [],
    provenance: "prompt",
  },
  memoryContext: {
    assetId: entityId,
    generatedAt: now,
    entities: [{ id: entityId, kind: "person", name: subject, canonicalKey: entityId, confidence: 1, visibility: "shared", createdAt: now, updatedAt: now }],
    facts: facts.map((text, index) => ({ id: `attention-fact-${index + 1}`, entityId, kind: "event" as const, predicate: "experienced", value: text, confidence: 1, source: "user" as const, status: "active" as const, observedAt: now, visibility: "shared" as const })),
    relations: [],
    events,
  },
  experienceGoal: "service_receipt",
  presentation: "cinematic",
});

const cognitiveContext: CognitiveAuthorContext = {
  cognitiveState,
  domain: { mode: "service_receipt" },
  creativeLearning: { accepted: [], rejected: [], preferences: ["clever wordplay", "short beats", "attention loop"], successfulLenses: [], avoidedPatterns: ["fact parade", "pretty montage"], usedPhrases: [], noveltyPressure: 0.95 },
  creativeSafety: { class: "ordinary", confidence: 1, evidence: [] },
  provenanceFacts: facts.map((text) => ({ text, provenance: { source: "prompt", permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"], forbiddenExpansions: [] } })),
  identityState: null,
  geo: null,
  presence: { isReturning: false, visitNumber: 1, summary: [], places: [] },
  analytics: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0 },
  media: [],
  authorizedCreativeInstructions: [
    "Use clever wordplay when it can be grounded in supplied reality.",
    "Build forward pull: each middle beat should make the next beat feel necessary.",
    "The final beat should reframe or pay off something already established.",
    "Do not invent a conflict merely to create tension.",
  ],
  textBeatTarget: 5,
  photoBeatsAreSilent: true,
};

const input: AuthorBrainTruth = {
  prompt: "Make this five-line housekeeping service receipt feel like a tiny movie with a reason to keep watching.",
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

function hasForwardMarker(line: string): boolean {
  return /\b(?:then|next|again|still|until|finally|but|yet|instead|before|after|first|last|back|now)\b/i.test(line);
}

function hasQuestionLikePull(line: string): boolean {
  return /\?|\b(?:next|what|now|then|until|still|again|left|remaining)\b/i.test(line);
}

function concreteGrounded(line: string): boolean {
  const normalized = line.toLowerCase();
  return facts.some((fact) => fact.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).some((token) => token.length > 3 && normalized.includes(token))) || hasForwardMarker(line);
}

assert.equal(result.diagnostics?.modelCalls, 1, "attention loop: one model call");
assert.equal(result.diagnostics?.qualityStatus, "ACCEPTED", "attention loop: accepted output");
assert.equal(result.diagnostics?.renderable, true, "attention loop: renderable");
assert.equal(lines.length, 5, "attention loop: exactly five beats");
assert.equal(result.diagnostics?.provenanceGate, "passed", "attention loop: provenance gate");

const middle = lines.slice(0, -1);
const pullSignals = middle.map((line, index) => {
  const next = lines[index + 1] ?? "";
  const novelty = line.toLowerCase() !== next.toLowerCase();
  return (novelty ? 1 : 0) + (hasForwardMarker(line) ? 1 : 0) + (hasQuestionLikePull(line) ? 1 : 0);
});

assert.ok(pullSignals.reduce((sum, value) => sum + value, 0) >= 4, `attention loop: insufficient forward pull ${pullSignals}`);
assert.ok(concreteGrounded(lines[0]!), "attention loop: opening must be grounded");
assert.ok(!/^done\.?$/i.test(lines.at(-1) ?? ""), "attention loop: payoff cannot be administrative filler");
assert.ok(!/\b(?:beautiful|beautifully|magically|gracefully|poetically|incredibly)\b/i.test(lines.join(" ")), "attention loop: decorative language cannot substitute for pull");

console.log("QRE ATTENTION LOOP ACCEPTANCE");
lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));
console.log(`lens=${result.diagnostics?.selectedMovie?.lens?.id}`);
console.log(`operation=${result.diagnostics?.selectedMovie?.operation}`);
console.log(`score=${result.diagnostics?.selectedScore}`);
console.log("QRE ATTENTION LOOP ACCEPTANCE: PASS");
