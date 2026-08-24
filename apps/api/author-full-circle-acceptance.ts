import assert from "node:assert/strict";
import type { AuthorBrainTruth, CognitiveAuthorContext } from "@qre/contracts";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

const media = [
  { id: "before", type: "image" as const, url: "https://example.invalid/coco-before.jpg", role: "evidence" as const, observedAt: "2026-08-21T17:00:00Z", metadata: { stage: "before", label: "before" } },
  { id: "moment", type: "image" as const, url: "https://example.invalid/coco-moment.jpg", role: "photo_beat" as const, observedAt: "2026-08-21T17:20:00Z", metadata: { stage: "moment", label: "blue bow" } },
  { id: "after", type: "image" as const, url: "https://example.invalid/coco-after.jpg", role: "evidence" as const, observedAt: "2026-08-21T18:00:00Z", metadata: { stage: "after", label: "after" } },
];

const identityState: CognitiveAuthorContext["identityState"] = {
  identityId: "coco",
  kind: "pet",
  subject: { value: "Coco", status: "observed", confidence: 1, evidence: [] },
  canonicalFacts: [
    { text: "poodle", source: "memory", confidence: 1 },
    { text: "nervous", source: "event", confidence: 1 },
    { text: "loves treats", source: "memory", confidence: 1 },
  ],
  currentState: ["fabulous"],
  traits: [],
  preferences: [],
  activities: [],
  relationships: [],
  history: [],
  recentEvents: ["got a bath", "stole a blue bow"],
  recurringPatterns: ["returns for grooming"],
  goals: [],
  intentions: [],
  unresolvedQuestions: [],
  locations: [{ label: "Coco Grooming", role: "experience_place" }],
  activeContext: "groomer",
  behavioralLearning: { scans: 1, completions: 1, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 1, friction: 0, accepted: [], rejected: [], preferences: [] },
  creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.5 },
  entityStates: [], sourceMemoryCount: 4, sourceEventCount: 2, confidence: 0.95, generatedAt: "2026-08-21T18:01:00Z",
};

const context: CognitiveAuthorContext = {
  identityState,
  geo: { role: "experience_place", label: "Coco Grooming", city: "Riverside", region: "CA", country: "US", latitude: 33.98, longitude: -117.37, source: "dashboard", time: "2026-08-21T18:00:00Z" },
  presence: { isReturning: true, visitNumber: 3, summary: ["returning visit"], places: ["Coco Grooming"] },
  analytics: { scans: 3, completions: 3, abandons: 0, replays: 1, ctaClicks: 0, errors: 0, engagement: 1, friction: 0, accepted: [], rejected: [], preferences: [] },
  creativeLearning: identityState?.creativeLearning ?? null,
  provenanceFacts: [],
  media,
  authorizedCreativeInstructions: [],
  textBeatTarget: 5,
  photoBeatsAreSilent: true,
};

const input: AuthorBrainTruth = {
  prompt: "Create a short grooming receipt movie for Coco.",
  subject: "Coco",
  place: "Coco Grooming",
  lens: "neutral",
  cognitiveContext: context,
  facts: ["poodle", "nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  sourceMoments: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  memoryContext: ["returns for grooming"],
  creativeLearningContext: [],
  trajectory: ["hook", "question", "turn", "escalation", "payoff"],
  returning: true,
  visitNumber: 3,
  presenceSummary: ["returning visit"],
};

const defaultRun = await authorMoviePipeline(input);
assert.equal(defaultRun.movieBeatPlan.mode, "auto");
assert.equal(defaultRun.movieBeatPlan.textBeatTarget, 5);
assert.equal(defaultRun.movieBeatPlan.manualOverride, false);
assert.equal(defaultRun.movieBeatPlan.beats.filter((beat) => beat.kind === "text").length, 5);
assert.equal(defaultRun.movieBeatPlan.beats.filter((beat) => beat.kind === "photo").length, 3);
assert.equal(defaultRun.movieBeatPlan.beats.some((beat) => beat.kind === "cta"), false);
assert.equal(defaultRun.movieBeatPlan.beats.filter((beat) => beat.kind === "photo").every((beat) => beat.silent === true), true);
assert.deepEqual(defaultRun.movieBeatPlan.selectedMediaIds, ["before", "moment", "after"]);
assert.equal(defaultRun.movieBeatPlan.estimatedDurationMs > 0, true);

const businessRun = await authorMoviePipeline({ ...input, cta: { text: "BOOK AGAIN" } });
assert.equal(businessRun.movieBeatPlan.beats.at(-1)?.kind, "cta");
assert.equal(businessRun.movieBeatPlan.beats.at(-1)?.text, "BOOK AGAIN");

const manualRun = await authorMoviePipeline({ ...input, presentationMode: "manual" });
assert.equal(manualRun.movieBeatPlan.manualOverride, true);

console.log("AUTHOR FULL CIRCLE ACCEPTANCE: PASS");
console.log(`defaultText=${defaultRun.movieBeatPlan.beats.filter((beat) => beat.kind === "text").length}`);
console.log(`defaultPhotos=${defaultRun.movieBeatPlan.beats.filter((beat) => beat.kind === "photo").length}`);
console.log(`defaultHasCTA=${defaultRun.movieBeatPlan.beats.some((beat) => beat.kind === "cta")}`);
console.log(`businessCTA=${businessRun.movieBeatPlan.beats.at(-1)?.text}`);
console.log(`silentPhotos=${defaultRun.movieBeatPlan.beats.filter((beat) => beat.kind === "photo").every((beat) => beat.silent === true)}`);
console.log(`manualOverride=${manualRun.movieBeatPlan.manualOverride}`);
console.log(`estimatedMs=${defaultRun.movieBeatPlan.estimatedDurationMs}`);
