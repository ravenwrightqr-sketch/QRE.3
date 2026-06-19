import { db } from "@qre/db";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
});
const allowedPlans = ["basic", "premium", "subscription"];
export async function createCheckout(assetId, plan) {
    // ---------------------------
    // VALIDATION
    // ---------------------------
    if (!allowedPlans.includes(plan)) {
        throw new Error("Invalid plan");
    }
    const asset = await db.asset.findUnique({
        where: { id: assetId },
    });
    if (!asset)
        throw new Error("Asset not found");
    // ---------------------------
    // PRICE LOGIC (SAFE)
    // ---------------------------
    const basePrice = asset.priceCents ?? 0;
    const price = plan === "premium"
        ? asset.priceCents * 2
        : asset.priceCents;
    if (price <= 0) {
        throw new Error("Invalid asset pricing configuration");
    }
    // ---------------------------
    // ENV SAFE URLS (PRODUCTION READY)
    // ---------------------------
    const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    // ---------------------------
    // STRIPE SESSION
    // ---------------------------
    const session = await stripe.checkout.sessions.create({
        mode: plan === "subscription" ? "subscription" : "payment",
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: price,
                    product_data: {
                        name: `QRE Asset - ${asset.slug}`,
                    },
                },
                quantity: 1,
            },
        ],
        success_url: `${baseUrl}/scan/${asset.slug}?success=1`,
        cancel_url: `${baseUrl}/scan/${asset.slug}?canceled=1`,
        metadata: {
            assetId: asset.id,
            plan,
        },
    });
    if (!session.url) {
        throw new Error("Stripe session failed to generate URL");
    }
    return { url: session.url };
}
