import { db } from "@qre/db";
import type { ScanEventType } from "./types.js";

export async function logAnalyticsEvent(input: {
  assetId: string;
  sessionId?: string;
  flowId?: string;
  type: ScanEventType;
  stepIndex?: number;
  meta?: any;
}) {
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