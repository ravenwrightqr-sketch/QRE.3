import type {
  AnalyticsEventType,
  AnalyticsOutcomeKind,
} from "./analytics.js";

export type AnalyticsEventCategory =
  | "scan"
  | "session"
  | "flow"
  | "access"
  | "ai"
  | "memory"
  | "creative"
  | "engagement"
  | "commerce"
  | "geo"
  | "presence"
  | "sponsor"
  | "ticketing"
  | "media"
  | "author"
  | "system";

export type AnalyticsEventSource =
  | "runtime"
  | "player"
  | "author"
  | "memory"
  | "geo"
  | "presence"
  | "commerce"
  | "ticketing"
  | "sponsor"
  | "system";

export interface AnalyticsEventDefinition {
  type: AnalyticsEventType;
  category: AnalyticsEventCategory;
  description: string;
  defaultOutcome: AnalyticsOutcomeKind;
  source: AnalyticsEventSource;
  learningRelevant: boolean;
  customerVisible: boolean;
  enterpriseRelevant: boolean;
  investorRelevant: boolean;
}

const define = (
  type: AnalyticsEventType,
  category: AnalyticsEventCategory,
  source: AnalyticsEventSource,
  description: string,
  defaultOutcome: AnalyticsOutcomeKind = "neutral",
  options: Partial<
    Omit<
      AnalyticsEventDefinition,
      "type" | "category" | "source" | "description" | "defaultOutcome"
    >
  > = {},
): AnalyticsEventDefinition => ({
  type,
  category,
  source,
  description,
  defaultOutcome,
  learningRelevant: false,
  customerVisible: true,
  enterpriseRelevant: true,
  investorRelevant: false,
  ...options,
});

export const ANALYTICS_EVENT_DEFINITIONS: readonly AnalyticsEventDefinition[] = [
  define("SCAN", "scan", "runtime", "A QRE asset was scanned.", "neutral", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("SESSION_START", "session", "runtime", "A scan session started.", "neutral", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("SESSION_END", "session", "runtime", "A scan session ended.", "neutral", {
    learningRelevant: true,
    investorRelevant: true,
  }),

  define("FLOW_START", "flow", "runtime", "A configured flow began.", "neutral", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("FLOW_STEP", "flow", "runtime", "A flow step was entered.", "neutral", {
    learningRelevant: true,
  }),
  define("FLOW_COMPLETE", "flow", "runtime", "A flow completed.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("FLOW_ABANDON", "flow", "runtime", "A flow was abandoned before completion.", "negative", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("FLOW_TRIGGERED", "flow", "runtime", "A flow trigger fired.", "neutral", {
    learningRelevant: true,
  }),

  define("AI_MEMORY_USED", "ai", "memory", "Stored memory influenced an experience.", "positive", {
    learningRelevant: true,
  }),
  define("AI_MEMORY_LEARNED", "memory", "memory", "The system derived or stored new memory.", "positive", {
    learningRelevant: true,
  }),
  define("AI_MEMORY_RECOMMENDED", "memory", "memory", "The system recommended a memory.", "neutral", {
    learningRelevant: true,
  }),
  define("AI_CREATIVE_ACCEPTED", "creative", "author", "Creative output was accepted.", "positive", {
    learningRelevant: true,
  }),
  define("AI_CREATIVE_REJECTED", "creative", "author", "Creative output was rejected.", "negative", {
    learningRelevant: true,
  }),
  define("AI_VARIATION_SELECTED", "creative", "author", "A creative variation was selected.", "positive", {
    learningRelevant: true,
  }),
  define("AI_SIGNIFICANCE_SHIFT", "ai", "runtime", "The system detected a significance change.", "neutral", {
    learningRelevant: true,
  }),
  define("AI_CINEMATIC_DECISION", "ai", "runtime", "The cinematic runtime selected a presentation.", "neutral", {
    learningRelevant: true,
  }),
  define("AI_DECISION", "ai", "runtime", "The system made a bounded runtime decision.", "neutral", {
    learningRelevant: true,
  }),

  define("MEMORY_APPLIED", "memory", "memory", "Stored memory was applied to an experience.", "positive", {
    learningRelevant: true,
  }),
  define("MEMORY_CREATED", "memory", "memory", "New durable memory was created.", "positive", {
    learningRelevant: true,
  }),
  define("MEMORY_UPDATED", "memory", "memory", "Existing durable memory was updated.", "positive", {
    learningRelevant: true,
  }),
  define("MEMORY_RECOMMENDATION_VIEWED", "memory", "memory", "A memory recommendation was viewed.", "neutral", {
    learningRelevant: true,
  }),
  define("MEMORY_RECOMMENDATION_SELECTED", "memory", "memory", "A memory recommendation was selected.", "positive", {
    learningRelevant: true,
  }),

  define("SPONSOR_IMPRESSION", "sponsor", "sponsor", "A sponsor placement was shown.", "neutral"),
  define("SPONSOR_INTERACTION", "sponsor", "sponsor", "A sponsor placement was interacted with.", "positive"),
  define("SPONSOR_DISMISSED", "sponsor", "sponsor", "A sponsor placement was dismissed.", "negative"),
  define("SPONSOR_CTA_CLICK", "sponsor", "sponsor", "A sponsor CTA was clicked.", "positive"),

  define("CTA_CLICK", "engagement", "player", "A primary experience CTA was clicked.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("REDIRECT", "engagement", "player", "An experience redirected to another destination.", "positive"),
  define("TEASER_VIEW", "engagement", "player", "A teaser experience was viewed.", "neutral"),
  define("WEBSITE_CLICK", "engagement", "player", "A website destination was clicked.", "positive"),
  define("SOCIAL_CLICK", "engagement", "player", "A social destination was clicked.", "positive"),
  define("EXPERIENCE_REPLAY", "engagement", "player", "An experience was replayed.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("EXPERIENCE_SHARED", "engagement", "player", "An experience was shared.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("EXPERIENCE_SAVED", "engagement", "player", "An experience was saved.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),

  define("PAYMENT_REQUIRED", "commerce", "commerce", "A payment was required to continue.", "neutral"),
  define("PAYMENT_STARTED", "commerce", "commerce", "A payment attempt started.", "neutral", {
    investorRelevant: true,
  }),
  define("PAYMENT_COMPLETED", "commerce", "commerce", "A payment completed.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("UNLOCK", "access", "commerce", "Access was unlocked.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("CLAIM_STARTED", "commerce", "commerce", "An asset claim started.", "neutral"),
  define("CLAIM_COMPLETED", "commerce", "commerce", "An asset claim completed.", "positive", {
    investorRelevant: true,
  }),

  define("GEO_MARK", "geo", "geo", "A geographic observation was recorded.", "neutral", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("CHECK_IN", "presence", "presence", "A presence check-in occurred.", "positive", {
    learningRelevant: true,
  }),
  define("CHECK_OUT", "presence", "presence", "A presence check-out occurred.", "neutral", {
    learningRelevant: true,
  }),
  define("PRESENCE_JOIN", "presence", "presence", "A participant joined a presence context.", "positive", {
    learningRelevant: true,
  }),
  define("PRESENCE_LEAVE", "presence", "presence", "A participant left a presence context.", "neutral", {
    learningRelevant: true,
  }),

  define("TICKET_CREATED", "ticketing", "ticketing", "An event ticket was created.", "positive", {
    investorRelevant: true,
  }),
  define("TICKET_VIEWED", "ticketing", "ticketing", "An event ticket was viewed.", "neutral"),
  define("TICKET_REDEEMED", "ticketing", "ticketing", "An event ticket was redeemed.", "positive", {
    learningRelevant: true,
    investorRelevant: true,
  }),
  define("TICKET_REJECTED", "ticketing", "ticketing", "An event ticket redemption was rejected.", "negative", {
    learningRelevant: true,
  }),

  define("MEDIA_PLAY", "media", "player", "Media playback started.", "neutral", {
    learningRelevant: true,
  }),
  define("MEDIA_COMPLETE", "media", "player", "Media playback completed.", "positive", {
    learningRelevant: true,
  }),
  define("MEDIA_REPLAY", "media", "player", "Media playback was replayed.", "positive", {
    learningRelevant: true,
  }),

  define("TIP_STARTED", "commerce", "commerce", "A tip interaction started.", "neutral"),
  define("TIP_COMPLETED", "commerce", "commerce", "A tip completed.", "positive", {
    investorRelevant: true,
  }),

  define("FLOW_POLICY_APPLIED", "access", "runtime", "A flow policy was applied.", "neutral"),
  define("ERROR", "system", "system", "A runtime or product error occurred.", "negative", {
    learningRelevant: true,
    customerVisible: false,
  }),

  define("AUTHOR_INPUT_ACCEPTED", "author", "author", "Explicit author evidence was accepted into QRE memory.", "positive", {
    learningRelevant: true,
    customerVisible: false,
    investorRelevant: true,
  }),
] as const;

export const ANALYTICS_EVENT_REGISTRY = Object.fromEntries(
  ANALYTICS_EVENT_DEFINITIONS.map((definition) => [
    definition.type,
    definition,
  ]),
) as {
  [K in AnalyticsEventType]: AnalyticsEventDefinition & { type: K };
};

export function getAnalyticsEventDefinition(
  type: AnalyticsEventType,
): AnalyticsEventDefinition {
  return ANALYTICS_EVENT_REGISTRY[type];
}
