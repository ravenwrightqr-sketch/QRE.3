import type {
  AuthorMetamorphicRelation,
  AuthorMetamorphicRelationSet,
  SemanticMechanism,
} from "@qre/contracts";
import type { RealityEvent, RealityGraph, RealityRelation } from "@qre/contracts";

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const words = (value: string): Set<string> =>
  new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));

function overlap(a: string, b: string): number {
  const first = words(a);
  const second = words(b);
  let shared = 0;
  first.forEach((word) => {
    if (second.has(word)) shared += 1;
  });
  return shared / Math.max(1, Math.min(first.size, second.size));
}

function mechanismFor(relation: RealityRelation | undefined, before: RealityEvent, after: RealityEvent): SemanticMechanism {
  switch (relation?.kind) {
    case "changes":
      return "state_change";
    case "contrasts":
      return "contrast";
    case "causes":
      return "consequence";
    case "repeats":
      return "recurrence";
    case "converges":
      return "convergence";
    case "recontextualizes":
      return "recurrence";
    case "before":
    case "after":
      return "expectation_shift";
    default:
      if (/\b(?:but|however|instead|unlike|except|although|yet)\b/i.test(after.label)) return "contrast";
      if (/\b(?:because|therefore|leads to|causes|resulted|which means)\b/i.test(after.label)) return "consequence";
      if (/\b(?:again|every|always|usually|repeat|recurring)\b/i.test(after.label)) return "recurrence";
      return overlap(before.label, after.label) >= 0.5 ? "recurrence" : "expectation_shift";
  }
}

function classify(mechanism: SemanticMechanism): {
  type: AuthorMetamorphicRelation["type"];
  realizationMove: AuthorMetamorphicRelation["realizationMove"];
  creativeOpportunity: AuthorMetamorphicRelation["creativeOpportunity"];
} {
  switch (mechanism) {
    case "contrast":
      return { type: "contrast_reversal", realizationMove: "hold_contrast", creativeOpportunity: "contrast_reframe" };
    case "recurrence":
      return { type: "callback_recontextualization", realizationMove: "recontextualize_callback", creativeOpportunity: "callback_recontextualization" };
    case "consequence":
      return { type: "consequence_reframe", realizationMove: "land_consequence", creativeOpportunity: "consequence" };
    case "state_change":
      return { type: "state_polarity_turn", realizationMove: "feel_state_transition", creativeOpportunity: "status_turn" };
    case "convergence":
      return { type: "convergence", realizationMove: "recognize_callback", creativeOpportunity: "recognition" };
    default:
      return { type: "expectation_break", realizationMove: "feel_state_transition", creativeOpportunity: "status_turn" };
  }
}

function relationScore(
  graph: RealityGraph,
  before: RealityEvent,
  after: RealityEvent,
  relation: RealityRelation | undefined,
): number {
  const beforeStructure = graph.eventStructure?.find((structure) => structure.eventId === before.id);
  const afterStructure = graph.eventStructure?.find((structure) => structure.eventId === after.id);
  const sharedEntities = before.entities.filter((entity) =>
    after.entities.some((value) => value.toLowerCase() === entity.toLowerCase()),
  ).length;
  const lexical = overlap(before.label, after.label);
  const salience = ((beforeStructure?.salienceScore ?? 0.5) + (afterStructure?.salienceScore ?? 0.5)) / 2;
  const recurrence = Math.max(beforeStructure?.recurrenceScore ?? 0, afterStructure?.recurrenceScore ?? 0);
  const anomaly = Math.max(beforeStructure?.anomalyScore ?? 0, afterStructure?.anomalyScore ?? 0);
  return Math.min(
    1,
    0.12 +
      (relation?.strength ?? 0) * 0.34 +
      Math.min(0.18, sharedEntities * 0.06) +
      lexical * 0.12 +
      salience * 0.1 +
      recurrence * 0.08 +
      anomaly * 0.08,
  );
}

export function searchAuthorMetamorphicRelations(graph: RealityGraph): AuthorMetamorphicRelationSet {
  const events = graph.events.filter((event) => Boolean(clean(event.label)));
  const relations: AuthorMetamorphicRelation[] = [];
  const relationMap = new Map<string, RealityRelation>();
  for (const relation of graph.relations) {
    relationMap.set(`${relation.from}|${relation.to}|${relation.kind}`, relation);
  }

  for (let index = 0; index < events.length; index += 1) {
    for (let target = index + 1; target < events.length; target += 1) {
      const before = events[index];
      const after = events[target];
      const candidates = [
        relationMap.get(`${before.id}|${after.id}|changes`),
        relationMap.get(`${before.id}|${after.id}|contrasts`),
        relationMap.get(`${before.id}|${after.id}|causes`),
        relationMap.get(`${before.id}|${after.id}|repeats`),
        relationMap.get(`${before.id}|${after.id}|converges`),
        relationMap.get(`${before.id}|${after.id}|recontextualizes`),
        relationMap.get(`${before.id}|${after.id}|before`),
      ].filter(Boolean) as RealityRelation[];
      const temporal = candidates[0] ?? graph.relations.find((relation) =>
        relation.from === before.id && relation.to === after.id,
      );
      const score = relationScore(graph, before, after, temporal);
      if (score < 0.48) continue;

      const mechanism = mechanismFor(temporal, before, after);
      const classification = classify(mechanism);
      const sharedEntities = before.entities.filter((entity) =>
        after.entities.some((value) => value.toLowerCase() === entity.toLowerCase()),
      );
      const feltEffect =
        mechanism === "contrast" ? "expectation tension" :
        mechanism === "recurrence" ? "recognition and changing meaning" :
        mechanism === "consequence" ? "inevitability" :
        mechanism === "state_change" ? "a visible status shift" :
        mechanism === "convergence" ? "a hidden connection becoming legible" :
        "an expectation becoming unstable";
      const viewerShift =
        mechanism === "contrast" ? "reconsider what the first event seemed to mean" :
        mechanism === "recurrence" ? "recognize that the earlier event now matters again" :
        mechanism === "consequence" ? "understand why the later state follows from the earlier one" :
        mechanism === "state_change" ? "notice that the subject is no longer in the same state" :
        "notice the relationship connecting the events";
      const languageAim =
        mechanism === "contrast" ? "make the difference collide" :
        mechanism === "recurrence" ? "make return alter meaning" :
        mechanism === "consequence" ? "make the dependency land" :
        "make the relationship become newly visible";

      relations.push({
        id: `meta-${index + 1}-${target + 1}-${mechanism}`,
        type: classification.type,
        mechanism,
        evidenceEventIds: [before.id, after.id],
        beforeEventIds: [before.id],
        afterEventIds: [after.id],
        before: before.label,
        after: after.label,
        relation: {
          kind: temporal?.kind ?? "semantic",
          fromEventId: before.id,
          toEventId: after.id,
        },
        realizationMove: classification.realizationMove,
        creativeOpportunity: classification.creativeOpportunity,
        feltEffect,
        viewerShift,
        languageAim,
        confidence: Math.min(0.98, 0.55 + score * 0.4),
        score: Math.min(1, score + (sharedEntities.length ? 0.04 : 0)),
      });
    }
  }

  relations.sort((first, second) => second.score - first.score);
  const deduped = relations.filter((relation, index, values) =>
    values.findIndex((other) =>
      other.mechanism === relation.mechanism &&
      other.beforeEventIds[0] === relation.beforeEventIds[0] &&
      other.afterEventIds[0] === relation.afterEventIds[0],
    ) === index,
  );

  return {
    version: 1,
    sourceEventIds: events.map((event) => event.id),
    relations: deduped.slice(0, 32),
    strongestRelationId: deduped[0]?.id,
    relationCount: deduped.length,
    evidenceClosed: deduped.every((relation) =>
      relation.evidenceEventIds.every((id) => events.some((event) => event.id === id)),
    ),
  };
}
