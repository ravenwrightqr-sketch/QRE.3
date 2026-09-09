-- Universal Knowledge runtime hardening.
-- Adds fenced worker leases and retry scheduling without changing existing knowledge semantics.

ALTER TABLE "KnowledgeIntakeJob"
  ADD COLUMN IF NOT EXISTS "workerId" TEXT,
  ADD COLUMN IF NOT EXISTS "leaseToken" TEXT,
  ADD COLUMN IF NOT EXISTS "leaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastAttemptError" TEXT;

CREATE INDEX IF NOT EXISTS "KnowledgeIntakeJob_status_nextAttemptAt_idx"
  ON "KnowledgeIntakeJob"("status", "nextAttemptAt");

CREATE INDEX IF NOT EXISTS "KnowledgeIntakeJob_leaseExpiresAt_idx"
  ON "KnowledgeIntakeJob"("leaseExpiresAt");

CREATE INDEX IF NOT EXISTS "KnowledgeIntakeJob_workerId_idx"
  ON "KnowledgeIntakeJob"("workerId");

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeIntakeJob_leaseToken_key"
  ON "KnowledgeIntakeJob"("leaseToken")
  WHERE "leaseToken" IS NOT NULL;

-- Large-source seam: evidence already has storageKey. New jobs can keep a source
-- reference in payload without requiring a second persistence system.
COMMENT ON COLUMN "KnowledgeEvidence"."storageKey" IS
  'Durable source-object reference. Inline payloads remain supported for small proof-stage inputs.';
