/**
 * QRE LATENT MOVIE SEARCH · GROUNDED HYPOTHESIS LAYER
 *
 * RealityGraph is immutable source evidence. This layer does not invent a
 * genre, mood, or semantic meaning. It searches the relationships that the
 * supplied reality actually contains and turns those relationships into
 * competing Movie hypotheses.
 *
 * A lens may change treatment when the user explicitly asks for one, but a
 * lens never creates the underlying semantic relationship.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import { selectDistinctMovieCandidates } from "./authorMovieDifferentiation.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function eventById(graph: RealityGraph, id: string) {
  return graph.events.find((event) => event.id === id);
}

function eventLabel(graph: RealityGraph, id: string): string {
  return clean(eventById(graph, id)?.label) || id;
}

function relationOperation(kind: RealityRelation["kind"]): LatentMovieTrajectoryStep["operation"] | undefined {
  switch (kind) {
    case "contrasts":
      return "contrast";
    case "changes":
      return "consequence";
    case "converges":
      return "converge";
    case "recontextualizes":
      return "reframe";
    case "repeats":
      return "recur";
    default:
      return undefined;
  }
}

function relationPairs(graph: RealityGraph): RealityRelation[] {
  return graph.relations
    .filter((relation) => relationOperation(relation.kind))
    .slice()
    .sort((a, b) => b.strength - a.strength);
}

function concreteDetail(graph: RealityGraph, eventId: string): boolean {
  const event = eventById(graph, eventId);
  if (!event) return false;
  const corpus = [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ");
  return Boolean(corpus.match(/\b(?:bow|apple|ball|food|wine|glass|door|car|house|table|music|bath|kitchen|laundry|bench|sign|toolbox|radio|scissors|dryer|fryer|bass|track|trail|marker)\b/i));
}

function buildTrajectory(
  graph: RealityGraph,
  relation: RealityRelation,
): LatentMovieTrajectoryStep[] {
  const operation = relationOperation(relation.kind);
  if (!operation) return [];
  const from = eventById(graph, relation.from);
  const to = eventById(graph, relation.to);
  if (!from || !to) return [];

  const questions: Record<LatentMovieTrajectoryStep["operation"], string> = {
    establish: "What changes this detail's significance?",
    contrast: "What expectation does the supplied contrast break?",
    recur: "What does the return make newly noticeable?",
    reframe: "What does the second detail make newly visible in the first?",
    escalate: "What supplied change increases the pressure?",
    converge: "What becomes visible when these supplied details meet?",
    reveal: "What supplied fact becomes visible only after the earlier one?",
    consequence: "What supplied change follows from the earlier state?",
    payoff: "What meaning survives after the relationship is seen?",
  };
  return [
    {
      order: 1,
      operation: "establish",
      eventIds: [relation.from],
      viewerChange: `Hold the supplied detail: ${from.label}`,
      nextQuestion: questions[operation],
    },
    {
      order: 2,
      operation,
      eventIds: unique([relation.from, relation.to]),
      viewerChange: `Use the supplied ${relation.kind} relation between ${from.label} and ${to.label}`,
      nextQuestion: questions.payoff,
    },
    {
      order: 3,
      operation: "payoff",
      eventIds: unique([relation.from, relation.to]),
      viewerChange: "Let the supplied relationship carry the final turn without adding a new fact",
      nextQuestion: "What remains worth remembering?",
    },
  ];
}

function buildCandidate(
  graph: RealityGraph,
  relation: RealityRelation,
  index: number,
  explicitLens?: string,
): LatentMovieCandidate | undefined {
  const operation = relationOperation(relation.kind);
  if (!operation) return undefined;
  const from = eventById(graph, relation.from);
  const to = eventById(graph, relation.to);
  if (!from || !to) return undefined;
  const trajectory = buildTrajectory(graph, relation);
  if (!trajectory.length) return undefined;

  const ids = unique([relation.from, relation.to]);
  const concrete = ids.filter((id) => concreteDetail(graph, id)).length;
  const recurring = graph.recurringSignals.filter((signal) => ids.some((id) => eventLabel(graph, id).toLowerCase() === signal.toLowerCase())).length;
  const strength = metric(relation.strength);
  const specificity = metric(0.52 + concrete * 0.14 + ids.length * 0.08 + strength * 0.12);
  const novelty = metric(0.34 + strength * 0.36 + (relation.kind === "contrasts" ? 0.16 : 0) + (relation.kind === "recontextualizes" ? 0.1 : 0));
  const informationValue = metric(0.42 + strength * 0.3 + (relation.kind !== "involves" ? 0.14 : 0));
  const attentionPotential = metric(novelty * 0.42 + informationValue * 0.32 + specificity * 0.18 + strength * 0.08);
  const consequencePotential = metric(
    operation === "consequence" ? 0.78 :
    operation === "contrast" ? 0.68 :
    operation === "reframe" ? 0.64 :
    operation === "recur" ? 0.58 : 0.54,
  );
  const callbackPotential = metric(0.14 + recurring * 0.22 + (relation.kind === "repeats" ? 0.4 : 0));
  const compressionPotential = metric(0.5 + specificity * 0.24 + strength * 0.14);
  const repetitionRisk = metric(relation.kind === "involves" ? 0.5 : 0.04);
  const score = metric(
    strength * 0.18 +
    specificity * 0.14 +
    novelty * 0.16 +
    informationValue * 0.16 +
    attentionPotential * 0.14 +
    consequencePotential * 0.08 +
    callbackPotential * 0.05 +
    compressionPotential * 0.05 -
    repetitionRisk * 0.08,
  );

  const lens = clean(explicitLens) || "NONE";
  return {
    id: `grounded-relation-${index + 1}`,
    lens,
    anchorEventIds: ids,
    supportingRelationKinds: [relation.kind],
    trajectory,
    payoff: `the supplied ${relation.kind} relationship between ${from.label} and ${to.label}`,
    unresolvedQuestion: `What becomes newly meaningful when ${from.label} and ${to.label} are seen together?`,
    evidence: [from.label, to.label],
    hypothesis: [
      `The supplied ${relation.kind} relationship between ${from.label} and ${to.label} creates the semantic turn.`,
      "Interpretation may change the feeling, but it cannot add a new fact.",
    ],
    truthRisk: 0,
    novelty,
    specificity,
    informationValue,
    uncertainty: metric(0.12 + (1 - strength) * 0.28),
    attentionPotential,
    consequencePotential,
    callbackPotential,
    compressionPotential,
    repetitionRisk,
    distinctiveness: metric(0.56 + strength * 0.32 + concrete * 0.06),
    score,
  };
}

export function searchLatentMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  lens?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  if (!input.graph.events.length) return [];
  const relations = relationPairs(input.graph);
  const candidates = relations
    .map((relation, index) => buildCandidate(input.graph, relation, index, input.lens))
    .filter((candidate): candidate is LatentMovieCandidate => Boolean(candidate));

  return selectDistinctMovieCandidates(
    candidates,
    Math.max(1, Math.min(input.limit ?? 8, 8)),
  );
}
