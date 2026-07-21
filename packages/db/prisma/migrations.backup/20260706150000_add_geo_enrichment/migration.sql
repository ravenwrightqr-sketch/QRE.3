-- CreateTable
CREATE TABLE "GeoProof" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "label" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoProof_assetId_idx"
ON "GeoProof"("assetId");

-- AddForeignKey
ALTER TABLE "GeoProof"
ADD CONSTRAINT "GeoProof_assetId_fkey"
FOREIGN KEY ("assetId")
REFERENCES "Asset"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;