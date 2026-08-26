import type { AnalyticsEventType } from "@qre/contracts";

import type { AnalyticsRepository } from "../repositories/index.js";

export async function trackEvent(
  repo: AnalyticsRepository,
  input: {
    assetId: string;
    sessionId?: string | null;
    flowId?: string | null;
    stepIndex?: number | null;
    type: AnalyticsEventType;
    meta?: Record<string, unknown>;
  },
) {
  return repo.trackEvent({
    assetId: input.assetId,
    sessionId: input.sessionId ?? null,
    flowId: input.flowId ?? null,
    stepIndex: input.stepIndex ?? null,
    type: input.type,
    meta: input.meta ?? {},
  });
}