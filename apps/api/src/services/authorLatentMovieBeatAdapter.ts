/**
 * QRE AUTHOR LATENT-MOVIE → BEAT-PLAN ADAPTER · CANONICAL BOUNDARY
 *
 * Deterministic semantic adapter between the canonical LatentMovieCandidate
 * trajectory and the universal Beat Graph contract.
 * No new facts, subjects, scenes, or viewer prose are invented here.
 */

type BeatAttentionFunction =
  | "hook"
  | "question"
  | "turn"
  | "escalation"
  | "reframe"
  | "callback"
  | "payoff"
  | "release";

type BeatCreativeMove =
  | "contrast"
  | "status_inversion"
  | "understatement"
  | "double_meaning"
  | "personification"
  | "callback"
  | "recontextualization"
  | "implication"
  | "none";

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
  attentionFunction: BeatAttentionFunction;
  setsUp: string[];
  paysOff: string[];
  creativeMove: BeatCreativeMove;
  nextBeatPullTarget: number;
};

type AdaptedBeatPlan = {
  premise: string;
  baselineFacts: string[];
  attentionArc: string;
  beats: AdaptedBeat[];
  closing?: string;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

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

const ATTENTION_BY_OPERATION: Record<string, BeatAttentionFunction> = {
  establish: "hook",
  contrast: "reframe",
  recur: "callback",
  reframe: "reframe",
  escalate: "escalation",
  converge: "discovery" as BeatAttentionFunction,
  reveal: "turn",
  consequence: "release",
  payoff: "payoff",
};

function eventIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.map(clean).filter(Boolean))].slice(0, 12)
    : [];
}

function arc(beats: AdaptedBeat[]): string {
  return beats.map((beat) => beat.attentionFunction).join(" → ");
}

export function normalizeLatentMovieBeatPlan(
  value: unknown,
): AdaptedBeatPlan | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = value as Candidate;
  if (!Array.isArray(candidate.trajectory) || !candidate.trajectory.length) {
    return undefined;
  }

  const trajectory = candidate.trajectory
    .filter(
      (step): step is TrajectoryStep =>
        Boolean(step) && typeof step === "object",
    )
    .sort(
      (a, b) =>
        Number(a.order ?? 0) -
        Number(b.order ?? 0),
    );

  const beats: AdaptedBeat[] = [];

  for (const [index, step] of trajectory.entries()) {
    const operation = clean(step.operation).toLowerCase();
    const change = clean(step.viewerChange);
    const next = clean(step.nextQuestion);

    if (!operation || !change) continue;

    beats.push({
      order: index + 1,
      role:
        ROLE_BY_OPERATION[operation] ??
        "discovery",
      gainKind:
        GAIN_BY_OPERATION[operation] ??
        "discovery",
      change,
      next,
      frontier: next,
      necessity:
        next ||
        "Preserves the next change in the discovered movie.",
      eventIds: eventIds(step.eventIds),
      attentionFunction:
        ATTENTION_BY_OPERATION[operation] ??
        "reframe",
      setsUp: [],
      paysOff: [],
      creativeMove:
        operation === "contrast"
          ? "contrast"
          : operation === "reframe"
            ? "recontextualization"
            : "none",
      nextBeatPullTarget: next ? 0.55 : 0.35,
    });
  }

  if (!beats.length) return undefined;

  const hypothesis = strings(
    candidate.hypothesis,
    1,
  )[0];
  const payoff = clean(candidate.payoff);
  const unresolved = clean(
    candidate.unresolvedQuestion,
  );

  return {
    premise:
      hypothesis ||
      clean(candidate.lens),
    baselineFacts: strings(
      candidate.evidence,
      16,
    ),
    attentionArc: arc(beats.slice(0, 6)),
    beats: beats.slice(0, 6),
    closing:
      payoff ||
      unresolved ||
      undefined,
  };
}
