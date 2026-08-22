import type { CognitiveExperiencePlan, CognitivePremise, CognitiveAuthorContext } from "@qre/contracts";

export type AuthorCreativeSafetyClass = "ordinary" | "memorial";

export type AuthorCreativeSafetyContext = {
  class: AuthorCreativeSafetyClass;
  confidence: number;
  evidence: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function semanticSignals(plan: CognitiveExperiencePlan | undefined, premise: CognitivePremise | undefined): string[] {
  const signals: string[] = [];
  if (!plan && !premise) return signals;

  if (plan?.direction === "ritual") signals.push("direction:ritual");
  if (plan?.memoryModel?.length) signals.push(...plan.memoryModel.map((value) => `memory:${clean(value)}`).filter(Boolean));
  if (plan?.emotionalIntent?.length) signals.push(...plan.emotionalIntent.map((value) => `emotion:${clean(value)}`).filter(Boolean));
  if (plan?.storyStructure?.length) signals.push(...plan.storyStructure.map((value) => `story:${clean(value)}`).filter(Boolean));
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

function scoreMemorialSemantics(signals: string[]): { score: number; evidence: string[] } {
  let score = 0;
  const evidence: string[] = [];
  const text = signals.join(" ").toLowerCase();

  const checks: Array<[RegExp, number, string]> = [
    [/direction:ritual/, 0.42, "cognitive direction is ritual"],
    /memory:(?:.*\b(?:remembrance|remembering|legacy|commemorative|commemoration|in memory)\b)/i,
    /emotion:(?:.*\b(?:grief|mourning|remembrance|loss|reflection|honor|tribute)\b)/i,
    /purpose:(?:.*\b(?:remember|honor|commemorate|memorial|tribute)\b)/i,
    /story:(?:.*\b(?:tribute|remembrance|memorial|reflection|legacy)\b)/i,
  ].map((item) => item) as Array<[RegExp, number, string]>;

  checks[1] = [/memory:(?:.*\b(?:remembrance|remembering|legacy|commemorative|commemoration|in memory)\b)/i, 0.26, "cognitive memory model signals remembrance" ];
  checks[2] = [/emotion:(?:.*\b(?:grief|mourning|remembrance|loss|reflection|honor|tribute)\b)/i, 0.2, "cognitive emotional intent signals grief/remembrance" ];
  checks[3] = [/purpose:(?:.*\b(?:remember|honor|commemorate|memorial|tribute)\b)/i, 0.24, "cognitive purpose signals remembrance/commemoration" ];
  checks[4] = [/story:(?:.*\b(?:tribute|remembrance|memorial|reflection|legacy)\b)/i, 0.18, "cognitive story structure signals remembrance" ];

  for (const [pattern, weight, reason] of checks) {
    if (pattern.test(text)) {
      score += weight;
      evidence.push(reason);
    }
  }

  return { score: Math.min(1, score), evidence };
}

export function classifyAuthorCreativeSafety(input: {
  cognitivePlan?: CognitiveExperiencePlan;
  premise?: CognitiveExperiencePlan["premise"];
}): AuthorCreativeSafetyContext {
  const signals = semanticSignals(input.cognitivePlan, input.premise);
  const scored = scoreMemorialSemantics(signals);
  if (scored.score >= 0.5) {
    return { class: "memorial", confidence: scored.score, evidence: scored.evidence };
  }
  return { class: "ordinary", confidence: Math.max(0.5, 1 - scored.score), evidence: scored.evidence };
}

export function isProtectedCreativeContext(context: CognitiveAuthorContext | null | undefined): boolean {
  return context?.creativeSafety?.class === "memorial";
}
