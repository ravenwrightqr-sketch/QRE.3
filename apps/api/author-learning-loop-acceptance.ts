import type { MemoryContext, MemoryWriteBatch, IdentityState } from "@qre/contracts";
import type { AnalyticsRepository, WorldModel } from "@qre/engine";
import type { MemoryRepository } from "./src/repositories/memoryRepository.js";
import { buildAuthorLearningRecord, persistAuthorLearning } from "./src/services/authorLearningLoop.js";
import { memoryContextToCognitiveSummary } from "./src/services/memoryProjection.js";
import { buildCognitiveAuthorContext } from "./src/services/authorCognitiveContext.js";

const makeWorld = (prompt: string, eventRaw: string, participant: string, place: string): WorldModel => ({
  prompt,
  lens: "neutral",
  entities: [participant, place, eventRaw],
  participants: [participant],
  places: [place],
  times: [],
  events: [{ id: `${participant}-${eventRaw}`, raw: eventRaw, participants: [participant], action: "visited", place, details: [], order: 1, evidence: [] }],
  relations: [], evidence: [], memoryMatches: [],
  entitiesByKind: { people: [participant], animals: [], places: [place], organizations: [], events: [eventRaw], objects: [], services: [], properties: [] },
});

function fakeMemory(): MemoryRepository {
  const states = new Map<string, MemoryContext>();
  return {
    async assertAccess() {},
    async loadContext({ assetId }) {
      return states.get(assetId) ?? { assetId, generatedAt: new Date().toISOString(), entities: [], facts: [], relations: [], events: [] };
    },
    async writeBatch(batch: MemoryWriteBatch) {
      states.set(batch.assetId, {
        assetId: batch.assetId,
        generatedAt: new Date().toISOString(),
        entities: batch.entities.map((entity) => ({ ...entity, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
        facts: batch.facts.map((fact, index) => ({ ...fact, id: fact.id ?? `fact-${index}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
        relations: batch.relations.map((relation, index) => ({ ...relation, id: relation.id ?? `relation-${index}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
        events: batch.events.map((event, index) => ({ ...event, id: event.id ?? `event-${index}` })),
      } as MemoryContext);
    },
  };
}

function fakeAnalytics(): AnalyticsRepository & { events: Array<{ type: string; meta: unknown }> } {
  const events: Array<{ type: string; meta: unknown }> = [];
  return {
    events,
    async trackEvent(input) { events.push({ type: input.type, meta: input.meta }); },
    async findEvents() { return []; },
    async countByType() { return {}; },
    async getDashboardMetrics() { return { scans: 0, completions: 0, errors: 0, conversionRate: 0 }; },
  };
}

const memory = fakeMemory();
const analytics = fakeAnalytics();
const world = makeWorld("Coco visited Riverside Grooming.", "Coco visited Riverside Grooming.", "Coco", "Riverside Grooming");

const record = buildAuthorLearningRecord({ assetId: "asset-pet", userId: "user-a", prompt: "Coco visited Riverside Grooming.", world, observedAt: "2026-08-22T15:00:00.000Z" });
if (record.batch.events.length !== 1) throw new Error("LEARNING LOOP FAILED: event evidence batch incomplete");
if (!record.batch.facts.some((fact) => /Riverside Grooming/i.test(fact.value))) throw new Error("LEARNING LOOP FAILED: place evidence missing from fact projection");

await persistAuthorLearning({ assetId: "asset-pet", userId: "user-a", prompt: "Coco visited Riverside Grooming.", world, observedAt: "2026-08-22T15:00:00.000Z" }, { memoryRepository: memory, analyticsRepository: analytics });

const loaded = await memory.loadContext({ assetId: "asset-pet", userId: "user-a" });
const summary = memoryContextToCognitiveSummary(loaded);
if (!summary.some((line) => /Riverside Grooming/i.test(line))) throw new Error("LEARNING LOOP FAILED: next context missed new place");

const subject = { value: "Coco", status: "observed" as const, confidence: 1, evidence: [{ source: "memory" as const, detail: "learning acceptance", confidence: 1 }] };
const identityState: IdentityState = {
  identityId: "asset-pet",
  kind: "pet",
  subject,
  canonicalFacts: loaded.facts.map((fact) => ({ text: `${fact.predicate}: ${fact.value}`, source: fact.source === "event" ? "event" : "memory", confidence: fact.confidence, observedAt: fact.observedAt, entity: fact.entityId, status: fact.status === "retracted" ? "derived" : fact.status as "active" | "superseded" | "derived" })),
  currentState: [], traits: [], preferences: [], activities: [], relationships: [], history: [], recentEvents: loaded.events.map((event) => event.summary),
  recurringPatterns: [], goals: [], intentions: [], unresolvedQuestions: [], locations: [{ label: "Riverside Grooming", role: "memory" }], activeContext: "groomer",
  behavioralLearning: { scans: 0, completions: 0, abandons: 0, replays: 0, ctaClicks: 0, errors: 0, engagement: 0, friction: 0, accepted: [], rejected: [], preferences: [] },
  creativeLearning: { accepted: [], rejected: [], preferences: [], successfulLenses: [], avoidedPatterns: [], usedPhrases: [], noveltyPressure: 0 },
  entityStates: [], sourceMemoryCount: loaded.entities.length + loaded.facts.length, sourceEventCount: loaded.events.length, confidence: 1, generatedAt: new Date().toISOString(),
};
const nextContext = buildCognitiveAuthorContext({ identityState, textBeatTarget: 5 });
if (!nextContext.identityState?.canonicalFacts.some((fact) => /Riverside Grooming/i.test(fact.text))) throw new Error("LEARNING LOOP FAILED: new evidence did not reach CognitiveAuthorContext");
if (analytics.events.length !== 1 || analytics.events[0]?.type !== "AUTHOR_INPUT_ACCEPTED") throw new Error("LEARNING LOOP FAILED: input signal not recorded");

const secondContext = await memory.loadContext({ assetId: "asset-other", userId: "user-b" });
if (secondContext.entities.length || secondContext.facts.length || secondContext.events.length) throw new Error("LEARNING LOOP FAILED: cross-identity contamination");

console.log("AUTHOR LEARNING LOOP ACCEPTANCE: PASS");
console.log("identityScoped=true");
console.log("newEvidenceVisible=true");
console.log("nextCognitiveContext=true");
console.log("analyticsSignal=true");
console.log("crossIdentityIsolation=true");
