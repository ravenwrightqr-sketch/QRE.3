/**
 * QRE CREATIVE ARCHITECTURE RULE
 *
 * Deterministic fallback only. Recovery projects an already-selected latent
 * movie trajectory into the canonical Beat Graph contract. It never invents
 * domain facts, viewer prose, or a new creative premise.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";

export type RecoveredAuthorBeat = {
  order: number;
  role: string;
  gainKind: string;
  change: string;
  next: string;
  frontier: string;
  necessity: string;
  sourceIds: string[];
  attentionFunction: string;
  setsUp: string[];
  paysOff: string[];
  creativeMove: string;
  nextBeatPullTarget: number;
};

export type RecoveredBeatPlan = {
  premise: string;
  baselineFacts: string[];
  attentionArc: string;
  beats: RecoveredAuthorBeat[];
  closing?: string;
  source: "latent_movie_recovery";
  candidateId: string;
  lens: string;
};

const ROLE_BY_OPERATION: Record<string, string> = {
  establish: "arrival",
  contrast: "reframe",
  recur: "callback",
  reframe: "reframe",
  escalate: "escalation",
  converge: "discovery",
  reveal: "discovery",
  consequence: "consequence",
  payoff: "payoff",
};

const GAIN_BY_OPERATION: Record<string, string> = {
  establish: "new_fact",
  contrast: "reframe",
  recur: "callback",
  reframe: "reframe",
  escalate: "escalation",
  converge: "discovery",
  reveal: "discovery",
  consequence: "consequence",
  payoff: "payoff",
};

const ATTENTION_BY_OPERATION: Record<string, string> = {
  establish: "hook",
  contrast: "reframe",
  recur: "callback",
  reframe: "reframe",
  escalate: "escalation",
  converge: "discovery",
  reveal: "turn",
  consequence: "consequence",
  payoff: "payoff",
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniq(values: readonly string[], limit = 16): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
}

function compact(value: string, maxWords: number): string {
  const words = clean(value).split(/\s+/).filter(Boolean);
  return words.length <= maxWords
    ? clean(value)
    : words.slice(0, maxWords).join(" ");
}

function eventIdsExist(
  graph: RealityGraph | undefined,
  ids: string[],
): string[] {
  if (!graph) return [];
  const known = new Set(graph.events.map((event) => event.id));
  return ids.filter((id) => known.has(id));
}

function canonicalArc(beats: RecoveredAuthorBeat[]): string {
  return beats
    .map((beat) => beat.attentionFunction)
    .filter(Boolean)
    .join(" → ");
}

export function recoverBeatPlanFromLatentMovie(
  candidate: LatentMovieCandidate | undefined,
  realityGraph?: RealityGraph,
): RecoveredBeatPlan | undefined {
  if (!candidate?.trajectory?.length) return undefined;

  const beats: RecoveredAuthorBeat[] = candidate.trajectory
    .map((step) => {
      const operation = clean(step.operation).toLowerCase();
      const change = compact(step.viewerChange, 12);
      const next = compact(step.nextQuestion, 8);
      if (!change) return undefined;

      const role = ROLE_BY_OPERATION[operation] ?? "discovery";
      const gainKind = GAIN_BY_OPERATION[operation] ?? "discovery";
      const attentionFunction = ATTENTION_BY_OPERATION[operation] ?? "reframe";

      return {
        order: step.order,
        role,
        gainKind,
        change,
        next,
        frontier: next,
        necessity: "Preserves the next change in the discovered movie.",
        sourceIds: eventIdsExist(realityGraph, step.eventIds),
        attentionFunction,
        setsUp: [],
        paysOff: [],
        creativeMove: operation === "contrast" ? "contrast" : operation === "reframe" ? "recontextualization" : "none",
        nextBeatPullTarget: next ? 0.55 : 0.35,
      } satisfies RecoveredAuthorBeat;
    })
    .filter((beat): beat is RecoveredAuthorBeat => Boolean(beat))
    .sort((a, b) => a.order - b.order)
    .map((beat, index) => ({ ...beat, order: index + 1 }));

  if (!beats.length) return undefined;

  return {
    premise: clean(candidate.hypothesis[0] ?? candidate.unresolvedQuestion),
    baselineFacts: uniq(candidate.evidence),
    attentionArc: canonicalArc(beats),
    beats: beats.slice(0, 6),
    closing: clean(candidate.payoff),
    source: "latent_movie_recovery",
    candidateId: candidate.id,
    lens: clean(candidate.lens),
  };
}
