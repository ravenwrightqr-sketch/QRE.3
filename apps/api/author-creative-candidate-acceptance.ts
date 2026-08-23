import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { buildCognitiveState } from "@qre/engine";
import { generateCreativeCandidates } from "./src/services/authorCreativeCandidateEngine.js";

type Case = {
  name: string;
  subject: string;
  prompt: string;
  facts: string[];
  kind: "person" | "pet" | "home" | "object";
  goal: string;
  forbidden: string[];
};

const now = "2026-08-23T22:00:00Z";

const cases: Case[] = [
  {
    name: "HOUSEKEEPING / MARIA",
    subject: "Maria",
    prompt: "Turn these housekeeping facts into a short attention-grabbing receipt with a creative frame. Five lines.",
    facts: [
      "Maria arrived at 9:04 AM",
      "Maria cleaned the living room",
      "Maria cleaned the kitchen",
      "Maria left at 11:00 AM",
    ],
    kind: "person",
    goal: "service_receipt",
    forbidden: ["bathroom", "counter", "vacuum", "dirty dishes"],
  },
  {
    name: "HOME MEMORY / ELM STREET",
    subject: "Elm Street Home",
    prompt: "Create a living memory of this home as the beginning of a story. Five lines. Make the frame cinematic and attention-grabbing.",
    facts: [
      "5:00 PM on a Sunday afternoon",
      "Elm Street",
      "a red front door",
      "a family lived behind the red front door",
      "the family moved in one day ago",
    ],
    kind: "home",
    goal: "memory",
    forbidden: ["dog", "car", "party", "argument", "secret"],
  },
  {
    name: "PET / COCO",
    subject: "Coco",
    prompt: "Make a short attention-grabbing experience from these facts. Five lines. Use a playful creative frame without inventing reality.",
    facts: [
      "Coco entered nervous",
      "Coco got a bath",
      "Coco stole a blue bow",
      "Coco left looking fabulous",
    ],
    kind: "pet",
    goal: "identity",
    forbidden: ["owner", "groomer", "human", "bathroom", "leash"],
  },
  {
    name: "OBJECT MEMORY / NECKLACE",
    subject: "Silver Necklace",
    prompt: "Make a short living memory from these facts. Five lines. Use the strongest creative frame the supplied reality supports.",
    facts: [
      "The silver necklace was a gift from Mom",
      "It was worn for the first time at graduation",
      "It has been worn every year since",
    ],
    kind: "object",
    goal: "memory",
    forbidden: ["diamond", "jeweler", "box", "wedding", "inheritance"],
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
      kind: input.kind === "pet" ? "animal" : input.kind === "person" ? "person" : "place",
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
    creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.8 },
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

  const result = await generateCreativeCandidates(input);
  console.log(`\n================================================================`);
  console.log(test.name);
  console.log(`================================================================`);
  console.log(`goal=${test.goal}`);
  console.log(`model=${result.model}`);
  console.log(`modelCalls=${result.modelCalls}`);
  console.log(`candidateCount=${result.candidates.length}`);

  result.candidates.forEach((candidate, index) => {
    console.log(`\nCANDIDATE ${index + 1} · frame=${candidate.frame} · operation=${candidate.operation}`);
    candidate.lines.forEach((line, lineIndex) => console.log(`${String(lineIndex + 1).padStart(2, "0")} · ${line}`));
    console.log(`status=${candidate.validation.ok ? "ACCEPTED" : "REJECTED"}`);
    console.log(`score=${candidate.validation.score}`);
    if (candidate.validation.reasons.length) console.log(`reasons=${candidate.validation.reasons.join(",")}`);
    console.log(`attention=${candidate.validation.metrics.attention}`);
    console.log(`payoff=${candidate.validation.metrics.payoff}`);
    console.log(`creative=${candidate.validation.metrics.creative}`);
  });

  assert.equal(result.modelCalls, 1, `${test.name}: must use exactly one model call`);
  assert.ok(result.candidates.length >= 2, `${test.name}: need multiple creative candidates`);
  assert.ok(result.winner, `${test.name}: must have a surviving creative candidate`);

  const output = result.winner!.lines.join("\n").toLowerCase();
  console.log(`\nWINNER · frame=${result.winner!.frame} · score=${result.winner!.validation.score}`);
  result.winner!.lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));

  for (const forbidden of test.forbidden) {
    assert.equal(output.includes(forbidden.toLowerCase()), false, `${test.name}: forbidden detail appeared: ${forbidden}`);
  }
  assert.ok(result.winner!.lines.length === 5, `${test.name}: winner must contain five beats`);
  assert.ok(result.winner!.validation.provenance.length === 0, `${test.name}: provenance must be clean`);
  assert.ok(result.winner!.validation.metrics.creative >= 0.25, `${test.name}: creative signal too low`);
}

console.log("\nQRE CREATIVE CANDIDATE COMPETITION ACCEPTANCE: PASS");
