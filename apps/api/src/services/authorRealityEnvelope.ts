import type {
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

export type RealityEnvelopeEvent = {
  id: string;
  label: string;
  sourceIds: string[];
  entities: string[];
};

export type RealityEnvelopeRelation = {
  from: string;
  to: string;
  kind: RealityRelation["kind"];
  strength: number;
};

export type RealityEnvelope = {
  subject: string;
  events: RealityEnvelopeEvent[];
  relations: RealityEnvelopeRelation[];
  suppliedTerms: string[];
  suppliedPhrases: string[];
  suppliedEntities: string[];
  suppliedActions: string[];
  suppliedStates: string[];
  openingEventIds: string[];
  endpointEventId: string;
  carrierEventIds: string[];
  unresolvedTensions: string[];
  recurringSignals: string[];
  sensorySignals: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const TOKEN_RE = /[a-z0-9]+(?:['-][a-z0-9]+)*/gi;

const ACTION_RE =
  /\b(?:arrive|arrived|come|came|leave|left|finish|finished|complete|completed|steal|stole|take|took|give|gave|make|made|open|opened|close|closed|eat|ate|drink|drank|write|wrote|sign|signed|kiss|kissed|marry|married|cut|clean|cleaned|wash|washed|cook|cooked|build|built|move|moved|return|returned|run|ran|walk|walked|sit|sat|stand|stood)\b/i;

const STATE_RE =
  /\b(?:nervous|fierce|cool|happy|sad|proud|angry|afraid|scared|quiet|calm|excited|tired|ready|beautiful|fabulous|safe|finished|done|married|connected|alone|missing|lost|new|different|changed)\b/i;

function tokens(values: readonly string[]): string[] {
  return unique(
    values.flatMap(
      (value) =>
        clean(value).toLowerCase().match(TOKEN_RE) ?? [],
    ),
  );
}

function actionTerms(values: readonly string[]): string[] {
  return unique(
    values.flatMap((value) =>
      clean(value)
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => ACTION_RE.test(word)),
    ),
  );
}

function stateTerms(values: readonly string[]): string[] {
  return unique(
    values.flatMap((value) =>
      clean(value)
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => STATE_RE.test(word)),
    ),
  );
}

function endpointEventId(graph: RealityGraph): string {
  const explicit = graph.events.find((event) =>
    /\b(?:left|finished|completed|returned|ended|done|fabulous|happy|resolved)\b/i.test(
      event.label,
    ),
  );

  return explicit?.id ?? graph.events[graph.events.length - 1]?.id ?? "";
}

function openingEventIds(graph: RealityGraph): string[] {
  return graph.events
    .filter((event) =>
      /\b(?:came|arrived|entered|started|began|first|at first)\b/i.test(
        event.label,
      ),
    )
    .map((event) => event.id);
}

function relationStrength(graph: RealityGraph, eventId: string): number {
  return graph.relations
    .filter(
      (relation) =>
        relation.from === eventId || relation.to === eventId,
    )
    .reduce((sum, relation) => sum + relation.strength, 0);
}

function carrierEventIds(graph: RealityGraph, endpointId: string): string[] {
  return graph.events
    .filter((event) => event.id !== endpointId)
    .map((event) => {
      const endpointSupport = graph.relations
        .filter(
          (relation) =>
            (relation.from === event.id && relation.to === endpointId) ||
            (relation.from === endpointId && relation.to === event.id),
        )
        .reduce(
          (best, relation) => Math.max(best, relation.strength),
          0,
        );

      return {
        id: event.id,
        score: endpointSupport * 0.65 + relationStrength(graph, event.id) * 0.35,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.id);
}

export function buildAuthorRealityEnvelope(input: {
  graph: RealityGraph;
  subject?: string;
}): RealityEnvelope {
  const subject = clean(input.subject);
  const eventLabels = graph.events.map((event) => event.label);
  const suppliedPhrases = unique(eventLabels);
  const suppliedEntities = unique(
    graph.events.flatMap((event) =>
      (event.entities ?? []).filter(
        (entity) =>
          !ACTION_RE.test(entity) &&
          !STATE_RE.test(entity),
      ),
    ),
  );

  /*
   * suppliedTerms is the canonical concrete vocabulary used by the Mouth.
   * It must include the explicit subject and supplied entity vocabulary, not
   * merely lexical tokens extracted from event labels.
   */
  const suppliedTerms = tokens([
    subject,
    ...eventLabels,
    ...suppliedEntities,
    ...graph.recurringSignals,
    ...graph.sensorySignals,
  ]);

  const endpointId = endpointEventId(graph);

  return {
    subject,
    events: graph.events.map((event) => ({
      id: event.id,
      label: event.label,
      sourceIds: event.sourceIds ?? [],
      entities: event.entities ?? [],
    })),
    relations: graph.relations.map((relation) => ({
      from: relation.from,
      to: relation.to,
      kind: relation.kind,
      strength: relation.strength,
    })),
    suppliedTerms,
    suppliedPhrases,
    suppliedEntities,
    suppliedActions: actionTerms(eventLabels),
    suppliedStates: stateTerms([
      ...eventLabels,
      ...graph.recurringSignals,
      ...graph.sensorySignals,
    ]),
    openingEventIds: openingEventIds(graph),
    endpointEventId: endpointId,
    carrierEventIds: carrierEventIds(graph, endpointId),
    unresolvedTensions: unique(graph.unresolvedTensions),
    recurringSignals: unique(graph.recurringSignals),
    sensorySignals: unique(graph.sensorySignals),
  };
}
