import type {
  CognitiveExperiencePlan,
  Experience,
  MemoryContext,
  MemoryEntityKind,
  MemoryFactKind,
  MemoryFactWrite,
  MemoryEventWrite,
  MemoryRelationWrite,
  MemorySource,
  MemoryVisibility,
  MemoryWriteBatch,
} from "@qre/contracts";

/**
 * MEMORY COMPILER
 *
 * Converts conserved cognitive evidence into durable world state.
 *
 * This layer is intentionally conservative:
 * - prompt/context evidence can become memory;
 * - derived facts require confidence;
 * - creative_realization never becomes factual memory;
 * - memory writes are append-oriented and auditable;
 * - the engine remains database-agnostic.
 */

const ROLE_KIND: Record<string, MemoryEntityKind> = {
  subject: "other",
  event: "event",
  medium: "object",
  artifact: "object",
  participants: "person",
  place: "place",
  social: "other",
  transformation: "experience",
};

const FACT_KIND: Record<string, MemoryFactKind> = {
  subject: "identity",
  event: "event",
  medium: "attribute",
  artifact: "attribute",
  participants: "relationship",
  outcome: "outcome",
  emotion: "attribute",
  affordance: "attribute",
  temporal: "history",
  place: "context",
  social: "relationship",
  transformation: "history",
  constraint: "context",
};

const VISIBILITY: MemoryVisibility = "shared";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

function stableId(assetId: string, kind: string, value: string): string {
  let hash = 2166136261;
  const input = `${assetId}|${kind}|${lower(value)}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mem_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function inferKind(role: string, value: string, prompt: string): MemoryEntityKind {
  const text = `${lower(value)} ${lower(prompt)}`;
  if (/\b(dog|cat|pet|puppy|kitten|horse|bird|parrot|rabbit|animal|poodle|rescue)\b/.test(text)) return "animal";
  if (/\b(wedding|concert|festival|birthday|party|ceremony|memorial|event|anniversary|conference)\b/.test(text)) return "event";
  if (/\b(house|home|property|building|address|street|road|avenue|beach|park|venue|hotel|museum)\b/.test(text)) return "property";
  if (/\b(company|business|brand|shop|studio|restaurant|hotel|salon|groomer|rescue|organization|shelter)\b/.test(text)) return "organization";
  if (role === "place") return "place";
  if (role === "event") return "event";
  if (role === "participants") return "person";
  if (role === "artifact" || role === "medium") return "object";
  return ROLE_KIND[role] ?? "other";
}

function evidenceAllowsMemory(slot: {
  status: string;
  confidence: number;
  evidence?: Array<{ source: string; confidence: number }>;
}): boolean {
  if (!["observed", "derived"].includes(slot.status)) return false;
  if (slot.confidence < 0.7) return false;
  return (slot.evidence ?? []).some(
    (evidence) =>
      evidence.source !== "creative_realization" &&
      evidence.confidence >= 0.7,
  );
}

function entitiesForPlan(assetId: string, plan: CognitiveExperiencePlan, prompt: string) {
  const entities = new Map<string, {
    id: string;
    kind: MemoryEntityKind;
    name: string;
    canonicalKey: string;
    confidence: number;
    visibility: MemoryVisibility;
    metadata?: Record<string, unknown>;
  }>();

  for (const slot of plan.premise?.slots ?? []) {
    if (!evidenceAllowsMemory(slot)) continue;
    for (const value of slot.values) {
      const name = clean(value);
      if (!name) continue;
      const kind = inferKind(slot.role, name, prompt);
      const id = stableId(assetId, kind, name);
      entities.set(id, {
        id,
        kind,
        name,
        canonicalKey: lower(name),
        confidence: Math.min(1, slot.confidence),
        visibility: VISIBILITY,
        metadata: { premiseRole: slot.role },
      });
    }
  }

  return [...entities.values()];
}

function factWrites(
  assetId: string,
  plan: CognitiveExperiencePlan,
  prompt: string,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryFactWrite[] {
  const writes: MemoryFactWrite[] = [];

  for (const slot of plan.premise?.slots ?? []) {
    if (!evidenceAllowsMemory(slot)) continue;

    const kind = FACT_KIND[slot.role] ?? "context";
    for (const value of slot.values) {
      const cleanValue = clean(value);
      if (!cleanValue) continue;
      const entityKind = inferKind(slot.role, cleanValue, prompt);
      writes.push({
        entityId: stableId(assetId, entityKind, cleanValue),
        kind,
        predicate: slot.role,
        value: cleanValue,
        confidence: Math.min(1, slot.confidence),
        source,
        sourceRef: sessionId,
        status: "active",
        observedAt,
        visibility: VISIBILITY,
        metadata: {
          evidence: slot.evidence,
        },
      });
    }
  }

  return writes;
}

function relationWrites(
  assetId: string,
  plan: CognitiveExperiencePlan,
  prompt: string,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryRelationWrite[] {
  const writes: MemoryRelationWrite[] = [];

  for (const relation of plan.premise?.relations ?? []) {
    if (relation.confidence < 0.7) continue;
    const from = (plan.premise?.slots ?? []).find((slot) => slot.role === relation.from);
    const to = (plan.premise?.slots ?? []).find((slot) => slot.role === relation.to);
    if (!from || !to || !evidenceAllowsMemory(from) || !evidenceAllowsMemory(to)) continue;

    for (const fromValue of from.values.slice(0, 3)) {
      for (const toValue of to.values.slice(0, 3)) {
        writes.push({
          fromEntityId: stableId(assetId, inferKind(relation.from, fromValue, prompt), fromValue),
          toEntityId: stableId(assetId, inferKind(relation.to, toValue, prompt), toValue),
          relation: clean(relation.relation) || `${relation.from}_to_${relation.to}`,
          confidence: Math.min(1, relation.confidence),
          source,
          sourceRef: sessionId,
          observedAt,
          visibility: VISIBILITY,
          metadata: { evidence: relation.evidence },
        });
      }
    }
  }

  return writes;
}

export function buildMemoryWriteBatch(input: {
  assetId: string;
  userId?: string;
  prompt: string;
  plan: CognitiveExperiencePlan;
  sessionId?: string;
  source?: MemorySource;
  observedAt?: string;
}): MemoryWriteBatch {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const source = input.source ?? "prompt";
  const entities = entitiesForPlan(input.assetId, input.plan, input.prompt);
  const facts = factWrites(input.assetId, input.plan, input.prompt, source, observedAt, input.sessionId);
  const relations = relationWrites(input.assetId, input.plan, input.prompt, source, observedAt, input.sessionId);

  const event: MemoryEventWrite = {
    type: "experience_compiled",
    summary: clean(input.prompt).slice(0, 1000),
    occurredAt: observedAt,
    source,
    confidence: 0.9,
    entityIds: entities.map((entity) => entity.id),
    sessionId: input.sessionId,
    metadata: {
      direction: input.plan.direction,
      subject: input.plan.centralSubject,
      factsWritten: facts.length,
      relationsWritten: relations.length,
    },
  };

  return {
    assetId: input.assetId,
    userId: input.userId,
    entities,
    facts,
    relations,
    events: [event],
  };
}

export function buildScanMemoryBatch(input: {
  assetId: string;
  experience: Experience;
  userId?: string;
}): MemoryWriteBatch {
  const now = new Date().toISOString();
  const summary = input.experience.moments?.[0]?.meta?.text
    ?? input.experience.memorySnapshot?.summary
    ?? "QRE experience scanned";

  return {
    assetId: input.assetId,
    userId: input.userId,
    entities: [],
    facts: [],
    relations: [],
    events: [{
      type: "experience_scanned",
      summary: clean(summary).slice(0, 1000),
      occurredAt: now,
      source: "scan",
      confidence: 1,
      entityIds: [],
      sessionId: input.experience.sessionId ?? undefined,
      metadata: {
        preview: input.experience.preview,
        momentCount: input.experience.moments?.length ?? 0,
        sceneCount: input.experience.cinematicScenes?.length ?? 0,
        access: input.experience.access,
      },
    }],
  };
}

export function memoryContextToCompilerMemories(context: MemoryContext) {
  const byEntity = new Map(context.entities.map((entity) => [entity.id, entity.name]));
  return [
    ...context.events.slice(0, 8).map((event) => ({
      summary: event.summary,
      entities: event.entityIds.map((id) => byEntity.get(id)).filter(Boolean) as string[],
      timestamp: event.occurredAt,
    })),
    ...context.facts
      .filter((fact) => fact.status === "active" && fact.confidence >= 0.7)
      .slice(0, 24)
      .map((fact) => ({
        summary: `${fact.predicate}: ${fact.value}`,
        entities: fact.entityId && byEntity.has(fact.entityId) ? [byEntity.get(fact.entityId)!] : [],
        timestamp: fact.observedAt,
      })),
  ];
}
