/**
 * QRE UNIVERSAL MOVIE SEARCH
 *
 * Deterministic trajectory search over the immutable RealityGraph.
 *
 * The model is not asked to invent a movie here.
 *
 * SEARCH MODEL
 * - relation-centered hypotheses
 * - multiple graph paths instead of one bridge
 * - explicit support for all RealityRelation kinds
 * - endpoint search over connected and semantically terminal events
 * - recontextualization / contrast / change / recurrence / convergence /
 *   causation / membership / temporal structure
 * - bounded beam search over trajectory states
 * - lens-specific interpretation without lens-specific facts
 * - trajectory-level scoring
 * - diversity across evidence path and operation pattern
 * - multiple hypotheses may share evidence when their meaning structure differs
 *
 * REALITY IS IMMUTABLE.
 * THE LENS CHANGES INTERPRETATION, NOT FACTS.
 * THE MOVIE IS A SEARCH RESULT OVER THE GRAPH.
 */

import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import { scoreWholeWorldSequence } from "./authorWholeWorldSequenceScorer.js";
const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const lower = (value: unknown): string =>
  clean(value).toLowerCase();

const metric = (value: number): number =>
  Number(
    Math.max(
      0,
      Math.min(1, value),
    ).toFixed(3),
  );

const unique = <T>(
  values: readonly T[],
): T[] => [
  ...new Set(values),
];

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "from",
  "by",
  "through",
  "after",
  "before",
  "then",
  "now",
  "very",
  "just",
  "still",
  "again",
  "this",
  "that",
  "it",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "as",
  "into",
  "my",
  "your",
  "our",
  "their",
  "his",
  "her",
  "its",
  "he",
  "she",
  "they",
  "them",
  "you",
  "we",
  "me",
  "what",
  "why",
  "how",
  "does",
  "becomes",
  "become",
  "makes",
  "make",
]);

const LENS_HINTS: Record<string, string[]> = {
  funny: [
    "contrast",
    "status_inversion",
    "understatement",
    "callback",
    "recontextualization",
    "changes",
  ],

  comedy: [
    "contrast",
    "status_inversion",
    "understatement",
    "callback",
    "recontextualization",
    "changes",
  ],

  humorous: [
    "contrast",
    "status_inversion",
    "understatement",
    "callback",
    "recontextualization",
    "changes",
  ],

  romance: [
    "convergence",
    "recurrence",
    "recontextualization",
    "consequence",
    "changes",
    "after",
  ],

  romantic: [
    "convergence",
    "recurrence",
    "recontextualization",
    "consequence",
    "changes",
    "after",
  ],

  horror: [
    "contrast",
    "recontextualization",
    "uncertainty",
    "consequence",
    "before",
    "after",
    "changes",
    "repeats",
  ],

  creepy: [
    "contrast",
    "recontextualization",
    "uncertainty",
    "consequence",
    "before",
    "after",
    "changes",
    "repeats",
  ],

  sentimental: [
    "recurrence",
    "convergence",
    "recontextualization",
    "consequence",
    "changes",
    "after",
  ],

  emotional: [
    "recurrence",
    "convergence",
    "recontextualization",
    "consequence",
    "changes",
    "after",
  ],

  absurd: [
    "contrast",
    "status_inversion",
    "convergence",
    "callback",
    "recontextualization",
    "changes",
  ],

  demented: [
    "contrast",
    "status_inversion",
    "consequence",
    "recontextualization",
    "recurrence",
    "changes",
  ],

  chaotic: [
    "contrast",
    "consequence",
    "convergence",
    "callback",
    "changes",
    "recontextualization",
  ],

  neutral: [
    "recontextualization",
    "change",
    "consequence",
    "convergence",
    "recurrence",
    "changes",
  ],
};

const RELATION_KIND_VALUES: readonly RealityRelation["kind"][] = [
  "contrasts",
  "recontextualizes",
  "changes",
  "repeats",
  "converges",
  "before",
  "after",
  "causes",
  "involves",
  "belongs_to",
];

const SEARCH_RELATION_KINDS: readonly RealityRelation["kind"][] = [
  "contrasts",
  "recontextualizes",
  "changes",
  "repeats",
  "converges",
  "before",
  "after",
  "causes",
  "involves",
  "belongs_to",
];

type TrajectoryState = {
  steps: LatentMovieTrajectoryStep[];

  usedEventIds: string[];
  usedRelationKeys: string[];

  establishedEventIds: string[];

  semanticTurnKeys: string[];

  activeTensionKeys: string[];
  resolvedTensionKeys: string[];

  setupEventIds: string[];

  recurringThreadKeys: string[];

  unresolvedQuestionKeys: string[];

  endpointPressure: number;
  continuationValue: number;
  lookaheadValue: number;
  lensPressure: number;

  score: number;
};
function tokenize(
  text: string,
): string[] {
  return unique(
    lower(text)
      .replace(
        /[^a-z0-9'’-]+/g,
        " ",
      )
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 3 &&
          !STOP.has(token),
      ),
  ).slice(0, 24);
}

function tokenOverlap(
  a: string,
  b: string,
): number {
  const left = new Set(
    tokenize(a),
  );

  const right = new Set(
    tokenize(b),
  );

  if (
    !left.size ||
    !right.size
  ) {
    return 0;
  }

  let hits = 0;

  for (
    const token of left
  ) {
    if (
      right.has(token)
    ) {
      hits += 1;
    }
  }

  return (
    hits /
    Math.max(
      1,
      Math.min(
        left.size,
        right.size,
      ),
    )
  );
}

function event(
  graph: RealityGraph,
  id: string,
) {
  return graph.events.find(
    (item) =>
      item.id === id,
  );
}

function relationKey(
  relation: RealityRelation,
): string {
  return [
    relation.kind,
    relation.from,
    relation.to,
  ].join(":");
}
function eventLabel(
  graph: RealityGraph,
  eventId: string,
): string {
  return clean(
    event(
      graph,
      eventId,
    )?.label,
  );
}

function semanticTransitionKey(
  graph: RealityGraph,
  relation: RealityRelation,
): string {
  return [
    relation.kind,
    relation.from,
    relation.to,
    eventLabel(
      graph,
      relation.from,
    ),
    eventLabel(
      graph,
      relation.to,
    ),
  ].join("::");
}
function relationBetween(
  graph: RealityGraph,
  from: string,
  to: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (
          relation.from ===
            from &&
          relation.to === to
        ) ||
        (
          relation.from ===
            to &&
          relation.to === from
        ),
    )
    .sort(
      (a, b) =>
        (
          b.strength *
          relationWeight(
            b.kind,
          )
        ) -
        (
          a.strength *
          relationWeight(
            a.kind,
          )
        ),
    )[0];
}

function incidentRelations(
  graph: RealityGraph,
  eventId: string,
): RealityRelation[] {
  return graph.relations.filter(
    (relation) =>
      relation.from ===
        eventId ||
      relation.to ===
        eventId,
  );
}

function relationWeight(
  kind: RealityRelation["kind"],
): number {
  switch (kind) {
    case "contrasts":
      return 1;

    case "recontextualizes":
      return 0.98;

    case "changes":
      return 0.95;

    case "causes":
      return 0.93;

    case "repeats":
      return 0.89;

    case "converges":
      return 0.87;

    case "before":
    case "after":
      return 0.78;

    case "belongs_to":
      return 0.69;

    case "involves":
      return 0.64;

    default:
      return 0.55;
  }
}

function operationForRelation(
  kind: RealityRelation["kind"],
): LatentMovieTrajectoryStep["operation"] {
  switch (kind) {
    case "contrasts":
      return "contrast";

    case "recontextualizes":
      return "reframe";

    case "changes":
      return "reveal";

    case "repeats":
      return "recur";

    case "converges":
      return "converge";

    case "causes":
      return "consequence";

    case "before":
    case "after":
      return "consequence";

    case "belongs_to":
      return "reveal";

    case "involves":
      return "reveal";

    default:
      return "converge";
  }
}

function lensKeywords(
  lens?: string,
): string[] {
  const text =
    lower(lens);

  if (
    !text ||
    text === "let qre decide"
  ) {
    return LENS_HINTS.neutral;
  }

  const out: string[] = [];

  for (
    const [key, values] of
    Object.entries(
      LENS_HINTS,
    )
  ) {
    if (
      text.includes(key)
    ) {
      out.push(
        ...values,
      );
    }
  }

  return unique(
    out.length
      ? out
      : LENS_HINTS.neutral,
  );
}
function relationPreference(
  kind: RealityRelation["kind"],
  lens?: string,
): number {
  const text = lower(lens);

  if (
    !text ||
    text === "let qre decide"
  ) {
    return 0.72;
  }

  const profiles: Record<
    string,
    Partial<
      Record<
        RealityRelation["kind"],
        number
      >
    >
  > = {
    funny: {
      contrasts: 1,
      recontextualizes: 0.92,
      changes: 0.86,
      causes: 0.68,
      repeats: 0.55,
      converges: 0.48,
      before: 0.42,
      after: 0.42,
      involves: 0.36,
      belongs_to: 0.4,
    },

    comedy: {
      contrasts: 1,
      recontextualizes: 0.92,
      changes: 0.86,
      causes: 0.68,
      repeats: 0.55,
      converges: 0.48,
      before: 0.42,
      after: 0.42,
      involves: 0.36,
      belongs_to: 0.4,
    },

    humorous: {
      contrasts: 1,
      recontextualizes: 0.92,
      changes: 0.86,
      causes: 0.68,
      repeats: 0.55,
      converges: 0.48,
      before: 0.42,
      after: 0.42,
      involves: 0.36,
      belongs_to: 0.4,
    },

    romance: {
      converges: 1,
      repeats: 0.9,
      recontextualizes: 0.86,
      causes: 0.84,
      after: 0.82,
      changes: 0.78,
      contrasts: 0.55,
      before: 0.5,
      involves: 0.44,
      belongs_to: 0.42,
    },

    romantic: {
      converges: 1,
      repeats: 0.9,
      recontextualizes: 0.86,
      causes: 0.84,
      after: 0.82,
      changes: 0.78,
      contrasts: 0.55,
      before: 0.5,
      involves: 0.44,
      belongs_to: 0.42,
    },

    horror: {
      before: 1,
      after: 1,
      repeats: 0.96,
      causes: 0.94,
      contrasts: 0.9,
      recontextualizes: 0.86,
      changes: 0.72,
      converges: 0.46,
      involves: 0.4,
      belongs_to: 0.38,
    },

    creepy: {
      before: 1,
      after: 1,
      repeats: 0.96,
      causes: 0.94,
      contrasts: 0.9,
      recontextualizes: 0.86,
      changes: 0.72,
      converges: 0.46,
      involves: 0.4,
      belongs_to: 0.38,
    },

    sentimental: {
      repeats: 1,
      converges: 0.94,
      recontextualizes: 0.88,
      causes: 0.84,
      after: 0.82,
      changes: 0.78,
      contrasts: 0.48,
      before: 0.5,
      involves: 0.44,
      belongs_to: 0.42,
    },

    emotional: {
      repeats: 1,
      converges: 0.94,
      recontextualizes: 0.88,
      causes: 0.84,
      after: 0.82,
      changes: 0.78,
      contrasts: 0.48,
      before: 0.5,
      involves: 0.44,
      belongs_to: 0.42,
    },

    absurd: {
      contrasts: 1,
      converges: 0.88,
      recontextualizes: 0.86,
      changes: 0.82,
      repeats: 0.64,
      causes: 0.62,
      before: 0.48,
      after: 0.48,
      involves: 0.4,
      belongs_to: 0.42,
    },

    demented: {
      contrasts: 1,
      causes: 0.9,
      recontextualizes: 0.88,
      repeats: 0.84,
      changes: 0.78,
      converges: 0.58,
      before: 0.5,
      after: 0.5,
      involves: 0.38,
      belongs_to: 0.4,
    },

    chaotic: {
      contrasts: 0.96,
      causes: 0.92,
      converges: 0.88,
      recontextualizes: 0.84,
      changes: 0.82,
      repeats: 0.7,
      before: 0.54,
      after: 0.54,
      involves: 0.4,
      belongs_to: 0.4,
    },

    neutral: {
      recontextualizes: 0.75,
      changes: 0.75,
      causes: 0.74,
      converges: 0.73,
      repeats: 0.72,
      contrasts: 0.72,
      before: 0.7,
      after: 0.7,
      involves: 0.62,
      belongs_to: 0.62,
    },
  };

  const key =
    Object.keys(
      profiles,
    ).find(
      (candidate) =>
        text.includes(candidate),
    ) ?? "neutral";

  return (
    profiles[key]?.[kind] ??
    0.45
  );
}

function eventSpecificity(
  graph: RealityGraph,
  eventId: string,
): number {
  const item =
    event(
      graph,
      eventId,
    );

  if (!item) {
    return 0;
  }

  return metric(
    Math.min(
      1,
      tokenize(
        item.label,
      ).length *
        0.09 +
        Math.min(
          10,
          item.entities.length,
        ) *
          0.045,
    ),
  );
}

function graphCentrality(
  graph: RealityGraph,
  eventId: string,
): number {
  const relations =
    incidentRelations(
      graph,
      eventId,
    );

  if (!relations.length) {
    return 0;
  }

  return metric(
    relations.reduce(
      (
        sum,
        relation,
      ) =>
        sum +
        relation.strength *
          relationWeight(
            relation.kind,
          ),
      0,
    ) /
      Math.max(
        1,
        relations.length,
      ),
  );
}

function terminality(
  graph: RealityGraph,
  eventId: string,
): number {
  const item =
    event(
      graph,
      eventId,
    );

  if (!item) {
    return 0;
  }

  const incoming =
    graph.relations.filter(
      (relation) =>
        relation.to ===
        eventId,
    );

  const outgoing =
    graph.relations.filter(
      (relation) =>
        relation.from ===
        eventId,
    );

  const meaningfulIncoming =
    incoming.filter(
      (relation) =>
        [
          "changes",
          "recontextualizes",
          "contrasts",
          "converges",
          "repeats",
          "causes",
          "after",
        ].includes(
          relation.kind,
        ),
    );

  const semanticIncoming =
    meaningfulIncoming.reduce(
      (
        sum,
        relation,
      ) =>
        sum +
        relation.strength *
          relationWeight(
            relation.kind,
          ),
      0,
    );

  const stateBonus =
    item.emotionalState
      ? 0.22
      : 0;

  const incomingBonus =
    Math.min(
      1,
      semanticIncoming *
        0.2,
    );

  const connectivityBonus =
    Math.min(
      1,
      (
        incoming.length +
        outgoing.length
      ) *
        0.04,
    );

  const specificityBonus =
    eventSpecificity(
      graph,
      eventId,
    ) *
    0.18;

  return metric(
    stateBonus +
      incomingBonus +
      connectivityBonus +
      specificityBonus,
  );
}

function endpointAffinity(
  graph: RealityGraph,
  eventId: string,
  usedEventIds: readonly string[],
): number {
  const used =
    new Set(
      usedEventIds,
    );

  const item =
    event(
      graph,
      eventId,
    );

  if (!item) {
    return 0;
  }

  const connectedToUsed =
    incidentRelations(
      graph,
      eventId,
    ).filter(
      (relation) =>
        used.has(
          relation.from,
        ) ||
        used.has(
          relation.to,
        ),
    );

  const relationStrength =
    connectedToUsed.reduce(
      (
        sum,
        relation,
      ) =>
        sum +
        relation.strength *
          relationWeight(
            relation.kind,
          ),
      0,
    );

  const connection =
    Math.min(
      1,
      relationStrength *
        0.18,
    );

  const terminal =
    terminality(
      graph,
      eventId,
    );

  const emotional =
    item.emotionalState
      ? 0.2
      : 0;

  const recurrence =
    graph.recurringSignals
      .length &&
    connectedToUsed.some(
      (relation) =>
        relation.kind ===
        "repeats",
    )
      ? 0.15
      : 0;

  const reuseBonus =
    used.has(
      eventId,
    )
      ? terminal >=
        0.55
        ? 0.08
        : -0.1
      : 0;

  return metric(
    terminal * 0.48 +
      connection * 0.24 +
      emotional +
      recurrence +
      reuseBonus,
  );
}

function semanticTurn(
  graph: RealityGraph,
  relation: RealityRelation,
): string {
  const from =
    event(
      graph,
      relation.from,
    );

  const to =
    event(
      graph,
      relation.to,
    );

  const fromLabel =
    clean(
      from?.label,
    );

  const toLabel =
    clean(
      to?.label,
    );

  switch (
    relation.kind
  ) {
    case "contrasts":
      return `the later supplied detail overturns the expectation created by ${fromLabel}`;

    case "recontextualizes":
      return `the later supplied detail changes the meaning of ${fromLabel}`;

    case "changes":
      return `the supplied state shifts from ${fromLabel} toward ${toLabel}`;

    case "repeats":
      return `a recurring detail gains new meaning through ${toLabel}`;

    case "converges":
      return `${fromLabel} and ${toLabel} become meaningfully connected`;

    case "causes":
      return `${fromLabel} changes what becomes possible in ${toLabel}`;

    case "before":
      return `${fromLabel} gives the later detail in ${toLabel} new significance`;

    case "after":
      return `${toLabel} now carries the meaning created by ${fromLabel}`;

    case "belongs_to":
      return `${fromLabel} matters through its relationship to ${toLabel}`;

    case "involves":
      return `${fromLabel} becomes meaningful through its relationship to ${toLabel}`;

    default:
      return `the relationship between ${fromLabel} and ${toLabel} changes the reading`;
  }
}

function nextQuestion(
  relation: RealityRelation,
): string {
  switch (
    relation.kind
  ) {
    case "contrasts":
      return "What expectation changes here?";

    case "recontextualizes":
      return "What does this make newly meaningful?";

    case "changes":
      return "What becomes possible or different now?";

    case "repeats":
      return "Why does this matter more now?";

    case "converges":
      return "What becomes connected here?";

    case "causes":
      return "What consequence follows from this?";

    case "before":
    case "after":
      return "What consequence follows from this relationship?";

    case "belongs_to":
      return "What larger meaning does this reveal?";

    case "involves":
      return "What does this relationship make newly meaningful?";

    default:
      return "What does this relationship make newly meaningful?";
  }
}

function chooseOpeningEvent(
  graph: RealityGraph,
  relation: RealityRelation,
  lens?: string,
): string {
  const fromScore =
    eventSpecificity(
      graph,
      relation.from,
    ) *
      0.34 +
    graphCentrality(
      graph,
      relation.from,
    ) *
      0.28 +
    endpointAffinity(
      graph,
      relation.from,
      [],
    ) *
      0.08 +
    relationPreference(
      relation.kind,
      lens,
    ) *
      0.15 +
    terminality(
      graph,
      relation.from,
    ) *
      0.15;

  const toScore =
    eventSpecificity(
      graph,
      relation.to,
    ) *
      0.34 +
    graphCentrality(
      graph,
      relation.to,
    ) *
      0.28 +
    endpointAffinity(
      graph,
      relation.to,
      [],
    ) *
      0.08 +
    relationPreference(
      relation.kind,
      lens,
    ) *
      0.15 +
    terminality(
      graph,
      relation.to,
    ) *
      0.15;

  return fromScore >=
    toScore
    ? relation.from
    : relation.to;
}

function orientedOtherEnd(
  relation: RealityRelation,
  currentEventId: string,
): string {
  return relation.from ===
    currentEventId
    ? relation.to
    : relation.from;
}
function persistentSignalAffinity(
  text: string,
  signals: readonly string[],
): number {
  if (
    !clean(text) ||
    !signals.length
  ) {
    return 0;
  }

  return metric(
    Math.max(
      ...signals.map(
        (signal) =>
          tokenOverlap(
            text,
            signal,
          ),
      ),
    ),
  );
}

function relationContinuity(
  graph: RealityGraph,
  relation: RealityRelation,
  state: TrajectoryState,
): number {
  const fromLabel =
    eventLabel(
      graph,
      relation.from,
    );

  const toLabel =
    eventLabel(
      graph,
      relation.to,
    );

  const recurring =
    Math.max(
      persistentSignalAffinity(
        fromLabel,
        graph.recurringSignals,
      ),
      persistentSignalAffinity(
        toLabel,
        graph.recurringSignals,
      ),
    );

  const tension =
    Math.max(
      persistentSignalAffinity(
        fromLabel,
        graph.unresolvedTensions,
      ),
      persistentSignalAffinity(
        toLabel,
        graph.unresolvedTensions,
      ),
    );

  const establishedConnection =
    state.establishedEventIds.includes(
      relation.from,
    ) ||
    state.establishedEventIds.includes(
      relation.to,
    );

  return metric(
    recurring * 0.34 +
      tension * 0.34 +
      (
        establishedConnection
          ? 0.18
          : 0
      ) +
      (
        state.semanticTurnKeys.length
          ? 0.14
          : 0
      ),
  );
}
function inheritanceValue(
  graph: RealityGraph,
  relation: RealityRelation,
  state: TrajectoryState,
): number {
  const targetId =
    orientedOtherEnd(
      relation,
      relation.from,
    );

  const targetLabel =
    eventLabel(
      graph,
      targetId,
    );

  const established =
    state.establishedEventIds.includes(
      targetId,
    );

  const setup =
    state.setupEventIds.includes(
      targetId,
    );

  const targetRecurring =
    persistentSignalAffinity(
      targetLabel,
      graph.recurringSignals,
    );

  const targetTension =
    persistentSignalAffinity(
      targetLabel,
      graph.unresolvedTensions,
    );

  const activeTensionConnection =
    state.activeTensionKeys.some(
      (key) =>
        key.includes(
          relation.from,
        ) ||
        key.includes(
          relation.to,
        ),
    );

  const resolvedTensionConnection =
    state.resolvedTensionKeys.some(
      (key) =>
        key.includes(
          relation.from,
        ) ||
        key.includes(
          relation.to,
        ),
    );

  const semanticCarry =
    state.semanticTurnKeys.length
      ? Math.min(
          1,
          state.semanticTurnKeys.length /
            4,
        )
      : 0;

  return metric(
    (established
      ? 0.18
      : 0) +
      (setup
        ? 0.18
        : 0) +
      targetRecurring *
        0.14 +
      targetTension *
        0.14 +
      (activeTensionConnection
        ? 0.18
        : 0) +
      (resolvedTensionConnection
        ? 0.06
        : 0) +
      semanticCarry *
        0.12,
  );
}
function setupValueForRelation(
  graph: RealityGraph,
  relation: RealityRelation,
  state: TrajectoryState,
): number {
  const target =
    orientedOtherEnd(
      relation,
      relation.from,
    );

  const targetLabel =
    eventLabel(
      graph,
      target,
    );

  const targetTerminality =
    terminality(
      graph,
      target,
    );

  const targetSpecificity =
    eventSpecificity(
      graph,
      target,
    );

  const persistentTension =
    persistentSignalAffinity(
      targetLabel,
      graph.unresolvedTensions,
    );

  const recurrence =
    persistentSignalAffinity(
      targetLabel,
      graph.recurringSignals,
    );

  const notPreviouslyEstablished =
    !state.establishedEventIds.includes(
      target,
    );

  return metric(
    relation.strength *
      relationWeight(
        relation.kind,
      ) *
      0.34 +
      targetTerminality *
        0.16 +
      targetSpecificity *
        0.12 +
      persistentTension *
        0.16 +
      recurrence *
        0.1 +
      (
        notPreviouslyEstablished
          ? 0.12
          : 0
      ),
  );
}
function resolutionAffinity(
  graph: RealityGraph,
  relation: RealityRelation,
  state: TrajectoryState,
): {
  score: number;
  resolvedKeys: string[];
} {
  if (!state.activeTensionKeys.length) {
    return {
      score: 0,
      resolvedKeys: [],
    };
  }

  const relationEndpoints = new Set([
    relation.from,
    relation.to,
  ]);

  const resolvedKeys: string[] = [];

  for (
    const tensionKey of
    state.activeTensionKeys
  ) {
    const parts =
      tensionKey.split(":");

    if (parts.length < 3) {
      continue;
    }

    const fromId =
      parts[1];

    const toId =
      parts[2];

    const sharesEndpoint =
      relationEndpoints.has(
        fromId,
      ) ||
      relationEndpoints.has(
        toId,
      );

    if (!sharesEndpoint) {
      continue;
    }

    const sameThread =
      state.establishedEventIds.includes(
        fromId,
      ) ||
      state.establishedEventIds.includes(
        toId,
      );

    const relationStrength =
      relation.strength *
      relationWeight(
        relation.kind,
      );

    const kindResolution =
      relation.kind ===
        "changes" ||
      relation.kind ===
        "recontextualizes" ||
      relation.kind ===
        "converges" ||
      relation.kind ===
        "causes" ||
      relation.kind ===
        "after"
        ? 0.34
        : relation.kind ===
            "contrasts"
          ? 0.18
          : 0;

    const score =
      relationStrength *
        0.36 +
      (sharesEndpoint
        ? 0.28
        : 0) +
      (sameThread
        ? 0.18
        : 0) +
      kindResolution;

    if (score >= 0.62) {
      resolvedKeys.push(
        tensionKey,
      );
    }
  }

  return {
    score: metric(
      Math.max(
        0,
        Math.min(
          1,
          resolvedKeys.length
            ? 0.4 +
                resolvedKeys.length *
                  0.2
            : 0,
        ),
      ),
    ),
    resolvedKeys,
  };
}
function relationCandidateScore(
  graph: RealityGraph,
  relation: RealityRelation,
  fromEventId: string,
  usedEventIds: readonly string[],
  lens?: string,
  state?: TrajectoryState,
): number {
  const targetId =
    orientedOtherEnd(
      relation,
      fromEventId,
    );

  const targetSpecificity =
    eventSpecificity(
      graph,
      targetId,
    );

  const targetCentrality =
    graphCentrality(
      graph,
      targetId,
    );

  const alreadyUsed =
    usedEventIds.includes(
      targetId,
    );

  const novelty =
    alreadyUsed
      ? 0.28
      : 1;

  const preference =
    relationPreference(
      relation.kind,
      lens,
    );

  const relationStrength =
    relation.strength *
    relationWeight(
      relation.kind,
    );

  const targetTerminality =
    terminality(
      graph,
      targetId,
    );

  const continuity =
    state
      ? relationContinuity(
          graph,
          relation,
          state,
        )
      : 0;

  const inheritance =
    state
      ? inheritanceValue(
          graph,
          relation,
          state,
        )
      : 0;

  const targetLabel =
    eventLabel(
      graph,
      targetId,
    );

  const recurringAffinity =
    persistentSignalAffinity(
      targetLabel,
      graph.recurringSignals,
    );

  const tensionAffinity =
    persistentSignalAffinity(
      targetLabel,
      graph.unresolvedTensions,
    );

  const establishedConnection =
    state
      ? (
          state.establishedEventIds.includes(
            relation.from,
          ) ||
          state.establishedEventIds.includes(
            relation.to,
          )
        )
      : false;

  const setupValue =
    state
      ? setupValueForRelation(
          graph,
          relation,
          state,
        )
      : 0;

  const lookahead =
    state
      ? lookaheadValue(
          graph,
          state,
          targetId,
          lens,
        )
      : 0;

  const resolvesExistingTension =
    state
      ? state.activeTensionKeys.some(
          (key) =>
            key.includes(
              relation.from,
            ) ||
            key.includes(
              relation.to,
            ),
        )
      : false;

  const resolutionBonus =
    resolvesExistingTension
      ? 0.16
      : 0;

  const recurrenceBonus =
    recurringAffinity *
    0.12;

  const tensionBonus =
    tensionAffinity *
    0.1;

  const continuityBonus =
    continuity *
    0.14;

  const inheritanceBonus =
    inheritance *
    0.18;

  const setupBonus =
    setupValue *
    0.12;

  const establishedBonus =
    establishedConnection
      ? 0.06
      : 0;

  return metric(
    relationStrength *
      0.23 +
      preference *
        0.17 +
      targetSpecificity *
        0.06 +
      targetCentrality *
        0.05 +
      targetTerminality *
        0.06 +
      novelty *
        0.06 +
      continuityBonus +
      inheritanceBonus +
      setupBonus +
      recurrenceBonus +
      tensionBonus +
      establishedBonus +
      resolutionBonus +
      lookahead *
        0.17,
  );
}

function lookaheadValue(
  graph: RealityGraph,
  state: TrajectoryState,
  currentEventId: string,
  lens?: string,
): number {
  const nextRelations =
    incidentRelations(
      graph,
      currentEventId,
    )
      .filter(
        (relation) =>
          SEARCH_RELATION_KINDS.includes(
            relation.kind,
          ),
      )
      .filter(
        (relation) =>
          !state.usedRelationKeys.includes(
            relationKey(
              relation,
            ),
          ),
      );

  if (!nextRelations.length) {
    return 0;
  }

  const values =
    nextRelations.map(
      (relation) => {
        const target =
          orientedOtherEnd(
            relation,
            currentEventId,
          );

        const targetLabel =
          eventLabel(
            graph,
            target,
          );

        const relationValue =
          relation.strength *
          relationWeight(
            relation.kind,
          );

        const terminal =
          terminality(
            graph,
            target,
          );

        const setup =
          setupValueForRelation(
            graph,
            relation,
            state,
          );

        const recurring =
          persistentSignalAffinity(
            targetLabel,
            graph.recurringSignals,
          );

        const tension =
          persistentSignalAffinity(
            targetLabel,
            graph.unresolvedTensions,
          );

        const lensFit =
          relationPreference(
            relation.kind,
            lens,
          );

        const resolves =
          state.activeTensionKeys.some(
            (key) =>
              key.includes(
                relation.from,
              ) ||
              key.includes(
                relation.to,
              ),
          );

        return metric(
          relationValue *
            0.3 +
            terminal *
              0.16 +
            setup *
              0.18 +
            recurring *
              0.1 +
            tension *
              0.1 +
            lensFit *
              0.08 +
            (
              resolves
                ? 0.08
                : 0
            ),
        );
      },
    );

  return values.length
    ? Math.max(
        ...values,
      )
    : 0;
}

function semanticTerritorySimilarity(
  graph: RealityGraph,
  leftEventId: string,
  rightEventId: string,
): number {
  const left = event(
    graph,
    leftEventId,
  );

  const right = event(
    graph,
    rightEventId,
  );

  if (
    !left ||
    !right
  ) {
    return 0;
  }

  const leftText =
    clean(left.label);

  const rightText =
    clean(right.label);

  if (
    !leftText ||
    !rightText
  ) {
    return 0;
  }

  const wording =
    tokenOverlap(
      leftText,
      rightText,
    );

  const relation =
    relationBetween(
      graph,
      leftEventId,
      rightEventId,
    );

  const relationSimilarity =
    relation
      ? metric(
          relation.strength *
            relationWeight(
              relation.kind,
            ),
        )
      : 0;

  return metric(
    wording * 0.62 +
      relationSimilarity * 0.38,
  );
}
function materialSequenceFunction(
  graph: RealityGraph,
  state: TrajectoryState,
  eventId: string,
): {
  recentPeak: number;
  recentCount: number;
  consecutivePeak: number;
  gap: number;
  callbackOpportunity: number;
  campingRisk: number;
  rhythmValue: number;
} {
  const history = state.usedEventIds;

  if (!history.length) {
    return {
      recentPeak: 0,
      recentCount: 0,
      consecutivePeak: 0,
      gap: history.length,
      callbackOpportunity: 0,
      campingRisk: 0,
      rhythmValue: 0,
    };
  }

  const recentWindow = history.slice(-4);

  const similarities = recentWindow.map(
    (priorId) =>
      semanticTerritorySimilarity(
        graph,
        eventId,
        priorId,
      ),
  );

  const recentPeak = similarities.length
    ? Math.max(...similarities)
    : 0;

  const recentCount = similarities.filter(
    (value) => value >= 0.58,
  ).length;

  let consecutivePeak = 0;
  let consecutiveCount = 0;

  for (
    let index = recentWindow.length - 1;
    index >= 0;
    index -= 1
  ) {
    const value =
      semanticTerritorySimilarity(
        graph,
        eventId,
        recentWindow[index]!,
      );

    if (value >= 0.58) {
      consecutiveCount += 1;
      consecutivePeak = Math.max(
        consecutivePeak,
        value,
      );
    } else {
      break;
    }
  }

  let lastReturnIndex = -1;

  for (
    let index = history.length - 1;
    index >= 0;
    index -= 1
  ) {
    const similarity =
      semanticTerritorySimilarity(
        graph,
        eventId,
        history[index]!,
      );

    if (similarity >= 0.58) {
      lastReturnIndex = index;
      break;
    }
  }

  const gap =
    lastReturnIndex >= 0
      ? history.length - 1 - lastReturnIndex
      : history.length;

  const callbackOpportunity =
    lastReturnIndex >= 0 && gap >= 2
      ? metric(
          Math.min(
            1,
            0.35 +
              gap * 0.12 +
              recentPeak * 0.18,
          ),
        )
      : 0;

  /*
   * Camping means the candidate is still sitting in the
   * same semantic neighborhood without enough intervening
   * material to make the return interesting.
   */
  const campingRisk = metric(
    Math.min(
      1,
      consecutiveCount * 0.34 +
        recentCount * 0.18 +
        recentPeak * 0.18,
    ),
  );

  /*
   * Rhythm explicitly permits short runs.
   *
   * One or two nearby returns can be useful.
   * The third/fourth unbroken return is where camping pressure
   * rises sharply.
   */
  const rhythmValue = metric(
    consecutiveCount === 0
      ? 0.45
      : consecutiveCount === 1
        ? 0.72
        : consecutiveCount === 2
          ? 0.62
          : 0.28,
  );

  return {
    recentPeak,
    recentCount,
    consecutivePeak,
    gap,
    callbackOpportunity,
    campingRisk,
    rhythmValue,
  };
}
function materialContinuationScore(
  graph: RealityGraph,
  state: TrajectoryState,
  eventId: string,
  lens?: string,
): number {
  const item = event(
    graph,
    eventId,
  );

  if (
    !item ||
    !clean(item.label)
  ) {
    return 0;
  }

  if (
    state.usedEventIds.includes(
      eventId,
    )
  ) {
    return 0;
  }

  const specificity =
    eventSpecificity(
      graph,
      eventId,
    );

  const centrality =
    graphCentrality(
      graph,
      eventId,
    );

  const terminal =
    terminality(
      graph,
      eventId,
    );

  const recurring =
    persistentSignalAffinity(
      item.label,
      graph.recurringSignals,
    );

  const tension =
    persistentSignalAffinity(
      item.label,
      graph.unresolvedTensions,
    );

  const future =
    lookaheadValue(
      graph,
      state,
      eventId,
      lens,
    );

  const connected =
    incidentRelations(
      graph,
      eventId,
    ).some(
      (relation) =>
        state.usedEventIds.includes(
          relation.from,
        ) ||
        state.usedEventIds.includes(
          relation.to,
        ),
    );

  const sequenceFunction =
    materialSequenceFunction(
      graph,
      state,
      eventId,
    );

  /*
   * A fresh territory is useful,
   * but we do NOT require every cut to be fresh.
   *
   * Short repetition can create rhythm or obsession.
   */
  const freshness =
    metric(
      1 -
        sequenceFunction.recentPeak *
          0.42,
    );

  /*
   * A return after intervening material is fundamentally
   * different from camping on the same neighborhood.
   */
  const callbackBonus =
    sequenceFunction.callbackOpportunity *
    0.2;

  const rhythmBonus =
    sequenceFunction.rhythmValue *
    0.09;

  const salienceProtection =
    metric(
      recurring * 0.7 +
        tension * 0.3,
    );

  /*
   * Strong punishment only for uninterrupted semantic camping.
   *
   * This is what kills:
   *
   *   mud → mud → mud → mud
   *
   * without killing:
   *
   *   walk → walk → walk
   *
   * or:
   *
   *   mud → mud → park → mud
   */
  const campingPenalty =
    sequenceFunction.campingRisk *
    0.24;

  /*
   * If the candidate is both fresh and connected to already
   * established material, prefer it as a meaningful turn rather
   * than treating freshness as random shuffling.
   */
  const contrastOpportunity =
    connected &&
    freshness >= 0.5
      ? 0.08
      : 0;

  return metric(
    specificity * 0.2 +
      freshness * 0.18 +
      centrality * 0.08 +
      terminal * 0.08 +
      recurring * 0.1 +
      tension * 0.08 +
      future * 0.08 +
      contrastOpportunity +
      callbackBonus +
      rhythmBonus +
      salienceProtection * 0.06 -
      campingPenalty,
  );
}
function expandTrajectory(
  graph: RealityGraph,
  state: TrajectoryState,
  lens?: string,
  width = 6,
): TrajectoryState[] {
  const lastStep =
    state.steps[state.steps.length - 1];

  const currentEventId =
    lastStep?.eventIds[lastStep.eventIds.length - 1];

  if (!currentEventId) {
    return [];
  }

  type Expansion =
    | {
        kind: "relation";
        relation: RealityRelation;
        target: string;
        score: number;
      }
    | {
        kind: "material";
        target: string;
        score: number;
      };

  const relationExpansions: Expansion[] =
    incidentRelations(graph, currentEventId)
      .filter((relation) =>
        SEARCH_RELATION_KINDS.includes(relation.kind),
      )
      .filter(
        (relation) =>
          !state.usedRelationKeys.includes(
            relationKey(relation),
          ),
      )
      .map((relation) => ({
        kind: "relation" as const,
        relation,
        target: orientedOtherEnd(
          relation,
          currentEventId,
        ),
        score: relationCandidateScore(
          graph,
          relation,
          currentEventId,
          state.usedEventIds,
          lens,
          state,
        ),
      }));

  /*
   * GROUNDED MATERIAL CONTINUATION
   *
   * When the graph has weak/no useful edge from the current cut,
   * another explicit supplied event may still earn the next cut.
   *
   * This preserves QRE's distinction between:
   *   semantic relation
   * and
   *   presentation order.
   *
   * No chronology or causality is invented.
   */
  const materialExpansions: Expansion[] =
    graph.events
      .filter((item) => clean(item.label))
      
      .filter((item) => !state.usedEventIds.includes(item.id))
      .map((item) => ({
        kind: "material" as const,
        target: item.id,
        score: materialContinuationScore(
          graph,
          state,
          item.id,
          lens,
        ),
      }))
      .filter((candidate) => candidate.score >= 0.34);

  const expansions = [
    ...relationExpansions,
    ...materialExpansions,
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, width);

  return expansions.map((expansion) => {
    if (expansion.kind === "material") {
      const targetLabel = eventLabel(
        graph,
        expansion.target,
      );

      return {
        steps: [
          ...state.steps,
          {
            order: state.steps.length + 1,
            operation: "reveal",
            eventIds: [expansion.target],
            viewerChange:
              `Advance to another supplied detail: ${targetLabel}.`,
            nextQuestion:
              "What supplied detail deserves the next cut?",
          },
        ],

        usedEventIds: unique([
          ...state.usedEventIds,
          expansion.target,
        ]),

        usedRelationKeys: [
          ...state.usedRelationKeys,
        ],

        establishedEventIds: unique([
          ...state.establishedEventIds,
          expansion.target,
        ]),

        semanticTurnKeys: [
          ...state.semanticTurnKeys,
        ],

        activeTensionKeys: [
          ...state.activeTensionKeys,
        ],

        resolvedTensionKeys: [
          ...state.resolvedTensionKeys,
        ],

        setupEventIds: unique([
          ...state.setupEventIds,
          expansion.target,
        ]),

        recurringThreadKeys: unique([
          ...state.recurringThreadKeys,
          ...(persistentSignalAffinity(
            targetLabel,
            graph.recurringSignals,
          ) >= 0.35
            ? [`recurrence:${expansion.target}`]
            : []),
        ]),

        unresolvedQuestionKeys: unique([
          ...state.unresolvedQuestionKeys,
          "what supplied detail deserves the next cut?",
        ]),

        endpointPressure: metric(
          state.endpointPressure * 0.72 +
            terminality(
              graph,
              expansion.target,
            ) * 0.18,
        ),

        continuationValue: metric(
          state.continuationValue * 0.62 +
            materialContinuationScore(
              graph,
              state,
              expansion.target,
              lens,
            ) * 0.38,
        ),

        lookaheadValue: metric(
          state.lookaheadValue * 0.62 +
            lookaheadValue(
              graph,
              state,
              expansion.target,
              lens,
            ) * 0.38,
        ),

        lensPressure: state.lensPressure,

        score:
          state.score +
          expansion.score * 0.82 +
          lookaheadValue(
            graph,
            state,
            expansion.target,
            lens,
          ) * 0.08,
      };
    }

    const {
      relation,
      target,
      score,
    } = expansion;

    const operation =
      operationForRelation(relation.kind);

    const futureValue =
      lookaheadValue(
        graph,
        state,
        target,
        lens,
      );

    const carryValue =
      inheritanceValue(
        graph,
        relation,
        state,
      );

    const targetLabel =
      eventLabel(
        graph,
        target,
      );

    const setupValue =
      setupValueForRelation(
        graph,
        relation,
        state,
      );

    const recurringAffinity =
      persistentSignalAffinity(
        targetLabel,
        graph.recurringSignals,
      );

    const tensionAffinity =
      persistentSignalAffinity(
        targetLabel,
        graph.unresolvedTensions,
      );

    const resolution =
      resolutionAffinity(
        graph,
        relation,
        state,
      );

    const nextActiveTensions =
      unique([
        ...state.activeTensionKeys,
        ...(relation.kind === "contrasts" ||
        relation.kind === "changes" ||
        relation.kind === "recontextualizes"
          ? [relationKey(relation)]
          : []),
      ]).filter(
        (key) =>
          !resolution.resolvedKeys.includes(key),
      );

    const nextResolvedTensions =
      unique([
        ...state.resolvedTensionKeys,
        ...resolution.resolvedKeys,
      ]);

    const nextQuestionText =
      nextQuestion(relation);

    return {
      steps: [
        ...state.steps,
        {
          order: state.steps.length + 1,
          operation,
          eventIds: [
            currentEventId,
            target,
          ],
          viewerChange:
            semanticTurn(
              graph,
              relation,
            ),
          nextQuestion:
            nextQuestionText,
        },
      ],

      usedEventIds: unique([
        ...state.usedEventIds,
        target,
      ]),

      usedRelationKeys: unique([
        ...state.usedRelationKeys,
        relationKey(relation),
      ]),

      establishedEventIds: unique([
        ...state.establishedEventIds,
        currentEventId,
        target,
      ]),

      semanticTurnKeys: unique([
        ...state.semanticTurnKeys,
        semanticTransitionKey(
          graph,
          relation,
        ),
      ]),

      activeTensionKeys:
        nextActiveTensions,

      resolvedTensionKeys:
        nextResolvedTensions,

      setupEventIds: unique([
        ...state.setupEventIds,
        ...(setupValue >= 0.56
          ? [target]
          : []),
      ]),

      recurringThreadKeys: unique([
        ...state.recurringThreadKeys,
        ...(recurringAffinity >= 0.35
          ? [`recurrence:${target}`]
          : []),
      ]),

      unresolvedQuestionKeys:
        unique([
          ...state.unresolvedQuestionKeys,
          nextQuestionText.toLowerCase(),
        ]),

      endpointPressure: metric(
        state.endpointPressure * 0.72 +
          terminality(
            graph,
            target,
          ) * 0.18 +
          resolution.score * 0.1,
      ),

      continuationValue: metric(
        state.continuationValue * 0.62 +
          carryValue * 0.22 +
          (
            recurringAffinity * 0.4 +
            setupValue * 0.3 +
            tensionAffinity * 0.2
          ) * 0.2,
      ),

      lookaheadValue: metric(
        state.lookaheadValue * 0.62 +
          futureValue * 0.38,
      ),

      lensPressure: metric(
        state.lensPressure * 0.72 +
          relationPreference(
            relation.kind,
            lens,
          ) * 0.28,
      ),

      score:
        state.score +
        score +
        carryValue * 0.14 +
        resolution.score * 0.1 +
        futureValue * 0.08,
    };
  });
}
function choosePayoffEvent(
  graph: RealityGraph,
  state: TrajectoryState,
  lens?: string,
): string | undefined {
  const used =
    new Set(
      state.usedEventIds,
    );

  /*
   * MATERIAL-FIRST PATHS
   *
   * Material trajectories are built from supplied presentation
   * cuts rather than semantic relation chains.
   *
   * Their payoff must therefore come from the material already
   * accumulated by THIS trajectory.
   *
   * A relation-derived trajectory has usedRelationKeys.
   * A material trajectory does not.
   */
  const materialPath =
    state.usedRelationKeys.length === 0 &&
    state.steps.length >= 3;

  const candidateEvents =
    materialPath
      ? graph.events.filter(
          (item) =>
            used.has(
              item.id,
            ) &&
            clean(
              item.label,
            ),
        )
      : graph.events.filter(
          (item) =>
            clean(
              item.label,
            ),
        );

  const candidates =
    candidateEvents
      .map(
        (item) => {
          const endpoint =
            endpointAffinity(
              graph,
              item.id,
              state.usedEventIds,
            );

          const terminal =
            terminality(
              graph,
              item.id,
            );

          const specificity =
            eventSpecificity(
              graph,
              item.id,
            );

          const centrality =
            graphCentrality(
              graph,
              item.id,
            );

          const preference =
            (
              incidentRelations(
                graph,
                item.id,
              )
                .map(
                  (
                    relation,
                  ) =>
                    relationPreference(
                      relation.kind,
                      lens,
                    ),
                )
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    b - a,
                )[0] ??
              0.5
            );

          const label =
            eventLabel(
              graph,
              item.id,
            );

          const recurring =
            persistentSignalAffinity(
              label,
              graph.recurringSignals,
            );

          const tension =
            persistentSignalAffinity(
              label,
              graph.unresolvedTensions,
            );

          const established =
            state.establishedEventIds.includes(
              item.id,
            );

          const setup =
            state.setupEventIds.includes(
              item.id,
            );

          const alreadyUsed =
            used.has(
              item.id,
            );

          const payoffRelations =
            incidentRelations(
              graph,
              item.id,
            ).filter(
              (relation) =>
                state.usedEventIds.includes(
                  relation.from,
                ) ||
                state.usedEventIds.includes(
                  relation.to,
                ),
            );

          const payoffRelationStrength =
            payoffRelations.reduce(
              (
                sum,
                relation,
              ) =>
                sum +
                relation.strength *
                  relationWeight(
                    relation.kind,
                  ),
              0,
            );

          const connectedPayoff =
            metric(
              Math.min(
                1,
                payoffRelationStrength *
                  0.22,
              ),
            );

          const resolvesActive =
            state.activeTensionKeys.some(
              (tensionKey) => {
                const parts =
                  tensionKey.split(
                    ":",
                  );

                if (
                  parts.length <
                  3
                ) {
                  return false;
                }

                const fromId =
                  parts[1];

                const toId =
                  parts[2];

                return (
                  item.id ===
                    fromId ||
                  item.id ===
                    toId ||
                  payoffRelations.some(
                    (relation) =>
                      (
                        relation.from ===
                          fromId &&
                        relation.to ===
                          item.id
                      ) ||
                      (
                        relation.to ===
                          fromId &&
                        relation.from ===
                          item.id
                      ) ||
                      (
                        relation.from ===
                          toId &&
                        relation.to ===
                          item.id
                      ) ||
                      (
                        relation.to ===
                          toId &&
                        relation.from ===
                          item.id
                      ),
                  )
                );
              },
            );

          const resolutionValue =
            resolvesActive
              ? 0.22
              : 0;

          const continuation =
            metric(
              state.continuationValue *
                0.55 +
                state.lookaheadValue *
                  0.45,
            );

          const futureValue =
            lookaheadValue(
              graph,
              state,
              item.id,
              lens,
            );

          const usedPenalty =
            alreadyUsed
              ? terminal >=
                0.65
                ? 0.04
                : 0.14
              : 0;

          const establishedBonus =
            established
              ? 0.08
              : 0;

          const setupBonus =
            setup
              ? 0.08
              : 0;

          /*
           * Recentness matters for material films.
           *
           * A payoff should usually land on something already
           * accumulated near the end of the supplied sequence,
           * not merely on the globally strongest fact.
           */
          const recency =
            state.usedEventIds.length
              ? Math.max(
                  0,
                  state.usedEventIds.indexOf(
                    item.id,
                  ) + 1,
                ) /
                Math.max(
                  1,
                  state.usedEventIds.length,
                )
              : 0;

          const materialRecencyBonus =
            materialPath
              ? recency *
                0.22
              : 0;

          /*
           * Material paths favor the trajectory's own supplied
           * evidence over global graph endpoint strength.
           */
          const materialBoundaryBonus =
            materialPath
              ? 0.18
              : 0;

          return {
            id:
              item.id,

            score:
              endpoint *
                (materialPath
                  ? 0.1
                  : 0.18) +
              terminal *
                (materialPath
                  ? 0.12
                  : 0.16) +
              specificity *
                0.06 +
              centrality *
                0.05 +
              preference *
                (materialPath
                  ? 0.04
                  : 0.08) +
              connectedPayoff *
                (materialPath
                  ? 0.08
                  : 0.14) +
              resolutionValue +
              futureValue *
                0.08 +
              recurring *
                0.05 +
              tension *
                0.04 +
              continuation *
                0.04 +
              establishedBonus +
              setupBonus +
              materialRecencyBonus +
              materialBoundaryBonus -
              usedPenalty,
          };
        },
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );

  return candidates[0]?.id;
}

function payoffRelation(
  graph: RealityGraph,
  payoffId: string,
  usedEventIds: readonly string[],
  lens?: string,
): RealityRelation | undefined {
  const used =
    new Set(
      usedEventIds,
    );

  return graph.relations
    .filter(
      (relation) =>
        relation.from ===
          payoffId ||
        relation.to ===
          payoffId,
    )
    .filter(
      (relation) =>
        used.has(
          relation.from,
        ) ||
        used.has(
          relation.to,
        ),
    )
    .sort(
      (a, b) => {
        const score =
          (
            relation:
              RealityRelation,
          ) =>
            relation.strength *
              relationWeight(
                relation.kind,
              ) *
              relationPreference(
                relation.kind,
                lens,
              );

        return (
          score(b) -
          score(a)
        );
      },
    )[0];
}

function buildTrajectoryFromState(
  graph: RealityGraph,
  state: TrajectoryState,
  lens?: string,
): LatentMovieTrajectoryStep[] {

  const payoffId =
    choosePayoffEvent(
      graph,
      state,
      lens,
    );

  if (!payoffId) {
    return state.steps;
  }

  const payoff =
    event(
      graph,
      payoffId,
    );

  if (!payoff) {
    return state.steps;
  }

  const relation =
    payoffRelation(
      graph,
      payoffId,
      state.usedEventIds,
      lens,
    );

  const finalEventIds =
    relation
      ? unique([
          relation.from,
          relation.to,
        ])
      : [
          payoffId,
        ];

  return [
    ...state.steps,
    {
      order:
        state.steps.length +
        1,

      operation:
        "payoff",

      eventIds:
        relation
          ? finalEventIds
          : [payoffId],

      viewerChange:
        `The supplied endpoint lands after the accumulated path: ${payoff.label}.`,

      nextQuestion:
        "What is now true at the supplied ending?",
    },
  ];
}

function makeInitialState(
  graph: RealityGraph,
  focus: RealityRelation,
  lens?: string,
): TrajectoryState {
  const openingId =
    chooseOpeningEvent(
      graph,
      focus,
      lens,
    );

  const opening =
    event(
      graph,
      openingId,
    );

  if (!opening) {
   return {
  steps: [],
  usedEventIds: [],
  usedRelationKeys: [],
  establishedEventIds: [],
  semanticTurnKeys: [],
  activeTensionKeys: [],
  resolvedTensionKeys: [],
  setupEventIds: [],
  recurringThreadKeys: [],
  unresolvedQuestionKeys: [],
  endpointPressure: 0,
  continuationValue: 0,
  lookaheadValue: 0,
  lensPressure: 0,
  score: 0,
};
  }

  return {
    steps: [
      {
        order: 1,
        operation:
          "establish",

        eventIds: [
          opening.id,
        ],

        viewerChange:
          `Establish supplied evidence: ${opening.label}.`,

        nextQuestion:
          "What relationship deserves the next cut?",
      },
    ],

    usedEventIds: [
      opening.id,
    ],

        usedRelationKeys: [],

    establishedEventIds: [
      opening.id,
    ],

    semanticTurnKeys: [],

    activeTensionKeys: [],

    resolvedTensionKeys: [],

    setupEventIds: [],

    recurringThreadKeys: [],

    unresolvedQuestionKeys: [],

    endpointPressure:
      terminality(
        graph,
        opening.id,
      ),
     continuationValue: 0,

     lookaheadValue: 0,
    lensPressure:
      relationPreference(
        focus.kind,
        lens,
      ),

    score:
      eventSpecificity(
        graph,
        opening.id,
      ) *
        0.34 +
      graphCentrality(
        graph,
        opening.id,
      ) *
        0.32 +
      terminality(
        graph,
        opening.id,
      ) *
        0.08 +
      relationPreference(
        focus.kind,
        lens,
      ) *
        0.26,
  };
}

function seedFocusState(
  graph: RealityGraph,
  focus: RealityRelation,
  lens?: string,
): TrajectoryState {
  const state =
    makeInitialState(
      graph,
      focus,
      lens,
    );

  const openingId =
    state.usedEventIds[0];

  if (!openingId) {
    return state;
  }

  const turnEventId =
    orientedOtherEnd(
      focus,
      openingId,
    );

  const relation =
    relationBetween(
      graph,
      openingId,
      turnEventId,
    );

  if (!relation) {
    return state;
  }

  return {
    ...state,

    steps: [
      ...state.steps,

      {
        order: 2,

        operation:
          operationForRelation(
            relation.kind,
          ),

        eventIds: [
          openingId,
          turnEventId,
        ],

        viewerChange:
          semanticTurn(
            graph,
            relation,
          ),

        nextQuestion:
          nextQuestion(
            relation,
          ),
      },
    ],

    usedEventIds:
      unique([
        ...state.usedEventIds,
        turnEventId,
      ]),

    usedRelationKeys:
      unique([
        ...state.usedRelationKeys,
        relationKey(
          relation,
        ),
      ]),

    score:
      state.score +
      relation.strength *
        relationWeight(
          relation.kind,
        ) *
        relationPreference(
          relation.kind,
          lens,
        ),
  };
}

function normalizeTrajectory(
  trajectory: readonly LatentMovieTrajectoryStep[],
): LatentMovieTrajectoryStep[] {
  const payoff =
    trajectory.find(
      (step) =>
        step.operation ===
        "payoff",
    );

  const semanticSteps =
    trajectory
      .filter(
        (step) =>
          step.operation !==
          "payoff",
      )
      .slice(
        0,
        5,
      );

  const normalized =
    payoff
      ? [
          ...semanticSteps,
          payoff,
        ]
      : semanticSteps;

  return normalized.map(
    (step, index) => ({
      ...step,
      order:
        index + 1,
    }),
  );
}

function pathKey(
  trajectory: readonly LatentMovieTrajectoryStep[],
): string {
  return trajectory
    .flatMap(
      (step) =>
        step.eventIds,
    )
    .join(">");
}

function operationKey(
  trajectory: readonly LatentMovieTrajectoryStep[],
): string {
  return trajectory
    .map(
      (step) =>
        step.operation,
    )
    .join(">");
}

function relationPatternKey(
  trajectory: readonly LatentMovieTrajectoryStep[],
  graph: RealityGraph,
): string {
  return trajectory
    .map(
      (step) => {
        if (
          step.eventIds.length <
          2
        ) {
          return step.operation;
        }

        return (
          relationBetween(
            graph,
            step.eventIds[0],
            step.eventIds[
              step.eventIds.length -
                1
            ],
          )?.kind ??
          step.operation
        );
      },
    )
    .join(">");
}

function materialSeedState(
  graph: RealityGraph,
  eventId: string,
): TrajectoryState {
  const item = event(graph, eventId);

  if (!item) {
    return {
      steps: [],
      usedEventIds: [],
      usedRelationKeys: [],
      establishedEventIds: [],
      semanticTurnKeys: [],
      activeTensionKeys: [],
      resolvedTensionKeys: [],
      setupEventIds: [],
      recurringThreadKeys: [],
      unresolvedQuestionKeys: [],
      endpointPressure: 0,
      continuationValue: 0,
      lookaheadValue: 0,
      lensPressure: 0,
      score: 0,
    };
  }

  return {
    steps: [
      {
        order: 1,
        operation: "establish",
        eventIds: [eventId],
        viewerChange:
          `Establish supplied evidence: ${item.label}.`,
        nextQuestion:
          "What supplied detail deserves the next cut?",
      },
    ],
    usedEventIds: [eventId],
    usedRelationKeys: [],
    establishedEventIds: [eventId],
    semanticTurnKeys: [],
    activeTensionKeys: [],
    resolvedTensionKeys: [],
    setupEventIds: [],
    recurringThreadKeys: [],
    unresolvedQuestionKeys: [],
    endpointPressure: terminality(graph, eventId),
    continuationValue: 0,
    lookaheadValue: 0,
    lensPressure: 0,
    score:
      eventSpecificity(graph, eventId) * 0.4 +
      graphCentrality(graph, eventId) * 0.25 +
      terminality(graph, eventId) * 0.1,
  };

}

function buildSourceTraversalTrajectory(
  graph: RealityGraph,
): LatentMovieTrajectoryStep[] {
  const events = graph.events
    .filter((event) => clean(event.label))
    .slice();

  if (events.length < 3) {
    return [];
  }

  /*
   * This is not chronology.
   *
   * It is a presentation traversal through supplied material in the order
   * presented to QRE. The order is therefore soft continuity, not a factual
   * claim about when events occurred.
   *
   * The purpose is to give the Movie Search a genuine whole-world candidate
   * against which relation-heavy clusters can compete.
   */

  const maxCuts = Math.min(
    7,
    events.length,
  );

  const selected =
    events.length <= maxCuts
      ? events
      : [
          ...events.slice(
            0,
            maxCuts - 1,
          ),
          events[events.length - 1]!,
        ];

  const trajectory: LatentMovieTrajectoryStep[] = [];

  const first = selected[0];

  if (first) {
    trajectory.push({
      order: 1,
      operation: "establish",
      eventIds: [first.id],
      viewerChange:
        `Establish supplied evidence: ${first.label}.`,
      nextQuestion:
        "What part of this world deserves the next cut?",
    });
  }

  for (
    let index = 1;
    index < selected.length;
    index += 1
  ) {
    const current = selected[index];

    if (!current) {
      continue;
    }

    const isFinal =
      index === selected.length - 1;

    if (isFinal) {
      trajectory.push({
        order: trajectory.length + 1,
        operation: "payoff",
        eventIds: [current.id],
        viewerChange:
          `The supplied sequence lands here: ${current.label}.`,
        nextQuestion:
          "What is now true at the supplied ending?",
      });

      continue;
    }

    const previous =
      selected[index - 1];

    const relation =
      previous
        ? relationBetween(
            graph,
            previous.id,
            current.id,
          )
        : undefined;

    trajectory.push({
      order: trajectory.length + 1,
      operation:
        relation
          ? operationForRelation(
              relation.kind,
            )
          : "reveal",
      eventIds: [current.id],
      viewerChange:
        relation
          ? `${relation.kind}: ${previous.label} -> ${current.label}.`
          : `Another supplied part of the world enters: ${current.label}.`,
      nextQuestion:
        relation?.kind === "contrasts"
          ? "What expectation changes here?"
          : "What does this next part of the world make newly meaningful?",
    });
  }

  trajectory.forEach(
    (step, index) => {
      step.order = index + 1;
    },
  );

  return trajectory;
}

function buildMaterialPathVariants(
  graph: RealityGraph,
  lens?: string,
): LatentMovieTrajectoryStep[][] {
  const tokenSetForLabel = (
    label: string,
  ): Set<string> =>
    new Set(
      clean(label)
        .toLowerCase()
        .split(
          /[^a-z0-9'-]+/i,
        )
        .filter(
          (token) =>
            token.length >= 3,
        ),
    );

  /*
   * WHOLE-WORLD SOURCE TRAVERSAL
   *
   * This is a legitimate movie hypothesis:
   * travel through supplied material in source presentation order.
   *
   * It does NOT claim chronology or causality.
   * It simply gives the downstream movie scorer a real whole-world film
   * to compare against locally dense semantic trajectories.
   */
  const sourceTraversal =
    buildSourceTraversalTrajectory(
      graph,
    );

  const sourceTraversalCandidates =
    sourceTraversal.length >= 3
      ? [sourceTraversal]
      : [];

  const tokenOverlap = (
    a: Set<string>,
    b: Set<string>,
  ): number => {
    if (
      !a.size ||
      !b.size
    ) {
      return 0;
    }

    let hits = 0;

    for (
      const token of a
    ) {
      if (
        b.has(token)
      ) {
        hits += 1;
      }
    }

    return (
      hits /
      Math.max(
        1,
        Math.min(
          a.size,
          b.size,
        ),
      )
    );
  };

  /*
   * Compare the CURRENT frontier of two paths.
   *
   * Older cuts are intentionally ignored so a later callback can return
   * after intervening material.
   */
  const frontierDistance = (
    a: TrajectoryState,
    b: TrajectoryState,
  ): number => {
    const aLastStep =
      a.steps[
        a.steps.length - 1
      ];

    const bLastStep =
      b.steps[
        b.steps.length - 1
      ];

    const aEventId =
      aLastStep?.eventIds[
        aLastStep.eventIds.length - 1
      ];

    const bEventId =
      bLastStep?.eventIds[
        bLastStep.eventIds.length - 1
      ];

    if (
      !aEventId ||
      !bEventId
    ) {
      return 1;
    }

    const aItem =
      event(
        graph,
        aEventId,
      );

    const bItem =
      event(
        graph,
        bEventId,
      );

    if (
      !aItem ||
      !bItem
    ) {
      return 1;
    }

    const wordingOverlap =
      tokenOverlap(
        tokenSetForLabel(
          aItem.label,
        ),
        tokenSetForLabel(
          bItem.label,
        ),
      );

    const relation =
      relationBetween(
        graph,
        aEventId,
        bEventId,
      );

    const relationProximity =
      relation
        ? metric(
            relation.strength,
          )
        : 0;

    return metric(
      1 -
        (
          wordingOverlap *
            0.62 +
          relationProximity *
            0.38
        ),
    );
  };

  /*
   * Diverse material seeds.
   *
   * The old behavior remains available; we are only broadening the set of
   * trajectories the Beast can consider.
   */
  const seedPool =
    graph.events
      .filter(
        (item) =>
          clean(
            item.label,
          ),
      )
      .map(
        (item) => ({
          id: item.id,
          score:
            eventSpecificity(
              graph,
              item.id,
            ) *
              0.34 +
            graphCentrality(
              graph,
              item.id,
            ) *
              0.12 +
            terminality(
              graph,
              item.id,
            ) *
              0.08 +
            persistentSignalAffinity(
              item.label,
              graph.recurringSignals,
            ) *
              0.14 +
            persistentSignalAffinity(
              item.label,
              graph.unresolvedTensions,
            ) *
              0.1 +
            clean(
              item.label,
            ).length *
              0.002,
        }),
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );

  const seeds: {
    id: string;
    score: number;
  }[] = [];

  for (
    const candidate of
      seedPool
  ) {
    if (
      seeds.length >= 8
    ) {
      break;
    }

    const candidateLabel =
      clean(
        event(
          graph,
          candidate.id,
        )?.label,
      );

    const candidateTokens =
      tokenSetForLabel(
        candidateLabel,
      );

    const tooSimilar =
      seeds.some(
        (selected) => {
          const selectedLabel =
            clean(
              event(
                graph,
                selected.id,
              )?.label,
            );

          const wordingOverlap =
            tokenOverlap(
              candidateTokens,
              tokenSetForLabel(
                selectedLabel,
              ),
            );

          const relation =
            relationBetween(
              graph,
              candidate.id,
              selected.id,
            );

          const relationStrength =
            relation
              ? metric(
                  relation.strength,
                )
              : 0;

          return (
            wordingOverlap >=
              0.58 ||
            (
              wordingOverlap >=
                0.38 &&
              relationStrength >=
                0.55
            )
          );
        },
      );

    if (
      tooSimilar &&
      seeds.length < 3
    ) {
      continue;
    }

    seeds.push(
      candidate,
    );
  }

  /*
   * Sparse-world fallback.
   */
  if (
    seeds.length < 3
  ) {
    for (
      const candidate of
        seedPool
    ) {
      if (
        seeds.length >=
        Math.min(
          8,
          seedPool.length,
        )
      ) {
        break;
      }

      if (
        seeds.some(
          (seed) =>
            seed.id ===
            candidate.id,
        )
      ) {
        continue;
      }

      seeds.push(
        candidate,
      );
    }
  }

  let beam:
    TrajectoryState[] =
    seeds.map(
      (seed) =>
        materialSeedState(
          graph,
          seed.id,
        ),
    );

  const maxDepth = 5;

  for (
    let depth = 0;
    depth < maxDepth;
    depth += 1
  ) {
    const expanded:
      TrajectoryState[] =
      beam.flatMap(
        (state) => {
          const nextStates:
            TrajectoryState[] =
            [];

          for (
            const item of
              graph.events
          ) {
            if (
              !clean(
                item.label,
              )
            ) {
              continue;
            }

            if (
              state.usedEventIds.includes(
                item.id,
              )
            ) {
              continue;
            }

            const continuation =
              materialContinuationScore(
                graph,
                state,
                item.id,
                lens,
              );

            if (
              continuation < 0.2
            ) {
              continue;
            }

            const itemLabel =
              clean(
                item.label,
              );

            const step:
              LatentMovieTrajectoryStep =
              {
                order:
                  state.steps.length +
                  1,

                operation:
                  "reveal",

                eventIds: [
                  item.id,
                ],

                viewerChange:
                  `Advance to another supplied part of the world: ${itemLabel}.`,

                nextQuestion:
                  "What part of this world becomes newly meaningful?",
              };

            /*
             * Local territory novelty.
             *
             * The candidate does not have to be unrelated to the prior cut.
             * It simply should not remain trapped in the same neighborhood.
             */
            const novelty =
              state.usedEventIds.length
                ? metric(
                    1 -
                      Math.max(
                        ...state.usedEventIds.map(
                          (
                            usedId,
                          ) =>
                            semanticTerritorySimilarity(
                              graph,
                              item.id,
                              usedId,
                            ),
                        ),
                        0,
                      ),
                  )
                : 1;

            const breadthPressure =
              state.steps.length <=
              1
                ? 0.08
                : state.steps.length ===
                    2
                  ? 0.14
                  : 0.2;

            const territoryPenalty =
              novelty < 0.2
                ? 0.34
                : novelty < 0.35
                  ? 0.18
                  : 0;

            const future =
              lookaheadValue(
                graph,
                state,
                item.id,
                lens,
              );

            const nextState:
              TrajectoryState =
              {
                steps: [
                  ...state.steps,
                  step,
                ],

                usedEventIds:
                  unique([
                    ...state.usedEventIds,
                    item.id,
                  ]),

                usedRelationKeys: [
                  ...state.usedRelationKeys,
                ],

                establishedEventIds:
                  unique([
                    ...state.establishedEventIds,
                    item.id,
                  ]),

                semanticTurnKeys: [
                  ...state.semanticTurnKeys,
                ],

                activeTensionKeys: [
                  ...state.activeTensionKeys,
                ],

                resolvedTensionKeys: [
                  ...state.resolvedTensionKeys,
                ],

                setupEventIds:
                  unique([
                    ...state.setupEventIds,
                    item.id,
                  ]),

                recurringThreadKeys:
                  unique([
                    ...state.recurringThreadKeys,
                    ...(persistentSignalAffinity(
                      itemLabel,
                      graph.recurringSignals,
                    ) >= 0.35
                      ? [
                          `recurrence:${item.id}`,
                        ]
                      : []),
                  ]),

                unresolvedQuestionKeys:
                  unique([
                    ...state.unresolvedQuestionKeys,
                    "what part of this world becomes newly meaningful?",
                  ]),

                endpointPressure:
                  metric(
                    state.endpointPressure *
                      0.72 +
                      terminality(
                        graph,
                        item.id,
                      ) *
                        0.18,
                  ),

                continuationValue:
                  metric(
                    state.continuationValue *
                      0.62 +
                      continuation *
                        0.28 +
                      novelty *
                        breadthPressure *
                        0.1,
                  ),

                lookaheadValue:
                  metric(
                    state.lookaheadValue *
                      0.62 +
                      future *
                        0.38,
                  ),

                lensPressure:
                  state.lensPressure,

                score:
                  state.score +
                  continuation *
                    0.72 +
                  novelty *
                    (
                      0.2 +
                      breadthPressure
                    ) -
                  territoryPenalty +
                  future *
                    0.08,
              };

            nextStates.push(
              nextState,
            );
          }

          return nextStates;
        },
      );

    if (
      !expanded.length
    ) {
      break;
    }

    /*
     * Rank quality, then preserve different frontiers.
     */
    const ranked =
      expanded
        .map(
          (state) => ({
            state,
            quality:
              state.score +
              state.continuationValue *
                0.16 +
              state.lookaheadValue *
                0.16,
          }),
        )
        .sort(
          (a, b) =>
            b.quality -
            a.quality,
        );

    const diverseBeam:
      TrajectoryState[] =
      [];

    for (
      const entry of
        ranked
    ) {
      if (
        diverseBeam.length >=
        12
      ) {
        break;
      }

      const candidate =
        entry.state;

      const tooSimilar =
        diverseBeam.some(
          (selected) =>
            frontierDistance(
              candidate,
              selected,
            ) <
            0.38,
        );

      if (
        tooSimilar &&
        diverseBeam.length <
          4
      ) {
        continue;
      }

      diverseBeam.push(
        candidate,
      );
    }

    /*
     * Sparse-world fallback.
     */
    if (
      diverseBeam.length <
      Math.min(
        12,
        ranked.length,
      )
    ) {
      for (
        const entry of
          ranked
      ) {
        if (
          diverseBeam.length >=
          12
        ) {
          break;
        }

        if (
          diverseBeam.includes(
            entry.state,
          )
        ) {
          continue;
        }

        diverseBeam.push(
          entry.state,
        );
      }
    }

    beam =
      diverseBeam;
  }

  const beamTrajectories =
    beam
      .map(
        (state) =>
          normalizeTrajectory(
            buildTrajectoryFromState(
              graph,
              state,
              lens,
            ),
          ),
      )
      .filter(
        (trajectory) =>
          trajectory.length >=
          3,
      );

  /*
   * WHOLE-WORLD CANDIDATE COMPETES WITH THE MATERIAL BEAM.
   *
   * Crucially, this is not forced to win. It simply exists as a genuinely
   * different movie hypothesis for the universal search / viewer reranker.
   */
  const allCandidates = [
    ...sourceTraversalCandidates,
    ...beamTrajectories,
  ];

  /*
   * Exact trajectory deduplication.
   */
  const seen = new Set<string>();

  const uniqueTrajectories:
    LatentMovieTrajectoryStep[][] =
    [];

  for (
    const trajectory of
      allCandidates
  ) {
    const key =
      [
        pathKey(
          trajectory,
        ),
        operationKey(
          trajectory,
        ),
      ].join("::");

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    uniqueTrajectories.push(
      trajectory,
    );
  }

  return uniqueTrajectories;
}

function buildPathVariants(
  graph: RealityGraph,
  focus: RealityRelation,
  lens?: string,
): LatentMovieTrajectoryStep[][] {
  const initial =
    seedFocusState(
      graph,
      focus,
      lens,
    );

  if (
    initial.steps.length <
    2
  ) {
    return [];
  }

  let beam:
    TrajectoryState[] = [
      initial,
    ];

  const maxSemanticSteps =
    4;

  for (
    let depth = 0;
    depth <
    maxSemanticSteps;
    depth += 1
  ) {
    const expanded =
      beam.flatMap(
        (state) =>
          expandTrajectory(
            graph,
            state,
            lens,
            7,
          ),
      );

    if (
      !expanded.length
    ) {
      break;
    }

    const deduped =
      new Map<
        string,
        TrajectoryState
      >();

    for (
      const state of expanded
    ) {
      const key =
        [
          pathKey(
            state.steps,
          ),
          operationKey(
            state.steps,
          ),
        ].join("::");

      const existing =
        deduped.get(
          key,
        );

      if (
        !existing ||
        state.score >
          existing.score
      ) {
        deduped.set(
          key,
          state,
        );
      }
    }

   beam = [
  ...deduped.values(),
]
  .sort(
    (a, b) => {
      const aCarry =
        a.continuationValue *
        0.16;

      const bCarry =
        b.continuationValue *
        0.16;

      const aFuture =
        a.lookaheadValue *
        0.16;

      const bFuture =
        b.lookaheadValue *
        0.16;

      const aResolution =
        Math.min(
          1,
          a.resolvedTensionKeys.length /
            3,
        ) *
        0.1;

      const bResolution =
        Math.min(
          1,
          b.resolvedTensionKeys.length /
            3,
        ) *
        0.1;

      const aActive =
        Math.min(
          1,
          a.activeTensionKeys.length /
            3,
        ) *
        0.08;

      const bActive =
        Math.min(
          1,
          b.activeTensionKeys.length /
            3,
        ) *
        0.08;

      const scoreA =
        a.score +
        aCarry +
        aFuture +
        aResolution +
        aActive;

      const scoreB =
        b.score +
        bCarry +
        bFuture +
        bResolution +
        bActive;

      return (
        scoreB -
        scoreA
      );
    },
  )
  .slice(
    0,
    12,
  );
  }

  const finished =
    beam.map(
      (state) =>
        normalizeTrajectory(
          buildTrajectoryFromState(
            graph,
            state,
            lens,
          ),
        ),
    );

  const uniquePaths =
    new Map<
      string,
      LatentMovieTrajectoryStep[]
    >();

  for (
    const trajectory of
    finished
  ) {
    if (
      trajectory.length <
      3
    ) {
      continue;
    }

    const key =
      [
        pathKey(
          trajectory,
        ),
        operationKey(
          trajectory,
        ),
      ].join("::");

    if (
      !uniquePaths.has(
        key,
      )
    ) {
      uniquePaths.set(
        key,
        trajectory,
      );
    }
  }

  return [
    ...uniquePaths.values(),
  ]
    .sort(
      (a, b) =>
        b.length -
        a.length,
    )
    .slice(
      0,
      12,
    );
}

function buildTrajectoryFingerprint(
  graph: RealityGraph,
  state: TrajectoryState,
): {
  established: string[];
  changed: string[];
  active: string[];
  setup: string[];
  recurring: string[];
  carry: number;
  future: number;
  endpoint: number;
} {
  const labels = (
    ids: readonly string[],
  ): string[] =>
    unique(
      ids
        .map(
          (id) =>
            eventLabel(
              graph,
              id,
            ),
        )
        .filter(Boolean),
    );

  return {
    established:
      labels(
        state.establishedEventIds,
      ),

    changed:
      labels(
        state.usedEventIds,
      ),

    active:
      labels(
        state.activeTensionKeys.flatMap(
          (key) =>
            key
              .split(":")
              .slice(1, 3),
        ),
      ),

    setup:
      labels(
        state.setupEventIds,
      ),

    recurring:
      labels(
        state.recurringThreadKeys.map(
          (key) =>
            key.replace(
              /^recurrence:/,
              "",
            ),
        ),
      ),

    carry:
      metric(
        state.continuationValue,
      ),

    future:
      metric(
        state.lookaheadValue,
      ),

    endpoint:
      metric(
        state.endpointPressure,
      ),
  };
}
function scoreCandidate(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  focus: RealityRelation,
  lens?: string,
): Omit<
  LatentMovieCandidate,
  "id" | "lens" | "distinctiveness"
> {
  const eventIds = unique(
    trajectory.flatMap((step) => step.eventIds),
  );

  const relationKinds = unique(
    trajectory
      .slice(1)
      .map((step) => {
        if (step.eventIds.length < 2) {
          return undefined;
        }

        const relation = relationBetween(
          graph,
          step.eventIds[0],
          step.eventIds[step.eventIds.length - 1],
        );

        return relation?.kind;
      })
      .filter(
        (
          kind,
        ): kind is RealityRelation["kind"] =>
          Boolean(kind),
      ),
  );

  const payoffStep = trajectory.find(
    (step) => step.operation === "payoff",
  );

  const payoffId =
    payoffStep?.eventIds[
      payoffStep.eventIds.length - 1
    ];

  const payoff = clean(
    event(
      graph,
      payoffId ?? "",
    )?.label,
  );

  const evidence = unique(
    eventIds
      .map((id) =>
        clean(
          event(graph, id)?.label,
        ),
      )
      .filter(Boolean),
  );

  const semanticTurns = trajectory.filter(
    (step) =>
      step.operation !== "establish" &&
      step.operation !== "payoff",
  );

  const relations = semanticTurns
    .map((step) =>
      step.eventIds.length >= 2
        ? relationBetween(
            graph,
            step.eventIds[0],
            step.eventIds[step.eventIds.length - 1],
          )
        : undefined,
    )
    .filter(
      (
        relation,
      ): relation is RealityRelation =>
        Boolean(relation),
    );

  const relationStrengths = relations
    .map((relation) => relation.strength)
    .filter(Number.isFinite);

  const grounding = relationStrengths.length
    ? relationStrengths.reduce(
        (sum, value) => sum + value,
        0,
      ) / relationStrengths.length
    : focus.strength;

  const specificity = metric(
    evidence.reduce(
      (sum, label) =>
        sum +
        eventSpecificity(
          graph,
          graph.events.find(
            (item) => item.label === label,
          )?.id ?? "",
        ),
      0,
    ) / Math.max(1, evidence.length),
  );

  const relationDiversity = metric(
    Math.min(
      1,
      relationKinds.length / 4,
    ),
  );

  const operationDiversity = metric(
    Math.min(
      1,
      unique(
        trajectory.map(
          (step) => step.operation,
        ),
      ).length / 4,
    ),
  );

  /*
   * CUMULATIVE SEMANTIC MOVEMENT
   */
  const semanticTransitionKeys =
    semanticTurns.map((step) => {
      if (step.eventIds.length < 2) {
        return "";
      }

      const relation = relationBetween(
        graph,
        step.eventIds[0],
        step.eventIds[step.eventIds.length - 1],
      );

      return relation
        ? semanticTransitionKey(
            graph,
            relation,
          )
        : "";
    });

  const uniqueSemanticTransitions = unique(
    semanticTransitionKeys.filter(Boolean),
  );

  const semanticMovement = metric(
    Math.min(
      1,
      uniqueSemanticTransitions.length / 4,
    ) * 0.52 +
      Math.min(
        1,
        semanticTurns.length / 4,
      ) *
        0.2 +
      relationDiversity * 0.14 +
      operationDiversity * 0.14,
  );

  /*
   * THREAD CONTINUITY
   */
  const recurringLabels =
    graph.recurringSignals;

  const recurringEvidence =
    recurringLabels.length
      ? evidence.filter(
          (label) =>
            persistentSignalAffinity(
              label,
              recurringLabels,
            ) >= 0.35,
        )
      : [];

  const recurrenceContinuity = metric(
    Math.min(
      1,
      recurringEvidence.length / 2,
    ) *
      0.55 +
      (trajectory.some(
        (step) =>
          step.operation === "recur",
      )
        ? 0.3
        : 0) +
      (recurringEvidence.length &&
      semanticTurns.length
        ? 0.15
        : 0),
  );

  /*
   * TENSION DEVELOPMENT
   */
  const tensionBearingRelations =
    relations.filter(
      (relation) =>
        relation.kind === "contrasts" ||
        relation.kind === "changes" ||
        relation.kind === "recontextualizes" ||
        relation.kind === "causes" ||
        relation.kind === "after" ||
        relation.kind === "before",
    );

  const tensionKeys = unique(
    tensionBearingRelations.map(
      (relation) =>
        relationKey(relation),
    ),
  );

  const tensionDevelopment = metric(
    Math.min(
      1,
      tensionKeys.length / 3,
    ) *
      0.5 +
      (tensionBearingRelations.length >= 2
        ? 0.22
        : 0) +
      (payoff &&
      tensionBearingRelations.length
        ? 0.16
        : 0) +
      (unique(
        tensionBearingRelations.map(
          (relation) =>
            relation.kind,
        ),
      ).length > 1
        ? 0.12
        : 0),
  );

  /*
   * SETUP → PAYOFF LINKAGE
   */
  const payoffConnected = payoffId
    ? incidentRelations(
        graph,
        payoffId,
      ).filter(
        (relation) =>
          eventIds.includes(
            relation.from,
          ) ||
          eventIds.includes(
            relation.to,
          ),
      )
    : [];

  const payoffLinkage = metric(
    (payoff ? 0.22 : 0) +
      Math.min(
        0.42,
        payoffConnected.length * 0.12,
      ) +
      terminality(
        graph,
        payoffId ?? "",
      ) *
        0.2 +
      (payoffConnected.some(
        (relation) =>
          relation.kind === "changes" ||
          relation.kind === "recontextualizes" ||
          relation.kind === "contrasts" ||
          relation.kind === "causes" ||
          relation.kind === "repeats",
      )
        ? 0.16
        : 0),
  );

  /*
   * INFORMATION VALUE
   */
  const informationValue = metric(
    grounding * 0.24 +
      semanticMovement * 0.2 +
      specificity * 0.12 +
      tensionDevelopment * 0.14 +
      recurrenceContinuity * 0.08 +
      payoffLinkage * 0.12 +
      relationDiversity * 0.05 +
      operationDiversity * 0.05,
  );

  const contrastOrReframe =
    trajectory.some(
      (step) =>
        step.operation === "contrast" ||
        step.operation === "reframe",
    );

  const convergence =
    trajectory.some(
      (step) =>
        step.operation === "converge",
    );

  const recurrence =
    trajectory.some(
      (step) =>
        step.operation === "recur",
    );

  const consequence =
    trajectory.some(
      (step) =>
        step.operation === "consequence",
    );

  const uncertainty = metric(
    Math.min(
      1,
      semanticTurns.length / 4,
    ) *
      0.28 +
      (contrastOrReframe ? 0.2 : 0) +
      (convergence ? 0.12 : 0) +
      (recurrence ? 0.1 : 0) +
      (consequence ? 0.1 : 0) +
      tensionDevelopment * 0.2,
  );

  const attentionPotential = metric(
    informationValue * 0.38 +
      uncertainty * 0.28 +
      semanticMovement * 0.16 +
      specificity * 0.08 +
      operationDiversity * 0.1,
  );

  const consequencePotential = metric(
    payoffLinkage * 0.52 +
      tensionDevelopment * 0.18 +
      semanticMovement * 0.12 +
      (consequence ? 0.1 : 0) +
      terminality(
        graph,
        payoffId ?? "",
      ) *
        0.08,
  );

  const callbackPotential = metric(
    graph.recurringSignals.length
      ? Math.min(
          1,
          graph.recurringSignals.length / 4,
        ) *
          0.38 +
          recurrenceContinuity * 0.36 +
          (recurrence ? 0.26 : 0)
      : recurrence
        ? 0.32
        : 0.04,
  );

  const repeatedEvents =
    eventIds.length -
    unique(eventIds).length;

  const repeatedEventTransitions =
    trajectory.reduce(
      (sum, step, index) => {
        if (index === 0) {
          return sum;
        }

        const previous = new Set(
          trajectory[index - 1]?.eventIds ??
            [],
        );

        const current = new Set(
          step.eventIds ?? [],
        );

        const shared = [
          ...current,
        ].filter((id) =>
          previous.has(id),
        ).length;

        return sum + (shared >= 2 ? 1 : 0);
      },
      0,
    );

  const semanticStagnationPenalty =
    metric(
      Math.min(
        1,
        repeatedEventTransitions * 0.22,
      ),
    );

  const repetitionRisk = metric(
    Math.max(
      0,
      repeatedEvents * 0.12,
    ),
  );

  const pathLengthScore = metric(
    Math.min(
      1,
      trajectory.length / 5,
    ),
  );

  const compressionPotential = metric(
    semanticMovement * 0.34 +
      pathLengthScore * 0.3 +
      specificity * 0.18 +
      operationDiversity * 0.18,
  );

  const truthRisk = metric(
    Math.max(
      0,
      1 -
        (
          grounding * 0.46 +
          specificity * 0.1 +
          relationDiversity * 0.1 +
          payoffLinkage * 0.14 +
          semanticMovement * 0.1 +
          pathLengthScore * 0.1
        ),
    ),
  );

  const focusPreference =
    relationPreference(
      focus.kind,
      lens,
    );

  const score = metric(
    grounding * 0.13 +
      specificity * 0.07 +
      informationValue * 0.14 +
      semanticMovement * 0.12 +
      tensionDevelopment * 0.1 +
      attentionPotential * 0.13 +
      consequencePotential * 0.11 +
      payoffLinkage * 0.06 +
      callbackPotential * 0.05 +
      recurrenceContinuity * 0.04 +
      compressionPotential * 0.03 +
      relationDiversity * 0.03 +
      operationDiversity * 0.03 +
      focusPreference * 0.03 +
      (1 - repetitionRisk) * 0.04 -
      semanticStagnationPenalty * 0.09 -
      truthRisk * 0.11,
  );

  return {
    anchorEventIds: [
      focus.from,
      focus.to,
    ],

    supportingRelationKinds:
      relationKinds.length
        ? relationKinds
        : [focus.kind],

    trajectory: [
      ...trajectory,
    ],

    payoff,

    unresolvedQuestion:
      trajectory.length > 0
        ? trajectory[
            trajectory.length - 1
          ]?.nextQuestion ??
          "What becomes newly meaningful?"
        : "What becomes newly meaningful?",

    evidence,

    hypothesis: [
      `The experience is organized around ${focus.kind}.`,
      `The central semantic move is: ${semanticTurn(
        graph,
        focus,
      )}.`,
      `The trajectory carries ${relationKinds.length} relation types across ${semanticTurns.length} semantic turns.`,
      "The lens changes interpretation of supplied reality without changing the supplied reality.",
    ],

    truthRisk,
    novelty: metric(
      1 -
        tokenOverlap(
          evidence.join(" "),
          graph.events
            .map(
              (item) =>
                item.label,
            )
            .join(" "),
        ) *
          0.35,
    ),
    specificity,
    informationValue,
    uncertainty,
    attentionPotential,
    consequencePotential,
    callbackPotential,
    compressionPotential,
    repetitionRisk,
    score,
  };
}

function movieKey(
  candidate: LatentMovieCandidate,
): string {
  const trajectoryKey =
    candidate.trajectory
      .map(
        (step) =>
          [
            step.operation,
            step.eventIds.join(
              ",",
            ),
          ].join(
            ":",
          ),
      )
      .join("|");

  const relationKey =
    candidate
      .supportingRelationKinds
      .join(",");

  const anchorKey =
    candidate.anchorEventIds.join(
      ",",
    );

  return [
    anchorKey,
    relationKey,
    trajectoryKey,
  ].join("::");
}

function evidenceKey(
  candidate: LatentMovieCandidate,
): string {
  return candidate.evidence
    .map(
      lower,
    )
    .sort()
    .join("|");
}

function operationPattern(
  candidate: LatentMovieCandidate,
): string {
  return operationKey(
    candidate.trajectory,
  );
}

function relationPattern(
  candidate: LatentMovieCandidate,
): string {
  return candidate.supportingRelationKinds
    .join(">");
}

function candidateFamilyKey(
  candidate: LatentMovieCandidate,
): string {
  return [
    evidenceKey(
      candidate,
    ),
    candidate.payoff,
  ].join("::");
}

function diversitySimilarity(
  left: LatentMovieCandidate,
  right: LatentMovieCandidate,
): number {
  const evidenceSimilarity =
    tokenOverlap(
      left.evidence.join(
        " ",
      ),
      right.evidence.join(
        " ",
      ),
    );

  const operationSimilarity =
    tokenOverlap(
      operationPattern(
        left,
      ),
      operationPattern(
        right,
      ),
    );

  const relationSimilarity =
    tokenOverlap(
      relationPattern(
        left,
      ),
      relationPattern(
        right,
      ),
    );

  const anchorSimilarity =
    tokenOverlap(
      left.anchorEventIds.join(
        " ",
      ),
      right.anchorEventIds.join(
        " ",
      ),
    );

  return metric(
    evidenceSimilarity *
      0.46 +
      operationSimilarity *
      0.22 +
      relationSimilarity *
      0.18 +
      anchorSimilarity *
      0.14,
  );
}
function isWholeWorldCandidate(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): boolean {
  const world =
    scoreWholeWorldSequence(
      graph,
      candidate,
    );

  /*
   * A whole-world candidate is one that already demonstrates:
   * - meaningful breadth
   * - sequence shape
   * - movement between territories
   *
   * This does not require complete source coverage.
   */
  return (
    world.breadth >= 0.58 &&
    world.territoryMovement >= 0.45 &&
    world.shape >= 0.68
  );
}
function diversifyCandidates(
  graph: RealityGraph,
  candidates: LatentMovieCandidate[],
  limit: number,
): LatentMovieCandidate[] {
  const ranked =
    [...candidates].sort(
      (a, b) =>
        b.score -
        a.score,
    );

  const selected:
    LatentMovieCandidate[] =
    [];

  const familyCounts =
    new Map<
      string,
      number
    >();

  const selectedMovieKeys =
    new Set<string>();

  /*
   * WHOLE-WORLD STRUCTURAL DETECTOR
   *
   * This does not ask whether the movie is "good."
   *
   * It asks whether the trajectory genuinely traverses supplied material
   * across the source rather than living inside one semantic neighborhood.
   *
   * It is presentation structure, not subject-specific logic.
   */
  const isSourceSpanningMovie = (
    candidate: LatentMovieCandidate,
  ): boolean => {
    const ids =
      unique(
        candidate.trajectory.flatMap(
          (step) =>
            step.eventIds,
        ),
      );

    if (
      ids.length < 5 ||
      graph.events.length < 5
    ) {
      return false;
    }

    const positions =
      ids
        .map(
          (id) =>
            graph.events.findIndex(
              (event) =>
                event.id === id,
            ),
        )
        .filter(
          (index) =>
            index >= 0,
        );

    if (
      positions.length < 5
    ) {
      return false;
    }

    let forwardMoves =
      0;

    for (
      let index = 1;
      index < positions.length;
      index += 1
    ) {
      if (
        positions[index]! >
        positions[index - 1]!
      ) {
        forwardMoves += 1;
      }
    }

    const sourceOrder =
      forwardMoves /
      Math.max(
        1,
        positions.length - 1,
      );

    const span =
      (
        Math.max(
          ...positions,
        ) -
        Math.min(
          ...positions,
        )
      ) /
      Math.max(
        1,
        graph.events.length - 1,
      );

    /*
     * At least five distinct supplied events, materially spanning the source,
     * with predominantly forward presentation movement.
     *
     * This intentionally does NOT require every event.
     */
    return (
      sourceOrder >= 0.65 &&
      span >= 0.55
    );
  };

  /*
   * Preserve one source-spanning movie before ordinary diversity selection.
   *
   * This candidate is not declared the winner.
   * It is simply kept alive so viewer-state reranking can judge it.
   */
  const wholeWorldCandidate =
    ranked.find(
      isSourceSpanningMovie,
    );

  if (
    wholeWorldCandidate &&
    limit > 1
  ) {
    wholeWorldCandidate.distinctiveness =
      1;

    selected.push(
      wholeWorldCandidate,
    );

    const family =
      candidateFamilyKey(
        wholeWorldCandidate,
      );

    familyCounts.set(
      family,
      1,
    );

    selectedMovieKeys.add(
      movieKey(
        wholeWorldCandidate,
      ),
    );
  }

  /*
   * Ordinary diversity selection.
   */
  for (
    const candidate of
      ranked
  ) {
    if (
      selected.length >=
      limit
    ) {
      break;
    }

    const candidateKey =
      movieKey(
        candidate,
      );

    if (
      selectedMovieKeys.has(
        candidateKey,
      )
    ) {
      continue;
    }

    const family =
      candidateFamilyKey(
        candidate,
      );

    const familyCount =
      familyCounts.get(
        family,
      ) ??
      0;

    const maxFamilyReuse =
      limit >= 8
        ? 3
        : 2;

    if (
      familyCount >=
      maxFamilyReuse
    ) {
      continue;
    }

    const similarity =
      selected.length
        ? Math.max(
            ...selected.map(
              (
                existing,
              ) =>
                diversitySimilarity(
                  candidate,
                  existing,
                ),
            ),
          )
        : 0;

    const pathDistinctiveness =
      selected.length
        ? 1 -
          tokenOverlap(
            candidate.evidence.join(
              " ",
            ),
            selected
              .map(
                (
                  existing,
                ) =>
                  existing.evidence.join(
                    " ",
                  ),
              )
              .join(
                " ",
              ),
          )
        : 1;

    const operationDistinctiveness =
      selected.length
        ? 1 -
          Math.max(
            ...selected.map(
              (
                existing,
              ) =>
                tokenOverlap(
                  operationPattern(
                    candidate,
                  ),
                  operationPattern(
                    existing,
                  ),
                ),
            ),
          )
        : 1;

    const relationDistinctiveness =
      selected.length
        ? 1 -
          Math.max(
            ...selected.map(
              (
                existing,
              ) =>
                tokenOverlap(
                  relationPattern(
                    candidate,
                  ),
                  relationPattern(
                    existing,
                  ),
                ),
            ),
          )
        : 1;

    const evidenceReuseBonus =
      selected.length &&
      candidate.evidence.every(
        (
          label,
        ) =>
          selected.some(
            (
              existing,
            ) =>
              existing.evidence.includes(
                label,
              ),
          ),
      )
        ? 0.08
        : 0;

    const distinctiveness =
      metric(
        pathDistinctiveness *
          0.34 +
          operationDistinctiveness *
            0.25 +
          relationDistinctiveness *
            0.21 +
          (
            1 -
            similarity
          ) *
            0.2,
      );

    candidate.distinctiveness =
      distinctiveness;

    candidate.score =
      metric(
        candidate.score *
          0.82 +
          distinctiveness *
            0.12 +
          evidenceReuseBonus +
          (
            similarity <
            0.72
              ? 0.04
              : 0
          ),
      );

    selected.push(
      candidate,
    );

    selectedMovieKeys.add(
      candidateKey,
    );

    familyCounts.set(
      family,
      familyCount + 1,
    );
  }

  /*
   * HARD SURVIVAL INVARIANT
   *
   * A source-spanning movie is a legitimate competing hypothesis.
   * If ordinary diversity selection somehow removed it, restore it by
   * replacing the weakest selected movie.
   */
  if (
    wholeWorldCandidate &&
    limit > 1 &&
    !selectedMovieKeys.has(
      movieKey(
        wholeWorldCandidate,
      ),
    )
  ) {
    if (
      selected.length >=
      limit
    ) {
      selected.sort(
        (a, b) =>
          a.score -
          b.score,
      );

      selected.shift();
    }

    wholeWorldCandidate.distinctiveness =
      1;

    selected.push(
      wholeWorldCandidate,
    );
  }

  return selected
    .sort(
      (a, b) =>
        b.score -
        a.score,
    )
    .slice(
      0,
      limit,
    );
}
function buildFallbackTrajectory(
  graph: RealityGraph,
  focus: RealityRelation,
  lens?: string,
): LatentMovieTrajectoryStep[] {
  const openingId =
    chooseOpeningEvent(
      graph,
      focus,
      lens,
    );

  const opening =
    event(
      graph,
      openingId,
    );

  const targetId =
    orientedOtherEnd(
      focus,
      openingId,
    );

  const target =
    event(
      graph,
      targetId,
    );

  if (
    !opening ||
    !target
  ) {
    return [];
  }

  const steps:
    LatentMovieTrajectoryStep[] =
    [
      {
        order: 1,
        operation:
          "establish",
        eventIds: [
          opening.id,
        ],
        viewerChange:
          `Establish supplied evidence: ${opening.label}.`,
        nextQuestion:
          "What relationship deserves the next cut?",
      },

      {
        order: 2,
        operation:
          operationForRelation(
            focus.kind,
          ),
        eventIds: [
          opening.id,
          target.id,
        ],
        viewerChange:
          semanticTurn(
            graph,
            focus,
          ),
        nextQuestion:
          nextQuestion(
            focus,
          ),
      },
    ];

  const fallbackState: TrajectoryState = {
  steps,
  usedEventIds: [
    opening.id,
    target.id,
  ],
  usedRelationKeys: [
    relationKey(
      focus,
    ),
  ],
  establishedEventIds: [
    opening.id,
    target.id,
  ],
  semanticTurnKeys: [
    semanticTransitionKey(
      graph,
      focus,
    ),
  ],
  activeTensionKeys:
    [
      "contrasts",
      "changes",
      "recontextualizes",
    ].includes(
      focus.kind,
    )
      ? [
          relationKey(
            focus,
          ),
        ]
      : [],
  resolvedTensionKeys: [],
  setupEventIds: [
    target.id,
  ],
  recurringThreadKeys: [],
  unresolvedQuestionKeys: [
    nextQuestion(
      focus,
    ).toLowerCase(),
  ],
  endpointPressure:
    terminality(
      graph,
      target.id,
    ),
  continuationValue: 0,
  lookaheadValue: 0,
  lensPressure:
    relationPreference(
      focus.kind,
      lens,
    ),
  score: 0,
};

const payoffId =
  choosePayoffEvent(
    graph,
    fallbackState,
    lens,
  );

  const payoff =
    payoffId
      ? event(
          graph,
          payoffId,
        )
      : undefined;

  if (
    payoff
  ) {
    const relation =
      payoffRelation(
        graph,
        payoff.id,
        [
          opening.id,
          target.id,
        ],
        lens,
      );

    steps.push({
      order: 3,
      operation:
        "payoff",
      eventIds:
        relation
          ? unique([
              relation.from,
              relation.to,
            ])
          : [payoff.id],
      viewerChange:
        `The supplied endpoint lands after the accumulated path: ${payoff.label}.`,
      nextQuestion:
        "What is now true at the supplied ending?",
    });
  }

  return normalizeTrajectory(
    steps,
  );
}
function scoreMaterialTrajectory(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  lens?: string,
): Omit<
  LatentMovieCandidate,
  "id" | "lens" | "distinctiveness"
> {
  const eventIds = unique(
    trajectory.flatMap(
      (step) => step.eventIds,
    ),
  );

  const evidence = unique(
    eventIds
      .map((id) =>
        clean(
          event(graph, id)?.label,
        ),
      )
      .filter(Boolean),
  );

  const eventSpecificities = eventIds.map(
    (id) =>
      eventSpecificity(
        graph,
        id,
      ),
  );

  const specificity = metric(
    eventSpecificities.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) /
      Math.max(
        1,
        eventSpecificities.length,
      ),
  );

  const centrality = metric(
    eventIds.reduce(
      (sum, id) =>
        sum +
        graphCentrality(
          graph,
          id,
        ),
      0,
    ) /
      Math.max(
        1,
        eventIds.length,
      ),
  );

  const recurringCount =
    evidence.filter(
      (label) =>
        persistentSignalAffinity(
          label,
          graph.recurringSignals,
        ) >= 0.35,
    ).length;

  const tensionCount =
    evidence.filter(
      (label) =>
        persistentSignalAffinity(
          label,
          graph.unresolvedTensions,
        ) >= 0.35,
    ).length;

  /*
   * ================================================================
   * SEQUENCE-LOCAL MATERIAL MOVEMENT
   * ================================================================
   *
   * Global pairwise diversity is intentionally avoided.
   *
   * A material film may revisit a semantic territory when the return
   * serves a different sequence function:
   *
   *   accumulation
   *   rhythm
   *   obsession
   *   interruption
   *   callback
   *
   * What matters is whether the sequence camps locally.
   */
  const sequenceLabels =
    evidence.map(
      (label) =>
        clean(label),
    );

  let localOverlap = 0;
  let localPairs = 0;

  for (
    let i = 1;
    i < sequenceLabels.length;
    i += 1
  ) {
    localOverlap += tokenOverlap(
      sequenceLabels[i - 1]!,
      sequenceLabels[i]!,
    );

    localPairs += 1;
  }

  const localSemanticFreshness =
    metric(
      1 -
        (
          localPairs
            ? localOverlap /
              localPairs
            : 0
        ),
    );

  let repeatedLocalTransitions = 0;

  for (
    let i = 2;
    i < sequenceLabels.length;
    i += 1
  ) {
    const previousSimilarity =
      tokenOverlap(
        sequenceLabels[i - 2]!,
        sequenceLabels[i - 1]!,
      );

    const currentSimilarity =
      tokenOverlap(
        sequenceLabels[i - 1]!,
        sequenceLabels[i]!,
      );

    if (
      previousSimilarity >= 0.58 &&
      currentSimilarity >= 0.58
    ) {
      repeatedLocalTransitions += 1;
    }
  }

  const localCampingPenalty =
    metric(
      Math.min(
        1,
        repeatedLocalTransitions * 0.24,
      ),
    );

  /*
   * A later return is not treated as global repetition.
   *
   * Separated recurrence is useful because it allows associative
   * memory / callback structure to emerge.
   */
  let separatedReturns = 0;

  for (
    let i = 0;
    i < sequenceLabels.length;
    i += 1
  ) {
    for (
      let j = i + 2;
      j < sequenceLabels.length;
      j += 1
    ) {
      const similarity =
        tokenOverlap(
          sequenceLabels[i]!,
          sequenceLabels[j]!,
        );

      const intervening =
        j - i - 1;

      if (
        similarity >= 0.58 &&
        intervening >= 1
      ) {
        separatedReturns += 1;
      }
    }
  }

  const callbackStructure =
    metric(
      Math.min(
        1,
        separatedReturns * 0.18,
      ),
    );

  const semanticDiversity =
    metric(
      localSemanticFreshness * 0.72 +
        callbackStructure * 0.28 -
        localCampingPenalty * 0.18,
    );

  /*
   * ================================================================
   * ENDPOINT
   * ================================================================
   */
  const finalEventId =
    eventIds[eventIds.length - 1];

  const finalLabel =
    clean(
      event(
        graph,
        finalEventId ?? "",
      )?.label,
    );

  const endpointValue =
    metric(
      terminality(
        graph,
        finalEventId ?? "",
      ) *
        0.48 +
        eventSpecificity(
          graph,
          finalEventId ?? "",
        ) *
        0.22 +
        persistentSignalAffinity(
          finalLabel,
          graph.recurringSignals,
        ) *
        0.12 +
        persistentSignalAffinity(
          finalLabel,
          graph.unresolvedTensions,
        ) *
        0.18,
    );

  const pathLengthScore =
    metric(
      Math.min(
        1,
        trajectory.length / 5,
      ),
    );

  /*
   * ================================================================
   * INFORMATION / ATTENTION / COMPRESSION
   * ================================================================
   */
  const informationValue =
    metric(
      specificity * 0.22 +
        semanticDiversity * 0.26 +
        pathLengthScore * 0.18 +
        endpointValue * 0.18 +
        Math.min(
          1,
          recurringCount / 2,
        ) *
          0.08 +
        Math.min(
          1,
          tensionCount / 2,
        ) *
          0.08,
    );

  const attentionPotential =
    metric(
      informationValue * 0.42 +
        semanticDiversity * 0.24 +
        specificity * 0.12 +
        endpointValue * 0.14 +
        centrality * 0.08,
    );

  const compressionPotential =
    metric(
      semanticDiversity * 0.32 +
        pathLengthScore * 0.32 +
        specificity * 0.18 +
        attentionPotential * 0.18,
    );

  const callbackPotential =
    metric(
      Math.min(
        1,
        recurringCount / 2,
      ) *
        0.7 +
        (
          recurringCount > 0
            ? 0.3
            : 0
        ),
    );

  /*
   * ================================================================
   * TRUTH RISK
   * ================================================================
   *
   * Material paths remain presentation sequencing over supplied
   * evidence. No chronology or causality is invented.
   */
  const truthRisk =
    metric(
      Math.max(
        0,
        1 -
          (
            specificity * 0.34 +
            semanticDiversity * 0.18 +
            endpointValue * 0.16 +
            pathLengthScore * 0.18 +
            centrality * 0.14
          ),
      ),
    );

  /*
   * ================================================================
   * WHOLE-WORLD STRUCTURE
   * ================================================================
   *
   * This is the critical correction.
   *
   * Material trajectories are legitimate movie hypotheses in their
   * own right. A path that actually traverses the supplied world must
   * be evaluated for:
   *
   *   breadth
   *   source movement
   *   territorial movement
   *   operator variation
   *   overall sequence shape
   *   camping avoidance
   *
   * The whole-world scorer is therefore part of the MATERIAL SEARCH
   * score itself, not merely a late viewer-state bonus.
   *
   * scoreWholeWorldSequence expects a candidate-shaped object, so
   * construct a deterministic provisional candidate from the exact
   * material evidence already computed here.
   */
  const provisionalCandidate:
    LatentMovieCandidate =
    {
      id:
        "material-scoring-provisional",

      lens:
        clean(lens) ||
        "neutral",

      anchorEventIds:
        eventIds.slice(
          0,
          Math.min(
            2,
            eventIds.length,
          ),
        ),

      supportingRelationKinds: [],

      trajectory: [
        ...trajectory,
      ],

      payoff:
        finalLabel,

      unresolvedQuestion:
        "What supplied detail deserves the next cut?",

      evidence,

      hypothesis: [
        "The sequence is constructed from supplied reality without assuming chronology.",
        "Distinct supplied details are allowed to become successive presentation cuts.",
        "The sequence favors semantic variety while preserving factual grounding.",
        "The lens changes interpretation without changing supplied reality.",
      ],

      truthRisk,

      novelty:
        semanticDiversity,

      specificity,

      informationValue,

      uncertainty:
        metric(
          semanticDiversity * 0.5 +
            endpointValue * 0.3 +
            pathLengthScore * 0.2,
        ),

      attentionPotential,

      consequencePotential:
        endpointValue,

      callbackPotential,

      compressionPotential,

      repetitionRisk:
        metric(
          1 -
            semanticDiversity,
        ),

      score:
        0,

      distinctiveness:
        0,
    };

  const wholeWorld =
    scoreWholeWorldSequence(
      graph,
      provisionalCandidate,
    );

  /*
   * Composite whole-world fitness.
   *
   * score is included directly, while the component terms make the
   * intended structural preference explicit and stable.
   */
  const wholeWorldFitness =
    metric(
      wholeWorld.score * 0.42 +
        wholeWorld.breadth * 0.18 +
        wholeWorld.territoryMovement * 0.18 +
        wholeWorld.sourceOrder * 0.07 +
        wholeWorld.operatorDiversity * 0.06 +
        wholeWorld.shape * 0.14 -
        wholeWorld.campingPenalty * 0.15,
    );

  /*
   * A sufficiently broad trajectory gets an explicit structural
   * identity bonus.
   *
   * This does NOT force broad-world movies to win.
   * It prevents the search from treating a genuine whole-world film
   * as equivalent to a narrow semantic cluster.
   */
  const sourceSpanning =
    eventIds.length >=
      Math.min(
        5,
        graph.events.length,
      ) &&
    wholeWorld.breadth >=
      0.58 &&
    wholeWorld.territoryMovement >=
      0.35;

  const wholeWorldBonus =
    sourceSpanning
      ? 0.08
      : 0;

  /*
   * ================================================================
   * FINAL MATERIAL SCORE
   * ================================================================
   *
   * Whole-world structure is now a first-class search property.
   *
   * The material candidate still needs specificity, semantic movement,
   * endpoint quality and grounding, but a narrow cluster no longer gets
   * to dominate simply because its graph relations are denser.
   */
  const score =
    metric(
      specificity * 0.10 +
        semanticDiversity * 0.10 +
        informationValue * 0.12 +
        attentionPotential * 0.12 +
        endpointValue * 0.09 +
        compressionPotential * 0.04 +
        callbackPotential * 0.03 +
        pathLengthScore * 0.04 +
        centrality * 0.02 +
        wholeWorldFitness * 0.30 +
        wholeWorldBonus -
        truthRisk * 0.04,
    );

  return {
    anchorEventIds:
      eventIds.slice(
        0,
        Math.min(
          2,
          eventIds.length,
        ),
      ),

    supportingRelationKinds:
      [],

    trajectory: [
      ...trajectory,
    ],

    payoff:
      finalLabel,

    unresolvedQuestion:
      "What supplied detail deserves the next cut?",

    evidence,

    hypothesis: [
      "The sequence is constructed from supplied reality without assuming chronology.",
      "Distinct supplied details are allowed to become successive presentation cuts.",
      "The sequence favors semantic variety while preserving factual grounding.",
      "Whole-world traversal is treated as a legitimate movie structure rather than noise.",
      "The lens changes interpretation without changing supplied reality.",
    ],

    truthRisk,

    novelty:
      semanticDiversity,

    specificity,

    informationValue,

    uncertainty:
      metric(
        semanticDiversity * 0.42 +
          wholeWorldFitness * 0.32 +
          endpointValue * 0.18 +
          pathLengthScore * 0.08,
      ),

    attentionPotential,

    consequencePotential:
      endpointValue,

    callbackPotential,

    compressionPotential,

    repetitionRisk:
      metric(
        Math.max(
          0,
          1 -
            (
              semanticDiversity * 0.72 +
              wholeWorldFitness * 0.28
            ),
        ),
      ),

    score,
  };
}
export function searchUniversalMovieCandidates(
  input: {
    graph: RealityGraph;
    subject?: string;
    lens?: string;
    limit?: number;
  },
): LatentMovieCandidate[] {
  const limit =
    Math.max(
      3,
      Math.min(
        12,
        input.limit ?? 8,
      ),
    );

  const relationCandidates =
    [...input.graph.relations]
      .filter(
        (relation) =>
          SEARCH_RELATION_KINDS.includes(
            relation.kind,
          ),
      )
      .sort(
        (a, b) => {
          const score =
            (
              relation: RealityRelation,
            ) =>
              relation.strength *
                relationWeight(
                  relation.kind,
                ) *
                relationPreference(
                  relation.kind,
                  input.lens,
                ) +
              graphCentrality(
                input.graph,
                relation.from,
              ) *
                0.08 +
              graphCentrality(
                input.graph,
                relation.to,
              ) *
                0.08 +
              terminality(
                input.graph,
                relation.to,
              ) *
                0.04 +
              terminality(
                input.graph,
                relation.from,
              ) *
                0.04;

          return (
            score(b) -
            score(a)
          );
        },
      );

  const rawCandidates:
    LatentMovieCandidate[] =
    [];

  const seenMovieKeys =
    new Set<string>();

  /*
   * ================================================================
   * CANONICAL WHOLE-WORLD MOVIE
   * ================================================================
   *
   * The source traversal is not merely another beam candidate.
   *
   * It is the explicit hypothesis:
   *
   *   "Show me the supplied world as a connected sequence."
   *
   * It uses ONLY supplied RealityGraph events.
   * It does not invent chronology, causality, or bridge events.
   *
   * This candidate must exist independently of relation density.
   */
  const sourceTraversal =
    buildSourceTraversalTrajectory(
      input.graph,
    );

  if (
    sourceTraversal.length >=
    3
  ) {
    const scored =
      scoreMaterialTrajectory(
        input.graph,
        sourceTraversal,
        input.lens,
      );

    const wholeWorldCandidate:
      LatentMovieCandidate =
      {
        id:
          "movie-material-whole-world",

        lens:
          clean(
            input.lens,
          ) ||
          "neutral",

        ...scored,

        distinctiveness:
          1,
      };

    const key =
      movieKey(
        wholeWorldCandidate,
      );

    seenMovieKeys.add(
      key,
    );

    rawCandidates.push(
      wholeWorldCandidate,
    );
  }

  /*
   * ================================================================
   * ADDITIONAL MATERIAL MOVIE VARIANTS
   * ================================================================
   *
   * These are still useful alternatives:
   * different seeds, different presentation paths, callbacks,
   * local territory changes, etc.
   *
   * The canonical source traversal above remains independently alive.
   */
  const materialTrajectories =
    buildMaterialPathVariants(
      input.graph,
      input.lens,
    );

  for (
    const trajectory of
      materialTrajectories
  ) {
    if (
      trajectory.length <
      3
    ) {
      continue;
    }

    /*
     * Do not re-add the canonical source traversal if the material
     * variant generator returned it.
     */
    const scored =
      scoreMaterialTrajectory(
        input.graph,
        trajectory,
        input.lens,
      );

    const candidate:
      LatentMovieCandidate =
      {
        id:
          `movie-material-${rawCandidates.length + 1}`,

        lens:
          clean(
            input.lens,
          ) ||
          "neutral",

        ...scored,

        distinctiveness:
          0,
      };

    const key =
      movieKey(
        candidate,
      );

    if (
      seenMovieKeys.has(
        key,
      )
    ) {
      continue;
    }

    seenMovieKeys.add(
      key,
    );

    rawCandidates.push(
      candidate,
    );
  }

  /*
   * ================================================================
   * RELATION-DERIVED MOVIES
   * ================================================================
   *
   * Existing semantic search remains intact.
   */
  for (
    const focus of
      relationCandidates
  ) {
    const paths =
      buildPathVariants(
        input.graph,
        focus,
        input.lens,
      );

    const candidatePaths =
      paths.length
        ? paths
        : [
            buildFallbackTrajectory(
              input.graph,
              focus,
              input.lens,
            ),
          ];

    for (
      const trajectory of
        candidatePaths
    ) {
      if (
        trajectory.length <
        3
      ) {
        continue;
      }

      const scored =
        scoreCandidate(
          input.graph,
          trajectory,
          focus,
          input.lens,
        );

      const candidate:
        LatentMovieCandidate =
        {
          id:
            `movie-${rawCandidates.length + 1}-${focus.kind}`,

          lens:
            clean(
              input.lens,
            ) ||
            "neutral",

          ...scored,

          distinctiveness:
            0,
        };

      const key =
        movieKey(
          candidate,
        );

      if (
        seenMovieKeys.has(
          key,
        )
      ) {
        continue;
      }

      seenMovieKeys.add(
        key,
      );

      rawCandidates.push(
        candidate,
      );
    }
  }

  /*
   * ================================================================
   * ENDPOINT-CENTERED RECOVERY
   * ================================================================
   */
  if (
    rawCandidates.length <
    limit
  ) {
    const terminalEvents =
      input.graph.events
        .map(
          (item) => ({
            id:
              item.id,

            score:
              terminality(
                input.graph,
                item.id,
              ) *
                0.5 +
              graphCentrality(
                input.graph,
                item.id,
              ) *
                0.25 +
              eventSpecificity(
                input.graph,
                item.id,
              ) *
                0.25,
          }),
        )
        .sort(
          (a, b) =>
            b.score -
            a.score,
        );

    for (
      const terminalEvent of
        terminalEvents
    ) {
      if (
        rawCandidates.length >=
        limit * 3
      ) {
        break;
      }

      const connectedRelations =
        incidentRelations(
          input.graph,
          terminalEvent.id,
        )
          .filter(
            (relation) =>
              SEARCH_RELATION_KINDS.includes(
                relation.kind,
              ),
          )
          .sort(
            (a, b) =>
              (
                b.strength *
                relationWeight(
                  b.kind,
                )
              ) -
              (
                a.strength *
                relationWeight(
                  a.kind,
                )
              ),
          );

      for (
        const focus of
          connectedRelations.slice(
            0,
            4,
          )
      ) {
        const fallback =
          buildFallbackTrajectory(
            input.graph,
            focus,
            input.lens,
          );

        if (
          fallback.length <
          3
        ) {
          continue;
        }

        const scored =
          scoreCandidate(
            input.graph,
            fallback,
            focus,
            input.lens,
          );

        const candidate:
          LatentMovieCandidate =
          {
            id:
              `movie-${rawCandidates.length + 1}-${focus.kind}-endpoint`,

            lens:
              clean(
                input.lens,
              ) ||
              "neutral",

            ...scored,

            distinctiveness:
              0,
          };

        const key =
          movieKey(
            candidate,
          );

        if (
          seenMovieKeys.has(
            key,
          )
        ) {
          continue;
        }

        seenMovieKeys.add(
          key,
        );

        rawCandidates.push(
          candidate,
        );
      }
    }
  }

  /*
   * ================================================================
   * EXACT DEDUPLICATION
   * ================================================================
   */
  const exactDeduped =
    rawCandidates.filter(
      (
        candidate,
        index,
        all,
      ) =>
        index ===
        all.findIndex(
          (other) =>
            movieKey(
              other,
            ) ===
            movieKey(
              candidate,
            ),
        ),
    );

  /*
   * ================================================================
   * DIVERSIFICATION
   * ================================================================
   *
   * Whole-world candidate is now guaranteed to have entered this
   * stage independently.
   */
  const sorted =
    [...exactDeduped].sort(
      (a, b) =>
        b.score -
        a.score,
    );

  const diversified =
    diversifyCandidates(
      input.graph,
      sorted,
      limit,
    );

  /*
   * ================================================================
   * HARD WHOLE-WORLD SURVIVAL
   * ================================================================
   *
   * Do not permit ordinary ranking/diversification to erase the
   * canonical source-spanning hypothesis.
   */
  const canonicalWholeWorld =
    exactDeduped.find(
      (
        candidate,
      ) =>
        candidate.id ===
        "movie-material-whole-world",
    );

  if (
    canonicalWholeWorld &&
    limit > 1
  ) {
    const alreadyPresent =
      diversified.some(
        (
          candidate,
        ) =>
          movieKey(
            candidate,
          ) ===
          movieKey(
            canonicalWholeWorld,
          ),
      );

    if (!alreadyPresent) {
      if (
        diversified.length >=
        limit
      ) {
        diversified.sort(
          (a, b) =>
            a.score -
            b.score,
        );

        diversified.shift();
      }

      canonicalWholeWorld.distinctiveness =
        1;

      diversified.push(
        canonicalWholeWorld,
      );
    }
  }

  /*
   * ================================================================
   * FINAL RETURN
   * ================================================================
   */
  return diversified
    .sort(
      (
        a,
        b,
      ) =>
        b.score -
        a.score,
    )
    .slice(
      0,
      limit,
    )
    .map(
      (
        candidate,
        index,
      ) => ({
        ...candidate,

        id:
          `movie-${index + 1}-${clean(
            candidate.lens,
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-",
            ) ||
          "neutral"}`,
      }),
    );
}