-- Universal Knowledge foundation
-- Forward-only migration.
-- Intentionally does not touch legacy qre_memory_* tables.

ALTER TABLE "Asset"
ADD COLUMN IF NOT EXISTS "stateConfig" JSONB;

CREATE TABLE "KnowledgeIntakeJob" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sourceType" TEXT NOT NULL,
    "originalName" TEXT,
    "contentHash" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeIntakeJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeIntakeJob_assetId_createdAt_idx"
ON "KnowledgeIntakeJob"("assetId", "createdAt");

CREATE INDEX "KnowledgeIntakeJob_status_idx"
ON "KnowledgeIntakeJob"("status");

CREATE INDEX "KnowledgeIntakeJob_contentHash_idx"
ON "KnowledgeIntakeJob"("contentHash");

CREATE TABLE "KnowledgeEvidence" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "intakeJobId" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "storageKey" TEXT,
    "contentHash" TEXT,
    "text" TEXT,
    "metadata" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeEvidence_assetId_createdAt_idx"
ON "KnowledgeEvidence"("assetId", "createdAt");

CREATE INDEX "KnowledgeEvidence_intakeJobId_idx"
ON "KnowledgeEvidence"("intakeJobId");

CREATE INDEX "KnowledgeEvidence_contentHash_idx"
ON "KnowledgeEvidence"("contentHash");

CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CatalogItem_assetId_idx"
ON "CatalogItem"("assetId");

CREATE INDEX "CatalogItem_assetId_kind_idx"
ON "CatalogItem"("assetId", "kind");

CREATE INDEX "CatalogItem_assetId_normalizedName_idx"
ON "CatalogItem"("assetId", "normalizedName");

CREATE TABLE "CatalogAttribute" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "unit" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogAttribute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CatalogAttribute_catalogItemId_idx"
ON "CatalogAttribute"("catalogItemId");

CREATE INDEX "CatalogAttribute_key_idx"
ON "CatalogAttribute"("key");

CREATE INDEX "CatalogAttribute_evidenceId_idx"
ON "CatalogAttribute"("evidenceId");

CREATE TABLE "KnowledgeObservation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "evidenceId" TEXT,
    "type" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeObservation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeObservation_assetId_observedAt_idx"
ON "KnowledgeObservation"("assetId", "observedAt");

CREATE INDEX "KnowledgeObservation_catalogItemId_observedAt_idx"
ON "KnowledgeObservation"("catalogItemId", "observedAt");

CREATE INDEX "KnowledgeObservation_type_idx"
ON "KnowledgeObservation"("type");

CREATE INDEX "KnowledgeObservation_evidenceId_idx"
ON "KnowledgeObservation"("evidenceId");

CREATE TABLE "KnowledgePattern" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "type" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidenceIds" JSONB,
    "firstObservedAt" TIMESTAMP(3),
    "lastObservedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgePattern_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgePattern_assetId_type_idx"
ON "KnowledgePattern"("assetId", "type");

CREATE INDEX "KnowledgePattern_catalogItemId_idx"
ON "KnowledgePattern"("catalogItemId");

CREATE INDEX "KnowledgePattern_assetId_lastObservedAt_idx"
ON "KnowledgePattern"("assetId", "lastObservedAt");

ALTER TABLE "KnowledgeIntakeJob"
ADD CONSTRAINT "KnowledgeIntakeJob_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "KnowledgeEvidence"
ADD CONSTRAINT "KnowledgeEvidence_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "KnowledgeEvidence"
ADD CONSTRAINT "KnowledgeEvidence_intakeJobId_fkey"
FOREIGN KEY ("intakeJobId")
REFERENCES "KnowledgeIntakeJob"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "CatalogItem"
ADD CONSTRAINT "CatalogItem_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CatalogAttribute"
ADD CONSTRAINT "CatalogAttribute_catalogItemId_fkey"
FOREIGN KEY ("catalogItemId")
REFERENCES "CatalogItem"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CatalogAttribute"
ADD CONSTRAINT "CatalogAttribute_evidenceId_fkey"
FOREIGN KEY ("evidenceId")
REFERENCES "KnowledgeEvidence"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "KnowledgeObservation"
ADD CONSTRAINT "KnowledgeObservation_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "KnowledgeObservation"
ADD CONSTRAINT "KnowledgeObservation_catalogItemId_fkey"
FOREIGN KEY ("catalogItemId")
REFERENCES "CatalogItem"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "KnowledgeObservation"
ADD CONSTRAINT "KnowledgeObservation_evidenceId_fkey"
FOREIGN KEY ("evidenceId")
REFERENCES "KnowledgeEvidence"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "KnowledgePattern"
ADD CONSTRAINT "KnowledgePattern_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "KnowledgePattern"
ADD CONSTRAINT "KnowledgePattern_catalogItemId_fkey"
FOREIGN KEY ("catalogItemId")
REFERENCES "CatalogItem"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
