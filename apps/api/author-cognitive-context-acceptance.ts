import assert from "node:assert/strict";
import { buildCognitiveAuthorContext } from "./src/services/authorCognitiveContext.js";
import type { IdentityState, MediaAsset } from "@qre/contracts";

const identityState = {
  identityId: "coco",
  kind: "pet",
  subject: { value: "Coco", status: "observed", confidence: 1, evidence: [] },
  canonicalFacts: [
    { text: "poodle", source: "memory", confidence: 1 },
    { text: "fierce", source: "memory", confidence: 1 },
  ],
  currentState: ["fierce", "friendly"],
  traits: [],
  preferences: [{ text: "loves bacon", source: "memory", confidence: 1 }],
  activities: [{ text: "long walks at night", source: "memory", confidence: 1 }],
  relationships: [],
  history: [],
  recentEvents: ["stole a blue bow"],
  recurringPatterns: [],
  goals: [],
  intentions: [],
  unresolvedQuestions: [],
  locations: [{ label: "Coco's groomer", role: "service" }],
  activeContext: "groomer",
  behavioralLearning: { scans: 3, completions: 2, abandons: 0, replays: 1, ctaClicks: 1, errors: 0, engagement: 1, friction: 0, accepted: [], rejected: [], preferences: [] },
  creativeLearning: { accepted: ["short reveal"], rejected: [], preferences: [], successfulLenses: ["deadpan"], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0.8 },
  entityStates: [],
  sourceMemoryCount: 5,
  sourceEventCount: 3,
  confidence: 0.92,
  generatedAt: new Date().toISOString(),
} as unknown as IdentityState;

const photo: MediaAsset = {
  id: "photo-coco-1",
  type: "image",
  url: "https://example.invalid/coco.jpg",
  metadata: { source: "upload" },
};

const context = buildCognitiveAuthorContext({
  identityState,
  geo: { label: "Coco's groomer", role: "experience_place", time: "2026-08-21T18:00:00-07:00" },
  presence: { visitNumber: 3, isReturning: true, places: ["Coco's groomer"], summary: ["returning visit"] },
  analytics: { scans: 3, completions: 2, replays: 1, engagement: 1 },
  domain: { mode: "pet_social", signature: "poodle | fierce + friendly | loves bacon", continuity: ["long walks at night"] },
  creativeLearning: identityState.creativeLearning,
  provenanceFacts: [],
  media: [photo],
  authorizedCreativeInstructions: ["final line is exactly: Peace was temporary."],
});

assert.equal(context.identityState?.subject.value, "Coco");
assert.equal(context.geo?.role, "experience_place");
assert.equal(context.presence?.isReturning, true);
assert.equal(context.domain?.mode, "pet_social");
assert.equal(context.media?.length, 1);
assert.equal(context.media?.[0]?.id, "photo-coco-1");
assert.equal(context.authorizedCreativeInstructions?.length, 1);
assert.equal(context.textBeatTarget, 5);
assert.equal(context.photoBeatsAreSilent, true);

console.log("AUTHOR COGNITIVE CONTEXT ACCEPTANCE: PASS");
console.log(`identity=${context.identityState?.kind}`);
console.log(`geo=${context.geo?.role}`);
console.log(`presenceReturning=${context.presence?.isReturning}`);
console.log(`media=${context.media?.length}`);
console.log(`textBeatTarget=${context.textBeatTarget}`);
console.log(`photoBeatsSilent=${context.photoBeatsAreSilent}`);
