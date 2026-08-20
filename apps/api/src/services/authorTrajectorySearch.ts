/**
 * QRE TRAJECTORY SEARCH · CANONICAL SEMANTIC SEARCH LAYER
 *
 * This module searches COMPLETE movie trajectories before language exists.
 * It is intentionally pure and deterministic.
 *
 * RealityGraph      = immutable evidence
 * LatentMovie       = hypothesis
 * TrajectorySearch  = whole-sequence search/ranking
 * Mouth             = language realization only
 *
 * IMPORTANT:
 * - weak relation support is uncertainty, not invention;
 * - unsupported events remain truth risk;
 * - sequence quality is evaluated at trajectory level, not line level;
 * - an explicit data mode must bypass this layer entirely at the caller.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

const GENERIC_QUESTION = /^(?:what happens next|what is the punchline|what does this mean|what comes next|why does this matter|what changes|what is the point)\??$/i;
const GENERIC_CHANGE = /^(?:discover|show|reveal|explore|understand|build|highlight|create|provide)\b/i;

export type TrajectorySearchConfig = {
  endpointEventId?: string;
  beamWidth?: number;
  maxSteps?: number;
  requireEndpoint?: boolean;
};

type SearchState = {
  candidate: LatentMovieCandidate;
  steps: LatentMovieTrajectoryStep[];
  usedEventIds: string[];
  usedRelations: RealityRelation[];
  score: number;
  pull: number;
  groundedness: number;
  novelty: number;
  redundancyPenalty: number;
  uncertaintyPenalty: number;
};

function relationBetween(
  graph: RealityGraph,
  from: string,
  to: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === from && relation.to === to) ||
        (relation.from === to && relation.to === from),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function eventExists(graph: RealityGraph, id: string): boolean {
  return graph.events.some((event) => event.id === id);
}

function eventLabel(graph: RealityGraph, id: string): string {
  return graph.events.find((event) => event.id === id)?.label ?? "";
}

function relationSpecificity(relation: RealityRelation | undefined): number {
  if (!relation) return 0;
  return metric(relation.strength);
}

function stepNovelty(
  step: LatentMovieTrajectoryStep,
  usedEventIds: Set<string>,
): number {
  if (!step.eventIds.length) return 0;
  const fresh = step.eventIds.filter((id) => !usedEventIds.has(id)).length;
  return metric(fresh / step.eventIds.length);
}

function questionPull(step: LatentMovieTrajectoryStep): number {
  const question = clean(step.nextQuestion);
  if (!question || GENERIC_QUESTION.test(question)) return 0;
  const words = question.split(/\s+/).filter(Boolean).length;
  return metric(Math.min(1, 0.45 + Math.min(words, 12) * 0.03));
}

function viewerChangeValue(step: LatentMovieTrajectoryStep): number {
  const change = clean(step.viewerChange);
  if (!change || GENERIC_CHANGE.test(change)) return 0.08;
  return metric(
    0.32 +
      Math.min(0.28, change.split(/\s+/).length * 0.018) +
      (step.operation === "contrast" || step.operation === "reframe" ? 0.12 : 0) +
      (step.operation === "payoff" ? 0.14 : 0),
  );
}

function operationValue(step: LatentMovieTrajectoryStep): number {
  switch (step.operation) {
    case "contrast":
    case "reframe":
      return 0.9;
    case "escalate":
    case "consequence":
      return 0.86;
    case "converge":
      return 0.78;
    case "recur":
      return 0.74;
    case "reveal":
      return 0.7;
    case "payoff":
      return 0.94;
    case "establish":
    default:
      return 0.48;
  }
}

function trajectoryHasPayoff(steps: LatentMovieTrajectoryStep[]): boolean {
  return steps.some((step) => step.operation === "payoff");
}

function endpointReached(
  steps: LatentMovieTrajectoryStep[],
  endpointEventId: string,
): boolean {
  if (!endpointEventId) return true;
  return steps.some((step) => step.eventIds.includes(endpointEventId));
}

function scoreState(state: Omit<SearchState, "score">, endpointEventId: string): number {
  const completed = endpointReached(state.steps, endpointEventId);
  const payoff = trajectoryHasPayoff(state.steps);

  const completionBonus = completed ? 0.18 : -0.1;
  const payoffBonus = payoff ? 0.12 : -0.05;
  const lengthPenalty = state.steps.length > 5 ? (state.steps.length - 5) * 0.03 : 0;

  return metric(
    state.candidate.score * 0.22 +
      state.pull * 0.22 +
      state.groundedness * 0.2 +
      state.novelty * 0.16 +
      completionBonus +
      payoffBonus -
      state.redundancyPenalty * 0.1 -
      state.uncertaintyPenalty * 0.08 -
      lengthPenalty,
  );
}

function dedupeStates(states: SearchState[]): SearchState[] {
  const map = new Map<string, SearchState>();
  for (const state of states) {
    const signature = state.steps
      .map((step) => `${step.operation}:${step.eventIds.slice().sort().join("+")}`)
      .join("|");
    const prior = map.get(signature);
    if (!prior || state.score > prior.score) map.set(signature, state);
  }
  return [...map.values()];
}

function expandStep(
  graph: RealityGraph,
  state: SearchState,
  step: LatentMovieTrajectoryStep,
  endpointEventId: string,
): SearchState | undefined {
  const ids = step.eventIds.filter((id) => eventExists(graph, id));
  if (!ids.length) return undefined;

  const used = new Set(state.usedEventIds);
  const relationPairs: RealityRelation[] = [];

  for (let i = 1; i < ids.length; i += 1) {
    const relation = relationBetween(graph, ids[i - 1]!, ids[i]!);
    if (relation) relationPairs.push(relation);
  }

  const repeatedEvents = ids.filter((id) => used.has(id)).length;
  const novelty = stepNovelty(step, used);
  const pull = questionPull(step);
  const change = viewerChangeValue(step);
  const operation = operationValue(step);
  const groundedness = relationPairs.length
    ? relationPairs.reduce((sum, relation) => sum + relationSpecificity(relation), 0) / relationPairs.length
    : 0.18;

  // IMPORTANT: low support is uncertainty. It never becomes truthRisk here.
  const weakRelations = relationPairs.filter((relation) => relation.strength < 0.5).length;
  const uncertaintyPenalty = weakRelations / Math.max(1, relationPairs.length);

  const normalizedStep =
    endpointEventId && ids.includes(endpointEventId) && step.operation !== "payoff"
      ? {
          ...step,
          operation: "payoff" as const,
          viewerChange: `The supplied ending lands on ${eventLabel(graph, endpointEventId)}.`,
          nextQuestion: "What remains true at the supplied ending?",
        }
      : step;

  const nextSteps = [...state.steps, normalizedStep].map((item, index) => ({ ...item, order: index + 1 }));
  const nextUsed = [...new Set([...state.usedEventIds, ...ids])];
  const nextRelations = [...state.usedRelations, ...relationPairs];

  const nextState: Omit<SearchState, "score"> = {
    candidate: state.candidate,
    steps: nextSteps,
    usedEventIds: nextUsed,
    usedRelations: nextRelations,
    pull: metric(state.pull + pull * 0.7 + change * 0.3),
    groundedness: metric((state.groundedness + groundedness) / 2),
    novelty: metric((state.novelty + novelty + operation * 0.15) / 2),
    redundancyPenalty: metric(state.redundancyPenalty + repeatedEvents * 0.2),
    uncertaintyPenalty: metric(state.uncertaintyPenalty + uncertaintyPenalty * 0.25),
  };

  return {
    ...nextState,
    score: scoreState(nextState, endpointEventId),
  };
}

function legalSuccessors(
  graph: RealityGraph,
  step: LatentMovieTrajectoryStep,
  endpointEventId: string,
): LatentMovieTrajectoryStep[] {
  const next: LatentMovieTrajectoryStep[] = [];

  // Payoff is terminal.
  if (step.operation === "payoff") {
    return next;
  }

  // Reaching the supplied endpoint is terminal.
  if (
    endpointEventId &&
    step.eventIds.includes(endpointEventId)
  ) {
    return next;
  }

  for (const event of graph.events) {
    if (step.eventIds.includes(event.id)) continue;

    const relation = step.eventIds
      .map((id) => relationBetween(graph, id, event.id))
      .filter(Boolean)
      .sort((a, b) => b!.strength - a!.strength)[0];

    if (!relation) continue;

    const operation =
      relation.kind === "contrasts"
        ? "contrast"
        : relation.kind === "recontextualizes"
          ? "reframe"
          : relation.kind === "changes"
            ? "escalate"
            : relation.kind === "converges"
              ? "converge"
              : relation.kind === "before" ||
                  relation.kind === "after"
                ? "consequence"
                : "reveal";

    next.push({
      order: 0,
      operation,
      eventIds: [
        step.eventIds[step.eventIds.length - 1]!,
        event.id,
      ],
      viewerChange:
        `${eventLabel(
          graph,
          step.eventIds[step.eventIds.length - 1]!,
        )} changes how ${event.label} reads next.`,
      nextQuestion:
        event.id === endpointEventId
          ? `What remains true at ${event.label}?`
          : `Why does ${event.label} matter after the previous detail?`,
    });
  }

  return next;
}

/**
 * Search whole candidate trajectories with a small deterministic beam.
 *
 * Existing candidate trajectories are treated as seed states. The search can
 * expand them through additional grounded graph relationships, but never invents
 * an event that does not exist in RealityGraph.
 */
export function searchBestMovieTrajectories(
  graph: RealityGraph,
  candidates: LatentMovieCandidate[],
  config: TrajectorySearchConfig = {},
): LatentMovieCandidate[] {

  const beamWidth = Math.max(1, Math.min(8, config.beamWidth ?? 4));

  const maxSteps = Math.max(1, Math.min(7, config.maxSteps ?? 5));

  const endpointEventId =
    config.endpointEventId ??
    graph.events[graph.events.length - 1]?.id ??
    "";

  const requireEndpoint =
    config.requireEndpoint ?? Boolean(endpointEventId);

  const ranked: SearchState[] = candidates.map((candidate) => {
    const seedSteps = candidate.trajectory.slice(0, maxSteps).map((step, index) => ({ ...step, order: index + 1 }));
    const usedEventIds = [...new Set(seedSteps.flatMap((step) => step.eventIds))].filter((id) => eventExists(graph, id));
    const usedRelations: RealityRelation[] = [];

    for (const step of seedSteps) {
      for (let i = 1; i < step.eventIds.length; i += 1) {
        const relation = relationBetween(graph, step.eventIds[i - 1]!, step.eventIds[i]!);
        if (relation) usedRelations.push(relation);
      }
    }

    const state: Omit<SearchState, "score"> = {
      candidate,
      steps: seedSteps,
      usedEventIds,
      usedRelations,
      pull: metric(seedSteps.reduce((sum, step) => sum + questionPull(step), 0) / Math.max(1, seedSteps.length)),
      groundedness: metric(usedRelations.length ? usedRelations.reduce((sum, relation) => sum + relation.strength, 0) / usedRelations.length : 0.2),
      novelty: metric(seedSteps.length / Math.max(1, seedSteps.length + 1)),
      redundancyPenalty: metric(
        usedEventIds.length < seedSteps.flatMap((step) => step.eventIds).length ? 0.25 : 0,
      ),
      uncertaintyPenalty: metric(
        usedRelations.length
          ? usedRelations.filter((relation) => relation.strength < 0.5).length / usedRelations.length
          : 0.5,
      ),
    };

    return { ...state, score: scoreState(state, endpointEventId) };
  });

      let beam = ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, beamWidth);

  const completed: SearchState[] = [];

  for (
    let depth = Math.max(
      1,
      beam[0]?.steps.length ?? 1,
    );
    depth < maxSteps;
    depth += 1
  ) {
    const expanded: SearchState[] = [];

    for (const state of beam) {
      // Completed trajectories are preserved, never expanded.
      if (
        endpointEventId &&
        endpointReached(
          state.steps,
          endpointEventId,
        )
      ) {
        completed.push(state);
        continue;
      }

      const tail =
        state.steps[state.steps.length - 1];

      if (!tail) continue;

      // Payoff is terminal and is preserved as a completed path.
      if (tail.operation === "payoff") {
        completed.push(state);
        continue;
      }

      const successors =
        legalSuccessors(
          graph,
          tail,
          endpointEventId,
        ).slice(0, 8);

      for (const successor of successors) {
        const next = expandStep(
          graph,
          state,
          successor,
          endpointEventId,
        );

        if (!next) continue;

        next.score = scoreState(
          next,
          endpointEventId,
        );

        expanded.push(next);
      }
    }

    if (!expanded.length) break;

    beam = dedupeStates(expanded)
      .sort((a, b) => b.score - a.score)
      .slice(0, beamWidth);
  }

  const finalStates = dedupeStates([
    ...beam,
    ...completed,
  ])
    .sort((a, b) => b.score - a.score);

  return finalStates

    .filter((state) => !requireEndpoint || endpointReached(state.steps, endpointEventId))
    .sort((a, b) => b.score - a.score)
    .map((state) => ({
      ...state.candidate,
      trajectory: state.steps,
      score: metric((state.candidate.score * 0.45) + (state.score * 0.55)),
      informationValue: metric((state.candidate.informationValue * 0.55) + state.pull * 0.45),
      attentionPotential: metric((state.candidate.attentionPotential * 0.5) + state.pull * 0.5),
      consequencePotential: metric((state.candidate.consequencePotential * 0.55) + state.groundedness * 0.45),
      novelty: metric((state.candidate.novelty * 0.55) + state.novelty * 0.45),
      repetitionRisk: metric((state.candidate.repetitionRisk * 0.65) + state.redundancyPenalty * 0.35),
      distinctiveness: metric(state.candidate.distinctiveness),
    }));
}
