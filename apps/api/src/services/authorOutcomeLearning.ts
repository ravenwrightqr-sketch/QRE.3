import { AnalyticsEventTypes, type AnalyticsEventType } from "@qre/contracts";

const POSITIVE_EVENTS = new Set<AnalyticsEventType>([
  AnalyticsEventTypes.FLOW_COMPLETE,
  AnalyticsEventTypes.EXPERIENCE_REPLAY,
  AnalyticsEventTypes.EXPERIENCE_SAVED,
  AnalyticsEventTypes.EXPERIENCE_SHARED,
  AnalyticsEventTypes.CTA_CLICK,
  AnalyticsEventTypes.PAYMENT_COMPLETED,
  AnalyticsEventTypes.MEMORY_RECOMMENDATION_SELECTED,
]);

const NEGATIVE_EVENTS = new Set<AnalyticsEventType>([
  AnalyticsEventTypes.FLOW_ABANDON,
  AnalyticsEventTypes.ERROR,
]);

export function normalizeExperienceOutcome(type: AnalyticsEventType): "positive" | "negative" | "neutral" {
  if (POSITIVE_EVENTS.has(type)) return "positive";
  if (NEGATIVE_EVENTS.has(type)) return "negative";
  return "neutral";
}
