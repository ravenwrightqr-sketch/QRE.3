import type {
  ExperienceState,
  MemoryContext,
  MemoryEvent,
  MemoryWriteBatch,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

function unique<T>(values: readonly T[], limit = 128): T[] {
  return [...new Set(values)].slice(0, limit);
}

function stringField(states: readonly ExperienceState[], key: keyof ExperienceState): string[] {
  return unique(
    states.flatMap((state) => {
      const value = state[key];
      return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && Boolean(clean(item)))
        : [];
    }),
  );
}

function maxNumber(states: readonly ExperienceState[], key: "continuationValue" | "lookaheadValue" | "endpointPressure" | "attentionPotential"): number {
  return Math.max(0, ...states.map((state) => Number(state[key] ?? 0)));
}

export function mergeExperienceStates(states: readonly ExperienceState[]): ExperienceState | undefined {
  const ordered = states.filter(Boolean);
  const latest = ordered.at(-1);
  if (!latest) return undefined;

  return {
    ...latest,
    realityAnchors: stringField(ordered, "realityAnchors").slice(-64),
    establishedEventIds: stringField(ordered, "establishedEventIds"),
    changedEventIds: stringField(ordered, "changedEventIds"),
    carrierEventIds: stringField(ordered, "carrierEventIds"),
    activeTensionKeys: stringField(ordered, "activeTensionKeys"),
    resolvedTensionKeys: stringField(ordered, "resolvedTensionKeys"),
    setupEventIds: stringField(ordered, "setupEventIds"),
    callbackEventIds: stringField(ordered, "callbackEventIds"),
    revisitedEventIds: stringField(ordered, "revisitedEventIds"),
    unresolvedQuestions: stringField(ordered, "unresolvedQuestions").slice(-24),
    carryThreads: stringField(ordered, "carryThreads").slice(-32),
    futureEventIds: stringField(ordered, "futureEventIds").slice(-24),
    futureThreadKeys: stringField(ordered, "futureThreadKeys").slice(-32),
    consumedFutureEventIds: stringField(ordered, "consumedFutureEventIds").slice(-24),
    retiredFutureThreadKeys: stringField(ordered, "retiredFutureThreadKeys").slice(-32),
    semanticTurnKeys: stringField(ordered, "semanticTurnKeys"),
    relationKinds: stringField(ordered, "relationKinds"),
    continuationValue: maxNumber(ordered, "continuationValue"),
    lookaheadValue: maxNumber(ordered, "lookaheadValue"),
    endpointPressure: maxNumber(ordered, "endpointPressure"),
    attentionPotential: maxNumber(ordered, "attentionPotential"),
    memoryHooks: stringField(ordered, "memoryHooks").slice(-48),
  };
}

export function experienceStateToMemoryBatch(input: {
  operationId?: string;
  assetId: string;
  userId?: string;
  state: ExperienceState;
  occurredAt?: string;
  sourceRef?: string;
}): MemoryWriteBatch {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const summary = [
    `Experience chapter: ${input.state.chapter.operations.join(" → ") || "empty"}.`,
    `Tempo: ${input.state.tempo.mode}.`,
    `Changed: ${input.state.changedEventIds.join(", ") || "none"}.`,
    `Future: ${input.state.futureThreadKeys.slice(0, 4).join(", ") || "none"}.`,
    `Retired future: ${input.state.retiredFutureThreadKeys.slice(0, 4).join(", ") || "none"}.`,
    `Reality anchors: ${(input.state.realityAnchors ?? []).slice(0, 6).join(" | ") || "none"}.`,
    `Relationships: ${input.state.relationKinds.slice(0, 6).join(", ") || "none"}.`,
    `Memory hooks: ${input.state.memoryHooks.slice(0, 4).join(" | ") || "none"}.`,
  ].join(" ");

  return {
    operationId: input.operationId,
    assetId: input.assetId,
    userId: input.userId,
    entities: [],
    facts: [],
    relations: [],
    events: [
      {
        type: "experience_state",
        summary,
        occurredAt,
        source: "system",
        confidence: 1,
        entityIds: [],
        metadata: {
          experienceState: input.state,
          sourceRef: input.sourceRef ?? "qre-author-state",
        },
      },
    ],
  };
}

function validState(value: unknown): value is ExperienceState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Partial<ExperienceState>;
  return (
    state.version === 1 &&
    Boolean(state.tempo) &&
    Array.isArray(state.chapter?.operations) &&
    Array.isArray(state.realityAnchors ?? []) &&
    Array.isArray(state.relationKinds)
  );
}

export function extractExperienceStates(context: MemoryContext): ExperienceState[] {
  return context.events
    .filter((event) => event.type === "experience_state")
    .map((event) => event.metadata?.experienceState)
    .filter(validState);
}

export function experienceMemoryContext(context: MemoryContext): string[] {
  const states = extractExperienceStates(context);
  const stateLines = states.flatMap((state) => [
    `prior tempo: ${state.tempo.mode}`,
    `prior proposition pattern: ${state.selectedLens}`,
    ...state.relationKinds.slice(0, 8).map((value) => `prior relationship: ${value}`),
    ...(state.realityAnchors ?? []).slice(-12).map((value) => `prior anchor: ${value}`),
    ...state.carryThreads.slice(-8).map((value) => `carry: ${value}`),
    ...state.futureThreadKeys.slice(-8).map((value) => `future: ${value}`),
    ...state.revisitedEventIds.slice(-8).map((value) => `revisited: ${value}`),
    ...state.unresolvedQuestions.slice(-6).map((value) => `unresolved: ${value}`),
    ...state.memoryHooks.slice(-6).map((value) => `memory hook: ${value}`),
  ]);

  const facts = context.facts.slice(0, 48).map((fact) =>
    clean(`${fact.predicate}: ${fact.value}`),
  );
  const relations = context.relations.slice(0, 32).map((relation) =>
    clean(`${relation.fromEntityId} ${relation.relation} ${relation.toEntityId}`),
  );
  const events = context.events
    .filter((event: MemoryEvent) => event.type !== "experience_state")
    .slice(0, 48)
    .map((event) => clean(event.summary));

  return unique([...stateLines, ...facts, ...relations, ...events], 160);
}
