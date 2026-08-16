import type { EmotionUnderstanding } from "../models/understandingTypes.js";

type EmotionRule = { emotion: string; signals: string[]; weight?: number };

const emotionSignals: EmotionRule[] = [
  { emotion: "nostalgia", signals: ["memory", "past", "childhood", "legacy", "remember", "history", "old", "preserve"] },
  { emotion: "wonder", signals: ["magic", "amazing", "universe", "dream", "discover", "secret", "mystery", "unknown", "treasure", "quest"] },
  { emotion: "love", signals: ["love", "wedding", "family", "relationship", "together", "partner"] },
  { emotion: "joy", signals: ["party", "birthday", "celebrate", "fun", "happy", "kids", "children"] },
  { emotion: "trust", signals: ["brand", "business", "customer", "safe", "professional", "luxury", "quality"] },
  { emotion: "excitement", signals: ["vip", "exclusive", "event", "concert", "festival", "launch", "hunt", "quest", "game", "adventure"] },
  { emotion: "fear", signals: ["danger", "lost", "missing", "emergency", "dark", "warning", "rescue"] },
  { emotion: "curiosity", signals: ["how", "why", "learn", "explore", "find", "understand", "mysterious"] },
];

export function analyzeEmotion(prompt: string): EmotionUnderstanding {
  const text = prompt.toLowerCase();
  const scores = new Map<string, number>();

  for (const rule of emotionSignals) {
    const score = rule.signals.reduce((total, signal) => total + (text.includes(signal) ? 1 : 0), 0);
    if (score) scores.set(rule.emotion, score);
  }

  const emotions = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([emotion]) => emotion);

  const resolved = emotions.length ? emotions : ["curiosity"];
  const intensity = Math.min(1, Math.max(0.2, [...scores.values()].reduce((a, b) => a + b, 0) / 8));

  return {
    emotions: resolved,
    primary: resolved[0],
    atmosphere: resolved,
    intensity,
  };
}
