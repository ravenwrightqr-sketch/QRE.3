-- SUPER COG durable memory graph
--
-- Memory is deliberately separate from the existing MemorySnapshot analytics
-- record. These tables preserve source evidence, temporal state, relationships,
-- and an append-only audit trail so memory can evolve without silently
-- overwriting history.

CREATE TABLE IF NOT EXISTS "qre_memory_entity" (
  "id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "canonical_key" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "visibility" TEXT NOT NULL DEFAULT 'shared',
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "qre_memory_entity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "qre_memory_entity_asset_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "qre_memory_entity_identity_idx"
  ON "qre_memory_entity" ("asset_id", "kind", "canonical_key");
CREATE INDEX IF NOT EXISTS "qre_memory_entity_asset_idx"
  ON "qre_memory_entity" ("asset_id");

CREATE TABLE IF NOT EXISTS "qre_memory_fact" (
  "id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "entity_id" TEXT,
  "kind" TEXT NOT NULL,
  "predicate" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL,
  "source_ref" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "observed_at" TIMESTAMPTZ NOT NULL,
  "valid_from" TIMESTAMPTZ,
  "valid_to" TIMESTAMPTZ,
  "visibility" TEXT NOT NULL DEFAULT 'shared',
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "qre_memory_fact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "qre_memory_fact_asset_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE CASCADE,
  CONSTRAINT "qre_memory_fact_entity_fkey"
    FOREIGN KEY ("entity_id") REFERENCES "qre_memory_entity"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "qre_memory_fact_lookup_idx"
  ON "qre_memory_fact" ("asset_id", "status", "confidence", "observed_at" DESC);
CREATE INDEX IF NOT EXISTS "qre_memory_fact_entity_idx"
  ON "qre_memory_fact" ("entity_id", "status");

CREATE TABLE IF NOT EXISTS "qre_memory_relation" (
  "id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "from_entity_id" TEXT NOT NULL,
  "to_entity_id" TEXT NOT NULL,
  "relation" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL,
  "source_ref" TEXT,
  "observed_at" TIMESTAMPTZ NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'shared',
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "qre_memory_relation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "qre_memory_relation_asset_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE CASCADE,
  CONSTRAINT "qre_memory_relation_from_fkey"
    FOREIGN KEY ("from_entity_id") REFERENCES "qre_memory_entity"("id") ON DELETE CASCADE,
  CONSTRAINT "qre_memory_relation_to_fkey"
    FOREIGN KEY ("to_entity_id") REFERENCES "qre_memory_entity"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "qre_memory_relation_identity_idx"
  ON "qre_memory_relation" ("asset_id", "from_entity_id", "to_entity_id", "relation");
CREATE INDEX IF NOT EXISTS "qre_memory_relation_from_idx"
  ON "qre_memory_relation" ("asset_id", "from_entity_id");
CREATE INDEX IF NOT EXISTS "qre_memory_relation_to_idx"
  ON "qre_memory_relation" ("asset_id", "to_entity_id");

CREATE TABLE IF NOT EXISTS "qre_memory_event" (
  "id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "session_id" TEXT,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "source" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "entity_ids" JSONB NOT NULL DEFAULT '[]',
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "qre_memory_event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "qre_memory_event_asset_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE CASCADE,
  CONSTRAINT "qre_memory_event_session_fkey"
    FOREIGN KEY ("session_id") REFERENCES "ScanSession"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "qre_memory_event_lookup_idx"
  ON "qre_memory_event" ("asset_id", "occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "qre_memory_event_type_idx"
  ON "qre_memory_event" ("asset_id", "type", "occurred_at" DESC);

CREATE TABLE IF NOT EXISTS "qre_memory_audit" (
  "id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "user_id" TEXT,
  "operation" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "qre_memory_audit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "qre_memory_audit_asset_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "Asset"("id") ON DELETE CASCADE,
  CONSTRAINT "qre_memory_audit_user_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "qre_memory_audit_asset_idx"
  ON "qre_memory_audit" ("asset_id", "created_at" DESC);

