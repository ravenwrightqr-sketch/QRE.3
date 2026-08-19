/**
 * QRE MOUTH SEQUENCE BEAM SEARCH · DETERMINISTIC EDITOR
 *
 * The beam never invents meaning. It selects among candidates produced by the
 * canonical Mouth scorer and grounded fallback. Establishment and payoff beats
 * have distinct semantic contracts from middle transition beats.
 */

import type { MouthCandidate } from "./authorMouthCandidateSearch.js";

export type MouthCandidatePool = {
  order: number;
  candidates: MouthCandidate[];
};

export type MouthSequencePath = {
  candidates: MouthCandidate[];
  texts: string[];
  score: number;
};

export type MouthBeamOptions = {
  width?: number;
  candidatesPerBeat?: number;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

function tokenSet(text: string): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(1, left.size);
}

function isHook(candidate: MouthCandidate): boolean {
  return candidate.reasons.includes("hook-scored-as-establishment");
}

function isEndpoint(candidate: MouthCandidate): boolean {
  return candidate.endpointExactness === 1 &&
    !candidate.reasons.includes("non-exact-payoff");
}

function hardFailure(candidate: MouthCandidate): boolean {
  return candidate.reasons.some((reason) =>
    new Set([
      "weak-grounding",
      "weak-meaning-execution",
      "weak-meaning-transition",
      "weak-obligation-coverage",
      "weak-relation-contract",
      "keyword-assembly",
      "source-restatement",
      "forbidden-slot-move",
      "non-exact-payoff",
      "high-invention-risk",
      "analytic-realization-language",
      "question-leak",
    ]).has(reason),
  );
}

function semanticallyEligible(candidate: MouthCandidate): boolean {
  // Exact approved endpoint is sovereign.
  if (isEndpoint(candidate)) {
    return candidate.groundingScore >= 0.42 && candidate.inventionRisk <= 0.45;
  }

  // Hooks/establishments need grounding, not a middle-beat transition score.
  if (isHook(candidate)) {
    return (
      candidate.groundingScore >= 0.42 &&
      candidate.inventionRisk <= 0.45 &&
      candidate.forbiddenMoveRisk <= 0.45 &&
      candidate.collageRisk <= 0.45 &&
      !hardFailure(candidate)
    );
  }

  return (
    candidate.groundingScore >= 0.42 &&
    candidate.meaningScore >= 0.4 &&
    candidate.transitionScore >= 0.4 &&
    candidate.obligationCoverage >= 0.4 &&
    candidate.relationContractScore >= 0.4 &&
    candidate.inventionRisk <= 0.45 &&
    candidate.collageRisk <= 0.45 &&
    candidate.forbiddenMoveRisk <= 0.45 &&
    !hardFailure(candidate)
  );
}

function candidateTransition(previous: MouthCandidate, current: MouthCandidate): number {
  const sharedEvents = previous.supportedEventIds.filter((id) =>
    current.supportedEventIds.includes(id),
  ).length;
  const newEvents = current.supportedEventIds.filter((id) =>
    !previous.supportedEventIds.includes(id),
  ).length;
  const sharedRelations = previous.supportedRelationPairs.filter((pair) =>
    current.supportedRelationPairs.includes(pair),
  ).length;
  const lexical = metric(overlap(tokenSet(previous.text), tokenSet(current.text)));
  const semantic = metric(
    Math.min(1,
      Math.max(previous.meaningScore, current.meaningScore) * 0.45 +
      Math.max(previous.transitionScore, current.transitionScore) * 0.55),
  );

  return metric(
    Math.min(sharedEvents, 2) * 0.06 +
    Math.min(newEvents, 2) * 0.08 +
    Math.min(sharedRelations, 2) * 0.14 +
    lexical * 0.04 +
    semantic * 0.68,
  );
}

function repeatedEvidencePenalty(path: MouthCandidate[], candidate: MouthCandidate): number {
  const priorIds = new Set(path.flatMap((item) => item.supportedEventIds));
  if (!candidate.supportedEventIds.length) return 0.08;
  const repeated = candidate.supportedEventIds.filter((id) => priorIds.has(id)).length;
  return metric(repeated / Math.max(1, candidate.supportedEventIds.length));
}

function intrinsic(candidate: MouthCandidate): number {
  if (isEndpoint(candidate)) return metric(0.94 + candidate.groundingScore * 0.06);
  if (isHook(candidate)) {
    return metric(
      candidate.groundingScore * 0.6 +
      candidate.compressionScore * 0.15 +
      candidate.noveltyScore * 0.1 +
      candidate.meaningScore * 0.15,
    );
  }

  const semantic = metric(
    candidate.meaningScore * 0.3 +
    candidate.transitionScore * 0.3 +
    candidate.obligationCoverage * 0.2 +
    candidate.relationContractScore * 0.2,
  );
  const quality = metric(
    candidate.groundingScore * 0.32 +
    semantic * 0.4 +
    candidate.compressionScore * 0.12 +
    candidate.noveltyScore * 0.08 +
    candidate.cohesionScore * 0.08,
  );
  const risk =
    candidate.inventionRisk * 0.4 +
    candidate.collageRisk * 0.25 +
    candidate.forbiddenMoveRisk * 0.35 +
    candidate.repetitionRisk * 0.15;
  return metric(quality - risk * 0.3);
}

function endpointDominance(path: MouthCandidate[], candidate: MouthCandidate): number {
  if (!isEndpoint(candidate)) return 0;
  return path.some(isEndpoint) ? 0.02 : 0.28;
}

function pathScore(path: MouthSequencePath, candidate: MouthCandidate): number {
  const previous = path.candidates[path.candidates.length - 1];
  const transition = previous
    ? candidateTransition(previous, candidate)
    : isHook(candidate)
      ? candidate.groundingScore
      : metric(
          candidate.meaningScore * 0.35 +
          candidate.transitionScore * 0.35 +
          candidate.obligationCoverage * 0.15 +
          candidate.relationContractScore * 0.15,
        );

  const repetition = repeatedEvidencePenalty(path.candidates, candidate);
  const newEvidence = new Set(path.candidates.flatMap((item) => item.supportedEventIds));
  const evidenceGain = metric(
    Math.min(
      candidate.supportedEventIds.filter((id) => !newEvidence.has(id)).length,
      3,
    ) * 0.07,
  );

  return (
    path.score +
    intrinsic(candidate) * 0.48 +
    transition * 0.2 +
    evidenceGain +
    endpointDominance(path.candidates, candidate) -
    repetition * 0.05
  );
}

function signature(path: MouthCandidate[]): string {
  return path.map((candidate) => clean(candidate.text).toLowerCase()).join("|");
}

function poolCandidates(pool: MouthCandidatePool, perBeat: number): MouthCandidate[] {
  const ranked = [...pool.candidates].sort((a, b) => b.score - a.score);
  const valid = ranked.filter(semanticallyEligible);
  return (valid.length ? valid : ranked).slice(0, perBeat);
}

function isCompleteEndpointPath(path: MouthSequencePath): boolean {
  const last = path.candidates[path.candidates.length - 1];
  return Boolean(last && isEndpoint(last));
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const width = Math.max(1, Math.min(options.width ?? 8, 32));
  const perBeat = Math.max(1, Math.min(options.candidatesPerBeat ?? 8, 16));
  const ordered = [...pools].sort((a, b) => a.order - b.order);

  let beam: MouthSequencePath[] = [{ candidates: [], texts: [], score: 0 }];

  for (const pool of ordered) {
    const candidates = poolCandidates(pool, perBeat);
    if (!candidates.length) {
      return { candidates: [], texts: [], score: 0 };
    }

    const expanded: MouthSequencePath[] = [];
    for (const path of beam) {
      for (const candidate of candidates) {
        expanded.push({
          candidates: [...path.candidates, candidate],
          texts: [...path.texts, candidate.text],
          score: pathScore(path, candidate),
        });
      }
    }

    const deduped = new Map<string, MouthSequencePath>();
    for (const path of expanded) {
      const key = signature(path.candidates);
      const existing = deduped.get(key);
      if (!existing || path.score > existing.score) deduped.set(key, path);
    }

    const all = [...deduped.values()];
    const complete = all.filter(isCompleteEndpointPath);
    const valid = all.filter((path) => path.candidates.every(semanticallyEligible));
    const survival = complete.length ? complete : valid.length ? valid : all;

    beam = survival.sort((a, b) => b.score - a.score).slice(0, width);
  }

  if (!beam.length) return { candidates: [], texts: [], score: 0 };

  const endpoint = beam.filter(isCompleteEndpointPath).sort((a, b) => b.score - a.score)[0];
  const selected = endpoint ?? beam[0];

  return {
    ...selected,
    score: metric(selected.score / Math.max(1, ordered.length)),
  };
}
