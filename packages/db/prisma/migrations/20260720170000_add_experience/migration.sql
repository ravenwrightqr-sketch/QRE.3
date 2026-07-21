CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "genome" JSONB NOT NULL,
    "world" JSONB NOT NULL,
    "blueprint" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Experience_assetId_idx"
ON "Experience"("assetId");

ALTER TABLE "Experience"
ADD CONSTRAINT "Experience_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;