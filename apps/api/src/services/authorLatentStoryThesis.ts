/**
 * QRE LATENT STORY THESIS · CANONICAL
 *
 * Converts a selected movie into a graph-backed semantic arc. The strongest
 * earned metamorphic relation wins; generic relation narration is only used
 * when no stronger semantic opportunity exists.
 */
import type {
  LatentMovieCandidate,
  LatentSemanticCreativeOpportunity,
  LatentSemanticMechanism,
  LatentSemanticRealization,
  LatentSemanticRealizationMove,
  LatentStoryThesis,
  ObserverExperienceObjective,
  RealityGraph,
} from "@qre/contracts";
import {
  deriveSequenceBackedCreativeInterpretations,
  type CreativeInterpretation,
} from "./authorCreativeInterpretation.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function label(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function orderedIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function endpointId(candidate: LatentMovieCandidate): string {
  return candidate.trajectory[candidate.trajectory.length - 1]?.eventIds?.slice(-1)[0] ?? "";
}

function fallbackRelation(graph: RealityGraph, ids: readonly string[]) {
  let best: { from: string; to: string; kind: string; strength: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = graph.relations
        .filter((item) =>
          ["contrasts", "causes", "changes", "recontextualizes", "repeats", "converges"].includes(item.kind) &&
          ((item.from === ids[i] && item.to === ids[j]) || (item.from === ids[j] && item.to === ids[i])))
        .sort((a, b) => b.strength - a.strength)[0];
      if (relation && (!best || relation.strength > best.strength)) {
        best = { from: relation.from, to: relation.to, kind: relation.kind, strength: relation.strength };
      }
    }
  }
  return best;
}

function mechanismFor(kind: string): LatentSemanticMechanism {
  switch (kind) {
    case "contrasts": return "contrast";
    case "causes": return "consequence";
    case "changes": return "state_change";
    case "recontextualizes":
    case "repeats": return "recurrence";
    case "converges": return "convergence";
    default: return "continuation";
  }
}

function realizationMoveFor(value: string): LatentSemanticRealizationMove {
  switch (clean(value).toLowerCase()) {
    case "feel_state_transition": return "feel_state_transition";
    case "recognize_callback": return "recognize_callback";
    case "recontextualize_callback": return "recontextualize_callback";
    case "hold_contrast": return "hold_contrast";
    case "return_with_new_status": return "return_with_new_status";
    case "land_consequence": return "land_consequence";
    case "recognize": return "recognize";
    case "recontextualize": return "recontextualize_callback";
    case "status_reversal": return "hold_contrast";
    case "service_to_status": return "land_consequence";
    case "converge_details": return "recognize";
    case "defeat_expectation": return "hold_contrast";
    default: return "recognize";
  }
}

function creativeOpportunityFor(value: string): LatentSemanticCreativeOpportunity | undefined {
  const text = clean(value).toLowerCase();
  if (!text) return undefined;
  if (text.includes("callback") || text.includes("return with a changed meaning")) return "callback_recontextualization";
  if (text.includes("status") || text.includes("presentation becomes the setup") || text.includes("polished presentation")) return "status_turn";
  if (text.includes("consequence") || text.includes("service into the setup")) return "consequence";
  if (text.includes("expectation") || text.includes("contrast")) return "contrast_reframe";
  if (text.includes("collapse supplied details") || text.includes("one memorable relationship")) return "recognition";
  return "recognition";
}

function observerFor(interpretation: CreativeInterpretation | undefined): ObserverExperienceObjective | undefined {
  if (!interpretation) return undefined;
  const kind = interpretation.mechanism;
  if (kind === "contrast") {
    return {
      objective: interpretation.statement,
      surprise: "Hold the supplied contradiction until the reading flips.",
      curiosity: "What does the second detail make the first detail mean?",
      attention: ["establish", "collide", "turn", "land"],
      landing: interpretation.after || "Let the supplied contrast land.",
      explanationForbidden: true,
      feltEffect: interpretation.feltEffect,
      viewerShift: interpretation.viewerShift,
      realizationDirection: interpretation.languageAim,
    };
  }
  if (kind === "state_change") {
    return {
      objective: interpretation.statement,
      surprise: "Make the supplied state transition feel consequential.",
      curiosity: "Let the old state remain mentally present as the new state arrives.",
      attention: ["settle", "notice", "turn", "feel"],
      landing: interpretation.after || "Let the new state register.",
      explanationForbidden: true,
      feltEffect: interpretation.feltEffect,
      viewerShift: interpretation.viewerShift,
      realizationDirection: interpretation.languageAim,
    };
  }
  if (kind === "consequence") {
    return {
      objective: interpretation.statement,
      surprise: "Let the supplied outcome redefine what came before.",
      curiosity: "Why does the endpoint feel more meaningful now?",
      attention: ["establish", "accumulate", "anticipate", "land"],
      landing: interpretation.after || "Let the consequence speak.",
      explanationForbidden: true,
      feltEffect: interpretation.feltEffect,
      viewerShift: interpretation.viewerShift,
      realizationDirection: interpretation.languageAim,
    };
  }
  return {
    objective: interpretation.statement,
    surprise: "Let a familiar supplied detail acquire a second reading.",
    curiosity: "What changed about the meaning without changing the fact?",
    attention: ["establish", "accumulate", "reframe", "recognize"],
    landing: interpretation.after || "Let the changed reading land.",
    explanationForbidden: true,
    feltEffect: interpretation.feltEffect,
    viewerShift: interpretation.viewerShift,
    realizationDirection: interpretation.languageAim,
  };
}

function semanticFrom(interpretation: CreativeInterpretation | undefined): LatentSemanticRealization | undefined {
  if (!interpretation) return undefined;
  return {
    mechanism: interpretation.mechanism,
    evidenceEventIds: unique(interpretation.evidenceEventIds),
    beforeEventIds: unique(interpretation.beforeEventIds),
    afterEventIds: unique(interpretation.afterEventIds),
    before: clean(interpretation.before),
    after: clean(interpretation.after),
    subject: clean(interpretation.subject),
    relation: interpretation.relation,
    realizationMove: realizationMoveFor(interpretation.realizationMove),
    creativeOpportunity: creativeOpportunityFor(interpretation.creativeOpportunity ?? ""),
    feltEffect: clean(interpretation.feltEffect),
    viewerShift: clean(interpretation.viewerShift),
    languageAim: clean(interpretation.languageAim),
    confidence: interpretation.confidence,
  };
}

export function deriveLatentStoryThesis(graph: RealityGraph, candidate: LatentMovieCandidate): LatentStoryThesis {
  const ordered = orderedIds(candidate);
  const interpretations = deriveSequenceBackedCreativeInterpretations(graph, candidate);
  const interpretation = [...interpretations].sort((a, b) => (b.metamorphicScore ?? b.confidence) - (a.metamorphicScore ?? a.confidence))[0];
  const fallback = fallbackRelation(graph, ordered);
  const endpoint = endpointId(candidate);

  const beforeId = interpretation?.beforeEventIds[0] ?? fallback?.from ?? ordered[0] ?? "";
  const afterId = interpretation?.afterEventIds[0] ?? fallback?.to ?? endpoint;
  const evidenceIds = unique(interpretation?.evidenceEventIds ?? (fallback ? [fallback.from, fallback.to] : ordered));
  const semantic = semanticFrom(interpretation);
  const observer = observerFor(interpretation);
  const semanticTurn = clean(interpretation?.statement) || (fallback
    ? `${label(graph, fallback.from)} changes the reading of ${label(graph, fallback.to)} through ${fallback.kind}.`
    : "");

  const beforeMeaning = beforeId ? [label(graph, beforeId)].filter(Boolean) : [];
  const afterMeaning = afterId ? [label(graph, afterId)].filter(Boolean) : [];
  const carrierEventIds = evidenceIds.filter((id) => id !== beforeId && id !== afterId && id !== endpoint);
  const sealingEventIds = endpoint && endpoint !== beforeId ? [endpoint] : [];
  const payoff = label(graph, endpoint) || clean(candidate.payoff);

  return {
    initialReading: clean(candidate.trajectory[0]?.viewerChange || candidate.evidence[0]),
    semanticTurn,
    semanticRealization: semantic ?? (fallback
      ? {
          mechanism: mechanismFor(fallback.kind),
          evidenceEventIds: [fallback.from, fallback.to],
          beforeEventIds: [fallback.from],
          afterEventIds: [fallback.to],
          before: label(graph, fallback.from),
          after: label(graph, fallback.to),
          relation: { kind: fallback.kind, fromEventId: fallback.from, toEventId: fallback.to },
          realizationMove: fallback.kind === "contrasts" ? "hold_contrast" : fallback.kind === "causes" ? "land_consequence" : fallback.kind === "changes" ? "feel_state_transition" : fallback.kind === "repeats" || fallback.kind === "recontextualizes" ? "recontextualize_callback" : "recognize",
          creativeOpportunity: fallback.kind === "contrasts" ? "contrast_reframe" : fallback.kind === "causes" ? "consequence" : fallback.kind === "changes" ? "status_turn" : fallback.kind === "repeats" || fallback.kind === "recontextualizes" ? "callback_recontextualization" : "recognition",
          feltEffect: "A change in how the supplied pieces are perceived together.",
          viewerShift: `The viewer's reading moves from ${label(graph, fallback.from)} toward ${label(graph, fallback.to)}.`,
          languageAim: "Use implication, contrast, compression, or consequence rather than explanation.",
          confidence: fallback.strength,
        }
      : undefined),
    beforeMeaning,
    afterMeaning,
    beforeEventIds: beforeId ? [beforeId] : [],
    afterEventIds: afterId ? [afterId] : [],
    carrierEventIds,
    sealingEventIds,
    payoffDependency: payoff,
    counterfactualDependency: interpretation ? Math.min(1, Math.max(0, interpretation.confidence)) : 0.5,
    observerExperience: observer,
  };
}
