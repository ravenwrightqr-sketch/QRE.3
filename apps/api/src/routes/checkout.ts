

import express from "express";
import Stripe from "stripe";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

/**
 * =========================
 * CHECKOUT ROUTE
 * =========================
 * - DEV: instantly unlocks asset
 * - PROD: creates Stripe session
 */
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.body;
    const userId = req.user?.userId;

    if (typeof slug !== "string") {
      return res.status(400).json({ error: "Missing or invalid slug" });
    }

    const asset = await db.asset.findUnique({
      where: { slug },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const baseUrl = process.env.CLIENT_URL;
    if (!baseUrl) throw new Error("CLIENT_URL missing");

    /**
     * =========================
     * DEV MODE (LOCAL TESTING)
     * =========================
     * bypass Stripe entirely so your system works end-to-end
     */
   if (process.env.NODE_ENV === "development") {
  const updated = await db.asset.update({
    where: { id: asset.id },
    data: {
      paid: true,
      ownerId: userId ?? null,
      status: "active",
      claimedAt: new Date(),
    },
  });

  if (userId) {
    await db.ownership.upsert({
      where: { assetId: asset.id },
      update: {
        userId,
        status: "CLAIMED",
        claimedAt: new Date(),
      },
      create: {
        assetId: asset.id,
        userId,
        status: "CLAIMED",
        claimedAt: new Date(),
      },
    });
  }

  return res.json({
    dev: true,
    unlocked: true,
    assetId: asset.id,
    url: `${baseUrl}/success`,
  });
}

    /**
     * =========================
     * VALIDATION (PROD ONLY)
     * =========================
     */
    if (!asset.priceCents || asset.priceCents <= 0) {
      return res.status(400).json({ error: "Invalid price configuration" });
    }

    /**
     * =========================
     * STRIPE CHECKOUT SESSION
     * =========================
     */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: asset.priceCents,
            product_data: {
              name: `QRE Asset ${asset.slug}`,
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
metadata: {
  assetId: asset.id,
  slug: asset.slug,
  userId: userId ?? null,
}
    });

    return res.json({
      url: session.url ?? null,
      assetId: asset.id,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e.message,
    });
  }
});

export default router;