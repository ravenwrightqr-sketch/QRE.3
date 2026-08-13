import { Prisma } from "@prisma/client";

import { db } from "@qre/db";

export type EntityMemoryRecord = {
  id: string;
  assetId: string;
  kind: string;
  name: string;
  canonicalKey: string;
  confidence: number;
  visibility: string;
  metadata?: unknown;
  facts: Array<{
    id: string;
    predicate: string;
    value: string;
    confidence: number;
    source: string;
    observedAt: string;
    metadata?: unknown;
  }>;
  events: Array<{
    id: string;
    type: string;
    summary: string;
    occurredAt: string;
    source: string;
    confidence: number;
    sessionId?: string;
    metadata?: unknown;
  }>;
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Durable entity memory is scoped by Asset. Asset is the tenant boundary for
 * the current memory architecture, so "Coco" on Bettie's asset can never
 * resolve to "Coco" on another groomer's asset.
 */
export async function loadEntityMemory(input: {
  assetId: string;
  entityName: string;
}): Promise<EntityMemoryRecord | null> {
  const key = normalize(input.entityName);
  if (!key) return null;

  const rows = await db.$queryRaw<any[]>(Prisma.sql`
    SELECT *
    FROM "qre_memory_entity"
    WHERE "asset_id" = ${input.assetId}
      AND "canonical_key" = ${key}
    LIMIT 1
  `);

  const entity = rows[0];
  if (!entity) return null;

  const [facts, events] = await Promise.all([
    db.$queryRaw<any[]>(Prisma.sql`
      SELECT *
      FROM "qre_memory_fact"
      WHERE "asset_id" = ${input.assetId}
        AND "entity_id" = ${entity.id}
        AND "status" = 'active'
      ORDER BY "observed_at" DESC, "confidence" DESC
      LIMIT 200
    `),
    db.$queryRaw<any[]>(Prisma.sql`
      SELECT *
      FROM "qre_memory_event"
      WHERE "asset_id" = ${input.assetId}
        AND (
          ${entity.id} = ANY("entity_ids")
          OR "entity_ids" = '[]'::jsonb
        )
      ORDER BY "occurred_at" DESC
      LIMIT 100
    `),
  ]);

  return {
    id: entity.id,
    assetId: entity.asset_id,
    kind: entity.kind,
    name: entity.name,
    canonicalKey: entity.canonical_key,
    confidence: Number(entity.confidence),
    visibility: entity.visibility,
    metadata: entity.metadata ?? undefined,
    facts: facts.map((fact) => ({
      id: fact.id,
      predicate: fact.predicate,
      value: fact.value,
      confidence: Number(fact.confidence),
      source: fact.source,
      observedAt: new Date(fact.observed_at).toISOString(),
      metadata: fact.metadata ?? undefined,
    })),
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      summary: event.summary,
      occurredAt: new Date(event.occurred_at).toISOString(),
      source: event.source,
      confidence: Number(event.confidence),
      sessionId: event.session_id ?? undefined,
      metadata: event.metadata ?? undefined,
    })),
  };
}
