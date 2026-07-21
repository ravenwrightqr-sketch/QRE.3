import { Router } from "express";
import { db } from "@qre/db";

const router = Router();

/**
 * =====================================================
 * QRE DEBUG ROUTES
 *
 * Development inspection only.
 *
 * Shows:
 *
 * Asset
 * Ownership
 * Claims
 * Experiences
 * Flows
 * Sessions
 * Analytics
 * Memory
 *
 * No production usage.
 * =====================================================
 */

router.get(
  "/asset/:id",
  async (req, res) => {
    try {
      const assetId = req.params.id;

      const asset = await db.asset.findUnique({
        where: {
          id: assetId,
        },

        include: {
          /**
           * Ownership record
           */
          ownership: true,

          /**
           * Payment claims
           */
          claims: true,

          /**
           * Experience layer
           */
          experiences: true,

          /**
           * Flow bindings
           */
          flows: {
            include: {
              flow: true,
            },
          },

          /**
           * Scan sessions
           */
          sessions: {
            orderBy: {
              startedAt: "desc",
            },

            take: 10,

            include: {
              analyticsEvents: true,
              events: true,
            },
          },

          /**
           * Analytics history
           */
          analyticsEvents: {
            orderBy: {
              createdAt: "desc",
            },

            take: 50,
          },

          /**
           * Cinematic memory layer
           */
          memorySnapshots: {
            orderBy: {
              createdAt: "desc",
            },

            take: 5,
          },
        },
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "Asset not found",
        });
      }

      return res.json({
        success: true,
        asset,
      });

    } catch (error) {
      console.error(
        "DEBUG ASSET ERROR",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Debug lookup failed",
      });
    }
  }
);

export default router;