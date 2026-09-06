import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  LatentSemanticCreativeOpportunity,
  LatentSemanticMechanism,
  LatentSemanticRealizationMove,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

/**
 * UNIVERSAL METAMORPHIC RELATION SEARCH
 *
 * Finds meaningful change, contrast, recurrence, consequence,
 * recontextualization, or distinctive observation already latent in supplied
 * reality. This is lens-blind and never creates events, actors, places,
 * chronology, outcomes, or facts.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function structure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function relation(graph: RealityGraph, from: string, to: string): RealityRelation | undefined {
  return graph.relations
    .filter((item) => (item.from === from && item.to === to) || (item.from === to && item.to === from))
    .sort((a, b) => b.strength - a.strength)[0];
}

function shared(left: readonly string[], right: readonly string[]): number {
  const a = new Set(left.map((value) => clean(value).toLowerCase()).filter(Boolean));
  const b = new Set(right.map((value) => clean(value).toLowerCase()).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let count = 0;
  for (const value of a) if (b.has(value)) count += 1;
  return count / Math.max(1, Math.min(a.size, b.size));
}

function mechanismFor(kind: RealityRelation["kind"] | undefined): LatentSemanticMechanism {
  switch (kind) {
    case "changes": return "state_change";
    case "contrasts": return "contrast";
    case "repeats": return "recurrence";
    case "causes": return "consequence";
    case "recontextualizes": return "expectation_shift";
    case "converges": return "convergence";
    default: return "continuation";
  }
}

function typeFor(kind: RealityRelation["kind"] | undefined): AuthorMetamorphicRelation["type"] {
  switch (kind) {
    case "changes": return "state_polarity_turn";
    case "contrasts": return "contrast_reversal";
    case "repeats": return "callback_recontextualization";
    case "causes": return "consequence_reframe";
    case "recontextualizes": return "object_recontextualization";
    case "converges": return "convergence";
    default: return "expectation_break";
  }
}

function opportunityFor(kind: RealityRelation["kind"] | undefined): LatentSemanticCreativeOpportunity {
  switch (kind) {
    case "changes": return "status_turn";
    case "contrasts": return "contrast_reframe";
    case "repeats": return "state_to_callback";
    case "causes": return "consequence";
    case "recontextualizes": return "callback_recontextualization";
    case "converges": return "recognition";
    default: return "recognition";
  }
}

function moveFor(kind: RealityRelation["kind"] | undefined): LatentSemanticRealizationMove {
  switch (kind) {
    case "changes": return "feel_state_transition";
    case "contrasts": return "hold_contrast";
    case "repeats": return "recontextualize_callback";
    case "causes": return "land_consequence";
    case "recontextualizes": return "recontextualize_callback";
    case "converges": return "recognize";
    default: return "recognize";
  }
}

function scorePair(graph: RealityGraph, leftId: string, rightId: string, rel: RealityRelation | undefined): number {
  const left = structure(graph, leftId);
  const right = structure(graph, rightId);
  const leftEvent = event(graph, leftId);
  const rightEvent = event(graph, rightId);
  const state = left?.states?.length && right?.states?.length ? 1 - shared(left.states, right.states) : 0;
  const objects = shared(left?.objects ?? leftEvent?.entities ?? [], right?.objects ?? rightEvent?.entities ?? []);
  const actions = shared(left?.actions ?? [], right?.actions ?? []);
  const tags = shared(left?.semanticTags ?? [], right?.semanticTags ?? []);
  const recurrence = Math.max(left?.recurrenceScore ?? 0, right?.recurrenceScore ?? 0);
  const transition = Math.max(left?.transitionScore ?? 0, right?.transitionScore ?? 0);
  const salience = Math.max(left?.salienceScore ?? 0, right?.salienceScore ?? 0, leftEvent?.salient ? 1 : 0, rightEvent?.salient ? 1 : 0);
  const relationStrength = rel?.strength ?? 0;
  return metric(
    relationStrength * 0.42 + state * 0.15 + objects * 0.1 + actions * 0.07 + tags * 0.08 + recurrence * 0.08 + transition * 0.06 + salience * 0.04,
  );
}

function scoreEvent(graph: RealityGraph, id: string): number {
  const current = structure(graph, id);
  const item = event(graph, id);
  const entityRichness = Math.min(1, (item?.entities.length ?? 0) / 3);
  const sensory = Math.min(1, (graph.sensorySignals?.filter((signal) => signal.eventIds.includes(id)).length ?? 0) / 2);
  return metric(
    (current?.salienceScore ?? 0) * 0.36 +
    (current?.transitionScore ?? 0) * 0.2 +
    (current?.recurrenceScore ?? 0) * 0.16 +
    entityRichness * 0.12 +
    sensory * 0.1 +
    (item?.salient ? 1 : 0) * 0.06,
  );
}

function narrativePair(graph: RealityGraph, ids: [string, string], rel: RealityRelation | undefined): {
  before: string;
  after: string;
  feltEffect: string;
  viewerShift: string;
  languageAim: string;
} {
  const left = clean(event(graph, ids[0])?.label);
  const right = clean(event(graph, ids[1])?.label);
  switch (rel?.kind) {
    case "changes": return { before: left, after: right, feltEffect: "a supplied state gives way to another", viewerShift: "recognize the change", languageAim: "make the changed status felt" };
    case "contrasts": return { before: left, after: right, feltEffect: "two supplied states pull against each other", viewerShift: "notice the contradiction", languageAim: "hold both truths in tension" };
    case "repeats": return { before: left, after: right, feltEffect: "a supplied detail returns with accumulated meaning", viewerShift: "recognize the callback", languageAim: "let repetition become recognition" };
    case "causes": return { before: left, after: right, feltEffect: "one supplied event gives consequence to another", viewerShift: "feel the consequence land", languageAim: "make the consequence immediate" };
    case "recontextualizes": return { before: left, after: right, feltEffect: "the second supplied detail changes the reading of the first", viewerShift: "see the earlier detail differently", languageAim: "reframe without adding facts" };
    case "converges": return { before: left, after: right, feltEffect: "separate supplied details meet around a shared meaning", viewerShift: "connect the dots", languageAim: "make the connection click" };
    default: return { before: left, after: right, feltEffect: "a later supplied detail creates a new reading", viewerShift: "notice what becomes meaningful next", languageAim: "create pull through implication" };
  }
}

function eventOpportunity(graph: RealityGraph, id: string): AuthorMetamorphicRelation | undefined {
  const current = event(graph, id);
  if (!current) return undefined;
  const score = scoreEvent(graph, id);
  if (score < 0.42) return undefined;
  const label = clean(current.label);
  const structureRow = structure(graph, id);
  const sensoryCount = graph.sensorySignals?.filter((signal) => signal.eventIds.includes(id)).length ?? 0;
  const reason = structureRow?.transitionScore && structureRow.transitionScore >= 0.65
    ? "This event carries a real transition signal."
    : structureRow?.recurrenceScore && structureRow.recurrenceScore >= 0.65
      ? "This event carries a real recurrence signal."
      : sensoryCount > 0
        ? "This event has distinctive supplied sensory material."
        : current.salient
          ? "This event is explicitly salient in supplied reality."
          : "This event is unusually information-rich compared with the rest of the supplied material.";

  return {
    id: `metamorphic-event-${id}`,
    type: "expectation_break",
    mechanism: "continuation",
    evidenceEventIds: [id],
    beforeEventIds: [id],
    afterEventIds: [],
    before: label,
    after: label,
    realizationMove: "recognize",
    creativeOpportunity: "recognition",
    feltEffect: "one supplied detail deserves focused attention without requiring an invented second event",
    viewerShift: "notice the distinctive detail",
    languageAim: "make the concrete detail newly legible",
    confidence: metric(0.5 + score * 0.45),
    score: metric(score * 0.9),
    relation: undefined,
    metadata: { eventLevel: true, reason },
  } as AuthorMetamorphicRelation;
}

export function searchAuthorMetamorphicRelations(input: {
  graph: RealityGraph;
  subject?: string;
  limit?: number;
}): AuthorMetamorphicRelationSet {
  const events = input.graph.events.filter((item) => clean(item.label));
  const sourceEventIds = events.map((item) => item.id);
  const candidates: AuthorMetamorphicRelation[] = [];

  for (let i = 0; i < events.length - 1; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const left = events[i]!;
      const right = events[j]!;
      const rel = relation(input.graph, left.id, right.id);
      const leftStructure = structure(input.graph, left.id);
      const rightStructure = structure(input.graph, right.id);
      const meaningfulSupport =
        (leftStructure?.transitionScore ?? 0) >= 0.65 ||
        (rightStructure?.transitionScore ?? 0) >= 0.65 ||
        (leftStructure?.recurrenceScore ?? 0) >= 0.65 ||
        (rightStructure?.recurrenceScore ?? 0) >= 0.65 ||
        Boolean(rel && rel.strength >= 0.58) ||
        Boolean(input.graph.patterns?.some((pattern) => pattern.eventIds.includes(left.id) && pattern.eventIds.includes(right.id)));

      if (!meaningfulSupport) continue;

      const ids: [string, string] = [left.id, right.id];
      const mechanism = mechanismFor(rel?.kind);
      const type = typeFor(rel?.kind);
      const opportunity = opportunityFor(rel?.kind);
      const realizationMove = moveFor(rel?.kind);
      const narrative = narrativePair(input.graph, ids, rel);
      const score = scorePair(input.graph, left.id, right.id, rel);
      if (score < 0.42) continue;

      candidates.push({
        id: `metamorphic-${left.id}-${right.id}-${mechanism}`,
        type,
        mechanism,
        evidenceEventIds: unique(ids),
        beforeEventIds: [left.id],
        afterEventIds: [right.id],
        before: narrative.before,
        after: narrative.after,
        relation: rel ? { kind: rel.kind, fromEventId: rel.from, toEventId: rel.to } : undefined,
        realizationMove,
        creativeOpportunity: opportunity,
        feltEffect: narrative.feltEffect,
        viewerShift: narrative.viewerShift,
        languageAim: narrative.languageAim,
        confidence: metric(0.45 + score * 0.5),
        score,
      });
    }
  }

  // Sparse reality is not a failure. Promote high-information individual events
  // into observation opportunities without pretending they are relationships.
  for (const item of events) {
    const opportunity = eventOpportunity(input.graph, item.id);
    if (opportunity) candidates.push(opportunity);
  }

  const sorted = candidates
    .sort((a, b) => b.score - a.score)
    .filter((candidate, index, all) => {
      const signature = `${candidate.type}|${[...candidate.evidenceEventIds].sort().join("|")}`;
      return all.findIndex((item) => `${item.type}|${[...item.evidenceEventIds].sort().join("|")}` === signature) === index;
    })
    .slice(0, Math.max(3, Math.min(24, input.limit ?? 12)));

  return {
    version: 1,
    sourceEventIds,
    relations: sorted,
    strongestRelationId: sorted[0]?.id,
    relationCount: sorted.length,
    evidenceClosed: sorted.every((candidate) => candidate.evidenceEventIds.every((id) => sourceEventIds.includes(id))),
  };
}
