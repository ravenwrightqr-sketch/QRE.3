/**
 * QRE VIEWER-STATE TRAJECTORY SCORING
 *
 * Deterministic, pre-language evaluation of how a candidate trajectory changes
 * the viewer from cut to cut. This is interpretation metadata, never reality.
 *
 * IMPORTANT: operation names are weak descriptors only. The score primarily
 * measures change in evidence, expectation, salience, unresolved questions,
 * continuity, and trajectory rhythm. A trajectory cannot win merely by naming
 * more "reframe" or "contrast" operations.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
} from "@qre/contracts";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function eventLabel(graph: RealityGraph, id: string): string {
  return graph.events.find((event) => event.id === id)?.label ?? "";
}

function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9'-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function overlap(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function eventNovelty(
  previous: LatentMovieTrajectoryStep,
  current: LatentMovieTrajectoryStep,
): number {
  if (!current.eventIds.length) return 0;
  const prior = new Set(previous.eventIds);
  const newEvents = current.eventIds.filter((id) => !prior.has(id)).length;
  return metric(newEvents / Math.max(1, current.eventIds.length));
}

function relationNovelty(
  candidate: LatentMovieCandidate,
  index: number,
): number {
  const prior = new Set(
    candidate.trajectory
      .slice(0, index)
      .flatMap((step) => step.eventIds),
  );
  const current = candidate.trajectory[index]!;
  const newEvents = current.eventIds.filter((id) => !prior.has(id)).length;
  return metric(newEvents / Math.max(1, current.eventIds.length));
}

function semanticChange(
  previous: LatentMovieTrajectoryStep,
  current: LatentMovieTrajectoryStep,
): number {
  const viewerOverlap = overlap(previous.viewerChange, current.viewerChange);
  const questionOverlap = overlap(previous.nextQuestion, current.nextQuestion);
  const eventDelta = eventNovelty(previous, current);
  return metric(
    (1 - viewerOverlap) * 0.36 +
    (1 - questionOverlap) * 0.22 +
    eventDelta * 0.42,
  );
}

function predictionError(
  previous: LatentMovieTrajectoryStep,
  current: LatentMovieTrajectoryStep,
): number {
  const expected = tokenSet(previous.nextQuestion);
  const actual = tokenSet(current.viewerChange);
  if (!expected.size || !actual.size) return eventNovelty(previous, current) * 0.7;

  let hits = 0;
  for (const token of expected) if (actual.has(token)) hits += 1;
  const match = hits / Math.max(1, Math.min(expected.size, actual.size));
  const surprise = 1 - match;

  return metric(
    surprise * 0.62 +
    eventNovelty(previous, current) * 0.38,
  );
}

function attentionChange(
  candidate: LatentMovieCandidate,
): number {
  const trajectory = candidate.trajectory;
  if (trajectory.length < 2) return trajectory.length ? 0.46 : 0;

  let total = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]!;
    const current = trajectory[index]!;
    const semantic = semanticChange(previous, current);
    const prediction = predictionError(previous, current);
    const eventDelta = eventNovelty(previous, current);
    total += semantic * 0.42 + prediction * 0.33 + eventDelta * 0.25;
  }

  return metric(total / Math.max(1, trajectory.length - 1));
}

function curiosity(
  trajectory: readonly LatentMovieTrajectoryStep[],
): number {
  if (!trajectory.length) return 0;
  const questions = unique(
    trajectory
      .map((step) => step.nextQuestion.toLowerCase().trim())
      .filter(Boolean),
  );
  const unresolved = trajectory.filter((step) => step.nextQuestion.trim().length > 0).length;
  const distinctQuestions = Math.min(1, questions.length / Math.max(1, trajectory.length));
  const openRate = unresolved / Math.max(1, trajectory.length);

  return metric(
    distinctQuestions * 0.48 +
    openRate * 0.22 +
    (trajectory.some((step) => /what|why|how|what now|what becomes/i.test(step.nextQuestion)) ? 0.3 : 0),
  );
}

function contrast(
  candidate: LatentMovieCandidate,
): number {
  const trajectory = candidate.trajectory;
  if (trajectory.length < 2) return 0;

  let total = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]!;
    const current = trajectory[index]!;
    const shift = semanticChange(previous, current);
    const eventDelta = eventNovelty(previous, current);
    total += shift * 0.65 + eventDelta * 0.35;
  }
  return metric(total / Math.max(1, trajectory.length - 1));
}

function interruption(
  candidate: LatentMovieCandidate,
): number {
  const trajectory = candidate.trajectory;
  if (trajectory.length < 2) return 0;

  let jumps = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]!;
    const current = trajectory[index]!;
    const eventDelta = eventNovelty(previous, current);
    const prediction = predictionError(previous, current);
    if (eventDelta > 0.5 || prediction > 0.62) jumps += 1;
  }

  return metric(jumps / Math.max(1, trajectory.length - 1));
}

function continuity(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
): number {
  if (trajectory.length < 2) return trajectory.length ? 0.7 : 0;

  let carried = 0;
  let measured = 0;
  const established = new Set<string>();

  for (let index = 0; index < trajectory.length; index += 1) {
    const step = trajectory[index]!;
    const priorKnown = step.eventIds.filter((id) => established.has(id)).length;
    const signalCarry = step.eventIds.length
      ? priorKnown / Math.max(1, step.eventIds.length)
      : 0;

    if (index > 0) {
      measured += 1;
      carried += signalCarry;
    }

    for (const id of step.eventIds) established.add(id);
  }

  const recurrent = graph.recurringSignals.length
    ? trajectory.reduce((sum, step) => {
        const labels = step.eventIds.map((id) => eventLabel(graph, id));
        const hit = Math.max(
          0,
          ...graph.recurringSignals.map((signal) =>
            Math.max(0, ...labels.map((label) => overlap(label, signal))),
          ),
        );
        return sum + hit;
      }, 0) / Math.max(1, trajectory.length)
    : 0;

  const tensionCarry = graph.unresolvedTensions.length
    ? trajectory.reduce((sum, step) => {
        const labels = step.eventIds.map((id) => eventLabel(graph, id));
        const hit = Math.max(
          0,
          ...graph.unresolvedTensions.map((tension) =>
            Math.max(0, ...labels.map((label) => overlap(label, tension))),
          ),
        );
        return sum + hit;
      }, 0) / Math.max(1, trajectory.length)
    : 0;

  return metric(
    (measured ? carried / measured : 0.55) * 0.62 +
    recurrent * 0.2 +
    tensionCarry * 0.18,
  );
}

function tempo(
  candidate: LatentMovieCandidate,
): number {
  const trajectory = candidate.trajectory;
  if (trajectory.length < 2) return 0.5;

  const deltas: number[] = [];
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]!;
    const current = trajectory[index]!;
    deltas.push(
      metric(
        semanticChange(previous, current) * 0.55 +
        predictionError(previous, current) * 0.3 +
        eventNovelty(previous, current) * 0.15,
      ),
    );
  }

  const mean = deltas.reduce((sum, value) => sum + value, 0) / Math.max(1, deltas.length);
  const variance = deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, deltas.length);
  const variation = Math.sqrt(variance);

  // Strong tempo is not maximal speed: it is meaningful variation with recovery.
  const hasBreathingRoom = deltas.some((value) => value < 0.28);
  const hasPeaks = deltas.some((value) => value > 0.7);

  return metric(
    variation * 1.7 * 0.55 +
    (hasBreathingRoom ? 0.18 : 0) +
    (hasPeaks ? 0.18 : 0) +
    mean * 0.2,
  );
}

function payoff(
  candidate: LatentMovieCandidate,
): number {
  const trajectory = candidate.trajectory;
  if (!trajectory.length) return 0;

  const final = trajectory[trajectory.length - 1]!;
  const endpoint = final.operation === "payoff" ? 1 : 0;
  const priorChanges = trajectory
    .slice(0, -1)
    .reduce(
      (sum, step, index, prior) =>
        sum +
        (index > 0
          ? semanticChange(prior[index - 1]!, step)
          : relationNovelty(candidate, index + 1)),
      0,
    );

  const earned = metric(priorChanges / Math.max(1, trajectory.length - 1));
  return metric(endpoint * 0.72 + earned * 0.28);
}

export type ViewerStateDynamics = {
  attention: number;
  curiosity: number;
  contrast: number;
  interruption: number;
  accumulation: number;
  payoff: number;
  tempo: number;
  continuity: number;
  predictionError: number;
  stateShift: number;
  score: number;
};

export function scoreViewerStateTrajectory(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ViewerStateDynamics {
  const trajectory = candidate.trajectory;
  const attentionValue = attentionChange(candidate);
  const curiosityValue = curiosity(trajectory);
  const contrastValue = contrast(candidate);
  const interruptionValue = interruption(candidate);
  const accumulationValue = continuity(graph, trajectory);
  const payoffValue = payoff(candidate);
  const tempoValue = tempo(candidate);

  let stateShiftTotal = 0;
  let predictionTotal = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]!;
    const current = trajectory[index]!;
    stateShiftTotal += semanticChange(previous, current);
    predictionTotal += predictionError(previous, current);
  }
  const stateShiftValue = metric(
    trajectory.length > 1
      ? stateShiftTotal / (trajectory.length - 1)
      : 0,
  );
  const predictionValue = metric(
    trajectory.length > 1
      ? predictionTotal / (trajectory.length - 1)
      : 0,
  );

  // Interruption is useful only when continuity survives it. This prevents
  // the scorer from rewarding random state jumps every cut.
  const interruptionBalance = interruptionValue * (0.55 + accumulationValue * 0.45);

  const score = metric(
    attentionValue * 0.18 +
    curiosityValue * 0.17 +
    contrastValue * 0.13 +
    interruptionBalance * 0.08 +
    accumulationValue * 0.15 +
    payoffValue * 0.13 +
    tempoValue * 0.08 +
    stateShiftValue * 0.04 +
    predictionValue * 0.04,
  );

  return {
    attention: attentionValue,
    curiosity: curiosityValue,
    contrast: contrastValue,
    interruption: interruptionValue,
    accumulation: accumulationValue,
    payoff: payoffValue,
    tempo: tempoValue,
    continuity: accumulationValue,
    predictionError: predictionValue,
    stateShift: stateShiftValue,
    score,
  };
}

export function rerankByViewerState(
  graph: RealityGraph,
  candidates: readonly LatentMovieCandidate[],
): LatentMovieCandidate[] {
  return candidates
    .map((candidate) => {
      const dynamics = scoreViewerStateTrajectory(graph, candidate);
      const score = metric(candidate.score * 0.6 + dynamics.score * 0.4);
      return {
        ...candidate,
        score,
        viewerStateDynamics: dynamics,
      };
    })
    .sort((left, right) => right.score - left.score);
}
