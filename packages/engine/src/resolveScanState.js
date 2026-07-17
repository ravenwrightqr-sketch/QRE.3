import { db } from "@qre/db";
export async function resolveScanState(input) {
    const { asset, userId } = input;
    const ownership = userId
        ? await db.ownership.findUnique({
            where: { assetId: asset.id },
        })
        : null;
    const isOwner = !!ownership && ownership.userId === userId;
    let access;
    if (!asset.paid) {
        access = "UNCLAIMED";
    }
    else if (isOwner) {
        access = "UNLOCKED";
    }
    else {
        access = "LOCKED";
    }
    return {
        mode: userId ? "authenticated" : "public",
        access,
        assetId: asset.id,
        sessionId: "",
        flowId: asset.flowId ?? null,
        stepIndex: 0,
        teaser: null,
        preview: access !== "UNLOCKED",
        nextAction: access === "UNCLAIMED"
            ? "CHECKOUT"
            : access === "LOCKED"
                ? "CHECKOUT"
                : "RUN_FLOW",
        actionUrl: null,
        timestamp: new Date().toISOString(),
    };
}
