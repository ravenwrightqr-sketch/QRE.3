-- SUPER COG tenant hardening
--
-- Establish the account tenancy foundation before applying account-scoped
-- indexes and foreign keys. Legacy/personal assets remain valid because
-- Asset.accountId and Ownership.accountId are nullable.
--
-- Account is the tenant boundary. AccountUser connects users to accounts
-- without replacing the existing Asset.ownerId / Ownership.userId fields.
--
-- Where Stripe ownership already identifies the tenant, repair the asset
-- tenant pointer without guessing from a user's potentially multi-account
-- membership.

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

ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "accountId" TEXT;

ALTER TABLE "Ownership"
  ADD COLUMN IF NOT EXISTS "accountId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "accountuser_unique"
  ON "AccountUser" ("accountid", "userid");

CREATE INDEX IF NOT EXISTS "Asset_accountId_idx"
  ON "Asset" ("accountId");

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
END
$$;

DO $$
BEGIN
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
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Asset_accountId_fkey'
    ) THEN
        ALTER TABLE "Asset"
          ADD CONSTRAINT "Asset_accountId_fkey"
          FOREIGN KEY ("accountId")
          REFERENCES "Account"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
          NOT VALID;
    END IF;
END
$$;

DO $$
BEGIN
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
END
$$;

UPDATE "Asset" AS asset
SET "accountId" = ownership."accountId"
FROM "Ownership" AS ownership
WHERE ownership."assetId" = asset."id"
  AND asset."accountId" IS NULL
  AND ownership."accountId" IS NOT NULL;