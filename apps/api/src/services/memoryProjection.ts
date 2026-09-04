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
} from "@qre/contracts";
import type { WorldModel } from "@qre/engine";

/**
 * MEMORY PROJECTION
 *
 * API-side persistence projection. Cognition owns the world model; this layer
 * converts that model into the durable memory contract used by the repository.
 * No database code belongs here and no domain/topic vocabulary is used to
 * decide entity kinds.
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

function eventId(assetId: string, event: WorldModel["events"][number]): string {
  return stableId(assetId, "event", `${event.id}|${event.raw}`);
}

function addEntity(
  entities: Map<string, MemoryWriteBatch["entities"][number]>,
  assetId: string,
  kind: MemoryEntityKind,
  name: string,
  confidence = 1,
  metadata?: Record<string, unknown>,
) {
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

function buildEntities(assetId: string, world: WorldModel) {
  const entities = new Map<string, MemoryWriteBatch["entities"][number]>();

  for (const participant of world.participants) {
    addEntity(entities, assetId, "person", participant, 1, { worldRole: "participant" });
  }

  for (const place of world.places) {
    addEntity(entities, assetId, "place", place, 1, { worldRole: "place" });
  }

  for (const event of world.events) {
    addEntity(entities, assetId, "event", event.raw, 0.95, { worldRole: "event", eventId: event.id });
    if (event.object) addEntity(entities, assetId, "object", event.object, 0.9, { worldRole: "object" });
    for (const detail of event.details) {
      addEntity(entities, assetId, "object", detail, 0.8, { worldRole: "detail", eventId: event.id });
    }
  }

  return [...entities.values()];
}

function buildFacts(
  assetId: string,
  world: WorldModel,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryFactWrite[] {
  const facts: MemoryFactWrite[] = [];

  for (const event of world.events) {
    const id = eventId(assetId, event);
    const participants = event.participants.length ? event.participants : [undefined];
    for (const participant of participants) {
      const entity = participant ? entityId(assetId, "person", participant) : id;
      const predicate = event.action ?? event.state ?? "occurred";
      facts.push({
        entityId: entity,
        kind: event.action ? "event" : "context",
        predicate,
        value: event.raw,
        confidence: 1,
        source,
        sourceRef: sessionId,
        status: "active",
        observedAt,
        visibility: VISIBILITY,
        metadata: {
          eventId: event.id,
          place: event.place,
          time: event.time,
          details: event.details,
        },
      });
    }

    if (event.place) {
      facts.push({
        entityId: entityId(assetId, "place", event.place),
        kind: "context",
        predicate: "experienced_event",
        value: event.raw,
        confidence: 1,
        source,
        sourceRef: sessionId,
        status: "active",
        observedAt,
        visibility: VISIBILITY,
        metadata: { eventId: event.id, participants: event.participants },
      });
    }
  }

  return facts;
}

function buildRelations(
  assetId: string,
  world: WorldModel,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryRelationWrite[] {
  return world.relations.map((relation) => {
    const fromKind: MemoryEntityKind = world.participants.includes(relation.from)
      ? "person"
      : world.places.includes(relation.from)
        ? "place"
        : "object";
    const toKind: MemoryEntityKind = world.participants.includes(relation.to)
      ? "person"
      : world.places.includes(relation.to)
        ? "place"
        : "object";

    return {
      fromEntityId: entityId(assetId, fromKind, relation.from),
      toEntityId: entityId(assetId, toKind, relation.to),
      relation: clean(relation.relation) || "connected_to",
      confidence: 1,
      source,
      sourceRef: sessionId,
      observedAt,
      visibility: VISIBILITY,
      metadata: { evidenceId: relation.evidenceId },
    };
  });
}

function buildEvents(
  assetId: string,
  world: WorldModel,
  source: MemorySource,
  observedAt: string,
  sessionId?: string,
): MemoryEventWrite[] {
  return world.events.map((event) => ({
    id: eventId(assetId, event),
    type: "world_event",
    summary: clean(event.raw).slice(0, 1000),
    occurredAt: observedAt,
    source,
    confidence: 1,
    entityIds: [
      ...event.participants.map((value) => entityId(assetId, "person", value)),
      ...(event.place ? [entityId(assetId, "place", event.place)] : []),
      entityId(assetId, "event", event.raw),
      ...(event.object ? [entityId(assetId, "object", event.object)] : []),
      ...event.details.map((detail) => entityId(assetId, "object", detail)),
    ],
    sessionId,
    metadata: {
      worldEventId: event.id,
      action: event.action,
      state: event.state,
      object: event.object,
      place: event.place,
      time: event.time,
      details: event.details,
    },
  }));
}

export function buildExperienceMemoryBatch(input: {
  operationId?: string;
  assetId: string;
  userId?: string;
  world: WorldModel;
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
    entities: buildEntities(input.assetId, input.world),
    facts: buildFacts(input.assetId, input.world, source, observedAt, input.sessionId),
    relations: buildRelations(input.assetId, input.world, source, observedAt, input.sessionId),
    events: buildEvents(input.assetId, input.world, source, observedAt, input.sessionId),
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
  const summary = momentText
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
