/**
 * QRE LATENT MOVIE SEARCH · CANONICAL HYPOTHESIS LAYER
 *
 * RealityGraph is immutable source evidence. This module searches for
 * materially different interpretations of the same evidence without turning
 * hypotheses into facts.
 *
 * Core law:
 *
 *   lens = framing preference
 *   relations = evidence
 *   trajectory = discovered movement
 *   endpoint = supplied landing
 *
 * A lens may bias a search. It may not dictate what the movie is about.
 * A domain term may be meaningful. It may not be meaningful merely because
 * this module has seen the term in historical examples.
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
  String(value ?? "").replace(/\s+/g, " ").trim();

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

function unique<T>(values: readonly T[]): T[] {
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

function relationStrengthSum(
  graph: RealityGraph,
  kind?: RealityRelation["kind"],
): number {
  return graph.relations
    .filter((relation) =>
      kind ? relation.kind === kind : true,
    )
    .reduce(
      (sum, relation) =>
        sum + relation.strength,
      0,
    );
}

function relationKindsByEvidence(
  graph: RealityGraph,
): RealityRelation["kind"][] {
  const ranked = new Map<
    RealityRelation["kind"],
    { strength: number; count: number }
  >();

  for (const relation of graph.relations) {
    const current =
      ranked.get(relation.kind) ?? {
        strength: 0,
        count: 0,
      };

    current.strength += relation.strength;
    current.count += 1;
    ranked.set(relation.kind, current);
  }

  return [...ranked.entries()]
    .sort(([, a], [, b]) =>
      b.strength + b.count * 0.05 -
      (a.strength + a.count * 0.05),
    )
    .map(([kind]) => kind);
}

function requestedLenses(lens?: string): string[] {
  const value = clean(lens);
  if (!value) {
    return ["neutral"];
  }

  return [
    value,
    "neutral",
  ].filter(
    (candidate, index, values) =>
      values.indexOf(candidate) === index,
  );
}

function operationForRelation(
  relation: RealityRelation["kind"],
): LatentMovieTrajectoryStep["operation"] {
  switch (relation) {
    case "contrasts":
      return "contrast";
    case "recontextualizes":
      return "reframe";
    case "changes":
      return "reveal";
    case "repeats":
      return "recur";
    case "converges":
      return "converge";
    case "before":
    case "after":
      return "consequence";
    case "involves":
      return "reveal";
    default:
      return "converge";
  }
}

function relationBetween(
  graph: RealityGraph,
  from: string,
  to: string,
  preferredKind?: RealityRelation["kind"],
): RealityRelation | undefined {
  return graph.relations
    .filter((relation) =>
      ((relation.from === from &&
        relation.to === to) ||
        (relation.from === to &&
          relation.to === from)) &&
      (!preferredKind ||
        relation.kind === preferredKind),
    )
    .sort(
      (a, b) =>
        b.strength - a.strength,
    )[0];
}

function specificityScore(
  graph: RealityGraph,
  eventId: string,
): number {
  const event = eventById(
    graph,
    eventId,
  );

  if (!event) return 0;

  const tokens = new Set(
    event.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 3,
      ),
  );

  return metric(
    Math.min(8, tokens.size) * 0.07 +
    Math.min(8, event.entities.length) * 0.04,
  );
}

function endpointIdFor(
  graph: RealityGraph,
  convergence: LatentMovieConvergence,
): string {
  return (
    convergence.endpointId ||
    convergence.endpointCandidates[0] ||
    graph.events.at(-1)?.id ||
    ""
  );
}

function chooseAnchors(
  graph: RealityGraph,
  focus: RealityRelation["kind"] | undefined,
  endpointId: string,
): string[] {
  const incident = new Map<
    string,
    number
  >();

  for (const relation of graph.relations) {
    if (
      focus &&
      relation.kind !== focus
    ) {
      continue;
    }

    incident.set(
      relation.from,
      (incident.get(relation.from) ?? 0) +
        relation.strength,
    );

    incident.set(
      relation.to,
      (incident.get(relation.to) ?? 0) +
        relation.strength,
    );
  }

  const ranked = graph.events
    .map((event, index) => ({
      id: event.id,
      score:
        (incident.get(event.id) ?? 0) *
          0.62 +
        specificityScore(
          graph,
          event.id,
        ) * 0.28 +
        (event.id === endpointId
          ? 0.16
          : 0) -
        index * 0.0005,
    }))
    .sort(
      (a, b) =>
        b.score - a.score,
    );

  const anchors = ranked
    .slice(
      0,
      Math.min(
        5,
        graph.events.length,
      ),
    )
    .map((item) => item.id);

  if (
    endpointId &&
    !anchors.includes(endpointId)
  ) {
    anchors.push(endpointId);
  }

  return unique(anchors);
}

function buildTrajectory(
  graph: RealityGraph,
  anchors: readonly string[],
  convergence: LatentMovieConvergence,
  focus?: RealityRelation["kind"],
): LatentMovieTrajectoryStep[] {
  const endpointId = endpointIdFor(
    graph,
    convergence,
  );

  const ordered = unique(
    convergence.forwardPath.length
      ? convergence.forwardPath
      : anchors,
  );

  if (!ordered.length) {
    return [];
  }

  const trajectory: LatentMovieTrajectoryStep[] = [];
  const firstId = ordered[0];
  const first = eventById(
    graph,
    firstId,
  );

  if (first) {
    trajectory.push({
      order: 1,
      operation: "establish",
      eventIds: [firstId],
      viewerChange:
        `Establish supplied evidence: ${first.label}.`,
      nextQuestion:
        "What relationship in the evidence deserves the next cut?",
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

    const from = eventById(
      graph,
      fromId,
    );
    const to = eventById(
      graph,
      toId,
    );

    if (!from || !to) {
      continue;
    }

    const relation =
      relationBetween(
        graph,
        fromId,
        toId,
        focus,
      ) ??
      relationBetween(
        graph,
        fromId,
        toId,
      );

    if (toId === endpointId) {
      trajectory.push({
        order: trajectory.length + 1,
        operation: "payoff",
        eventIds: [
          fromId,
          endpointId,
        ],
        viewerChange:
          `The supplied endpoint lands after the accumulated path: ${to.label}.`,
        nextQuestion:
          "What is now true at the supplied ending?",
      });
      continue;
    }

    if (!relation) {
      continue;
    }

    trajectory.push({
      order: trajectory.length + 1,
      operation:
        operationForRelation(
          relation.kind,
        ),
      eventIds: [
        fromId,
        toId,
      ],
      viewerChange:
        `${relation.kind}: ${from.label} -> ${to.label}.`,
      nextQuestion:
        relation.kind ===
        "contrasts"
          ? "What expectation changes here?"
          : "What does this relationship make newly meaningful?",
    });
  }

  if (
    trajectory.length < 3 &&
    convergence.backwardPath.length
  ) {
    for (
      const id of convergence.backwardPath
    ) {
      if (
        trajectory.some((step) =>
          step.eventIds.includes(id),
        ) ||
        id === endpointId
      ) {
        continue;
      }

      const event = eventById(
        graph,
        id,
      );

      if (!event) continue;

      trajectory.push({
        order: trajectory.length + 1,
        operation: "converge",
        eventIds: [id],
        viewerChange:
          `A supplied detail becomes newly relevant: ${event.label}.`,
        nextQuestion:
          "Does this sharpen, overturn, or complete the current reading?",
      });

      if (trajectory.length >= 5) {
        break;
      }
    }
  }

  return trajectory.slice(0, 6);
}

function candidateScore(input: {
  graph: RealityGraph;
  trajectory: readonly LatentMovieTrajectoryStep[];
  evidence: readonly string[];
  relations: readonly RealityRelation[];
  convergence: LatentMovieConvergence;
  endpointId: string;
}): Omit<LatentMovieCandidate, "id" | "lens" | "anchorEventIds" | "supportingRelationKinds" | "trajectory" | "payoff" | "unresolvedQuestion" | "evidence" | "hypothesis" | "distinctiveness" | "score"> & {
  score: number;
  distinctiveness: number;
} {
  const contrastCount = input.relations.filter(
    (relation) =>
      relation.kind ===
      "contrasts",
  ).length;

  const reframeCount = input.relations.filter(
    (relation) =>
      relation.kind ===
      "recontextualizes",
  ).length;

  const recurrenceCount = input.relations.filter(
    (relation) =>
      relation.kind === "repeats" ||
      relation.kind ===
        "recontextualizes",
  ).length;

  const relationKinds = unique(
    input.relations.map(
      (relation) =>
        relation.kind,
    ),
  );

  const strongRelations =
    input.relations.filter(
      (relation) =>
        relation.strength >= 0.5,
    ).length;

  const weakRelations =
    input.relations.length -
    strongRelations;

  const eventSpecificity =
    input.evidence.reduce(
      (sum, label) => {
        const event = input.graph.events.find(
          (candidate) =>
            candidate.label === label,
        );
        return (
          sum +
          (event
            ? specificityScore(
                input.graph,
                event.id,
              )
            : 0)
        );
      },
      0,
    ) / Math.max(
      1,
      input.evidence.length,
    );

  const endpointDependent =
    input.trajectory.some(
      (step) =>
        step.eventIds.includes(
          input.endpointId,
        ) &&
        step.operation ===
          "payoff",
    );

  const truthRisk = metric(
    weakRelations *
      0.012 +
      (!endpointDependent ? 0.08 : 0),
  );

  const specificity = metric(
    eventSpecificity * 0.55 +
    Math.min(
      1,
      input.evidence.length / 6,
    ) * 0.25 +
    strongRelations * 0.04,
  );

  const novelty = metric(
    0.18 +
    contrastCount * 0.16 +
    reframeCount * 0.13 +
    relationKinds.length * 0.07 +
    input.convergence.convergence * 0.2,
  );

  const informationValue = metric(
    relationKinds.length * 0.1 +
    specificity * 0.36 +
    input.convergence.convergence *
      0.22 +
    Math.min(
      1,
      input.trajectory.length / 5,
    ) * 0.12,
  );

  const uncertainty = metric(
    input.graph.unresolvedTensions.length *
      0.08 +
    weakRelations * 0.035 +
    (input.convergence.convergence <
    0.45
      ? 0.14
      : 0.02),
  );

  const attentionPotential = metric(
    novelty * 0.32 +
    uncertainty * 0.22 +
    informationValue * 0.34 +
    (contrastCount ? 0.12 : 0),
  );

  const consequencePotential = metric(
    Math.min(
      1,
      input.trajectory.length / 5,
    ) * 0.38 +
    contrastCount * 0.08 +
    reframeCount * 0.1 +
    input.convergence.convergence * 0.18,
  );

  const callbackPotential = metric(
    (input.graph.recurringSignals.length
      ? 0.34
      : 0.04) +
    recurrenceCount * 0.12,
  );

  const compressionPotential = metric(
    0.32 +
    specificity * 0.32 +
    Math.min(
      relationKinds.length,
      4,
    ) * 0.08,
  );

  const repetitionRisk = metric(
    Math.max(
      0,
      (input.evidence.length - 4) *
        0.06,
    ) +
    (relationKinds.length <= 1
      ? 0.14
      : 0),
  );

  const distinctiveness = metric(
    0.34 +
    novelty * 0.28 +
    informationValue * 0.22 +
    (relationKinds.length > 1
      ? 0.12
      : 0),
  );

  const score = metric(
    novelty * 0.15 +
    uncertainty * 0.08 +
    informationValue * 0.18 +
    attentionPotential * 0.17 +
    consequencePotential * 0.11 +
    callbackPotential * 0.08 +
    compressionPotential * 0.09 +
    specificity * 0.07 +
    input.convergence.convergence *
      0.11 +
    (endpointDependent ? 0.08 : 0) -
    repetitionRisk * 0.05 -
    truthRisk * 0.06,
  );

  return {
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
    score,
    distinctiveness,
  };
}

function buildCandidate(
  graph: RealityGraph,
  subject: string | undefined,
  lens: string,
  rank: number,
  focus?: RealityRelation["kind"],
): LatentMovieCandidate {
  const convergence =
    findLatentMovieConvergence(
      graph,
      {
        preferredRelationKinds:
          relationKindsByEvidence(graph),
        maxDepth: 4,
        maxEndpoints: 3,
        maxOpenings: 5,
      },
    );

  const endpointId = endpointIdFor(
    graph,
    convergence,
  );

  const anchors = chooseAnchors(
    graph,
    focus,
    endpointId,
  );

  const trajectory =
    buildTrajectory(
      graph,
      anchors,
      convergence,
      focus,
    );

  const evidenceIds = unique([
    ...trajectory.flatMap(
      (step) => step.eventIds,
    ),
    ...anchors,
    ...(convergence.forwardPath ?? []),
    ...(convergence.backwardPath ?? []),
  ]);

  const evidence = unique(
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
  ).slice(0, 10);

  const relations = relationBetweenEvidence(
    graph,
    evidenceIds,
  );

  const relationKinds = unique(
    relations.map(
      (relation) => relation.kind,
    ),
  );

  const metrics = candidateScore({
    graph,
    trajectory,
    evidence,
    relations,
    convergence,
    endpointId,
  });

  const endpointEvent =
    endpointId
      ? eventById(
          graph,
          endpointId,
        )
      : undefined;

  const payoff =
    endpointEvent?.label ??
    "the supplied sequence endpoint";

  const focusText =
    focus
      ? ` Focus relation: ${focus}.`
      : "";

  const hypothesis = [
    `${subject ? `${subject}: ` : ""}the supplied evidence supports a ${lens} reading without changing the source facts.${focusText}`,
    `The movie centers on ${relationKinds.join(", ") || "the strongest available evidence relationship"}.`,
    `The trajectory uses ${evidence.length} supplied evidence anchors and ends at the source-derived endpoint.`,
    "This is a creative hypothesis, never source truth.",
  ];

  const unresolvedQuestion =
    graph.unresolvedTensions[0] ??
    (convergence.openingCandidates.length
      ? "What does the selected opening make newly important?"
      : "What supplied relationship deserves the next cut?");

  return {
    id: `movie-${rank}-${focus ?? "center"}`,
    lens,
    anchorEventIds: evidenceIds.slice(0, 8),
    supportingRelationKinds: relationKinds,
    trajectory,
    payoff,
    unresolvedQuestion,
    evidence,
    hypothesis,
    ...metrics,
  };
}

function relationBetweenEvidence(
  graph: RealityGraph,
  ids: readonly string[],
): RealityRelation[] {
  const set = new Set(ids);
  return graph.relations
    .filter(
      (relation) =>
        set.has(relation.from) &&
        set.has(relation.to),
    )
    .sort(
      (a, b) =>
        b.strength - a.strength,
    );
}

export function searchLatentMovieCandidates(
  input: {
    graph: RealityGraph;
    subject?: string;
    lens?: string;
    limit?: number;
  },
): LatentMovieCandidate[] {
  if (!input.graph.events.length) {
    return [];
  }

  const lenses = requestedLenses(
    input.lens,
  );

  const relationFocuses =
    relationKindsByEvidence(
      input.graph,
    ).slice(0, 5);

  const focuses = relationFocuses.length
    ? relationFocuses
    : [undefined];

  const candidates: LatentMovieCandidate[] = [];
  let rank = 1;

  for (const lens of lenses) {
    for (const focus of focuses) {
      candidates.push(
        buildCandidate(
          input.graph,
          input.subject,
          lens,
          rank,
          focus,
        ),
      );
      rank += 1;

      if (
        candidates.length >=
        Math.max(
          8,
          Math.min(
            (input.limit ?? 6) * 2,
            14,
          ),
        )
      ) {
        break;
      }
    }

    if (
      candidates.length >=
      Math.max(
        8,
        Math.min(
          (input.limit ?? 6) * 2,
          14,
        ),
      )
    ) {
      break;
    }
  }

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
