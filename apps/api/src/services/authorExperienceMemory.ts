import type {
  AuthorExperienceState,
  MemoryContext,
  MemoryEvent,
  MemoryWriteBatch,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const uniq = <T>(values: readonly T[], limit = 128): T[] =>
  [...new Set(values)].slice(0, limit);

export function mergeAuthorExperienceStates(
  states: readonly AuthorExperienceState[],
): AuthorExperienceState | undefined {
  const ordered = states.filter(Boolean);
  const latest = ordered.at(-1);
  if (!latest) return undefined;

  const strings = (key: keyof AuthorExperienceState): string[] =>
    uniq(ordered.flatMap((state) => {
      const value = state[key];
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    }));

  const numbers = (key: "continuationValue" | "lookaheadValue" | "endpointPressure" | "attentionPotential"): number =>
    Math.max(...ordered.map((state) => Number(state[key] ?? 0)));

  return {
    ...latest,
    establishedEventIds: strings("establishedEventIds"),
    changedEventIds: strings("changedEventIds"),
    carrierEventIds: strings("carrierEventIds"),
    activeTensionKeys: strings("activeTensionKeys"),
    resolvedTensionKeys: strings("resolvedTensionKeys"),
    setupEventIds: strings("setupEventIds"),
    callbackEventIds: strings("callbackEventIds"),
    revisitedEventIds: strings("revisitedEventIds"),
    unresolvedQuestions: strings("unresolvedQuestions").slice(-24),
    carryThreads: strings("carryThreads").slice(-32),
    futureEventIds: strings("futureEventIds").slice(-24),
    futureThreadKeys: strings("futureThreadKeys").slice(-32),
    semanticTurnKeys: strings("semanticTurnKeys"),
    relationKinds: strings("relationKinds"),
    continuationValue: numbers("continuationValue"),
    lookaheadValue: numbers("lookaheadValue"),
    endpointPressure: numbers("endpointPressure"),
    attentionPotential: numbers("attentionPotential"),
    memoryHooks: strings("memoryHooks").slice(-48),
  };
}

export function authorExperienceStateToMemoryBatch(input: {
  assetId: string;
  userId?: string;
  state: AuthorExperienceState;
  occurredAt?: string;
  sourceRef?: string;
}): MemoryWriteBatch {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const summary = [
    `Author chapter: ${input.state.chapter.operations.join(" → ") || "empty"}.`,
    `Tempo: ${input.state.tempo.mode}.`,
    `Changed: ${input.state.changedEventIds.join(", ") || "none"}.`,
    `Future: ${input.state.futureThreadKeys.slice(0, 4).join(", ") || "none"}.`,
  ].join(" ");

  return {
    assetId: input.assetId,
    userId: input.userId,
    entities: [],
    facts: [],
    relations: [],
    events: [
      {
        type: "author_experience_state",
        summary,
        occurredAt,
        source: "system",
        confidence: 1,
        entityIds: [],
        metadata: {
          authorExperienceState: input.state,
          sourceRef: input.sourceRef,
        },
      },
    ],
  };
}

export function extractAuthorExperienceStates(
  context: MemoryContext,
): AuthorExperienceState[] {
  return context.events
    .filter((event) => event.type === "author_experience_state")
    .map((event) => event.metadata?.authorExperienceState)
    .filter((value): value is AuthorExperienceState => {
      if (!value || typeof value !== "object") return false;
      const candidate = value as Partial<AuthorExperienceState>;
      return candidate.version === 1 && Boolean(candidate.tempo);
    });
}

export function authorExperienceMemoryContext(
  context: MemoryContext,
): string[] {
  const stateSummaries = extractAuthorExperienceStates(context).flatMap((state) => [
    `prior tempo: ${state.tempo.mode}`,
    ...state.carryThreads.slice(0, 8).map((value) => `carry: ${value}`),
    ...state.futureThreadKeys.slice(0, 8).map((value) => `future: ${value}`),
    ...state.revisitedEventIds.slice(0, 8).map((value) => `revisit: ${value}`),
  ]);

  const factSummaries = context.facts.slice(0, 40).map(
    (fact) => clean(`${fact.predicate}: ${fact.value}`),
  );

  const relationSummaries = context.relations.slice(0, 24).map(
    (relation) => clean(`${relation.fromEntityId} ${relation.relation} ${relation.toEntityId}`),
  );

  const eventSummaries = context.events
    .filter((event) => event.type !== "author_experience_state")
    .slice(0, 24)
    .map((event) => clean(event.summary));

  return uniq([...stateSummaries, ...factSummaries, ...relationSummaries, ...eventSummaries], 96);
}

export function isAuthorExperienceMemoryEvent(event: MemoryEvent): boolean {
  return event.type === "author_experience_state" && Boolean(event.metadata?.authorExperienceState);
}
