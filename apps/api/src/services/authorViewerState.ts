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
import { scoreWholeWorldSequence } from "./authorWholeWorldSequenceScorer.js";

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
  if (
    trajectory.length < 2
  ) {
    return trajectory.length
      ? 0.7
      : 0;
  }

  /*
   * CONTINUITY IS NOT REPETITION.
   *
   * A coherent film can move through entirely different supplied
   * details while remaining continuous because:
   *
   *   - adjacent cuts are related in the source
   *   - supplied relations connect the cuts
   *   - wording carries a semantic thread
   *   - prior material is intentionally revisited
   *   - recurring/tension signals remain alive
   *
   * Exact event reuse is therefore only ONE continuity mechanism,
   * not the definition of continuity.
   */

  const sourceIndex = new Map<
    string,
    number
  >(
    graph.events.map(
      (item, index) => [
        item.id,
        index,
      ],
    ),
  );

  const relationWeight = (
    kind: RealityGraph["relations"][number]["kind"],
  ): number => {
    switch (kind) {
      case "contrasts":
        return 0.9;

      case "recontextualizes":
        return 0.96;

      case "changes":
        return 0.94;

      case "repeats":
        return 1;

      case "converges":
        return 0.9;

      case "causes":
        return 0.95;

      case "before":
      case "after":
        return 0.78;

      case "belongs_to":
        return 0.72;

      case "involves":
        return 0.68;

      default:
        return 0.55;
    }
  };

  const relationBetween = (
    leftId: string,
    rightId: string,
  ) => {
    return graph.relations
      .filter(
        (relation) =>
          (
            relation.from === leftId &&
            relation.to === rightId
          ) ||
          (
            relation.from === rightId &&
            relation.to === leftId
          ),
      )
      .sort(
        (left, right) =>
          (
            right.strength *
            relationWeight(
              right.kind,
            )
          ) -
          (
            left.strength *
            relationWeight(
              left.kind,
            )
          ),
      )[0];
  };

  const sourceProximity = (
    leftId: string,
    rightId: string,
  ): number => {
    const left =
      sourceIndex.get(
        leftId,
      );

    const right =
      sourceIndex.get(
        rightId,
      );

    if (
      left === undefined ||
      right === undefined
    ) {
      return 0;
    }

    const distance =
      Math.abs(
        left - right,
      );

    if (
      distance === 0
    ) {
      return 1;
    }

    if (
      distance === 1
    ) {
      return 1;
    }

    if (
      distance === 2
    ) {
      return 0.78;
    }

    if (
      distance === 3
    ) {
      return 0.5;
    }

    if (
      distance <= 5
    ) {
      return 0.24;
    }

    return 0;
  };

  const transitionScores: number[] =
    [];

  for (
    let index = 1;
    index < trajectory.length;
    index += 1
  ) {
    const previous =
      trajectory[index - 1]!;

    const current =
      trajectory[index]!;

    /*
     * Evaluate the BEST legitimate continuity relationship between
     * any event carried by the previous cut and any event introduced
     * by the current cut.
     *
     * This matters because a trajectory step can contain more than
     * one event, especially semantic/payoff steps.
     */
    let bestTransition = 0;

    for (
      const previousId of
        previous.eventIds
    ) {
      for (
        const currentId of
          current.eventIds
      ) {
        if (
          previousId ===
          currentId
        ) {
          bestTransition =
            Math.max(
              bestTransition,
              1,
            );

          continue;
        }

        const relation =
          relationBetween(
            previousId,
            currentId,
          );

        const relationContinuity =
          relation
            ? relation.strength *
              relationWeight(
                relation.kind,
              )
            : 0;

        const previousLabel =
          eventLabel(
            graph,
            previousId,
          );

        const currentLabel =
          eventLabel(
            graph,
            currentId,
          );

        const semanticCarry =
          overlap(
            previousLabel,
            currentLabel,
          );

        const sourceCarry =
          sourceProximity(
            previousId,
            currentId,
          );

        /*
         * Different supplied facts can still form a continuous
         * sequence when the source itself places them close together.
         *
         * Source proximity is deliberately weaker than an explicit
         * semantic relation, so source order cannot manufacture a
         * semantic claim.
         */
        const pairContinuity =
          relationContinuity * 0.48 +
          sourceCarry * 0.24 +
          semanticCarry * 0.18 +
          (
            relation
              ? 0.1
              : 0
          );

        bestTransition =
          Math.max(
            bestTransition,
            pairContinuity,
          );
      }
    }

    /*
     * A step with completely different material is still allowed to
     * remain coherent when it is a deliberate source-world movement.
     *
     * This prevents whole-world films from collapsing merely because
     * every cut introduces a new event.
     */
    if (
      bestTransition === 0 &&
      current.eventIds.length
    ) {
      const sourceBackbone =
        current.eventIds.some(
          (currentId) =>
            previous.eventIds.some(
              (previousId) =>
                sourceProximity(
                  previousId,
                  currentId,
                ) >= 0.78,
            ),
        );

      bestTransition =
        sourceBackbone
          ? 0.52
          : 0.18;
    }

    transitionScores.push(
      metric(
        bestTransition,
      ),
    );
  }

  const measuredTransitions =
    transitionScores.length
      ? transitionScores.reduce(
          (
            sum,
            value,
          ) =>
            sum + value,
          0,
        ) /
        transitionScores.length
      : 0.55;

  /*
   * ================================================================
   * RECURRING THREAD CARRY
   * ================================================================
   *
   * Recurrence strengthens continuity when the trajectory actually
   * carries a recurring signal across multiple cuts.
   */
  const recurrent =
    graph.recurringSignals.length
      ? trajectory.reduce(
          (
            sum,
            step,
          ) => {
            const labels =
              step.eventIds.map(
                (id) =>
                  eventLabel(
                    graph,
                    id,
                  ),
              );

            const hit =
              Math.max(
                0,
                ...graph.recurringSignals.map(
                  (
                    signal,
                  ) =>
                    Math.max(
                      0,
                      ...labels.map(
                        (
                          label,
                        ) =>
                          overlap(
                            label,
                            signal,
                          ),
                      ),
                    ),
                ),
              );

            return (
              sum + hit
            );
          },
          0,
        ) /
        Math.max(
          1,
          trajectory.length,
        )
      : 0;

  /*
   * ================================================================
   * TENSION CARRY
   * ================================================================
   *
   * A tension thread can maintain continuity even when individual
   * event labels change.
   */
  const tension =
    graph.unresolvedTensions.length
      ? trajectory.reduce(
          (
            sum,
            step,
          ) => {
            const labels =
              step.eventIds.map(
                (id) =>
                  eventLabel(
                    graph,
                    id,
                  ),
              );

            const hit =
              Math.max(
                0,
                ...graph.unresolvedTensions.map(
                  (
                    unresolved,
                  ) =>
                    Math.max(
                      0,
                      ...labels.map(
                        (
                          label,
                        ) =>
                          overlap(
                            label,
                            unresolved,
                          ),
                      ),
                    ),
                ),
              );

            return (
              sum + hit
            );
          },
          0,
        ) /
        Math.max(
          1,
          trajectory.length,
        )
      : 0;

  /*
   * ================================================================
   * SOURCE-WORLD COHERENCE
   * ================================================================
   *
   * Reward trajectories that move through supplied material in a
   * reasonably coherent presentation neighborhood without requiring
   * them to remain in one semantic territory.
   */
  let sourceOrderedTransitions =
    0;

  let sourceMeasuredTransitions =
    0;

  for (
    let index = 1;
    index < trajectory.length;
    index += 1
  ) {
    const previous =
      trajectory[index - 1]!;

    const current =
      trajectory[index]!;

    const previousPositions =
      previous.eventIds
        .map(
          (id) =>
            sourceIndex.get(
              id,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== undefined,
        );

    const currentPositions =
      current.eventIds
        .map(
          (id) =>
            sourceIndex.get(
              id,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== undefined,
        );

    if (
      !previousPositions.length ||
      !currentPositions.length
    ) {
      continue;
    }

    const previousMax =
      Math.max(
        ...previousPositions,
      );

    const previousMin =
      Math.min(
        ...previousPositions,
      );

    const currentMax =
      Math.max(
        ...currentPositions,
      );

    const currentMin =
      Math.min(
        ...currentPositions,
      );

    /*
     * Forward or locally adjacent source movement is coherent.
     * Large backward jumps are not forbidden, but they receive less
     * continuity credit.
     */
    if (
      currentMin >=
      previousMin
    ) {
      sourceOrderedTransitions +=
        1;
    } else if (
      Math.abs(
        currentMax -
          previousMin,
      ) <= 2
    ) {
      sourceOrderedTransitions +=
        0.6;
    }

    sourceMeasuredTransitions +=
      1;
  }

  const sourceCoherence =
    sourceMeasuredTransitions
      ? metric(
          sourceOrderedTransitions /
            sourceMeasuredTransitions,
        )
      : 0.5;

  /*
   * ================================================================
   * FINAL CONTINUITY
   * ================================================================
   *
   * Explicit graph continuity is strongest.
   * Source continuity is meaningful.
   * Semantic overlap helps.
   * Exact event reuse remains valuable but is NOT required.
   */
  return metric(
    measuredTransitions * 0.54 +
    sourceCoherence * 0.18 +
    recurrent * 0.14 +
    tension * 0.10 +
    (
      trajectory.some(
        (
          step,
        ) =>
          step.eventIds.length >=
          2,
      )
        ? 0.04
        : 0
    ),
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

  const interruptionBalance = interruptionValue * (0.55 + accumulationValue * 0.45);

  // Existing viewer dynamics remain the core score. Whole-world sequence
  // fitness is an additional trajectory property rather than a source-coverage
  // requirement.
  const score = metric(
    attentionValue * 0.16 +
    curiosityValue * 0.15 +
    contrastValue * 0.12 +
    interruptionBalance * 0.07 +
    accumulationValue * 0.13 +
    payoffValue * 0.12 +
    tempoValue * 0.07 +
    stateShiftValue * 0.04 +
    predictionValue * 0.04 +
    scoreWholeWorldSequence(graph, candidate).score * 0.10,
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
      const score = metric(candidate.score * 0.57 + dynamics.score * 0.43);
      return {
        ...candidate,
        score,
        viewerStateDynamics: dynamics,
      };
    })
    .sort((left, right) => right.score - left.score);
}
