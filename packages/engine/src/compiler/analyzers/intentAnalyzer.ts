import type { ExperienceIntent } from "@qre/contracts";

type IntentRule = { intent: ExperienceIntent; signals: string[] };

/** Primitive lexical evidence. The Understanding Kernel owns interpretation. */
const intentRules: IntentRule[] = [
  { intent: "remember", signals: ["memory", "remember", "past", "history", "archive", "legacy", "childhood", "old photo", "timeline", "nostalgia", "tribute", "preserve", "forever"] },
  { intent: "celebrate", signals: ["birthday", "wedding", "anniversary", "celebrate", "party", "milestone", "ceremony", "event"] },
  { intent: "teach", signals: ["learn", "teach", "guide", "education", "explain", "tutorial", "course", "lesson", "how to", "show me"] },
  { intent: "sell", signals: ["buy", "sell", "shop", "product", "offer", "customer", "brand", "business", "store", "luxury", "watch brand"] },
  { intent: "discover", signals: ["explore", "discover", "secret", "hidden", "unknown", "quest", "adventure", "journey", "treasure hunt", "treasure", "mystery", "find"] },
  { intent: "reward", signals: ["reward", "loyalty", "exclusive", "unlock", "vip", "member", "prize", "treasure"] },
  { intent: "protect", signals: ["protect", "safety", "emergency", "lost", "missing", "secure", "rescue", "warning"] },
  { intent: "connect", signals: ["family", "friend", "community", "relationship", "together", "share", "people"] },
];

export function analyzeIntent(prompt: string): ExperienceIntent[] {
  const text = prompt.toLowerCase().trim();
  if (!text) return [];
  const scores = new Map<ExperienceIntent, number>();
  for (const rule of intentRules) {
    let score = 0;
    for (const signal of rule.signals) if (text.includes(signal)) score += signal.includes(" ") ? 2 : 1;
    if (score) scores.set(rule.intent, score);
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([intent]) => intent);
}
