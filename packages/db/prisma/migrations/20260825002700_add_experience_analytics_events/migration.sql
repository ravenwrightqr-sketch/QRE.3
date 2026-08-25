-- Keep the persisted PostgreSQL analytics enum aligned with the canonical contracts/Prisma schema.
-- These values are already declared in packages/contracts/src/analytics.ts and schema.prisma.

ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'EXPERIENCE_REPLAY';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'EXPERIENCE_SHARED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'EXPERIENCE_SAVED';
