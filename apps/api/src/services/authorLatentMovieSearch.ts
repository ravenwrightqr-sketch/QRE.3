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

function overlap(left: string, right: string): number {
  const a = new Set(
    clean(left)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );

  const b = new Set(
    clean(right)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );

  if (!a.size || !b.size) return 0;

  let hits = 0;

  for (const token of a) {
    if (b.has(token)) hits += 1;
  }

  return hits / Math.max(1, Math.min(a.size, b.size));
}

function eventById(graph: RealityGraph, id: string) {
  return graph.events.find((event) => event.id === id);
}

function relationKindsByEvidence(graph: RealityGraph): RealityRelation["kind"][] {
  const ranked = new Map<RealityRelation["kind"], { strength: number; count: number }>();

  for (const relation of graph.relations) {
    const current = ranked.get(relation.kind) ?? { strength: 0, count: 0 };
    current.strength += relation.strength;
    current.count += 1;
    ranked.set(relation.kind, current);
  }

  return [...ranked.entries()]
    .sort(([, a], [, b]) =>
      b.strength + b.count * 0.05 - (a.strength + a.count * 0.05),
    )
    .map(([kind]) => kind);
}

function requestedLenses(lens?: string): string[] {
  const value = clean(lens);
  if (!value) return ["neutral"];

  return [value, "neutral"].filter(
    (candidate, index, values) => values.indexOf(candidate) === index,
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
    .filter(
      (relation) =>
        ((relation.from === from && relation.to === to) ||
          (relation.from === to && relation.to === from)) &&
        (!preferredKind || relation.kind === preferredKind),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function specificityScore(graph: RealityGraph, eventId: string): number {
  const event = eventById(graph, eventId);
  if (!event) return 0;

  const tokens = new Set(
    event.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );

  return metric(
    Math.min(8, tokens.size) * 0.07 +
      Math.min(8, event.entities.length) * 0.04,
  );
}

/** Reality owns the endpoint. Movie convergence never replaces it. */
function endpointIdFor(
  _graph: RealityGraph,
  convergence: LatentMovieConvergence,
): string {
  return convergence.endpointId;
}

function chooseAnchors(
  graph: RealityGraph,
  focus: RealityRelation["kind"] | undefined,
  endpointId: string,
): string[] {
  const incident = new Map<string, number>();

  for (const relation of graph.relations) {
    if (focus && relation.kind !== focus) continue;

    incident.set(
      relation.from,
      (incident.get(relation.from) ?? 0) + relation.strength,
    );
    incident.set(
      relation.to,
      (incident.get(relation.to) ?? 0) + relation.strength,
    );
  }

  const ranked = graph.events
    .map((event, index) => ({
      id: event.id,
      score:
        (incident.get(event.id) ?? 0) * 0.62 +
        specificityScore(graph, event.id) * 0.28 +
        (event.id === endpointId ? 0.16 : 0) -
        index * 0.0005,
    }))
    .sort((a, b) => b.score - a.score);

  const anchors = ranked
    .slice(0, Math.min(5, graph.events.length))
    .map((item) => item.id);

  if (endpointId && !anchors.includes(endpointId)) anchors.push(endpointId);
  return unique(anchors);
}

function relationPriority(kind: RealityRelation["kind"]): number {
  switch (kind) {
    case "contrasts":
      return 1;
    case "recontextualizes":
      return 0.96;
    case "changes":
      return 0.9;
    case "repeats":
      return 0.82;
    case "converges":
      return 0.72;
    case "before":
    case "after":
      return 0.66;
    default:
      return 0.5;
  }
}

function chooseIntermediateRelationship(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  endpointId: string,
  preferredKind?: RealityRelation["kind"],
): {
  from: string;
  to: string;
  relation: RealityRelation;
} | undefined {
  const payoffStep = trajectory.find((step) => step.operation === "payoff");
  const payoffIds = payoffStep?.eventIds ?? [];
  const actualEndpointId = payoffIds[payoffIds.length - 1] ?? endpointId;
  const existing = new Set(trajectory.flatMap((step) => step.eventIds));

  const candidates: Array<{
    from: string;
    to: string;
    relation: RealityRelation;
    score: number;
  }> = [];

  for (const relation of graph.relations) {
    if (preferredKind && relation.kind !== preferredKind) continue;

    if (
      relation.from === endpointId ||
      relation.to === endpointId ||
      relation.from === actualEndpointId ||
      relation.to === actualEndpointId ||
      relation.from === relation.to
    ) {
      continue;
    }

    const fromKnown = existing.has(relation.from);
    const toKnown = existing.has(relation.to);
    if (fromKnown === toKnown) continue;

    const from = fromKnown ? relation.from : relation.to;
    const to = fromKnown ? relation.to : relation.from;

    candidates.push({
      from,
      to,
      relation,
      score: relation.strength * 0.75 + relationPriority(relation.kind) * 0.25,
    });
  }

  return candidates.sort((a, b) => b.score - a.score)[0];
}

function chooseSealingEvidence(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  endpointId: string,
): {
  eventId: string;
  relatedTo: string;
  relation: RealityRelation;
  score: number;
} | undefined {
  const meaningful = trajectory.filter(
    (step) => step.operation !== "establish" && step.operation !== "payoff",
  );
  if (!meaningful.length) return undefined;

  const seedIds = unique(meaningful.flatMap((step) => step.eventIds));
  const used = new Set(trajectory.flatMap((step) => step.eventIds));
  const endpointStep = trajectory.find((step) => step.operation === "payoff");
  const payoffIds = endpointStep?.eventIds ?? [];
  const actualEndpointId = payoffIds[payoffIds.length - 1] ?? endpointId;

  const candidates: Array<{
    eventId: string;
    relatedTo: string;
    relation: RealityRelation;
    score: number;
  }> = [];

  for (const relation of graph.relations) {
    const relatedTo = seedIds.includes(relation.from)
      ? relation.from
      : seedIds.includes(relation.to)
        ? relation.to
        : "";

    if (!relatedTo) continue;

    const eventId = relation.from === relatedTo ? relation.to : relation.from;
    if (!eventId || used.has(eventId)) continue;
    if (eventId === endpointId || eventId === actualEndpointId) continue;

    const relatedIndex = graph.events.findIndex((event) => event.id === relatedTo);
    const candidateIndex = graph.events.findIndex((event) => event.id === eventId);
    const laterEvidence = candidateIndex > relatedIndex ? 0.22 : 0;

    candidates.push({
      eventId,
      relatedTo,
      relation,
      score:
        relation.strength * 0.62 +
        relationPriority(relation.kind) * 0.23 +
        laterEvidence * 0.15,
    });
  }

  return candidates.sort((a, b) => b.score - a.score)[0];
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

  const sourceIndex = new Map(
    graph.events.map((event, index) => [
      event.id,
      index,
    ]),
  );

  const endpointEvent = eventById(
    graph,
    endpointId,
  );

  /*
   * The endpoint is sacred and terminal.
   * It may not appear as an ordinary intermediate cut.
   */
  const eligibleEvents = graph.events.filter(
    (event) => event.id !== endpointId,
  );

  if (!eligibleEvents.length) {
    return [];
  }

  /*
   * Start from the supplied world, not from the most salient relation cluster.
   *
   * Convergence is evidence for later movement; it does not get to choose the
   * opening of the whole film.
   */
  const opening =
    [...eligibleEvents].sort(
      (a, b) =>
        (sourceIndex.get(a.id) ?? 0) -
        (sourceIndex.get(b.id) ?? 0),
    )[0];

  if (!opening) {
    return [];
  }

  const ordered: string[] = [
    opening.id,
  ];

  const used = new Set<string>(
    ordered,
  );

  const relationKindScore = (
    kind: RealityRelation["kind"],
  ): number => {
    switch (kind) {
      case "contrasts":
        return 1;
      case "recontextualizes":
        return 0.96;
      case "changes":
        return 0.9;
      case "repeats":
        return 0.84;
      case "converges":
        return 0.74;
      case "before":
      case "after":
        return 0.68;
      default:
        return 0.5;
    }
  };

  const eventSimilarity = (
    leftId: string,
    rightId: string,
  ): number => {
    const left = eventById(
      graph,
      leftId,
    );
    const right = eventById(
      graph,
      rightId,
    );

    if (!left || !right) {
      return 0;
    }

    const leftTokens = new Set(
      clean(left.label)
        .toLowerCase()
        .replace(/[^a-z0-9'’-]+/g, " ")
        .split(/\s+/)
        .filter(
          (token) =>
            token.length >= 3,
        ),
    );

    const rightTokens = new Set(
      clean(right.label)
        .toLowerCase()
        .replace(/[^a-z0-9'’-]+/g, " ")
        .split(/\s+/)
        .filter(
          (token) =>
            token.length >= 3,
        ),
    );

    if (
      !leftTokens.size ||
      !rightTokens.size
    ) {
      return 0;
    }

    let hits = 0;

    for (const token of leftTokens) {
      if (rightTokens.has(token)) {
        hits += 1;
      }
    }

    return (
      hits /
      Math.max(
        1,
        Math.min(
          leftTokens.size,
          rightTokens.size,
        ),
      )
    );
  };

  const noveltyFor = (
    candidateId: string,
  ): number => {
    if (!ordered.length) {
      return 1;
    }

    const maximumSimilarity = Math.max(
      ...ordered.map(
        (selectedId) =>
          eventSimilarity(
            selectedId,
            candidateId,
          ),
      ),
      0,
    );

    return clamp01(
      1 - maximumSimilarity,
    );
  };

  const continuityFor = (
    candidateId: string,
  ): number => {
    const previousId =
      ordered[ordered.length - 1];

    if (!previousId) {
      return 0.5;
    }

    const previousIndex =
      sourceIndex.get(
        previousId,
      );

    const candidateIndex =
      sourceIndex.get(
        candidateId,
      );

    if (
      previousIndex === undefined ||
      candidateIndex === undefined
    ) {
      return 0.5;
    }

    if (
      candidateIndex >
      previousIndex
    ) {
      return 1;
    }

    if (
      candidateIndex ===
      previousIndex
    ) {
      return 0.5;
    }

    return 0.25;
  };

  const relationFor = (
    fromId: string,
    toId: string,
  ): RealityRelation | undefined =>
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

  /*
   * Five ordinary cuts plus the final supplied endpoint gives enough room for
   * a real little film without forcing every source event into the sequence.
   */
  const ordinaryTarget = Math.min(
    5,
    Math.max(
      3,
      eligibleEvents.length,
    ),
  );

  while (
    ordered.length <
    ordinaryTarget
  ) {
    const candidates = eligibleEvents
      .filter(
        (event) =>
          !used.has(event.id),
      )
      .map((event) => {
        const relationStrength =
          Math.max(
            ...ordered.map(
              (selectedId) =>
                relationFor(
                  selectedId,
                  event.id,
                )?.strength ?? 0,
            ),
            0,
          );

        const relation =
          ordered.length
            ? ordered
                .map(
                  (selectedId) =>
                    relationFor(
                      selectedId,
                      event.id,
                    ),
                )
                .filter(
                  (
                    value,
                  ): value is RealityRelation =>
                    Boolean(value),
                )
                .sort(
                  (a, b) =>
                    b.strength -
                    a.strength,
                )[0]
            : undefined;

        const structural =
          relation
            ? relationKindScore(
                relation.kind,
              )
            : 0;

        const novelty =
          noveltyFor(
            event.id,
          );

        const continuity =
          continuityFor(
            event.id,
          );

        const specificity =
          specificityScore(
            graph,
            event.id,
          );

        /*
         * Once the opening is established, novelty carries enough weight to
         * escape a salient semantic cluster while connection remains required.
         */
        const score =
          relationStrength * 0.24 +
          structural * 0.12 +
          novelty * 0.36 +
          continuity * 0.16 +
          specificity * 0.12;

        return {
          id: event.id,
          score,
          novelty,
          continuity,
        };
      })
      .sort(
        (a, b) => {
          if (
            b.score !==
            a.score
          ) {
            return b.score -
              a.score;
          }

          if (
            b.novelty !==
            a.novelty
          ) {
            return b.novelty -
              a.novelty;
          }

          return (
            (sourceIndex.get(
              a.id,
            ) ?? 0) -
            (sourceIndex.get(
              b.id,
            ) ?? 0)
          );
        },
      );

    const next =
      candidates[0];

    if (!next) {
      break;
    }

    ordered.push(
      next.id,
    );

    used.add(
      next.id,
    );
  }

  /*
   * Endpoint enters exactly once, at the end.
   */
  if (
    endpointId &&
    !used.has(endpointId)
  ) {
    ordered.push(
      endpointId,
    );
  }

  const trajectory: LatentMovieTrajectoryStep[] =
    [];

  const first =
    eventById(
      graph,
      ordered[0] ?? "",
    );

  if (first) {
    trajectory.push({
      order: 1,
      operation: "establish",
      eventIds: [
        first.id,
      ],
      viewerChange:
        `Establish supplied evidence: ${first.label}.`,
      nextQuestion:
        "What part of this world deserves the next cut?",
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

    if (
      !fromId ||
      !toId
    ) {
      continue;
    }

    const from =
      eventById(
        graph,
        fromId,
      );

    const to =
      eventById(
        graph,
        toId,
      );

    if (
      !from ||
      !to
    ) {
      continue;
    }
   if (toId === endpointId) {
  trajectory.push({
    order: trajectory.length + 1,
    operation: "payoff",
    eventIds: [endpointId],
    viewerChange: `The supplied endpoint lands after the accumulated path: ${to.label}.`,
    nextQuestion: "What is now true at the supplied ending?",
  });
  continue;
}

    const relation =
      relationFor(
        fromId,
        toId,
      );

    trajectory.push({
      order:
        trajectory.length +
        1,
      operation:
        relation
          ? operationForRelation(
              relation.kind,
            )
          : "converge",
      eventIds: [
        toId,
      ],
      viewerChange:
        relation
          ? `${relation.kind}: ${from.label} -> ${to.label}.`
          : `A new supplied part of the world enters: ${to.label}.`,
      nextQuestion:
        relation?.kind ===
        "contrasts"
          ? "What expectation changes here?"
          : "What does this make newly meaningful?",
    });
  }

  trajectory.forEach(
    (step, index) => {
      step.order =
        index + 1;
    },
  );

  /*
   * Hard invariant:
   * - no event appears in an ordinary step more than once
   * - endpoint appears only in payoff
   */
  const seen = new Set<string>();

  return trajectory.filter(
    (step) => {
      if (
        step.operation ===
          "payoff"
      ) {
        return true;
      }

      const fresh =
        step.eventIds.every(
          (id) =>
            id !== endpointId &&
            !seen.has(id),
        );

      if (fresh) {
        for (const id of step.eventIds) {
          seen.add(id);
        }
      }

      return fresh;
    },
  );
}

function candidateScore(input: {
  graph: RealityGraph;
  trajectory: readonly LatentMovieTrajectoryStep[];
  evidence: readonly string[];
  relations: readonly RealityRelation[];
  convergence: LatentMovieConvergence;
  endpointId: string;
}): Omit<
  LatentMovieCandidate,
  | "id"
  | "lens"
  | "anchorEventIds"
  | "supportingRelationKinds"
  | "trajectory"
  | "payoff"
  | "unresolvedQuestion"
  | "evidence"
  | "hypothesis"
  | "distinctiveness"
  | "score"
> & { score: number; distinctiveness: number } {
  const contrastCount = input.relations.filter(
    (relation) => relation.kind === "contrasts",
  ).length;

  const reframeCount = input.relations.filter(
    (relation) => relation.kind === "recontextualizes",
  ).length;

  const recurrenceCount = input.relations.filter(
    (relation) =>
      relation.kind === "repeats" ||
      relation.kind === "recontextualizes",
  ).length;

  const relationKinds = unique(
    input.relations.map((relation) => relation.kind),
  );

  const strongRelations = input.relations.filter(
    (relation) => relation.strength >= 0.5,
  ).length;

  const weakRelations = input.relations.length - strongRelations;

  const eventSpecificity =
    input.evidence.reduce((sum, label) => {
      const event = input.graph.events.find(
        (candidate) => candidate.label === label,
      );
      return sum + (event ? specificityScore(input.graph, event.id) : 0);
    }, 0) / Math.max(1, input.evidence.length);

  const endpointDependent = input.trajectory.some(
    (step) =>
      step.eventIds.includes(input.endpointId) &&
      step.operation === "payoff",
  );

  const meaningfulSteps = input.trajectory.filter(
    (step) => step.operation !== "establish" && step.operation !== "payoff",
  ).length;

  const sealingOpportunity =
    chooseSealingEvidence(
      input.graph,
      input.trajectory,
      input.endpointId,
    ) !== undefined;

  const trajectoryCompleteness = sealingOpportunity
    ? metric(meaningfulSteps >= 2 ? 1 : meaningfulSteps === 1 ? 0.42 : 0.16)
    : metric(meaningfulSteps >= 1 ? 0.82 : 0.3);

  const truthRisk = metric(
    weakRelations * 0.012 + (!endpointDependent ? 0.08 : 0),
  );

  const specificity = metric(
    eventSpecificity * 0.55 +
      Math.min(1, input.evidence.length / 6) * 0.25 +
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
      input.convergence.convergence * 0.22 +
      Math.min(1, input.trajectory.length / 5) * 0.12,
  );

  const uncertainty = metric(
    input.graph.unresolvedTensions.length * 0.08 +
      weakRelations * 0.035 +
      (input.convergence.convergence < 0.45 ? 0.14 : 0.02),
  );

  const attentionPotential = metric(
    novelty * 0.32 +
      uncertainty * 0.22 +
      informationValue * 0.34 +
      (contrastCount ? 0.12 : 0),
  );

  const consequencePotential = metric(
    Math.min(1, input.trajectory.length / 5) * 0.38 +
      contrastCount * 0.08 +
      reframeCount * 0.1 +
      input.convergence.convergence * 0.18,
  );

  const callbackPotential = metric(
    (input.graph.recurringSignals.length ? 0.34 : 0.04) +
      recurrenceCount * 0.12,
  );

  const compressionPotential = metric(
    0.32 + specificity * 0.32 + Math.min(relationKinds.length, 4) * 0.08,
  );

  const repetitionRisk = metric(
    Math.max(0, (input.evidence.length - 4) * 0.06) +
      (relationKinds.length <= 1 ? 0.14 : 0),
  );

  const distinctiveness = metric(
    0.34 +
      novelty * 0.28 +
      informationValue * 0.22 +
      (relationKinds.length > 1 ? 0.12 : 0),
  );

  const score = metric(
    novelty * 0.14 +
      uncertainty * 0.07 +
      informationValue * 0.17 +
      attentionPotential * 0.16 +
      consequencePotential * 0.1 +
      callbackPotential * 0.07 +
      compressionPotential * 0.08 +
      specificity * 0.07 +
      trajectoryCompleteness * 0.12 +
      input.convergence.convergence * 0.1 +
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
  const convergence = findLatentMovieConvergence(graph, {
    preferredRelationKinds: relationKindsByEvidence(graph),
    maxDepth: 4,
    maxEndpoints: 3,
    maxOpenings: 5,
  });

  const endpointId = endpointIdFor(graph, convergence);
  const anchors = chooseAnchors(graph, focus, endpointId);
  const trajectory = buildTrajectory(graph, anchors, convergence, focus);

  const evidenceIds = unique([
    ...trajectory.flatMap((step) => step.eventIds),
    ...anchors,
    ...(convergence.forwardPath ?? []),
    ...(convergence.backwardPath ?? []),
  ]);

  const evidence = unique(
    evidenceIds
      .map((id) => eventById(graph, id)?.label)
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 10);

  const relations = relationBetweenEvidence(graph, evidenceIds);
  const relationKinds = unique(relations.map((relation) => relation.kind));

  const metrics = candidateScore({
    graph,
    trajectory,
    evidence,
    relations,
    convergence,
    endpointId,
  });

  const endpointEvent = endpointId
    ? eventById(graph, endpointId)
    : undefined;

  const payoff = endpointEvent?.label ?? "the supplied sequence endpoint";
  const focusText = focus ? ` Focus relation: ${focus}.` : "";

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
        set.has(relation.from) && set.has(relation.to),
    )
    .sort((a, b) => b.strength - a.strength);
}

export function searchLatentMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  lens?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  if (!input.graph.events.length) return [];

  const lenses = requestedLenses(input.lens);
  const relationFocuses = relationKindsByEvidence(input.graph).slice(0, 5);
  const focuses = relationFocuses.length ? relationFocuses : [undefined];
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
        Math.max(8, Math.min((input.limit ?? 6) * 2, 14))
      ) {
        break;
      }
    }

    if (
      candidates.length >=
      Math.max(8, Math.min((input.limit ?? 6) * 2, 14))
    ) {
      break;
    }
  }

  return selectDistinctMovieCandidates(
    candidates,
    Math.max(1, Math.min(input.limit ?? 6, 8)),
  );
}
