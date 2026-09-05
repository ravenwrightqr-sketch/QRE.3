import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  LatentStoryThesis,
  RealityGraph,
} from "@qre/contracts";
import {
  discoverSatanicoInference,
  satanicoObserverObjective,
  scoreSatanicoCandidate,
} from "./authorSatanicoInference.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function label(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((event) => event.id === id);
}

function pairRelation(graph: RealityGraph, left: string, right: string) {
  return graph.relations
    .filter((item) => (item.from === left && item.to === right) || (item.from === right && item.to === left))
    .sort((a, b) => b.strength - a.strength)[0];
}

function operation(kind?: string): LatentMovieTrajectoryStep["operation"] {
  switch (kind) {
    case "contrasts": return "contrast";
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    case "causes": return "consequence";
    case "converges": return "converge";
    case "changes": return "reveal";
    default: return "reveal";
  }
}

function question(kind?: string): string {
  switch (kind) {
    case "contrasts": return "What changed the reading?";
    case "recontextualizes": return "What becomes newly meaningful?";
    case "repeats": return "Why does this detail return?";
    case "converges": return "What do these details reveal together?";
    case "causes": return "What follows from this?";
    default: return "What is becoming noticeable?";
  }
}

function ordered(graph: RealityGraph, ids: readonly string[]): string[] {
  return unique(ids).sort((a, b) => position(graph, a) - position(graph, b));
}

function storyThesisFor(graph: RealityGraph, relation: ReturnType<typeof discoverSatanicoInference>["strongest"]): LatentStoryThesis | undefined {
  if (!relation) return undefined;
  const result = discoverSatanicoInference(graph, undefined, 1);
  const observerExperience = satanicoObserverObjective({
    ...result,
    strongest: relation,
    relations: { ...result.relations, relations: [relation], strongestRelationId: relation.id, relationCount: 1 },
  });
  return {
    initialReading: relation.before,
    semanticTurn: relation.after,
    semanticRealization: {
      mechanism: relation.mechanism,
      evidenceEventIds: relation.evidenceEventIds,
      beforeEventIds: relation.beforeEventIds,
      afterEventIds: relation.afterEventIds,
      before: relation.before,
      after: relation.after,
      relation: relation.relation,
      realizationMove: relation.realizationMove,
      creativeOpportunity: relation.creativeOpportunity,
      feltEffect: relation.feltEffect,
      viewerShift: relation.viewerShift,
      languageAim: relation.languageAim,
      confidence: relation.confidence,
    },
    beforeMeaning: [relation.before],
    afterMeaning: [relation.after],
    beforeEventIds: relation.beforeEventIds,
    afterEventIds: relation.afterEventIds,
    relationKind: relation.relation?.kind ?? relation.type,
    carrierEventIds: relation.evidenceEventIds,
    sealingEventIds: relation.afterEventIds,
    payoffDependency: "Let the supplied evidence make the interpretation available without stating it.",
    counterfactualDependency: metric(1 - relation.confidence),
    observerExperience,
  };
}

function trajectory(graph: RealityGraph, ids: readonly string[]): LatentMovieTrajectoryStep[] {
  const events = ordered(graph, ids);
  return events.map((id, index) => {
    const previous = events[index - 1];
    const rel = previous ? pairRelation(graph, previous, id) : undefined;
    const final = index === events.length - 1;
    return {
      order: index + 1,
      operation: final ? "payoff" : operation(rel?.kind),
      eventIds: previous && rel?.kind === "recontextualizes" ? [previous, id] : [id],
      viewerChange: label(graph, id),
      nextQuestion: final ? "What does the observer infer from the whole pattern?" : question(rel?.kind),
    };
  });
}

function satanicoCandidate(
  graph: RealityGraph,
  lens: string | undefined,
  inference: ReturnType<typeof discoverSatanicoInference>,
  index: number,
): LatentMovieCandidate | undefined {
  const relation = inference.relations.relations[index];
  if (!relation) return undefined;
  const ids = ordered(graph, relation.evidenceEventIds);
  if (!ids.length) return undefined;
  const satanicoScore = scoreSatanicoCandidate(ids, inference);
  const grounding = ids.every((id) => graph.events.some((event) => event.id === id)) ? 1 : 0;
  const trajectorySteps = trajectory(graph, ids);
  const thesis = storyThesisFor(graph, relation);
  const latent = inference.observerInferencePotential;
  return {
    id: `movie-satanico-${index + 1}`,
    lens: clean(lens) || "NONE",
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: unique([relation.relation?.kind, relation.type].filter(Boolean) as string[]),
    trajectory: trajectorySteps,
    payoff: label(graph, ids[ids.length - 1]!) || "supplied reality",
    unresolvedQuestion: "What will the observer infer when these supplied details are held together?",
    evidence: ids.map((id) => label(graph, id)).filter(Boolean),
    hypothesis: [
      `Satanico relationship: ${relation.type}`,
      `Latent read: ${relation.after}`,
      `Observer inference potential: ${latent}`,
      "Do not state the latent conclusion when the observer can reasonably discover it.",
    ],
    storyThesis: thesis,
    truthRisk: metric(1 - grounding),
    novelty: metric(0.4 + relation.score * 0.6),
    specificity: metric(0.4 + Math.min(0.5, ids.length * 0.1)),
    informationValue: metric(0.4 + relation.confidence * 0.5),
    uncertainty: inference.hypothesisSpace,
    attentionPotential: metric(0.35 + satanicoScore * 0.65),
    consequencePotential: metric(0.35 + relation.confidence * 0.55),
    callbackPotential: metric(relation.type.includes("callback") || relation.type.includes("invariant") ? 0.92 : 0.2),
    compressionPotential: metric(0.5 + latent * 0.45),
    repetitionRisk: 0,
    distinctiveness: metric(0.45 + relation.score * 0.55),
    score: metric(
      grounding * 0.16 +
      satanicoScore * 0.36 +
      latent * 0.2 +
      relation.confidence * 0.14 +
      inference.hypothesisSpace * 0.14,
    ),
  };
}

function sourceFallback(graph: RealityGraph, lens?: string): LatentMovieCandidate {
  const ids = graph.events.map((event) => event.id);
  return {
    id: "movie-source",
    lens: clean(lens) || "NONE",
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: [],
    trajectory: trajectory(graph, ids),
    payoff: label(graph, ids[ids.length - 1] ?? "") || "supplied reality",
    unresolvedQuestion: "What is becoming noticeable?",
    evidence: ids.map((id) => label(graph, id)).filter(Boolean),
    hypothesis: ["Source presentation is the fallback, never the preferred movie when grounded inference exists."],
    truthRisk: 0,
    novelty: 0.18,
    specificity: metric(Math.min(1, ids.length / 8)),
    informationValue: metric(Math.min(1, ids.length / 8)),
    uncertainty: 0.15,
    attentionPotential: 0.3,
    consequencePotential: 0.15,
    callbackPotential: 0,
    compressionPotential: 0.2,
    repetitionRisk: 0,
    distinctiveness: 0.15,
    score: 0.2,
  };
}

export function searchUniversalMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  lens?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  const inference = discoverSatanicoInference(input.graph, input.subject, Math.max(12, input.limit ?? 10));
  const candidates = inference.relations.relations
    .map((_, index) => satanicoCandidate(input.graph, input.lens, inference, index))
    .filter((candidate): candidate is LatentMovieCandidate => Boolean(candidate));
  const fallback = sourceFallback(input.graph, input.lens);
  return [...candidates, fallback]
    .sort((a, b) => b.score - a.score || b.attentionPotential - a.attentionPotential)
    .slice(0, input.limit ?? 10);
}
