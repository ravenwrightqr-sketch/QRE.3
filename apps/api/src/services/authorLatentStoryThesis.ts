/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts a selected LatentMovieCandidate into a graph-backed meaning arc.
 * This layer never creates source reality. It only assigns supplied events to
 * semantic roles so realization can accumulate, imply, recontextualize, and land.
 *
 * Critical boundary:
 *   BEFORE   = supplied starting evidence
 *   CARRIER  = supplied intermediate evidence that carries unresolved meaning
 *   AFTER    = supplied endpoint / payoff evidence
 *
 * The carrier is never the payoff. Endpoint evidence never leaks backward into
 * the carrier role.
 */
import type {
  LatentMovieCandidate,
  LatentSemanticMechanism,
  LatentSemanticRealization,
  LatentStoryThesis,
  ObserverExperienceObjective,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import {
  deriveSequenceBackedCreativeInterpretations,
  type CreativeInterpretation,
} from "./authorCreativeInterpretation.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function orderedIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function endpointId(candidate: LatentMovieCandidate): string {
  const steps = candidate.trajectory;
  return steps[steps.length - 1]?.eventIds?.slice(-1)[0] ?? "";
}

function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === left && relation.to === right) ||
        (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function mechanismForRelation(kind: RealityRelation["kind"]): LatentSemanticMechanism {
  switch (kind) {
    case "repeats": return "recurrence";
    case "changes": return "state_change";
    case "contrasts": return "contrast";
    case "causes": return "consequence";
    case "converges": return "convergence";
    case "recontextualizes": return "recurrence";
    default: return "continuation";
  }
}

function moveForRelation(kind: RealityRelation["kind"]): LatentSemanticRealization["realizationMove"] {
  switch (kind) {
    case "recontextualizes":
    case "repeats": return "recontextualize_callback";
    case "changes": return "feel_state_transition";
    case "contrasts": return "hold_contrast";
    case "causes": return "land_consequence";
    default: return "recognize";
  }
}

function opportunityForRelation(kind: RealityRelation["kind"]): LatentSemanticRealization["creativeOpportunity"] {
  switch (kind) {
    case "recontextualizes":
    case "repeats": return "callback_recontextualization";
    case "changes": return "status_turn";
    case "contrasts": return "contrast_reframe";
    case "causes": return "consequence";
    default: return "recognition";
  }
}

function relationPriority(kind: RealityRelation["kind"]): number {
  switch (kind) {
    case "recontextualizes": return 1;
    case "repeats": return 0.99;
    case "contrasts": return 0.97;
    case "changes": return 0.96;
    case "causes": return 0.94;
    case "converges": return 0.75;
    default: return 0.5;
  }
}

function strongestRelation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { relation: RealityRelation; from: string; to: string } | undefined {
  const ids = orderedIds(candidate);
  const ranked: Array<{ relation: RealityRelation; from: string; to: string; score: number }> = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (!relation || ["before", "after", "involves", "belongs_to"].includes(relation.kind)) continue;
      const span = (j - i) / Math.max(1, ids.length - 1);
      ranked.push({
        relation,
        from: ids[i]!,
        to: ids[j]!,
        score: relation.strength * 0.72 + relationPriority(relation.kind) * 0.18 + span * 0.1,
      });
    }
  }
  return ranked.sort((a, b) => b.score - a.score)[0];
}

function chooseInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretations: readonly CreativeInterpretation[],
): CreativeInterpretation | undefined {
  const relation = strongestRelation(graph, candidate);
  if (relation && relation.relation.strength >= 0.72) {
    const ids = orderedIds(candidate);
    const fromIndex = ids.indexOf(relation.from);
    const toIndex = ids.indexOf(relation.to);
    const orderedFrom = fromIndex <= toIndex ? relation.from : relation.to;
    const orderedTo = fromIndex <= toIndex ? relation.to : relation.from;
    const kind = relation.relation.kind;
    return {
      statement:
        `${eventLabel(graph, orderedFrom)} changes the reading of ${eventLabel(graph, orderedTo)} through ${kind}.`,
      mechanism: mechanismForRelation(kind),
      evidenceEventIds: [orderedFrom, orderedTo],
      beforeEventIds: [orderedFrom],
      afterEventIds: [orderedTo],
      before: eventLabel(graph, orderedFrom),
      after: eventLabel(graph, orderedTo),
      subject: candidate.storyThesis?.semanticRealization?.subject,
      realizationMove: moveForRelation(kind),
      creativeOpportunity: opportunityForRelation(kind),
      confidence: Math.max(0.72, relation.relation.strength),
      relation: {
        kind,
        fromEventId: orderedFrom,
        toEventId: orderedTo,
      },
    };
  }

  return interpretations[0];
}

function attachCarrier(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretation: CreativeInterpretation | undefined,
): CreativeInterpretation | undefined {
  if (!interpretation) return undefined;

  const ids = orderedIds(candidate);
  const start = interpretation.beforeEventIds[0];
  const end = interpretation.afterEventIds[0];
  if (!start || !end) return interpretation;

  const startIndex = ids.indexOf(start);
  const endIndex = ids.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || startIndex >= endIndex) return interpretation;

  const middle = ids
    .slice(startIndex + 1, endIndex)
    .map((id) => ({ id, label: eventLabel(graph, id) }))
    .filter((item) => Boolean(item.label));

  if (!middle.length) {
    return {
      ...interpretation,
      evidenceEventIds: unique([start, end]),
      callback: undefined,
    };
  }

  const carrierIds = middle.map((item) => item.id);
  const detail = middle.map((item) => item.label).join(" | ");

  return {
    ...interpretation,
    evidenceEventIds: carrierIds,
    callback: {
      detail,
      eventIds: carrierIds,
      role: "recontextualization",
    },
    realizationMove: "recontextualize_callback",
    creativeOpportunity: "state_to_callback",
    confidence: Math.min(1, interpretation.confidence + 0.005),
  };
}

function buildObserverExperienceObjective(
  interpretation: CreativeInterpretation | undefined,
): ObserverExperienceObjective | undefined {
  if (!interpretation) return undefined;
  const objective = clean(interpretation.statement);
  switch (interpretation.mechanism) {
    case "recurrence":
      return {
        objective,
        surprise: "Let an earlier supplied detail return with changed significance.",
        curiosity: "Keep the earlier detail mentally active without explaining its importance.",
        attention: ["notice", "hold", "return", "recognize"],
        landing: "Let the recurrence create the realization.",
        explanationForbidden: true,
      };
    case "contrast":
      return {
        objective,
        surprise: "Hold two supplied readings against each other until the difference becomes visible.",
        curiosity: "Delay resolution until the supplied evidence earns it.",
        attention: ["establish", "contrast", "hold", "resolve"],
        landing: "Let the supplied contrast determine the new reading.",
        explanationForbidden: true,
      };
    default:
      return {
        objective,
        surprise: "Let later supplied evidence make an earlier detail feel different.",
        curiosity: "Preserve the gap between what is known and what it may mean.",
        attention: ["establish", "accumulate", "recontextualize", "recognize"],
        landing: "Let the supplied endpoint close the open meaning.",
        explanationForbidden: true,
      };
  }
}

function buildSemanticRealization(
  graph: RealityGraph,
  interpretation: CreativeInterpretation | undefined,
  fallback: { relation: RealityRelation; from: string; to: string } | undefined,
): LatentSemanticRealization | undefined {
  if (!interpretation && !fallback) return undefined;

  if (interpretation) {
    return {
      mechanism: interpretation.mechanism,
      evidenceEventIds: unique(interpretation.evidenceEventIds),
      beforeEventIds: unique(interpretation.beforeEventIds),
      afterEventIds: unique(interpretation.afterEventIds),
      before: clean(interpretation.before),
      after: clean(interpretation.after),
      subject: clean(interpretation.subject),
      callback: interpretation.callback
        ? {
            detail: clean(interpretation.callback.detail),
            eventIds: unique(interpretation.callback.eventIds),
            role: interpretation.callback.role,
          }
        : undefined,
      relation: interpretation.relation,
      realizationMove: interpretation.realizationMove,
      creativeOpportunity: interpretation.creativeOpportunity,
      confidence: interpretation.confidence,
    };
  }

  const kind = fallback!.relation.kind;
  return {
    mechanism: mechanismForRelation(kind),
    evidenceEventIds: [fallback!.from, fallback!.to],
    beforeEventIds: [fallback!.from],
    afterEventIds: [fallback!.to],
    before: eventLabel(graph, fallback!.from),
    after: eventLabel(graph, fallback!.to),
    relation: { kind, fromEventId: fallback!.from, toEventId: fallback!.to },
    realizationMove: moveForRelation(kind),
    creativeOpportunity: opportunityForRelation(kind),
    confidence: fallback!.relation.strength,
  };
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const interpretations = deriveSequenceBackedCreativeInterpretations(graph, candidate);
  const fallbackRelation = strongestRelation(graph, candidate);
  const selected = chooseInterpretation(graph, candidate, interpretations);
  const interpretation = attachCarrier(graph, candidate, selected);
  const endpoint = endpointId(candidate);
  const beforeId = interpretation?.beforeEventIds[0] ?? fallbackRelation?.from ?? "";
  const afterId = interpretation?.afterEventIds[0] ?? fallbackRelation?.to ?? endpoint;
  const ordered = orderedIds(candidate);
  const beforeIndex = ordered.indexOf(beforeId);
  const afterIndex = ordered.indexOf(afterId);
  const middleIds = beforeIndex >= 0 && afterIndex > beforeIndex
    ? ordered.slice(beforeIndex + 1, afterIndex)
    : [];
  const carrierEventIds = unique(
    interpretation?.callback?.eventIds?.length
      ? interpretation.callback.eventIds
      : middleIds,
  ).filter((id) => id !== beforeId && id !== afterId && id !== endpoint);

  const sealingEventIds = endpoint && endpoint !== beforeId && endpoint !== afterId
    ? [endpoint]
    : afterId && afterId !== beforeId
      ? [afterId]
      : [];

  const semanticTurn = interpretation?.statement ??
    (fallbackRelation
      ? `${eventLabel(graph, fallbackRelation.from)} changes the reading of ${eventLabel(graph, fallbackRelation.to)} through ${fallbackRelation.relation.kind}.`
      : "");

  const semanticRealization = buildSemanticRealization(graph, interpretation, fallbackRelation);
  const payoff = eventLabel(graph, endpoint) || candidate.payoff;
  const payoffDependency = afterId && payoff
    ? `The supplied ending lands after the earlier evidence has accumulated: ${payoff}.`
    : payoff;

  return {
    initialReading: clean(candidate.trajectory[0]?.viewerChange || candidate.evidence[0]),
    semanticTurn,
    semanticRealization,
    beforeMeaning: beforeId ? [eventLabel(graph, beforeId)].filter(Boolean) : [],
    afterMeaning: afterId ? [eventLabel(graph, afterId)].filter(Boolean) : [],
    beforeEventIds: beforeId ? [beforeId] : [],
    afterEventIds: afterId ? [afterId] : [],
    relationKind: interpretation?.mechanism,
    carrierEventIds,
    sealingEventIds,
    payoffDependency,
    counterfactualDependency: semanticRealization
      ? Math.min(1, (carrierEventIds.length + 2) / Math.max(2, ordered.length))
      : 0,
    observerExperience: buildObserverExperienceObjective(interpretation),
  };
}
