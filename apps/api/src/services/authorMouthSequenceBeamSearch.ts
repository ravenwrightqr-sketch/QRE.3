/**
 * QRE MOUTH SEQUENCE BEAM SEARCH · DETERMINISTIC EDITOR
 *
 * Per-beat candidate ranking is insufficient: a line can be excellent alone and
 * destroy the sequence. This layer searches combinations of otherwise valid
 * mouth candidates and selects the strongest cumulative realization.
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

function candidateTransition(
  previous: MouthCandidate,
  current: MouthCandidate,
): number {
  const sharedEvents = previous.supportedEventIds.filter((id) =>
    current.supportedEventIds.includes(id),
  ).length;

  const newEvents = current.supportedEventIds.filter(
    (id) => !previous.supportedEventIds.includes(id),
  ).length;

  const relationContinuity = current.supportedRelationPairs.some((pair) => {
    const [from, to] = pair.split("->");
    return (
      previous.supportedEventIds.includes(from) ||
      previous.supportedEventIds.includes(to)
    );
  })
    ? 1
    : 0;

  const languageContinuity = metric(
    overlap(
      tokenSet(previous.text),
      tokenSet(current.text),
    ),
  );

  return metric(
    sharedEvents * 0.08 +
      Math.min(newEvents, 2) * 0.12 +
      relationContinuity * 0.18 +
      languageContinuity * 0.08,
  );
}

function repeatedEvidencePenalty(
  path: MouthCandidate[],
  candidate: MouthCandidate,
): number {
  const previousIds = new Set(
    path.flatMap((item) => item.supportedEventIds),
  );

  if (!candidate.supportedEventIds.length) return 0.12;

  const repeated = candidate.supportedEventIds.filter((id) =>
    previousIds.has(id),
  ).length;

  return metric(
    repeated / Math.max(1, candidate.supportedEventIds.length),
  );
}

function signature(path: MouthCandidate[]): string {
  return path
    .map((candidate) => clean(candidate.text).toLowerCase())
    .join("|");
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  options: MouthBeamOptions = {},
): MouthSequencePath {
  const width = Math.max(1, Math.min(options.width ?? 8, 32));
  const perBeat = Math.max(
    1,
    Math.min(options.candidatesPerBeat ?? 8, 16),
  );

  let beam: MouthSequencePath[] = [{
    candidates: [],
    texts: [],
    score: 0,
  }];

  for (const pool of [...pools].sort((a, b) => a.order - b.order)) {
    const candidates = [...pool.candidates]
      .sort((a, b) => b.score - a.score)
      .slice(0, perBeat);

    const expanded: MouthSequencePath[] = [];

    for (const path of beam) {
      for (const candidate of candidates) {
        const previous = path.candidates[path.candidates.length - 1];
        const transition = previous
          ? candidateTransition(previous, candidate)
          : 0.2;
        const repetition = repeatedEvidencePenalty(
          path.candidates,
          candidate,
        );
        const evidenceGain =
          candidate.supportedEventIds.filter(
            (id) =>
              !path.candidates.some((prior) =>
                prior.supportedEventIds.includes(id),
              ),
          ).length > 0
            ? 0.1
            : 0;

        expanded.push({
          candidates: [...path.candidates, candidate],
          texts: [...path.texts, candidate.text],
          score:
            path.score +
            candidate.score * 0.68 +
            transition * 0.2 +
            evidenceGain -
            repetition * 0.08,
        });
      }
    }

    const deduped = new Map<string, MouthSequencePath>();
    for (const path of expanded) {
      const key = signature(path.candidates);
      const existing = deduped.get(key);
      if (!existing || path.score > existing.score) {
        deduped.set(key, path);
      }
    }

    beam = [...deduped.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, width);
  }

  const best = beam[0];
  if (!best) {
    return {
      candidates: [],
      texts: [],
      score: 0,
    };
  }

  return {
    ...best,
    score: metric(best.score / Math.max(1, pools.length)),
  };
}
