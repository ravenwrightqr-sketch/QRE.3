/**
 * QRE UNIVERSAL MOVIE SEARCH
 *
 * One universal search over immutable RealityGraph evidence.
 *
 * The lens is a perceptual policy. It does not invent events or conclusions;
 * it changes which grounded opportunity, relationship and sequence operation
 * deserves attention.
 *
 * Satanico remains the universal inference authority. The lens narrows the
 * search space; Satanico decides which resulting constellation gives a human
 * the strongest opportunity to discover meaning without being told it.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";
import {
  discoverSatanicoInferenceOpportunities,
  type SatanicoInferenceOpportunity,
} from "./authorSatanicoEvidenceSearch.js";
import { scoreSatanicoObserverInference } from "./authorSatanicoInference.js";
import {
  lensOperationAffinity,
  lensOpportunityAffinity,
  lensRelationAffinity,
  resolveLensPolicy,
  type LensPolicy,
} from "./authorLensPolicy.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper)\b/i;
const STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|different|changed|clean|broken|fixed|gone|back|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;
const IDENTITY_CALLBACK = /\b(?:same|remember(?:ed|s|ing)?|still)\b/i;

function event(graph: RealityGraph, id: string) { return graph.events.find((item) => item.id === id); }
function label(graph: RealityGraph, id: string): string { return clean(event(graph, id)?.label); }
function position(graph: RealityGraph, id: string): number { return graph.events.findIndex((item) => item.id === id); }
function structure(graph: RealityGraph, id: string) { return graph.eventStructure?.find((item) => item.eventId === id); }

function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter((relation) => (relation.from === left && relation.to === right) || (relation.from === right && relation.to === left))
    .sort((a, b) => b.strength - a.strength)[0];
}

function callbackRelation(relation: RealityRelation | undefined): boolean {
  return Boolean(relation && (relation.kind === "repeats" || relation.kind === "recontextualizes"));
}
function explicitCallback(text: string): boolean { return CONTINUATION.test(text) || IDENTITY_CALLBACK.test(text); }
function lexicalTokens(text: string): Set<string> { return new Set(clean(text).toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3)); }

function sharedTokenScore(left: string, right: string): number {
  const a = lexicalTokens(left), b = lexicalTokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function subjectConnectedIds(graph: RealityGraph, subject?: string): string[] {
  const ids = graph.events.map((item) => item.id);
  if (!ids.length || !clean(subject)) return ids;
  const normalized = clean(subject).toLowerCase();
  const selected = new Set(ids.filter((id) => label(graph, id).toLowerCase().includes(normalized)));
  if (!selected.size) selected.add(ids[0]!);
  const queue = [...selected];
  const seen = new Set(queue);

  while (queue.length) {
    const current = queue.shift()!;
    for (const candidate of ids) {
      if (seen.has(candidate)) continue;
      const relation = relationBetween(graph, current, candidate);
      const structural = Boolean(
        relation &&
        relation.strength >= 0.72 &&
        ["repeats", "recontextualizes", "contrasts", "causes", "changes", "converges"].includes(relation.kind),
      );
      const callback = callbackRelation(relation) || explicitCallback(label(graph, candidate));
      const lexical = sharedTokenScore(label(graph, current), label(graph, candidate)) >= 0.6;
      if (!structural && !callback && !lexical) continue;
      selected.add(candidate);
      seen.add(candidate);
      queue.push(candidate);
    }
  }
  return ids.filter((id) => selected.has(id));
}

function statePair(graph: RealityGraph, ids: readonly string[]): { from: string; to: string; score: number } | undefined {
  let best: { from: string; to: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const left = label(graph, ids[i]!);
    if (!STATE.test(left)) continue;
    for (let j = i + 1; j < ids.length; j += 1) {
      const right = label(graph, ids[j]!);
      if (!STATE.test(right) || left.toLowerCase() === right.toLowerCase()) continue;
      const leftNeg = NEGATIVE.test(left), leftPos = POSITIVE.test(left);
      const rightNeg = NEGATIVE.test(right), rightPos = POSITIVE.test(right);
      const polarity = leftNeg && rightPos ? 1 : leftNeg !== rightNeg ? 0.9 : leftPos !== rightPos ? 0.84 : 0.62;
      const score = polarity + Math.min(0.08, (j - i) * 0.02);
      if (!best || score > best.score) best = { from: ids[i]!, to: ids[j]!, score };
    }
  }
  return best;
}

function eventSpecificity(graph: RealityGraph, id: string): number {
  const item = event(graph, id);
  if (!item) return 0;
  const current = structure(graph, id);
  return metric(
    Math.min(
      1,
      clean(item.label).split(/\s+/).filter(Boolean).length / 10 +
      (item.entities?.length ?? 0) / 14 +
      (current?.objects.length ?? 0) / 10 +
      (current?.actions.length ?? 0) / 10 +
      (current?.semanticTags.length ?? 0) / 16 +
      (item.salient ? 0.16 : 0),
    ),
  );
}

function breadth(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1));
}

function forwardScore(graph: RealityGraph, trajectory: readonly LatentMovieTrajectoryStep[]): number {
  if (trajectory.length < 2) return 0;
  let forward = 0;
  let comparable = 0;
  for (let index = 1; index < trajectory.length; index += 1) {
    const previous = trajectory[index - 1]?.eventIds[0];
    const current = trajectory[index]?.eventIds[0];
    if (!previous || !current) continue;
    const previousPosition = position(graph, previous);
    const currentPosition = position(graph, current);
    if (previousPosition < 0 || currentPosition < 0) continue;
    comparable += 1;
    if (currentPosition > previousPosition) forward += 1;
  }
  if (!comparable) return 0;
  const endpoint = position(graph, trajectory[trajectory.length - 1]?.eventIds[0] ?? "");
  const start = position(graph, trajectory[0]?.eventIds[0] ?? "");
  const endpointProgress = start >= 0 && endpoint >= start && graph.events.length > 1
    ? metric((endpoint - start) / Math.max(1, graph.events.length - 1))
    : 0;
  return metric((forward / comparable) * 0.72 + endpointProgress * 0.28);
}

function operationFor(
  graph: RealityGraph,
  previousId: string | undefined,
  currentId: string,
  index: number,
  final: boolean,
  lens: LensPolicy,
): LatentMovieTrajectoryStep["operation"] {
  if (final) return "payoff";
  const relation = previousId ? relationBetween(graph, previousId, currentId) : undefined;
  const relationOperation: LatentMovieTrajectoryStep["operation"] =
    relation?.kind === "recontextualizes" ? "reframe" :
    relation?.kind === "repeats" ? "recur" :
    relation?.kind === "contrasts" ? "contrast" :
    relation?.kind === "causes" ? "consequence" :
    relation?.kind === "converges" ? "converge" :
    "reveal";

  const options: Array<{ operation: LatentMovieTrajectoryStep["operation"]; score: number }> = [
    { operation: relationOperation, score: 0.55 + (relation?.strength ?? 0) * 0.3 },
  ];

  for (const operation of ["contrast", "reframe", "recur", "converge", "reveal", "consequence"] as const) {
    options.push({ operation, score: lensOperationAffinity(operation, lens) });
  }

  if (previousId && STATE.test(label(graph, previousId)) && STATE.test(label(graph, currentId))) {
    options.push({ operation: "reframe", score: 0.9 });
  }
  if (index > 1 && sharedTokenScore(label(graph, previousId ?? ""), label(graph, currentId)) >= 0.6) {
    options.push({ operation: "recur", score: Math.max(0.78, lensOperationAffinity("recur", lens)) });
  }

  options.sort((a, b) => b.score - a.score);
  return options[0]!.operation;
}

function questionFor(operation: LatentMovieTrajectoryStep["operation"]): string {
  switch (operation) {
    case "contrast": return "What changed the reading?";
    case "reframe": return "What becomes newly meaningful?";
    case "recur": return "Why does this detail return?";
    case "converge": return "What do these details reveal together?";
    case "consequence": return "What follows from what is already here?";
    case "payoff": return "What remains when the pieces meet?";
    default: return "What is becoming noticeable?";
  }
}

function buildTrajectory(graph: RealityGraph, ids: readonly string[], lens: LensPolicy): LatentMovieTrajectoryStep[] {
  const selected = unique(ids).sort((a, b) => position(graph, a) - position(graph, b)).slice(0, 7);
  if (selected.length < 3) return [];

  return selected.map((id, index) => {
    const final = index === selected.length - 1;
    const previousId = index ? selected[index - 1] : undefined;
    const relation = previousId ? relationBetween(graph, previousId, id) : undefined;
    const operation = operationFor(graph, previousId, id, index, final, lens);
    let viewerChange: string;

    if (!previousId) {
      const current = structure(graph, id);
      if (current?.actions[0]) viewerChange = `Establish the supplied action: ${current.actions[0]}.`;
      else if (current?.objects[0]) viewerChange = `Establish the supplied detail: ${current.objects[0]}.`;
      else viewerChange = `Establish the supplied opening: ${label(graph, id)}.`;
    } else if (relation?.kind === "recontextualizes") {
      viewerChange = `A supplied detail changes meaning through ${label(graph, id)}.`;
    } else if (relation?.kind === "repeats") {
      viewerChange = `A supplied detail returns through ${label(graph, id)}.`;
    } else if (relation?.kind === "contrasts") {
      viewerChange = `The supplied contrast changes the reading between ${label(graph, previousId)} and ${label(graph, id)}.`;
    } else if (relation?.kind === "causes") {
      viewerChange = `The supplied consequence follows ${label(graph, previousId)}.`;
    } else if (relation?.kind === "converges") {
      viewerChange = `Separate supplied details converge in ${label(graph, id)}.`;
    } else if (relation?.kind === "changes") {
      viewerChange = `The supplied state or circumstance changes at ${label(graph, id)}.`;
    } else if (final) {
      viewerChange = `Land on the supplied endpoint: ${label(graph, id)}.`;
    } else {
      viewerChange = `Advance through the supplied evidence: ${label(graph, id)}.`;
    }

    return {
      order: index + 1,
      operation,
      eventIds: [id],
      viewerChange,
      nextQuestion: questionFor(operation),
    };
  });
}

function opportunityCoverage(ids: readonly string[], opportunity: SatanicoInferenceOpportunity): number {
  if (!opportunity.ids.length) return 0;
  const source = new Set(ids);
  return metric(opportunity.ids.filter((id) => source.has(id)).length / opportunity.ids.length);
}

function opportunityAffinity(
  graph: RealityGraph,
  ids: readonly string[],
  opportunity: SatanicoInferenceOpportunity,
  lens: LensPolicy,
): number {
  const coverage = opportunityCoverage(ids, opportunity);
  if (!coverage) return 0;
  const anchorCoverage = opportunity.anchorIds.length
    ? opportunity.anchorIds.filter((id) => ids.includes(id)).length / opportunity.anchorIds.length
    : coverage;
  const relationScore = ids.slice(1)
    .map((id, index) => relationBetween(graph, ids[index]!, id))
    .filter((relation): relation is RealityRelation => Boolean(relation))
    .reduce((sum, relation) => sum + lensRelationAffinity(relation, lens), 0) / Math.max(1, ids.length - 1);
  const lensWeight = lensOpportunityAffinity(opportunity, lens);
  return metric(coverage * 0.38 + anchorCoverage * 0.18 + opportunity.score * 0.22 + relationScore * 0.1 + lensWeight * 0.12);
}
function callbackCoverage(graph: RealityGraph, ids: readonly string[]): number {
  if (!ids.length) return 0;

  const linked = ids.filter(
    (id) =>
      graph.relations.some(
        (relation) =>
          (relation.from === id || relation.to === id) &&
          callbackRelation(relation),
      ) ||
      explicitCallback(label(graph, id)),
  ).length;

  return metric(linked / ids.length);
}

function explicitSourceNarrativeStrength(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 3) return 0;
  const structures = ids.map((id) => structure(graph, id));
  const eventDensity = structures.filter((item) => Boolean(item?.actions.length || item?.temporalMarkers.length)).length / ids.length;
  const adjacentRelations = ids.slice(1).filter((id, index) => {
    const relation = relationBetween(graph, ids[index]!, id);
    return Boolean(relation && relation.strength >= 0.72 && relation.kind !== "involves" && relation.kind !== "belongs_to");
  }).length / Math.max(1, ids.length - 1);
  const endpoint = structures.at(-1);
  const endpointSignal = endpoint && /\b(?:departure|completion|transformation|repair|finish|finished|done|left|leave|arrive|arrived|changed|different|fabulous)\b/i.test((endpoint.semanticTags ?? []).join(" ") + " " + (graph.events.at(-1)?.label ?? "")) ? 1 : 0;
  const salience = structures.reduce((sum, item) => sum + (item?.salienceScore ?? 0), 0) / ids.length;
  return metric(eventDensity * 0.42 + adjacentRelations * 0.3 + endpointSignal * 0.14 + salience * 0.14);
}

function candidateScore(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  lens: string | undefined,
  subject: string | undefined,
  policy: LensPolicy,
  opportunities: readonly SatanicoInferenceOpportunity[],
): LatentMovieCandidate | undefined {
  const ids = unique(trajectory.flatMap((step) => step.eventIds));
  if (ids.length < 3) return undefined;
  const evidence = unique(ids.map((id) => label(graph, id)).filter(Boolean));
  const relations = ids.slice(1).map((id, index) => relationBetween(graph, ids[index]!, id)).filter((value): value is RealityRelation => Boolean(value));
  const relationKinds = unique(relations.map((relation) => relation.kind));
  const state = statePair(graph, ids);
  const specificity = metric(ids.reduce((sum, id) => sum + eventSpecificity(graph, id), 0) / ids.length);
  const spread = breadth(graph, ids);
  const order = forwardScore(graph, trajectory);
  const callbacks = callbackCoverage(graph, ids);
  const subjectCoverage = !clean(subject) ? 1 : metric(ids.filter((id) => label(graph, id).toLowerCase().includes(clean(subject).toLowerCase())).length / ids.length);
  const operationAffinity = metric(trajectory.reduce((sum, step) => sum + lensOperationAffinity(step.operation, policy), 0) / trajectory.length);
  const relationAffinity = relations.length ? metric(relations.reduce((sum, relation) => sum + lensRelationAffinity(relation, policy), 0) / relations.length) : 0;
  const satanicoOpportunity = opportunities.reduce((best, opportunity) => Math.max(best, opportunityAffinity(graph, ids, opportunity, policy)), 0);
  const structuralMovement = metric(
    (state?.score ?? 0) * 0.32 +
    Math.min(1, relationKinds.length / 3) * 0.18 +
    (relations.length ? metric(relations.reduce((sum, relation) => sum + relation.strength, 0) / relations.length) : 0) * 0.32 +
    (ids.length >= 5 ? 0.18 : 0),
  );
  const attentionPotential = metric(structuralMovement * 0.22 + specificity * 0.14 + spread * 0.1 + order * 0.08 + callbacks * 0.08 + subjectCoverage * 0.08 + operationAffinity * 0.12 + relationAffinity * 0.08 + satanicoOpportunity * 0.1);
  const consequencePotential = metric(structuralMovement * 0.32 + spread * 0.12 + specificity * 0.1 + callbacks * 0.08 + operationAffinity * 0.18 + satanicoOpportunity * 0.2);
  const informationValue = metric(structuralMovement * 0.28 + specificity * 0.18 + spread * 0.12 + attentionPotential * 0.14 + consequencePotential * 0.1 + satanicoOpportunity * 0.18);
  const repetitionRisk = metric(1 - new Set(evidence.map((value) => value.toLowerCase())).size / Math.max(1, evidence.length));
  const truthRisk = metric(1 - (order * 0.5 + specificity * 0.2 + subjectCoverage * 0.14 + satanicoOpportunity * 0.16));

  const provisional: LatentMovieCandidate = {
    id: "provisional",
    lens: clean(lens) || "NONE",
    distinctiveness: 0,
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: relationKinds,
    trajectory: [...trajectory],
    payoff: evidence[evidence.length - 1] ?? "",
    unresolvedQuestion: trajectory[trajectory.length - 1]?.nextQuestion ?? "What is becoming noticeable?",
    evidence,
    hypothesis: [],
    truthRisk,
    novelty: metric(1 - repetitionRisk),
    specificity,
    informationValue,
    uncertainty: metric((1 - order) * 0.2 + structuralMovement * 0.24 + attentionPotential * 0.18 + satanicoOpportunity * 0.25 + (1 - subjectCoverage) * 0.13),
    attentionPotential,
    consequencePotential,
    callbackPotential: callbacks,
    compressionPotential: metric(Math.min(1, trajectory.length / 5) * 0.36 + operationAffinity * 0.24 + satanicoOpportunity * 0.25 + specificity * 0.15),
    repetitionRisk,
    observerInferencePotential: 0,
    score: 0,
  };

  const observerInferencePotential = scoreSatanicoObserverInference(graph, provisional);
  const score = metric(
    attentionPotential * 0.15 +
    consequencePotential * 0.1 +
    informationValue * 0.08 +
    specificity * 0.06 +
    spread * 0.05 +
    subjectCoverage * 0.06 +
    operationAffinity * 0.08 +
    relationAffinity * 0.06 +
    satanicoOpportunity * 0.18 +
    observerInferencePotential * 0.24 -
    repetitionRisk * 0.08 -
    truthRisk * 0.06,
  );

  return {
    ...provisional,
    observerInferencePotential,
    score,
    hypothesis: [
      "Reality remains immutable and every event retains source provenance.",
      "The lens changes perceptual emphasis rather than creating a domain-specific story.",
      "Satanico evaluates whether the selected evidence gives an observer enough structure to complete the meaning themselves.",
    ],
  };
}

export function searchUniversalMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  lens?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  const limit = Math.max(3, Math.min(12, input.limit ?? 8));
  const sourceIds = input.graph.events.filter((item) => clean(item.label)).map((item) => item.id);
  if (sourceIds.length < 3) return [];

  const policy = resolveLensPolicy(input.lens);
  const opportunities = discoverSatanicoInferenceOpportunities(input.graph, 64);
  const candidates: LatentMovieCandidate[] = [];
  const add = (id: string, ids: readonly string[]) => {
    const trajectory = buildTrajectory(input.graph, ids, policy);
    const candidate = candidateScore(input.graph, trajectory, input.lens, input.subject, policy, opportunities);
    if (candidate) {
      if (id === "movie-source") {
        const sourceSpine = explicitSourceNarrativeStrength(input.graph, ids);
        candidate.score = metric(candidate.score + sourceSpine * 0.2);
        candidate.hypothesis = [
          ...candidate.hypothesis,
          "The supplied moments already form a coherent narrative spine; preserve their event progression and use latent interpretation only to improve realization.",
        ];
      }
      candidates.push({ ...candidate, id });
    }
  };

  add("movie-source", sourceIds);

  const connected = subjectConnectedIds(input.graph, input.subject);
  if (connected.length >= 3 && connected.length < sourceIds.length) add("movie-subject-connected", connected);

  const stateIds = connected.length >= 3 ? connected : sourceIds;
  const state = statePair(input.graph, stateIds);
  if (state) {
    const start = position(input.graph, state.from);
    const end = position(input.graph, state.to);
    const ids = stateIds.filter((id) => {
      const current = position(input.graph, id);
      return current >= start && current <= end + 1;
    });
    if (!ids.includes(stateIds[stateIds.length - 1]!)) ids.push(stateIds[stateIds.length - 1]!);
    add("movie-transformation", ids);
  }

  const rankedOpportunities = [...opportunities]
    .map((opportunity) => {
      const ids = unique(opportunity.ids).sort((a, b) => position(input.graph, a) - position(input.graph, b));
      const relationAffinity = ids.slice(1)
        .map((id, index) => relationBetween(input.graph, ids[index]!, id))
        .filter((relation): relation is RealityRelation => Boolean(relation))
        .reduce((sum, relation) => sum + lensRelationAffinity(relation, policy), 0) / Math.max(1, ids.length - 1);
      const lensWeight = lensOpportunityAffinity(opportunity, policy);
      const rank = opportunity.score * (0.52 + lensWeight * 0.28 + relationAffinity * 0.2);
      return { opportunity, ids, rank };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, Math.max(12, limit * 4));

  for (let index = 0; index < rankedOpportunities.length; index += 1) {
    add(`movie-satanico-${index + 1}`, rankedOpportunities[index]!.ids);
  }

  const relationSeeds = [...input.graph.relations]
    .filter((relation) => !["before", "after", "involves", "belongs_to"].includes(relation.kind))
    .sort((a, b) => (b.strength * 0.45 + lensRelationAffinity(b, policy) * 0.55) - (a.strength * 0.45 + lensRelationAffinity(a, policy) * 0.55))
    .slice(0, 10);

  for (let index = 0; index < relationSeeds.length; index += 1) {
    const relation = relationSeeds[index]!;
    const left = position(input.graph, relation.from);
    const right = position(input.graph, relation.to);
    if (left < 0 || right < 0) continue;
    const lower = Math.min(left, right), upper = Math.max(left, right);
    const localIds = sourceIds.filter((id) => {
      const current = position(input.graph, id);
      return current >= lower && current <= Math.min(sourceIds.length - 1, upper + 2);
    });
    add(`movie-relation-${index + 1}`, unique([relation.from, relation.to, ...localIds]));
  }

  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((candidate) => {
    const key = candidate.trajectory.map((step) => `${step.operation}:${step.eventIds.join(",")}`).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueCandidates.sort((a, b) => b.score - a.score || (b.observerInferencePotential ?? 0) - (a.observerInferencePotential ?? 0));

  const selected: LatentMovieCandidate[] = [];
  for (const candidate of uniqueCandidates) {
    if (selected.length >= limit) break;
    const similarity = selected.length
      ? Math.max(...selected.map((other) => {
          const left = new Set(candidate.evidence.map((value) => value.toLowerCase()));
          const right = new Set(other.evidence.map((value) => value.toLowerCase()));
          let shared = 0; for (const value of left) if (right.has(value)) shared += 1;
          return shared / Math.max(1, Math.min(left.size, right.size));
        }))
      : 0;
    candidate.distinctiveness = metric(1 - similarity);
    candidate.score = metric(candidate.score * 0.78 + candidate.distinctiveness * 0.07 + (candidate.observerInferencePotential ?? 0) * 0.15);
    selected.push(candidate);
  }

  return selected.sort((a, b) => b.score - a.score || (b.observerInferencePotential ?? 0) - (a.observerInferencePotential ?? 0)).slice(0, limit);
}
