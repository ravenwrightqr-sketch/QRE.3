import type {
  CognitiveExperiencePlan,
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
  service: "service",
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

function entitiesForPlan(assetId: string, plan: CognitiveExperiencePlan) {
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
    const kind = ROLE_KIND[slot.role] ?? "other";
    for (const value of slot.values) {
      const name = clean(value);
      if (!name) continue;
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
  plan: CognitiveExperiencePlan,
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
      const entityId = stableId(
        "pending",
        ROLE_KIND[slot.role] ?? "other",
        cleanValue,
      );
      writes.push({
        entityId,
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
          fromEntityId: stableId(assetId, ROLE_KIND[relation.from] ?? "other", fromValue),
          toEntityId: stableId(assetId, ROLE_KIND[relation.to] ?? "other", toValue),
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
  const entities = entitiesForPlan(input.assetId, input.plan);
  const facts = factWrites(input.plan, source, observedAt, input.sessionId).map((fact) => ({
    ...fact,
    entityId: fact.entityId?.replace(/^mem_/, "mem_"),
  }));
  const relations = relationWrites(input.assetId, input.plan, source, observedAt, input.sessionId);

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
