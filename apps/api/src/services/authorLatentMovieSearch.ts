/**
 * QRE LATENT MOVIE SEARCH · CANONICAL HYPOTHESIS LAYER
 *
 * RealityGraph is immutable source evidence. This module searches for different
 * ways the same evidence could play as a movie without turning hypotheses into
 * facts. It is intentionally domain-neutral and deterministic.
 *
 * CRITICAL RULE:
 *   A different lens label is NOT a different movie.
 *   Evidence, graph relationships, trajectory operations, and payoff mechanism
 *   must materially differ before candidates are considered creative alternatives.
 *
 * NEW ACCUMULATION LAW:
 *
 *   FORWARD DISCOVERY
 *        ↓
 *   what changes / emerges / accumulates?
 *        +
 *   BACKWARD ENDPOINT SEARCH
 *        ↑
 *   what does the supplied ending require?
 *        ↓
 *   FORWARD/BACKWARD CONVERGENCE
 *        ↓
 *   LatentMovieCandidate
 *
 * The endpoint is supplied reality.
 * QRE may discover why it matters.
 * QRE may not invent a better ending.
 *
 * Pipeline position:
 *
 *   REALITY GRAPH
 *        ↓
 *   LATENT MOVIE CANDIDATES
 *        ↓
 *   DIFFERENTIATION
 *        ↓
 *   COGNITION
 *        ↓
 *   TRAJECTORY
 *        ↓
 *   MOUTH
 */

import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import { selectDistinctMovieCandidates } from "./authorMovieDifferentiation.js";
import {
  findLatentMovieConvergence,
  type LatentMovieConvergence,
} from "./authorLatentMovieConvergence.js";

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

const GENERIC_LENSES = [
  "comedy",
  "romance",
  "horror",
  "sentimental",
  "absurd",
  "neutral",
] as const;

type Lens = (typeof GENERIC_LENSES)[number];
type RelationKind = RealityRelation["kind"];

function unique<T>(
  values: readonly T[],
): T[] {
  return [...new Set(values)];
}

function eventById(
  graph: RealityGraph,
  id: string,
) {
  return graph.events.find(
    (event) => event.id === id,
  );
}

function requestedLenses(
  lens?: string,
): Lens[] {
  const text = clean(lens).toLowerCase();
  const hits: Lens[] = [];

  for (
    const candidate of GENERIC_LENSES
  ) {
    if (text.includes(candidate)) {
      hits.push(candidate);
    }
  }

  if (
    /funny|comic|humor|playful/.test(text)
  ) {
    hits.push("comedy");
  }

  if (
    /romantic|love|tender/.test(text)
  ) {
    hits.push("romance");
  }

  if (
    /dark|eerie|creepy|dread/.test(text)
  ) {
    hits.push("horror");
  }

  if (
    /warm|heart|nostalgic|gentle/.test(text)
  ) {
    hits.push("sentimental");
  }

  if (
    /weird|chaotic|surreal|demented/.test(text)
  ) {
    hits.push("absurd");
  }

  return unique(
    hits.length
      ? hits
      : [...GENERIC_LENSES],
  );
}

function preferredKinds(
  lens: Lens,
): RelationKind[] {
  switch (lens) {
    case "comedy":
      return [
        "contrasts",
        "converges",
        "changes",
        "recontextualizes",
      ];

    case "romance":
      return [
        "converges",
        "recontextualizes",
        "changes",
        "contrasts",
      ];

    case "horror":
      return [
        "changes",
        "recontextualizes",
        "contrasts",
        "converges",
      ];

    case "sentimental":
      return [
        "recontextualizes",
        "repeats",
        "converges",
        "changes",
      ];

    case "absurd":
      return [
        "contrasts",
        "converges",
        "recontextualizes",
        "changes",
      ];

    default:
      return [
        "changes",
        "converges",
        "recontextualizes",
        "contrasts",
        "repeats",
      ];
  }
}

function lensOperation(
  lens: Lens,
  relation: RelationKind,
): LatentMovieTrajectoryStep["operation"] {
  if (lens === "comedy") {
    return relation === "contrasts"
      ? "contrast"
      : "consequence";
  }

  if (lens === "romance") {
    return relation === "converges"
      ? "recur"
      : "reframe";
  }

  if (lens === "horror") {
    return relation === "changes"
      ? "escalate"
      : "reframe";
  }

  if (lens === "sentimental") {
    return (
      relation === "recontextualizes" ||
      relation === "repeats"
    )
      ? "recur"
      : "reframe";
  }

  if (lens === "absurd") {
    return relation === "contrasts"
      ? "contrast"
      : "converge";
  }

  return relation === "changes"
    ? "consequence"
    : "reframe";
}

/**
 * Relations between selected evidence anchors.
 */
function relationEvidence(
  graph: RealityGraph,
  ids: string[],
): RealityRelation[] {
  const set = new Set(ids);

  return graph.relations.filter(
    (relation) =>
      set.has(relation.from) &&
      set.has(relation.to),
  );
}

function isConcreteDetail(
  graph: RealityGraph,
  eventId: string,
): boolean {
  const event = eventById(
    graph,
    eventId,
  );

  if (!event) {
    return false;
  }

  return (
    graph.sensorySignals.some(
      (signal) =>
        signal.toLowerCase() ===
        event.label.toLowerCase(),
    ) ||
    /\b(?:bow|bows|ball|balls|tie|ties|dress|shoe|shoes|food|wine|glass|door|car|house|table|music|bath|kitchen|laundry)\b/i.test(
      event.label,
    )
  );
}

function lensEventBias(
  graph: RealityGraph,
  eventId: string,
  lens: Lens,
): number {
  const incident =
    graph.relations.filter(
      (relation) =>
        relation.from === eventId ||
        relation.to === eventId,
    );

  const kinds = new Set(
    incident.map(
      (relation) => relation.kind,
    ),
  );

  const concrete =
    isConcreteDetail(
      graph,
      eventId,
    );

  const recurring =
    graph.recurringSignals.some(
      (signal) =>
        signal.toLowerCase() ===
        (
          eventById(
            graph,
            eventId,
          )?.label ?? ""
        ).toLowerCase(),
    );

  switch (lens) {
    case "comedy":
      return (
        (kinds.has("contrasts")
          ? 0.5
          : 0) +
        (concrete
          ? 0.35
          : 0) +
        (kinds.has("changes")
          ? 0.08
          : 0)
      );

    case "romance":
      return (
        (kinds.has("converges")
          ? 0.5
          : 0) +
        (kinds.has("recontextualizes")
          ? 0.25
          : 0) +
        (kinds.has("involves")
          ? 0.12
          : 0)
      );

    case "horror":
      return (
        (kinds.has("changes")
          ? 0.48
          : 0) +
        (kinds.has("recontextualizes")
          ? 0.3
          : 0) +
        (!concrete
          ? 0.08
          : 0)
      );

    case "sentimental":
      return (
        (recurring
          ? 0.6
          : 0) +
        (kinds.has("recontextualizes")
          ? 0.3
          : 0) +
        (kinds.has("converges")
          ? 0.1
          : 0)
      );

    case "absurd":
      return (
        (kinds.has("contrasts")
          ? 0.4
          : 0) +
        (concrete
          ? 0.38
          : 0) +
        (kinds.has("converges")
          ? 0.16
          : 0)
      );

    default:
      return incident.reduce(
        (sum, relation) =>
          sum + relation.strength,
        0,
      ) * 0.08;
  }
}

/**
 * Pick anchors according to the movie mechanism, not merely graph degree.
 *
 * Anchors are search material.
 * They are not automatically the final movie structure.
 */
function chooseAnchors(
  graph: RealityGraph,
  lens: Lens,
): string[] {
  const ranked =
    graph.events.map(
      (event, index) => {
        const incident =
          graph.relations.filter(
            (relation) =>
              relation.from === event.id ||
              relation.to === event.id,
          );

        const relationWeight =
          incident.reduce(
            (sum, relation) =>
              sum + relation.strength,
            0,
          );

        const recurring =
          graph.recurringSignals.some(
            (signal) =>
              signal.toLowerCase() ===
              event.label.toLowerCase(),
          );

        return {
          id: event.id,
          score:
            lensEventBias(
              graph,
              event.id,
              lens,
            ) +
            relationWeight * 0.05 +
            (recurring ? 0.15 : 0) -
            index * 0.0005,
        };
      },
    );

  return ranked
    .sort(
      (a, b) =>
        b.score - a.score,
    )
    .slice(
      0,
      Math.min(
        4,
        graph.events.length,
      ),
    )
    .map(
      (item) => item.id,
    );
}
function relationBetween(
  graph: RealityGraph,
  a: string,
  b: string,
): RealityRelation | undefined {
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
/**
 * Convert the converged forward/backward evidence into the existing
 * LatentMovieTrajectoryStep contract.
 *
 * The convergence helper finds the path.
 * The canonical latent-movie search owns the trajectory representation.
 */
function buildConvergedTrajectory(
  graph: RealityGraph,
  forwardPath: string[],
  backwardPath: string[],
  endpointId: string,
  lens: Lens,
): LatentMovieTrajectoryStep[] {
  /*
   * Forward path is the cinematic order.
   *
   * Backward path explains the endpoint but is NOT concatenated into the
   * cinematic sequence.
   */
  const ordered = unique(
    forwardPath,
  );

  if (!ordered.length) {
    return [];
  }

  const trajectory:
    LatentMovieTrajectoryStep[] =
    [];

  const firstId =
    ordered[0];

  const firstEvent =
    eventById(
      graph,
      firstId,
    );

  if (firstEvent) {
    trajectory.push({
      order: 1,
      operation: "establish",
      eventIds: [firstId],
      viewerChange:
        `Establish the supplied opening state: ${firstEvent.label}`,
      nextQuestion:
        "What does this opening state make newly important?",
    });
  }

  for (
    let index = 1;
    index < ordered.length;
    index += 1
  ) {
    const fromId =
      ordered[index - 1];

    const toId =
      ordered[index];

    const fromEvent =
      eventById(
        graph,
        fromId,
      );

    const toEvent =
      eventById(
        graph,
        toId,
      );

    if (
      !fromEvent ||
      !toEvent
    ) {
      continue;
    }

    /*
     * IMPORTANT:
     *
     * The convergence search may traverse a semantic relationship in either
     * direction. The trajectory renderer therefore uses relationBetween(),
     * which resolves the strongest supplied relationship regardless of stored
     * direction.
     *
     * We are NOT inventing an edge. We are representing an existing relation
     * that the convergence layer already selected.
     */
    const relation =
      relationBetween(
        graph,
        fromId,
        toId,
      );

    /*
     * The supplied endpoint is the final landing.
     *
     * Preserve the actual immediately preceding cinematic evidence rather
     * than replacing it with whichever earlier node has the strongest raw
     * endpoint relation.
     */
    if (
      toId === endpointId
    ) {
      trajectory.push({
        order:
          trajectory.length + 1,
        operation: "payoff",
        eventIds: [
          fromId,
          endpointId,
        ],
        viewerChange:
          `The supplied ending becomes earned by what came immediately before: ${toEvent.label}`,
        nextQuestion:
          "What remains true at the supplied ending?",
      });

      continue;
    }

    /*
     * If the convergence path contains an adjacency that has no supplied
     * relation, do not manufacture one.
     *
     * The path remains evidence for search, but only grounded transitions are
     * emitted into the canonical trajectory.
     */
    if (!relation) {
      continue;
    }

    trajectory.push({
      order:
        trajectory.length + 1,
      operation:
        lensOperation(
          lens,
          relation.kind,
        ),
      eventIds: [
        fromId,
        toId,
      ],
      viewerChange:
        `${fromEvent.label} changes the meaning carried forward into ${toEvent.label}.`,
      nextQuestion:
        relation.kind ===
        "contrasts"
          ? "What expectation changes because of this contrast?"
          : "What does this relationship make newly meaningful?",
    });
  }

  return trajectory.slice(
    0,
    6,
  );
}

function buildTrajectory(
  graph: RealityGraph,
  anchors: string[],
  lens: Lens,
  convergence: LatentMovieConvergence,
): LatentMovieTrajectoryStep[] {
  if (!graph.events.length) {
    return [];
  }

  const endpointId =
    convergence.endpointId ||
    convergence.endpointCandidates[0] ||
    anchors[
      anchors.length - 1
    ] ||
    graph.events[
      graph.events.length - 1
    ]?.id ||
    "";

  if (
    convergence.forwardPath.length > 0 ||
    convergence.backwardPath.length > 0
  ) {
    return buildConvergedTrajectory(
      graph,
      convergence.forwardPath,
      convergence.backwardPath,
      endpointId,
      lens,
    );
  }

  if (!anchors.length) {
    return [];
  }

  const first =
    anchors[0];

  const firstEvent =
    eventById(
      graph,
      first,
    );

  if (!firstEvent) {
    return [];
  }

  const steps:
    LatentMovieTrajectoryStep[] =
    [
      {
        order: 1,
        operation: "establish",
        eventIds: [first],
        viewerChange:
          `Establish the supplied detail: ${firstEvent.label}`,
        nextQuestion:
          "Which supplied relationship makes this detail worth the next cut?",
      },
    ];

  const relations =
    relationEvidence(
      graph,
      anchors,
    )
      .filter(
        (relation) =>
          preferredKinds(
            lens,
          ).includes(
            relation.kind,
          ),
      )
      .sort(
        (a, b) => {
          const ai =
            preferredKinds(
              lens,
            ).indexOf(
              a.kind,
            );

          const bi =
            preferredKinds(
              lens,
            ).indexOf(
              b.kind,
            );

          return (
            ai - bi ||
            b.strength -
              a.strength
          );
        },
      );

  const used =
    new Set<string>([
      first,
    ]);

  for (
    const relation of relations
  ) {
    const targetId =
      relation.from ===
        first
        ? relation.to
        : relation.from;

    if (
      used.has(
        targetId,
      )
    ) {
      continue;
    }

    const target =
      eventById(
        graph,
        targetId,
      );

    if (!target) {
      continue;
    }

    used.add(
      targetId,
    );

    steps.push({
      order:
        steps.length + 1,
      operation:
        lensOperation(
          lens,
          relation.kind,
        ),
      eventIds: [
        first,
        targetId,
      ],
      viewerChange:
        `${relation.kind}: the supplied relationship changes the reading of ${target.label}`,
      nextQuestion:
        relation.kind ===
        "contrasts"
          ? "What expectation does this violate?"
          : "What does this relationship make newly meaningful?",
    });

    if (
      steps.length >= 4
    ) {
      break;
    }
  }

  for (
    const id of anchors
  ) {
    if (
      used.has(id)
    ) {
      continue;
    }

    const event =
      eventById(
        graph,
        id,
      );

    if (!event) {
      continue;
    }

    used.add(id);

    steps.push({
      order:
        steps.length + 1,
      operation:
        "converge",
      eventIds: [id],
      viewerChange:
        `Introduce another concrete supplied detail: ${event.label}`,
      nextQuestion:
        "Does this detail complete, overturn, or sharpen the pattern?",
    });

    if (
      steps.length >= 5
    ) {
      break;
    }
  }

  return steps.slice(
    0,
    6,
  );
}

function buildCandidate(
  graph: RealityGraph,
  subject: string | undefined,
  lens: Lens,
  rank: number,
): LatentMovieCandidate {
  const anchors =
    chooseAnchors(
      graph,
      lens,
    );

  /*
   * Run forward/backward convergence once for this candidate and let the
   * canonical search use that result for both trajectory and scoring.
   */
  const convergence =
    findLatentMovieConvergence(
      graph,
      {
        preferredRelationKinds:
          preferredKinds(
            lens,
          ),
        maxDepth: 4,
        maxEndpoints: 3,
        maxOpenings: 4,
      },
    );

  const trajectory =
    buildTrajectory(
      graph,
      anchors,
      lens,
      convergence,
    );

  const evidenceIds =
    unique([
      ...convergence.forwardPath,
      ...convergence.backwardPath,
      ...anchors,
    ]);

  const evidence =
    unique(
      evidenceIds
        .map(
          (id) =>
            eventById(
              graph,
              id,
            )?.label,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    ).slice(
      0,
      10,
    );

  const relations =
    relationEvidence(
      graph,
      evidenceIds,
    );

  const relationKinds =
    unique(
      relations.map(
        (relation) =>
          relation.kind,
      ),
    );

  const strongRelations =
    relations.filter(
      (relation) =>
        relation.strength >=
        0.5,
    ).length;

  const weakRelations =
    relations.length -
    strongRelations;

  const contrastCount =
    relations.filter(
      (relation) =>
        relation.kind ===
        "contrasts",
    ).length;

  const recurrenceCount =
    relations.filter(
      (relation) =>
        relation.kind ===
          "recontextualizes" ||
        relation.kind ===
          "repeats",
    ).length;

  const concreteCount =
    evidenceIds.filter(
      (id) =>
        isConcreteDetail(
          graph,
          id,
        ),
    ).length;

  const unresolved =
    graph.unresolvedTensions[0] ??
    (
      lens === "neutral"
        ? "Which supplied detail deserves attention next?"
        : "What does this relationship mean?"
    );

  const specificity =
    metric(
      concreteCount *
        0.18 +
        (evidence.length / 8) *
          0.52 +
        strongRelations *
          0.06 +
        convergence.convergence *
          0.1,
    );

  const novelty =
    metric(
      0.24 +
        contrastCount *
          0.17 +
        recurrenceCount *
          0.1 +
        relationKinds.length *
          0.05 +
        convergence.convergence *
          0.16,
    );

  const informationValue =
    metric(
      0.24 +
        relationKinds.length *
          0.1 +
        specificity *
          0.34 +
        convergence.convergence *
          0.16,
    );

  const uncertainty =
    metric(
      0.18 +
        (unresolved
          ? 0.16
          : 0) +
        weakRelations *
          0.035 +
        Math.min(
          trajectory.length,
          5,
        ) *
          0.04,
    );

  const attentionPotential =
    metric(
      novelty * 0.28 +
        uncertainty * 0.25 +
        informationValue *
          0.35 +
        (contrastCount
          ? 0.12
          : 0),
    );

  const consequencePotential =
    metric(
      (trajectory.length >= 3
        ? 0.28
        : 0.1) +
        recurrenceCount *
          0.11 +
        contrastCount *
          0.09 +
        convergence.convergence *
          0.1,
    );

  const callbackPotential =
    metric(
      (graph.recurringSignals
        .length
        ? 0.32
        : 0.06) +
        recurrenceCount *
          0.14 +
        convergence.convergence *
          0.08,
    );

  const compressionPotential =
    metric(
      0.34 +
        specificity *
          0.27 +
        Math.min(
          relationKinds.length,
          4,
        ) *
          0.08,
    );

  const repetitionRisk =
    metric(
      Math.max(
        0,
        (evidenceIds.length - 3) *
          0.06,
      ) +
        (relationKinds.length <=
        1
          ? 0.16
          : 0),
    );

  /*
   * A weak graph relation is uncertainty.
   * It is never automatically treated as invented truth.
   */
  const truthRisk = 0.02;

  const lensFit =
    lens === "neutral"
      ? 0.5
      : metric(
          0.16 +
            (lens ===
              "comedy" &&
            contrastCount
              ? 0.34
              : 0) +
            (lens ===
              "romance" &&
            relationKinds.includes(
              "converges",
            )
              ? 0.34
              : 0) +
            (lens ===
              "horror" &&
            relationKinds.includes(
              "changes",
            )
              ? 0.34
              : 0) +
            (lens ===
              "sentimental" &&
            recurrenceCount
              ? 0.34
              : 0) +
            (lens ===
              "absurd" &&
            contrastCount &&
            concreteCount
              ? 0.34
              : 0),
        );

  const score =
    metric(
      novelty * 0.12 +
        uncertainty * 0.09 +
        informationValue *
          0.16 +
        attentionPotential *
          0.17 +
        consequencePotential *
          0.11 +
        callbackPotential *
          0.08 +
        compressionPotential *
          0.1 +
        specificity *
          0.07 +
        convergence.convergence *
          0.1 +
        lensFit * 0.06 -
        repetitionRisk * 0.05 -
        truthRisk * 0.05,
    );

  const endpointEvent =
    convergence.endpointId
      ? eventById(
          graph,
          convergence.endpointId,
        )
      : undefined;

  const payoff =
    endpointEvent?.label ??
    (
      lens === "comedy"
        ? "End on the strongest supplied contrast, letting the viewer perform the joke."
        : lens === "horror"
          ? "End on an ordinary supplied detail carrying a newly unsettling meaning."
          : lens === "romance"
            ? "End on a supplied detail whose meaning deepens through the observed connection."
            : lens === "sentimental"
              ? "End on the returning supplied detail after its context has changed."
              : lens === "absurd"
                ? "End by compressing several concrete supplied details into their strangest grounded relationship."
                : "End when the strongest supplied relationship has been understood."
    );

  const hypothesis = [
    `${subject ? `${subject}: ` : ""}the supplied evidence converges on a ${lens} reading.`,
    `Forward/backward convergence: ${convergence.convergence}.`,
    "This is a creative hypothesis, not a new fact.",
  ];

  const distinctiveness =
    metric(
      0.5 +
        convergence.convergence *
          0.5,
    );

  return {
    id: `movie-${rank}-${lens}`,
    lens,
    anchorEventIds:
      evidenceIds.slice(
        0,
        8,
      ),
    supportingRelationKinds:
      relationKinds,
    trajectory,
    payoff,
    unresolvedQuestion:
      unresolved,
    evidence,
    hypothesis,
    truthRisk,
    novelty,
    specificity,
    informationValue,
    uncertainty,
    attentionPotential,
    consequencePotential,
    callbackPotential,
    compressionPotential,
    repetitionRisk,
    distinctiveness,
    score,
  };
}

/**
 * Generate competing movies from one immutable reality graph, then
 * diversity-gate them.
 */
export function searchLatentMovieCandidates(
  input: {
    graph: RealityGraph;
    subject?: string;
    lens?: string;
    limit?: number;
  },
): LatentMovieCandidate[] {
  if (
    !input.graph.events.length
  ) {
    return [];
  }

  const lenses =
    requestedLenses(
      input.lens,
    );

  const candidates =
    lenses.map(
      (candidateLens, index) =>
        buildCandidate(
          input.graph,
          input.subject,
          candidateLens,
          index + 1,
        ),
    );

  return selectDistinctMovieCandidates(
    candidates,
    Math.max(
      1,
      Math.min(
        input.limit ?? 6,
        8,
      ),
    ),
  );
}