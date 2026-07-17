export async function runAction(action, ctx) {
    switch (action.type) {
        case "message":
            return { event: "message", text: action.text };
        case "delay":
            await new Promise((r) => setTimeout(r, action.ms));
            return { event: "timer_complete" };
        case "redirect":
            return { event: "redirect", url: action.url };
        case "unlock":
            return { event: "unlock" };
        case "cta":
            return { event: "message", text: action.text };
        case "payment":
            return {
                event: "payment_required",
                provider: action.provider,
                amount: action.amount ?? 0,
                assetId: ctx.assetId,
                sessionId: ctx.sessionId,
            };
        default: {
            const _exhaustive = action;
            throw new Error("Unknown action");
        }
    }
}
