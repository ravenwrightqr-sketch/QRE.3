import { db } from "@qre/db";
export async function getAssetAnalytics(assetId) {
    const events = (await db.analyticsEvent.findMany({
        where: { assetId },
        orderBy: { createdAt: "desc" },
    }));
    // -----------------------------
    // METRICS
    // -----------------------------
    const totalScans = events.filter(e => e.type === "scan").length;
    const flowStarts = events.filter(e => e.type === "flow_start").length;
    const flowEnds = events.filter(e => e.type === "flow_end").length;
    const flowSteps = events.filter(e => e.type === "message" ||
        e.type === "redirect" ||
        e.type === "timer" ||
        e.type === "timer_complete").length;
    const redirects = events.filter(e => e.type === "redirect").length;
    const payments = events.filter(e => e.type === "payment_required").length;
    const purchases = events.filter(e => e.type === "purchase_completed").length;
    const notifyOwners = events.filter(e => e.type === "notify_owner").length;
    const sessions = new Set(events
        .map(e => e.sessionId)
        .filter((id) => Boolean(id))).size;
    // -----------------------------
    // RETURN SHAPE
    // -----------------------------
    return {
        assetId,
        summary: {
            totalScans,
            sessions,
            flowStarts,
            flowSteps,
            flowEnds,
            redirects,
            payments,
            purchases,
            notifyOwners,
        },
        events: events.slice(0, 200),
    };
}
