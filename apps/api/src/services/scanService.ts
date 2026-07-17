import { db } from "@qre/db";
import { scanEngine } from "@qre/engine";

/**
 * =========================
 * SCAN SERVICE (SINGLE ENTRY WRAPPER)
 * =========================
 *
 * This service is now a thin adapter ONLY.
 * ALL logic lives inside scanEngine.
 *
 * Responsibilities:
 * - validate slug
 * - call engine
 * - return result
 *
 * NO:
 * - session creation
 * - access resolution
 * - flow logic duplication
 */
export async function scanService(slug: string, userId?: string) {
  if (!slug) throw new Error("Missing slug");

  /**
   * 1. LOAD ASSET (validation only)
   */
  const asset = await db.asset.findUnique({
    where: { slug },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  /**
   * 2. DELEGATE EVERYTHING TO ENGINE
   */
  const result = await scanEngine({
    slug: asset.slug,
    userId,
  });

  /**
   * 3. RETURN ENGINE RESPONSE ONLY
   * (NO OVERRIDES, NO MERGES)
   */
  return result;
}