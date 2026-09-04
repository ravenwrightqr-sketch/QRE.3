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
 * PIPELINE POSITION:
 *   REALITY → CANDIDATES → METAMORPHIC PRIORITY → DIFFERENTIATION → VIEWER RERANK → MOUTH
 *
 * The metamorphic semantic turn is now a first-class movie-selection signal.
 * It is not a post-hoc explanation attached after a movie has already won.
 */
import type { LatentMovieCandidate } from "@qre/contracts";
import { classifyLens } from "./authorCharacterLensEngine.js";

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

/**
 * Metamorphic potential is derived only from semantic structure already
 * discovered by canonical cognition. This score does not inspect raw facts
 * to create a new interpretation and cannot authorize new reality.
 *
 * Priority law:
 *   earned semantic transformation > generic narrative quality
 *
 * A candidate with an actual graph-backed semantic realization should therefore
 * outrank a merely interesting candidate when diversity is otherwise comparable.
 */
function metamorphicPotential(candidate: LatentMovieCandidate): number {
  const realization = candidate.storyThesis?.semanticRealization;
  if (!realization) return 0;

  const evidence = new Set(realization.evidenceEventIds ?? []);
  const before = new Set(realization.beforeEventIds ?? []);
  const after = new Set(realization.afterEventIds ?? []);
  const hasTurn = Boolean(
    realization.before && realization.after &&
    (before.size > 0 || after.size > 0) &&
    evidence.size >= 2,
  );
  const confidence = clamp01(realization.confidence ?? 0);
  const observerStrength = candidate.storyThesis?.observerExperience
    ? 0.08
    : 0;
  const mechanismStrength = realization.mechanism === "continuation"
    ? 0.55
    : 1;

  return metric(
    (hasTurn ? 0.55 : 0.18) * mechanismStrength +
    confidence * 0.37 +
    observerStrength,
  );
}

/**
 * Lens influence is deliberately late.
 *
 * This score can only observe semantic structure that universal discovery has
 * already produced. It never reads raw facts to invent a candidate and never
 * changes candidate evidence or trajectory.
 */
function postDiscoveryLensBias(
  candidate: LatentMovieCandidate,
  lens?: string,
): number {
  const lensName = String(lens ?? "NONE").trim();
  if (!lensName || lensName.toLowerCase() === "none") return 0.5;

  const profile = classifyLens(lensName);
  const operations = candidate.trajectory.map((step) => step.operation);
  const relations = new Set(candidate.supportingRelationKinds);
  let signal = 0.5;
  let weight = 1;

  for (const preference of profile.realizationPreferences) {
    const normalized = preference.toLowerCase();
    if (normalized.includes("callback")) {
      signal += candidate.callbackPotential * 0.2;
      weight += 0.2;
    } else if (normalized.includes("compression")) {
      signal += candidate.compressionPotential * 0.2;
      weight += 0.2;
    } else if (normalized.includes("consequence")) {
      signal += candidate.consequencePotential * 0.2;
      weight += 0.2;
    } else if (normalized.includes("contrast")) {
      signal += (operations.includes("contrast") || relations.has("contrasts") ? 1 : 0) * 0.2;
      weight += 0.2;
    } else if (normalized.includes("recontextualization")) {
      signal += (operations.includes("reframe") || relations.has("recontextualizes") ? 1 : 0) * 0.2;
      weight += 0.2;
    } else if (normalized.includes("reversal")) {
      signal += (operations.includes("contrast") || operations.includes("reframe") ? 1 : 0) * 0.15;
      weight += 0.15;
    } else if (normalized.includes("double_meaning")) {
      signal += (candidate.storyThesis?.semanticTurn ? 1 : 0) * 0.15;
      weight += 0.15;
    } else if (normalized.includes("implication")) {
      signal += candidate.uncertainty * 0.15 + candidate.attentionPotential * 0.05;
      weight += 0.2;
    } else if (normalized.includes("understatement")) {
      signal += (1 - candidate.repetitionRisk) * 0.1;
      weight += 0.1;
    } else if (normalized.includes("status_inversion")) {
      signal += (relations.has("contrasts") || relations.has("changes") || relations.has("recontextualizes") ? 1 : 0) * 0.15;
      weight += 0.15;
    }
  }

  const thesisRelation = String(candidate.storyThesis?.relationKind ?? "").toLowerCase();
  if (
    thesisRelation &&
    profile.realizationPreferences.some((preference) =>
      preference.toLowerCase().includes(thesisRelation),
    )
  ) {
    signal += 0.1;
    weight += 0.1;
  }

  return metric(signal / Math.max(1, weight));
}

export function movieCandidateDiversity(a: LatentMovieCandidate, b: LatentMovieCandidate): number {
  const evidenceSimilarity = jaccard(a.anchorEventIds, b.anchorEventIds);
  const relationSimilarity = jaccard(a.supportingRelationKinds, b.supportingRelationKinds);
  const trajectorySimilarity = jaccard(trajectorySignature(a), trajectorySignature(b));
  const payoffSimilarity = payoffSignature(a) === payoffSignature(b) ? 1 : 0;

  return metric(
    1 - (
      evidenceSimilarity * 0.36 +
      relationSimilarity * 0.22 +
      trajectorySimilarity * 0.32 +
      payoffSimilarity * 0.1
    ),
  );
}

/**
 * Lens is admitted only after candidate discovery. The hard diversity gate is
 * still lens-blind; lens bias only breaks ties/preferences among candidates that
 * have already survived material-diversity checks.
 *
 * Metamorphic priority is intentionally stronger than lens preference. A lens
 * may determine treatment, but it must not beat an earned semantic transformation
 * merely because its label happens to score well against that lens.
 */
export function selectDistinctMovieCandidates(
  candidates: LatentMovieCandidate[],
  limit = 6,
  lens?: string,
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

      if (selected.length && diversity < MIN_MATERIAL_DIVERSITY) return;

      const metamorphic = metamorphicPotential(candidate);
      const lensBias = postDiscoveryLensBias(candidate, lens);

      // Metamorphic reasoning is the dominant semantic signal. Generic movie
      // score remains important for quality; diversity keeps the candidate set
      // genuinely different; lens remains downstream preference only.
      const adjusted =
        candidate.score * 0.32 +
        metamorphic * 0.44 +
        diversity * 0.16 +
        lensBias * 0.08;

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
    selected.push({
      ...winner,
      lens: lens?.trim() || "NONE",
      distinctiveness: metric(distinctiveness),
    });
  }

  return selected;
}

/** Acceptance invariant: lenses cannot manufacture diversity by label alone. */
export function hasMaterialMovieDifference(a: LatentMovieCandidate, b: LatentMovieCandidate): boolean {
  return movieCandidateDiversity(a, b) >= MIN_MATERIAL_DIVERSITY;
}
