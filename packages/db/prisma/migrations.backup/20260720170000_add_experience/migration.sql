CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT,
    "blueprint" JSONB NOT NULL,
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
ON DELETE RESTRICT
ON UPDATE CASCADE;