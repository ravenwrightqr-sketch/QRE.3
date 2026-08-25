/**
 * STATUS: CANONICAL COMPATIBILITY
 * ROLE: Select one already-authorized language candidate per approved beat.
 *
 * MUST NOT:
 * - invent language
 * - create story beats
 * - reinterpret reality
 * - bypass candidate authorization
 *
 * The historical "beam" name remains for compatibility with the master Author.
 *
 * Selection authority:
 *   1. candidate safety
 *   2. candidate authorization / provenance
 *   3. semantic execution
 *   4. transition quality
 *   5. grounding
 *   6. compression
 *   7. novelty / cohesion
 *   8. endpoint exactness
 *
 * The beam does not decide what the movie is.
 * It only chooses among candidates already authorized by Mouth Candidate Search.
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
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

/**
 * A candidate is selectable only when Mouth Candidate Search
 * has supplied some evidence that the text is authorized.
 *
 * Literal grounded language is legal.
 * Exact endpoint language is legal.
 * Evidence-backed semantic turns are legal.
 *
 * Mere plausibility is not authorization.
 */
function authorized(
  candidate: MouthCandidate,
): boolean {
  const text = clean(candidate.text);

  if (!text) {
    return false;
  }

  if (
    candidate.inventionRisk >= 0.35 ||
    candidate.forbiddenMoveRisk >= 0.35
  ) {
    return false;
  }

  const hasGrounding =
    candidate.groundingScore >= 0.5;

  const hasSupportedEvents =
    candidate.supportedEventIds.length > 0;

  const hasEndpoint =
    candidate.endpointExactness >= 0.999;

  const hasSemanticAuthorization =
    candidate.reasons.includes(
      "semantic-turn-grounded",
    );

  /*
   * Candidate Search is the source of authorization.
   * The beam must never turn an otherwise-good-looking
   * sentence into an authorized candidate on its own.
   */
  return (
    hasGrounding ||
    hasSupportedEvents ||
    hasEndpoint ||
    hasSemanticAuthorization
  );
}

function semanticQuality(
  candidate: MouthCandidate,
): number {
  return (
    candidate.meaningScore * 0.26 +
    candidate.transitionScore * 0.22 +
    candidate.groundingScore * 0.22 +
    candidate.obligationCoverage * 0.12 +
    candidate.compressionScore * 0.08 +
    candidate.cohesionScore * 0.05 +
    candidate.noveltyScore * 0.05
  );
}

function authorizationQuality(
  candidate: MouthCandidate,
): number {
  let value = 0;

  if (
    candidate.supportedEventIds.length > 0
  ) {
    value += 0.35;
  }

  if (
    candidate.supportedRelationPairs.length > 0
  ) {
    value += 0.25;
  }

  if (
    candidate.groundingScore >= 0.8
  ) {
    value += 0.2;
  } else if (
    candidate.groundingScore >= 0.5
  ) {
    value += 0.1;
  }

  if (
    candidate.reasons.includes(
      "semantic-turn-grounded",
    )
  ) {
    value += 0.2;
  }

  return clamp01(value);
}

function rank(
  candidate: MouthCandidate,
): number {
  const inventionSafety =
    1 -
    Math.max(
      candidate.inventionRisk,
      candidate.forbiddenMoveRisk,
    );

  const authorization =
    authorizationQuality(
      candidate,
    );

  const semantic =
    semanticQuality(candidate);

  /*
   * Endpoint exactness gets deterministic priority
   * at the final beat, but is still represented in the
   * candidate score for diagnostics.
   */
  const endpoint =
    candidate.endpointExactness >=
    0.999
      ? 1
      : 0;

  const value =
    inventionSafety * 0.28 +
    authorization * 0.24 +
    semantic * 0.40 +
    endpoint * 0.08;

  return clamp01(value);
}

function compareCandidates(
  a: MouthCandidate,
  b: MouthCandidate,
): number {
  const rankDelta =
    rank(b) - rank(a);

  if (rankDelta !== 0) {
    return rankDelta;
  }

  /*
   * Deterministic tie-breaks.
   *
   * Prefer:
   *   exact endpoint
   *   stronger provenance
   *   stronger grounding
   *   shorter text
   */
  if (
    a.endpointExactness !==
    b.endpointExactness
  ) {
    return (
      b.endpointExactness -
      a.endpointExactness
    );
  }

  if (
    a.supportedEventIds.length !==
    b.supportedEventIds.length
  ) {
    return (
      b.supportedEventIds.length -
      a.supportedEventIds.length
    );
  }

  if (
    a.groundingScore !==
    b.groundingScore
  ) {
    return (
      b.groundingScore -
      a.groundingScore
    );
  }

  const aWords = clean(a.text)
    .split(/\s+/)
    .length;

  const bWords = clean(b.text)
    .split(/\s+/)
    .length;

  if (aWords !== bWords) {
    return aWords - bWords;
  }

  return clean(a.text).localeCompare(
    clean(b.text),
  );
}

function dedupeCandidates(
  candidates: readonly MouthCandidate[],
): MouthCandidate[] {
  const seen =
    new Set<string>();

  const result: MouthCandidate[] =
    [];

  for (const candidate of candidates) {
    const text = clean(
      candidate.text,
    );

    if (!text) {
      continue;
    }

    const key = text.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(candidate);
  }

  return result;
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered =
    [...pools]
      .sort(
        (a, b) =>
          a.order -
          b.order,
      );

  if (!ordered.length) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  const width =
    Math.max(
      1,
      Math.floor(
        options.width ?? 12,
      ),
    );

  const candidatesPerBeat =
    Math.max(
      1,
      Math.floor(
        options.candidatesPerBeat ??
          8,
      ),
    );

  const chosen: MouthCandidate[] =
    [];

  /*
   * This remains intentionally deterministic.
   * There is no independent story search here.
   *
   * Each beat contributes its best already-authorized
   * candidate. The "beam" is compatibility infrastructure,
   * not a second Author.
   */
  for (
    let index = 0;
    index < ordered.length;
    index += 1
  ) {
    const pool =
      ordered[index];

    const eligible =
      dedupeCandidates(
        pool.candidates,
      )
        .filter(authorized)
        .sort(compareCandidates)
        .slice(
          0,
          Math.max(
            candidatesPerBeat,
            width,
          ),
        );

    if (!eligible.length) {
      return {
        candidates: [],
        texts: [],
        score: 0,
      };
    }

    const isFinal =
      index ===
      ordered.length - 1;

    /*
     * The final beat is special:
     *
     * If Candidate Search supplied an exact
     * endpoint candidate, it wins deterministically.
     *
     * This prevents a prettier paraphrase from
     * replacing QRE's canonical ending.
     */
    if (isFinal) {
      const exactEndpoint =
        eligible.find(
          (candidate) =>
            candidate.endpointExactness >=
            0.999,
        );

      if (exactEndpoint) {
        chosen.push(
          exactEndpoint,
        );
        continue;
      }
    }

    chosen.push(
      eligible[0],
    );
  }

  if (
    chosen.length !==
    ordered.length
  ) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  const scores =
    chosen.map(rank);

  const score =
    scores.length
      ? scores.reduce(
          (sum, value) =>
            sum + value,
          0,
        ) / scores.length
      : 0;

  return {
    candidates: chosen,
    texts: chosen.map(
      (candidate) =>
        clean(candidate.text),
    ),
    score: Number(
      clamp01(score).toFixed(3),
    ),
  };
}