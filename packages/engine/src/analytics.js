import { db } from "@qre/db";
export async function logAnalyticsEvent(input) {
    await db.analyticsEvent.create({
        data: {
            assetId: input.assetId,
            sessionId: input.sessionId ?? null,
            flowId: input.flowId ?? null,
            stepIndex: input.stepIndex ?? null,
            type: input.type,
            meta: input.meta ?? null,
        },
    });
}
