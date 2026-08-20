/**
 * QRE MOUTH SEQUENCE BEAM SEARCH · DETERMINISTIC EDITOR
 *
 * The beam never invents meaning. It selects among already-scored candidates.
 *
 * Production invariants:
 * - exact approved endpoint is sovereign;
 * - exact duplicate language cannot occupy two non-terminal cuts;
 * - evidence reuse is legal when meaning advances;
 * - weak-but-legal candidates remain available for global comparison;
 * - when a beat pool cannot produce a distinct legal realization, the beam may
 *   compress that beat instead of manufacturing a duplicate caption.
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

const HARD_FAILURES = new Set([
  "forbidden-slot-move",
  "high-invention-risk",
  "analytic-realization-language",
  "question-leak",
  "non-exact-payoff",
]);

const MOVING_CUT_REASONS = new Set([
  "strong-moving-cut",
]);

const WEAK_MOVEMENT_REASONS = new Set([
  "weak-forward-pull",
  "weak-next-need",
  "weak-attention-change",
  "attention-source-restatement",
]);

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

function isFallback(candidate: MouthCandidate): boolean {
  return candidate.reasons.includes("grounded-fallback");
}

function isEndpoint(candidate: MouthCandidate): boolean {
  return candidate.endpointExactness === 1 &&
    !candidate.reasons.includes("non-exact-payoff");
}

function hardFailure(candidate: MouthCandidate): boolean {
  return candidate.reasons.some((reason) => HARD_FAILURES.has(reason));
}

function legal(candidate: MouthCandidate): boolean {
  return (
    !hardFailure(candidate) &&
    candidate.groundingScore >= 0.42 &&
    candidate.inventionRisk <= 0.45 &&
    candidate.forbiddenMoveRisk <= 0.45 &&
    candidate.collageRisk <= 0.6
  );
}

function exactTextDuplicate(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): boolean {
  const text = clean(candidate.text).toLowerCase();
  if (!text || isEndpoint(candidate)) return false;
  return path.some(
    (previous) =>
      clean(previous.text).toLowerCase() === text,
  );
}

function evidenceAdvance(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  const priorEvents = new Set(
    path.flatMap((item) => item.supportedEventIds),
  );
  const priorRelations = new Set(
    path.flatMap((item) => item.supportedRelationPairs),
  );
  const newEvents = candidate.supportedEventIds.filter(
    (id) => !priorEvents.has(id),
  ).length;
  const newRelations = candidate.supportedRelationPairs.filter(
    (pair) => !priorRelations.has(pair),
  ).length;

  return metric(
    Math.min(
      1,
      newEvents * 0.18 + newRelations * 0.26,
    ),
  );
}

function repetitionPenalty(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  if (!path.length || isEndpoint(candidate)) return 0;

  const current = tokenSet(candidate.text);
  let maxSimilarity = 0;

  for (const previous of path) {
    maxSimilarity = Math.max(
      maxSimilarity,
      overlap(current, tokenSet(previous.text)),
    );
  }

  const advance = evidenceAdvance(path, candidate);
  const movement = metric(
    candidate.meaningScore * 0.55 +
    candidate.transitionScore * 0.45,
  );

  if (maxSimilarity >= 0.92 && advance < 0.35 && movement < 0.72) {
    return 1;
  }

  if (maxSimilarity >= 0.8 && advance === 0 && movement < 0.5) {
    return 0.8;
  }

  if (advance > 0.35 || movement >= 0.72) {
    return 0.08;
  }

  return metric(
    maxSimilarity * 0.24 - advance * 0.1,
  );
}

function candidateTransition(
  previous: MouthCandidate | undefined,
  current: MouthCandidate,
): number {
  if (!previous) {
    return isHook(current)
      ? current.groundingScore
      : metric(
          current.meaningScore * 0.25 +
          current.transitionScore * 0.25 +
          current.obligationCoverage * 0.15 +
          current.relationContractScore * 0.12 +
          current.score * 0.23,
        );
  }

  const previousEvents = new Set(previous.supportedEventIds);
  const previousRelations = new Set(previous.supportedRelationPairs);
  const currentEvents = new Set(current.supportedEventIds);
  const currentRelations = new Set(current.supportedRelationPairs);

  const sharedEvents = [...currentEvents].filter(
    (id) => previousEvents.has(id),
  ).length;
  const newEvents = [...currentEvents].filter(
    (id) => !previousEvents.has(id),
  ).length;
  const sharedRelations = [...currentRelations].filter(
    (pair) => previousRelations.has(pair),
  ).length;
  const newRelations = [...currentRelations].filter(
    (pair) => !previousRelations.has(pair),
  ).length;

  const lexical = overlap(
    tokenSet(previous.text),
    tokenSet(current.text),
  );

  const semantic = metric(
    Math.max(previous.meaningScore, current.meaningScore) * 0.34 +
    Math.max(previous.transitionScore, current.transitionScore) * 0.34 +
    Math.max(previous.score, current.score) * 0.32,
  );

  const repeatedLanguagePenalty =
    lexical >= 0.88 && newEvents === 0 && newRelations === 0
      ? 0.22
      : 0;

  return metric(
    semantic * 0.64 +
    Math.min(sharedEvents, 2) * 0.04 +
    Math.min(newEvents, 2) * 0.08 +
    Math.min(sharedRelations, 2) * 0.08 +
    Math.min(newRelations, 2) * 0.16 -
    repeatedLanguagePenalty,
  );
}

function intrinsic(candidate: MouthCandidate): number {
  if (isEndpoint(candidate)) {
    return metric(
      0.95 + candidate.groundingScore * 0.05,
    );
  }

  if (isHook(candidate)) {
    return metric(
      candidate.groundingScore * 0.42 +
      candidate.compressionScore * 0.14 +
      candidate.noveltyScore * 0.1 +
      candidate.meaningScore * 0.12 +
      candidate.score * 0.22,
    );
  }

  return metric(
    candidate.groundingScore * 0.2 +
    candidate.meaningScore * 0.22 +
    candidate.transitionScore * 0.2 +
    candidate.obligationCoverage * 0.14 +
    candidate.relationContractScore * 0.12 +
    candidate.score * 0.12,
  );
}

function pathScore(
  path: MouthSequencePath,
  candidate: MouthCandidate,
): number {
  const previous = path.candidates[path.candidates.length - 1];
  const transition = candidateTransition(previous, candidate);
  const advance = evidenceAdvance(path.candidates, candidate);
  const repetition = repetitionPenalty(path.candidates, candidate);
  const movementBonus = candidate.reasons.some(
    (reason) => MOVING_CUT_REASONS.has(reason),
  )
    ? 0.12
    : 0;
  const endpointBonus = isEndpoint(candidate) ? 0.28 : 0;
  const fallbackPenalty = isFallback(candidate) ? 0.1 : 0;

  return (
    path.score +
    intrinsic(candidate) * 0.45 +
    transition * 0.25 +
    advance * 0.18 +
    movementBonus +
    endpointBonus -
    repetition * 0.28 -
    fallbackPenalty
  );
}

function poolCandidates(
  pool: MouthCandidatePool,
  perBeat: number,
): MouthCandidate[] {
  const ranked = [...pool.candidates].sort(
    (a, b) => b.score - a.score,
  );

  const legalCandidates = ranked.filter(legal);
  if (!legalCandidates.length) return [];

  const endpoint = legalCandidates.filter(isEndpoint);
  if (endpoint.length) return endpoint.slice(0, perBeat);

  const hooks = legalCandidates.filter(isHook);
  const creative = legalCandidates.filter((candidate) => {
    if (isHook(candidate) || isFallback(candidate)) return false;

    const weakMovement = candidate.reasons.some(
      (reason) => WEAK_MOVEMENT_REASONS.has(reason),
    );
    const strongMovement = candidate.reasons.some(
      (reason) => MOVING_CUT_REASONS.has(reason),
    );

    return (
      candidate.score >= 0.48 &&
      candidate.meaningScore >= 0.42 &&
      candidate.transitionScore >= 0.4 &&
      candidate.inventionRisk <= 0.35 &&
      candidate.noveltyScore >= 0.45 &&
      !weakMovement &&
      (strongMovement || candidate.meaningScore >= 0.55)
    );
  });

  const output: MouthCandidate[] = [];
  const seen = new Set<string>();

  for (const candidate of [...hooks, ...creative, ...legalCandidates]) {
    if (output.length >= perBeat) break;

    const key = clean(candidate.text).toLowerCase();
    if (!key || seen.has(key)) continue;

    seen.add(key);
    output.push(candidate);
  }

  return output;
}

/**
 * A pool is realization-viable for this point in the path when at least one
 * candidate gives us more than repeated wording or repeated evidence.
 *
 * This is deliberately a soft semantic test. It does not reinterpret meaning,
 * and it never treats lack of novelty as invention risk. It only answers:
 * "Does keeping this beat as a cut buy us enough trajectory value?"
 */
function poolHasDistinctViability(
  path: MouthCandidate[],
  candidates: MouthCandidate[],
): boolean {
  if (!candidates.length) return false;

  const viable = candidates.some((candidate) => {
    if (exactTextDuplicate(path, candidate)) return false;
    if (evidenceAdvance(path, candidate) >= 0.18) return true;

    const priorText = path[path.length - 1]?.text ?? "";
    const lexical = priorText
      ? overlap(tokenSet(priorText), tokenSet(candidate.text))
      : 0;

    const movement = metric(
      candidate.meaningScore * 0.55 +
      candidate.transitionScore * 0.45,
    );

    return (
      movement >= 0.72 &&
      lexical < 0.88
    );
  });

  return viable;
}

function completeEndpointPath(
  path: MouthSequencePath,
): boolean {
  const last = path.candidates[path.candidates.length - 1];
  return Boolean(last && isEndpoint(last));
}

function signature(path: MouthCandidate[]): string {
  return path
    .map((candidate) => clean(candidate.text).toLowerCase())
    .join("|");
}

/**
 * Select the strongest realizable sequence.
 *
 * IMPORTANT:
 * If a middle beat cannot be realized as a distinct legal cut, it is skipped
 * rather than forcing the Mouth to emit duplicate language. This is trajectory
 * compression, not semantic invention.
 */
export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const width = Math.max(
    1,
    Math.min(options.width ?? 8, 32),
  );
  const perBeat = Math.max(
    1,
    Math.min(options.candidatesPerBeat ?? 8, 16),
  );

  const ordered = [...pools].sort(
    (a, b) => a.order - b.order,
  );

  let beam: MouthSequencePath[] = [
    {
      candidates: [],
      texts: [],
      score: 0,
    },
  ];

  for (let index = 0; index < ordered.length; index += 1) {
    const pool = ordered[index]!;
    const candidates = poolCandidates(
      pool,
      perBeat,
    );

    const expanded: MouthSequencePath[] = [];

    for (const path of beam) {
      const pathCandidates = [...path.candidates];

      for (const candidate of candidates) {
        if (exactTextDuplicate(pathCandidates, candidate)) continue;

        expanded.push({
          candidates: [
            ...pathCandidates,
            candidate,
          ],
          texts: [
            ...path.texts,
            candidate.text,
          ],
          score: pathScore(path, candidate),
        });
      }

      /*
       * Trajectory compression:
       *
       * If the current pool contributes no distinct realizable advancement,
       * preserve the path unchanged and skip this beat. Never skip the final
       * pool when it contains an exact approved endpoint.
       */
      const finalPool = index === ordered.length - 1;
      const endpointAvailable = candidates.some(isEndpoint);

      if (
        !finalPool &&
        !endpointAvailable &&
        !poolHasDistinctViability(
          pathCandidates,
          candidates,
        )
      ) {
        expanded.push({
          candidates: pathCandidates,
          texts: [...path.texts],
          score: path.score - 0.035,
        });
      }
    }

    if (!expanded.length) {
      return {
        candidates: [],
        texts: [],
        score: 0,
      };
    }

    const deduped = new Map<string, MouthSequencePath>();

    for (const path of expanded) {
      const key = signature(path.candidates);
      const existing = deduped.get(key);
      if (!existing || path.score > existing.score) {
        deduped.set(key, path);
      }
    }

    const all = [...deduped.values()];
    const complete = all.filter(completeEndpointPath);
    const safe = all.filter((path) =>
      path.candidates.every(legal),
    );

    const survival = complete.length
      ? complete
      : safe.length
        ? safe
        : all;

    beam = survival
      .sort((a, b) => b.score - a.score)
      .slice(0, width);
  }

  if (!beam.length) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  const endpoint =
    beam.find(completeEndpointPath) ??
    beam[0]!;

  return {
    ...endpoint,
    score: metric(
      endpoint.score /
      Math.max(1, ordered.length),
    ),
  };
}
