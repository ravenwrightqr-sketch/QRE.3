import express, { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "@qre/db";
import { unlockAsset } from "../services/unlockAsset.js";

const router = express.Router();

/**
 * =========================
 * DEV STRIPE TEST WEBHOOK
 * =========================
 *
 * DEV ONLY
 *
 * Simulates:
 *
 * Stripe payment success
 *        ↓
 * unlockAsset()
 *        ↓
 * production unlock pipeline
 *
 * unlockAsset is the single source
 * of truth.
 *
 * =========================
 */

router.post(
  "/test-webhook",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
      assetId,
      } = req.body;

      if (!assetId) {
        return res.status(400).json({
          error: "Missing assetId",
        });
      }

      const asset = await db.asset.findUnique({
        where: {
          id: assetId,
        },
      });

      if (!asset) {
        return res.status(404).json({
          error: "Asset not found",
        });
      }

      /**
       * Fake Stripe session
       */
      const fakeSession = {
        id: `dev_test_${Date.now()}`,

        amount_total:
          asset.priceCents,

        payment_intent:
          `dev_payment_${Date.now()}`,

      } as Stripe.Checkout.Session;
      const updated =
      await unlockAsset(
      asset.id,
      fakeSession
       );
      
      
      
      /**
       * Reload updated asset state
       */
      const finalAsset =
        await db.asset.findUnique({
          where: {
            id: updated.id,
          },

          include: {
            ownership: true,
          },
        });


      return res.json({
        success: true,

        message:
          "DEV payment completed",

        unlocked: true,

        asset: {
          id:
            finalAsset?.id,

          slug:
            finalAsset?.slug,

          paid:
            finalAsset?.paid,

          accountId:
            finalAsset?.accountId ?? null,

          ownershipId:
            finalAsset?.ownership?.id ?? null,
        },
      });

    } catch (error: any) {
      console.error(
        "[STRIPE TEST]",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "DEV payment failed",
      });
    }
  }
);

export default router;