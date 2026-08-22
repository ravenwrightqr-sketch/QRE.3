import type {
  CognitiveAnalyticsSignal,
  CognitiveClaim,
  CognitiveCreativeLearning,
  CognitiveRelationshipState,
  IdentityContext,
  IdentityFact,
  IdentityKind,
  IdentityLocation,
  IdentityState,
  IdentityIntent,
  MemoryContext,
} from "@qre/contracts";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createMemoryRepository, type MemoryRepository } from "../repositories/memoryRepository.js";
import { getCreativeLearningContext, type CreativeLearningContext } from "./creativeLearning.js";
import { buildPresenceContext } from "@qre/engine";
import { createPresenceRepository } from "../repositories/presenceRepository.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const lower = (value: unknown): string => clean(value).toLowerCase();
const unique = <T>(values: T[]): T[] => [...new Set(values)];
const confidence = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function claim<T>(value: T, detail: string, source: "prompt" | "context" | "memory" | "event" | "location" | "history"): CognitiveClaim<T> {
  return {
    value,
    status: "observed",
    confidence: 1,
    evidence: [{ source, detail, confidence: 1 }],
  };
}

function classifyKind(input: string | undefined): IdentityKind {
  const value = lower(input);
  if (["pet", "animal", "dog", "cat"].includes(value)) return "pet";
  if (["person", "personal"].includes(value)) return "person";
  if (["relationship", "couple", "romance"].includes(value)) return "relationship";
  if (["business", "brand", "merchant"].includes(value)) return "business";
  if (["property", "real_estate", "house", "home"].includes(value)) return "property";
  if (["event", "wedding"].includes(value)) return "event";
  if (["service", "service_history"].includes(value)) return "service";
  if (["project"].includes(value)) return "project";
  if (["goal", "vision"].includes(value)) return "goal";
  if (["memory", "living_memory"].includes(value)) return "memory";
  if (["family"].includes(value)) return "family";
  return "generic";
}

function inferContext(input: { requested?: IdentityContext; presenceSummary: string[]; locationLabel?: string }): IdentityContext {
  if (input.requested) return input.requested;
  const text = lower([...input.presenceSummary, input.locationLabel ?? ""].join(" "));
  const checks: Array<[IdentityContext, RegExp]> = [
    ["daycare", /daycare|day care/],
    ["vet", /vet|veterinary|clinic/],
    ["groomer", /groomer|grooming/],
    ["walker", /walker|walk/],
    ["vacation", /vacation|travel|trip/],
    ["event", /wedding|event|venue/],
    ["work", /work|office/],
    ["social", /social|party|bar|restaurant/],
    ["home", /home|house/],
  ];
  return checks.find(([, pattern]) => pattern.test(text))?.[0] ?? "unknown";
}

function factFromMemory(fact: MemoryContext["facts"][number]): IdentityFact {
  return {
    text: clean(`${fact.predicate}: ${fact.value}`),
    source: fact.source === "memory" ? "memory" : fact.source === "event" ? "event" : "history",
    confidence: confidence(fact.confidence),
    observedAt: fact.observedAt,
    entity: fact.entityId,
    status: fact.status,
  };
}

function classifyIdentityFacts(facts: IdentityFact[]) {
  const traits: IdentityFact[] = [];
  const preferences: IdentityFact[] = [];
  const activities: IdentityFact[] = [];
  const currentState: string[] = [];

  for (const fact of facts) {
    const text = lower(fact.text);
    if (/trait|personality|likes to|fierce|friendly|calm|bold|nervous|proud|scared/.test(text)) traits.push(fact);
    else if (/love|loves|likes|prefers|favorite|enjoys|hates|dislikes/.test(text)) preferences.push(fact);
    else if (/walk|worked|played|visited|went|traveled|met|talked|cleaned|served|ordered|returned|arrived|left/.test(text)) activities.push(fact);
    if (/state|status|current|active|nervous|happy|sad|angry|ready|late|early|busy|empty|full|broken|fixed|fabulous|muddy|calm|alone|together|connected/.test(text)) currentState.push(fact.text);
  }

  return {
    traits: unique(traits),
    preferences: unique(preferences),
    activities: unique(activities),
    currentState: unique(currentState).slice(0, 20),
  };
}

function relationshipStates(memory: MemoryContext): CognitiveRelationshipState[] {
  return memory.relations.map((relation) => ({
    from: relation.fromEntityId,
    to: relation.toEntityId,
    relation: relation.relation,
    strength: confidence(relation.confidence),
    eventCount: 1,
  }));
}

function analyticsSignal(events: Array<{ type: string }>): CognitiveAnalyticsSignal {
  let scans = 0;
  let completions = 0;
  let abandons = 0;
  let replays = 0;
  let ctaClicks = 0;
  let errors = 0;
  for (const event of events) {
    if (event.type === "SCAN") scans += 1;
    if (event.type === "FLOW_COMPLETE") completions += 1;
    if (event.type === "FLOW_ABANDON") abandons += 1;
    if (event.type === "EXPERIENCE_REPLAY") replays += 1;
    if (event.type === "CTA_CLICK") ctaClicks += 1;
    if (event.type === "ERROR") errors += 1;
  }
  const positive = completions + replays + ctaClicks;
  const engagement = scans ? Math.min(1, positive / scans) : 0;
  const friction = scans ? Math.min(1, (abandons + errors) / scans) : 0;
  return {
    scans,
    completions,
    abandons,
    replays,
    ctaClicks,
    errors,
    engagement,
    friction,
    accepted: [],
    rejected: [],
    preferences: [],
  };
}

function creativeSignal(context: CreativeLearningContext): CognitiveCreativeLearning {
  return {
    accepted: context.acceptedPatterns.slice(0, 20),
    rejected: context.rejectedPatterns.slice(0, 20),
    preferences: [...context.acceptedPatterns.slice(0, 10), ...context.autonomousWinners.slice(0, 10)],
    successfulLenses: context.autonomousWinners.filter((value) => /lens|\/ /.test(value)).slice(0, 10),
    avoidedPatterns: [...context.rejectedPatterns.slice(0, 10), ...context.autonomousWeaknesses.slice(0, 10)],
    usedPhrases: [],
    noveltyPressure: context.autonomousConfidence,
  };
}

function intentsFromInput(input: { goals?: string[]; intentions?: string[] }): { goals: IdentityIntent[]; intentions: IdentityIntent[] } {
  const make = (value: string): IdentityIntent => ({
    text: clean(value),
    status: "active",
    evidence: [clean(value)],
  });
  return {
    goals: (input.goals ?? []).map(make).filter((item) => item.text),
    intentions: (input.intentions ?? []).map(make).filter((item) => item.text),
  };
}

export async function buildAuthorIdentityState(input: {
  assetId: string;
  userId?: string;
  subject?: string;
  kind?: string;
  context?: IdentityContext;
  location?: IdentityLocation;
  goals?: string[];
  intentions?: string[];
  memoryRepository?: MemoryRepository;
}): Promise<IdentityState> {
  const memoryRepository = input.memoryRepository ?? createMemoryRepository();
  const [memory, learning, analyticsEvents, presence] = await Promise.all([
    memoryRepository.loadContext({ assetId: input.assetId, userId: input.userId }),
    getCreativeLearningContext({ assetId: input.assetId, userId: input.userId, limit: 120 }),
    createAnalyticsRepository().findEvents({ assetId: input.assetId, limit: 240 }),
    buildPresenceContext(input.assetId, createPresenceRepository()),
  ]);

  const memoryFacts = memory.facts.map(factFromMemory);
  const classified = classifyIdentityFacts(memoryFacts);
  const presenceSummary = presence?.summary ?? [];
  const recentEvents = memory.events.slice(0, 20).map((event) => clean(event.summary));
  const history = memoryFacts.slice(0, 80);
  const activityFacts = classified.activities.concat(
    presenceSummary.map((value) => ({ text: clean(value), source: "presence" as const, confidence: 1 })),
  );
  const location = input.location ?? ((presence?.places?.[0] ?? "") ? { label: presence?.places?.[0], role: "presence" } : undefined);
  const activeContext = inferContext({ requested: input.context, presenceSummary, locationLabel: location?.label });
  const intents = intentsFromInput(input);
  const analytics = analyticsSignal(analyticsEvents);
  const creativeLearning = creativeSignal(learning);

  const observedSubject = clean(input.subject || memory.entities.find((entity) => entity.kind === "person" || entity.kind === "pet" || entity.kind === "business")?.name || "identity");
  const subject = claim(observedSubject, `Observed subject for asset ${input.assetId}`, input.subject ? "prompt" : "memory");

  const canonicalFacts = memoryFacts.slice(0, 120);
  const recurringPatterns = unique([
    ...learning.autonomousWinners,
    ...learning.acceptedPatterns,
    ...memoryFacts.filter((fact) => /again|returned|every day|daily|always|often|recurring|repeat/i.test(fact.text)).map((fact) => `RECURRING: ${fact.text}`),
  ]).slice(0, 40);

  const unresolvedQuestions = unique([
    ...learning.autonomousWeaknesses.slice(0, 5),
    ...memoryFacts.filter((fact) => /unknown|unresolved|missing|pending|not yet/i.test(fact.text)).map((fact) => `What changes around ${fact.text}?`),
  ]).slice(0, 20);

  const locations = [
    ...memory.events
      .map((event) => event.metadata?.place)
      .filter(Boolean)
      .map((label) => ({ label: clean(label), role: "memory" })),
    ...(location ? [location] : []),
  ] as IdentityLocation[];

  const sourceCount = memoryFacts.length + memory.events.length;
  const stateConfidence = Math.min(1, 0.35 + Math.min(0.4, sourceCount / 100) + (learning.autonomousConfidence * 0.2) + (presence?.summary?.length ? 0.05 : 0));

  return {
    identityId: input.assetId,
    kind: classifyKind(input.kind),
    subject,
    canonicalFacts,
    currentState: classified.currentState,
    traits: classified.traits,
    preferences: classified.preferences,
    activities: activityFacts,
    relationships: relationshipStates(memory),
    history,
    recentEvents,
    recurringPatterns,
    goals: intents.goals,
    intentions: intents.intentions,
    unresolvedQuestions,
    locations,
    activeContext,
    behavioralLearning: analytics,
    creativeLearning,
    entityStates: [],
    sourceMemoryCount: memory.entities.length + memoryFacts.length,
    sourceEventCount: memory.events.length,
    confidence: confidence(stateConfidence),
    generatedAt: new Date().toISOString(),
  };
}
