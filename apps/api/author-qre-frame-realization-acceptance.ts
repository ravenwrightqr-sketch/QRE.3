import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

type Case = {
  name: string;
  subject: string;
  prompt: string;
  facts: string[];
  events: Array<{ id: string; type: string; summary: string; occurredAt: string; source: "event"; confidence: number; entityIds: string[] }>;
  kind: "person" | "pet" | "home";
  goal: "service_receipt" | "memory" | "identity";
  presentation: "cinematic";
  expectedSignals: string[];
  forbiddenConcrete: string[];
};

const now = "2026-08-23T17:00:00Z";

const cases: Case[] = [
  {
    name: "SERVICE RECEIPT / MARIA",
    subject: "Maria",
    prompt: "Turn this housekeeping work into an attention-grabbing customer receipt. Keep every factual detail grounded and make it play as a short sequence.",
    facts: [
      "Maria arrived at 9:04 AM",
      "Maria cleaned the living room",
      "Maria cleaned the kitchen",
      "Maria left at 11:00 AM",
    ],
    events: [
      { id: "m-1", type: "arrival", summary: "Maria arrived at 9:04 AM", occurredAt: "2026-08-23T16:04:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
      { id: "m-2", type: "service", summary: "Maria cleaned the living room", occurredAt: "2026-08-23T16:30:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
      { id: "m-3", type: "service", summary: "Maria cleaned the kitchen", occurredAt: "2026-08-23T17:15:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
      { id: "m-4", type: "departure", summary: "Maria left at 11:00 AM", occurredAt: "2026-08-23T18:00:00Z", source: "event", confidence: 1, entityIds: ["maria"] },
    ],
    kind: "person", goal: "service_receipt", presentation: "cinematic",
    expectedSignals: ["sequence", "attention", "payoff"],
    forbiddenConcrete: ["bathroom", "counter", "vacuum", "dirty dishes"],
  },
  {
    name: "HOME LIVING MEMORY / ELM STREET",
    subject: "Elm Street Home",
    prompt: "Create a living memory of this home. Use a cinematic neighborhood-observer frame if it genuinely fits. Keep the supplied reality intact and make the sequence feel like the beginning of a story.",
    facts: [
      "5:00 PM on a Sunday afternoon",
      "Elm Street",
      "a red front door",
      "a family lived behind the red front door",
      "the family moved in one day ago",
    ],
    events: [
      { id: "h-1", type: "time", summary: "5:00 PM on a Sunday afternoon", occurredAt: now, source: "event", confidence: 1, entityIds: ["elm-home"] },
      { id: "h-2", type: "place", summary: "Elm Street", occurredAt: now, source: "event", confidence: 1, entityIds: ["elm-home"] },
      { id: "h-3", type: "home_detail", summary: "a red front door", occurredAt: now, source: "event", confidence: 1, entityIds: ["elm-home"] },
      { id: "h-4", type: "residence", summary: "a family lived behind the red front door", occurredAt: now, source: "event", confidence: 1, entityIds: ["elm-home"] },
      { id: "h-5", type: "move_in", summary: "the family moved in one day ago", occurredAt: now, source: "event", confidence: 1, entityIds: ["elm-home"] },
    ],
    kind: "home", goal: "memory", presentation: "cinematic",
    expectedSignals: ["sequence", "attention", "payoff"],
    forbiddenConcrete: ["dog", "car", "neighbor named", "party", "argument"],
  },
  {
    name: "PET EXPERIENCE / COCO",
    subject: "Coco",
    prompt: "Make a short attention-grabbing grooming experience from these facts. Use a playful frame if the facts support it. Do not invent any people, objects, places, preferences, or relationships.",
    facts: [
      "Coco entered nervous",
      "Coco got a bath",
      "Coco stole a blue bow",
      "Coco left looking fabulous",
    ],
    events: [
      { id: "c-1", type: "arrival", summary: "Coco entered nervous", occurredAt: "2026-08-23T16:00:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
      { id: "c-2", type: "service", summary: "Coco got a bath", occurredAt: "2026-08-23T16:20:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
      { id: "c-3", type: "incident", summary: "Coco stole a blue bow", occurredAt: "2026-08-23T16:40:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
      { id: "c-4", type: "departure", summary: "Coco left looking fabulous", occurredAt: "2026-08-23T17:00:00Z", source: "event", confidence: 1, entityIds: ["coco"] },
    ],
    kind: "pet", goal: "identity", presentation: "cinematic",
    expectedSignals: ["sequence", "attention", "payoff"],
    forbiddenConcrete: ["owner", "groomer", "human", "bathroom", "leash"],
  },
];

function buildContext(input: Case): CognitiveAuthorContext {
  const cognitiveState = buildCognitiveState({
    prompt: input.prompt,
    subjectTruth: { name: input.subject, kind: input.kind === "pet" ? "animal" : input.kind === "person" ? "person" : "place", identityFacts: [], provenance: "prompt" },
    memoryContext: {
      assetId: input.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-"), generatedAt: now,
      entities: [{ id: input.subject.toLowerCase(), kind: input.kind === "pet" ? "animal" : input.kind === "person" ? "person" : "place", name: input.subject, canonicalKey: input.subject.toLowerCase(), confidence: 1, visibility: "shared", createdAt: now, updatedAt: now }],
      facts: input.facts.map((text, i) => ({ id: `f-${i + 1}`, entityId: input.subject.toLowerCase(), kind: "event" as const, predicate: "experienced", value: text, confidence: 1, source: "user" as const, status: "active" as const, observedAt: now, visibility: "shared" as const })),
      relations: [], events: input.events,
    },
    experienceGoal: input.goal,
    presentation: input.presentation,
  });

  return {
    cognitiveState,
    identityState: {
      identityId: input.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      kind: input.kind === "pet" ? "pet" : input.kind === "person" ? "person" : "other",
      subject: { value: input.subject, status: "observed", confidence: 1, evidence: [] },
      canonicalFacts: [], currentState: [], traits: [], preferences: [], activities: [], relationships: [], history: [], recentEvents: input.facts, recurringPatterns: [], goals: [], intentions: [], unresolvedQuestions: [], locations: [], activeContext: input.goal,
      behavioralLearning: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0, accepted: [], rejected: [], preferences: [] },
      creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.5 },
      entityStates: [], sourceMemoryCount: input.facts.length, sourceEventCount: input.events.length, confidence: 1, generatedAt: now,
    },
    geo: undefined,
    presence: { isReturning: false, visitNumber: 1, summary: [], places: [] },
    analytics: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0, accepted: [], rejected: [], preferences: [] },
    creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.5 },
    provenanceFacts: input.facts.map((text) => ({ text, provenance: { source: "prompt", permissions: ["compress", "reframe", "callback", "derive_recurrence", "derive_significance"], forbiddenExpansions: [] } })),
    media: [], authorizedCreativeInstructions: [], textBeatTarget: 5, photoBeatsSilent: true,
  };
}

for (const test of cases) {
  const context = buildContext(test);
  const input: AuthorBrainTruth = {
    prompt: test.prompt, subject: test.subject, lens: "attention", cognitiveContext: context,
    facts: test.facts, sourceMoments: test.facts, memoryContext: [], creativeLearningContext: [], trajectory: [], returning: false, visitNumber: 1, presenceSummary: [],
  };

  const result = await authorMoviePipeline(input);
  const beats = result.movieBeatPlan.beats.filter((beat) => beat.kind === "text");
  const diagnostics = result.authored.diagnostics as Record<string, unknown>;
  const written = beats.map((beat, index) => `${String(index + 1).padStart(2, "0")} · ${beat.text}`);
  const output = written.join("\n").toLowerCase();

  console.log(`\n================================================================`);
  console.log(test.name);
  console.log(`================================================================`);
  console.log(`goal=${test.goal}`);
  console.log(`inputFacts=${test.facts.length}`);
  console.log(`inputEvents=${test.events.length}`);
  console.log(`modelCalls=${String(diagnostics.modelCalls)}`);
  console.log(`renderable=${String(diagnostics.renderable)}`);
  console.log(`selectedMove=${String(diagnostics.selectedMove ?? "unknown")}`);
  console.log(`selectedPath=${String(diagnostics.selectedPath ?? "unknown")}`);
  console.log(`creativeBudget=${String(diagnostics.creativeBudget ?? "unknown")}`);
  console.log("\nSOURCE REALITY");
  test.facts.forEach((fact) => console.log(`- ${fact}`));
  console.log("\nQRE WRITTEN SEQUENCE");
  console.log(written.join("\n") || "<NO TEXT BEATS>");
  console.log("\nDIAGNOSTICS");
  console.log(`provenanceGate=${String(diagnostics.provenanceGate)}`);
  console.log(`qualityFloor=${String(diagnostics.qualityFloor)}`);
  console.log(`selectedScore=${String(diagnostics.selectedScore)}`);

  assert.equal(diagnostics.modelCalls, 1, `${test.name}: expected one model call`);
  assert.equal(diagnostics.renderable, true, `${test.name}: output must render`);
  assert.equal(diagnostics.provenanceGate, "passed", `${test.name}: provenance gate must pass`);
  assert.ok(beats.length >= 3, `${test.name}: expected at least 3 text beats`);
  assert.ok(/(?:done|finished|complete|completed|next|then|finally|but|still|already|entered|arrived|left|moved|started|began|quiet|normal|or so)/i.test(output), `${test.name}: sequence lacks a recognizable movement/reframe signal`);
  for (const forbidden of test.forbiddenConcrete) {
    assert.equal(output.includes(forbidden.toLowerCase()), false, `${test.name}: unsupported detail appeared: ${forbidden}`);
  }
}

console.log("\nQRE FRAME → REALIZATION ACCEPTANCE: PASS");
