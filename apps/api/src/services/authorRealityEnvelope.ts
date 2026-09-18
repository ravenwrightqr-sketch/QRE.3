import type {
  RealityEntityContinuity,
  RealityEventStructure,
  RealityGraph,
  RealityPattern,
  RealityRelation,
} from "@qre/contracts";

export type RealityEnvelopeEvent = {
  id: string;
  label: string;
  sourceIds: string[];
  entities: string[];
  place?: string;
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
  suppliedParticipants: string[];
  suppliedPlaces: string[];
  suppliedActions: string[];
  suppliedStates: string[];
  openingEventIds: string[];
  endpointEventId: string;
  carrierEventIds: string[];
  unresolvedTensions: string[];
  recurringSignals: string[];
  sensorySignals: string[];
  eventStructure: RealityEventStructure[];
  entityContinuity: RealityEntityContinuity[];
  patterns: RealityPattern[];
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const TOKEN_RE = /[a-z0-9]+(?:['-][a-z0-9]+)*/gi;

const ACTION_RE =
  /\b(?:arrive|arrived|come|came|leave|left|finish|finished|complete|completed|steal|stole|take|took|give|gave|make|made|open|opened|close|closed|eat|ate|drink|drank|write|wrote|sign|signed|kiss|kissed|marry|married|cut|clean|cleaned|wash|washed|cook|cooked|build|built|move|moved|return|returned|run|ran|walk|walked|sit|sat|stand|stood|repair|repaired|fix|fixed|restore|restored|renew|renewed|groom|groomed|test|tested|select|selected|shape|shaped|polish|polished|deliver|delivered|welcome|welcomed|check|checked|book|booked|arrange|arranged|recommend|recommended|guide|guided|update|updated|reserve|reserved|approve|approved|work|worked|stay|stayed|pick|picked|install|installed)\b/i;

const STATE_RE =
  /\b(?:nervous|fierce|cool|happy|sad|proud|angry|afraid|scared|quiet|calm|excited|tired|ready|beautiful|fabulous|safe|finished|done|married|connected|alone|missing|lost|new|different|changed|broken|fixed|working|prepared|available|restored|renewed|clean|dirty|approved)\b/i;

const AUTHORING_DIRECTIVE =
  /^(?:(?:please\s+)?(?:make|write|tell|show|create|generate|return|preserve|keep|use|turn|do\s+not|don't|avoid|ensure|give)\b.*(?:experience|story|line|sentence|movie|film|copy|text|response|sharp|memorable|funny|comedy|horror|romance|cinematic|attention|viewer|audience)|(?:make|write|show|create|generate|turn)\s+(?:the|it|this|that)\b)/i;

function stripAuthoringDirective(value: string): string {
  const text = clean(value);
  if (!text) return "";

  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter(Boolean);

  const factual = parts.filter(
    (part) => !AUTHORING_DIRECTIVE.test(part),
  );

  return clean(factual.length ? factual.join(" ") : "");
}

function canonicalEventLabel(value: string): string {
  return stripAuthoringDirective(value);
}

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


const EXPLICIT_PARTICIPANT_PREDICATE =
  /\b(?:is|are|was|were|has|have|had|does|do|did|can|could|will|would|should|must|may|might|arrive|arrived|return|returned|came|come|left|leave|went|go|met|meet|talk|talked|spoke|said|made|gave|got|found|lost|clean|cleaned|finished|started|opened|closed|walked|ran|drove|ate|drank|called|laughed|cried|felt|became|changed|stole|took|saw|heard|smile|smiled|watch|watched|wave|waved|look|looked|approve|approved|fix|fixed|repair|repaired|groom|groomed|[a-z][a-z'’-]{2,}(?:ed|ing))\b/i;

function explicitParticipantPhrase(
  label: string,
): string {
  const text = clean(label);
  if (!text) return "";

  const match =
    EXPLICIT_PARTICIPANT_PREDICATE.exec(
      text,
    );

  if (!match || match.index <= 0) {
    return "";
  }

  const prefix = clean(
    text.slice(0, match.index),
  )
    .replace(
      /^(?:then|now|later|earlier|finally|again)\s+/i,
      "",
    )
    .replace(/[,:;]+$/g, "")
    .trim();

  if (
    !prefix ||
    prefix.split(/\s+/).length > 6
  ) {
    return "";
  }

  return prefix;
}

function endpointEventId(graph: RealityGraph): string {
  const explicit = graph.events.find((event) =>
    /\b(?:left|finished|completed|returned|ended|done|fabulous|happy|resolved|delivered|checked out)\b/i.test(
      event.label,
    ),
  );

  return explicit?.id ?? graph.events[graph.events.length - 1]?.id ?? "";
}

function openingEventIds(graph: RealityGraph): string[] {
  return graph.events
    .filter((event) =>
      /\b(?:came|arrived|entered|started|began|first|at first|checked in)\b/i.test(
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
  const events = input.graph.events
    .map((event) => ({
      ...event,
      label: canonicalEventLabel(event.label),
    }))
    .filter((event) => Boolean(event.label));

  const graph: RealityGraph = {
    ...input.graph,
    events,
  };

  const eventLabels = events.map((event) => event.label);
  const suppliedPhrases = unique(eventLabels);
  const suppliedEntities = unique(
    events.flatMap((event) =>
      (event.entities ?? []).filter(
        (entity) =>
          !ACTION_RE.test(entity) &&
          !STATE_RE.test(entity),
      ),
    ),
  );

  /*
   * Places remain a distinct kind of concrete authority.
   * A supplied place may be framed or personified metaphorically, but its
   * existence never authorizes unsupplied people who might plausibly work,
   * live, gather, own, rent, manage, or otherwise participate there.
   */
  const suppliedPlaces = unique(
    events
      .map((event) => clean(event.place))
      .filter(Boolean),
  );

  /*
   * Participant authority is stricter than lexical mention.
   * Subjects extracted from structure and explicit leading actors are factual
   * participants. Objects, destinations, venues, service types, and role
   * words elsewhere in a sentence do not become actors merely by appearing.
   */
  const suppliedParticipants = unique([
    subject,
    /*
     * Do not inherit participant authority from generic entity extraction or
     * capitalization. A venue, business, destination, object, or contextual
     * noun may be present in reality without becoming an actor.
     *
     * Participant authority comes only from the configured QRE subject or an
     * explicitly acting phrase in the supplied event wording.
     */
    ...eventLabels
      .map(explicitParticipantPhrase)
      .filter(Boolean),
  ]);

  /* suppliedTerms is the canonical concrete vocabulary used by the Mouth. */
  const suppliedTerms = tokens([
    subject,
    ...eventLabels,
    ...suppliedEntities,
    ...suppliedParticipants,
    ...suppliedPlaces,
    ...graph.recurringSignals,
    ...graph.sensorySignals,
  ]);

  const endpointId = endpointEventId(graph);

  return {
    subject,
    events: events.map((event) => ({
      id: event.id,
      label: event.label,
      sourceIds: event.sourceIds ?? [],
      entities: event.entities ?? [],
      place: clean(event.place) || undefined,
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
    suppliedParticipants,
    suppliedPlaces,
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
    eventStructure: graph.eventStructure ?? [],
    entityContinuity: graph.entityContinuity ?? [],
    patterns: graph.patterns ?? [],
  };
}