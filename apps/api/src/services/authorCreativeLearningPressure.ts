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

/**
 * Returns bounded soft pressure for the existing lens competition.
 *
 * This is deliberately not a lens selector. Existing cognition still decides
 * whether the lens fits the supplied reality; this helper only moves the
 * candidate score slightly based on learned evidence.
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
