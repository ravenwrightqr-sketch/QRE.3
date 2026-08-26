/**
 * QRE VIEWER-STATE TRAJECTORY SCORING
 *
 * Deterministic, pre-language evaluation of how a candidate trajectory changes
 * the viewer from cut to cut. This is interpretation metadata, never reality.
 */
import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

const IMPACT: Record<LatentMovieTrajectoryStep["operation"], number> = {
  establish: 0.28,
  contrast: 0.92,
  recur: 0.74,
  reframe: 0.96,
  escalate: 1,
  converge: 0.86,
  reveal: 0.88,
  consequence: 0.91,
  payoff: 0.98,
};

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

function attentionChange(trajectory: readonly LatentMovieTrajectoryStep[]): number {
  if (trajectory.length < 2) return trajectory.length ? IMPACT[trajectory[0]!.operation] : 0;
  let total = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]!;
    const current = trajectory[index]!;
    const operationDelta = current.operation === previous.operation ? 0.38 : 0.9;
    const eventDelta = current.eventIds.some((id) => !previous.eventIds.includes(id)) ? 0.95 : 0.45;
    const questionDelta = current.nextQuestion && current.nextQuestion !== previous.nextQuestion ? 0.88 : 0.42;
    total += operationDelta * 0.45 + eventDelta * 0.35 + questionDelta * 0.2;
  }
  return metric(total / Math.max(1, trajectory.length - 1));
}

function curiosity(trajectory: readonly LatentMovieTrajectoryStep[]): number {
  const questions = unique(trajectory.map((step) => step.nextQuestion.toLowerCase().trim()));
  const unresolved = trajectory.filter((step) => step.operation !== "payoff").length;
  const turns = trajectory.filter((step) => step.operation !== "establish" && step.operation !== "payoff").length;
  return metric(
    Math.min(1, questions.length / 4) * 0.36 +
    Math.min(1, unresolved / 4) * 0.2 +
    Math.min(1, turns / 4) * 0.24 +
    (trajectory.some((step) => /what|why|how|what now|what becomes/i.test(step.nextQuestion)) ? 0.2 : 0),
  );
}

function contrast(trajectory: readonly LatentMovieTrajectoryStep[]): number {
  const operations = new Set(trajectory.map((step) => step.operation));
  const contrastOps = trajectory.filter((step) => step.operation === "contrast" || step.operation === "reframe" || step.operation === "consequence").length;
  return metric(
    Math.min(1, contrastOps / 3) * 0.7 + Math.min(1, operations.size / 5) * 0.3,
  );
}

function interruption(trajectory: readonly LatentMovieTrajectoryStep[]): number {
  if (trajectory.length < 2) return 0;
  let jumps = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    if (trajectory[index]!.operation !== trajectory[index - 1]!.operation) jumps += 1;
  }
  return metric(jumps / Math.max(1, trajectory.length - 1));
}

function accumulation(graph: RealityGraph, trajectory: readonly LatentMovieTrajectoryStep[]): number {
  if (trajectory.length < 2) return 0;
  let carried = 0;
  let measured = 0;
  const established = new Set<string>();
  for (const step of trajectory) {
    const priorKnown = step.eventIds.filter((id) => established.has(id)).length;
    const newIds = step.eventIds.filter((id) => !established.has(id)).length;
    if (step.operation !== "establish") {
      measured += 1;
      carried += Math.min(1, (priorKnown * 0.65 + newIds * 0.35) / Math.max(1, step.eventIds.length));
      if (step.eventIds.length >= 2) carried += 0.15;
    }
    for (const id of step.eventIds) established.add(id);
  }

  const recurringEvidence = graph.recurringSignals.length
    ? trajectory.reduce(
        (sum, step) =>
          sum +
          Math.max(
            0,
            ...graph.recurringSignals.map((signal) =>
              Math.max(0, ...step.eventIds.map((id) => overlap(eventLabel(graph, id), signal))),
            ),
          ),
        0,
      ) / Math.max(1, trajectory.length)
    : 0;

  return metric((measured ? carried / measured : 0) * 0.82 + recurringEvidence * 0.18);
}

function payoff(trajectory: readonly LatentMovieTrajectoryStep[]): number {
  if (!trajectory.length) return 0;
  const final = trajectory[trajectory.length - 1]!;
  const isPayoff = final.operation === "payoff" ? 1 : 0;
  const priorMoves = trajectory.slice(0, -1).filter((step) => step.operation !== "establish").length;
  const earned = Math.min(1, priorMoves / 4);
  return metric(isPayoff * 0.72 + earned * 0.28);
}

export type ViewerStateDynamics = {
  attention: number;
  curiosity: number;
  contrast: number;
  interruption: number;
  accumulation: number;
  payoff: number;
  score: number;
};

export function scoreViewerStateTrajectory(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ViewerStateDynamics {
  const trajectory = candidate.trajectory;
  const attentionValue = attentionChange(trajectory);
  const curiosityValue = curiosity(trajectory);
  const contrastValue = contrast(trajectory);
  const interruptionValue = interruption(trajectory);
  const accumulationValue = accumulation(graph, trajectory);
  const payoffValue = payoff(trajectory);

  const score = metric(
    attentionValue * 0.24 +
    curiosityValue * 0.2 +
    contrastValue * 0.16 +
    interruptionValue * 0.1 +
    accumulationValue * 0.18 +
    payoffValue * 0.12,
  );

  return {
    attention: attentionValue,
    curiosity: curiosityValue,
    contrast: contrastValue,
    interruption: interruptionValue,
    accumulation: accumulationValue,
    payoff: payoffValue,
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
      const score = metric(candidate.score * 0.7 + dynamics.score * 0.3);
      return {
        ...candidate,
        score,
        viewerStateDynamics: dynamics,
      };
    })
    .sort((left, right) => right.score - left.score);
}
