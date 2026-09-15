-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('PERSONAL', 'GENERIC', 'MERCHANT', 'SERVICE', 'WEED_SHOP', 'AIRBNB', 'REAL_ESTATE', 'PET_RESCUE', 'BUSINESS', 'ARTIST');

-- CreateEnum
CREATE TYPE "ActivationMethod" AS ENUM ('NFC', 'SLUG', 'HYBRID');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('ENTERED', 'INSIDE', 'LEFT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'VOID');

-- AlterEnum
BEGIN;
CREATE TYPE "AnalyticsEventType_new" AS ENUM ('SCAN', 'SESSION_START', 'SESSION_END', 'FLOW_TRIGGERED', 'FLOW_START', 'FLOW_STEP', 'FLOW_COMPLETE', 'FLOW_ABANDON', 'AI_MEMORY_USED', 'AI_DECISION', 'AI_MEMORY_RECOMMENDED', 'AI_MEMORY_LEARNED', 'AI_CREATIVE_ACCEPTED', 'AI_CREATIVE_REJECTED', 'AI_VARIATION_SELECTED', 'AI_SIGNIFICANCE_SHIFT', 'AI_AUTHOR_EXPERIENCE', 'CTA_CLICK', 'REDIRECT', 'PAYMENT_REQUIRED', 'PAYMENT_STARTED', 'PAYMENT_COMPLETED', 'UNLOCK', 'CLAIM_STARTED', 'CLAIM_COMPLETED', 'TEASER_VIEW', 'GEO_MARK', 'WEBSITE_CLICK', 'SOCIAL_CLICK', 'TIP_STARTED', 'TIP_COMPLETED', 'ERROR', 'FLOW_POLICY_APPLIED', 'CHECK_IN', 'CHECK_OUT', 'PRESENCE_JOIN', 'PRESENCE_LEAVE', 'TICKET_CREATED', 'TICKET_VIEWED', 'TICKET_REDEEMED', 'TICKET_REJECTED', 'MEDIA_PLAY', 'MEDIA_COMPLETE', 'MEDIA_REPLAY', 'EXPERIENCE_REPLAY', 'EXPERIENCE_SHARED', 'EXPERIENCE_SAVED', 'MEMORY_APPLIED', 'MEMORY_CREATED', 'MEMORY_UPDATED', 'MEMORY_RECOMMENDATION_VIEWED', 'MEMORY_RECOMMENDATION_SELECTED', 'SPONSOR_IMPRESSION', 'SPONSOR_INTERACTION', 'SPONSOR_DISMISSED', 'SPONSOR_CTA_CLICK');
ALTER TABLE "AnalyticsEvent" ALTER COLUMN "type" TYPE "AnalyticsEventType_new" USING ("type"::text::"AnalyticsEventType_new");
ALTER TYPE "AnalyticsEventType" RENAME TO "AnalyticsEventType_old";
ALTER TYPE "AnalyticsEventType_new" RENAME TO "AnalyticsEventType";
DROP TYPE "public"."AnalyticsEventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_flowId_fkey";

-- DropForeignKey
ALTER TABLE "Experience" DROP CONSTRAINT "Experience_assetId_fkey";

-- DropForeignKey
ALTER TABLE "GeoProof" DROP CONSTRAINT "GeoProof_assetId_fkey";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "flowId",
DROP COLUMN "stateConfig",
ADD COLUMN     "activationCode" TEXT,
ADD COLUMN     "activationMethod" "ActivationMethod" NOT NULL DEFAULT 'HYBRID',
ADD COLUMN     "category" "TemplateCategory",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "merchantId" TEXT,
ADD COLUMN     "nfcUid" TEXT,
ADD COLUMN     "qrSvg" TEXT,
ADD COLUMN     "qrUrl" TEXT,
ADD COLUMN     "templateData" JSONB,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "genome",
DROP COLUMN "metadata",
DROP COLUMN "name",
DROP COLUMN "status",
DROP COLUMN "version",
DROP COLUMN "world",
ADD COLUMN     "flowId" TEXT,
ADD COLUMN     "publishedFlowId" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "assetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Flow" ADD COLUMN     "merchantId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "GeoProof" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'scan',
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Ownership" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScanEvent" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ScanSession" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "geoStory" JSONB,
ADD COLUMN     "memorySnapshot" JSONB,
ADD COLUMN     "moments" JSONB,
ADD COLUMN     "receipt" JSONB;

-- DropEnum
DROP TYPE "Tier";

-- CreateTable
CREATE TABLE "AssetFlow" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL DEFAULT 'DEFAULT',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeId" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "description" TEXT,
    "signals" JSONB NOT NULL,
    "schema" JSONB NOT NULL,
    "aiPrompt" TEXT,
    "allowPersonalLayer" BOOLEAN NOT NULL DEFAULT true,
    "allowMemoryFeed" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "impact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySnapshot" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "scanWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flowEngagementWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctaClickWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rewardScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dominantLayer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropOffPoints" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "MemorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowStep" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "FlowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenceEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenceSession" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "PresenceStatus" NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "PresenceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTicket" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT,
    "ticketCode" TEXT NOT NULL,
    "qrUrl" TEXT,
    "qrSvg" TEXT,
    "attendeeName" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "checkedInAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "EventTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttendance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventId" TEXT,
    "ticketId" TEXT,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSignal" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "assetId" TEXT,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "url" TEXT,
    "label" TEXT,
    "data" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetFlow_assetId_idx" ON "AssetFlow"("assetId");

-- CreateIndex
CREATE INDEX "AssetFlow_flowId_idx" ON "AssetFlow"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetFlow_assetId_flowId_key" ON "AssetFlow"("assetId", "flowId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_stripeId_key" ON "Claim"("stripeId");

-- CreateIndex
CREATE INDEX "Claim_assetId_idx" ON "Claim"("assetId");

-- CreateIndex
CREATE INDEX "Claim_userId_idx" ON "Claim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "Insight_assetId_idx" ON "Insight"("assetId");

-- CreateIndex
CREATE INDEX "MemorySnapshot_assetId_createdAt_idx" ON "MemorySnapshot"("assetId", "createdAt");

-- CreateIndex
CREATE INDEX "MemorySnapshot_assetId_idx" ON "MemorySnapshot"("assetId");

-- CreateIndex
CREATE INDEX "MemorySnapshot_createdAt_idx" ON "MemorySnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "FlowStep_flowId_idx" ON "FlowStep"("flowId");

-- CreateIndex
CREATE INDEX "PresenceEvent_assetId_idx" ON "PresenceEvent"("assetId");

-- CreateIndex
CREATE INDEX "PresenceEvent_sessionId_idx" ON "PresenceEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PresenceEvent_userId_idx" ON "PresenceEvent"("userId");

-- CreateIndex
CREATE INDEX "PresenceSession_assetId_idx" ON "PresenceSession"("assetId");

-- CreateIndex
CREATE INDEX "PresenceSession_sessionId_idx" ON "PresenceSession"("sessionId");

-- CreateIndex
CREATE INDEX "PresenceSession_userId_idx" ON "PresenceSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventTicket_ticketCode_key" ON "EventTicket"("ticketCode");

-- CreateIndex
CREATE INDEX "EventTicket_assetId_idx" ON "EventTicket"("assetId");

-- CreateIndex
CREATE INDEX "EventTicket_userId_idx" ON "EventTicket"("userId");

-- CreateIndex
CREATE INDEX "EventTicket_eventId_idx" ON "EventTicket"("eventId");

-- CreateIndex
CREATE INDEX "EventTicket_status_idx" ON "EventTicket"("status");

-- CreateIndex
CREATE INDEX "EventAttendance_assetId_idx" ON "EventAttendance"("assetId");

-- CreateIndex
CREATE INDEX "EventAttendance_sessionId_idx" ON "EventAttendance"("sessionId");

-- CreateIndex
CREATE INDEX "EventAttendance_userId_idx" ON "EventAttendance"("userId");

-- CreateIndex
CREATE INDEX "EventAttendance_ticketId_idx" ON "EventAttendance"("ticketId");

-- CreateIndex
CREATE INDEX "MerchantSignal_active_idx" ON "MerchantSignal"("active");

-- CreateIndex
CREATE INDEX "MerchantSignal_assetId_idx" ON "MerchantSignal"("assetId");

-- CreateIndex
CREATE INDEX "MerchantSignal_merchantId_idx" ON "MerchantSignal"("merchantId");

-- CreateIndex
CREATE INDEX "MerchantSignal_startsAt_endsAt_idx" ON "MerchantSignal"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_token_key" ON "Asset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_activationCode_key" ON "Asset"("activationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_nfcUid_key" ON "Asset"("nfcUid");

-- CreateIndex
CREATE INDEX "Experience_flowId_idx" ON "Experience"("flowId");

-- CreateIndex
CREATE INDEX "Experience_publishedFlowId_idx" ON "Experience"("publishedFlowId");

-- CreateIndex
CREATE INDEX "GeoProof_sessionId_idx" ON "GeoProof"("sessionId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFlow" ADD CONSTRAINT "AssetFlow_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFlow" ADD CONSTRAINT "AssetFlow_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorySnapshot" ADD CONSTRAINT "MemorySnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowStep" ADD CONSTRAINT "FlowStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_publishedFlowId_fkey" FOREIGN KEY ("publishedFlowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
