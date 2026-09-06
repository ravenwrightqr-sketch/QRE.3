/*
 * QRE UNIVERSAL EXPERIENCE JUDGE
 *
 * This is the independent decision layer between Cognition and realization.
 * It does not invent meaning. It judges whether a candidate has earned the
 * right to become visible by measuring semantic movement, grounding,
 * distinctiveness, replay value, and failure risk.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { evaluateLatentMovie, type SemanticGateResult } from "./authorSemanticGate.js";

export type AuthorExperienceJudgment = {
  accepted: boolean;
  score: number;
  reasons: string[];
  signature: string;
  dimensions: {
    semanticMovement: number;
    grounding: number;
    specificity: number;
    distinctiveness: number;
    attention: number;
    consequence: number;
    continuity: number;
    informationDensity: number;
    originality: number;
    replayValue: number;
    captionRisk: number;
    genericityRisk: number;
    repetitionRisk: number;
    inventionRisk: number;
  };
  gate: SemanticGateResult;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (n: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const GENERIC = /\b(?:a\s+day|the\s+journey|memories?|moments?|something\s+special|special\s+moment|good\s+times?|beautiful\s+moment|life|adventure|experience|story|one\s+of\s+those|it\s+all\s+started|at\s+the\s+end\s+of\s+the\s+day)\b/i;
const INTERNAL = /\b(?:cognition|trajectory|candidate|viewer\s+state|semantic\s+turn|evidence\s+id|planner|compiler|realizer|provenance)\b/i;

function semanticMovement(candidate: LatentMovieCandidate): number {
  if (!candidate.trajectory.length) return 0;
  const meaningful = candidate.trajectory.filter((step) => step.operation !== "establish");
  const variety = unique(meaningful.map((step) => step.operation)).length;
  const bridges = candidate.trajectory.filter((step) => step.eventIds.length >= 2).length;
  const stateChanges = meaningful.filter((step) => ["contrast", "reframe", "escalate", "converge", "consequence", "payoff"].includes(step.operation)).length;
  return clamp(0.18 + Math.min(0.42, meaningful.length * 0.11) + Math.min(0.2, variety * 0.06) + Math.min(0.2, bridges * 0.08) + Math.min(0.15, stateChanges * 0.05));
}

function grounding(candidate: LatentMovieCandidate, graph: RealityGraph): number {
  if (!graph.events.length) return 1;
  const ids = new Set(graph.events.map((event) => event.id));
  const cited = new Set(candidate.trajectory.flatMap((step) => step.eventIds).filter((id) => ids.has(id)));
  const anchors = candidate.anchorEventIds.filter((id) => ids.has(id));
  const thesisIds = [
    ...(candidate.storyThesis?.beforeEventIds ?? []),
    ...(candidate.storyThesis?.afterEventIds ?? []),
    ...(candidate.storyThesis?.carrierEventIds ?? []),
    ...(candidate.storyThesis?.sealingEventIds ?? []),
    ...(candidate.storyThesis?.semanticRealization?.evidenceEventIds ?? []),
  ].filter((id) => ids.has(id));
  const base = cited.size / Math.max(1, Math.min(graph.events.length, 5));
  const anchor = anchors.length ? 0.15 : 0;
  const thesis = thesisIds.length ? 0.15 : 0;
  return clamp(Math.min(1, base + anchor + thesis));
}

function informationDensity(candidate: LatentMovieCandidate): number {
  const operations = unique(candidate.trajectory.map((step) => step.operation)).length;
  const citedPerStep = candidate.trajectory.length
    ? candidate.trajectory.reduce((sum, step) => sum + Math.min(2, step.eventIds.length), 0) / candidate.trajectory.length
    : 0;
  return clamp(candidate.informationValue * 0.42 + candidate.attentionPotential * 0.23 + Math.min(1, operations / 4) * 0.2 + Math.min(1, citedPerStep / 2) * 0.15);
}

function genericityRisk(candidate: LatentMovieCandidate): number {
  const corpus = [...candidate.hypothesis, candidate.payoff, candidate.unresolvedQuestion].map(clean).join(" ");
  if (!corpus) return 0.9;
  const matches = corpus.match(GENERIC)?.length ?? 0;
  const internal = INTERNAL.test(corpus) ? 1 : 0;
  return clamp(Math.min(1, matches * 0.16 + internal * 0.5));
}

function signature(candidate: LatentMovieCandidate): string {
  const operations = candidate.trajectory.map((step) => step.operation).join(">") || "observation";
  const relations = unique(candidate.supportingRelationKinds).sort().join(",");
  const evidence = unique(candidate.trajectory.flatMap((step) => step.eventIds)).sort().join(",");
  return `${operations}|${relations}|${evidence}`;
}

export function judgeAuthorExperience(
  candidate: LatentMovieCandidate,
  graph: RealityGraph,
  options: { returning?: boolean; priorSignatures?: string[] } = {},
): AuthorExperienceJudgment {
  const gate = evaluateLatentMovie(candidate, graph);
  const movement = semanticMovement(candidate);
  const groundingScore = grounding(candidate, graph);
  const density = informationDensity(candidate);
  const originality = clamp(candidate.novelty * 0.55 + candidate.distinctiveness * 0.3 + (1 - candidate.repetitionRisk) * 0.15);
  const replayValue = clamp(
    options.returning
      ? candidate.callbackPotential * 0.45 + candidate.consequencePotential * 0.2 + candidate.novelty * 0.2 + (1 - candidate.repetitionRisk) * 0.15
      : candidate.novelty * 0.4 + candidate.distinctiveness * 0.3 + candidate.attentionPotential * 0.2 + (1 - candidate.repetitionRisk) * 0.1,
  );
  const genericity = genericityRisk(candidate);
  const replayCollision = options.priorSignatures?.some((prior) => prior === signature(candidate)) ? 1 : 0;
  const repetitionRisk = clamp(Math.max(candidate.repetitionRisk, replayCollision));
  const inventionRisk = clamp(candidate.truthRisk + (INTERNAL.test(candidate.hypothesis.join(" ")) ? 0.2 : 0));
  const captionRisk = gate.signals.captionReelRisk;
  const attention = clamp(candidate.attentionPotential * 0.65 + candidate.specificity * 0.2 + candidate.distinctiveness * 0.15);
  const consequence = clamp(candidate.consequencePotential * 0.65 + candidate.callbackPotential * 0.2 + movement * 0.15);
  const continuity = clamp(options.returning ? candidate.callbackPotential * 0.7 + candidate.novelty * 0.3 : candidate.novelty * 0.8 + candidate.callbackPotential * 0.2);

  const reasons: string[] = [...gate.reasons];
  if (captionRisk >= 0.65) reasons.push("caption-reel pressure is too high");
  if (genericity >= 0.65) reasons.push("candidate meaning is too generic");
  if (repetitionRisk >= 0.8) reasons.push("candidate repeats an existing experience pattern");
  if (inventionRisk >= 0.55) reasons.push("truth-risk is too high");
  if (groundingScore < 0.45 && graph.events.length) reasons.push("candidate is weakly grounded");
  if (movement < 0.38 && graph.events.length > 1) reasons.push("candidate has not earned enough semantic movement");

  const score = clamp(
    movement * 0.17 +
    groundingScore * 0.14 +
    candidate.specificity * 0.09 +
    candidate.distinctiveness * 0.1 +
    attention * 0.1 +
    consequence * 0.07 +
    continuity * 0.05 +
    density * 0.1 +
    originality * 0.08 +
    replayValue * 0.08 +
    (1 - captionRisk) * 0.05 +
    (1 - genericity) * 0.04 +
    (1 - repetitionRisk) * 0.04 +
    (1 - inventionRisk) * 0.05,
  );

  return {
    accepted: gate.accepted && reasons.length === 0 && score >= 0.62,
    score,
    reasons: unique(reasons),
    signature: signature(candidate),
    dimensions: {
      semanticMovement: movement,
      grounding: groundingScore,
      specificity: candidate.specificity,
      distinctiveness: candidate.distinctiveness,
      attention,
      consequence,
      continuity,
      informationDensity: density,
      originality,
      replayValue,
      captionRisk,
      genericityRisk: genericity,
      repetitionRisk,
      inventionRisk,
    },
    gate,
  };
}
