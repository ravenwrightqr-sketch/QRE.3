/**
 * =====================================================
 * QRE EXPERIENCE INTENT ANALYZER
 * =====================================================
 *
 * Responsibility:
 *
 * Discover canonical semantic intent primitives
 * from arbitrary human creative expression.
 *
 * Input:
 *   Human creative prompt
 *
 * Output:
 *   ExperienceIntent[]
 *
 * Important:
 *
 * ExperienceIntent is a canonical semantic vocabulary.
 * It is NOT the complete representation of human intent.
 *
 * Unknown intent is valid.
 *
 * The analyzer must NEVER invent "discover" simply
 * because it failed to recognize the prompt.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */

import type {
  ExperienceIntent,
} from "@qre/contracts";

type IntentRule = {
  intent: ExperienceIntent;
  signals: string[];
  weight: number;
};

const intentRules: IntentRule[] = [
  {
    intent: "remember",
    weight: 1,
    signals: [
      "memory",
      "remember",
      "memories",
      "past",
      "history",
      "archive",
      "legacy",
      "childhood",
      "old photo",
      "old photographs",
      "timeline",
      "nostalgia",
      "nostalgic",
      "tribute",
      "remembrance",
      "preserve",
      "preservation",
      "heritage",
      "passed down",
      "generations",
    ],
  },

  {
    intent: "celebrate",
    weight: 1,
    signals: [
      "birthday",
      "wedding",
      "anniversary",
      "celebrate",
      "celebration",
      "party",
      "milestone",
      "ceremony",
      "event",
      "commemorate",
      "honor",
    ],
  },

  {
    intent: "serve",
    weight: 1,
    signals: [
      "service",
      "appointment",
      "booking",
      "repair",
      "groom",
      "grooming",
      "clean",
      "cleaning",
      "care",
      "consultation",
      "therapy",
      "treatment",
      "maintenance",
      "inspection",
      "service receipt",
      "invoice",
      "customer service",
    ],
  },

  {
    intent: "teach",
    weight: 1,
    signals: [
      "learn",
      "teach",
      "guide",
      "education",
      "educational",
      "explain",
      "tutorial",
      "course",
      "lesson",
      "training",
      "understand",
      "understanding",
      "show someone how",
    ],
  },

  {
    intent: "sell",
    weight: 1,
    signals: [
      "buy",
      "sell",
      "shop",
      "product",
      "offer",
      "customer",
      "brand",
      "business",
      "store",
      "purchase",
      "promotion",
      "marketing",
    ],
  },

  {
    intent: "discover",
    weight: 1,
    signals: [
      "explore",
      "discover",
      "secret",
      "hidden",
      "unknown",
      "quest",
      "adventure",
      "journey",
      "reveal",
      "uncover",
      "find out",
      "curious",
      "curiosity",
    ],
  },

  {
    intent: "reward",
    weight: 1,
    signals: [
      "reward",
      "loyalty",
      "exclusive",
      "unlock",
      "vip",
      "member",
      "membership",
      "bonus",
      "prize",
      "perk",
    ],
  },

  {
    intent: "protect",
    weight: 1,
    signals: [
      "protect",
      "protection",
      "safety",
      "emergency",
      "lost",
      "medical",
      "secure",
      "security",
      "warning",
      "alert",
    ],
  },

  {
    intent: "connect",
    weight: 1,
    signals: [
      "family",
      "friend",
      "friends",
      "community",
      "relationship",
      "together",
      "share",
      "sharing",
      "people",
      "belong",
      "belonging",
      "connection",
      "connect",
    ],
  },
];

/**
 * Normalize prompt text without destroying the
 * original human expression.
 */
function normalizePrompt(
  prompt: string,
): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Discover canonical semantic primitives.
 *
 * This function intentionally returns [] when there
 * is insufficient evidence.
 *
 * It does NOT manufacture a fallback intent.
 */
export function analyzeIntent(
  prompt: string,
): ExperienceIntent[] {
  const text =
    normalizePrompt(prompt);

  if (!text) {
    return [];
  }

  const scores =
    new Map<
      ExperienceIntent,
      number
    >();

  for (const rule of intentRules) {
    let score = 0;

    for (const signal of rule.signals) {
      if (text.includes(signal)) {
        score += rule.weight;
      }
    }

    if (score > 0) {
      scores.set(
        rule.intent,
        score,
      );
    }
  }

  return [
    ...scores.entries(),
  ]
    .sort(
      (a, b) =>
        b[1] - a[1],
    )
    .map(
      ([intent]) =>
        intent,
    );
}

/**
 * Preserve the human's actual intention rather than
 * collapsing it into the canonical vocabulary.
 */
export function analyzeHumanIntent(
  prompt: string,
) {
  const expression =
    prompt.trim();

  if (!expression) {
    return {
      expression: "",
      motivations: [],
      desiredOutcome: [],
      evidence: [],
      unresolved: [],
    };
  }

  return {
    expression,

    /**
     * These remain open until later cognitive layers
     * have enough evidence to derive them.
     */
    motivations: [],

    desiredOutcome: [],

    /**
     * The prompt itself is the primary evidence.
     */
    evidence: [expression],

    unresolved: [],
  };
}