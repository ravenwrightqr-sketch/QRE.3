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

function hardFailure(
  candidate: MouthCandidate,
): boolean {
  /*
   * Only actual boundary violations are hard failures.
   *
   * Weak semantic execution is a quality signal.
   * Beam must be allowed to compare weak and strong
   * legal realizations across the complete trajectory.
   */

  return candidate.reasons.some(
    (reason) =>
      new Set([
        "forbidden-slot-move",
        "high-invention-risk",
        "analytic-realization-language",
        "question-leak",
        "non-exact-payoff",
      ]).has(reason),
  );
}

function semanticallyEligible(
  candidate: MouthCandidate,
): boolean {
  /*
   * Exact approved endpoint is sovereign.
   */
  if (isEndpoint(candidate)) {
    return (
      candidate.endpointExactness === 1 &&
      candidate.groundingScore >= 0.42 &&
      candidate.inventionRisk <= 0.45 &&
      candidate.forbiddenMoveRisk <= 0.45
    );
  }

  /*
   * Establishment / hook beats need grounding and legality,
   * but do not need middle-beat transition semantics.
   */
  if (isHook(candidate)) {
    return (
      candidate.groundingScore >= 0.42 &&
      candidate.inventionRisk <= 0.45 &&
      candidate.forbiddenMoveRisk <= 0.45 &&
      candidate.collageRisk <= 0.45 &&
      !hardFailure(candidate)
    );
  }

  /*
   * Middle beats:
   *
   * Truth and concrete invention remain hard boundaries.
   * Semantic weakness is deliberately left to Beam scoring.
   */
  return (
    candidate.groundingScore >= 0.42 &&
    candidate.inventionRisk <= 0.45 &&
    candidate.forbiddenMoveRisk <= 0.45 &&
    candidate.collageRisk <= 0.6 &&
    !hardFailure(candidate)
  );
}

function creativeMiddleCandidate(candidate: MouthCandidate): boolean {
  if (isHook(candidate) || isEndpoint(candidate) || isFallback(candidate)) return false;

  const weakMovement = candidate.reasons.some((reason) => WEAK_MOVEMENT_REASONS.has(reason));
  const strongMovingCut = candidate.reasons.some((reason) => MOVING_CUT_REASONS.has(reason));

  return (
    semanticallyEligible(candidate) &&
    candidate.score >= 0.52 &&
    candidate.meaningScore >= 0.45 &&
    candidate.transitionScore >= 0.45 &&
    candidate.noveltyScore >= 0.55 &&
    candidate.inventionRisk <= 0.35 &&
    !weakMovement &&
    (strongMovingCut || candidate.meaningScore >= 0.58)
  );
}
function candidateTransition(
  previous: MouthCandidate,
  current: MouthCandidate,
): number {
  const previousEvents =
    new Set(previous.supportedEventIds);

  const currentEvents =
    new Set(current.supportedEventIds);

  const previousRelations =
    new Set(
      previous.supportedRelationPairs,
    );

  const currentRelations =
    new Set(
      current.supportedRelationPairs,
    );

  let sharedEvents = 0;

  for (const id of currentEvents) {
    if (previousEvents.has(id)) {
      sharedEvents += 1;
    }
  }

  let newEvents = 0;

  for (const id of currentEvents) {
    if (!previousEvents.has(id)) {
      newEvents += 1;
    }
  }

  let sharedRelations = 0;

  for (const pair of currentRelations) {
    if (previousRelations.has(pair)) {
      sharedRelations += 1;
    }
  }

  let newRelations = 0;

  for (const pair of currentRelations) {
    if (!previousRelations.has(pair)) {
      newRelations += 1;
    }
  }

  const lexicalSimilarity = metric(
    overlap(
      tokenSet(previous.text),
      tokenSet(current.text),
    ),
  );

  /*
   * Local semantic continuity matters, but continuity alone cannot
   * justify a repeated beat.
   */
  const semanticContinuity = metric(
    Math.max(
      previous.meaningScore,
      current.meaningScore,
    ) * 0.3 +
      Math.max(
        previous.transitionScore,
        current.transitionScore,
      ) * 0.3 +
      Math.max(
        previous.score,
        current.score,
      ) * 0.25 +
      Math.max(
        previous.cohesionScore,
        current.cohesionScore,
      ) * 0.15,
  );

  const eventCarry = metric(
    Math.min(
      1,
      sharedEvents * 0.18,
    ),
  );

  const eventAdvance = metric(
    Math.min(
      1,
      newEvents * 0.28,
    ),
  );

  const relationCarry = metric(
    Math.min(
      1,
      sharedRelations * 0.16,
    ),
  );

  const relationAdvance = metric(
    Math.min(
      1,
      newRelations * 0.34,
    ),
  );

  /*
   * Very high lexical overlap is only good when something else
   * actually advances.
   */
  const lexicalPenalty =
    lexicalSimilarity >= 0.82 &&
    newEvents === 0 &&
    newRelations === 0
      ? 0.22
      : lexicalSimilarity >= 0.65 &&
          newEvents === 0 &&
          newRelations === 0
        ? 0.1
        : 0;

  /*
   * A legitimate callback can reuse evidence while introducing
   * a new relationship or materially stronger transition.
   */
  const callbackCredit =
    newRelations > 0 ||
    current.transitionScore >= 0.72
      ? 0.12
      : 0;

  const raw =
    semanticContinuity * 0.42 +
    eventCarry * 0.08 +
    eventAdvance * 0.16 +
    relationCarry * 0.06 +
    relationAdvance * 0.24 +
    callbackCredit -
    lexicalPenalty;

  return metric(raw);
}

function repeatedEvidencePenalty(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  if (!path.length) {
    return 0;
  }

  /*
   * Repetition is not automatically bad.
   *
   * A callback may legitimately reuse:
   * - an earlier event,
   * - an earlier relation,
   * - an earlier phrase,
   *
   * when the new line changes its meaning or advances the trajectory.
   *
   * We therefore distinguish:
   *
   *   JUSTIFIED CALLBACK
   *     reused evidence + new relation / stronger meaning / strong transition
   *
   *   SEMANTIC RESET
   *     reused evidence + no new relation + weak movement
   *
   *   HARD REPETITION
   *     same language / same evidence / no meaningful change
   */

  const priorCandidates =
    path;

  const candidateEvents =
    new Set(
      candidate.supportedEventIds,
    );

  const candidateRelations =
    new Set(
      candidate.supportedRelationPairs,
    );

  if (
    !candidateEvents.size &&
    !candidateRelations.size
  ) {
    return 0.12;
  }

  let maxLexicalSimilarity = 0;
  let maxEventOverlap = 0;
  let maxRelationOverlap = 0;

  for (
    const previous of priorCandidates
  ) {
    const lexical =
      metric(
        overlap(
          tokenSet(
            candidate.text,
          ),
          tokenSet(
            previous.text,
          ),
        ),
      );

    maxLexicalSimilarity =
      Math.max(
        maxLexicalSimilarity,
        lexical,
      );

    const previousEvents =
      new Set(
        previous.supportedEventIds,
      );

    const previousRelations =
      new Set(
        previous.supportedRelationPairs,
      );

    let sharedEvents = 0;

    for (
      const id of candidateEvents
    ) {
      if (
        previousEvents.has(id)
      ) {
        sharedEvents += 1;
      }
    }

    let sharedRelations = 0;

    for (
      const pair of candidateRelations
    ) {
      if (
        previousRelations.has(
          pair,
        )
      ) {
        sharedRelations += 1;
      }
    }

    maxEventOverlap =
      Math.max(
        maxEventOverlap,
        sharedEvents /
          Math.max(
            1,
            candidateEvents.size,
          ),
      );

    maxRelationOverlap =
      Math.max(
        maxRelationOverlap,
        sharedRelations /
          Math.max(
            1,
            candidateRelations.size,
          ),
      );
  }

  const priorEventIds =
    new Set(
      priorCandidates.flatMap(
        (item) =>
          item.supportedEventIds,
      ),
    );

  const priorRelationPairs =
    new Set(
      priorCandidates.flatMap(
        (item) =>
          item.supportedRelationPairs,
      ),
    );

  const newEventCount =
    candidate.supportedEventIds.filter(
      (id) =>
        !priorEventIds.has(id),
    ).length;

  const newRelationCount =
    candidate.supportedRelationPairs.filter(
      (pair) =>
        !priorRelationPairs.has(pair),
    ).length;

  const eventNovelty =
    metric(
      Math.min(
        1,
        newEventCount / 2,
      ),
    );

  const relationNovelty =
    metric(
      Math.min(
        1,
        newRelationCount / 2,
      ),
    );

  const movement =
    metric(
      candidate.meaningScore *
        0.55 +
        candidate.transitionScore *
        0.45,
    );

  const callbackQuality =
    metric(
      eventNovelty *
        0.35 +
        relationNovelty *
        0.35 +
        movement *
        0.3,
    );

  /*
   * Exact / near-exact language repetition is almost always a reset
   * unless the candidate is an explicit endpoint.
   */
  if (
    maxLexicalSimilarity >=
      0.92 &&
    callbackQuality <
      0.62
  ) {
    return 1;
  }

  /*
   * Reusing almost all of the same evidence without any new relation
   * or meaningful semantic movement is the core failure we just saw.
   *
   * Example:
   *   "Came in nervous."
   *   ...
   *   "Came in nervous."
   */
  if (
    maxEventOverlap >=
      0.9 &&
    maxRelationOverlap >=
      0.9 &&
    callbackQuality <
      0.45
  ) {
    return 0.95;
  }

  /*
   * Same event, but no new evidence and only weak movement:
   * still heavily penalized.
   */
  if (
    maxEventOverlap >=
      0.8 &&
    newEventCount ===
      0 &&
    newRelationCount ===
      0 &&
    movement <
      0.5
  ) {
    return 0.8;
  }

  /*
   * Reused evidence can be legitimate when the line materially
   * changes the interpretation.
   */
  if (
    newRelationCount > 0 ||
    movement >=
      0.72
  ) {
    return metric(
      Math.max(
        0,
        0.18 -
          callbackQuality *
            0.12,
      ),
    );
  }

  /*
   * Moderate reuse remains mildly costly.
   */
  return metric(
    Math.max(
      0,
      maxEventOverlap *
        0.22 +
        maxLexicalSimilarity *
          0.12 -
        eventNovelty *
          0.18 -
        relationNovelty *
          0.18,
    ),
  );
}

function intrinsic(candidate: MouthCandidate): number {
  if (isEndpoint(candidate)) return metric(0.94 + candidate.groundingScore * 0.06);
  if (isHook(candidate)) {
    return metric(
      candidate.groundingScore * 0.55 +
      candidate.compressionScore * 0.12 +
      candidate.noveltyScore * 0.08 +
      candidate.meaningScore * 0.1 +
      candidate.score * 0.15,
    );
  }

  const semantic = metric(
    candidate.meaningScore * 0.24 +
    candidate.transitionScore * 0.22 +
    candidate.obligationCoverage * 0.16 +
    candidate.relationContractScore * 0.15 +
    candidate.score * 0.23,
  );
  const movement =
    candidate.reasons.some((reason) => MOVING_CUT_REASONS.has(reason)) ? 0.12 : 0;
  const weakMovement =
    candidate.reasons.some((reason) => WEAK_MOVEMENT_REASONS.has(reason)) ? 0.12 : 0;
  const quality = metric(
    candidate.groundingScore * 0.25 +
    semantic * 0.4 +
    candidate.compressionScore * 0.1 +
    candidate.noveltyScore * 0.08 +
    candidate.cohesionScore * 0.05 +
    movement,
  );
  const risk =
    candidate.inventionRisk * 0.42 +
    candidate.collageRisk * 0.24 +
    candidate.forbiddenMoveRisk * 0.34 +
    candidate.repetitionRisk * 0.12 +
    (isFallback(candidate) ? 0.2 : 0) +
    weakMovement;
  return metric(quality - risk * 0.34);
}

function endpointDominance(path: MouthCandidate[], candidate: MouthCandidate): number {
  if (!isEndpoint(candidate)) return 0;
  return path.some(isEndpoint) ? 0.02 : 0.28;
}

function pathScore(
  path: MouthSequencePath,
  candidate: MouthCandidate,
): number {
  const previous =
    path.candidates[
      path.candidates.length - 1
    ];

  const transition =
    previous
      ? candidateTransition(
          previous,
          candidate,
        )
      : isHook(candidate)
        ? candidate.groundingScore
        : metric(
            candidate.meaningScore * 0.24 +
              candidate.transitionScore * 0.24 +
              candidate.obligationCoverage * 0.14 +
              candidate.relationContractScore * 0.14 +
              candidate.score * 0.24,
          );

  const priorEventIds =
    new Set(
      path.candidates.flatMap(
        (item) =>
          item.supportedEventIds,
      ),
    );

  const priorRelationPairs =
    new Set(
      path.candidates.flatMap(
        (item) =>
          item.supportedRelationPairs,
      ),
    );

  const newEventCount =
    candidate.supportedEventIds.filter(
      (id) =>
        !priorEventIds.has(id),
    ).length;

  const newRelationCount =
    candidate.supportedRelationPairs.filter(
      (pair) =>
        !priorRelationPairs.has(pair),
    ).length;

  const evidenceGain =
    metric(
      Math.min(
        1,
        newEventCount * 0.2 +
          newRelationCount * 0.3,
      ),
    );

  /*
   * Semantic reset:
   *
   * The candidate is legal in isolation but spends evidence already
   * used by the path without creating a new relation, new event, or
   * meaningful transition.
   */
  const pathRepetition =
    repeatedEvidencePenalty(
      path.candidates,
      candidate,
    );

  const meaningfulAdvance =
    metric(
      evidenceGain * 0.45 +
        candidate.transitionScore *
          0.3 +
        candidate.meaningScore *
          0.25,
    );

  const semanticReset =
    path.candidates.length >= 2 &&
    newEventCount === 0 &&
    newRelationCount === 0 &&
    meaningfulAdvance < 0.48
      ? 0.32
      : 0;

  /*
   * If the current candidate reuses evidence, it must earn that reuse
   * through stronger semantic movement.
   */
  const reuseWithoutAdvance =
    candidate.supportedEventIds.length > 0 &&
    newEventCount === 0 &&
    newRelationCount === 0 &&
    candidate.transitionScore < 0.6
      ? 0.18
      : 0;

  const movementBonus =
    candidate.reasons.some(
      (reason) =>
        MOVING_CUT_REASONS.has(reason),
    )
      ? 0.14
      : 0;

  const callbackBonus =
    path.candidates.length > 0 &&
    newRelationCount > 0 &&
    candidate.meaningScore >= 0.55
      ? 0.1
      : 0;

  const fallbackPenalty =
    isFallback(candidate)
      ? 0.12
      : 0;

  /*
   * Endpoint remains sovereign, but it should not make us forget
   * the trajectory that leads into it.
   */
  const endpointBonus =
    isEndpoint(candidate)
      ? endpointDominance(
          path.candidates,
          candidate,
        )
      : 0;

  return (
    path.score +
    intrinsic(candidate) * 0.42 +
    transition * 0.22 +
    evidenceGain * 0.16 +
    movementBonus +
    callbackBonus +
    endpointBonus -
    pathRepetition * 0.22 -
    semanticReset -
    reuseWithoutAdvance -
    fallbackPenalty
  );
}

function signature(path: MouthCandidate[]): string {
  return path.map((candidate) => clean(candidate.text).toLowerCase()).join("|");
}
function poolCandidates(
  pool: MouthCandidatePool,
  perBeat: number,
  isTerminal: boolean,
): MouthCandidate[] {
  const ranked = [
    ...pool.candidates,
  ].sort(
    (a, b) =>
      b.score - a.score,
  );

  const legal =
    ranked.filter(
      (candidate) =>
        !hardFailure(candidate) &&
        candidate.inventionRisk <=
          0.45 &&
        candidate.forbiddenMoveRisk <=
          0.45 &&
        candidate.collageRisk <=
          0.6,
    );

  if (!legal.length) {
    return [];
  }

  /*
   * Endpoint candidates belong only to the terminal pool.
   */
  if (isTerminal) {
    const endpoints =
      legal.filter(
        isEndpoint,
      );

    return endpoints.length
      ? endpoints.slice(
          0,
          perBeat,
        )
      : legal
          .filter(
            (candidate) =>
              !isEndpoint(candidate),
          )
          .slice(
            0,
            perBeat,
          );
  }

  /*
   * Earlier beats must never consume the terminal endpoint.
   */
  const nonEndpoint =
    legal.filter(
      (candidate) =>
        !isEndpoint(candidate),
    );

  if (!nonEndpoint.length) {
    return [];
  }

  const hooks =
    nonEndpoint.filter(
      isHook,
    );

  const creative =
    nonEndpoint.filter(
      (candidate) =>
        creativeMiddleCandidate(
          candidate,
        ),
    );

  const used =
    new Set<MouthCandidate>();

  const output:
    MouthCandidate[] = [];

  for (
    const candidate of [
      ...hooks,
      ...creative,
      ...nonEndpoint,
    ]
  ) {
    if (
      output.length >=
      perBeat
    ) {
      break;
    }

    if (
      used.has(candidate)
    ) {
      continue;
    }

    used.add(candidate);
    output.push(candidate);
  }

  return output;
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

  for (
  let poolIndex = 0;
  poolIndex < ordered.length;
  poolIndex += 1
) {
  const pool =
    ordered[poolIndex]!;

  const isTerminal =
    poolIndex ===
    ordered.length - 1;

  const candidates =
    poolCandidates(
      pool,
      perBeat,
      isTerminal,
    );
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
