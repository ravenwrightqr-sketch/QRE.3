import type { CognitiveAuthorContext, CognitiveExperiencePlan, CognitivePremise } from "@qre/contracts";

export type AuthorCreativeSafetyClass = "ordinary" | "memorial";

export type AuthorCreativeSafetyContext = {
  class: AuthorCreativeSafetyClass;
  confidence: number;
  evidence: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const SEMANTIC_PATTERNS: Array<{ pattern: RegExp; weight: number; reason: string }> = [
  { pattern: /^direction:ritual$/i, weight: 0.42, reason: "cognitive direction is ritual" },
  { pattern: /\b(?:remembrance|remembering|legacy|commemorative|commemoration|in memory)\b/i, weight: 0.26, reason: "cognitive memory model signals remembrance" },
  { pattern: /\b(?:grief|mourning|remembrance|loss|reflection|honor|tribute)\b/i, weight: 0.2, reason: "cognitive emotional intent signals grief/remembrance" },
  { pattern: /\b(?:remember|honor|commemorate|memorial|tribute)\b/i, weight: 0.24, reason: "cognitive purpose signals remembrance/commemoration" },
  { pattern: /\b(?:tribute|remembrance|memorial|reflection|legacy)\b/i, weight: 0.18, reason: "cognitive story structure signals remembrance" },
];

const BACKSTOP_MEMORIAL = /\b(?:memorial|funeral|tribute|grief|bereavement|passed away|death|deceased|eulogy|in memory of|remembering)\b/i;

function semanticSignals(plan: CognitiveExperiencePlan | undefined, premise: CognitivePremise | undefined): string[] {
  const signals: string[] = [];
  if (plan?.direction) signals.push(`direction:${clean(plan.direction)}`);
  signals.push(...(plan?.memoryModel ?? []).map((value) => `memory:${clean(value)}`).filter(Boolean));
  signals.push(...(plan?.emotionalIntent ?? []).map((value) => `emotion:${clean(value)}`).filter(Boolean));
  signals.push(...(plan?.storyStructure ?? []).map((value) => `story:${clean(value)}`).filter(Boolean));
  if (plan?.purpose) signals.push(`purpose:${clean(plan.purpose)}`);

  for (const slot of premise?.slots ?? []) {
    const values = slot.values.map(clean).filter(Boolean);
    if (values.length) signals.push(`premise:${slot.role}:${values.join(" | ")}`);
  }
  for (const relation of premise?.relations ?? []) {
    if (clean(relation.relation)) signals.push(`relation:${relation.from}->${relation.to}:${clean(relation.relation)}`);
  }
  return signals;
}

export function classifyAuthorCreativeSafety(input: {
  cognitivePlan?: CognitiveExperiencePlan;
  premise?: CognitiveExperiencePlan["premise"];
  backstopText?: string[];
}): AuthorCreativeSafetyContext {
  const signals = semanticSignals(input.cognitivePlan, input.premise);
  const text = signals.join(" ");
  let score = 0;
  const evidence: string[] = [];

  for (const item of SEMANTIC_PATTERNS) {
    if (item.pattern.test(item.pattern.source.startsWith("^") ? clean(input.cognitivePlan?.direction) : text)) {
      score += item.weight;
      evidence.push(item.reason);
    }
  }

  if (score < 0.5 && (input.backstopText ?? []).some((value) => BACKSTOP_MEMORIAL.test(value))) {
    score = 0.5;
    evidence.push("emergency memorial terminology backstop");
  }

  if (score >= 0.5) return { class: "memorial", confidence: Math.min(1, score), evidence };
  return { class: "ordinary", confidence: Math.max(0.5, 1 - score), evidence };
}

export function isProtectedCreativeContext(context: CognitiveAuthorContext | null | undefined): boolean {
  return context?.creativeSafety?.class === "memorial";
}
