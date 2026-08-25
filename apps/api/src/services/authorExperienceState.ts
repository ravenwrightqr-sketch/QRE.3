import type {
  AuthorExperienceState,
  LatentMovieCandidate,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const uniq = <T>(values: readonly T[], limit = 64): T[] => [...new Set(values)].slice(0, limit);

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(event(graph, id)?.label);
}

function relationKey(relation: RealityRelation): string {
  return [relation.kind, relation.from, relation.to].join(":");
}

function relationForStep(graph: RealityGraph, eventIds: string[]): RealityRelation | undefined {
  if (eventIds.length < 2) return undefined;
  const [from, to] = [eventIds[0], eventIds[eventIds.length - 1]];
  return graph.relations.find(
    (relation) =>
      (relation.from === from && relation.to === to) ||
      (relation.from === to && relation.to === from),
  );
}

function persistentHook(value: string, graph: RealityGraph): boolean {
  const text = clean(value).toLowerCase();
  if (!text) return false;
  return [...graph.recurringSignals, ...graph.unresolvedTensions]
    .some((signal) => {
      const normalized = clean(signal).toLowerCase();
      return normalized.length > 2 && (text.includes(normalized) || normalized.includes(text));
    });
}

function deriveFutureEventIds(
  graph: RealityGraph,
  usedEventIds: readonly string[],
  payoffEventIds: readonly string[],
): string[] {
  const used = new Set(usedEventIds);
  const payoff = new Set(payoffEventIds);

  return graph.events
    .map((item) => {
      const relations = graph.relations.filter(
        (relation) =>
          (relation.from === item.id || relation.to === item.id) &&
          (used.has(relation.from) || used.has(relation.to)),
      );
      const unresolved = relations.some(
        (relation) =>
          ["contrasts", "changes", "recontextualizes", "causes", "after", "before"].includes(relation.kind) &&
          !payoff.has(item.id),
      );
      return { id: item.id, score: unresolved ? relations.reduce((sum, relation) => sum + relation.strength, 0) : 0 };
    })
    .filter((item) => !used.has(item.id) && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.id);
}

export function buildAuthorExperienceState(input: {
  graph: RealityGraph;
  movie?: LatentMovieCandidate;
  lens?: string;
  priorScenes?: string[];
  memoryContext?: string[];
  round?: number;
}): AuthorExperienceState {
  const { graph, movie } = input;
  const trajectory = movie?.trajectory ?? [];
  const semanticSteps = trajectory.filter(
    (step) => step.operation !== "establish" && step.operation !== "payoff",
  );
  const payoffStep = trajectory.find((step) => step.operation === "payoff");

  const establishedEventIds = uniq(
    trajectory.filter((step) => step.operation === "establish" || step.operation !== "payoff").flatMap((step) => step.eventIds),
  );
  const changedEventIds = uniq(
    semanticSteps.flatMap((step) => step.eventIds.slice(-1)),
  );
  const carrierEventIds = uniq(
    semanticSteps.flatMap((step) => step.eventIds),
  );
  const payoffEventIds = uniq(payoffStep?.eventIds ?? []);

  const relations = semanticSteps
    .map((step) => relationForStep(graph, step.eventIds))
    .filter((relation): relation is RealityRelation => Boolean(relation));

  const activeTensionKeys = uniq(
    relations
      .filter((relation) => ["contrasts", "changes", "recontextualizes"].includes(relation.kind))
      .map(relationKey),
  );

  const resolvedTensionKeys = uniq(
    relations
      .filter((relation) => ["causes", "after", "converges", "repeats"].includes(relation.kind))
      .map(relationKey),
  );

  const setupEventIds = uniq([
    ...carrierEventIds,
    ...semanticSteps.flatMap((step) => step.eventIds.slice(0, 1)),
  ]);

  const callbackEventIds = uniq(
    graph.events
      .filter((item) => persistentHook(item.label, graph))
      .map((item) => item.id),
  );

  const revisitedEventIds = uniq(
    semanticSteps
      .flatMap((step) => step.eventIds)
      .filter((id, index, ids) => ids.indexOf(id) !== index),
  );

  const unresolvedQuestions = uniq([
    ...(movie?.unresolvedQuestion ? [movie.unresolvedQuestion] : []),
    ...relations.map((relation) => `What becomes newly meaningful after ${eventLabel(graph, relation.to)}?`),
  ], 16);

  const carryThreads = uniq([
    ...graph.recurringSignals,
    ...graph.unresolvedTensions,
    ...(input.memoryContext ?? []).filter((value) => clean(value).length > 2),
  ], 20);

  const semanticTurnKeys = uniq(
    relations.map((relation) => relationKey(relation)),
  );

  const relationKinds = uniq(relations.map((relation) => relation.kind));

  const operations = uniq(trajectory.map((step) => step.operation));
  const semanticTurns = semanticSteps.map((step) => clean(step.viewerChange)).filter(Boolean);

  const continuationValue = metric(
    Math.min(1, unresolvedQuestions.length / 4) * 0.3 +
      Math.min(1, graph.recurringSignals.length / 4) * 0.25 +
      Math.min(1, callbackEventIds.length / 4) * 0.15 +
      Math.min(1, changedEventIds.length / 5) * 0.15 +
      (input.round && input.round > 1 ? 0.15 : 0),
  );

  const lookaheadValue = metric(
    deriveFutureEventIds(graph, carrierEventIds, payoffEventIds).length
      ? Math.min(1, deriveFutureEventIds(graph, carrierEventIds, payoffEventIds).length / 5)
      : 0,
  );

  const endpointPressure = metric(
    payoffEventIds.length ? 0.45 : 0.1 + Math.min(0.45, changedEventIds.length * 0.08),
  );

  const attentionPotential = metric(
    Math.min(1, semanticSteps.length / 4) * 0.3 +
      continuationValue * 0.25 +
      lookaheadValue * 0.2 +
      Math.min(1, relationKinds.length / 4) * 0.15 +
      Math.min(1, revisitedEventIds.length / 2) * 0.1,
  );

  const futureEventIds = deriveFutureEventIds(graph, carrierEventIds, payoffEventIds);
  const futureThreadKeys = uniq(
    futureEventIds.map((id) => `future:${id}`),
  );

  const memoryHooks = uniq([
    ...graph.recurringSignals.map((value) => `recurring:${value}`),
    ...graph.unresolvedTensions.map((value) => `tension:${value}`),
    ...revisitedEventIds.map((id) => `revisit:${id}`),
    ...futureThreadKeys,
  ], 24);

  return {
    version: 1,
    establishedEventIds,
    changedEventIds,
    carrierEventIds,
    activeTensionKeys,
    resolvedTensionKeys,
    setupEventIds,
    callbackEventIds,
    revisitedEventIds,
    unresolvedQuestions,
    carryThreads,
    futureEventIds,
    futureThreadKeys,
    semanticTurnKeys,
    relationKinds,
    continuationValue,
    lookaheadValue,
    endpointPressure,
    attentionPotential,
    selectedLens: clean(input.lens) || "neutral",
    selectedMovieId: movie?.id,
    payoffEventIds,
    earnedByEventIds: uniq([
      ...carrierEventIds,
      ...(payoffStep?.eventIds ?? []),
    ]),
    chapter: {
      openingEventIds: trajectory[0]?.eventIds ?? [],
      finalEventIds: payoffEventIds,
      semanticTurns,
      operations,
    },
    memoryHooks,
  };
}

export function summarizeAuthorExperienceState(state: AuthorExperienceState): string[] {
  return [
    `EXPERIENCE STATE: ${state.chapter.operations.join(" → ") || "empty"}`,
    `ESTABLISHED: ${state.establishedEventIds.join(", ") || "none"}`,
    `CHANGED: ${state.changedEventIds.join(", ") || "none"}`,
    `ACTIVE TENSIONS: ${state.activeTensionKeys.length}`,
    `RESOLVED TENSIONS: ${state.resolvedTensionKeys.length}`,
    `REVISITS: ${state.revisitedEventIds.join(", ") || "none"}`,
    `OPEN QUESTIONS: ${state.unresolvedQuestions.slice(0, 4).join(" | ") || "none"}`,
    `FUTURE THREADS: ${state.futureThreadKeys.slice(0, 6).join(", ") || "none"}`,
    `CONTINUATION=${state.continuationValue} LOOKAHEAD=${state.lookaheadValue} ATTENTION=${state.attentionPotential}`,
  ];
}
