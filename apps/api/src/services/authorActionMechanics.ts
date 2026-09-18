import type {
  RealityEventStructure,
  RealityGraph,
} from "@qre/contracts";

/**
 * Domain-neutral mechanics already present in supplied reality.
 *
 * Mechanics are interpretive scaffolding, never new world facts. They may
 * influence movie search and lens ranking, but they can only cite supplied
 * event IDs and structural features extracted from RealityGraph.
 */
export type AuthorActionMechanicKind =
  | "sequence"
  | "territory"
  | "repetition"
  | "constraint"
  | "interruption"
  | "accumulation"
  | "transformation"
  | "competition"
  | "search"
  | "recovery"
  | "completion"
  | "return"
  | "handoff";

export type AuthorActionMechanic = {
  kind: AuthorActionMechanicKind;
  evidenceEventIds: string[];
  strength: number;
  reason: string;
  signals: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const lower = (value: unknown): string => clean(value).toLowerCase();

const metric = (value: number): number =>
  Number(
    Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(value) ? value : 0,
      ),
    ).toFixed(3),
  );

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const SEARCH_ACTION =
  /\b(?:search|searched|searching|inspect|inspected|inspection|check|checked|checking|test|tested|testing|find|found|scan|scanned|verify|verified|diagnos(?:e|ed|is|tic))\b/i;

const RECOVERY_ACTION =
  /\b(?:repair|repaired|fix|fixed|restore|restored|recover|recovered|reset|resolved|resolve|rebuild|rebuilt)\b/i;

const COMPLETION_ACTION =
  /\b(?:finish|finished|complete|completed|done|exit|exited|leave|left|closed|delivered|returned|pickup|picked up|wrapped|ended)\b/i;

const RETURN_ACTION =
  /\b(?:again|return|returned|back|revisit|revisited|repeat|repeated|same)\b/i;

const HANDOFF_ACTION =
  /\b(?:deliver|delivered|send|sent|pickup|picked up|handed|handoff|gave|give|transfer|transferred|returned|return)\b/i;

function structureFor(
  graph: RealityGraph,
  eventId: string,
): RealityEventStructure | undefined {
  return graph.eventStructure?.find(
    (item) => item.eventId === eventId,
  );
}

function eventLabel(
  graph: RealityGraph,
  eventId: string,
): string {
  return clean(
    graph.events.find((event) => event.id === eventId)
      ?.label,
  );
}

function add(
  target: Map<AuthorActionMechanicKind, AuthorActionMechanic>,
  mechanic: AuthorActionMechanic,
): void {
  const evidenceEventIds = unique(
    mechanic.evidenceEventIds,
  );
  if (!evidenceEventIds.length) return;

  const next: AuthorActionMechanic = {
    ...mechanic,
    evidenceEventIds,
    signals: unique(mechanic.signals).slice(0, 12),
    strength: metric(mechanic.strength),
  };

  const existing = target.get(next.kind);
  if (!existing || next.strength > existing.strength) {
    target.set(next.kind, next);
  }
}

function dynamicEvent(
  structure: RealityEventStructure | undefined,
): boolean {
  if (!structure) return false;

  /*
   * Mechanics describe movement already present in supplied reality.
   * Static profile/object/state facts remain excellent semantic material, but
   * they are not a run/campaign merely because they contain structured nouns.
   */
  return Boolean(
    structure.actions.length ||
      structure.temporalMarkers.length ||
      structure.transitionScore >= 0.55 ||
      structure.recurrenceScore >= 0.65,
  );
}

export function deriveAuthorActionMechanics(
  graph: RealityGraph,
  subject?: string,
): AuthorActionMechanic[] {
  const mechanics =
    new Map<AuthorActionMechanicKind, AuthorActionMechanic>();

  const eventIds = graph.events
    .filter((event) => clean(event.label))
    .map((event) => event.id);

  if (!eventIds.length) return [];

  const structures = eventIds
    .map((eventId) => structureFor(graph, eventId))
    .filter(
      (value): value is RealityEventStructure =>
        Boolean(value),
    );

  const actionableIds = eventIds.filter((eventId) =>
    dynamicEvent(structureFor(graph, eventId)),
  );

  if (actionableIds.length >= 2) {
    add(mechanics, {
      kind: "sequence",
      evidenceEventIds: actionableIds,
      strength: 0.58 + Math.min(0.32, actionableIds.length * 0.06),
      reason:
        "Several supplied actions/states form an ordered run that can be experienced as progression without changing the underlying events.",
      signals: ["ordered-events", String(actionableIds.length) + "-step-run"],
    });
  }

  const distinctPlaces = unique(
    graph.events
      .map((event) => event.place ?? "")
      .filter(Boolean),
  );

  const actionTargets = new Map<string, Set<string>>();
  for (const structure of structures) {
    const actions = unique(structure.actions.map(lower));
    const targets = unique(structure.objects.map(lower));
    for (const action of actions) {
      const set = actionTargets.get(action) ?? new Set<string>();
      for (const target of targets) set.add(target);
      actionTargets.set(action, set);
    }
  }

  const repeatedActionTargets = [...actionTargets.entries()]
    .filter(([, targets]) => targets.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)[0];

  if (
    distinctPlaces.length >= 2 ||
    repeatedActionTargets
  ) {
    const action =
      repeatedActionTargets?.[0] ?? "supplied action";
    const targets = repeatedActionTargets
      ? [...repeatedActionTargets[1]]
      : distinctPlaces;

    add(mechanics, {
      kind: "territory",
      evidenceEventIds: eventIds.filter((eventId) => {
        const event = graph.events.find(
          (item) => item.id === eventId,
        );
        const structure = structureFor(graph, eventId);
        return Boolean(
          (event?.place &&
            distinctPlaces.includes(event.place)) ||
            structure?.actions.some(
              (value) => lower(value) === action,
            ),
        );
      }),
      strength:
        0.58 +
        Math.min(
          0.3,
          Math.max(
            distinctPlaces.length,
            targets.length,
          ) * 0.07,
        ),
      reason:
        "The same supplied world is traversed across multiple places/targets, creating a grounded territory or zone mechanic.",
      signals: [
        ...distinctPlaces,
        ...(repeatedActionTargets
          ? [action + ":" + targets.join(",")]
          : []),
      ],
    });
  }

  const actionGroups = new Map<string, string[]>();
  for (const structure of structures) {
    for (const action of structure.actions) {
      const key = lower(action);
      if (!key) continue;
      actionGroups.set(
        key,
        unique([
          ...(actionGroups.get(key) ?? []),
          structure.eventId,
        ]),
      );
    }
  }

  const repeatedAction = [...actionGroups.entries()]
    .filter(([, ids]) => ids.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)[0];

  const recurrenceIds = unique([
    ...structures
      .filter((item) => item.recurrenceScore >= 0.6)
      .map((item) => item.eventId),
    ...(graph.patterns ?? [])
      .filter((pattern) => pattern.kind === "recurrence")
      .flatMap((pattern) => pattern.eventIds),
  ]);

  if (repeatedAction || recurrenceIds.length >= 2) {
    add(mechanics, {
      kind: "repetition",
      evidenceEventIds: unique([
        ...(repeatedAction?.[1] ?? []),
        ...recurrenceIds,
      ]),
      strength:
        0.62 +
        Math.min(
          0.28,
          Math.max(
            repeatedAction?.[1].length ?? 0,
            recurrenceIds.length,
          ) * 0.06,
        ),
      reason:
        "A supplied operation/detail repeats, supporting rounds, rhythm, recurrence, or endurance framing without inventing another occurrence.",
      signals: [
        ...(repeatedAction
          ? ["repeated-action:" + repeatedAction[0]]
          : []),
        "recurrence",
      ],
    });
  }

  const temporalIds = eventIds.filter((eventId) => {
    const event = graph.events.find(
      (item) => item.id === eventId,
    );
    const structure = structureFor(graph, eventId);
    return Boolean(
      event?.time ||
        structure?.temporalMarkers.length,
    );
  });

  if (temporalIds.length >= 2) {
    add(mechanics, {
      kind: "constraint",
      evidenceEventIds: temporalIds,
      strength:
        0.64 +
        Math.min(0.24, temporalIds.length * 0.05),
      reason:
        "Multiple supplied temporal anchors bound the real sequence, supporting clock/run/constraint pressure without inventing a deadline.",
      signals: temporalIds.map((id) => eventLabel(graph, id)),
    });
  }

  const anomalyIds = unique([
    ...structures
      .filter((item) => item.anomalyScore >= 0.6)
      .map((item) => item.eventId),
    ...(graph.patterns ?? [])
      .filter(
        (pattern) =>
          pattern.kind === "anomaly" ||
          pattern.kind === "tension",
      )
      .flatMap((pattern) => pattern.eventIds),
  ]);

  if (anomalyIds.length) {
    add(mechanics, {
      kind: "interruption",
      evidenceEventIds: anomalyIds,
      strength:
        0.62 +
        Math.min(0.3, anomalyIds.length * 0.07),
      reason:
        "A supplied anomaly/tension interrupts the dominant pattern and can function as an obstacle, turn, or plot interruption.",
      signals: anomalyIds.map((id) => eventLabel(graph, id)),
    });
  }

  if (actionableIds.length >= 3) {
    add(mechanics, {
      kind: "accumulation",
      evidenceEventIds: actionableIds,
      strength:
        0.56 +
        Math.min(0.32, actionableIds.length * 0.05),
      reason:
        "Several supplied actions/details accumulate toward an endpoint, supporting escalation, streak, clearance, or progressive compression.",
      signals: [String(actionableIds.length) + "-evidence-accumulation"],
    });
  }

  const transformationRelations = graph.relations.filter(
    (relation) =>
      relation.kind === "changes" ||
      relation.kind === "recontextualizes",
  );

  const transitionPatternIds = unique(
    (graph.patterns ?? [])
      .filter((pattern) => pattern.kind === "transition")
      .flatMap((pattern) => pattern.eventIds),
  );

  const firstState = structures.find(
    (item) => item.states.length,
  );
  const lastState = [...structures]
    .reverse()
    .find((item) => item.states.length);

  const stateShift =
    firstState &&
    lastState &&
    lower(firstState.states[0]) !==
      lower(lastState.states[0]);

  if (
    transformationRelations.length ||
    transitionPatternIds.length >= 2 ||
    stateShift
  ) {
    add(mechanics, {
      kind: "transformation",
      evidenceEventIds: unique([
        ...transformationRelations.flatMap((relation) => [
          relation.from,
          relation.to,
        ]),
        ...transitionPatternIds,
        ...(stateShift
          ? [firstState!.eventId, lastState!.eventId]
          : []),
      ]),
      strength: 0.78,
      reason:
        "Supplied before/after state or meaning changes create a transformation mechanic while preserving the exact underlying reality.",
      signals: [
        ...transformationRelations.map(
          (relation) => relation.kind,
        ),
        ...(stateShift
          ? [
              String(firstState!.states[0]) +
                "→" +
                String(lastState!.states[0]),
            ]
          : []),
      ],
    });
  }

  const contrastRelations = graph.relations.filter(
    (relation) => relation.kind === "contrasts",
  );

  if (contrastRelations.length) {
    add(mechanics, {
      kind: "competition",
      evidenceEventIds: unique(
        contrastRelations.flatMap((relation) => [
          relation.from,
          relation.to,
        ]),
      ),
      strength:
        0.58 +
        Math.min(
          0.22,
          contrastRelations.length * 0.08,
        ),
      reason:
        "Supplied contrast/opposition can support rivalry or duel-like framing as perception only; no competitor or contest is invented.",
      signals: ["contrast"],
    });
  }

  const searchIds = eventIds.filter((eventId) => {
    const structure = structureFor(graph, eventId);
    const text = [
      eventLabel(graph, eventId),
      ...(structure?.actions ?? []),
      ...(structure?.semanticTags ?? []),
    ].join(" ");
    return SEARCH_ACTION.test(text);
  });

  if (searchIds.length) {
    add(mechanics, {
      kind: "search",
      evidenceEventIds: searchIds,
      strength:
        0.64 +
        Math.min(0.24, searchIds.length * 0.06),
      reason:
        "Supplied inspection/search/verification actions support investigation or hunt mechanics without inventing clues.",
      signals: ["search/inspection"],
    });
  }

  const recoveryIds = eventIds.filter((eventId) => {
    const structure = structureFor(graph, eventId);
    const text = [
      eventLabel(graph, eventId),
      ...(structure?.actions ?? []),
      ...(structure?.states ?? []),
    ].join(" ");
    return RECOVERY_ACTION.test(text);
  });

  if (
    recoveryIds.length &&
    (transformationRelations.length || stateShift)
  ) {
    add(mechanics, {
      kind: "recovery",
      evidenceEventIds: unique([
        ...recoveryIds,
        ...transformationRelations.flatMap((relation) => [
          relation.from,
          relation.to,
        ]),
      ]),
      strength: 0.72,
      reason:
        "Supplied repair/recovery actions participate in a grounded before→after change.",
      signals: ["recovery", "repair/change"],
    });
  }

  const completionIds = eventIds.filter((eventId) => {
    const structure = structureFor(graph, eventId);
    const text = [
      eventLabel(graph, eventId),
      ...(structure?.actions ?? []),
      ...(structure?.semanticTags ?? []),
    ].join(" ");
    return COMPLETION_ACTION.test(text);
  });

  if (
    completionIds.length ||
    (actionableIds.length >= 2 && temporalIds.length >= 2)
  ) {
    add(mechanics, {
      kind: "completion",
      evidenceEventIds: unique([
        ...actionableIds,
        ...completionIds,
        ...temporalIds,
      ]),
      strength:
        completionIds.length
          ? 0.82
          : 0.7,
      reason:
        "The supplied run has an explicit or structurally bounded endpoint, supporting mission/run/completion payoff language without inventing an outcome.",
      signals: completionIds.length
        ? completionIds.map((id) => eventLabel(graph, id))
        : ["bounded-run"],
    });
  }

  const returnIds = eventIds.filter((eventId) => {
    const text = eventLabel(graph, eventId);
    const structure = structureFor(graph, eventId);
    return Boolean(
      RETURN_ACTION.test(text) ||
        (structure?.recurrenceScore ?? 0) >= 0.65,
    );
  });

  if (returnIds.length) {
    add(mechanics, {
      kind: "return",
      evidenceEventIds: returnIds,
      strength:
        0.7 +
        Math.min(0.22, returnIds.length * 0.06),
      reason:
        "Supplied return/recurrence evidence can re-open earlier meaning instead of being treated as a brand-new disconnected story.",
      signals: ["return/revisit"],
    });
  }

  const handoffIds = eventIds.filter((eventId) => {
    const structure = structureFor(graph, eventId);
    const text = [
      eventLabel(graph, eventId),
      ...(structure?.actions ?? []),
    ].join(" ");
    return HANDOFF_ACTION.test(text);
  });

  if (handoffIds.length) {
    add(mechanics, {
      kind: "handoff",
      evidenceEventIds: handoffIds,
      strength:
        0.62 +
        Math.min(0.24, handoffIds.length * 0.06),
      reason:
        "Supplied movement/transfer/handoff actions support delivery/extraction/handoff perception without inventing participants or cargo.",
      signals: ["handoff/movement"],
    });
  }

  return [...mechanics.values()]
    .map((mechanic) => ({
      ...mechanic,
      evidenceEventIds: mechanic.evidenceEventIds.filter(
        (id) => eventIds.includes(id),
      ),
      signals: unique([
        ...mechanic.signals,
        ...(subject ? ["subject:" + clean(subject)] : []),
      ]).slice(0, 12),
    }))
    .filter((mechanic) => mechanic.evidenceEventIds.length > 0)
    .sort(
      (left, right) =>
        right.strength - left.strength ||
        left.kind.localeCompare(right.kind),
    )
    .slice(0, 12);
}
