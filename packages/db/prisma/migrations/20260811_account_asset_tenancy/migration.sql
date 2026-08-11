-- SUPER COG tenant hardening
--
-- New assets are account-scoped. Keep ownerId nullable for legacy/personal
-- records while enforcing the Account -> Asset relationship for new writes.
-- NOT VALID preserves existing legacy rows if they contain an accountId that
-- predates the relational constraint; PostgreSQL still enforces the FK for
-- subsequent inserts/updates.

CREATE INDEX IF NOT EXISTS "Asset_accountId_idx"
  ON "Asset" ("accountId");

ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION
  NOT VALID;

-- Where Stripe ownership already identifies the tenant, repair the asset
-- tenant pointer without guessing from a user's potentially multi-account
-- membership.
UPDATE "Asset" AS asset
SET "accountId" = ownership."accountId"
FROM "Ownership" AS ownership
WHERE ownership."assetId" = asset."id"
  AND asset."accountId" IS NULL
  AND ownership."accountId" IS NOT NULL;
