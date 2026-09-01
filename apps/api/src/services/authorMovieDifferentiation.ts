/**
 * QRE MOVIE DIFFERENTIATION · CANONICAL DIVERSITY / COHERENCE GATE
 *
 * Prevents cosmetic movie duplicates and accidental backward trajectories.
 * This module never invents facts or chooses viewer prose.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));
const MIN_MATERIAL_DIVERSITY = 0.34;

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

function sourceOrderValid(graph: RealityGraph, candidate: LatentMovieCandidate): boolean {
  const positions = new Map(graph.events.map((event, index) => [event.id, index]));
  let last = -1;

  for (const step of candidate.trajectory) {
    const positionsInStep = step.eventIds
      .map((id) => positions.get(id))
      .filter((value): value is number => value !== undefined);
    if (!positionsInStep.length) continue;

    const minimum = Math.min(...positionsInStep);
    if (minimum < last) {
      /* Revisit is legitimate only when the movie explicitly declares it as
       * recurrence/reframe rather than accidentally traversing an older event. */
      const intentionalCallback = step.operation === "recur" || step.operation === "reframe";
      if (!intentionalCallback) return false;
    }

    const maximum = Math.max(...positionsInStep);
    last = Math.max(last, maximum);
  }
  return true;
}

export function movieCandidateDiversity(a: LatentMovieCandidate, b: LatentMovieCandidate): number {
  const evidenceSimilarity = jaccard(a.anchorEventIds, b.anchorEventIds);
  const relationSimilarity = jaccard(a.supportingRelationKinds, b.supportingRelationKinds);
  const trajectorySimilarity = jaccard(trajectorySignature(a), trajectorySignature(b));
  const payoffSimilarity = payoffSignature(a) === payoffSignature(b) ? 1 : 0;
  const lensSimilarity = a.lens === b.lens ? 1 : 0;

  return metric(1 - (
    evidenceSimilarity * 0.34 +
    relationSimilarity * 0.2 +
    trajectorySimilarity * 0.3 +
    payoffSimilarity * 0.12 +
    lensSimilarity * 0.04
  ));
}

export function selectDistinctMovieCandidates(
  candidates: LatentMovieCandidate[],
  limit = 6,
): LatentMovieCandidate[] {
  const remaining = [...candidates];
  const selected: LatentMovieCandidate[] = [];

  while (remaining.length && selected.length < Math.max(1, limit)) {
    let bestIndex = -1;
    let bestValue = -Infinity;

    remaining.forEach((candidate, index) => {
      const diversity = selected.length
        ? Math.min(...selected.map((prior) => movieCandidateDiversity(candidate, prior)))
        : 1;

      if (!sourceOrderValid((candidate as LatentMovieCandidate & { __graph?: RealityGraph }).__graph as RealityGraph ?? {
        evidence: [], events: [], relations: [], unresolvedTensions: [], recurringSignals: [], sensorySignals: [],
      }, candidate)) return;

      if (selected.length && diversity < MIN_MATERIAL_DIVERSITY) return;

      const adjusted = candidate.score * 0.72 + diversity * 0.28;
      if (adjusted > bestValue) {
        bestValue = adjusted;
        bestIndex = index;
      }
    });

    if (bestIndex < 0) break;

    const [winner] = remaining.splice(bestIndex, 1);
    if (!winner) break;
    const distinctiveness = selected.length
      ? Math.min(...selected.map((prior) => movieCandidateDiversity(winner, prior)))
      : 1;
    selected.push({ ...winner, distinctiveness: metric(distinctiveness) });
  }

  return selected;
}

export function hasMaterialMovieDifference(a: LatentMovieCandidate, b: LatentMovieCandidate): boolean {
  return movieCandidateDiversity(a, b) >= MIN_MATERIAL_DIVERSITY;
}
