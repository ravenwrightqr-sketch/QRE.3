import type {
  MouthCandidate,
  MouthCandidatePool,
  MouthBeamOptions,
  MouthSequencePath,
  ViewerStateCut,
} from "@qre/contracts";

/**
 * CANONICAL MOUTH SEQUENCE SEARCH
 *
 * The Beam does not invent meaning. It chooses among already-authorized
 * expressions and asks a simple question: which sequence makes the film
 * move most compellingly from cut to cut?
 */

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const tokenSet = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'’-]+/g)
      .filter((token) => token.length >= 3),
  );

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

function lexicalNovelty(text: string, prior: readonly MouthCandidate[]): number {
  if (!prior.length) return 1;
  const current = tokenSet(text);
  let max = 0;
  for (const item of prior) {
    const previous = tokenSet(item.text);
    if (!current.size || !previous.size) continue;
    let hits = 0;
    for (const token of current) if (previous.has(token)) hits += 1;
    max = Math.max(max, hits / current.size);
  }
  return metric(1 - max);
}

function stateFit(candidate: MouthCandidate, state: ViewerStateCut): number {
  const shift = Number(state.stateShift) || 0;
  const prediction = Number(state.predictionError) || 0;
  const curiosity = Number(state.curiosityPressure) || 0;
  const movement = Number(candidate.transitionScore) || 0;

  return metric(
    movement * 0.46 +
      shift * 0.22 +
      curiosity * 0.16 +
      prediction * 0.1 +
      (candidate.observerDiscoveryScore || 0) * 0.06,
  );
}

function cutRoleBonus(candidate: MouthCandidate, pool: MouthCandidatePool): number {
  const role = clean(pool.order === 1 ? "opening" : "cut").toLowerCase();
  void role;
  const final = Boolean(pool.nextPromise && /payoff|land|final|endpoint/i.test(pool.nextPromise));
  const discovery = candidate.observerDiscoveryScore;
  const implication = candidate.meaningScore;
  const standout = discovery >= 0.7 ? 0.12 : discovery >= 0.58 ? 0.06 : 0;
  return metric(final ? standout + implication * 0.05 : standout);
}

function transitionScore(
  candidate: MouthCandidate,
  prior: readonly MouthCandidate[],
  pool: MouthCandidatePool,
): number {
  const novelty = lexicalNovelty(candidate.text, prior);
  const state = stateFit(candidate, pool.viewerState);
  const priorDiscovery = prior.length
    ? prior[prior.length - 1].observerDiscoveryScore
    : 0;
  const contrast = Math.abs(candidate.observerDiscoveryScore - priorDiscovery);
  const connective = novelty >= 0.55 ? 0.12 : novelty >= 0.35 ? 0.06 : 0;

  return metric(
    state * 0.44 +
      candidate.meaningScore * 0.22 +
      candidate.observerDiscoveryScore * 0.18 +
      novelty * 0.08 +
      Math.min(1, contrast * 1.4) * 0.08 +
      connective,
  );
}

function pathScore(
  candidate: MouthCandidate,
  prior: readonly MouthCandidate[],
  pool: MouthCandidatePool,
): number {
  const transition = transitionScore(candidate, prior, pool);
  const novelty = lexicalNovelty(candidate.text, prior);
  const standout = candidate.observerDiscoveryScore >= 0.72 ? 0.08 : 0;
  const finalBonus = Boolean(pool.order > 0 && pool.nextPromise && /payoff|land|final|endpoint/i.test(pool.nextPromise))
    ? candidate.meaningScore * 0.05
    : 0;

  return metric(
    transition * 0.34 +
      candidate.score * 0.3 +
      candidate.meaningScore * 0.1 +
      candidate.observerDiscoveryScore * 0.11 +
      candidate.obligationCoverage * 0.05 +
      novelty * 0.04 +
      candidate.cohesionScore * 0.03 +
      cutRoleBonus(candidate, pool) * 0.03 +
      standout +
      finalBonus,
  );
}

function isSafe(candidate: MouthCandidate): boolean {
  return candidate.inventionRisk < 0.9 && candidate.forbiddenMoveRisk < 0.9;
}

/**
 * Candidate authorization is intentionally narrow:
 * safety first, then enough meaning to actually be an expression.
 * A literal source event may remain as a last-resort realization, but a thin
 * poetic label cannot win merely because it sounds cinematic.
 */
export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  if (!isSafe(candidate)) return false;
  if (candidate.endpointExactness >= 0.999) return true;
  if (candidate.supportedEventIds.length > 0) return true;
  if (candidate.meaningScore >= 0.25 && candidate.observerDiscoveryScore >= 0.2) return true;
  return false;
}

function dedupe(candidates: readonly MouthCandidate[]): MouthCandidate[] {
  const seen = new Set<string>();
  const result: MouthCandidate[] = [];
  for (const candidate of candidates) {
    const key = clean(candidate.text).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

type Path = {
  candidates: MouthCandidate[];
  score: number;
};

function finalPathQuality(path: Path, pools: readonly MouthCandidatePool[]): number {
  if (!path.candidates.length) return 0;
  const average = path.score / path.candidates.length;
  const discoveries = path.candidates.map((candidate) => candidate.observerDiscoveryScore);
  const peak = Math.max(...discoveries);
  const weakest = Math.min(...discoveries);
  const finalPool = pools[pools.length - 1];
  const finalCandidate = path.candidates[path.candidates.length - 1];
  const finalStrength = finalPool && finalCandidate
    ? pathScore(finalCandidate, path.candidates.slice(0, -1), finalPool)
    : 0;
  return metric(
    average * 0.46 +
      peak * 0.17 +
      weakest * 0.09 +
      finalStrength * 0.16 +
      finalCandidate.meaningScore * 0.08 +
      finalCandidate.obligationCoverage * 0.04,
  );
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };

  if (ordered.some((pool) => !pool.viewerState || typeof pool.viewerState !== "object")) {
    return { candidates: [], texts: [], score: 0 };
  }

  const width = Math.max(1, Math.floor(options.width ?? 8));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  const debug = process.env.QRE_AUTHOR_DEBUG_BEAM === "true";

  let paths: Path[] = [{ candidates: [], score: 0 }];

  for (const pool of ordered) {
    const eligible = dedupe(pool.candidates)
      .filter(isAuthorizedMouthCandidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(perBeat, width));

    if (!eligible.length) return { candidates: [], texts: [], score: 0 };

    const expanded: Path[] = [];
    for (const path of paths) {
      for (const candidate of eligible) {
        const exactRepeat = path.candidates.some(
          (prior) => clean(prior.text).toLowerCase() === clean(candidate.text).toLowerCase(),
        );
        if (exactRepeat) continue;

        const increment = pathScore(candidate, path.candidates, pool);
        expanded.push({
          candidates: [...path.candidates, candidate],
          score: path.score + increment,
        });

        if (debug) {
          console.log(`[QRE][MOUTH-BEAM] ${JSON.stringify({
            order: pool.order,
            text: candidate.text,
            candidateScore: candidate.score,
            discovery: candidate.observerDiscoveryScore,
            meaning: candidate.meaningScore,
            increment,
          })}`);
        }
      }
    }

    expanded.sort((a, b) => {
      const aq = finalPathQuality(a, ordered.slice(0, a.candidates.length));
      const bq = finalPathQuality(b, ordered.slice(0, b.candidates.length));
      return bq - aq || b.score - a.score;
    });
    paths = expanded.slice(0, width);
  }

  paths.sort((a, b) => finalPathQuality(b, ordered) - finalPathQuality(a, ordered) || b.score - a.score);
  const best = paths[0];
  if (!best) return { candidates: [], texts: [], score: 0 };

  return {
    candidates: best.candidates,
    texts: best.candidates.map((candidate) => clean(candidate.text)),
    score: finalPathQuality(best, ordered),
  };
}
