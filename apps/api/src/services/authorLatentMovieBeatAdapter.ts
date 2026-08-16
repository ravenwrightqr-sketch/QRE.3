/**
 * QRE AUTHOR LATENT-MOVIE → BEAT-PLAN ADAPTER · CANONICAL BOUNDARY
 *
 * No new author path. This is a deterministic semantic adapter between the
 * canonical LatentMovieCandidate trajectory and the existing BeatPlan shape.
 * It preserves RealityGraph event provenance and never invents viewer prose.
 *
 * RULE: no hardcoded domain facts, subjects, scenes, or outcomes.
 */

type TrajectoryStep = {
  order?: number;
  operation?: string;
  eventIds?: unknown;
  viewerChange?: unknown;
  nextQuestion?: unknown;
};

type Candidate = {
  id?: unknown;
  lens?: unknown;
  trajectory?: unknown;
  payoff?: unknown;
  unresolvedQuestion?: unknown;
  evidence?: unknown;
  hypothesis?: unknown;
};

type AdaptedBeat = {
  order: number;
  role: string;
  gainKind: string;
  change: string;
  next: string;
  frontier: string;
  necessity: string;
  eventIds: string[];
};

type AdaptedBeatPlan = {
  premise: string;
  baselineFacts: string[];
  beats: AdaptedBeat[];
  closing?: string;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const strings = (value: unknown, limit = 24): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(clean).filter(Boolean))].slice(0, limit);
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

/**
 * Accepts the canonical LatentMovieCandidate shape returned by latent movie
 * search and converts only its semantic trajectory into the BeatPlan shape.
 */
export function normalizeLatentMovieBeatPlan(value: unknown): AdaptedBeatPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Candidate;
  if (!Array.isArray(candidate.trajectory) || !candidate.trajectory.length) return undefined;

  const trajectory = candidate.trajectory
    .filter((step): step is TrajectoryStep => Boolean(step) && typeof step === "object")
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  const beats: AdaptedBeat[] = [];
  for (const [index, step] of trajectory.entries()) {
    const operation = clean(step.operation).toLowerCase();
    const change = clean(step.viewerChange);
    const next = clean(step.nextQuestion);
    if (!operation || !change) continue;

    beats.push({
      order: index + 1,
      role: ROLE_BY_OPERATION[operation] ?? "discovery",
      gainKind: GAIN_BY_OPERATION[operation] ?? "discovery",
      change,
      next,
      frontier: next,
      necessity: next || change,
      eventIds: strings(step.eventIds, 12),
    });
  }

  if (!beats.length) return undefined;

  const hypothesis = strings(candidate.hypothesis, 1)[0];
  const payoff = clean(candidate.payoff);
  const unresolved = clean(candidate.unresolvedQuestion);

  return {
    premise: hypothesis || clean(candidate.lens),
    baselineFacts: strings(candidate.evidence, 16),
    beats: beats.slice(0, 6),
    closing: payoff || unresolved || undefined,
  };
}
