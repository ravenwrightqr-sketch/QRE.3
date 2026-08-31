import { randomUUID } from "node:crypto";
import type {
  Experience,
  MemoryContext,
  MemoryEntityKind,
  MemoryFactWrite,
  MemoryEventWrite,
  MemoryRelationWrite,
  MemorySource,
  MemoryVisibility,
  MemoryWriteBatch,
  RealityGraph,
  RealityEvent,
} from "@qre/contracts";

/**
 * API-side durable-memory projection.
 *
 * ROLE: persistence projection only.
 * AUTHORITY: RealityGraph from the canonical Author path.
 * HARD BOUNDARY: no API dependency on engine-internal cognition types.
 */

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

function entityId(assetId: string, kind: MemoryEntityKind, value: string): string {
  return stableId(assetId, kind, value);
}

/**
 * Canonical durable ID for a RealityGraph event entity.
 *
 * Every projection surface uses this exact identity rule. The event entity,
 * its fact, relations, and memory-event references therefore cannot drift.
 */
function eventEntityId(assetId: string, event: RealityEvent): string {
  return entityId(assetId, "event", event.label);
}

function addEntity(
  entities: Map<string, MemoryWriteBatch["entities"][number]>,
  assetId: string,
  kind: MemoryEntityKind,
  name: string,
  confidence = 1,
  metadata?: Record<string, unknown>,
): void {
  const cleanName = clean(name);
  if (!cleanName) return;
  const id = entityId(assetId, kind, cleanName);
  entities.set(id, {
    id,
    kind,
    name: cleanName,
    canonicalKey: lower(cleanName),
    confidence: Math.min(1, confidence),
    visibility: VISIBILITY,
    metadata,
  });
}

function buildEntities(assetId: string, graph: RealityGraph) {
  const entities = new Map<string, MemoryWriteBatch["entities"][number]>();

  for (const event of graph.events) {
    const id = eventEntityId(assetId, event);
    entities.set(id, {
      id,
      kind: "event",
      name: clean(event.label),
      canonicalKey: lower(event.label),
      confidence: 0.95,
      visibility: VISIBILITY,
      metadata: {
        realityRole: "event",
        realityEventId: event.id,
      },
    });

    for (const value of event.entities) {
      addEntity(entities, assetId, "object", value, 0.85, {
        realityRole: "event_entity",
        realityEventId: event.id,
      });
    }

    if (event.place) {
      addEntity(entities, assetId, "place", event.place, 1, {
        realityRole: "place",
        realityEventId: event.id,
      });
    }
  }

  return [...entities.values()];
}

function buildFacts(
  assetId: string,
  graph: RealityGraph,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryFactWrite[] {
  const facts: MemoryFactWrite[] = [];

  for (const event of graph.events) {
    facts.push({
      entityId: eventEntityId(assetId, event),
      kind: "event",
      predicate: "occurred",
      value: event.label,
      confidence: 1,
      source,
      sourceRef: sessionId,
      status: "active",
      observedAt,
      visibility: VISIBILITY,
      metadata: {
        realityEventId: event.id,
        sourceIds: event.sourceIds,
        entities: event.entities,
        place: event.place,
        time: event.time,
        provenance: event.provenance,
      },
    });

    if (event.place) {
      facts.push({
        entityId: entityId(assetId, "place", event.place),
        kind: "context",
        predicate: "experienced_event",
        value: event.label,
        confidence: 1,
        source,
        sourceRef: sessionId,
        status: "active",
        observedAt,
        visibility: VISIBILITY,
        metadata: { realityEventId: event.id },
      });
    }
  }

  return facts;
}

function relationKindForEndpoint(graph: RealityGraph, endpoint: string): MemoryEntityKind {
  if (graph.events.some((event) => event.id === endpoint)) return "event";
  if (graph.events.some((event) => event.place === endpoint)) return "place";
  return "object";
}

function eventForEndpoint(
  graph: RealityGraph,
  endpoint: string,
): RealityEvent | undefined {
  return graph.events.find((event) => event.id === endpoint);
}

function buildRelations(
  assetId: string,
  graph: RealityGraph,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryRelationWrite[] {
  return graph.relations.map((relation) => {
    const fromEvent = eventForEndpoint(graph, relation.from);
    const toEvent = eventForEndpoint(graph, relation.to);
    const fromKind = relationKindForEndpoint(graph, relation.from);
    const toKind = relationKindForEndpoint(graph, relation.to);

    return {
      fromEntityId: fromEvent
        ? eventEntityId(assetId, fromEvent)
        : entityId(assetId, fromKind, relation.from),
      toEntityId: toEvent
        ? eventEntityId(assetId, toEvent)
        : entityId(assetId, toKind, relation.to),
      relation: clean(relation.kind) || "connected_to",
      confidence: Math.min(1, Math.max(0, relation.strength)),
      source,
      sourceRef: sessionId,
      observedAt,
      visibility: VISIBILITY,
      metadata: { realityRelation: relation.kind },
    };
  });
}

function buildEvents(
  assetId: string,
  graph: RealityGraph,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryEventWrite[] {
  return graph.events.map((event) => ({
    id: randomUUID(),
    type: "world_event",
    summary: clean(event.label).slice(0, 1000),
    occurredAt: observedAt,
    source,
    confidence: 1,
    entityIds: [
      eventEntityId(assetId, event),
      ...event.entities.map((value) => entityId(assetId, "object", value)),
      ...(event.place ? [entityId(assetId, "place", event.place)] : []),
    ],
    sessionId,
    metadata: {
      realityEventId: event.id,
      sourceIds: event.sourceIds,
      place: event.place,
      time: event.time,
      provenance: event.provenance,
    },
  }));
}

export function buildExperienceMemoryBatch(input: {
  operationId?: string;
  assetId: string;
  userId?: string;
  graph: RealityGraph;
  sessionId?: string;
  source?: MemorySource;
  observedAt?: string;
}): MemoryWriteBatch {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const source = input.source ?? "prompt";

  return {
    operationId: input.operationId,
    assetId: input.assetId,
    userId: input.userId,
    entities: buildEntities(input.assetId, input.graph),
    facts: buildFacts(input.assetId, input.graph, source, observedAt, input.sessionId),
    relations: buildRelations(input.assetId, input.graph, source, observedAt, input.sessionId),
    events: buildEvents(input.assetId, input.graph, source, observedAt, input.sessionId),
  };
}

export function buildScanMemoryBatch(input: {
  assetId: string;
  experience: Experience;
  userId?: string;
}): MemoryWriteBatch {
  const now = new Date().toISOString();
  const firstMoment = input.experience.moments[0];
  const momentText = firstMoment && "text" in firstMoment ? firstMoment.text : undefined;
  const summary = momentText ?? input.experience.memorySnapshot?.summary ?? "QRE experience scanned";

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
        momentCount: input.experience.moments.length,
        sceneCount: input.experience.cinematicScenes.length,
        access: input.experience.access,
      },
    }],
  };
}

export function memoryContextToCognitiveSummary(context: MemoryContext): string[] {
  const byEntity = new Map(context.entities.map((entity) => [entity.id, entity.name]));
  return [
    ...context.events.slice(0, 12).map((event) => {
      const entities = event.entityIds.map((id) => byEntity.get(id)).filter(Boolean).join(", ");
      return entities ? `${event.summary} (${entities})` : event.summary;
    }),
    ...context.facts
      .filter((fact) => fact.status === "active" && fact.confidence >= 0.7)
      .slice(0, 32)
      .map((fact) => `${fact.predicate}: ${fact.value}`),
  ].filter(Boolean);
}
