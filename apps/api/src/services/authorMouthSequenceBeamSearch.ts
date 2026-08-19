/**
 * QRE MOUTH SEQUENCE BEAM SEARCH · DETERMINISTIC EDITOR
 *
 * Per-beat candidate ranking is insufficient:
 * a line can be excellent alone and destroy the sequence.
 *
 * The beam therefore optimizes ONLY among candidates that already satisfy
 * the realization contract whenever such candidates exist.
 *
 * Semantic authority remains upstream:
 *
 *   RealityEnvelope
 *        ↓
 *   MeaningSpine
 *        ↓
 *   RealizationSlot
 *        ↓
 *   MouthCandidate
 *        ↓
 *   BEAM
 *
 * The beam does not invent meaning.
 * The beam does not repair semantic failures.
 * The beam chooses the strongest cumulative realization.
 */

import type {
  MouthCandidate,
} from "./authorMouthCandidateSearch.js";

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

const clean = (
  value: unknown,
): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (
  value: number,
): number =>
  Number(
    Math.max(
      0,
      Math.min(1, value),
    ).toFixed(3),
  );

function tokenSet(
  text: string,
): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .split(
        /[^a-z0-9'-]+/i,
      )
      .filter(
        (token) =>
          token.length >= 3,
      ),
  );
}

function overlap(
  left: Set<string>,
  right: Set<string>,
): number {
  if (
    !left.size ||
    !right.size
  ) {
    return 0;
  }

  let hits = 0;

  for (const token of left) {
    if (right.has(token)) {
      hits += 1;
    }
  }

  return (
    hits /
    Math.max(
      1,
      left.size,
    )
  );
}

function candidateTransition(
  previous: MouthCandidate,
  current: MouthCandidate,
): number {
  const sharedEvents =
    previous.supportedEventIds.filter(
      (id) =>
        current.supportedEventIds.includes(
          id,
        ),
    ).length;

  const newEvents =
    current.supportedEventIds.filter(
      (id) =>
        !previous.supportedEventIds.includes(
          id,
        ),
    ).length;

  const relationContinuity =
    current.supportedRelationPairs.some(
      (pair) => {
        const [
          from,
          to,
        ] =
          pair.split(
            "->",
          );

        return (
          previous.supportedEventIds.includes(
            from,
          ) ||
          previous.supportedEventIds.includes(
            to,
          )
        );
      },
    )
      ? 1
      : 0;

  const languageContinuity =
    metric(
      overlap(
        tokenSet(
          previous.text,
        ),
        tokenSet(
          current.text,
        ),
      ),
    );

  /*
   * Semantic continuity gets more weight than word continuity.
   *
   * A sequence should feel connected because meaning is carrying forward,
   * not because every line repeats vocabulary.
   */
  const semanticContinuity =
    metric(
      Math.max(
        previous.transitionScore,
        current.transitionScore,
      ),
    );

  const meaningContinuity =
    metric(
      Math.min(
        previous.meaningScore,
        current.meaningScore,
      ),
    );

  const obligationContinuity =
    metric(
      Math.min(
        previous.obligationCoverage,
        current.obligationCoverage,
      ),
    );

  const relationContinuityScore =
    metric(
      Math.min(
        previous.relationContractScore,
        current.relationContractScore,
      ),
    );

  return metric(
    sharedEvents * 0.05 +
      Math.min(
        newEvents,
        2,
      ) * 0.07 +
      relationContinuity * 0.12 +
      languageContinuity * 0.03 +
      semanticContinuity * 0.25 +
      meaningContinuity * 0.22 +
      obligationContinuity * 0.13 +
      relationContinuityScore * 0.13,
  );
}

function repeatedEvidencePenalty(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  const previousIds =
    new Set(
      path.flatMap(
        (item) =>
          item.supportedEventIds,
      ),
    );

  if (
    !candidate.supportedEventIds.length
  ) {
    return 0.12;
  }

  const repeated =
    candidate.supportedEventIds.filter(
      (id) =>
        previousIds.has(id),
    ).length;

  return metric(
    repeated /
      Math.max(
        1,
        candidate
          .supportedEventIds
          .length,
      ),
  );
}

/**
 * Hard semantic eligibility boundary.
 *
 * The beam is allowed to choose among candidates only after the candidate
 * scorer has established that the realization contract was respected.
 */
function candidateIsSemanticallyEligible(
  candidate: MouthCandidate,
): boolean {
  const hardFailures =
    new Set([
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
    ]);

  return (
    candidate.groundingScore >= 0.42 &&
    candidate.meaningScore >= 0.4 &&
    candidate.transitionScore >= 0.4 &&
    candidate.obligationCoverage >= 0.4 &&
    candidate.relationContractScore >= 0.4 &&
    candidate.inventionRisk <= 0.45 &&
    candidate.collageRisk <= 0.45 &&
    candidate.forbiddenMoveRisk <= 0.45 &&
    !candidate.reasons.some(
      (reason) =>
        hardFailures.has(reason),
    )
  );
}

/**
 * Payoff candidates get an even stronger invariant.
 *
 * A sequence cannot win by sacrificing an exact endpoint for a prettier
 * preceding line.
 *
 * Non-payoff candidates have endpointExactness === 0, so they naturally do
 * not qualify as endpoint-safe.
 */
function candidateIsEndpointSafe(
  candidate: MouthCandidate,
): boolean {
  return (
    candidate.endpointExactness ===
      1 &&
    !candidate.reasons.includes(
      "non-exact-payoff",
    )
  );
}

/**
 * Prefer semantically valid candidates whenever a beat has them.
 *
 * If every candidate is invalid, preserve the strongest diagnostic fallback
 * so the downstream gate can report the real failure and trigger repair.
 */
function candidatePoolForBeam(
  pool: MouthCandidatePool,
  perBeat: number,
): MouthCandidate[] {
  const ranked =
    [...pool.candidates].sort(
      (a, b) =>
        b.score -
        a.score,
    );

  const eligible =
    ranked.filter(
      candidateIsSemanticallyEligible,
    );

  if (
    eligible.length
  ) {
    return eligible.slice(
      0,
      perBeat,
    );
  }

  return ranked.slice(
    0,
    perBeat,
  );
}

/**
 * Candidate-local quality used by the beam.
 *
 * This intentionally recomputes the important dimensions instead of trusting
 * candidate.score blindly. That prevents later changes to the candidate
 * scorer from accidentally erasing semantic authority at the sequence layer.
 */
function candidateIntrinsicScore(
  candidate: MouthCandidate,
): number {
  const semantic =
    metric(
      candidate.meaningScore *
        0.32 +
        candidate.transitionScore *
          0.32 +
        candidate.obligationCoverage *
          0.2 +
        candidate.relationContractScore *
          0.16,
    );

  const quality =
    metric(
      candidate.groundingScore *
        0.3 +
        candidate.compressionScore *
          0.12 +
        candidate.noveltyScore *
          0.12 +
        candidate.cohesionScore *
          0.08 +
        semantic *
          0.38,
    );

  const penalties =
    candidate.inventionRisk *
      0.4 +
    candidate.collageRisk *
      0.25 +
    candidate.forbiddenMoveRisk *
      0.35 +
    candidate.repetitionRisk *
      0.15;

  if (
    candidate.endpointExactness ===
    1
  ) {
    return metric(
      0.9 +
        quality * 0.1 -
        penalties * 0.2,
    );
  }

  return metric(
    quality -
      penalties * 0.3,
  );
}

function sequenceEvidenceGain(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  const previousIds =
    new Set(
      path.flatMap(
        (item) =>
          item.supportedEventIds,
      ),
    );

  const newIds =
    candidate.supportedEventIds.filter(
      (id) =>
        !previousIds.has(
          id,
        ),
    ).length;

  if (
    newIds <= 0
  ) {
    return 0;
  }

  return metric(
    Math.min(
      newIds,
      3,
    ) * 0.06,
  );
}

function endpointDominance(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  if (
    candidate.endpointExactness !==
    1
  ) {
    return 0;
  }

  const priorEndpoint =
    path.some(
      (item) =>
        item.endpointExactness ===
        1,
    );

  /*
   * Normally only the final beat carries endpoint semantics.
   * Do not pay an endpoint bonus repeatedly.
   */
  return priorEndpoint
    ? 0.02
    : 0.24;
}

/**
 * Measure semantic carry between adjacent lines.
 *
 * This rewards continuity of relations, events, meaning, and obligations
 * without requiring repeated vocabulary.
 */
function semanticCarryForward(
  previous: MouthCandidate,
  current: MouthCandidate,
): number {
  const sharedRelations =
    previous.supportedRelationPairs.filter(
      (pair) =>
        current.supportedRelationPairs.includes(
          pair,
        ),
    ).length;

  const previousEvents =
    new Set(
      previous.supportedEventIds,
    );

  const currentEvents =
    new Set(
      current.supportedEventIds,
    );

  let relationCarry =
    sharedRelations > 0
      ? 0.2
      : 0;

  for (
    const id of previousEvents
  ) {
    if (
      currentEvents.has(
        id,
      )
    ) {
      relationCarry +=
        0.06;
    }
  }

  const semanticCarry =
    metric(
      current.transitionScore *
        0.34 +
        current.meaningScore *
          0.24 +
        current.obligationCoverage *
          0.2 +
        current.relationContractScore *
          0.12 +
        relationCarry *
          0.1,
    );

  return semanticCarry;
}

function pathScore(
  path: MouthSequencePath,
  candidate: MouthCandidate,
): number {
  const previous =
    path.candidates[
      path.candidates.length - 1
    ];

  const intrinsic =
    candidateIntrinsicScore(
      candidate,
    );

  const transition =
    previous
      ? candidateTransition(
          previous,
          candidate,
        )
      : metric(
          candidate.transitionScore *
            0.5 +
            candidate.meaningScore *
              0.25 +
            candidate.obligationCoverage *
              0.15 +
            candidate.relationContractScore *
              0.1,
        );

  const carry =
    previous
      ? semanticCarryForward(
          previous,
          candidate,
        )
      : candidate.obligationCoverage;

  const repetition =
    repeatedEvidencePenalty(
      path.candidates,
      candidate,
    );

  const evidenceGain =
    sequenceEvidenceGain(
      path.candidates,
      candidate,
    );

  const endpoint =
    endpointDominance(
      path.candidates,
      candidate,
    );

  /*
   * Hard semantic dimensions dominate the beam.
   * Surface quality is secondary.
   */
  return (
    path.score +
    intrinsic * 0.42 +
    transition * 0.18 +
    carry * 0.2 +
    evidenceGain +
    endpoint -
    repetition * 0.05
  );
}

function signature(
  path: MouthCandidate[],
): string {
  return path
    .map(
      (candidate) =>
        clean(
          candidate.text,
        ).toLowerCase(),
    )
    .join("|");
}

/**
 * A completed path is endpoint-complete only when its final candidate is the
 * exact approved endpoint.
 */
function isCompleteEndpointPath(
  path: MouthSequencePath,
): boolean {
  if (
    !path.candidates.length
  ) {
    return false;
  }

  const last =
    path.candidates[
      path.candidates.length - 1
    ];

  return candidateIsEndpointSafe(
    last,
  );
}

function pathHasHardFailure(
  path: MouthSequencePath,
): boolean {
  return path.candidates.some(
    (candidate) =>
      !candidateIsSemanticallyEligible(
        candidate,
      ),
  );
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const width =
    Math.max(
      1,
      Math.min(
        options.width ?? 8,
        32,
      ),
    );

  const perBeat =
    Math.max(
      1,
      Math.min(
        options.candidatesPerBeat ?? 8,
        16,
      ),
    );

  const orderedPools =
    [...pools].sort(
      (a, b) =>
        a.order -
        b.order,
    );

  let beam:
    MouthSequencePath[] = [
      {
        candidates: [],
        texts: [],
        score: 0,
      },
    ];

  for (
    const pool of orderedPools
  ) {
    const candidates =
      candidatePoolForBeam(
        pool,
        perBeat,
      );

    if (
      !candidates.length
    ) {
      return {
        candidates: [],
        texts: [],
        score: 0,
      };
    }

    const expanded:
      MouthSequencePath[] = [];

    /*
     * Determine whether this beat has any semantically valid candidate.
     */
    const hasEligibleCandidate =
      candidates.some(
        candidateIsSemanticallyEligible,
      );

    for (
      const path of beam
    ) {
      for (
        const candidate of
          candidates
      ) {
        /*
         * Once the current beat has valid candidates, invalid candidates are
         * not allowed to poison a valid path.
         */
        if (
          hasEligibleCandidate &&
          !candidateIsSemanticallyEligible(
            candidate,
          )
        ) {
          continue;
        }

        /*
         * Do not extend an already-invalid path with another invalid
         * candidate when a valid path exists in the current beam.
         */
        if (
          pathHasHardFailure(
            path,
          ) &&
          hasEligibleCandidate
        ) {
          continue;
        }

        expanded.push({
          candidates: [
            ...path.candidates,
            candidate,
          ],
          texts: [
            ...path.texts,
            candidate.text,
          ],
          score:
            pathScore(
              path,
              candidate,
            ),
        });
      }
    }

    /*
     * Emergency diagnostic fallback:
     *
     * If semantic eligibility eliminates every expansion, preserve the
     * strongest available candidates so the downstream gate can report the
     * real failure and trigger bounded repair.
     */
    if (
      !expanded.length
    ) {
      for (
        const path of beam
      ) {
        for (
          const candidate of
            candidates
        ) {
          expanded.push({
            candidates: [
              ...path.candidates,
              candidate,
            ],
            texts: [
              ...path.texts,
              candidate.text,
            ],
            score:
              pathScore(
                path,
                candidate,
              ),
          });
        }
      }
    }

    const deduped =
      new Map<
        string,
        MouthSequencePath
      >();

    for (
      const path of expanded
    ) {
      const key =
        signature(
          path.candidates,
        );

      const existing =
        deduped.get(
          key,
        );

      if (
        !existing ||
        path.score >
          existing.score
      ) {
        deduped.set(
          key,
          path,
        );
      }
    }

    const allPaths =
      [...deduped.values()];

    /*
     * Endpoint-complete paths have authority over incomplete paths once they
     * exist. This prevents the beam from pruning the exact ending.
     */
    const complete =
      allPaths.filter(
        isCompleteEndpointPath,
      );

    const valid =
      allPaths.filter(
        (path) =>
          !pathHasHardFailure(
            path,
          ),
      );

    const survivalPool =
      complete.length
        ? complete
        : valid.length
          ? valid
          : allPaths;

    beam =
      survivalPool
        .sort(
          (a, b) =>
            b.score -
            a.score,
        )
        .slice(
          0,
          width,
        );
  }

  if (!beam.length) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  /*
   * Final endpoint authority:
   *
   * If an exact endpoint survived, select the strongest exact-endpoint path.
   */
  const endpointSafe =
    beam
      .filter(
        isCompleteEndpointPath,
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      )[0];

  const valid =
    beam
      .filter(
        (path) =>
          !pathHasHardFailure(
            path,
          ),
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      )[0];

  const selected =
    endpointSafe ??
    valid ??
    beam[0];

  return {
    ...selected,
    score: metric(
      selected.score /
        Math.max(
          1,
          orderedPools.length,
        ),
    ),
  };
}