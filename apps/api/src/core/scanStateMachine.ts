import { db } from "@qre/db";
import type { AccessState } from "@qre/engine";

export async function resolveAccess(params: {
  assetId: string;
  userId?: string;
}): Promise<AccessState> {
  const asset = await db.asset.findUnique({
    where: { id: params.assetId },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  /**
   * Asset never purchased / claimed
   */
  if (!asset.paid) {
    return "UNCLAIMED";
  }

  /**
   * Paid but anonymous user
   */
  if (!params.userId) {
    return "LOCKED";
  }

  /**
   * Owner shortcut
   */
  if (asset.ownerId === params.userId) {
    return "UNLOCKED";
  }

  /**
   * Ownership lookup
   */
  const ownership = await db.ownership.findUnique({
    where: {
      assetId: asset.id,
    },
  });

  const isOwner =
    ownership?.userId === params.userId;

  if (isOwner) {
    return "UNLOCKED";
  }

  /**
   * Somebody else's asset
   */
  return "LOCKED";
}