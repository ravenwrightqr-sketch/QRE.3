ALTER TABLE "qre_memory_audit"
ADD COLUMN IF NOT EXISTS "operation_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "qre_memory_audit_operation_id_key"
ON "qre_memory_audit" ("operation_id")
WHERE "operation_id" IS NOT NULL;
