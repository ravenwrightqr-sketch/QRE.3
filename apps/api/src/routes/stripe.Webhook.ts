import express from "express";
import Stripe from "stripe";
import { db } from "@qre/db";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

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
     * PAYMENT SUCCESS → UNLOCK ASSET
     * =========================
     */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const assetId = session.metadata?.assetId;
      const plan = session.metadata?.plan ?? "base";

      if (!assetId) {
        return res.status(400).json({ error: "Missing assetId" });
      }

      await db.asset.update({
        where: { id: assetId },
        data: {
          paid: true,
          status: plan === "subscription" ? "active" : "active",
        },
      });
    }

    res.json({ received: true });
  }
);

export default router;