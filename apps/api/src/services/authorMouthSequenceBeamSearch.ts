/**
 * STATUS: COMPATIBILITY
 * ROLE: Select one already-grounded language candidate per approved beat.
 * MUST NOT: invent, plan, or reject grounded source language because it is literal.
 * The historical "beam" name remains only for compatibility with the master Author.
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

function legal(candidate: MouthCandidate): boolean {
  return Boolean(
    clean(candidate.text) &&
    candidate.inventionRisk < 0.35 &&
    candidate.forbiddenMoveRisk < 0.35 &&
    candidate.groundingScore >= 0.5,
  );
}

function rank(candidate: MouthCandidate): number {
  const safety = 1 - Math.max(candidate.inventionRisk, candidate.forbiddenMoveRisk);
  const semantic =
    candidate.meaningScore * 0.25 +
    candidate.transitionScore * 0.2 +
    candidate.groundingScore * 0.25 +
    candidate.compressionScore * 0.15 +
    candidate.noveltyScore * 0.1 +
    candidate.cohesionScore * 0.05;
  const endpoint = candidate.endpointExactness * 0.2;
  return safety * 0.35 + semantic * 0.65 + endpoint;
}

export function selectBestMouthSequence(
  pools: readonly MouthCandidatePool[],
  _options: MouthBeamOptions = {},
): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  const chosen: MouthCandidate[] = [];

  for (const pool of ordered) {
    const candidates = pool.candidates
      .filter(legal)
      .sort((a, b) => rank(b) - rank(a));

    if (!candidates.length) {
      return { candidates: [], texts: [], score: 0 };
    }

    chosen.push(candidates[0]);
  }

  const score = chosen.length
    ? chosen.reduce((sum, candidate) => sum + rank(candidate), 0) / chosen.length
    : 0;

  return {
    candidates: chosen,
    texts: chosen.map((candidate) => clean(candidate.text)),
    score: Number(Math.max(0, Math.min(1, score)).toFixed(3)),
  };
}
