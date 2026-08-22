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

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

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
 * Converts already-observed creative learning into selection pressure for the
 * existing author lens competition. It does not invent a new lens engine and
 * never overrides an explicit non-neutral user lens request.
 */
export function resolveLearnedCreativeLens(
  context: CognitiveAuthorContext | null | undefined,
): string | undefined {
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
