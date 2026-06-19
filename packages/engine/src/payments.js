/**
 * =========================
 * PAYMENT RESOLVER (V1)
 * =========================
 */
export function createPaymentLink(action) {
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
