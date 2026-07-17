import { Response } from "express";
import { scanEngine } from "@qre/engine";
import type { AuthRequest } from "../middleware/requireAuth.js";

/**
 * SAFE STRING NORMALIZER
 */
function getString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export async function scanRoute(
  req: AuthRequest,
  res: Response
) {
  try {
    const slug = getString(req.params.slug);

    if (!slug) {
      return res.status(400).json({
        error: "Invalid slug",
      });
    }

    const userId = req.user?.userId;

    const result = await scanEngine({
      slug,
      userId,
    });

    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({
      error: e.message,
    });
  }
}