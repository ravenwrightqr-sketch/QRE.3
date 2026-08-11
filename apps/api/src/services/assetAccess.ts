import { db } from "@qre/db";

/**
 * Canonical asset authorization boundary.
 *
 * Tenant ownership is Account -> Asset. A User receives access through
 * AccountUser membership. Direct User ownership and Ownership.userId remain
 * supported as legacy/personal compatibility paths while existing data is
 * migrated toward account-scoped assets.
 *
 * This answers only "may this authenticated user access this asset?".
 * Payment, tier, claim state, scan unlocks, and runtime policy belong to
 * their respective layers.
 */
export async function userHasAssetAccess(
  assetId: string,
  userId: string,
): Promise<boolean> {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: {
      ownerId: true,
      accountId: true,
      ownership: {
        select: {
          userId: true,
          accountId: true,
        },
      },
    },
  });

  if (!asset) return false;

  // Legacy direct-user ownership remains readable during migration.
  if (asset.ownerId === userId || asset.ownership?.userId === userId) {
    return true;
  }

  // Canonical tenant access: any active account membership grants baseline
  // asset access. Fine-grained capabilities can be layered on AccountUser.role
  // later without changing the ownership model.
  const accountId = asset.accountId ?? asset.ownership?.accountId;
  if (!accountId) return false;

  const membership = await db.accountUser.findUnique({
    where: {
      accountId_userId: {
        accountId,
        userId,
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

/**
 * Backward-compatible name retained for existing callers.
 */
export const userHasAssetAccountAccess = userHasAssetAccess;
