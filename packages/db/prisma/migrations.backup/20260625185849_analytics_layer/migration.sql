/*
  Warnings:

  - Changed the type of `type` on the `AnalyticsEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('SCAN', 'SESSION_START', 'SESSION_END', 'FLOW_START', 'FLOW_STEP', 'FLOW_COMPLETE', 'FLOW_ABANDON', 'CTA_CLICK', 'REDIRECT', 'PAYMENT_REQUIRED', 'PAYMENT_STARTED', 'PAYMENT_COMPLETED', 'UNLOCK', 'CLAIM_STARTED', 'CLAIM_COMPLETED', 'TEASER_VIEW', 'WEBSITE_CLICK', 'SOCIAL_CLICK', 'TIP_STARTED', 'TIP_COMPLETED', 'ERROR');

-- AlterTable
ALTER TABLE "AnalyticsEvent" DROP COLUMN "type",
ADD COLUMN     "type" "AnalyticsEventType" NOT NULL;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "totalRevenueCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalScans" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalUnlocks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ScanSession" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateTable
CREATE TABLE "FlowMetricsDaily" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scans" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "unlocks" INTEGER NOT NULL DEFAULT 0,
    "payments" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "avgSessionSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flowScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowMetricsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlowMetricsDaily_date_idx" ON "FlowMetricsDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FlowMetricsDaily_flowId_date_key" ON "FlowMetricsDaily"("flowId", "date");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_assetId_idx" ON "AnalyticsEvent"("assetId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_flowId_idx" ON "AnalyticsEvent"("flowId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Asset_slug_idx" ON "Asset"("slug");

-- CreateIndex
CREATE INDEX "Asset_ownerId_idx" ON "Asset"("ownerId");

-- CreateIndex
CREATE INDEX "FlowExecution_assetId_idx" ON "FlowExecution"("assetId");

-- CreateIndex
CREATE INDEX "FlowExecution_flowId_idx" ON "FlowExecution"("flowId");

-- CreateIndex
CREATE INDEX "Ownership_userId_idx" ON "Ownership"("userId");

-- CreateIndex
CREATE INDEX "ScanSession_assetId_idx" ON "ScanSession"("assetId");

-- CreateIndex
CREATE INDEX "ScanSession_flowId_idx" ON "ScanSession"("flowId");

-- CreateIndex
CREATE INDEX "ScanSession_userId_idx" ON "ScanSession"("userId");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowMetricsDaily" ADD CONSTRAINT "FlowMetricsDaily_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
