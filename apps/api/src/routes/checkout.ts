import express from "express";
import Stripe from "stripe";
import { SaleChannel } from "@prisma/client";
import { db } from "@qre/db";
import { requireAuth, AuthRequest } from "../middleware/requireAuth.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

/**
 * Create a Stripe Checkout session for one retail asset.
 * Payment remains authoritative: this route only reserves the
 * inventory item for the authenticated account and creates the session.
 * Final paid/unlocked state is applied by stripeWebhook -> unlockAsset().
 */
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const slug = req.body?.slug;
    const userId = req.user?.userId;

    if (typeof slug !== "string" || !slug.trim()) {
      return res.status(400).json({ error: "Missing or invalid slug" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const membership = await db.accountUser.findFirst({
      where: { userId },
      orderBy: { id: "asc" },
      select: { accountId: true },
    });

    if (!membership) {
      return res.status(400).json({
        error: "An account is required before purchasing a QRE asset",
      });
    }

    const asset = await db.asset.findUnique({
      where: { slug: slug.trim() },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    if (
      asset.paid ||
      asset.accountId ||
      asset.saleChannel !== SaleChannel.RETAIL ||
      asset.status !== "active"
    ) {
      return res.status(409).json({ error: "This QRE asset is no longer available" });
    }

    if (!asset.priceCents || asset.priceCents <= 0) {
      return res.status(400).json({ error: "Invalid price configuration" });
    }

    const reserved = await db.asset.updateMany({
      where: {
        id: asset.id,
        paid: false,
        accountId: null,
        saleChannel: SaleChannel.RETAIL,
        status: "active",
      },
      data: {
        accountId: membership.accountId,
        ownerId: userId,
      },
    });

    if (reserved.count !== 1) {
      return res.status(409).json({ error: "This QRE asset was just purchased by another customer" });
    }

    const baseUrl = process.env.CLIENT_URL;
    if (!baseUrl) throw new Error("CLIENT_URL missing");

    if (process.env.NODE_ENV === "development") {
      return res.json({
        dev: true,
        message: "Use Stripe test mode to complete the purchase",
        assetId: asset.id,
      });
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: asset.priceCents,
              product_data: {
                name: asset.displayName ?? "QRE Physical QR",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cancel?asset=${encodeURIComponent(asset.slug)}`,
        metadata: {
          assetId: asset.id,
          slug: asset.slug,
          userId,
          accountId: membership.accountId,
          type: "ASSET_UNLOCK",
          paymentType: "ONE_TIME_UNLOCK",
        },
      });
    } catch (stripeError) {
      await db.asset.updateMany({
        where: {
          id: asset.id,
          paid: false,
          accountId: membership.accountId,
          ownerId: userId,
        },
        data: {
          accountId: null,
          ownerId: null,
        },
      });
      throw stripeError;
    }

    return res.json({
      url: session.url,
      assetId: asset.id,
    });
  } catch (error: any) {
    console.error("[CHECKOUT ERROR]", error);
    return res.status(500).json({ error: error.message ?? "Checkout failed" });
  }
});

export default router;
