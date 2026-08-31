/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts an already-selected LatentMovieCandidate into a compact semantic
 * thesis that downstream layers can preserve without inventing a second movie.
 *
 * The thesis is structural cognition, not prose generation.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  LatentStoryThesis,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import {
  deriveSequenceBackedCreativeInterpretations,
  type CreativeInterpretation,
} from "./authorCreativeInterpretation.js";

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
    case "contrasts": return 1;
    case "recontextualizes": return 0.95;
    case "changes": return 0.85;
    case "repeats": return 0.8;
    case "converges": return 0.7;
    case "before":
    case "after": return 0.65;
    case "involves": return 0.5;
    default: return 0.4;
  }
}

type StructuralTurn = {
  step: LatentMovieTrajectoryStep;
  index: number;
  relation?: RealityRelation;
  interpretation?: string;
};

function meaningfulTurnSteps(
  candidate: LatentMovieCandidate,
): Array<{ step: LatentMovieTrajectoryStep; index: number }> {
  return candidate.trajectory
    .map((step, index) => ({ step, index }))
    .filter(
      ({ step }) =>
        step.operation !== "establish" &&
        step.operation !== "payoff" &&
        step.eventIds.length >= 2,
    );
}

function interpretationScore(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretation: CreativeInterpretation,
): number {
  const trajectoryIds = unique(
    candidate.trajectory.flatMap((step) => step.eventIds),
  );
  const trajectoryIndex = new Map(
    trajectoryIds.map((id, index) => [id, index]),
  );

  const supported = interpretation.evidenceEventIds.filter((id) =>
    trajectoryIndex.has(id),
  ).length;

  const coverage =
    interpretation.evidenceEventIds.length > 0
      ? supported / interpretation.evidenceEventIds.length
      : 0;

  const positions = interpretation.evidenceEventIds
    .map((id) => trajectoryIndex.get(id))
    .filter((value): value is number => value !== undefined);

  const spread =
    positions.length >= 2 && trajectoryIds.length >= 2
      ? (Math.max(...positions) - Math.min(...positions)) /
        Math.max(1, trajectoryIds.length - 1)
      : 0;

  const endpoint = endpointId(candidate);
  const endpointSupport =
    endpoint && interpretation.evidenceEventIds.includes(endpoint)
      ? 1
      : 0;

  const priority: Record<CreativeInterpretation["mechanism"], number> = {
    contrast: 1,
    expectation_shift: 0.96,
    convergence: 0.92,
    consequence: 0.9,
    recurrence: 0.88,
    state_change: 0.84,
    continuation: 0.8,
  };

  return metric(
    interpretation.confidence * 0.35 +
      coverage * 0.2 +
      spread * 0.18 +
      endpointSupport * 0.12 +
      priority[interpretation.mechanism] * 0.1,
  );
}

function selectCreativeInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  interpretations: readonly CreativeInterpretation[],
): CreativeInterpretation | undefined {
  return interpretations
    .map((interpretation, index) => ({
      interpretation,
      index,
      score: interpretationScore(graph, candidate, interpretation),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.interpretation.confidence - left.interpretation.confidence ||
        right.interpretation.evidenceEventIds.length - left.interpretation.evidenceEventIds.length ||
        left.index - right.index,
    )[0]?.interpretation;
}

function strongestStructuralTurn(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): StructuralTurn | undefined {
  const interpretations = deriveSequenceBackedCreativeInterpretations(
    graph,
    candidate,
  );

  const sequenceInterpretation = selectCreativeInterpretation(
    graph,
    candidate,
    interpretations,
  );

  const sequenceScore = sequenceInterpretation
    ? interpretationScore(graph, candidate, sequenceInterpretation)
    : 0;

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

  const bestExplicit = explicit[0];

  if (
    sequenceInterpretation &&
    (!bestExplicit || sequenceScore >= bestExplicit.score + 0.08)
  ) {
    const operation =
      sequenceInterpretation.mechanism === "contrast"
        ? "contrast"
        : sequenceInterpretation.mechanism === "recurrence"
          ? "recur"
          : sequenceInterpretation.mechanism === "convergence"
            ? "converge"
            : sequenceInterpretation.mechanism === "expectation_shift"
              ? "reframe"
              : sequenceInterpretation.mechanism === "state_change"
                ? "reveal"
                : "consequence";

    return {
      step: {
        order: 2,
        operation,
        eventIds: sequenceInterpretation.evidenceEventIds,
        viewerChange: sequenceInterpretation.statement,
        nextQuestion:
          "What does this newly meaningful relationship make possible next?",
      },
      index: 1,
      interpretation: sequenceInterpretation.statement,
    };
  }

  if (bestExplicit) return bestExplicit;

  const endpoint = endpointId(candidate);
  const support = unique(
    candidate.trajectory.flatMap((step) => step.eventIds),
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

  const operation =
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
              : "consequence";

  return {
    step: {
      order: 2,
      operation,
      eventIds: [best.from, best.to],
      viewerChange: `${best.relation.kind}: ${eventLabel(graph, best.from)} -> ${eventLabel(graph, best.to)}.`,
      nextQuestion: "What later supplied evidence makes this change matter?",
    },
    index: 1,
    relation: best.relation,
  };
}

function buildInitialReading(candidate: LatentMovieCandidate): string {
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
  turn: StructuralTurn | undefined,
): string {
  if (!turn) return "";
  if (turn.interpretation) return clean(turn.interpretation);
  if (!turn.relation) return "";

  const from = eventLabel(graph, turn.step.eventIds[0] ?? "");
  const to = eventLabel(graph, turn.step.eventIds[1] ?? "");
  return from && to
    ? clean(`The reading changes through ${turn.relation.kind}: ${from} -> ${to}.`)
    : "";
}

function chooseCarrierIds(
  graph: RealityGraph,
  turn: StructuralTurn | undefined,
  candidate: LatentMovieCandidate,
): string[] {
  if (!turn) return [];

  const endpoint = endpointId(candidate);
  const ids = turn.step.eventIds.filter((id) => id !== endpoint);
  if (ids.length <= 1) return ids;

  return ids
    .map((id) => ({
      id,
      laterParticipation: candidate.trajectory
        .slice(turn.index + 1)
        .filter((step) => step.eventIds.includes(id)).length,
      relationStrength: graph.relations
        .filter((relation) => relation.from === id || relation.to === id)
        .reduce((sum, relation) => sum + relation.strength, 0),
    }))
    .sort(
      (a, b) =>
        b.laterParticipation - a.laterParticipation ||
        b.relationStrength - a.relationStrength,
    )
    .slice(0, 1)
    .map((item) => item.id);
}

function chooseSealingIds(
  graph: RealityGraph,
  turn: StructuralTurn | undefined,
  carriers: readonly string[],
  candidate: LatentMovieCandidate,
): string[] {
  if (!turn) return [];

  const carrierSet = new Set(carriers);
  const endpoint = endpointId(candidate);
  const candidates: Array<{ id: string; score: number }> = [];
  const pushCandidate = (id: string, score: number) => {
    if (!id || carrierSet.has(id) || id === endpoint) return;
    if (!candidates.some((item) => item.id === id)) {
      candidates.push({ id, score });
    }
  };

  for (let index = turn.index + 1; index < candidate.trajectory.length; index += 1) {
    const step = candidate.trajectory[index];
    for (const id of step.eventIds) {
      const carrierRelation = carriers.some((carrier) =>
        Boolean(relationBetween(graph, carrier, id)),
      );
      pushCandidate(
        id,
        (step.operation === "payoff" ? 0.2 : 0.7) +
          (carrierRelation ? 0.3 : 0),
      );
    }
  }

  if (!candidates.length) {
    const trajectoryIds = new Set(
      candidate.trajectory.flatMap((step) => step.eventIds),
    );

    for (const relation of graph.relations) {
      const touchesCarrier = carriers.some(
        (carrier) =>
          relation.from === carrier ||
          relation.to === carrier,
      );
      if (!touchesCarrier) continue;

      const otherId = carriers.includes(relation.from)
        ? relation.to
        : relation.from;

      if (trajectoryIds.has(otherId) || otherId === endpoint) continue;

      pushCandidate(
        otherId,
        relation.strength * 0.75 +
          relationPriority(relation.kind) * 0.25,
      );
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id)
    .slice(0, 2);
}

function buildPayoffDependency(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  carriers: readonly string[],
): string {
  const endpoint = endpointId(candidate);
  if (!endpoint) return "";

  const carrier = carriers[0];
  if (carrier) {
    const relation = relationBetween(graph, endpoint, carrier);
    if (relation) {
      return `The supplied endpoint depends on its ${relation.kind} relationship with ${eventLabel(graph, carrier)}.`;
    }
  }

  const lastMeaningful = candidate.trajectory
    .slice(0, -1)
    .flatMap((step) => step.eventIds)
    .find((id) => id !== endpoint);

  return lastMeaningful
    ? `The supplied endpoint follows the selected trajectory from ${eventLabel(graph, lastMeaningful)}.`
    : "";
}

function counterfactualDependency(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  turn: StructuralTurn | undefined,
  carriers: readonly string[],
): number {
  if (!turn || !carriers.length) return 0;

  const meaningful = candidate.trajectory.filter(
    (step) =>
      step.operation !== "establish" &&
      step.operation !== "payoff",
  );

  const carrier = carriers[0];
  const laterSteps = meaningful.filter(
    (step) => candidate.trajectory.indexOf(step) > turn.index,
  );

  const dependentLaterSteps = laterSteps.filter((step) => {
    if (step.eventIds.includes(carrier)) return true;
    return step.eventIds.some((id) =>
      Boolean(relationBetween(graph, carrier, id)),
    );
  });

  const downstream =
    laterSteps.length > 0
      ? dependentLaterSteps.length / laterSteps.length
      : 0;

  const turnAnchored = turn.step.eventIds.includes(carrier) ? 1 : 0;
  const endpoint = endpointId(candidate);
  const endpointLinked = endpoint
    ? Boolean(relationBetween(graph, carrier, endpoint))
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
  const turn = strongestStructuralTurn(graph, candidate);
  const carrierEventIds = chooseCarrierIds(graph, turn, candidate);
  const sealingEventIds = chooseSealingIds(
    graph,
    turn,
    carrierEventIds,
    candidate,
  ).filter((id) => !carrierEventIds.includes(id));

  const turnFromId = turn?.step.eventIds[0] ?? "";
  const turnToId = turn?.step.eventIds[1] ?? "";

  return {
    initialReading: buildInitialReading(candidate),
    semanticTurn: buildSemanticTurn(graph, turn),
    beforeMeaning: turnFromId
      ? [eventLabel(graph, turnFromId)].filter(Boolean)
      : [],
    afterMeaning: turnToId
      ? [eventLabel(graph, turnToId)].filter(Boolean)
      : [],
    beforeEventIds: turnFromId ? [turnFromId] : [],
    afterEventIds: turnToId ? [turnToId] : [],
    relationKind: turn?.relation?.kind,
    carrierEventIds,
    sealingEventIds,
    payoffDependency: buildPayoffDependency(
      graph,
      candidate,
      carrierEventIds,
    ),
    counterfactualDependency: counterfactualDependency(
      graph,
      candidate,
      turn,
      carrierEventIds,
    ),
  };
}
