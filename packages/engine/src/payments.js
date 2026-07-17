/**
 * =========================
 * PAYMENT RESOLVER (V1 CLEAN)
 * =========================
 *
 * NOTE:
 * This assumes payment routing is handled externally
 * (checkout/session/webhook layer).
 */
export function createPaymentLink(action) {
    if (action.type !== "payment") {
        throw new Error("Invalid action: not a payment");
    }
    const provider = action.provider;
    switch (provider) {
        case "stripe":
            return {
                provider: "stripe",
                url: "https://checkout.stripe.com/pay/session-placeholder",
            };
        case "cashapp":
            return {
                provider: "cashapp",
                url: "https://cash.app/$merchant-placeholder",
            };
        case "paypal":
            return {
                provider: "paypal",
                url: "https://paypal.me/merchant-placeholder",
            };
        case "custom":
        default:
            return {
                provider: "custom",
                url: "",
            };
    }
}
