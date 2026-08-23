import {
  subscribeSpine,
  type SpineEvent,
} from "@qre/engine";

import {
  ANALYTICS_EVENT_REGISTRY,
  type AnalyticsEventType,
} from "@qre/contracts";

import type { AnalyticsRepository } from "@qre/engine";

const ENGINE_TO_ANALYTICS: Partial<
  Record<SpineEvent["type"], AnalyticsEventType>
> = {
  SCAN_START: "SCAN",
  SESSION_START: "SESSION_START",
  SESSION_END: "SESSION_END",

  FLOW_TRIGGERED: "FLOW_TRIGGERED",
  FLOW_START: "FLOW_START",
  FLOW_STEP: "FLOW_STEP",
  FLOW_COMPLETE: "FLOW_COMPLETE",
  FLOW_ABANDON: "FLOW_ABANDON",

  FLOW_POLICY_APPLIED: "FLOW_POLICY_APPLIED",

  UNLOCK_GRANTED: "UNLOCK",

  MEMORY_APPLIED: "MEMORY_APPLIED",
  MEMORY_CREATED: "MEMORY_CREATED",
  MEMORY_UPDATED: "MEMORY_UPDATED",

  AI_DECISION: "AI_DECISION",
  AI_MEMORY_USED: "AI_MEMORY_USED",
  AI_MEMORY_LEARNED: "AI_MEMORY_LEARNED",
  AI_CINEMATIC_DECISION: "AI_CINEMATIC_DECISION",

  GEO_MARK: "GEO_MARK",
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
  PRESENCE_JOIN: "PRESENCE_JOIN",
  PRESENCE_LEAVE: "PRESENCE_LEAVE",

  CTA_CLICK: "CTA_CLICK",
  REDIRECT: "REDIRECT",
  TEASER_VIEW: "TEASER_VIEW",

  PAYMENT_STARTED: "PAYMENT_STARTED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  CLAIM_STARTED: "CLAIM_STARTED",
  CLAIM_COMPLETED: "CLAIM_COMPLETED",

  TIP_STARTED: "TIP_STARTED",
  TIP_COMPLETED: "TIP_COMPLETED",

  ERROR: "ERROR",
};

function assertAnalyticsMappingIsRegistered(
  type: AnalyticsEventType,
): void {
  if (!ANALYTICS_EVENT_REGISTRY[type]) {
    throw new Error(
      `[ANALYTICS SPINE] Unregistered analytics event: ${type}`,
    );
  }
}

export function mapEngineEventToAnalytics(
  event: SpineEvent,
): AnalyticsEventType | undefined {
  const analyticsType =
    ENGINE_TO_ANALYTICS[event.type];

  if (analyticsType) {
    assertAnalyticsMappingIsRegistered(
      analyticsType,
    );
  }

  return analyticsType;
}

export function startAnalyticsSpineSubscriber(
  analyticsRepository: AnalyticsRepository,
) {
  return subscribeSpine(async (event) => {
    const analyticsType =
      mapEngineEventToAnalytics(event);

    if (!analyticsType) return;

    await analyticsRepository.trackEvent({
      assetId: event.assetId,
      sessionId: event.sessionId,
      flowId: event.flowId,
      stepIndex: event.stepIndex,
      type: analyticsType,
      meta: {
        ...(event.meta ?? {}),
        source: "engine-spine",
        engineEventType: event.type,
      },
    });
  });
}