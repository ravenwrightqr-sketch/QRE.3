import express from "express";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * =========================
 * CLAIM ASSET OWNERSHIP
 * =========================
 * First authenticated user becomes owner
 */
router.post(
  "/:slug",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      /**
       * SAFE SLUG NORMALIZATION
       */
      const rawSlug = req.params.slug;

      const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

      if (!slug) {
        return res.status(400).json({ error: "Invalid slug" });
      }

      /**
       * SAFE USER ID (NO ! ASSERTION)
       */
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      /**
       * FIND ASSET
       */
      const asset = await db.asset.findUnique({
        where: { slug },
      });

      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      /**
       * PREVENT DOUBLE CLAIMING
       */
      if (asset.ownerId) {
        return res.status(400).json({
          error: "Asset already claimed",
        });
      }

      /**
       * UPDATE ASSET OWNER
       */
      await db.asset.update({
        where: { id: asset.id },
        data: {
          ownerId: userId,
          claimedAt: new Date(),
        },
      });

      /**
       * CREATE OWNERSHIP RECORD
       */
      await db.ownership.create({
        data: {
          assetId: asset.id,
          userId,
          status: "CLAIMED",
          claimedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        assetId: asset.id,
        ownerId: userId,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
);

export default router;