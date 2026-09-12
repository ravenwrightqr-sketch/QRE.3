import type {
  ExperienceState,
  RealityGraph,
  RealityRelation,
  SequenceCandidate,
} from "@qre/contracts";

const clamp = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const unique = (values: readonly string[], limit = 96): string[] =>
  [...new Set(values.filter(Boolean))].slice(0, limit);

function previousValues(
  states: readonly ExperienceState[],
  key: keyof ExperienceState,
): string[] {
  return unique(
    states.flatMap((state) => {
      const value = state[key];
      return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
    }),
  );
}

function relationKey(relation: RealityRelation): string {
  return `${relation.kind}:${relation.from}:${relation.to}`;
}

export function buildExperienceState(input: {
  graph: RealityGraph;
  candidate: SequenceCandidate;
  lens?: string;
  memoryContext?: string[];
  priorExperienceStates?: ExperienceState[];
  round?: number;
}): ExperienceState {
  const previous = input.priorExperienceStates ?? [];
  const steps = input.candidate.trajectory;
  const usedEventIds = unique(steps.flatMap((step) => step.eventIds));
  const used = new Set(usedEventIds);
  const relevantRelations = input.graph.relations.filter(
    (relation) => used.has(relation.from) || used.has(relation.to),
  );

  const activeTensions = unique([
    ...previousValues(previous, "activeTensionKeys"),
    ...relevantRelations
      .filter((relation) => ["contrasts", "changes", "recontextualizes"].includes(relation.kind))
      .map(relationKey),
  ]);
  const resolvedTensions = unique([
    ...previousValues(previous, "resolvedTensionKeys"),
    ...relevantRelations
      .filter((relation) => ["causes", "converges", "repeats"].includes(relation.kind))
      .map(relationKey),
  ]);

  const changedEventIds = unique([
    ...previousValues(previous, "changedEventIds"),
    ...steps.filter((step) => step.operation !== "establish").flatMap((step) => step.eventIds),
  ]);
  const callbackEventIds = unique([
    ...previousValues(previous, "callbackEventIds"),
    ...steps
      .filter((step) => step.operation === "recur" || step.operation === "reframe")
      .flatMap((step) => step.eventIds),
  ]);
  const revisitedEventIds = unique([
    ...previousValues(previous, "revisitedEventIds"),
    ...(input.round && input.round > 1 ? callbackEventIds : []),
  ]);

  const unresolvedQuestions = unique([
    ...previousValues(previous, "unresolvedQuestions"),
    input.candidate.unresolvedQuestion,
  ], 24);
  const carryThreads = unique([
    ...previousValues(previous, "carryThreads"),
    input.candidate.lens,
    ...(input.memoryContext ?? []).slice(-12),
  ], 32);

  const futureEventIds = unique(
    input.graph.events.map((event) => event.id).filter((id) => !used.has(id)),
    24,
  );
  const futureThreadKeys = unique([
    ...previousValues(previous, "futureThreadKeys"),
    ...futureEventIds.map((id) => `future:${id}`),
  ], 32);
  const consumedFutureEventIds = previousValues(previous, "consumedFutureEventIds");
  const retiredFutureThreadKeys = previousValues(previous, "retiredFutureThreadKeys");

  const continuationValue = clamp(
    Math.min(1, activeTensions.length / 4) * 0.32 +
      Math.min(1, unresolvedQuestions.length / 4) * 0.2 +
      Math.min(1, callbackEventIds.length / 3) * 0.18 +
      Math.min(1, futureEventIds.length / 6) * 0.15 +
      ((input.round ?? 1) > 1 ? 0.15 : 0),
  );
  const lookaheadValue = clamp(futureEventIds.length / 6);
  const endpointPressure = clamp(
    0.18 +
      steps.filter((step) => step.operation === "consequence").length * 0.15 +
      steps.filter((step) => step.operation === "payoff").length * 0.32,
  );

  const tempo = activeTensions.length >= 2
    ? {
        mode: "tighten" as const,
        urgency: 0.8,
        compression: 0.72,
        revealSpacing: 0.5,
        holdPressure: 0.2,
        nextBeatPull: 0.82,
        reason: "The selected relationship still contains live semantic pressure.",
        arc: ["hook", "tighten", "consequence", "payoff"],
      }
    : {
        mode: "hold" as const,
        urgency: 0.45,
        compression: 0.55,
        revealSpacing: 0.7,
        holdPressure: 0.5,
        nextBeatPull: 0.62,
        reason: "Let the selected relationship become legible before forcing a new turn.",
        arc: ["hook", "reframe", "payoff", "open"],
      };

  const semanticTurnKeys = unique([
    ...previousValues(previous, "semanticTurnKeys"),
    ...relevantRelations.map(relationKey),
    ...steps.map((step) => `${step.operation}:${step.viewerChange}`),
  ]);
  const relationKinds = unique([
    ...previousValues(previous, "relationKinds"),
    ...relevantRelations.map((relation) => relation.kind),
    ...input.candidate.supportingRelationKinds,
  ]);
  const memoryHooks = unique([
    ...previousValues(previous, "memoryHooks"),
    ...callbackEventIds.map((id) => `callback:${id}`),
    ...activeTensions.map((value) => `tension:${value}`),
    ...(input.round && input.round > 1 ? [`return:${input.round}`] : []),
  ], 48);

  return {
    version: 1,
    realityAnchors: unique([
      ...previousValues(previous, "realityAnchors"),
      ...usedEventIds.map((id) => input.graph.events.find((event) => event.id === id)?.label ?? id),
    ], 64),
    establishedEventIds: unique([
      ...previousValues(previous, "establishedEventIds"),
      ...(steps[0]?.eventIds ?? []),
    ]),
    changedEventIds,
    carrierEventIds: unique([
      ...previousValues(previous, "carrierEventIds"),
      ...usedEventIds,
    ]),
    activeTensionKeys: activeTensions,
    resolvedTensionKeys: resolvedTensions,
    setupEventIds: unique([
      ...previousValues(previous, "setupEventIds"),
      ...(steps[0]?.eventIds ?? []),
    ]),
    callbackEventIds,
    revisitedEventIds,
    unresolvedQuestions,
    carryThreads,
    futureEventIds,
    futureThreadKeys,
    consumedFutureEventIds,
    retiredFutureThreadKeys,
    semanticTurnKeys,
    relationKinds,
    continuationValue,
    lookaheadValue,
    endpointPressure,
    attentionPotential: clamp(input.candidate.attentionPotential),
    tempo,
    selectedLens: input.lens?.trim() || input.candidate.lens,
    selectedSequenceId: input.candidate.id,
    payoffEventIds: unique(
      steps.filter((step) => step.operation === "payoff").flatMap((step) => step.eventIds),
    ),
    earnedByEventIds: usedEventIds,
    chapter: {
      openingEventIds: steps[0]?.eventIds ?? [],
      finalEventIds: steps.at(-1)?.eventIds ?? [],
      semanticTurns: steps.map((step) => step.viewerChange).filter(Boolean),
      operations: unique(steps.map((step) => step.operation)),
    },
    memoryHooks,
  };
}
