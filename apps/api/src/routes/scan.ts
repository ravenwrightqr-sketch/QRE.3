import express, { Response } from "express";
import type { AuthRequest } from "../middleware/requireAuth.js";
import { scanHandler } from "../handlers/scanHandler.js"
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

/**
 * =========================
 * SCAN ENDPOINT
 * =========================
 * PURE HTTP LAYER
 * - validates input
 * - forwards to scanHandler
 * - returns engine contract unchanged
 */
router.get("/:slug", async (req: AuthRequest, res: Response) => {
  try {
    /**
     * =========================
     * INPUT SANITIZATION
     * =========================
     */
    const slug = safeStringParam(req.params.slug);

    if (!slug) {
      return res.status(400).json({
        error: "Missing slug",
      });
    }

    /**
     * =========================
     * EXECUTE SCAN PIPELINE
     * =========================
     * scanHandler → scanEngine (source of truth)
     */
    const result = await scanHandler({
      slug,
      userId: req.user?.userId,
    });

    /**
     * =========================
     * RESPONSE
     * =========================
     * IMPORTANT:
     * DO NOT modify shape here.
     * Frontend depends on scanEngine contract.
     */
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({
      error: e.message || "Scan failed",
    });
  }
});

export default router;