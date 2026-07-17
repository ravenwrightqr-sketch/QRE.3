import express from "express";
import { db } from "@qre/db";
import { safeStringParam } from "../lib/safeParam.js";

const router = express.Router();

router.get("/:slug", async (req, res) => {
  try {
    const slug = safeStringParam(req.params.slug);

    if (!slug) {
      return res.status(400).json({ error: "Missing slug" });
    }

    const asset = await db.asset.findUnique({
      where: { slug },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const assetId = asset.id;

    const scans = await db.scanEvent.count({
      where: { assetId, type: "scan" },
    });

    const sessions = await db.scanSession.count({
      where: { assetId },
    });

    const purchases = await db.scanEvent.count({
      where: { assetId, type: "purchase_completed" },
    });

    return res.json({
      scans,
      sessions,
      conversionRate:
        sessions > 0 ? (purchases / sessions) * 100 : 0,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;