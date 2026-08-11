import type {
  CognitiveEvidence,
  CognitivePremise,
  CognitivePremiseRole,
  ExperienceHypothesisKind,
} from "@qre/contracts";

/**
 * Attention pressure is the creative selection layer between conserved
 * evidence and presentation. It never invents a new world fact. It selects
 * the most specific, relationally useful evidence already present in the
 * premise and asks realization to make that evidence matter.
 */

export type AttentionPressure = {
  value: string;
  role: CognitivePremiseRole;
  confidence: number;
  salience: number;
  score: number;
  evidence: CognitiveEvidence[];
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const ROLE_WEIGHT: Partial<Record<CognitivePremiseRole, number>> = {
  transformation: 1,
  constraint: 0.98,
  outcome: 0.96,
  event: 0.94,
  artifact: 0.92,
  place: 0.9,
  participants: 0.84,
  social: 0.84,
  temporal: 0.8,
  medium: 0.76,
  subject: 0.52,
  emotion: 0.48,
  affordance: 0.44,
};

function specificity(value: string): number {
  const text = lower(value);
  if (!text) return 0;

  const words = text.split(/\s+/).filter(Boolean);
  const lexical = Math.min(0.42, words.length * 0.055);
  const punctuation = /[,:;"“”'()/-]/.test(value) ? 0.08 : 0;
  const numeric = /\d/.test(value) ? 0.1 : 0;
  const temporal = /\b(?:today|tonight|tomorrow|later|again|before|after|first|last|next|years?|hours?|minutes?)\b/i.test(value)
    ? 0.08
    : 0;

  return clamp(0.18 + lexical + punctuation + numeric + temporal);
}

function contrast(value: string): number {
  const text = lower(value);
  if (/\b(?:not|never|without|avoid|don't|do not|no|instead|only|except|but)\b/.test(text)) return 0.22;
  return 0;
}

function relationalValue(
  premise: CognitivePremise,
  role: CognitivePremiseRole,
  value: string,
): number {
  return clamp(
    premise.relations.reduce((score, relation) => {
      const touchesRole = relation.from === role || relation.to === role;
      if (!touchesRole) return score;
      const touchesValue = relation.evidence.some((item) =>
        lower(item.detail).includes(lower(value)),
      );
      return score + (touchesValue ? 0.16 : 0.07);
    }, 0),
  );
}

function candidateScore(
  premise: CognitivePremise,
  role: CognitivePremiseRole,
  value: string,
  confidence: number,
  salience: number,
): number {
  return clamp(
    confidence * 0.28 +
      salience * 0.2 +
      (ROLE_WEIGHT[role] ?? 0.55) * 0.22 +
      specificity(value) * 0.16 +
      contrast(value) +
      relationalValue(premise, role, value) * 0.18,
  );
}

function candidateEvidence(
  role: CognitivePremiseRole,
  value: string,
  confidence: number,
): CognitiveEvidence {
  return {
    source: "prompt",
    detail: `attention candidate preserved from ${role} evidence: ${value}`,
    confidence,
  };
}

/**
 * Select one or two concrete attention anchors. Two anchors are allowed when
 * their scores are close enough to create a relationship rather than a random
 * pile of details.
 */
export function deriveAttentionPressure(
  premise: CognitivePremise | undefined,
  direction: ExperienceHypothesisKind,
): AttentionPressure[] {
  if (!premise) return [];

  const candidates: AttentionPressure[] = [];

  for (const slot of premise.slots) {
    for (const value of unique(slot.values)) {
      if (!value || slot.status === "unknown" || slot.confidence < 0.7) continue;

      const score = candidateScore(
        premise,
        slot.role,
        value,
        slot.confidence,
        slot.salience,
      );

      candidates.push({
        value,
        role: slot.role,
        confidence: slot.confidence,
        salience: slot.salience,
        score,
        evidence: [candidateEvidence(slot.role, value, slot.confidence)],
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.salience - a.salience);

  const selected = candidates.slice(0, 2);
  if (!selected.length) return [];

  // A utility interaction should stay concrete and useful rather than being
  // forced into theatrical pressure. Other directions can carry a stronger
  // attention relationship when the evidence supports it.
  if (direction === "utility") return selected.slice(0, 1);

  return selected;
}

export function attentionSummary(pressure: AttentionPressure[]): string {
  return pressure.map((item) => `${item.role}: ${item.value}`).join(" + ");
}
