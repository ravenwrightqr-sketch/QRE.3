import express from "express";
import { db } from "@qre/db";
import {
  getRecentActivity,
  getFunnel,
} from "@qre/engine";

import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

/**
 * =========================
 * DASHBOARD OVERVIEW (SINGLE SOURCE OF TRUTH)
 * =========================
 */
router.get("/:slug", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);

    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    /**
     * =========================
     * LOAD ASSET
     * =========================
     */
    const asset = await db.asset.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const assetId = asset.id;

    /**
     * =========================
     * ENGINE ANALYTICS (NEW SYSTEM)
     * =========================
     */
    const [funnel, activity] = await Promise.all([
      getFunnel(assetId),
      getRecentActivity(assetId, 10),
    ]);

    /**
     * =========================
     * RESPONSE (DASHBOARD READY)
     * =========================
     */
    return res.json({
      assetId,
      funnel,
      activity,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e.message || "Dashboard failed",
    });
  }
});

export default router;