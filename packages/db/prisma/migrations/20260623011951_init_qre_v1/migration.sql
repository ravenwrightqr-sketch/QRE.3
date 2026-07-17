/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Ownership` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Ownership` table. All the data in the column will be lost.
  - Made the column `userId` on table `Ownership` required. This step will fail if there are existing NULL values in that column.
  - Made the column `claimedAt` on table `Ownership` required. This step will fail if there are existing NULL values in that column.
  - Made the column `assetId` on table `ScanSession` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_assetId_fkey";

-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScanEvent" DROP CONSTRAINT "ScanEvent_assetId_fkey";

-- DropForeignKey
ALTER TABLE "ScanEvent" DROP CONSTRAINT "ScanEvent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ScanSession" DROP CONSTRAINT "ScanSession_assetId_fkey";

-- AlterTable
ALTER TABLE "Ownership" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "claimedAt" SET NOT NULL,
ALTER COLUMN "claimedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'claimed';

-- AlterTable
ALTER TABLE "ScanSession" ALTER COLUMN "assetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "tierActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowExecution" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "FlowExecution_sessionId_flowId_key" ON "FlowExecution"("sessionId", "flowId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanSession" ADD CONSTRAINT "ScanSession_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
