import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import { db } from "@qre/db";

import type {
  MemoryContext,
  MemoryFactKind,
  MemoryFactStatus,
  MemoryVisibility,
  MemoryWriteBatch,
} from "@qre/contracts";

import { userHasAssetAccess } from "../services/assetAccess.js";

export type MemoryRepository = {
  assertAccess(input: { assetId: string; userId: string }): Promise<void>;
  loadContext(input: { assetId: string; userId?: string }): Promise<MemoryContext>;
  writeBatch(batch: MemoryWriteBatch): Promise<void>;
  correctFact(input: {
    assetId: string;
    factId: string;
    userId: string;
    value: string;
    predicate?: string;
    kind?: MemoryFactKind;
    confidence?: number;
    visibility?: MemoryVisibility;
  }): Promise<{ factId: string; supersededFactId: string }>;
  setFactGovernance(input: {
    assetId: string;
    factId: string;
    userId: string;
    status?: MemoryFactStatus;
    visibility?: MemoryVisibility;
  }): Promise<{ factId: string; status: MemoryFactStatus; visibility: MemoryVisibility }>;
};

const json = (value: unknown) =>
  Prisma.sql`${JSON.stringify(value ?? {})}::jsonb`;

const mapEntity = (row: any) => ({
  id: row.id,
  kind: row.kind,
  name: row.name,
  canonicalKey: row.canonical_key,
  confidence: Number(row.confidence),
  visibility: row.visibility,
  metadata: row.metadata ?? undefined,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

const mapFact = (row: any) => ({
  id: row.id,
  entityId: row.entity_id ?? undefined,
  kind: row.kind,
  predicate: row.predicate,
  value: row.value,
  confidence: Number(row.confidence),
  source: row.source,
  sourceRef: row.source_ref ?? undefined,
  status: row.status,
  observedAt: new Date(row.observed_at).toISOString(),
  validFrom: row.valid_from ? new Date(row.valid_from).toISOString() : undefined,
  validTo: row.valid_to ? new Date(row.valid_to).toISOString() : undefined,
  visibility: row.visibility,
  metadata: row.metadata ?? undefined,
});

const mapRelation = (row: any) => ({
  id: row.id,
  fromEntityId: row.from_entity_id,
  toEntityId: row.to_entity_id,
  relation: row.relation,
  confidence: Number(row.confidence),
  source: row.source,
  sourceRef: row.source_ref ?? undefined,
  observedAt: new Date(row.observed_at).toISOString(),
  visibility: row.visibility,
  metadata: row.metadata ?? undefined,
});

const mapEvent = (row: any) => ({
  id: row.id,
  type: row.type,
  summary: row.summary,
  occurredAt: new Date(row.occurred_at).toISOString(),
  source: row.source,
  confidence: Number(row.confidence),
  entityIds: Array.isArray(row.entity_ids) ? row.entity_ids : [],
  sessionId: row.session_id ?? undefined,
  metadata: row.metadata ?? undefined,
});

export function createMemoryRepository(): MemoryRepository {
  return {
    async assertAccess({ assetId, userId }) {
      const allowed = await userHasAssetAccess(assetId, userId);
      if (!allowed) {
        throw new Error("Memory access denied");
      }
    },

    async loadContext({ assetId, userId }) {
      if (userId) {
        await this.assertAccess({ assetId, userId });
      }

      const [entities, facts, relations, events] = await Promise.all([
        db.$queryRaw<any[]>(Prisma.sql`
          SELECT *
          FROM "qre_memory_entity"
          WHERE "asset_id" = ${assetId}
          ORDER BY "updated_at" DESC
          LIMIT 100
        `),
        db.$queryRaw<any[]>(Prisma.sql`
          SELECT *
          FROM "qre_memory_fact"
          WHERE "asset_id" = ${assetId}
            AND "status" = 'active'
            AND "confidence" >= 0.7
          ORDER BY "observed_at" DESC, "confidence" DESC
          LIMIT 200
        `),
        db.$queryRaw<any[]>(Prisma.sql`
          SELECT *
          FROM "qre_memory_relation"
          WHERE "asset_id" = ${assetId}
            AND "confidence" >= 0.7
          ORDER BY "observed_at" DESC, "confidence" DESC
          LIMIT 200
        `),
        db.$queryRaw<any[]>(Prisma.sql`
          SELECT *
          FROM "qre_memory_event"
          WHERE "asset_id" = ${assetId}
          ORDER BY "occurred_at" DESC
          LIMIT 50
        `),
      ]);

      return {
        assetId,
        generatedAt: new Date().toISOString(),
        entities: entities.map(mapEntity),
        facts: facts.map(mapFact),
        relations: relations.map(mapRelation),
        events: events.map(mapEvent),
      };
    },

    async writeBatch(batch) {
      await db.$transaction(async (tx) => {
        for (const entity of batch.entities) {
          const id = entity.id ?? randomUUID();
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "qre_memory_entity"
              ("id", "asset_id", "kind", "name", "canonical_key", "confidence", "visibility", "metadata")
            VALUES
              (${id}, ${batch.assetId}, ${entity.kind}, ${entity.name}, ${entity.canonicalKey},
               ${entity.confidence}, ${entity.visibility}, ${json(entity.metadata)})
            ON CONFLICT ("asset_id", "kind", "canonical_key")
            DO UPDATE SET
              "name" = EXCLUDED."name",
              "confidence" = GREATEST("qre_memory_entity"."confidence", EXCLUDED."confidence"),
              "visibility" = EXCLUDED."visibility",
              "metadata" = COALESCE(EXCLUDED."metadata", "qre_memory_entity"."metadata"),
              "updated_at" = NOW()
          `);
        }

        for (const fact of batch.facts) {
          const entityId = fact.entityId ?? null;

          await tx.$executeRaw(Prisma.sql`
            UPDATE "qre_memory_fact"
            SET "status" = 'superseded', "updated_at" = NOW()
            WHERE "asset_id" = ${batch.assetId}
              AND "entity_id" = ${entityId}
              AND "predicate" = ${fact.predicate}
              AND "status" = 'active'
              AND "value" <> ${fact.value}
          `);

          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "qre_memory_fact"
              ("id", "asset_id", "entity_id", "kind", "predicate", "value", "confidence",
               "source", "source_ref", "status", "observed_at", "valid_from", "valid_to",
               "visibility", "metadata")
            SELECT
              ${fact.id ?? randomUUID()}, ${batch.assetId}, ${entityId}, ${fact.kind},
              ${fact.predicate}, ${fact.value}, ${fact.confidence}, ${fact.source},
              ${fact.sourceRef ?? null}, ${fact.status}, ${new Date(fact.observedAt)},
              ${fact.validFrom ? new Date(fact.validFrom) : null},
              ${fact.validTo ? new Date(fact.validTo) : null}, ${fact.visibility}, ${json(fact.metadata)}
            WHERE NOT EXISTS (
              SELECT 1
              FROM "qre_memory_fact"
              WHERE "asset_id" = ${batch.assetId}
                AND "entity_id" = ${entityId}
                AND "predicate" = ${fact.predicate}
                AND "value" = ${fact.value}
                AND "status" = 'active'
            )
          `);
        }

        for (const relation of batch.relations) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "qre_memory_relation"
              ("id", "asset_id", "from_entity_id", "to_entity_id", "relation", "confidence",
               "source", "source_ref", "observed_at", "visibility", "metadata")
            VALUES
              (${relation.id ?? randomUUID()}, ${batch.assetId}, ${relation.fromEntityId},
               ${relation.toEntityId}, ${relation.relation}, ${relation.confidence},
               ${relation.source}, ${relation.sourceRef ?? null}, ${new Date(relation.observedAt)},
               ${relation.visibility}, ${json(relation.metadata)})
            ON CONFLICT ("asset_id", "from_entity_id", "to_entity_id", "relation")
            DO UPDATE SET
              "confidence" = GREATEST("qre_memory_relation"."confidence", EXCLUDED."confidence"),
              "source" = EXCLUDED."source",
              "source_ref" = EXCLUDED."source_ref",
              "observed_at" = EXCLUDED."observed_at",
              "visibility" = EXCLUDED."visibility",
              "metadata" = COALESCE(EXCLUDED."metadata", "qre_memory_relation"."metadata"),
              "updated_at" = NOW()
          `);
        }

        for (const event of batch.events) {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "qre_memory_event"
              ("id", "asset_id", "session_id", "type", "summary", "occurred_at", "source",
               "confidence", "entity_ids", "metadata")
            VALUES
              (${event.id ?? randomUUID()}, ${batch.assetId}, ${event.sessionId ?? null},
               ${event.type}, ${event.summary}, ${new Date(event.occurredAt)}, ${event.source},
               ${event.confidence}, ${json(event.entityIds)}, ${json(event.metadata)})
          `);
        }

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "qre_memory_audit"
            ("id", "asset_id", "user_id", "operation", "target_type", "payload")
          VALUES
            (${randomUUID()}, ${batch.assetId}, ${batch.userId ?? null}, 'memory_batch', 'memory', ${json({
              entityCount: batch.entities.length,
              factCount: batch.facts.length,
              relationCount: batch.relations.length,
              eventCount: batch.events.length,
            })})
        `);
      });
    },

    async correctFact({
      assetId,
      factId,
      userId,
      value,
      predicate,
      kind,
      confidence,
      visibility,
    }) {
      await this.assertAccess({ assetId, userId });

      return db.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<any[]>(Prisma.sql`
          SELECT *
          FROM "qre_memory_fact"
          WHERE "id" = ${factId}
            AND "asset_id" = ${assetId}
          FOR UPDATE
        `);

        const current = rows[0];
        if (!current) throw new Error("Memory fact not found");

        const nextId = randomUUID();
        const nextPredicate = predicate ?? current.predicate;
        const nextKind = kind ?? current.kind;
        const nextConfidence =
          confidence === undefined ? Number(current.confidence) : confidence;
        const nextVisibility = visibility ?? current.visibility;
        const now = new Date();

        await tx.$executeRaw(Prisma.sql`
          UPDATE "qre_memory_fact"
          SET "status" = 'superseded',
              "updated_at" = NOW()
          WHERE "id" = ${factId}
            AND "asset_id" = ${assetId}
        `);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "qre_memory_fact"
            ("id", "asset_id", "entity_id", "kind", "predicate", "value", "confidence",
             "source", "source_ref", "status", "observed_at", "valid_from", "valid_to",
             "visibility", "metadata")
          VALUES
            (${nextId}, ${assetId}, ${current.entity_id}, ${nextKind}, ${nextPredicate}, ${value},
             ${nextConfidence}, 'user', ${`correction:${factId}`}, 'active', ${now},
             ${current.valid_from}, ${current.valid_to}, ${nextVisibility},
             ${json({
               ...(current.metadata ?? {}),
               correctedFrom: factId,
             })})
        `);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "qre_memory_audit"
            ("id", "asset_id", "user_id", "operation", "target_type", "target_id", "payload")
          VALUES
            (${randomUUID()}, ${assetId}, ${userId}, 'correct', 'fact', ${factId}, ${json({
              replacementFactId: nextId,
            })})
        `);

        return { factId: nextId, supersededFactId: factId };
      });
    },

    async setFactGovernance({
      assetId,
      factId,
      userId,
      status,
      visibility,
    }) {
      await this.assertAccess({ assetId, userId });

      return db.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<any[]>(Prisma.sql`
          SELECT "status", "visibility"
          FROM "qre_memory_fact"
          WHERE "id" = ${factId}
            AND "asset_id" = ${assetId}
          FOR UPDATE
        `);

        const current = rows[0];
        if (!current) throw new Error("Memory fact not found");

        const nextStatus = status ?? current.status;
        const nextVisibility = visibility ?? current.visibility;

        await tx.$executeRaw(Prisma.sql`
          UPDATE "qre_memory_fact"
          SET "status" = ${nextStatus},
              "visibility" = ${nextVisibility},
              "updated_at" = NOW()
          WHERE "id" = ${factId}
            AND "asset_id" = ${assetId}
        `);

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "qre_memory_audit"
            ("id", "asset_id", "user_id", "operation", "target_type", "target_id", "payload")
          VALUES
            (${randomUUID()}, ${assetId}, ${userId}, 'govern', 'fact', ${factId}, ${json({
              previousStatus: current.status,
              nextStatus,
              previousVisibility: current.visibility,
              nextVisibility,
            })})
        `);

        return {
          factId,
          status: nextStatus as MemoryFactStatus,
          visibility: nextVisibility as MemoryVisibility,
        };
      });
    },
  };
}
