/**
 * QRE MOVIE DIFFERENTIATION · CANONICAL DIVERSITY GATE
 *
 * Movie selection cannot bypass metamorphic cognition. Every candidate that
 * enters differentiation must carry the candidate-scoped AuthorMetamorphicRelationSet
 * sealed by the latent thesis layer.
 */
import type {
  AuthorMetamorphicRelationSet,
  LatentMovieCandidate,
} from "@qre/contracts";
import { assertAuthorMetamorphicRelationSet } from "./authorMetamorphicRelationSet.js";
import { classifyLens } from "./authorCharacterLensEngine.js";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));
const MIN_MATERIAL_DIVERSITY = 0.34;

type MetamorphicSemanticRealization = NonNullable<LatentMovieCandidate["storyThesis"]>["semanticRealization"] & {
  metamorphicRelationSet?: AuthorMetamorphicRelationSet;
};

type MetamorphicCandidate = LatentMovieCandidate & {
  metamorphicRelationSet: AuthorMetamorphicRelationSet;
};

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

function sealedSet(candidate: LatentMovieCandidate): AuthorMetamorphicRelationSet {
  const thesis = candidate.storyThesis as (LatentMovieCandidate["storyThesis"] & {
    metamorphicRelationSet?: AuthorMetamorphicRelationSet;
  }) | undefined;
  const set = thesis?.metamorphicRelationSet ??
    (thesis?.semanticRealization as MetamorphicSemanticRealization | undefined)?.metamorphicRelationSet;
  assertAuthorMetamorphicRelationSet(set);
  const source = new Set(candidate.trajectory.flatMap((step) => step.eventIds));
  if (set.sourceEventIds.some((id) => !source.has(id))) {
    throw new Error("AUTHOR METAMORPHIC PIPELINE SEALED: relation set escaped candidate event scope");
  }
  return set;
}

function sealCandidate(candidate: LatentMovieCandidate): MetamorphicCandidate {
  const set = sealedSet(candidate);
  Object.defineProperty(candidate, "metamorphicRelationSet", {
    value: set,
    enumerable: true,
    configurable: true,
    writable: false,
  });
  return candidate as MetamorphicCandidate;
}

function metamorphicPotential(candidate: LatentMovieCandidate): number {
  const set = sealedSet(candidate);
  const strongest = set.relations[0];
  if (!strongest) return 0;

  const coverage = clamp01(strongest.evidenceEventIds.length / Math.max(2, set.sourceEventIds.length));
  const relationStrength = clamp01(strongest.score);
  const confidence = clamp01(strongest.confidence);
  const turn = strongest.beforeEventIds.length > 0 && strongest.afterEventIds.length > 0 ? 1 : 0.35;
  return metric(relationStrength * 0.45 + confidence * 0.25 + turn * 0.22 + coverage * 0.08);
}

function postDiscoveryLensBias(candidate: LatentMovieCandidate, lens?: string): number {
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
      signal += (sealedSet(candidate).relations.length ? 1 : 0) * 0.15;
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

  return metric(signal / Math.max(1, weight));
}

export function movieCandidateDiversity(a: LatentMovieCandidate, b: LatentMovieCandidate): number {
  const evidenceSimilarity = jaccard(a.anchorEventIds, b.anchorEventIds);
  const relationSimilarity = jaccard(a.supportingRelationKinds, b.supportingRelationKinds);
  const trajectorySimilarity = jaccard(trajectorySignature(a), trajectorySignature(b));
  const payoffSimilarity = payoffSignature(a) === payoffSignature(b) ? 1 : 0;
  return metric(1 - (
    evidenceSimilarity * 0.36 +
    relationSimilarity * 0.22 +
    trajectorySimilarity * 0.32 +
    payoffSimilarity * 0.1
  ));
}

/**
 * Candidate differentiation is a hard metamorphic boundary. A missing or
 * malformed relation set is an architecture violation, not a low score.
 */
export function selectDistinctMovieCandidates(
  candidates: LatentMovieCandidate[],
  limit = 6,
  lens?: string,
): LatentMovieCandidate[] {
  const sealed = candidates.map(sealCandidate);
  const remaining = [...sealed];
  const selected: MetamorphicCandidate[] = [];

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
      const adjusted =
        candidate.score * 0.30 +
        metamorphic * 0.50 +
        diversity * 0.14 +
        lensBias * 0.06;

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
      metamorphicRelationSet: sealedSet(winner),
    });
  }

  return selected;
}

export function hasMaterialMovieDifference(a: LatentMovieCandidate, b: LatentMovieCandidate): boolean {
  return movieCandidateDiversity(a, b) >= MIN_MATERIAL_DIVERSITY;
}
