import type { AnalyticsEventType } from "@qre/contracts";

import type { AnalyticsRepository } from "../repositories/index.js";

/**
 * Analytics event types are already contract-validated at the boundary.
 * Keep this mapper total without a stale manual switch list that can drift
 * when new cognitive/runtime events are added.
 */
export function mapAnalyticsEventType(type: AnalyticsEventType): AnalyticsEventType {
  return type;
}

export async function trackEvent(
  repo: AnalyticsRepository,
  input: {
    assetId: string;
    sessionId?: string;
    flowId?: string;
    stepIndex?: number;
    type: AnalyticsEventType;
    meta?: Record<string, unknown>;
  },
) {
  return repo.trackEvent({
    assetId: input.assetId,
    sessionId: input.sessionId ?? null,
    flowId: input.flowId ?? null,
    stepIndex: input.stepIndex ?? null,
    type: mapAnalyticsEventType(input.type),
    meta: input.meta ?? {},
  });
}
