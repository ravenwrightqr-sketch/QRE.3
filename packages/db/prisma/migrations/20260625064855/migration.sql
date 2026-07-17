/*
  Warnings:

  - The `status` column on the `Ownership` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[stripeSessionId]` on the table `Ownership` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Ownership` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('BASIC', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "OwnershipStatus" AS ENUM ('CLAIMED', 'ACTIVE', 'REVOKED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SaleChannel" AS ENUM ('RETAIL', 'ONLINE', 'ADMIN');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "saleChannel" "SaleChannel" NOT NULL DEFAULT 'RETAIL';

-- AlterTable
ALTER TABLE "Ownership" ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OwnershipStatus" NOT NULL DEFAULT 'CLAIMED';

-- AlterTable
ALTER TABLE "ScanSession" ADD COLUMN     "flowId" TEXT,
ADD COLUMN     "lastAction" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Ownership_stripeSessionId_key" ON "Ownership"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "ScanSession" ADD CONSTRAINT "ScanSession_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
