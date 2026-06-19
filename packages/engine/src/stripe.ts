import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  return stripeInstance;
}