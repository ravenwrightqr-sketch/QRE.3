import express from "express";
import Stripe from "stripe";
import { db } from "@qre/db";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

/**
 * =========================
 * ATOMIC UNLOCK CORE
 * =========================
 * SINGLE SOURCE OF TRUTH: ownership write
 */
async function unlockAsset(assetId: string, userId: string | null) {
  return db.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) throw new Error("Asset not found");

    // HARD IDEMPOTENCY GUARD
    if (asset.paid && asset.ownerId === userId) return asset;

    const updated = await tx.asset.update({
      where: { id: assetId },
      data: {
        paid: true,
        status: "active",
        ownerId: userId,
        claimedAt: userId ? new Date() : null,
      },
    });

    /**
     * Ownership = authoritative identity layer
     */
    if (userId) {
      await tx.ownership.upsert({
        where: { assetId },
        update: {
          userId,
          status: "ACTIVE",
          claimedAt: new Date(),
        },
        create: {
          assetId,
          userId,
          status: "ACTIVE",
          claimedAt: new Date(),
        },
      });
    }

    return updated;
  });
}

/**
 * =========================
 * STRIPE WEBHOOK
 * =========================
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe signature" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    /**
     * =========================
     * IDEMPOTENCY (GLOBAL LEVEL)
     * =========================
     */
    const exists = await db.stripeEvent.findUnique({
      where: { id: event.id },
    });

    if (exists) {
      return res.json({ received: true, duplicate: true });
    }

    await db.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });

    /**
     * =========================
     * EVENT FILTER
     * =========================
     */
    if (event.type !== "checkout.session.completed") {
      return res.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    /**
     * =========================
     * METADATA SAFETY LAYER
     * =========================
     */
    const assetId = session.metadata?.assetId;

    const userId =
      session.metadata?.userId &&
      session.metadata.userId !== "anonymous"
        ? session.metadata.userId
        : null;

    if (!assetId) {
      return res.status(400).json({ error: "Missing assetId" });
    }

    /**
     * =========================
     * ASSET VALIDATION
     * =========================
     */
    const asset = await db.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    /**
     * =========================
     * DOMAIN IDEMPOTENCY
     * =========================
     */
    if (asset.paid && asset.ownerId === userId) {
      return res.json({
        received: true,
        alreadyProcessed: true,
      });
    }

    /**
     * =========================
     * FINAL ATOMIC WRITE
     * =========================
     */
    try {
      await unlockAsset(assetId, userId);
    } catch (err: any) {
      return res.status(500).json({
        error: err.message,
      });
    }

    return res.json({
      received: true,
      unlocked: true,
      assetId,
    });
  }
);

export default router;