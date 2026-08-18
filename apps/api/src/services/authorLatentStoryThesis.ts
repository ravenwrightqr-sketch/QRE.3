/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts an already-selected LatentMovieCandidate into a compact semantic
 * thesis that downstream layers can preserve without inventing a second movie.
 *
 * The thesis is structural cognition, not prose generation.
 *
 * Rules:
 *   - payoff is not a semantic turn
 *   - the carrier must participate in the selected turn
 *   - sealing evidence must occur after the turn when possible
 *   - counterfactual dependency measures path dependence, not graph density
 *
 * This module is domain-neutral. No example, industry, object, or entity type
 * is special-cased here.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  LatentStoryThesis,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function eventLabel(graph: RealityGraph, id: string): string {
  return graph.events.find((event) => event.id === id)?.label ?? "";
}

function endpointId(candidate: LatentMovieCandidate): string {
  const lastStep = candidate.trajectory[candidate.trajectory.length - 1];
  const ids = lastStep?.eventIds ?? [];
  return ids[ids.length - 1] ?? "";
}

function relationBetween(
  graph: RealityGraph,
  from: string,
  to: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === from && relation.to === to) ||
        (relation.from === to && relation.to === from),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function relationPriority(kind: RealityRelation["kind"]): number {
  switch (kind) {
    case "contrasts":
      return 1;
    case "recontextualizes":
      return 0.95;
    case "changes":
      return 0.85;
    case "repeats":
      return 0.8;
    case "converges":
      return 0.7;
    case "before":
    case "after":
      return 0.65;
    case "involves":
      return 0.5;
    default:
      return 0.4;
  }
}

function meaningfulTurnSteps(
  candidate: LatentMovieCandidate,
): Array<{
  step: LatentMovieTrajectoryStep;
  index: number;
}> {
  return candidate.trajectory
    .map((step, index) => ({ step, index }))
    .filter(
      ({ step }) =>
        step.operation !== "establish" &&
        step.operation !== "payoff" &&
        step.eventIds.length >= 2,
    );
}

function strongestStructuralTurn(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): {
  step: LatentMovieTrajectoryStep;
  index: number;
  relation: RealityRelation;
} | undefined {
  const explicit = meaningfulTurnSteps(candidate)
    .map(({ step, index }) => {
      const relation = relationBetween(
        graph,
        step.eventIds[0] ?? "",
        step.eventIds[1] ?? "",
      );
      return relation
        ? {
            step,
            index,
            relation,
            score:
              relation.strength * 0.75 +
              relationPriority(relation.kind) * 0.25,
          }
        : undefined;
    })
    .filter(
      (
        value,
      ): value is {
        step: LatentMovieTrajectoryStep;
        index: number;
        relation: RealityRelation;
        score: number;
      } => Boolean(value),
    )
    .sort((a, b) => b.score - a.score);

  if (explicit.length) {
    return explicit[0];
  }

  const endpoint = endpointId(candidate);
  const support = unique(
    candidate.trajectory.flatMap(
      (step) => step.eventIds,
    ),
  ).filter((id) => id !== endpoint);

  const fallback: Array<{
    from: string;
    to: string;
    relation: RealityRelation;
  }> = [];

  for (let index = 0; index < support.length; index += 1) {
    for (let next = index + 1; next < support.length; next += 1) {
      const relation = relationBetween(
        graph,
        support[index],
        support[next],
      );
      if (relation) {
        fallback.push({
          from: support[index],
          to: support[next],
          relation,
        });
      }
    }
  }

  const best = fallback.sort((a, b) => {
    const aScore =
      a.relation.strength * 0.75 +
      relationPriority(a.relation.kind) * 0.25;
    const bScore =
      b.relation.strength * 0.75 +
      relationPriority(b.relation.kind) * 0.25;
    return bScore - aScore;
  })[0];

  if (!best) return undefined;

  const synthetic: LatentMovieTrajectoryStep = {
    order: 2,
    operation:
      best.relation.kind === "contrasts"
        ? "contrast"
        : best.relation.kind === "recontextualizes"
          ? "reframe"
          : best.relation.kind === "repeats"
            ? "recur"
            : best.relation.kind === "converges"
              ? "converge"
              : best.relation.kind === "changes"
                ? "reveal"
                : "consequence",
    eventIds: [best.from, best.to],
    viewerChange: `${best.relation.kind}: ${eventLabel(graph, best.from)} -> ${eventLabel(graph, best.to)}.`,
    nextQuestion: "What later supplied evidence makes this change matter?",
  };

  return {
    step: synthetic,
    index: 1,
    relation: best.relation,
  };
}

function buildInitialReading(
  candidate: LatentMovieCandidate,
): string {
  const first = candidate.trajectory.find(
    (step) => step.operation === "establish",
  );

  return clean(
    first?.viewerChange ||
      candidate.evidence[0] ||
      "The supplied evidence establishes an initial state.",
  );
}

function buildSemanticTurn(
  graph: RealityGraph,
  turn:
    | {
        step: LatentMovieTrajectoryStep;
        index: number;
        relation: RealityRelation;
      }
    | undefined,
): string {
  if (!turn) return "";

  const from = eventLabel(
    graph,
    turn.step.eventIds[0] ?? "",
  );
  const to = eventLabel(
    graph,
    turn.step.eventIds[1] ?? "",
  );

  if (!from || !to) return "";

  return clean(
    `The reading changes through ${turn.relation.kind}: ${from} -> ${to}.`,
  );
}

function chooseCarrierIds(
  graph: RealityGraph,
  turn:
    | {
        step: LatentMovieTrajectoryStep;
        index: number;
        relation: RealityRelation;
      }
    | undefined,
  candidate: LatentMovieCandidate,
): string[] {
  if (!turn) return [];

  const endpoint = endpointId(candidate);
  const ids = turn.step.eventIds.filter(
    (id) => id !== endpoint,
  );

  if (ids.length <= 1) return ids;

  return ids
    .map((id) => ({
      id,
      laterParticipation: candidate.trajectory
        .slice(turn.index + 1)
        .filter((step) => step.eventIds.includes(id)).length,
      relationStrength: graph.relations
        .filter(
          (relation) =>
            relation.from === id ||
            relation.to === id,
        )
        .reduce(
          (sum, relation) =>
            sum + relation.strength,
          0,
        ),
    }))
    .sort(
      (a, b) =>
        b.laterParticipation -
          a.laterParticipation ||
        b.relationStrength -
          a.relationStrength,
    )
    .slice(0, 1)
    .map((item) => item.id);
}

function chooseSealingIds(
  graph: RealityGraph,
  turn:
    | {
        step: LatentMovieTrajectoryStep;
        index: number;
        relation: RealityRelation;
      }
    | undefined,
  carriers: readonly string[],
  candidate: LatentMovieCandidate,
): string[] {
  if (!turn) return [];

  const carrierSet = new Set(carriers);
  const candidates: Array<{
    id: string;
    score: number;
  }> = [];

  for (
    let index = turn.index + 1;
    index < candidate.trajectory.length;
    index += 1
  ) {
    const step = candidate.trajectory[index];

    for (const id of step.eventIds) {
      if (carrierSet.has(id)) continue;

      const carrierRelation = carriers.some((carrier) =>
        Boolean(
          relationBetween(
            graph,
            carrier,
            id,
          ),
        ),
      );

      candidates.push({
        id,
        score:
          (step.operation === "payoff"
            ? 0.2
            : 0.7) +
          (carrierRelation ? 0.3 : 0),
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id)
    .filter(
      (id, index, values) =>
        values.indexOf(id) === index,
    )
    .slice(0, 2);
}

function buildPayoffDependency(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  carriers: readonly string[],
): string {
  const endpoint = endpointId(candidate);

  if (!endpoint) {
    return "";
  }

  const carrier = carriers[0];
  if (carrier) {
    const relation = relationBetween(
      graph,
      endpoint,
      carrier,
    );

    if (relation) {
      return `The supplied endpoint depends on its ${relation.kind} relationship with ${eventLabel(graph, carrier)}.`;
    }
  }

  const lastMeaningful = candidate.trajectory
    .slice(0, -1)
    .flatMap((step) => step.eventIds)
    .find((id) => id !== endpoint);

  if (lastMeaningful) {
    return `The supplied endpoint follows the selected trajectory from ${eventLabel(graph, lastMeaningful)}.`;
  }

  return "";
}

function counterfactualDependency(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  turn:
    | {
        step: LatentMovieTrajectoryStep;
        index: number;
        relation: RealityRelation;
      }
    | undefined,
  carriers: readonly string[],
): number {
  if (!turn || !carriers.length) return 0;

  const meaningful = candidate.trajectory.filter(
    (step) =>
      step.operation !== "establish" &&
      step.operation !== "payoff",
  );

  const carrier = carriers[0];
  const laterSteps = meaningful.filter((step) =>
    candidate.trajectory.indexOf(step) > turn.index,
  );

  const dependentLaterSteps = laterSteps.filter((step) => {
    if (step.eventIds.includes(carrier)) return true;

    return step.eventIds.some((id) =>
      Boolean(
        relationBetween(
          graph,
          carrier,
          id,
        ),
      ),
    );
  });

  const downstream =
    laterSteps.length > 0
      ? dependentLaterSteps.length /
        laterSteps.length
      : 0;

  const turnAnchored = turn.step.eventIds.includes(
    carrier,
  )
    ? 1
    : 0;

  const endpoint = endpointId(candidate);
  const endpointLinked = endpoint
    ? Boolean(
        relationBetween(
          graph,
          carrier,
          endpoint,
        ),
      )
    : false;

  return metric(
    downstream * 0.5 +
      turnAnchored * 0.3 +
      (endpointLinked ? 0.2 : 0),
  );
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const turn = strongestStructuralTurn(
    graph,
    candidate,
  );

  const carrierEventIds = chooseCarrierIds(
    graph,
    turn,
    candidate,
  );

  const sealingEventIds = chooseSealingIds(
    graph,
    turn,
    carrierEventIds,
    candidate,
  ).filter(
    (id) => !carrierEventIds.includes(id),
  );

  return {
    initialReading:
      buildInitialReading(candidate),
    semanticTurn:
      buildSemanticTurn(
        graph,
        turn,
      ),
    carrierEventIds,
    sealingEventIds,
    payoffDependency:
      buildPayoffDependency(
        graph,
        candidate,
        carrierEventIds,
      ),
    counterfactualDependency:
      counterfactualDependency(
        graph,
        candidate,
        turn,
        carrierEventIds,
      ),
  };
}
