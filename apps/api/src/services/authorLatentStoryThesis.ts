/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts an already-selected LatentMovieCandidate into one compact,
 * graph-backed semantic thesis. It never creates facts or viewer prose.
 *
 * Creative compression law:
 *   DO NOT SUMMARIZE THE EVENTS.
 *   COMPRESS THE RELATIONSHIP THAT MAKES THE EVENTS FEEL DIFFERENT TOGETHER.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  LatentStoryThesis,
  ObserverExperienceObjective,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import {
  deriveSequenceBackedCreativeInterpretations,
  type CreativeInterpretation,
} from "./authorCreativeInterpretation.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function endpointId(candidate: LatentMovieCandidate): string {
  const step = candidate.trajectory[candidate.trajectory.length - 1];
  return step?.eventIds?.[step.eventIds.length - 1] ?? "";
}

function orderedIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function relationBetween(
  graph: RealityGraph,
  left: string,
  right: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === left && relation.to === right) ||
        (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function mechanismPriority(kind: CreativeInterpretation["mechanism"]): number {
  switch (kind) {
    case "recurrence": return 1;
    case "state_change": return 0.99;
    case "contrast": return 0.98;
    case "expectation_shift": return 0.96;
    case "consequence": return 0.9;
    case "convergence": return 0.58;
    case "continuation": return 0.52;
    default: return 0.4;
  }
}

function statementSpecificity(statement: string): number {
  const value = clean(statement);
  const concrete = /\b(?:bow|collar|tag|mirror|photo|picture|gift|key|keys|ring|flower|flowers|coat|dress|shirt|shoe|shoes|ticket|receipt|book|letter|phone|screen|car|room|house|home|table|door|window|box|bag|cake|towel|towels|leash)\b/i.test(value);
  const specificState = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|fierce|cool|sharp|dapper|ready)\b/i.test(value);
  const generic = /\b(?:separate|supplied|changes|converge|continuing thread|meaningful relationship|same realization|small changes in feeling)\b/i.test(value);
  return (concrete ? 0.34 : 0) + (specificState ? 0.28 : 0) + (generic ? -0.32 : 0) + Math.min(0.2, value.split(/\s+/).filter(Boolean).length / 40);
}

function interpretationScore(
  candidate: LatentMovieCandidate,
  interpretation: CreativeInterpretation,
): number {
  const ids = orderedIds(candidate);
  const evidence = interpretation.evidenceEventIds.filter((id) => ids.includes(id));
  const coverage = interpretation.evidenceEventIds.length
    ? evidence.length / interpretation.evidenceEventIds.length
    : 0;
  const positions = evidence.map((id) => ids.indexOf(id)).filter((index) => index >= 0);
  const spread = positions.length >= 2
    ? (Math.max(...positions) - Math.min(...positions)) / Math.max(1, ids.length - 1)
    : 0;
  const endpoint = endpointId(candidate);
  const endpointSupport = endpoint && evidence.includes(endpoint) ? 1 : 0;

  return interpretation.confidence * 0.3 +
    mechanismPriority(interpretation.mechanism) * 0.28 +
    statementSpecificity(interpretation.statement) * 0.2 +
    coverage * 0.12 +
    spread * 0.06 +
    endpointSupport * 0.04;
}

function strongestInterpretation(
  candidate: LatentMovieCandidate,
  interpretations: readonly CreativeInterpretation[],
): CreativeInterpretation | undefined {
  return [...interpretations]
    .map((interpretation, index) => ({
      interpretation,
      score: interpretationScore(candidate, interpretation),
      index,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.interpretation.confidence - a.interpretation.confidence ||
        b.interpretation.evidenceEventIds.length - a.interpretation.evidenceEventIds.length ||
        a.index - b.index,
    )[0]?.interpretation;
}

function strongestRelation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { relation: RealityRelation; from: string; to: string } | undefined {
  const ids = orderedIds(candidate);
  const ranked: Array<{ relation: RealityRelation; from: string; to: string }> = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (relation) ranked.push({ relation, from: ids[i]!, to: ids[j]! });
    }
  }
  return ranked.sort((a, b) => {
    const priority = (kind: RealityRelation["kind"]): number => {
      switch (kind) {
        case "recontextualizes": return 1;
        case "repeats": return 0.98;
        case "contrasts": return 0.97;
        case "changes": return 0.96;
        case "causes": return 0.94;
        case "converges": return 0.75;
        default: return 0.5;
      }
    };
    return (
      b.relation.strength * 0.72 + priority(b.relation.kind) * 0.28 -
      (a.relation.strength * 0.72 + priority(a.relation.kind) * 0.28)
    );
  })[0];
}

function buildInitialReading(candidate: LatentMovieCandidate): string {
  const first = candidate.trajectory.find((step) => step.operation === "establish");
  return clean(first?.viewerChange || candidate.evidence[0]);
}

function buildObserverExperienceObjective(
  interpretation: CreativeInterpretation | undefined,
): ObserverExperienceObjective | undefined {
  if (!interpretation) return undefined;
  const byMechanism: Record<string, ObserverExperienceObjective> = {
    recurrence: {
      objective: interpretation.statement,
      surprise: "Let the observer notice that an earlier concrete detail has returned with new importance.",
      curiosity: "Make the observer hold the earlier detail in mind without explaining why it matters.",
      attention: ["notice the detail", "let other supplied material pass", "return to the detail", "recognize the continuity"],
      landing: "Let the recurrence itself create the realization.",
      explanationForbidden: true,
    },
    state_change: {
      objective: interpretation.statement,
      surprise: "Let the observer feel the supplied before-and-after difference rather than hear a summary of it.",
      curiosity: "Make the observer notice that the subject is no longer where the story began.",
      attention: ["establish the starting state", "watch the supplied change accumulate", "delay the label", "recognize the new state"],
      landing: "Let the supplied later state answer the earlier state.",
      explanationForbidden: true,
    },
    contrast: {
      objective: interpretation.statement,
      surprise: "Hold two supplied readings together until the tension becomes visible.",
      curiosity: "Do not resolve the contrast before the supplied evidence earns it.",
      attention: ["establish one reading", "introduce the contrast", "hold both", "let recognition resolve it"],
      landing: "Let the supplied evidence determine which reading survives.",
      explanationForbidden: true,
    },
  };
  return byMechanism[interpretation.mechanism] ?? {
    objective: interpretation.statement,
    surprise: "Let the observer discover the supplied relationship without being told what it means.",
    curiosity: "Delay explanation while the supplied evidence accumulates.",
    attention: ["establish", "accumulate", "withhold", "recognize"],
    landing: "Let the supplied endpoint complete the realization.",
    explanationForbidden: true,
  };
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const interpretations = deriveSequenceBackedCreativeInterpretations(graph, candidate);
  const interpretation = strongestInterpretation(candidate, interpretations);
  const fallbackRelation = strongestRelation(graph, candidate);
  const endpoint = endpointId(candidate);

  const beforeId = interpretation?.evidenceEventIds[0] ?? fallbackRelation?.from ?? "";
  const afterId = interpretation?.evidenceEventIds[interpretation.evidenceEventIds.length - 1] ?? fallbackRelation?.to ?? endpoint;
  const semanticTurn = interpretation?.statement ||
    (fallbackRelation
      ? `${eventLabel(graph, fallbackRelation.from)} changes the reading of ${eventLabel(graph, fallbackRelation.to)} through ${fallbackRelation.relation.kind}.`
      : "");

  const carrierEventIds = unique([
    ...(interpretation?.evidenceEventIds ?? []),
  ]).filter((id) => id !== endpoint).slice(0, 2);

  const sealingEventIds = endpoint && endpoint !== beforeId && endpoint !== afterId
    ? [endpoint]
    : afterId && afterId !== beforeId
      ? [afterId]
      : [];

  const payoffDependency = endpoint
    ? afterId
      ? `The supplied ending depends on the earlier supplied relationship culminating in ${eventLabel(graph, endpoint)}.`
      : `The supplied ending is ${eventLabel(graph, endpoint)}.`
    : "";

  return {
    initialReading: buildInitialReading(candidate),
    semanticTurn,
    beforeMeaning: beforeId ? [eventLabel(graph, beforeId)].filter(Boolean) : [],
    afterMeaning: afterId ? [eventLabel(graph, afterId)].filter(Boolean) : [],
    beforeEventIds: beforeId ? [beforeId] : [],
    afterEventIds: afterId ? [afterId] : [],
    relationKind: interpretation?.mechanism,
    carrierEventIds,
    sealingEventIds,
    payoffDependency,
    counterfactualDependency: interpretation
      ? Math.min(1, interpretation.evidenceEventIds.length / Math.max(2, orderedIds(candidate).length))
      : 0,
    observerExperience: buildObserverExperienceObjective(interpretation),
  };
}
