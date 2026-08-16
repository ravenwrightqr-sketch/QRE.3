/**
 * QRE MOVIE DIFFERENTIATION · CANONICAL DIVERSITY GATE
 *
 * Purpose: prevent multiple creative lenses from becoming the same movie with
 * different labels. A candidate is distinct only when its evidence, graph
 * relationships, trajectory operators, and payoff mechanism materially differ.
 *
 * TRUTH BOUNDARY:
 *   RealityGraph = source truth.
 *   LatentMovieCandidate = hypothesis.
 *   This module never creates facts; it only measures and selects hypotheses.
 *
 * Pipeline position:
 *   REALITY → CANDIDATES → DIFFERENTIATION → TRAJECTORY SEARCH → MOUTH
 */
import type { LatentMovieCandidate } from "@qre/contracts";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

function jaccard(a: string[], b: string[]): number {
  const aa = new Set(a);
  const bb = new Set(b);
  const union = new Set([...aa, ...bb]).size;
  if (!union) return 1;
  let intersection = 0;
  for (const item of aa) if (bb.has(item)) intersection += 1;
  return intersection / union;
}

function trajectorySignature(candidate: LatentMovieCandidate): string[] {
  return candidate.trajectory.map((step) => `${step.operation}:${step.eventIds.slice().sort().join("+")}`);
}

function payoffSignature(candidate: LatentMovieCandidate): string {
  const text = candidate.payoff.toLowerCase();
  if (/contrast|unexpected|absurd|reframe/.test(text)) return "contrast-reframe";
  if (/return|returning|changed.*meaning|context/.test(text)) return "recurrence-recontextualization";
  if (/relationship|connection|meaningful/.test(text)) return "relationship-meaning";
  if (/unsettling|ordinary.*strange|dread/.test(text)) return "ordinary-turned-strange";
  return text.replace(/\s+/g, " ").trim();
}

/** Measure how much a candidate differs from another candidate. 1 = very different. */
export function movieCandidateDiversity(a: LatentMovieCandidate, b: LatentMovieCandidate): number {
  const evidenceSimilarity = jaccard(a.anchorEventIds, b.anchorEventIds);
  const relationSimilarity = jaccard(a.supportingRelationKinds, b.supportingRelationKinds);
  const trajectorySimilarity = jaccard(trajectorySignature(a), trajectorySignature(b));
  const payoffSimilarity = payoffSignature(a) === payoffSignature(b) ? 1 : 0;
  const lensSimilarity = a.lens === b.lens ? 1 : 0;

  return metric(
    1 - (
      evidenceSimilarity * 0.34 +
      relationSimilarity * 0.2 +
      trajectorySimilarity * 0.3 +
      payoffSimilarity * 0.12 +
      lensSimilarity * 0.04
    ),
  );
}

/**
 * Greedy diversity gate. Score matters, but score alone is forbidden from
 * selecting six near-identical movies. Every later candidate pays a duplicate
 * penalty against the strongest already-selected overlap.
 */
export function selectDistinctMovieCandidates(candidates: LatentMovieCandidate[], limit = 6): LatentMovieCandidate[] {
  const remaining = [...candidates];
  const selected: LatentMovieCandidate[] = [];

  while (remaining.length && selected.length < Math.max(1, limit)) {
    let bestIndex = 0;
    let bestValue = -Infinity;

    remaining.forEach((candidate, index) => {
      const diversity = selected.length
        ? Math.min(...selected.map((prior) => movieCandidateDiversity(candidate, prior)))
        : 1;
      const adjusted = metric(candidate.score * 0.72 + diversity * 0.28);
      if (adjusted > bestValue) {
        bestValue = adjusted;
        bestIndex = index;
      }
    });

    const [winner] = remaining.splice(bestIndex, 1);
    if (!winner) break;
    selected.push({
      ...winner,
      score: metric(winner.score * 0.72 + (selected.length === 1 ? 0.28 : Math.min(...selected.slice(0, -1).map((prior) => movieCandidateDiversity(winner, prior))) * 0.28)),
    });
  }

  return selected;
}

/** Acceptance invariant: lenses cannot manufacture diversity by label alone. */
export function hasMaterialMovieDifference(a: LatentMovieCandidate, b: LatentMovieCandidate): boolean {
  return movieCandidateDiversity(a, b) >= 0.25;
}
