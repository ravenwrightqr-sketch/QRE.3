import type { PaymentAction } from "./actions.js";

export type PaymentResult = {
  url: string;
  provider: PaymentAction["provider"];
};

/**
 * =========================
 * PAYMENT RESOLVER (V1)
 * =========================
 */
export function createPaymentLink(action: PaymentAction): PaymentResult {
  switch (action.provider) {
    case "stripe":
      return {
        provider: "stripe",
        url: `https://checkout.stripe.com/pay/${action.destination ?? ""}`,
      };

    case "cashapp":
      return {
        provider: "cashapp",
        url: `https://cash.app/$${action.destination ?? ""}`,
      };

    case "paypal":
      return {
        provider: "paypal",
        url: `https://paypal.me/${action.destination ?? ""}`,
      };

    case "custom":
    default:
      return {
        provider: "custom",
        url: action.destination ?? "",
      };
  }
}