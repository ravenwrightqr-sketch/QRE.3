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
const entityId = "elm-street-client-1";

const prompt = [
  "Create a five-line housekeeping service video receipt.",
  "QRE attention style: interruption, curiosity, escalation, contrast, callback, anticipation, payoff.",
  "Do not write poetry, lyrical imagery, atmosphere, or decorative description.",
  "Make each beat create a reason to notice the next beat.",
  "Use short fragments and clever wordplay when earned.",
  "Never invent people, relationships, rooms, objects, occupants, props, sensory details, dialogue, ownership, or literal events.",
  "Do not use pronouns or prepend Maria to every line.",
].join(" ");

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
  subjectTruth: { name: subject, kind: "person", identityFacts: [], provenance: "prompt" },
  memoryContext: {
    assetId: entityId,
    generatedAt: now,
    entities: [{ id: entityId, kind: "other", name: "Client 1 / Elm Street", canonicalKey: entityId, confidence: 1, visibility: "shared", createdAt: now, updatedAt: now }],
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
  creativeLearning: {
    accepted: [],
    rejected: [],
    preferences: ["attention", "interruption", "curiosity", "escalation", "contrast", "callback", "anticipation", "payoff"],
    successfulLenses: [],
    avoidedPatterns: ["poetry", "lyrical imagery", "decorative description", "fact parade", "repeated subject prefixing"],
    usedPhrases: [],
    noveltyPressure: 0.95,
  },
  creativeSafety: { class: "ordinary", confidence: 1, evidence: [] },
  provenanceFacts: facts.map((text, index) => ({
    text,
    provenance: {
      factType: "event",
      source: "event",
      observedAt: new Date(Date.parse(now) + index * 1000).toISOString(),
      entity: entityId,
      confidence: 1,
      permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"],
      forbiddenExpansions: [
        "invent_person",
        "invent_relationship",
        "invent_place",
        "invent_object",
        "invent_body_detail",
        "invent_dialogue",
        "invent_literal_event",
        "invent_chronology",
        "invent_business_fact",
        "invent_private_fact",
      ],
    },
  })),
  identityState: null,
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

const poetry = /\b(?:gleam|gleams|glows|hums|breathes|whispers|dances|dreams|poetic|beautiful|beautifully|quietly|silently|ritual|uncluttered|gracefully|magically|softly|poetically|atmosphere|storm|symphony)\b/i;
const attention = /\b(?:then|next|but|still|again|until|already|first|last|only|now|yet|except|suddenly|round|one more|not yet|and then|this time)\b/i;
const interruption = /^(?:\d{1,2}:\d{2}|[^.!?]{1,24}[:—-])|—|:\s*$/i;
const anticipation = /\b(?:next|then|until|again|still|not yet|before|what happened|one more|this time|wait)\b/i;
const payoff = /\b(?:over|done|complete|finished|back|again|round|settled|cleared|final|next|more|matter|counted|won|lost|held|left)\b/i;

const attentionSignals = lines.reduce((count, line, index) => {
  const signal = (attention.test(line) ? 1 : 0)
    + (index < lines.length - 1 && anticipation.test(line) ? 1 : 0)
    + (index < lines.length - 1 && interruption.test(line) ? 1 : 0)
    + (index === lines.length - 1 && payoff.test(line) ? 1 : 0);
  return count + signal;
}, 0);

console.log("=".repeat(72));
console.log("QRE ATTENTION LANGUAGE ACCEPTANCE · POETRY MUST LOSE");
console.log("=".repeat(72));
console.log("QRE SEQUENCE");
lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));
console.log(`\nattentionSignals=${attentionSignals}`);
console.log(`poetryDetected=${poetry.test(output)}`);
console.log(`model=${result.diagnostics?.model}`);
console.log(`modelCalls=${result.diagnostics?.modelCalls}`);
console.log(`quality=${result.diagnostics?.qualityStatus}`);
console.log(`renderable=${result.diagnostics?.renderable}`);
console.log(`provenance=${result.diagnostics?.provenanceGate}`);
console.log(`candidateSequences=${result.diagnostics?.candidateSequences}`);
console.log(`acceptedCandidates=${result.diagnostics?.acceptedCandidates}`);

if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") {
  console.log("\nRAW MODEL OUTPUT");
  console.log(result.diagnostics?.rawModelOutput ?? "<none>");
  console.log("\nREJECTED CANDIDATES");
  console.dir(result.diagnostics?.rejectedCandidates ?? [], { depth: null });
}

assert.equal(result.diagnostics?.modelCalls, 1, "attention: one model call");
assert.equal(result.diagnostics?.qualityStatus, "ACCEPTED", "attention: accepted output");
assert.equal(result.diagnostics?.renderable, true, "attention: renderable");
assert.equal(result.diagnostics?.provenanceGate, "passed", "attention: provenance gate");
assert.equal(lines.length, 5, "attention: five beats");
assert.equal(poetry.test(output), false, "attention: lyrical/poetic language must not win");
assert.ok(attentionSignals >= 4, `attention: need at least four attention signals, got ${attentionSignals}`);
assert.equal(/\b(?:he|she|him|her|his|hers|they|them|their|theirs)\b/i.test(output), false, "attention: no pronoun inference");
assert.equal(/\bMaria\s+Maria\b/i.test(output), false, "attention: no repeated subject prefixing");
assert.equal(/\b(?:bathroom|vacuum|counter|customer|owner|family|house|office)\b/i.test(output), false, "attention: no unsupported world expansion");

console.log("QRE ATTENTION LANGUAGE ACCEPTANCE: PASS");
