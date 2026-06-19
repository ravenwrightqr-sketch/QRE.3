import { db } from "@qre/db";

export type ScanEventType =
  | "scan"
  | "flow_start"
  | "flow_end"
  | "message"
  | "redirect"
  | "timer"
  | "timer_complete"
  | "notify_owner"
  | "payment_required"
  | "purchase_completed";

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