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
 *   8. sequence continuity
 *   9. endpoint exactness
 *
 * The beam does not decide what the movie is.
 * It chooses among candidates already authorized by Mouth Candidate Search,
 * while evaluating them as a connected sequence rather than isolated lines.
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

const tokenSet = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) hits += 1;
  }

  return hits / Math.max(1, a.size);
}

/**
 * A candidate is eligible only when it is safe and has some explicit
 * grounding/authorization signal.
 *
 * Semantic compression is not required to preserve source wording.
 */
function authorized(candidate: MouthCandidate): boolean {
  const text = clean(candidate.text);

  if (!text) return false;

  if (
    candidate.inventionRisk >= 0.35 ||
    candidate.forbiddenMoveRisk >= 0.35
  ) {
    return false;
  }

  const hasGrounding = candidate.groundingScore >= 0.5;
  const hasSupportedEvents =
    candidate.supportedEventIds.length > 0;
  const hasEndpoint =
    candidate.endpointExactness >= 0.999;
  const hasSemanticAuthorization =
    candidate.reasons.includes("semantic-turn-grounded");
  const hasCreativeAuthorization =
    candidate.reasons.includes("bounded-creative-bet");

  return (
    hasGrounding ||
    hasSupportedEvents ||
    hasEndpoint ||
    hasSemanticAuthorization ||
    hasCreativeAuthorization
  );
}

/**
 * General semantic quality. This remains secondary to explicit semantic
 * authorization; it must not overpower provenance.
 */
function semanticQuality(candidate: MouthCandidate): number {
  const creativeLift = candidate.reasons.includes(
    "bounded-creative-bet",
  )
    ? 0.12
    : 0;

  return clamp01(
    candidate.meaningScore * 0.24 +
      candidate.transitionScore * 0.2 +
      candidate.groundingScore * 0.18 +
      candidate.obligationCoverage * 0.1 +
      candidate.compressionScore * 0.08 +
      candidate.cohesionScore * 0.05 +
      candidate.noveltyScore * 0.05 +
      creativeLift,
  );
}

/**
 * Authorization quality is provenance evidence, not lexical similarity.
 */
function authorizationQuality(candidate: MouthCandidate): number {
  let value = 0;

  if (candidate.supportedEventIds.length > 0) {
    value += 0.35;
  }

  if (candidate.supportedRelationPairs.length > 0) {
    value += 0.25;
  }

  if (candidate.groundingScore >= 0.8) {
    value += 0.2;
  } else if (candidate.groundingScore >= 0.5) {
    value += 0.1;
  }

  if (
    candidate.reasons.includes(
      "semantic-turn-grounded",
    )
  ) {
    value += 0.2;
  }

  if (
    candidate.reasons.includes(
      "bounded-creative-bet",
    )
  ) {
    value += 0.16;
  }

  return clamp01(value);
}

/**
 * Semantic compression is an explicit realization mode.
 *
 * It must outrank ordinary lexical advantage when both candidates are safe.
 */
function isSemanticGold(candidate: MouthCandidate): boolean {
  return candidate.reasons.includes(
    "semantic-compression",
  );
}

function isCreativeGold(candidate: MouthCandidate): boolean {
  return candidate.reasons.includes(
    "bounded-creative-bet",
  );
}
function isDistinctiveGold(
  candidate: MouthCandidate,
): boolean {
  return candidate.reasons.includes(
    "distinctive-realization",
  );
}
function isSafe(candidate: MouthCandidate): boolean {
  return (
    candidate.inventionRisk < 0.35 &&
    candidate.forbiddenMoveRisk < 0.35
  );
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
    semanticQuality(
      candidate,
    );

  const endpoint =
    candidate.endpointExactness >= 0.999
      ? 1
      : 0;

  const semanticGold =
    isSemanticGold(candidate)
      ? 1
      : 0;

  const creativeGold =
    isCreativeGold(candidate)
      ? 1
      : 0;

  const distinctiveGold =
    isDistinctiveGold(candidate)
      ? 1
      : 0;

  return clamp01(
    inventionSafety * 0.24 +
      semanticGold * 0.30 +
      creativeGold * 0.13 +
      distinctiveGold * 0.13 +
      authorization * 0.12 +
      semantic * 0.08,
  );
}
function compareCandidates(
  a: MouthCandidate,
  b: MouthCandidate,
): number {
const aSemantic = isSemanticGold(a);
const bSemantic = isSemanticGold(b);

const aDistinctive =
  isDistinctiveGold(a);

const bDistinctive =
  isDistinctiveGold(b);

  const aSafe = isSafe(a);
  const bSafe = isSafe(b);

 if (
  aSafe &&
  bSafe
) {
  const aGoldLevel =
    (aSemantic ? 1 : 0) +
    (aDistinctive ? 1 : 0);

  const bGoldLevel =
    (bSemantic ? 1 : 0) +
    (bDistinctive ? 1 : 0);

  if (
    aGoldLevel !==
    bGoldLevel
  ) {
    return (
      bGoldLevel -
      aGoldLevel
    );
  }
}
  const rankDelta = rank(b) - rank(a);

  if (rankDelta !== 0) {
    return rankDelta;
  }

  if (
    a.endpointExactness !==
    b.endpointExactness
  ) {
    return (
      b.endpointExactness -
      a.endpointExactness
    );
  }

  const aCreative =
    isCreativeGold(a);

  const bCreative =
    isCreativeGold(b);

  if (aCreative !== bCreative) {
    return bCreative ? 1 : -1;
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

  const aWords =
    clean(a.text).split(/\s+/).filter(Boolean)
      .length;

  const bWords =
    clean(b.text).split(/\s+/).filter(Boolean)
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
  const seen = new Set<string>();
  const result: MouthCandidate[] = [];

  for (const candidate of candidates) {
    const text = clean(candidate.text);

    if (!text) continue;

    const key = text.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(candidate);
  }

  return result;
}

/**
 * Sequence continuity rewards useful callbacks and turns while discouraging
 * exact repetition and excessive lexical restatement.
 */
function sequenceFit(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
): number {
  if (!priorTexts.length) {
    return 0.64;
  }

  const current = tokenSet(
    candidate.text,
  );

  const previous =
    priorTexts.map(tokenSet);

  const latest =
    previous[previous.length - 1];

  const latestOverlap =
    overlap(current, latest);

  const maxOverlap =
    Math.max(
      ...previous.map((text) =>
        overlap(current, text),
      ),
    );

  const exactRepeat =
    previous.some(
      (text) =>
        clean(text).toLowerCase() ===
        clean(candidate.text).toLowerCase(),
    );

  if (exactRepeat) {
    return 0;
  }

  const restatementPenalty =
    latestOverlap >= 0.78
      ? 0.44
      : latestOverlap >= 0.62
        ? 0.24
        : maxOverlap >= 0.82
          ? 0.2
          : 0;

  const callbackSweetSpot =
    latestOverlap >= 0.18 &&
    latestOverlap <= 0.52
      ? 0.16
      : 0;

  const selectiveTurn =
    candidate.reasons.includes(
      "semantic-turn-grounded",
    ) &&
    latestOverlap < 0.75
      ? 0.12
      : 0;

  const creativeTurn =
    candidate.reasons.includes(
      "bounded-creative-bet",
    ) &&
    latestOverlap < 0.75
      ? 0.1
      : 0;

  return clamp01(
    0.62 +
      callbackSweetSpot +
      selectiveTurn +
      creativeTurn -
      restatementPenalty,
  );
}

/**
 * Path score combines candidate quality with how well that realization fits
 * the cuts that came immediately before it.
 *
 * Explicit semantic authorization gets an additional path-level priority.
 * This is the important distinction: provenance is evaluated where the
 * candidate actually competes for path survival, not merely when candidates
 * are pre-sorted.
 */
function pathCandidateScore(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
  hasLiteralAlternative: boolean,
  fireAlreadyUsed: boolean,
): number {

    const firePriority =
    isDistinctiveGold(candidate) &&
    !fireAlreadyUsed
      ? 0.18
      : 0;
  const fit =
    sequenceFit(
      candidate,
      priorTexts,
    );

  const semanticPriority =
  isSemanticGold(candidate) &&
  hasLiteralAlternative
    ? 0.28
    : 0;

const distinctivePriority =
  isDistinctiveGold(candidate)
    ? 0.12
    : 0;

  /*
   * Endpoint exactness is deliberately small. A literal endpoint cannot
   * overpower a semantically authorized realization.
   */
  const endpointPriority =
    candidate.endpointExactness >= 0.999 &&
    !isSemanticGold(candidate)
      ? 0.04
      : 0;

   return clamp01(
  rank(candidate) * 0.64 +
    fit * 0.24 +
    semanticPriority +
    distinctivePriority +
    firePriority +
    endpointPriority,
); 
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered = [...pools].sort(
    (a, b) => a.order - b.order,
  );

  if (!ordered.length) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  const width = Math.max(
    1,
    Math.floor(options.width ?? 12),
  );

  const candidatesPerBeat =
    Math.max(
      1,
      Math.floor(
        options.candidatesPerBeat ?? 8,
      ),
    );

  type Path = {
    candidates: MouthCandidate[];
    score: number;
  };

  let paths: Path[] = [
    {
      candidates: [],
      score: 0,
    },
  ];

  for (
    let index = 0;
    index < ordered.length;
    index += 1
  ) {
    const pool = ordered[index];

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

    const hasLiteralAlternative =
      eligible.some(
        (candidate) =>
          !isSemanticGold(candidate),
      );

    const expanded: Path[] = [];

    for (const path of paths) {
      const priorTexts =
        path.candidates.map(
          (candidate) =>
            clean(candidate.text),
        );

      for (
        const candidate of eligible
      ) {
        const exactRepeat =
          path.candidates.some(
            (prior) =>
              clean(
                prior.text,
              ).toLowerCase() ===
              clean(
                candidate.text,
              ).toLowerCase(),
          );

        if (exactRepeat) {
          continue;
        }
        
         const fireAlreadyUsed =
          path.candidates.some(
            (prior) =>
              isDistinctiveGold(prior),
          );

        const candidateScore =
          pathCandidateScore(
            candidate,
            priorTexts,
            hasLiteralAlternative,
            fireAlreadyUsed,
          );

        expanded.push({
          candidates: [
            ...path.candidates,
            candidate,
          ],
          score:
            path.score +
            candidateScore,
        });
      }
    }

    expanded.sort(
      (a, b) => b.score - a.score,
    );

    paths = expanded.slice(
      0,
      width,
    );
  }

  if (!paths.length) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  const best = paths[0];

  const average =
    best.candidates.length
      ? best.score /
        best.candidates.length
      : 0;

  return {
    candidates:
      best.candidates,

    texts:
      best.candidates.map(
        (candidate) =>
          clean(candidate.text),
      ),

    score: Number(
      clamp01(average).toFixed(3),
    ),
  };
}