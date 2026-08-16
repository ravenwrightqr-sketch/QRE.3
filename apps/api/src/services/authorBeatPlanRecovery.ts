/**
 * QRE CREATIVE ARCHITECTURE RULE
 *
 * NO HARD-CODED CREATIVE BEHAVIOR.
 *
 * This module is a deterministic execution fallback only. It may normalize
 * semantic decisions already discovered by the canonical RealityGraph /
 * LatentMovie layers, but it must never invent domain-specific story content,
 * canned prose, subject-specific jokes, or hidden facts.
 *
 * CANONICAL PATH:
 * REALITY → MOVIE → DIFFERENTIATION → COGNITION → BEAT PLAN → MAGNET
 *
 * A model formatting failure must not erase a valid semantic movie.
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
};

export type RecoveredBeatPlan = {
  premise: string;
  baselineFacts: string[];
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

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniq(values: readonly string[], limit = 16): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
}

function compact(value: string, maxWords: number): string {
  const words = clean(value).split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? clean(value) : words.slice(0, maxWords).join(" ");
}

function eventIdsExist(graph: RealityGraph | undefined, ids: string[]): string[] {
  if (!graph) return [];
  const known = new Set(graph.events.map((event) => event.id));
  return ids.filter((id) => known.has(id));
}

/**
 * Recover an executable beat plan from an already-selected LatentMovie.
 *
 * This is deliberately not a second author. It performs semantic projection:
 * movie trajectory → canonical beat fields. No new facts or creative premises
 * are introduced here.
 */
export function recoverBeatPlanFromLatentMovie(
  candidate: LatentMovieCandidate | undefined,
  realityGraph?: RealityGraph,
): RecoveredBeatPlan | undefined {
  if (!candidate?.trajectory?.length) return undefined;

  const beats: RecoveredAuthorBeat[] = candidate.trajectory
    .map((step) => {
      const change = compact(step.viewerChange, 14);
      const next = compact(step.nextQuestion, 10);
      if (!change) return undefined;

      return {
        order: step.order,
        role: ROLE_BY_OPERATION[step.operation] ?? "discovery",
        gainKind: GAIN_BY_OPERATION[step.operation] ?? "discovery",
        change,
        next,
        frontier: next,
        necessity: "Preserves the next change in the discovered movie.",
        sourceIds: eventIdsExist(realityGraph, step.eventIds),
      } satisfies RecoveredAuthorBeat;
    })
    .filter((beat): beat is RecoveredAuthorBeat => Boolean(beat));

  if (!beats.length) return undefined;

  return {
    premise: clean(candidate.hypothesis[0] ?? candidate.unresolvedQuestion),
    baselineFacts: uniq(candidate.evidence),
    beats,
    closing: clean(candidate.payoff),
    source: "latent_movie_recovery",
    candidateId: candidate.id,
    lens: clean(candidate.lens),
  };
}
