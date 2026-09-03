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
  eventStructure: RealityEventStructure[];
  entityContinuity: RealityEntityContinuity[];
  patterns: RealityPattern[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const TOKEN_RE = /[a-z0-9]+(?:['-][a-z0-9]+)*/gi;

function stripAuthoringDirective(value: string): string {
  const text = clean(value);
  if (!text) return "";
  const parts = text.split(/(?<=[.!?])\s+/).map(clean).filter(Boolean);
  const factual = parts.filter((part) => !/^(?:(?:please\s+)?(?:make|write|tell|show|create|generate|return|preserve|keep|use|turn|do\s+not|don't|avoid|ensure|give)\b.*(?:experience|story|line|sentence|movie|film|copy|text|response|sharp|memorable|funny|comedy|horror|romance|cinematic|attention|viewer|audience)|(?:make|write|show|create|generate|turn)\s+(?:the|it|this|that)\b)/i.test(part));
  return clean(factual.length ? factual.join(" ") : "");
}
function canonicalEventLabel(value: string): string { return stripAuthoringDirective(value); }
function tokens(values: readonly string[]): string[] {
  return unique(values.flatMap((value) => clean(value).toLowerCase().match(TOKEN_RE) ?? []));
}
function termsForStructure(graph: RealityGraph, selector: "actions" | "states"): string[] {
  return unique((graph.eventStructure ?? []).flatMap((item) => item[selector] ?? []));
}
function endpointEventId(graph: RealityGraph): string {
  return graph.events[graph.events.length - 1]?.id ?? "";
}
function openingEventIds(graph: RealityGraph): string[] {
  const first = graph.events[0]?.id;
  return first ? [first] : [];
}
function relationStrength(graph: RealityGraph, eventId: string): number {
  return graph.relations.filter((relation) => relation.from === eventId || relation.to === eventId).reduce((sum, relation) => sum + relation.strength, 0);
}
function carrierEventIds(graph: RealityGraph, endpointId: string): string[] {
  return graph.events
    .filter((event) => event.id !== endpointId)
    .map((event) => {
      const endpointSupport = graph.relations
        .filter((relation) => (relation.from === event.id && relation.to === endpointId) || (relation.from === endpointId && relation.to === event.id))
        .reduce((best, relation) => Math.max(best, relation.strength), 0);
      return { id: event.id, score: endpointSupport * 0.65 + relationStrength(graph, event.id) * 0.35 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.id);
}

export function buildAuthorRealityEnvelope(input: { graph: RealityGraph; subject?: string }): RealityEnvelope {
  const subject = clean(input.subject);
  const events = input.graph.events
    .map((event) => ({ ...event, label: canonicalEventLabel(event.label) }))
    .filter((event) => Boolean(event.label));
  const graph: RealityGraph = { ...input.graph, events };
  const eventLabels = events.map((event) => event.label);
  const structures = graph.eventStructure ?? [];
  const suppliedPhrases = unique(eventLabels);
  const suppliedActions = termsForStructure(graph, "actions");
  const suppliedStates = termsForStructure(graph, "states");
  const structuralEntities = unique(structures.flatMap((item) => [...item.subjects, ...item.objects]));
  const eventEntities = unique(events.flatMap((event) => event.entities ?? []));
  const suppliedEntities = unique([...structuralEntities, ...eventEntities]).filter((value) => !suppliedActions.includes(value) && !suppliedStates.includes(value));
  const suppliedTerms = tokens([
    subject,
    ...eventLabels,
    ...suppliedEntities,
    ...suppliedActions,
    ...suppliedStates,
    ...graph.recurringSignals,
    ...graph.sensorySignals,
  ]);
  const endpointId = endpointEventId(graph);

  return {
    subject,
    events: events.map((event) => ({ id: event.id, label: event.label, sourceIds: event.sourceIds ?? [], entities: event.entities ?? [] })),
    relations: graph.relations.map((relation) => ({ from: relation.from, to: relation.to, kind: relation.kind, strength: relation.strength })),
    suppliedTerms,
    suppliedPhrases,
    suppliedEntities,
    suppliedActions,
    suppliedStates,
    openingEventIds: openingEventIds(graph),
    endpointEventId: endpointId,
    carrierEventIds: carrierEventIds(graph, endpointId),
    unresolvedTensions: unique(graph.unresolvedTensions),
    recurringSignals: unique(graph.recurringSignals),
    sensorySignals: unique(graph.sensorySignals),
    eventStructure: structures,
    entityContinuity: graph.entityContinuity ?? [],
    patterns: graph.patterns ?? [],
  };
}
