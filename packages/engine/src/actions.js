/**
 * =========================
 * ACTION EXECUTOR
 * =========================
 */
export async function runAction(action, ctx) {
    switch (action.type) {
        case "message":
            return {
                event: "message",
                text: action.text,
            };
        case "notify_owner":
            return {
                event: "notify_owner",
                assetId: ctx.assetId,
                payload: action.payload ?? null,
            };
        case "timer":
            await new Promise((r) => setTimeout(r, action.duration));
            return {
                event: "timer_complete",
            };
        case "loop_message":
            return {
                event: "loop_start",
                messages: action.messages,
                interval: action.interval,
            };
        case "redirect":
            return {
                event: "redirect",
                url: action.url,
            };
        case "payment":
            return {
                event: "payment_required",
                provider: action.provider,
                amount: action.amount ?? 0,
                destination: action.destination ?? null,
                assetId: ctx.assetId,
            };
        default: {
            const _exhaustive = action;
            throw new Error(`Unknown action: ${JSON.stringify(_exhaustive)}`);
        }
    }
}
