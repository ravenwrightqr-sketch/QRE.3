/**
 * SATANICO HYPOTHESIS COMPETITION
 *
 * The evidence search finds possible latent structures. This layer asks a
 * harder universal question: which structure best explains the selected
 * reality with the fewest assumptions while leaving the strongest observer
 * discovery gap?
 *
 * This is cognition, not a second author. RealityGraph remains immutable and
 * hypotheses are never allowed to manufacture facts.
 */
import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import type { SatanicoInferenceOpportunity } from "./authorSatanicoEvidenceSearch.js";

export type SatanicoHypothesis = {
  kind: SatanicoInferenceOpportunity["kind"];
  evidenceEventIds: string[];
  anchorEventIds: string[];
  supportEventIds: string[];
  evidenceCoverage: number;
  anchorCoverage: number;
  temporalCoherence: number;
  relationalCoherence: number;
  explanatoryCompression: number;
  counterEvidence: number;
  unsupportedAssumptionRisk: number;
  observerGap: number;
  mechanismEvidenceFit: number;
  score: number;
};

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const unique = (values: readonly string[]): string[] => [...new Set(values.filter(Boolean))];

const labelsFor = (graph: RealityGraph, ids: readonly string[]): string[] =>
  ids.map((id) => graph.events.find((event) => event.id === id)?.label?.toLowerCase() ?? "");

function candidateIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((event) => event.id === id);
}

function temporalCoherence(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  const span = (Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1);
  return metric(span);
}

function relationalCoherence(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 0;
  let linked = 0;
  let strength = 0;
  let possible = 0;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      possible += 1;
      const relation = graph.relations
        .filter((item) =>
          ((item.from === ids[i] && item.to === ids[j]) ||
            (item.from === ids[j] && item.to === ids[i])) &&
          item.strength > 0.35,
        )
        .sort((a, b) => b.strength - a.strength)[0];
      if (relation) {
        linked += 1;
        strength += relation.strength;
      }
    }
  }
  return metric(
    (linked / Math.max(1, possible)) * 0.55 +
      (strength / Math.max(1, possible)) * 0.45,
  );
}

function mechanismCounterEvidence(
  graph: RealityGraph,
  opportunity: SatanicoInferenceOpportunity,
): number {
  const ids = opportunity.ids;
  if (ids.length < 3) return 1;

  const labels = labelsFor(graph, ids);
  const hasStateLanguage = labels.some((value) =>
    /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|happy|proud|calm|excited|confident|changed|different|new|old|quiet|wild)\b/i.test(value),
  );
  const hasContinuation = labels.some((value) =>
    /\b(?:again|returned|return|back|still|later|repeated|repeat|continued|kept)\b/i.test(value),
  );
  const relations = graph.relations.filter(
    (relation) => ids.includes(relation.from) && ids.includes(relation.to),
  );

  switch (opportunity.kind) {
    case "state_transformation":
      return hasStateLanguage || relations.some((relation) => relation.kind === "changes") ? 0 : 0.32;
    case "callback":
    case "invariant":
      return hasContinuation || relations.some((relation) => relation.kind === "repeats" || relation.kind === "recontextualizes") ? 0 : 0.28;
    case "contrast":
      return relations.some((relation) => relation.kind === "contrasts" || relation.kind === "recontextualizes") ? 0 : 0.3;
    case "origin_outcome":
      return relations.some((relation) => relation.kind === "causes" || relation.kind === "changes") ? 0 : 0.22;
    case "relational_role":
      return relations.length >= 2 ? 0 : 0.24;
    case "preference_constellation":
      return labels.filter((value) => /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/i.test(value)).length >= 2 ? 0 : 0.25;
    case "heterogeneous_convergence":
      return new Set(labels).size >= 3 ? 0 : 0.2;
  }
}

function mechanismEvidenceFit(
  graph: RealityGraph,
  opportunity: SatanicoInferenceOpportunity,
): number {
  const ids = opportunity.ids;
  const labels = labelsFor(graph, ids);
  const relations = graph.relations.filter(
    (relation) => ids.includes(relation.from) && ids.includes(relation.to),
  );
  const relationKinds = new Set(relations.map((relation) => relation.kind));
  const continuation = labels.filter((value) =>
    /\b(?:again|returned|return|back|still|later|repeated|repeat|continued|kept|same)\b/i.test(value),
  ).length;
  const states = labels.filter((value) =>
    /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|happy|proud|calm|excited|confident|changed|different|new|old|quiet|wild)\b/i.test(value),
  ).length;
  const preference = labels.filter((value) =>
    /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/i.test(value),
  ).length;
  const firstSignal = labels.filter((value) => /\b(?:first|initial|began|started|opening|origin|once|early)\b/i.test(value)).length;
  const outcomeSignal = labels.filter((value) => /\b(?:success|popular|sold out|hit|grew|growth|biggest|most)\b/i.test(value)).length;

  switch (opportunity.kind) {
    case "callback": return metric(Math.min(1, continuation / 2) * 0.6 + (relationKinds.has("recontextualizes") || relationKinds.has("repeats") ? 0.4 : 0));
    case "invariant": return metric(Math.min(1, continuation / 2) * 0.45 + (relationKinds.has("repeats") || relationKinds.has("recontextualizes") ? 0.35 : 0) + Math.min(0.2, ids.length / 10));
    case "state_transformation": return metric(Math.min(1, states / 2) * 0.5 + (relationKinds.has("changes") ? 0.5 : 0));
    case "contrast": return metric((relationKinds.has("contrasts") ? 0.55 : 0) + (relationKinds.has("recontextualizes") ? 0.3 : 0) + Math.min(0.15, states / 10));
    case "origin_outcome": return metric(Math.min(1, firstSignal / 1) * 0.45 + Math.min(1, outcomeSignal / 1) * 0.35 + (relationKinds.has("causes") || relationKinds.has("changes") ? 0.2 : 0));
    case "preference_constellation": return metric(Math.min(1, preference / 3) * 0.7 + Math.min(0.3, ids.length / 12));
    case "heterogeneous_convergence": return metric(Math.min(1, relationKinds.size / 3) * 0.55 + (new Set(labels).size >= 3 ? 0.25 : 0) + (1 - Math.min(1, continuation / 3)) * 0.2);
    case "relational_role": {
      const contexts = new Set(labels.flatMap((label) => label.split(/\W+/).filter((token) => token.length >= 4)));
      const specificSignals = Math.min(1, (continuation + states + preference + firstSignal + outcomeSignal + relationKinds.size) / 8);
      return metric(Math.min(1, contexts.size / 16) * 0.45 + Math.min(1, relationKinds.size / 3) * 0.25 + (1 - specificSignals) * 0.3);
    }
  }
}

function unsupportedAssumptionRisk(
  evidenceCoverage: number,
  anchorCoverage: number,
  opportunity: SatanicoInferenceOpportunity,
): number {
  const efficiency = Math.min(1, 1.6 / Math.max(2, opportunity.ids.length));
  return metric(
    (1 - evidenceCoverage) * 0.55 +
      (1 - anchorCoverage) * 0.3 +
      (1 - efficiency) * 0.15,
  );
}

function observerGap(
  opportunity: SatanicoInferenceOpportunity,
  temporal: number,
  ambiguity: number,
): number {
  const delayed = ["callback", "invariant", "origin_outcome"].includes(opportunity.kind) ? 1 : 0.55;
  return metric(
    temporal * 0.32 +
      ambiguity * 0.38 +
      delayed * 0.2 +
      Math.min(1, opportunity.ids.length / 5) * 0.1,
  );
}

function ambiguity(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity): number {
  const kinds = new Set(
    graph.relations
      .filter((relation) => opportunity.ids.includes(relation.from) && opportunity.ids.includes(relation.to))
      .map((relation) => relation.kind),
  );
  return metric(
    Math.min(1, kinds.size / 4) * 0.6 +
      Math.min(1, new Set(opportunity.ids).size / 5) * 0.4,
  );
}

export function rankSatanicoHypotheses(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  opportunities: readonly SatanicoInferenceOpportunity[],
): SatanicoHypothesis[] {
  const selectedIds = new Set(candidateIds(candidate));
  return opportunities
    .map((opportunity) => {
      const evidenceEventIds = unique(opportunity.ids.filter((id) => selectedIds.has(id)));
      const anchorEventIds = unique(opportunity.anchorIds.filter((id) => selectedIds.has(id)));
      const supportEventIds = unique(opportunity.supportIds.filter((id) => selectedIds.has(id)));
      const evidenceCoverage = metric(evidenceEventIds.length / Math.max(1, opportunity.ids.length));
      const anchorCoverage = metric(anchorEventIds.length / Math.max(1, opportunity.anchorIds.length));
      const temporal = temporalCoherence(graph, opportunity.ids);
      const relational = relationalCoherence(graph, evidenceEventIds);
      const compression = metric(1.5 / Math.max(2, opportunity.ids.length));
      const counterEvidence = mechanismCounterEvidence(graph, opportunity);
      const fit = mechanismEvidenceFit(graph, opportunity);
      const unsupported = unsupportedAssumptionRisk(evidenceCoverage, anchorCoverage, opportunity);
      const gap = observerGap(opportunity, temporal, ambiguity(graph, opportunity));
      const score = metric(
        opportunity.score * 0.16 +
          fit * 0.16 +
          evidenceCoverage * 0.2 +
          anchorCoverage * 0.1 +
          temporal * 0.08 +
          relational * 0.08 +
          compression * 0.06 +
          gap * 0.18 -
          counterEvidence * 0.08 -
          unsupported * 0.18,
      );

      return {
        kind: opportunity.kind,
        evidenceEventIds,
        anchorEventIds,
        supportEventIds,
        evidenceCoverage,
        anchorCoverage,
        temporalCoherence: temporal,
        relationalCoherence: relational,
        explanatoryCompression: compression,
        counterEvidence,
        unsupportedAssumptionRisk: unsupported,
        observerGap: gap,
        mechanismEvidenceFit: fit,
        score,
      };
    })
    .filter((hypothesis) => hypothesis.evidenceEventIds.length >= 2)
    .sort((a, b) =>
      b.score - a.score ||
      b.observerGap - a.observerGap ||
      a.unsupportedAssumptionRisk - b.unsupportedAssumptionRisk,
    );
}

export function strongestSatanicoHypothesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  opportunities: readonly SatanicoInferenceOpportunity[],
): SatanicoHypothesis | undefined {
  return rankSatanicoHypotheses(graph, candidate, opportunities)[0];
}
