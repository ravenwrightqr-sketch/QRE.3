/**
 * QRE CREATIVE ARCHITECTURE RULE
 *
 * Deterministic fallback only. Recovery projects an already-selected latent
 * movie trajectory into the canonical Beat Graph contract. It never invents
 * domain facts, viewer prose, or a new creative premise.
 */
import type { LatentMovieCandidate, RealityGraph, RealityRelation } from "@qre/contracts";

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

export type RecoveredAuthorBeat = {
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

const ATTENTION_BY_OPERATION: Record<
  string,
  BeatAttentionFunction
> = {
  establish: "hook",
  contrast: "reframe",
  recur: "callback",
  reframe: "reframe",
  escalate: "escalation",
  converge: "reframe",
  reveal: "turn",
  consequence: "turn",
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
function eventLabel(
  graph: RealityGraph | undefined,
  id: string | undefined,
): string {
  if (!graph || !id) {
    return "";
  }

  return clean(
    graph.events.find(
      (event) =>
        event.id === id,
    )?.label,
  );
}

function relationBetween(
  graph: RealityGraph | undefined,
  a: string,
  b: string,
): RealityRelation | undefined {
  if (!graph) {
    return undefined;
  }

  return graph.relations
    .filter(
      (relation) =>
        (relation.from === a &&
          relation.to === b) ||
        (relation.from === b &&
          relation.to === a),
    )
    .sort(
      (left, right) =>
        right.strength -
        left.strength,
    )[0];
}
function semanticLinks(
  candidate: LatentMovieCandidate,
  graph: RealityGraph | undefined,
  index: number,
  eventIds: string[],
): {
  setsUp: string[];
  paysOff: string[];
  creativeMove: BeatCreativeMove;
} {
  const current =
    eventIds[eventIds.length - 1];

  const previousStep =
    index > 0
      ? candidate.trajectory[index - 1]
      : undefined;

  const previousIds =
    previousStep?.eventIds ?? [];

  const previous =
    previousIds[
      previousIds.length - 1
    ];

  const currentLabel =
    eventLabel(
      graph,
      current,
    );

  const previousLabel =
    eventLabel(
      graph,
      previous,
    );

  /*
   * Opening:
   * establish supplied reality; it creates the first state that later beats
   * are allowed to reinterpret.
   */
  if (index === 0) {
    return {
      setsUp: currentLabel
        ? [currentLabel]
        : [],
      paysOff: [],
      creativeMove: "none",
    };
  }

  const operation =
    clean(
      candidate.trajectory[index]
        ?.operation,
    ).toLowerCase();

  /*
   * A contrast is the strongest grounded status/expectation inversion
   * available without inventing anything.
   */
  if (
    operation === "contrast"
  ) {
    return {
      setsUp: previousLabel
        ? [previousLabel]
        : [],
      paysOff:
        previousLabel
          ? [previousLabel]
          : [],
      creativeMove: "contrast",
    };
  }

  /*
   * Reframe/recur/escalation carries forward the previous supplied state.
   */
  if (
    operation === "reframe" ||
    operation === "recur" ||
    operation === "escalate" ||
    operation === "converge"
  ) {
    return {
      setsUp: previousLabel
        ? [previousLabel]
        : [],
      paysOff:
        relationBetween(
          graph,
          previous ?? "",
          current ?? "",
        )
          ? previousLabel
            ? [previousLabel]
            : []
          : [],
      creativeMove:
        operation === "recur"
          ? "callback"
          : operation ===
              "escalate"
            ? "status_inversion"
            : "recontextualization",
    };
  }

  /*
   * Consequence means the current supplied detail is earned by the preceding
   * meaning carrier.
   */
  if (
    operation === "consequence"
  ) {
    return {
      setsUp: previousLabel
        ? [previousLabel]
        : [],
      paysOff: previousLabel
        ? [previousLabel]
        : [],
      creativeMove:
        "recontextualization",
    };
  }

  /*
   * Payoff closes over the meaningful supplied details accumulated immediately
   * before the endpoint. Never invent a new label.
   */
  if (
    operation === "payoff"
  ) {
    const setupLabels =
      eventIds
        .slice(
          0,
          Math.max(
            0,
            eventIds.length - 1,
          ),
        )
        .map(
          (id) =>
            eventLabel(
              graph,
              id,
            ),
        )
        .filter(Boolean);

    const priorLabels =
      index > 0
        ? candidate.trajectory
            .slice(
              0,
              index,
            )
            .flatMap(
              (step) =>
                step.eventIds ?? [],
            )
            .map(
              (id) =>
                eventLabel(
                  graph,
                  id,
                ),
            )
            .filter(Boolean)
        : [];

    return {
      setsUp: uniq(
        setupLabels,
        4,
      ),
      paysOff: uniq(
        [
          ...priorLabels,
          currentLabel,
        ],
        6,
      ),
      creativeMove:
        "recontextualization",
    };
  }

  return {
    setsUp: previousLabel
      ? [previousLabel]
      : [],
    paysOff: [],
    creativeMove: "none",
  };
}
export function recoverBeatPlanFromLatentMovie(
  candidate: LatentMovieCandidate | undefined,
  realityGraph?: RealityGraph,
): RecoveredBeatPlan | undefined {
  if (!candidate?.trajectory?.length) return undefined;

  const beats: RecoveredAuthorBeat[] = candidate.trajectory
    .map((step, index): RecoveredAuthorBeat | undefined => {
      const operation = clean(step.operation).toLowerCase();
      const change = compact(step.viewerChange, 12);
      const next = compact(step.nextQuestion, 8);
      if (!change) return undefined;

      const role = ROLE_BY_OPERATION[operation] ?? "discovery";
      const gainKind = GAIN_BY_OPERATION[operation] ?? "discovery";
      const attentionFunction =
        ATTENTION_BY_OPERATION[operation] ?? "reframe";
       
      const eventIds =
    eventIdsExist(
    realityGraph,
    step.eventIds,
  );

   const semantic =
  semanticLinks(
    candidate,
    realityGraph,
    index,
    eventIds,
  );

   return {
  order:
    Number(
      step.order ??
        index + 1,
      ),
     role,
     gainKind,
     change,
     next,
     frontier: next,
     necessity:
    "Preserves the next change in the discovered movie.",
     eventIds,
      attentionFunction,
     setsUp:
    semantic.setsUp,
     paysOff:
    semantic.paysOff,
     creativeMove:
     semantic.creativeMove,
       nextBeatPullTarget:
       next
      ? 0.55
      : 0.35,
     };
    })
    .filter((beat): beat is RecoveredAuthorBeat => beat !== undefined)
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
