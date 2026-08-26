-- Keep PostgreSQL AnalyticsEventType aligned with
-- packages/contracts/src/analytics.ts and schema.prisma.

ALTER TYPE "AnalyticsEventType"
ADD VALUE IF NOT EXISTS 'AI_CINEMATIC_DECISION';
