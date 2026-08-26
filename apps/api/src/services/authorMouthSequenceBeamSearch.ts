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
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

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
  const hasSupportedEvents = candidate.supportedEventIds.length > 0;
  const hasEndpoint = candidate.endpointExactness >= 0.999;
  const hasSemanticAuthorization = candidate.reasons.includes(
    "semantic-turn-grounded",
  );

  return (
    hasGrounding ||
    hasSupportedEvents ||
    hasEndpoint ||
    hasSemanticAuthorization
  );
}

function semanticQuality(candidate: MouthCandidate): number {
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

function authorizationQuality(candidate: MouthCandidate): number {
  let value = 0;

  if (candidate.supportedEventIds.length > 0) value += 0.35;
  if (candidate.supportedRelationPairs.length > 0) value += 0.25;
  if (candidate.groundingScore >= 0.8) value += 0.2;
  else if (candidate.groundingScore >= 0.5) value += 0.1;
  if (candidate.reasons.includes("semantic-turn-grounded")) value += 0.2;

  return clamp01(value);
}

function rank(candidate: MouthCandidate): number {
  const inventionSafety =
    1 - Math.max(candidate.inventionRisk, candidate.forbiddenMoveRisk);
  const authorization = authorizationQuality(candidate);
  const semantic = semanticQuality(candidate);
  const endpoint = candidate.endpointExactness >= 0.999 ? 1 : 0;

  return clamp01(
    inventionSafety * 0.28 +
      authorization * 0.24 +
      semantic * 0.40 +
      endpoint * 0.08,
  );
}

function compareCandidates(a: MouthCandidate, b: MouthCandidate): number {
  const rankDelta = rank(b) - rank(a);
  if (rankDelta !== 0) return rankDelta;

  if (a.endpointExactness !== b.endpointExactness) {
    return b.endpointExactness - a.endpointExactness;
  }

  if (a.supportedEventIds.length !== b.supportedEventIds.length) {
    return b.supportedEventIds.length - a.supportedEventIds.length;
  }

  if (a.groundingScore !== b.groundingScore) {
    return b.groundingScore - a.groundingScore;
  }

  const aWords = clean(a.text).split(/\s+/).length;
  const bWords = clean(b.text).split(/\s+/).length;
  if (aWords !== bWords) return aWords - bWords;

  return clean(a.text).localeCompare(clean(b.text));
}

function dedupeCandidates(candidates: readonly MouthCandidate[]): MouthCandidate[] {
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
 * Sequence-level Mouth quality.
 *
 * The existing candidate score answers "is this line good?".
 * This answers the missing product question: "is this still good
 * after the lines that came before it?"
 *
 * We reward selective continuity and penalize re-announcement,
 * paraphrase, and lexical echo. We deliberately do not punish
 * legitimate callback words when they produce a changed meaning.
 */
function sequenceFit(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
): number {
  if (!priorTexts.length) return 0.64;

  const current = tokenSet(candidate.text);
  const previous = priorTexts.map(tokenSet);
  const latest = previous[previous.length - 1];

  const latestOverlap = overlap(current, latest);
  const maxOverlap = Math.max(
    ...previous.map((tokens) => overlap(current, tokens)),
  );

  const exactRepeat = previous.some(
    (text) => clean(text).toLowerCase() === clean(candidate.text).toLowerCase(),
  );

  if (exactRepeat) return 0;

  /*
   * A very high lexical overlap usually means the Mouth is simply
   * restating the previous cut. Moderate overlap is useful: callbacks,
   * established subjects, and recurring details need some shared words.
   */
  const restatementPenalty =
    latestOverlap >= 0.78
      ? 0.44
      : latestOverlap >= 0.62
        ? 0.24
        : maxOverlap >= 0.82
          ? 0.2
          : 0;

  const callbackSweetSpot =
    latestOverlap >= 0.18 && latestOverlap <= 0.52
      ? 0.16
      : 0;

  const selectiveTurn =
    candidate.reasons.includes("semantic-turn-grounded") &&
    latestOverlap < 0.75
      ? 0.12
      : 0;

  return clamp01(
    0.62 + callbackSweetSpot + selectiveTurn - restatementPenalty,
  );
}

function pathScore(
  candidate: MouthCandidate,
  priorTexts: readonly string[],
): number {
  const base = rank(candidate);
  const sequence = sequenceFit(candidate, priorTexts);

  return clamp01(
    base * 0.76 +
      sequence * 0.24,
  );
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);

  if (!ordered.length) {
    return { candidates: [], texts: [], score: 0 };
  }

  const width = Math.max(1, Math.floor(options.width ?? 12));
  const candidatesPerBeat = Math.max(
    1,
    Math.floor(options.candidatesPerBeat ?? 8),
  );

  type Path = {
    candidates: MouthCandidate[];
    score: number;
  };

  let paths: Path[] = [{ candidates: [], score: 0 }];

  for (let index = 0; index < ordered.length; index += 1) {
    const pool = ordered[index];

    const eligible = dedupeCandidates(pool.candidates)
      .filter(authorized)
      .sort(compareCandidates)
      .slice(0, Math.max(candidatesPerBeat, width));

    if (!eligible.length) {
      return { candidates: [], texts: [], score: 0 };
    }

    const expanded: Path[] = [];

    for (const path of paths) {
      for (const candidate of eligible) {
        const priorTexts = path.candidates.map((item) => clean(item.text));
        const isFinal = index === ordered.length - 1;

        if (isFinal && candidate.endpointExactness >= 0.999) {
          expanded.push({
            candidates: [...path.candidates, candidate],
            score: path.score + 1.15,
          });
          continue;
        }

        expanded.push({
          candidates: [...path.candidates, candidate],
          score: path.score + pathScore(candidate, priorTexts),
        });
      }
    }

    expanded.sort((a, b) => b.score - a.score);
    paths = expanded.slice(0, width);
  }

  if (!paths.length) {
    return { candidates: [], texts: [], score: 0 };
  }

  const best = paths[0];
  const average = best.candidates.length
    ? best.score / best.candidates.length
    : 0;

  return {
    candidates: best.candidates,
    texts: best.candidates.map((candidate) => clean(candidate.text)),
    score: Number(clamp01(average).toFixed(3)),
  };
}
