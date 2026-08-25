-- Keep the persisted PostgreSQL analytics enum aligned with the canonical contracts/Prisma schema.
-- MEDIA_REPLAY is already part of the canonical analytics vocabulary; add it to live Postgres.

ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'MEDIA_REPLAY';
