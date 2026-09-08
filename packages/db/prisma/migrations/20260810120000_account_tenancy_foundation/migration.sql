-- Restore the account-tenancy structures required by later migrations.
-- This migration is intentionally idempotent because the live Neon database
-- may already contain these structures from the historical schema work.

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'CONSUMER',
    "plan" TEXT DEFAULT 'BASIC',
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountUser" (
    "id" TEXT NOT NULL,
    "accountid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "role" TEXT DEFAULT 'OWNER',
    CONSTRAINT "AccountUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accountuser_unique"
    ON "AccountUser" ("accountid", "userid");

ALTER TABLE "Asset"
    ADD COLUMN IF NOT EXISTS "accountId" TEXT;

ALTER TABLE "Ownership"
    ADD COLUMN IF NOT EXISTS "accountId" TEXT;

CREATE INDEX IF NOT EXISTS "Ownership_accountId_idx"
    ON "Ownership" ("accountId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'accountuser_account_fkey'
    ) THEN
        ALTER TABLE "AccountUser"
            ADD CONSTRAINT "accountuser_account_fkey"
            FOREIGN KEY ("accountid")
            REFERENCES "Account"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'accountuser_user_fkey'
    ) THEN
        ALTER TABLE "AccountUser"
            ADD CONSTRAINT "accountuser_user_fkey"
            FOREIGN KEY ("userid")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Ownership_accountId_fkey'
    ) THEN
        ALTER TABLE "Ownership"
            ADD CONSTRAINT "Ownership_accountId_fkey"
            FOREIGN KEY ("accountId")
            REFERENCES "Account"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION;
    END IF;
END $$;
