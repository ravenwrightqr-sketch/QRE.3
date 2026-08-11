export const AnalyticsEventTypes = {
  SCAN: "SCAN",
  SESSION_START: "SESSION_START",
  SESSION_END: "SESSION_END",
  FLOW_START: "FLOW_START",
  FLOW_STEP: "FLOW_STEP",
  FLOW_COMPLETE: "FLOW_COMPLETE",
  FLOW_ABANDON: "FLOW_ABANDON",
  FLOW_TRIGGERED: "FLOW_TRIGGERED",
  AI_MEMORY_USED: "AI_MEMORY_USED",
  AI_DECISION: "AI_DECISION",
  MEMORY_APPLIED: "MEMORY_APPLIED",
  CTA_CLICK: "CTA_CLICK",
  REDIRECT: "REDIRECT",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  PAYMENT_STARTED: "PAYMENT_STARTED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  UNLOCK: "UNLOCK",
  CLAIM_STARTED: "CLAIM_STARTED",
  CLAIM_COMPLETED: "CLAIM_COMPLETED",
  TEASER_VIEW: "TEASER_VIEW",
  GEO_MARK: "GEO_MARK",
  WEBSITE_CLICK: "WEBSITE_CLICK",
  SOCIAL_CLICK: "SOCIAL_CLICK",
  TIP_STARTED: "TIP_STARTED",
  TIP_COMPLETED: "TIP_COMPLETED",
  ERROR: "ERROR",
  FLOW_POLICY_APPLIED: "FLOW_POLICY_APPLIED",
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
  PRESENCE_JOIN: "PRESENCE_JOIN",
  PRESENCE_LEAVE: "PRESENCE_LEAVE",
  EXPERIENCE_COMPILED: "EXPERIENCE_COMPILED",
  MEMORY_SNAPSHOT_BUILT: "MEMORY_SNAPSHOT_BUILT",
  GEO_STORY_BUILT: "GEO_STORY_BUILT",
} as const;

export type AnalyticsEventType =
  (typeof AnalyticsEventTypes)[keyof typeof AnalyticsEventTypes];

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  createdAt: Date;
  assetId?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/** Runtime analytics summary carried with every compiled experience. */
export type ExperienceAnalytics = {
  eventCount: number;
  byType: Record<string, number>;
  sessionId?: string;
  assetId?: string;
  firstEventAt?: string;
  lastEventAt?: string;
  geoMarks: number;
  memoryUses: number;
  completions: number;
  errors: number;
  meta?: Record<string, unknown>;
};
