/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts a selected LatentMovieCandidate into a graph-backed meaning arc.
 * This layer never creates source reality. It only assigns supplied events to
 * semantic roles so realization can accumulate, imply, recontextualize, and land.
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
  return candidate.trajectory[candidate.trajectory.length - 1]?.eventIds?.slice(-1)[0] ?? "";
}
function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter((r) => ((r.from === left && r.to === right) || (r.from === right && r.to === left)))
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

function strongestRelation(graph: RealityGraph, candidate: LatentMovieCandidate): { relation: RealityRelation; from: string; to: string } | undefined {
  const ids = orderedIds(candidate);
  const ranked: Array<{ relation: RealityRelation; from: string; to: string; score: number }> = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (!relation || ["before", "after", "involves", "belongs_to"].includes(relation.kind)) continue;
      const span = (j - i) / Math.max(1, ids.length - 1);
      ranked.push({ relation, from: ids[i]!, to: ids[j]!, score: relation.strength * 0.72 + span * 0.1 });
    }
  }
  return ranked.sort((a, b) => b.score - a.score)[0];
}

function chooseInterpretation(graph: RealityGraph, candidate: LatentMovieCandidate, interpretations: readonly CreativeInterpretation[]): CreativeInterpretation | undefined {
  const relation = strongestRelation(graph, candidate);
  if (!relation || relation.relation.strength < 0.72) return interpretations[0];
  const ids = orderedIds(candidate);
  const fromIndex = ids.indexOf(relation.from);
  const toIndex = ids.indexOf(relation.to);
  const orderedFrom = fromIndex <= toIndex ? relation.from : relation.to;
  const orderedTo = fromIndex <= toIndex ? relation.to : relation.from;
  return {
    statement: `${eventLabel(graph, orderedFrom)} changes the reading of ${eventLabel(graph, orderedTo)} through ${relation.relation.kind}.`,
    mechanism: mechanismForRelation(relation.relation.kind),
    evidenceEventIds: [orderedFrom, orderedTo],
    beforeEventIds: [orderedFrom],
    afterEventIds: [orderedTo],
    before: eventLabel(graph, orderedFrom),
    after: eventLabel(graph, orderedTo),
    subject: candidate.storyThesis?.semanticRealization?.subject,
    realizationMove: relation.relation.kind === "contrasts" ? "hold_contrast" : relation.relation.kind === "changes" ? "feel_state_transition" : relation.relation.kind === "causes" ? "land_consequence" : "recontextualize_callback",
    creativeOpportunity: relation.relation.kind === "contrasts" ? "contrast_reframe" : relation.relation.kind === "changes" ? "status_turn" : relation.relation.kind === "causes" ? "consequence" : "callback_recontextualization",
    confidence: Math.max(0.72, relation.relation.strength),
    relation: { kind: relation.relation.kind, fromEventId: orderedFrom, toEventId: orderedTo },
  };
}

function attachCarrier(graph: RealityGraph, candidate: LatentMovieCandidate, interpretation: CreativeInterpretation | undefined): CreativeInterpretation | undefined {
  if (!interpretation) return undefined;
  const ids = orderedIds(candidate);
  const start = interpretation.beforeEventIds[0];
  const end = interpretation.afterEventIds[0];
  if (!start || !end) return interpretation;
  const startIndex = ids.indexOf(start);
  const endIndex = ids.indexOf(end);
  if (startIndex < 0 || endIndex <= startIndex) return interpretation;
  const middle = ids.slice(startIndex + 1, endIndex).filter((id) => Boolean(eventLabel(graph, id)));
  if (!middle.length) return { ...interpretation, evidenceEventIds: unique([start, end]), callback: undefined };
  return {
    ...interpretation,
    evidenceEventIds: middle,
    callback: { detail: middle.map((id) => eventLabel(graph, id)).join(" | "), eventIds: middle, role: "recontextualization" },
    realizationMove: "recontextualize_callback",
    creativeOpportunity: "state_to_callback",
  };
}

function buildObserverExperienceObjective(interpretation: CreativeInterpretation | undefined): ObserverExperienceObjective | undefined {
  if (!interpretation) return undefined;
  const before = clean(interpretation.before);
  const after = clean(interpretation.after);
  const pair = before && after ? `from “${before}” toward “${after}”` : "from what was established toward what it becomes";
  switch (interpretation.mechanism) {
    case "contrast":
      return {
        objective: clean(interpretation.statement),
        surprise: "Hold two supplied readings against each other until the difference becomes visible.",
        curiosity: "Delay resolution until the supplied evidence earns it.",
        attention: ["establish", "contrast", "hold", "resolve"],
        landing: "Let the supplied contrast determine the new reading.",
        explanationForbidden: true,
        feltEffect: "A clean jolt from one reading into its unexpected partner.",
        viewerShift: `The viewer feels the collision ${pair}.`,
        realizationDirection: "Expose the contrast with as few words as possible; let juxtaposition do the work.",
      };
    case "state_change":
      return {
        objective: clean(interpretation.statement),
        surprise: "Make the supplied state change perceptible without narrating every transition step.",
        curiosity: "Let the old state remain mentally present as the new state arrives.",
        attention: ["settle", "notice", "turn", "feel"],
        landing: "Let the state change register as a felt turn.",
        explanationForbidden: true,
        feltEffect: "A felt turn: the mood, status, or possibility is no longer what it was.",
        viewerShift: `The viewer experiences the movement ${pair}.`,
        realizationDirection: "Compress the transition until the new state feels inevitable or surprising.",
      };
    case "consequence":
      return {
        objective: clean(interpretation.statement),
        surprise: "Let the supplied consequence feel earned by what came before.",
        curiosity: "Keep the result suspended until the preceding evidence makes it land.",
        attention: ["establish", "accumulate", "anticipate", "land"],
        landing: "Let the consequence speak more loudly than the explanation.",
        explanationForbidden: true,
        feltEffect: "A satisfying click of consequence: the endpoint suddenly feels right.",
        viewerShift: `The viewer feels why the endpoint matters ${pair}.`,
        realizationDirection: "State less; make the consequence feel inevitable, ironic, or earned.",
      };
    default:
      return {
        objective: clean(interpretation.statement),
        surprise: "Let later supplied evidence make an earlier detail feel different.",
        curiosity: "Preserve the gap between what is known and what it may mean.",
        attention: ["establish", "accumulate", "recontextualize", "recognize"],
        landing: "Let the supplied endpoint close the open meaning.",
        explanationForbidden: true,
        feltEffect: "A moment of recognition in which the pieces suddenly belong together.",
        viewerShift: `The viewer’s interpretation moves ${pair}.`,
        realizationDirection: "Create the click through implication, compression, collision, or a restrained reframe.",
      };
  }
}

function buildSemanticRealization(graph: RealityGraph, interpretation: CreativeInterpretation | undefined, fallback: { relation: RealityRelation; from: string; to: string } | undefined): LatentSemanticRealization | undefined {
  if (!interpretation && !fallback) return undefined;
  if (interpretation) {
    const observer = buildObserverExperienceObjective(interpretation);
    return {
      mechanism: interpretation.mechanism,
      evidenceEventIds: unique(interpretation.evidenceEventIds),
      beforeEventIds: unique(interpretation.beforeEventIds),
      afterEventIds: unique(interpretation.afterEventIds),
      before: clean(interpretation.before),
      after: clean(interpretation.after),
      subject: clean(interpretation.subject),
      callback: interpretation.callback ? { detail: clean(interpretation.callback.detail), eventIds: unique(interpretation.callback.eventIds), role: interpretation.callback.role } : undefined,
      relation: interpretation.relation,
      realizationMove: interpretation.realizationMove,
      creativeOpportunity: interpretation.creativeOpportunity,
      feltEffect: observer?.feltEffect,
      viewerShift: observer?.viewerShift,
      languageAim: observer?.realizationDirection,
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
    realizationMove: kind === "contrasts" ? "hold_contrast" : kind === "changes" ? "feel_state_transition" : kind === "causes" ? "land_consequence" : "recognize",
    creativeOpportunity: kind === "contrasts" ? "contrast_reframe" : kind === "changes" ? "status_turn" : kind === "causes" ? "consequence" : "recognition",
    feltEffect: "A change in how the supplied pieces are perceived together.",
    viewerShift: `The viewer’s reading moves from “${eventLabel(graph, fallback!.from)}” toward “${eventLabel(graph, fallback!.to)}”.`,
    languageAim: "Express the relationship through implication, compression, contrast, or consequence rather than explanation.",
    confidence: fallback!.relation.strength,
  };
}

export function deriveLatentStoryThesis(graph: RealityGraph, candidate: LatentMovieCandidate): LatentStoryThesis {
  const interpretations = deriveSequenceBackedCreativeInterpretations(graph, candidate);
  const fallbackRelation = strongestRelation(graph, candidate);
  const interpretation = attachCarrier(graph, candidate, chooseInterpretation(graph, candidate, interpretations));
  const endpoint = endpointId(candidate);
  const beforeId = interpretation?.beforeEventIds[0] ?? fallbackRelation?.from ?? "";
  const afterId = interpretation?.afterEventIds[0] ?? fallbackRelation?.to ?? endpoint;
  const ordered = orderedIds(candidate);
  const beforeIndex = ordered.indexOf(beforeId);
  const afterIndex = ordered.indexOf(afterId);
  const middleIds = beforeIndex >= 0 && afterIndex > beforeIndex ? ordered.slice(beforeIndex + 1, afterIndex) : [];
  const carrierEventIds = unique(interpretation?.callback?.eventIds?.length ? interpretation.callback.eventIds : middleIds).filter((id) => id !== beforeId && id !== afterId && id !== endpoint);
  const sealingEventIds = endpoint && endpoint !== beforeId && endpoint !== afterId ? [endpoint] : afterId && afterId !== beforeId ? [afterId] : [];
  const semanticTurn = interpretation?.statement ?? (fallbackRelation ? `${eventLabel(graph, fallbackRelation.from)} changes the reading of ${eventLabel(graph, fallbackRelation.to)} through ${fallbackRelation.relation.kind}.` : "");
  const semanticRealization = buildSemanticRealization(graph, interpretation, fallbackRelation);
  const payoff = eventLabel(graph, endpoint) || candidate.payoff;
  const payoffDependency = afterId && payoff ? `The supplied ending lands after the earlier evidence has accumulated: ${payoff}.` : payoff;
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
    counterfactualDependency: semanticRealization ? Math.min(1, (carrierEventIds.length + 2) / Math.max(2, ordered.length)) : 0,
    observerExperience: buildObserverExperienceObjective(interpretation),
  };
}
