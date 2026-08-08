import type { ExperienceIntent } from "@qre/contracts";

type IntentRule = {
  intent: ExperienceIntent;
  signals: string[];
};

/**
 * Primitive lexical evidence only.
 * Interpretation and prioritisation belong to the Understanding Kernel.
 */
const intentRules: IntentRule[] = [
  { intent: "remember", signals: ["memory", "remember", "past", "history", "archive", "legacy", "childhood", "old photo", "timeline", "nostalgia", "tribute", "preserve", "forever"] },
  { intent: "celebrate", signals: ["birthday", "wedding", "anniversary", "celebrate", "party", "milestone", "ceremony", "event"] },
  { intent: "teach", signals: ["learn", "teach", "guide", "education", "explain", "tutorial", "course", "lesson", "how to", "show me"] },
  { intent: "sell", signals: ["buy", "sell", "shop", "product", "offer", "customer", "brand", "business", "store", "luxury", "watch brand"] },
  { intent: "discover", signals: ["explore", "discover", "secret", "hidden", "unknown", "quest", "adventure", "journey", "treasure hunt", "treasure", "mystery", "find"] },
  { intent: "reward", signals: ["reward", "loyalty", "exclusive", "unlock", "vip", "member", "prize", "treasure"] },
  { intent: "protect", signals: ["protect", "safety", "emergency", "lost", "missing", "secure", "rescue", "warning"] },
  { intent: "connect", signals: ["family", "friend", "community", "relationship", "together", "share", "people", "kids", "children"] },
];

export function analyzeIntent(prompt: string): ExperienceIntent[] {
  const text = prompt.toLowerCase().trim();
  if (!text) return [];

  const scores = new Map<ExperienceIntent, number>();
  for (const rule of intentRules) {
    let score = 0;
    for (const signal of rule.signals) {
      if (text.includes(signal)) score += signal.includes(" ") ? 2 : 1;
    }
    if (score > 0) scores.set(rule.intent, score);
  }

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([intent]) => intent);

  // A creation request without a recognizable semantic goal is intentionally
  // neutral. The kernel will infer the experience shape from the rest of the
  // prompt instead of pretending every unknown prompt means discovery.
  return ranked;
}
