import {
  createHash,
  randomUUID,
} from "node:crypto";

import { Prisma } from "@prisma/client";

import { db } from "@qre/db";

import type {
  MemoryContext,
  MemoryWriteBatch,
} from "@qre/contracts";

import { userHasAssetAccess } from "../services/assetAccess.js";

export type MemoryRepository = {
  assertAccess(input: {
    assetId: string;
    userId: string;
  }): Promise<void>;

  loadContext(input: {
    assetId: string;
    userId?: string;
  }): Promise<MemoryContext>;

  writeBatch(
    batch: MemoryWriteBatch,
  ): Promise<void>;
};

const json = (
  value: unknown,
) =>
  Prisma.sql`${JSON.stringify(
    value ?? {},
  )}::jsonb`;

function elapsedMs(
  startedAt: number,
): number {
  return Date.now() - startedAt;
}

function errorCode(
  error: unknown,
): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code =
      (error as {
        code?: unknown;
      }).code;

    return typeof code ===
      "string"
      ? code
      : undefined;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error
  ) {
    const cause =
      (error as {
        cause?: unknown;
      }).cause;

    if (
      typeof cause === "object" &&
      cause !== null &&
      "code" in cause
    ) {
      const code =
        (cause as {
          code?: unknown;
        }).code;

      return typeof code ===
        "string"
        ? code
        : undefined;
    }
  }

  return undefined;
}

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

/**
 * Convert an arbitrary stable operation key into a UUID.
 *
 * Memory audit/event IDs may be UUID-backed in PostgreSQL, while callers
 * may naturally supply identifiers such as:
 *
 *   "session-123:author-memory"
 *
 * The same logical key therefore always produces the same UUID.
 */
function deterministicUuid(
  key: string,
): string {
  const hash =
    createHash("sha256")
      .update(key)
      .digest();

  const bytes =
    Buffer.from(
      hash.subarray(
        0,
        16,
      ),
    );

  // UUID v4-compatible version bits.
  bytes[6] =
    (bytes[6] & 0x0f) |
    0x40;

  // RFC 4122 variant bits.
  bytes[8] =
    (bytes[8] & 0x3f) |
    0x80;

  const hex =
    bytes.toString(
      "hex",
    );

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Neon/pooled PostgreSQL connections can be closed while the Author is
 * spending several minutes in local model inference.
 *
 * Retry only transient connection failures.
 *
 * Do not retry constraint violations, authorization failures, malformed
 * queries, or other deterministic application errors.
 */
async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const message =
        errorMessage(
          error,
        ).toLowerCase();

      const code =
        errorCode(
          error,
        )?.toLowerCase() ?? "";

      const transient =
        message.includes(
          "connection",
        ) ||
        message.includes(
          "connection pool",
        ) ||
        message.includes(
          "closed",
        ) ||
        message.includes(
          "can't reach database",
        ) ||
        message.includes(
          "timed out",
        ) ||
        message.includes(
          "timeout",
        ) ||
        code ===
          "p1001" ||
        code ===
          "p1017";

      if (
        !transient ||
        attempt >= retries
      ) {
        throw error;
      }

      console.warn(
        "[QRE][DB] transient connection failure; retrying",
        `attempt=${attempt + 1}/${retries}`,
        `message=${errorMessage(error)}`,
      );

      await new Promise<void>(
        (
          resolve,
        ) => {
          setTimeout(
            resolve,
            250 *
              (attempt + 1),
          );
        },
      );
    }
  }

  throw lastError;
}

const mapEntity = (
  row: any,
) => ({
  id: row.id,
  kind: row.kind,
  name: row.name,
  canonicalKey:
    row.canonical_key,
  confidence: Number(
    row.confidence,
  ),
  visibility:
    row.visibility,
  metadata:
    row.metadata ??
    undefined,
  createdAt:
    new Date(
      row.created_at,
    ).toISOString(),
  updatedAt:
    new Date(
      row.updated_at,
    ).toISOString(),
});

const mapFact = (
  row: any,
) => ({
  id: row.id,
  entityId:
    row.entity_id ??
    undefined,
  kind: row.kind,
  predicate:
    row.predicate,
  value: row.value,
  confidence: Number(
    row.confidence,
  ),
  source: row.source,
  sourceRef:
    row.source_ref ??
    undefined,
  status: row.status,
  observedAt:
    new Date(
      row.observed_at,
    ).toISOString(),
  validFrom:
    row.valid_from
      ? new Date(
          row.valid_from,
        ).toISOString()
      : undefined,
  validTo:
    row.valid_to
      ? new Date(
          row.valid_to,
        ).toISOString()
      : undefined,
  visibility:
    row.visibility,
  metadata:
    row.metadata ??
    undefined,
});

const mapRelation = (
  row: any,
) => ({
  id: row.id,
  fromEntityId:
    row.from_entity_id,
  toEntityId:
    row.to_entity_id,
  relation:
    row.relation,
  confidence: Number(
    row.confidence,
  ),
  source: row.source,
  sourceRef:
    row.source_ref ??
    undefined,
  observedAt:
    new Date(
      row.observed_at,
    ).toISOString(),
  visibility:
    row.visibility,
  metadata:
    row.metadata ??
    undefined,
});

const mapEvent = (
  row: any,
) => ({
  id: row.id,
  type: row.type,
  summary:
    row.summary,
  occurredAt:
    new Date(
      row.occurred_at,
    ).toISOString(),
  source:
    row.source,
  confidence: Number(
    row.confidence,
  ),
  entityIds:
    Array.isArray(
      row.entity_ids,
    )
      ? row.entity_ids
      : [],
  sessionId:
    row.session_id ??
    undefined,
  metadata:
    row.metadata ??
    undefined,
});

export function createMemoryRepository(): MemoryRepository {
  return {
    async assertAccess({
      assetId,
      userId,
    }) {
      const allowed =
        await userHasAssetAccess(
          assetId,
          userId,
        );

      if (!allowed) {
        throw new Error(
          "Memory access denied",
        );
      }
    },

    async loadContext({
      assetId,
      userId,
    }) {
      const startedAt =
        Date.now();

      console.log(
        "[QRE][DB] LOAD START",
        `asset=${assetId}`,
        `user=${userId ? "present" : "none"}`,
      );

      try {
        if (userId) {
          await this.assertAccess(
            {
              assetId,
              userId,
            },
          );
        }

        const [
          entities,
          facts,
          relations,
          events,
        ] =
          await withDatabaseRetry(
            () =>
              Promise.all([
                db.$queryRaw<
                  any[]
                >(
                  Prisma.sql`
                    SELECT *
                    FROM "qre_memory_entity"
                    WHERE "asset_id" = ${assetId}
                    ORDER BY "updated_at" DESC
                    LIMIT 100
                  `,
                ),

                db.$queryRaw<
                  any[]
                >(
                  Prisma.sql`
                    SELECT *
                    FROM "qre_memory_fact"
                    WHERE "asset_id" = ${assetId}
                      AND "status" = 'active'
                      AND "confidence" >= 0.7
                    ORDER BY "observed_at" DESC, "confidence" DESC
                    LIMIT 200
                  `,
                ),

                db.$queryRaw<
                  any[]
                >(
                  Prisma.sql`
                    SELECT *
                    FROM "qre_memory_relation"
                    WHERE "asset_id" = ${assetId}
                      AND "confidence" >= 0.7
                    ORDER BY "observed_at" DESC, "confidence" DESC
                    LIMIT 200
                  `,
                ),

                db.$queryRaw<
                  any[]
                >(
                  Prisma.sql`
                    SELECT *
                    FROM "qre_memory_event"
                    WHERE "asset_id" = ${assetId}
                    ORDER BY "occurred_at" DESC
                    LIMIT 50
                  `,
                ),
              ]),
          );

        const context: MemoryContext =
          {
            assetId,
            generatedAt:
              new Date().toISOString(),

            entities:
              entities.map(
                mapEntity,
              ),

            facts:
              facts.map(
                mapFact,
              ),

            relations:
              relations.map(
                mapRelation,
              ),

            events:
              events.map(
                mapEvent,
              ),
          };

        console.log(
          "[QRE][DB] LOAD END",
          `asset=${assetId}`,
          `durationMs=${elapsedMs(
            startedAt,
          )}`,
          `entities=${context.entities.length}`,
          `facts=${context.facts.length}`,
          `relations=${context.relations.length}`,
          `events=${context.events.length}`,
        );

        return context;
      } catch (error) {
        console.error(
          "[QRE][DB] LOAD FAILURE",
          `asset=${assetId}`,
          `durationMs=${elapsedMs(
            startedAt,
          )}`,
          `code=${errorCode(
            error,
          ) ?? "unknown"}`,
          `message=${errorMessage(
            error,
          )}`,
        );

        throw error;
      }
    },

    async writeBatch(
      batch,
    ) {
      const startedAt =
        Date.now();

      /**
       * A logical operation must have one stable identity across retries.
       *
       * Contract requirement:
       *
       *   operationId?: string
       *
       * Callers that already have a stable request/session identifier
       * should provide it. Otherwise generate one once for this invocation.
       */
      const operationId =
        batch.operationId ??
        randomUUID();

      const auditId =
        deterministicUuid(
          `memory-audit:${operationId}`,
        );

      console.log(
        "[QRE][DB] WRITE START",
        `asset=${batch.assetId}`,
        `operationId=${operationId}`,
        `entities=${batch.entities.length}`,
        `facts=${batch.facts.length}`,
        `relations=${batch.relations.length}`,
        `events=${batch.events.length}`,
      );

      try {
        await withDatabaseRetry(
          () =>
            db.$transaction(
              async (tx) => {
                for (
                  let index = 0;
                  index <
                  batch.entities.length;
                  index += 1
                ) {
                  const entity =
                    batch.entities[
                      index
                    ];

                  const id =
                    entity.id ??
                    deterministicUuid(
                      `memory:${operationId}:entity:${index}:${entity.kind}:${entity.canonicalKey}`,
                    );

                  await tx.$executeRaw(
                    Prisma.sql`
                      INSERT INTO "qre_memory_entity"
                        (
                          "id",
                          "asset_id",
                          "kind",
                          "name",
                          "canonical_key",
                          "confidence",
                          "visibility",
                          "metadata"
                        )
                      VALUES
                        (
                          ${id},
                          ${batch.assetId},
                          ${entity.kind},
                          ${entity.name},
                          ${entity.canonicalKey},
                          ${entity.confidence},
                          ${entity.visibility},
                          ${json(
                            entity.metadata,
                          )}
                        )
                      ON CONFLICT
                        (
                          "asset_id",
                          "kind",
                          "canonical_key"
                        )
                      DO UPDATE SET
                        "name" = EXCLUDED."name",
                        "confidence" = GREATEST(
                          "qre_memory_entity"."confidence",
                          EXCLUDED."confidence"
                        ),
                        "visibility" = EXCLUDED."visibility",
                        "metadata" = COALESCE(
                          EXCLUDED."metadata",
                          "qre_memory_entity"."metadata"
                        ),
                        "updated_at" = NOW()
                    `,
                  );
                }

                for (
                  let index = 0;
                  index <
                  batch.facts.length;
                  index += 1
                ) {
                  const fact =
                    batch.facts[
                      index
                    ];

                  const entityId =
                    fact.entityId ??
                    null;

                  const factId =
                    fact.id ??
                    deterministicUuid(
                      `memory:${operationId}:fact:${index}:${fact.predicate}:${fact.value}:${entityId ?? ""}`,
                    );

                  await tx.$executeRaw(
                    Prisma.sql`
                      UPDATE "qre_memory_fact"
                      SET
                        "status" = 'superseded',
                        "updated_at" = NOW()
                      WHERE "asset_id" = ${batch.assetId}
                        AND "entity_id" = ${entityId}
                        AND "predicate" = ${fact.predicate}
                        AND "status" = 'active'
                        AND "value" <> ${fact.value}
                    `,
                  );

                  await tx.$executeRaw(
                    Prisma.sql`
                      INSERT INTO "qre_memory_fact"
                        (
                          "id",
                          "asset_id",
                          "entity_id",
                          "kind",
                          "predicate",
                          "value",
                          "confidence",
                          "source",
                          "source_ref",
                          "status",
                          "observed_at",
                          "valid_from",
                          "valid_to",
                          "visibility",
                          "metadata"
                        )
                      SELECT
                        ${factId},
                        ${batch.assetId},
                        ${entityId},
                        ${fact.kind},
                        ${fact.predicate},
                        ${fact.value},
                        ${fact.confidence},
                        ${fact.source},
                        ${fact.sourceRef ?? null},
                        ${fact.status},
                        ${new Date(
                          fact.observedAt,
                        )},
                        ${
                          fact.validFrom
                            ? new Date(
                                fact.validFrom,
                              )
                            : null
                        },
                        ${
                          fact.validTo
                            ? new Date(
                                fact.validTo,
                              )
                            : null
                        },
                        ${fact.visibility},
                        ${json(
                          fact.metadata,
                        )}
                      WHERE NOT EXISTS (
                        SELECT 1
                        FROM "qre_memory_fact"
                        WHERE "asset_id" = ${batch.assetId}
                          AND "entity_id" = ${entityId}
                          AND "predicate" = ${fact.predicate}
                          AND "value" = ${fact.value}
                          AND "status" = 'active'
                      )
                    `,
                  );
                }

                for (
                  let index = 0;
                  index <
                  batch.relations.length;
                  index += 1
                ) {
                  const relation =
                    batch.relations[
                      index
                    ];

                  const relationId =
                    relation.id ??
                    deterministicUuid(
                      `memory:${operationId}:relation:${index}:${relation.fromEntityId}:${relation.toEntityId}:${relation.relation}`,
                    );

                  await tx.$executeRaw(
                    Prisma.sql`
                      INSERT INTO "qre_memory_relation"
                        (
                          "id",
                          "asset_id",
                          "from_entity_id",
                          "to_entity_id",
                          "relation",
                          "confidence",
                          "source",
                          "source_ref",
                          "observed_at",
                          "visibility",
                          "metadata"
                        )
                      VALUES
                        (
                          ${relationId},
                          ${batch.assetId},
                          ${relation.fromEntityId},
                          ${relation.toEntityId},
                          ${relation.relation},
                          ${relation.confidence},
                          ${relation.source},
                          ${relation.sourceRef ?? null},
                          ${new Date(
                            relation.observedAt,
                          )},
                          ${relation.visibility},
                          ${json(
                            relation.metadata,
                          )}
                        )
                      ON CONFLICT
                        (
                          "asset_id",
                          "from_entity_id",
                          "to_entity_id",
                          "relation"
                        )
                      DO UPDATE SET
                        "confidence" = GREATEST(
                          "qre_memory_relation"."confidence",
                          EXCLUDED."confidence"
                        ),
                        "source" = EXCLUDED."source",
                        "source_ref" = EXCLUDED."source_ref",
                        "observed_at" = EXCLUDED."observed_at",
                        "visibility" = EXCLUDED."visibility",
                        "metadata" = COALESCE(
                          EXCLUDED."metadata",
                          "qre_memory_relation"."metadata"
                        ),
                        "updated_at" = NOW()
                    `,
                  );
                }

                for (
                  let index = 0;
                  index <
                  batch.events.length;
                  index += 1
                ) {
                  const event =
                    batch.events[
                      index
                    ];

                  /**
                   * Events previously had random UUIDs when no ID was supplied.
                   *
                   * That is unsafe under transaction retry:
                   *
                   *   commit succeeds
                   *   connection closes
                   *   client retries
                   *   random UUID changes
                   *   duplicate event gets inserted
                   *
                   * Stable operation-scoped IDs eliminate that failure mode.
                   */
                  const eventId =
                    event.id ??
                    deterministicUuid(
                      `memory:${operationId}:event:${index}:${event.type}:${event.summary}:${event.occurredAt}:${event.sessionId ?? ""}`,
                    );

                  await tx.$executeRaw(
                    Prisma.sql`
                      INSERT INTO "qre_memory_event"
                        (
                          "id",
                          "asset_id",
                          "session_id",
                          "type",
                          "summary",
                          "occurred_at",
                          "source",
                          "confidence",
                          "entity_ids",
                          "metadata"
                        )
                      VALUES
                        (
                          ${eventId},
                          ${batch.assetId},
                          ${event.sessionId ?? null},
                          ${event.type},
                          ${event.summary},
                          ${new Date(
                            event.occurredAt,
                          )},
                          ${event.source},
                          ${event.confidence},
                          ${json(
                            event.entityIds,
                          )},
                          ${json(
                            event.metadata,
                          )}
                        )
                      ON CONFLICT ("id")
                      DO NOTHING
                    `,
                  );
                }

                await tx.$executeRaw(
  Prisma.sql`
    INSERT INTO "qre_memory_audit"
      (
        "id",
        "asset_id",
        "user_id",
        "operation_id",
        "operation",
        "target_type",
        "payload"
      )
    VALUES
      (
        ${randomUUID()},
        ${batch.assetId},
        ${batch.userId ?? null},
        ${batch.operationId ?? null},
        'memory_batch',
        'memory',
        ${json({
          entityCount:
            batch.entities.length,
          factCount:
            batch.facts.length,
          relationCount:
            batch.relations.length,
          eventCount:
            batch.events.length,
        })}
      )
    ON CONFLICT ("operation_id")
    WHERE "operation_id" IS NOT NULL
    DO NOTHING
  `,
);
              },
              {
                maxWait: 10_000,
                timeout: 60_000,
              },
            ),
        );

        console.log(
          "[QRE][DB] WRITE END",
          `asset=${batch.assetId}`,
          `operationId=${operationId}`,
          `durationMs=${elapsedMs(
            startedAt,
          )}`,
        );
      } catch (error) {
        console.error(
          "[QRE][DB] WRITE FAILURE",
          `asset=${batch.assetId}`,
          `operationId=${operationId}`,
          `durationMs=${elapsedMs(
            startedAt,
          )}`,
          `code=${errorCode(
            error,
          ) ?? "unknown"}`,
          `message=${errorMessage(
            error,
          )}`,
        );

        throw error;
      }
    },
  };
}