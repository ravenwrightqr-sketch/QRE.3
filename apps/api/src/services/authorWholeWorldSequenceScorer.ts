/**
 * QRE WHOLE-WORLD SEQUENCE SCORER
 *
 * A sequence film is a film of the supplied world, not a highlight reel
 * dominated by whichever fact happens to be most salient.
 *
 * This scorer is deliberately domain-neutral.
 * It rewards breadth of meaningful evidence, movement across semantic
 * territory, source-order coherence, and recoverable callbacks. It penalizes
 * uninterrupted semantic camping without requiring complete source coverage.
 *
 * IMPORTANT:
 * - It never creates facts.
 * - It never requires all facts to appear.
 * - It does not treat input order as chronology.
 */

import type {
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

function tokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function overlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;

  let hits = 0;
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }

  return hits / Math.max(1, Math.min(a.size, b.size));
}

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function uniqueEventIds(candidate: LatentMovieCandidate): string[] {
  return [...new Set(candidate.trajectory.flatMap((step) => step.eventIds))];
}

function sequenceLengthValue(length: number): number {
  if (length <= 0) return 0;
  if (length === 1) return 0.22;
  if (length === 2) return 0.46;
  if (length === 3) return 0.68;
  if (length <= 6) return 1;
  if (length <= 8) return 0.94;
  if (length <= 10) return 0.84;
  return Math.max(0.46, 1 - (length - 10) * 0.06);
}

function breadthValue(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): number {
  const total = graph.events.filter((event) => clean(event.label)).length;
  if (!total) return 0;

  const uniqueCount = uniqueEventIds(candidate).length;

  // Breadth saturates early. This deliberately avoids turning the score into
  // a source-coverage quota: a great six-cut film can beat a dull eight-cut
  // enumeration even when more supplied material remains unused.
  const saturation = 1 - Math.exp(-uniqueCount / 4);
  const worldScale = Math.min(1, total / 6);

  return metric(saturation * 0.78 + worldScale * 0.22);
}

function sourceOrderValue(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): number {
  const positions = new Map(
    graph.events.map((event, index) => [event.id, index]),
  );

  const ids = uniqueEventIds(candidate);
  if (ids.length < 2) return 0.5;

  let measured = 0;
  let forward = 0;

  for (let index = 1; index < ids.length; index += 1) {
    const previous = positions.get(ids[index - 1]!);
    const current = positions.get(ids[index]!);
    if (previous === undefined || current === undefined) continue;

    measured += 1;
    if (current > previous) forward += 1;
  }

  if (!measured) return 0.5;

  const forwardRate = forward / measured;

  // Source order is gravity, never a rail. An intentionally reordered film
  // therefore retains a neutral baseline rather than being rejected.
  return metric(0.5 + Math.abs(forwardRate - 0.5) * 0.55);
}

function territoryMovementValue(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): number {
  const steps = candidate.trajectory;
  if (steps.length < 2) return 0.45;

  let total = 0;
  let measured = 0;

  for (let index = 1; index < steps.length; index += 1) {
    const previousLabels = steps[index - 1]!.eventIds
      .map((id) => eventLabel(graph, id))
      .filter(Boolean);
    const currentLabels = steps[index]!.eventIds
      .map((id) => eventLabel(graph, id))
      .filter(Boolean);

    if (!previousLabels.length || !currentLabels.length) continue;

    const similarity = Math.max(
      ...previousLabels.flatMap((previous) =>
        currentLabels.map((current) => overlap(previous, current)),
      ),
    );

    total += 1 - similarity;
    measured += 1;
  }

  return measured ? metric(total / measured) : 0.45;
}

function campingPenalty(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): number {
  const ids = uniqueEventIds(candidate);
  if (ids.length < 2) return 0;

  let consecutiveCamping = 0;
  let longestRun = 0;
  let run = 0;

  for (let index = 1; index < ids.length; index += 1) {
    const similarity = overlap(
      eventLabel(graph, ids[index - 1]!),
      eventLabel(graph, ids[index]!),
    );

    if (similarity >= 0.62) {
      run += 1;
      consecutiveCamping += 1;
      longestRun = Math.max(longestRun, run);
    } else {
      run = 0;
    }
  }

  return metric(
    Math.min(
      1,
      consecutiveCamping * 0.16 +
        Math.max(0, longestRun - 1) * 0.22,
    ),
  );
}

function operatorDiversity(candidate: LatentMovieCandidate): number {
  const meaningful = candidate.trajectory
    .map((step) => step.operation)
    .filter(Boolean);

  const unique = new Set(meaningful).size;
  if (!meaningful.length) return 0;

  return metric(Math.min(1, unique / Math.min(4, meaningful.length)));
}

export type WholeWorldSequenceScore = {
  breadth: number;
  sourceOrder: number;
  territoryMovement: number;
  operatorDiversity: number;
  campingPenalty: number;
  shape: number;
  score: number;
};

export function scoreWholeWorldSequence(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): WholeWorldSequenceScore {
  const breadth = breadthValue(graph, candidate);
  const sourceOrder = sourceOrderValue(graph, candidate);
  const territoryMovement = territoryMovementValue(graph, candidate);
  const operatorDiversityValue = operatorDiversity(candidate);
  const camping = campingPenalty(graph, candidate);
  const shape = sequenceLengthValue(candidate.trajectory.length);

  return {
    breadth,
    sourceOrder,
    territoryMovement,
    operatorDiversity: operatorDiversityValue,
    campingPenalty: camping,
    shape,
    score: metric(
      breadth * 0.26 +
        shape * 0.22 +
        territoryMovement * 0.20 +
        sourceOrder * 0.10 +
        operatorDiversityValue * 0.10 +
        (1 - camping) * 0.12,
    ),
  };
}
