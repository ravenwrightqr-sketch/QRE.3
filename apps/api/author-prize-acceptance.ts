import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const now = "2026-08-23T22:30:00Z";

type Case = {
  name: string;
  subject: string;
  kind: "person" | "pet" | "home" | "object";
  goal: string;
  prompt: string;
  facts: string[];
  forbidden: string[];
};

const cases: Case[] = [
  {
    name: "SERVICE RECEIPT / MARIA",
    subject: "Maria",
    kind: "person",
    goal: "service_receipt",
    prompt: "Turn these housekeeping facts into a five-line attention-grabbing creative receipt.",
    facts: [
      "Maria arrived at 9:04 AM",
      "Maria cleaned the living room",
      "Maria cleaned the kitchen",
      "Maria left at 11:00 AM",
    ],
    forbidden: ["bathroom", "vacuum", "counter", "client", "customer"],
  },
  {
    name: "PET / COCO",
    subject: "Coco",
    kind: "pet",
    goal: "identity",
    prompt: "Make a five-line attention-grabbing sequence from these facts. Use a memorable creative frame and do not invent reality.",
    facts: [
      "Coco entered nervous",
      "Coco got a bath",
      "Coco stole a blue bow",
      "Coco left looking fabulous",
    ],
    forbidden: ["owner", "groomer", "human", "bathroom", "leash"],
  },
  {
    name: "HOME LIVING MEMORY",
    subject: "Elm Street Home",
    kind: "home",
    goal: "memory",
    prompt: "Create a five-line living memory that feels like the beginning of a movie. Make it memorable without inventing facts.",
    facts: [
      "5:00 PM on a Sunday afternoon",
      "Elm Street",
      "a red front door",
      "a family lived behind the red front door",
      "the family moved in one day ago",
    ],
    forbidden: ["dog", "car", "party", "argument", "secret", "neighbor"],
  },
];

function buildContext(input: Case): CognitiveAuthorContext {
  const entityId = input.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const events = input.facts.map((summary, index) => ({
    id: `event-${index + 1}`,
    type: "supplied_fact",
    summary,
    occurredAt: new Date(Date.parse(now) + index * 1000).toISOString(),
    source: "event" as const,
    confidence: 1,
    entityIds: [entityId],
  }));
  const cognitiveState = buildCognitiveState({
    prompt: input.prompt,
    subjectTruth: {
      name: input.subject,
      kind: input.kind === "pet" ? "animal" : input.kind === "person" ? "person" : input.kind === "home" ? "place" : "object",
      identityFacts: [],
      provenance: "prompt",
    },
    memoryContext: {
      assetId: entityId,
      generatedAt: now,
      entities: [{ id: entityId, kind: input.kind === "pet" ? "animal" : input.kind === "person" ? "person" : "other", name: input.subject, canonicalKey: entityId, confidence: 1, visibility: "shared", createdAt: now, updatedAt: now }],
      facts: input.facts.map((text, index) => ({ id: `fact-${index + 1}`, entityId, kind: "event" as const, predicate: "experienced", value: text, confidence: 1, source: "user" as const, status: "active" as const, observedAt: now, visibility: "shared" as const })),
      relations: [],
      events,
    },
    experienceGoal: input.goal,
    presentation: "cinematic",
  });
  return {
    cognitiveState,
    domain: { mode: input.goal },
    creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.9 },
    creativeSafety: { class: "ordinary", confidence: 1, evidence: [] },
    provenanceFacts: input.facts.map((text) => ({ text, provenance: { source: "prompt", permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"], forbiddenExpansions: [] } })),
    identityState: null,
    geo: null,
    presence: { isReturning: false, visitNumber: 1, summary: [], places: [] },
    analytics: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0 },
    media: [],
    authorizedCreativeInstructions: [],
    textBeatTarget: 5,
    photoBeatsAreSilent: true,
  };
}

for (const test of cases) {
  const input: AuthorBrainTruth = {
    prompt: test.prompt,
    subject: test.subject,
    lens: "attention",
    cognitiveContext: buildContext(test),
    facts: test.facts,
    sourceMoments: test.facts,
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
  const hasCreativeEnding = lines.length > 0 && !/^(done|finished|work complete|back to the day)\.?$/i.test(lines.at(-1)!);
  const directParaphraseRatio = test.facts.filter((fact) => output.includes(fact.toLowerCase())).length / test.facts.length;

  console.log(`\n================================================================`);
  console.log(test.name);
  console.log(`================================================================`);
  console.log(`model=${result.diagnostics?.model}`);
  console.log(`modelCalls=${result.diagnostics?.modelCalls}`);
  console.log(`quality=${result.diagnostics?.qualityStatus}`);
  console.log(`renderable=${result.diagnostics?.renderable}`);
  console.log(`selectedLens=${result.diagnostics?.selectedMovie?.lens?.id}`);
  console.log(`selectedOperation=${result.diagnostics?.selectedMovie?.operation}`);
  console.log(`creativeBudget=${result.diagnostics?.creativeBudget}`);
  console.log("QRE SEQUENCE");
  lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));

  assert.equal(result.diagnostics?.modelCalls, 1, `${test.name}: one model call`);
  assert.equal(result.diagnostics?.qualityStatus, "ACCEPTED", `${test.name}: author must accept output`);
  assert.equal(result.diagnostics?.renderable, true, `${test.name}: output must render`);
  assert.equal(lines.length, 5, `${test.name}: exactly five beats`);
  assert.equal(result.diagnostics?.provenanceGate, "passed", `${test.name}: provenance gate`);
  assert.ok(hasCreativeEnding, `${test.name}: final beat must be a memorable earned payoff, not admin filler`);
  assert.ok(directParaphraseRatio < 0.75, `${test.name}: output is still too close to raw fact transcription (${directParaphraseRatio})`);

  for (const forbidden of test.forbidden) {
    assert.equal(output.includes(forbidden.toLowerCase()), false, `${test.name}: forbidden detail appeared: ${forbidden}`);
  }
}

console.log("\nQRE AUTHOR PRIZE ACCEPTANCE: PASS");
