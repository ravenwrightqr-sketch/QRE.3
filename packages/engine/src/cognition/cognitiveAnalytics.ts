import type {
  AnalyticsEventClassification,
  AnalyticsEventLearningClass,
  AnalyticsLearningClass,
  AnalyticsEventType,
  CognitiveAnalyticsSignal,
} from "@qre/contracts";

const text = (value: unknown) => typeof value === "string" ? value : "";
const list = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const unique = (values: readonly string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const LEARNING_CLASS_BY_EVENT: Record<AnalyticsEventType, AnalyticsLearningClass> = {
  SCAN: "BEHAVIORAL_SIGNAL",
  SESSION_START: "BEHAVIORAL_SIGNAL",
  SESSION_END: "BEHAVIORAL_SIGNAL",
  FLOW_START: "BEHAVIORAL_SIGNAL",
  FLOW_STEP: "BEHAVIORAL_SIGNAL",
  FLOW_COMPLETE: "BEHAVIORAL_SIGNAL",
  FLOW_ABANDON: "FRICTION_SIGNAL",
  FLOW_TRIGGERED: "BEHAVIORAL_SIGNAL",
  AI_MEMORY_USED: "MEMORY_SIGNAL",
  AI_MEMORY_LEARNED: "MEMORY_SIGNAL",
  AI_MEMORY_RECOMMENDED: "MEMORY_SIGNAL",
  AI_CREATIVE_ACCEPTED: "CREATIVE_PREFERENCE",
  AI_CREATIVE_REJECTED: "CREATIVE_PREFERENCE",
  AI_VARIATION_SELECTED: "CREATIVE_PREFERENCE",
  AI_SIGNIFICANCE_SHIFT: "MEMORY_SIGNAL",
  AI_CINEMATIC_DECISION: "CREATIVE_PREFERENCE",
  AI_DECISION: "CREATIVE_PREFERENCE",
  MEMORY_APPLIED: "MEMORY_SIGNAL",
  MEMORY_CREATED: "MEMORY_SIGNAL",
  MEMORY_UPDATED: "MEMORY_SIGNAL",
  MEMORY_RECOMMENDATION_VIEWED: "MEMORY_SIGNAL",
  MEMORY_RECOMMENDATION_SELECTED: "MEMORY_SIGNAL",
  SPONSOR_IMPRESSION: "BUSINESS_SIGNAL",
  SPONSOR_INTERACTION: "BUSINESS_SIGNAL",
  SPONSOR_DISMISSED: "BUSINESS_SIGNAL",
  SPONSOR_CTA_CLICK: "BUSINESS_SIGNAL",
  CTA_CLICK: "BEHAVIORAL_SIGNAL",
  REDIRECT: "BEHAVIORAL_SIGNAL",
  PAYMENT_REQUIRED: "BUSINESS_SIGNAL",
  PAYMENT_STARTED: "BUSINESS_SIGNAL",
  PAYMENT_COMPLETED: "BUSINESS_SIGNAL",
  UNLOCK: "BUSINESS_SIGNAL",
  CLAIM_STARTED: "BUSINESS_SIGNAL",
  CLAIM_COMPLETED: "BUSINESS_SIGNAL",
  TEASER_VIEW: "BEHAVIORAL_SIGNAL",
  GEO_MARK: "FACTUAL_WORLD",
  WEBSITE_CLICK: "BEHAVIORAL_SIGNAL",
  SOCIAL_CLICK: "BEHAVIORAL_SIGNAL",
  TIP_STARTED: "BUSINESS_SIGNAL",
  TIP_COMPLETED: "BUSINESS_SIGNAL",
  ERROR: "RUNTIME_HEALTH",
  FLOW_POLICY_APPLIED: "RUNTIME_HEALTH",
  CHECK_IN: "BEHAVIORAL_SIGNAL",
  CHECK_OUT: "BEHAVIORAL_SIGNAL",
  PRESENCE_JOIN: "FACTUAL_WORLD",
  PRESENCE_LEAVE: "FACTUAL_WORLD",
  TICKET_CREATED: "BUSINESS_SIGNAL",
  TICKET_VIEWED: "BUSINESS_SIGNAL",
  TICKET_REDEEMED: "BUSINESS_SIGNAL",
  TICKET_REJECTED: "BUSINESS_SIGNAL",
  MEDIA_PLAY: "BEHAVIORAL_SIGNAL",
  MEDIA_COMPLETE: "BEHAVIORAL_SIGNAL",
  MEDIA_REPLAY: "BEHAVIORAL_SIGNAL",
  EXPERIENCE_REPLAY: "BEHAVIORAL_SIGNAL",
  EXPERIENCE_SHARED: "BEHAVIORAL_SIGNAL",
  EXPERIENCE_SAVED: "BEHAVIORAL_SIGNAL",
};

const AUTHOR_LEARNING_CLASSES = new Set<AnalyticsLearningClass>([
  "BEHAVIORAL_SIGNAL",
  "CREATIVE_PREFERENCE",
  "FRICTION_SIGNAL",
  "MEMORY_SIGNAL",
  "FACTUAL_WORLD",
]);

export function classifyAnalyticsEvent(type: AnalyticsEventType): AnalyticsEventClassification {
  const learningClass = LEARNING_CLASS_BY_EVENT[type] ?? "NON_LEARNING";
  return {
    type,
    learningClass,
    feedsAuthor: AUTHOR_LEARNING_CLASSES.has(learningClass),
  };
}

/**
 * Analytics is observational input, never factual story evidence.
 * It affects taste, friction, novelty and emphasis for future compilations.
 *
 * Every analytics event is first classified by semantic purpose. Only
 * governed learning classes become Author learning signals.
 */
export function summarizeCognitiveAnalytics(events: readonly unknown[]): CognitiveAnalyticsSignal {
  let scans = 0;
  let completions = 0;
  let abandons = 0;
  let replays = 0;
  let ctaClicks = 0;
  let errors = 0;
  const accepted: string[] = [];
  const rejected: string[] = [];
  const preferences: string[] = [];

  for (const raw of events) {
    const event = raw as { type?: unknown; meta?: unknown };
    const rawType = text(event.type).toUpperCase() as AnalyticsEventType;
    const classification = classifyAnalyticsEvent(rawType);
    const meta = event.meta && typeof event.meta === "object" ? event.meta as Record<string, unknown> : {};

    if (classification.learningClass === "NON_LEARNING") continue;

    if (rawType === "SCAN") scans += 1;
    if (rawType === "FLOW_COMPLETE") completions += 1;
    if (rawType === "FLOW_ABANDON") abandons += 1;
    if (rawType === "EXPERIENCE_REPLAY" || rawType === "MEDIA_REPLAY") replays += 1;
    if (rawType === "CTA_CLICK") ctaClicks += 1;
    if (rawType === "ERROR") errors += 1;

    if (classification.learningClass === "CREATIVE_PREFERENCE") {
      const acceptedValue = text(meta.acceptedCreative ?? meta.accepted);
      const rejectedValue = text(meta.rejectedCreative ?? meta.rejected);
      const preference = text(meta.preference ?? meta.creativePreference);
      if (acceptedValue) accepted.push(acceptedValue);
      if (rejectedValue) rejected.push(rejectedValue);
      if (preference) preferences.push(preference);

      const feedback = text(meta.feedback);
      const trajectory = text(meta.trajectory);
      const styleTags = list(meta.styleTags);
      const draft = text(meta.draft);

      if (rawType === "AI_CREATIVE_ACCEPTED" || rawType === "AI_VARIATION_SELECTED") {
        if (feedback) accepted.push(`feedback:${feedback}`);
        if (trajectory) accepted.push(`trajectory:${trajectory}`);
        for (const tag of styleTags) accepted.push(`style:${tag}`);
        if (draft) accepted.push(`draft:${draft.slice(0, 180)}`);
      }

      if (rawType === "AI_CREATIVE_REJECTED") {
        if (feedback) rejected.push(`feedback:${feedback}`);
        if (trajectory) rejected.push(`trajectory:${trajectory}`);
        for (const tag of styleTags) rejected.push(`style:${tag}`);
        if (draft) rejected.push(`draft:${draft.slice(0, 180)}`);
      }
    }
  }

  const engagement = scans > 0
    ? Math.min(1, completions / scans + replays / Math.max(1, scans) * 0.2 + ctaClicks / Math.max(1, scans) * 0.1)
    : 0;
  const friction = scans > 0
    ? Math.min(1, abandons / scans + errors / Math.max(1, scans) * 0.5)
    : 0;

  return {
    scans,
    completions,
    abandons,
    replays,
    ctaClicks,
    errors,
    engagement,
    friction,
    accepted: unique(accepted).slice(-50),
    rejected: unique(rejected).slice(-50),
    preferences: unique(preferences).slice(-50),
  };
}
