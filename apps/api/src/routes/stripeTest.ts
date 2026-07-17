import express from "express";
import { db } from "@qre/db";

const router = express.Router();

/**
 * =========================================================
 * DEV ONLY - SIMULATES SUCCESSFUL STRIPE WEBHOOK
 * DELETE BEFORE PRODUCTION
 * =========================================================
 */
router.post("/test-webhook", async (req, res) => {
  try {
    const { assetId } = req.body;

    if (!assetId || typeof assetId !== "string") {
      return res.status(400).json({
        error: "Missing or invalid assetId",
      });
    }

    const asset = await db.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({
        error: "Asset not found",
      });
    }

    /**
     * DEV TEST:
     * Simply mark asset as paid/active.
     * No ownership/auth required.
     */
    await db.asset.update({
      where: { id: assetId },
      data: {
        paid: true,
        status: "active",
        claimedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Simulated webhook processed",
      assetId,
      unlocked: true,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e.message,
    });
  }
});

export default router;