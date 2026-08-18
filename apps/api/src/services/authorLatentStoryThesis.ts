/**
 * QRE LATENT STORY THESIS · UNIVERSAL DISCOVERY EXTRACTOR
 *
 * Converts an already-selected LatentMovieCandidate into a compact semantic
 * thesis that downstream layers can preserve without inventing a second movie.
 *
 * This module is domain-neutral. It derives meaning from trajectory structure,
 * relation kinds, evidence participation, and endpoint dependency.
 */
import type {
  LatentMovieCandidate,
  LatentStoryThesis,
  RealityGraph,
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

function incidentRelationStrength(graph: RealityGraph, id: string): number {
  return graph.relations
    .filter((relation) => relation.from === id || relation.to === id)
    .reduce((sum, relation) => sum + relation.strength, 0);
}

function relationCountFor(graph: RealityGraph, ids: readonly string[]): number {
  const set = new Set(ids);
  return graph.relations.filter(
    (relation) => set.has(relation.from) && set.has(relation.to),
  ).length;
}

function chooseCarrierIds(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): string[] {
  const endpoint = candidate.trajectory.at(-1)?.eventIds.at(-1) ?? "";

  const scores = unique(candidate.trajectory.flatMap((step) => step.eventIds))
    .filter((id) => id !== endpoint)
    .map((id) => {
      const participation = candidate.trajectory.filter((step) => step.eventIds.includes(id)).length;
      const relationStrength = incidentRelationStrength(graph, id);
      const score = participation * 0.45 + Math.min(1, relationStrength / 2) * 0.55;
      return { id, score };
    })
    .sort((a, b) => b.score - a.score);

  return scores.slice(0, 2).map((item) => item.id);
}

function chooseSealingIds(candidate: LatentMovieCandidate, carriers: readonly string[]): string[] {
  const carrierSet = new Set(carriers);
  return unique(
    candidate.trajectory
      .slice(1)
      .flatMap((step) => step.eventIds)
      .filter((id) => !carrierSet.has(id)),
  ).slice(-2);
}

function buildInitialReading(candidate: LatentMovieCandidate): string {
  const first = candidate.trajectory.find((step) => step.operation === "establish") ?? candidate.trajectory[0];
  return clean(first?.viewerChange || candidate.evidence[0] || "The supplied evidence establishes an initial state.");
}

function buildSemanticTurn(candidate: LatentMovieCandidate): string {
  const turning = candidate.trajectory.find(
    (step) =>
      step.operation === "contrast" ||
      step.operation === "reframe" ||
      step.operation === "reveal" ||
      step.operation === "consequence",
  ) ?? candidate.trajectory[1];

  return clean(
    turning?.viewerChange ||
      candidate.unresolvedQuestion ||
      "A later supplied relationship changes the reading of what came before.",
  );
}

function buildPayoffDependency(graph: RealityGraph, candidate: LatentMovieCandidate): string {
  const endpoint = candidate.trajectory.at(-1)?.eventIds.at(-1) ?? "";

  if (!endpoint) {
    return "The selected movie has no independently identified endpoint dependency.";
  }

  const preceding = candidate.trajectory.slice(0, -1).flatMap((step) => step.eventIds);
  const direct = graph.relations.filter(
    (relation) =>
      (relation.from === endpoint && preceding.includes(relation.to)) ||
      (relation.to === endpoint && preceding.includes(relation.from)),
  );

  const strongest = direct.slice().sort((a, b) => b.strength - a.strength)[0];

  if (strongest) {
    const other = strongest.from === endpoint ? strongest.to : strongest.from;
    return `The supplied endpoint depends on its relationship with ${eventLabel(graph, other)}.`;
  }

  return "The supplied endpoint is earned through the selected trajectory rather than a newly invented outcome.";
}

function counterfactualDependency(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  carriers: readonly string[],
): number {
  const supportIds = unique(candidate.trajectory.flatMap((step) => step.eventIds));
  const totalRelations = Math.max(1, relationCountFor(graph, supportIds));

  const carrierRelations = carriers.reduce(
    (sum, id) =>
      sum +
      graph.relations.filter(
        (relation) =>
          (relation.from === id && supportIds.includes(relation.to)) ||
          (relation.to === id && supportIds.includes(relation.from)),
      ).length,
    0,
  );

  const trajectoryCoverage =
    carriers.reduce(
      (sum, id) =>
        sum + candidate.trajectory.filter((step) => step.eventIds.includes(id)).length,
      0,
    ) /
    Math.max(1, candidate.trajectory.length * Math.max(1, carriers.length));

  const endpoint = candidate.trajectory.at(-1)?.eventIds.at(-1) ?? "";
  const endpointRelation = endpoint
    ? carriers.some((id) =>
        graph.relations.some(
          (relation) =>
            (relation.from === endpoint && relation.to === id) ||
            (relation.to === endpoint && relation.from === id),
        ),
      )
    : false;

  return metric(
    (carrierRelations / totalRelations) * 0.5 +
      trajectoryCoverage * 0.3 +
      (endpointRelation ? 0.2 : 0),
  );
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const carrierEventIds = chooseCarrierIds(graph, candidate);
  const sealingEventIds = chooseSealingIds(candidate, carrierEventIds);

  return {
    initialReading: buildInitialReading(candidate),
    semanticTurn: buildSemanticTurn(candidate),
    carrierEventIds,
    sealingEventIds,
    payoffDependency: buildPayoffDependency(graph, candidate),
    counterfactualDependency: counterfactualDependency(graph, candidate, carrierEventIds),
  };
}
