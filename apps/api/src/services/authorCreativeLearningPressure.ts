import type { CognitiveAuthorContext } from "@qre/contracts";

const SUPPORTED_LENSES = [
  "noir",
  "heist",
  "courtroom",
  "spy",
  "horror",
  "deadpan",
  "absurd",
  "romance",
  "military",
  "mockumentary",
  "game",
] as const;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const MEMORIAL_TERMS = /\b(?:memorial|funeral|tribute|grief|bereavement|passed away|death|deceased|eulogy|in memory of|remembering)\b/i;

function lensHits(values: string[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const value of values) {
    const text = clean(value);
    for (const lens of SUPPORTED_LENSES) {
      if (new RegExp(`\\b${lens}\\b`, "i").test(text)) {
        scores.set(lens, (scores.get(lens) ?? 0) + 1);
      }
    }
  }
  return scores;
}

export function isMemorialContext(values: Array<string | undefined>): boolean {
  return MEMORIAL_TERMS.test(values.filter(Boolean).join(" "));
}

/**
 * Compatibility selector for the current author pipeline.
 *
 * This is intentionally bounded to learned evidence. It never treats a rejected
 * or avoided lens as a winner, and memorial contexts are prohibited from
 * supplying a learned genre lens at all.
 */
export function resolveLearnedCreativeLens(
  context: CognitiveAuthorContext | null | undefined,
): string | undefined {
  if (isMemorialContext([
    ...(context?.creativeLearning?.accepted ?? []),
    ...(context?.creativeLearning?.preferences ?? []),
    ...(context?.creativeLearning?.successfulLenses ?? []),
  ])) return undefined;

  const learning = context?.creativeLearning;
  if (!learning) return undefined;

  const positive = lensHits([
    ...(learning.successfulLenses ?? []),
    ...(learning.accepted ?? []),
    ...(learning.preferences ?? []),
  ]);
  const negative = lensHits([
    ...(learning.rejected ?? []),
    ...(learning.avoidedPatterns ?? []),
  ]);

  let best: { lens: string; score: number } | undefined;
  for (const lens of SUPPORTED_LENSES) {
    const score =
      (positive.get(lens) ?? 0) * 3 -
      (negative.get(lens) ?? 0) * 3;
    if (score <= 0) continue;
    if (!best || score > best.score) best = { lens, score };
  }

  return best?.lens;
}

/**
 * Returns bounded soft pressure for the existing lens competition.
 *
 * Existing cognition remains the decision owner. This helper only reports a
 * small learned preference delta; it never creates a new lens.
 */
export function learnedLensPressure(
  context: CognitiveAuthorContext | null | undefined,
  lensId: string,
): number {
  const lens = clean(lensId);
  if (!lens || !SUPPORTED_LENSES.includes(lens as (typeof SUPPORTED_LENSES)[number])) return 0;

  const learning = context?.creativeLearning;
  if (!learning) return 0;

  const positive = lensHits([
    ...(learning.successfulLenses ?? []),
    ...(learning.accepted ?? []),
    ...(learning.preferences ?? []),
  ]).get(lens) ?? 0;
  const negative = lensHits([
    ...(learning.rejected ?? []),
    ...(learning.avoidedPatterns ?? []),
  ]).get(lens) ?? 0;

  return Math.max(-0.12, Math.min(0.12, positive * 0.04 - negative * 0.05));
}
