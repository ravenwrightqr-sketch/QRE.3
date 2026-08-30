-- Keep the Prisma schema and the deployed PostgreSQL analytics enum in sync.
-- This event is emitted by Author when a new durable learning state is written.
ALTER TYPE "AnalyticsEventType"
ADD VALUE IF NOT EXISTS 'AI_MEMORY_LEARNED';
