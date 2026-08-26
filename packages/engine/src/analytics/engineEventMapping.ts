import {
  AnalyticsEventTypes,
  type AnalyticsEventType,
  EngineEventTypes,
  type EngineEventType,
} from "@qre/contracts";

const ENGINE_TO_ANALYTICS: Record<
  EngineEventType,
  AnalyticsEventType
> = {
  [EngineEventTypes.SCAN_START]:
    AnalyticsEventTypes.SCAN,

  [EngineEventTypes.SESSION_START]:
    AnalyticsEventTypes.SESSION_START,

  [EngineEventTypes.SESSION_END]:
    AnalyticsEventTypes.SESSION_END,

  [EngineEventTypes.FLOW_TRIGGERED]:
    AnalyticsEventTypes.FLOW_TRIGGERED,

  [EngineEventTypes.FLOW_START]:
    AnalyticsEventTypes.FLOW_START,

  [EngineEventTypes.FLOW_STEP]:
    AnalyticsEventTypes.FLOW_STEP,

  [EngineEventTypes.FLOW_COMPLETE]:
    AnalyticsEventTypes.FLOW_COMPLETE,

  [EngineEventTypes.FLOW_ABANDON]:
    AnalyticsEventTypes.FLOW_ABANDON,

  [EngineEventTypes.ACCESS_RESOLVED]:
    AnalyticsEventTypes.AI_DECISION,

  [EngineEventTypes.FLOW_POLICY_APPLIED]:
    AnalyticsEventTypes.FLOW_POLICY_APPLIED,

  [EngineEventTypes.UNLOCK_GRANTED]:
    AnalyticsEventTypes.UNLOCK,

  [EngineEventTypes.MEMORY_APPLIED]:
    AnalyticsEventTypes.MEMORY_APPLIED,

  [EngineEventTypes.MEMORY_CREATED]:
    AnalyticsEventTypes.MEMORY_CREATED,

  [EngineEventTypes.MEMORY_UPDATED]:
    AnalyticsEventTypes.MEMORY_UPDATED,

  [EngineEventTypes.AI_DECISION]:
    AnalyticsEventTypes.AI_DECISION,

  [EngineEventTypes.AI_MEMORY_USED]:
    AnalyticsEventTypes.AI_MEMORY_USED,

  [EngineEventTypes.GEO_MARK]:
    AnalyticsEventTypes.GEO_MARK,

  [EngineEventTypes.CHECK_IN]:
    AnalyticsEventTypes.CHECK_IN,

  [EngineEventTypes.CHECK_OUT]:
    AnalyticsEventTypes.CHECK_OUT,

  [EngineEventTypes.PRESENCE_JOIN]:
    AnalyticsEventTypes.PRESENCE_JOIN,

  [EngineEventTypes.PRESENCE_LEAVE]:
    AnalyticsEventTypes.PRESENCE_LEAVE,

  [EngineEventTypes.CTA_CLICK]:
    AnalyticsEventTypes.CTA_CLICK,

  [EngineEventTypes.REDIRECT]:
    AnalyticsEventTypes.REDIRECT,

  [EngineEventTypes.TEASER_VIEW]:
    AnalyticsEventTypes.TEASER_VIEW,

  [EngineEventTypes.PAYMENT_STARTED]:
    AnalyticsEventTypes.PAYMENT_STARTED,

  [EngineEventTypes.PAYMENT_COMPLETED]:
    AnalyticsEventTypes.PAYMENT_COMPLETED,

  [EngineEventTypes.CLAIM_STARTED]:
    AnalyticsEventTypes.CLAIM_STARTED,

  [EngineEventTypes.CLAIM_COMPLETED]:
    AnalyticsEventTypes.CLAIM_COMPLETED,

  [EngineEventTypes.TIP_STARTED]:
    AnalyticsEventTypes.TIP_STARTED,

  [EngineEventTypes.TIP_COMPLETED]:
    AnalyticsEventTypes.TIP_COMPLETED,

  [EngineEventTypes.ERROR]:
    AnalyticsEventTypes.ERROR,
};

export function mapEngineEventToAnalytics(
  type: EngineEventType,
): AnalyticsEventType {
  return ENGINE_TO_ANALYTICS[type];
}

export const engineToAnalyticsMap =
  ENGINE_TO_ANALYTICS;