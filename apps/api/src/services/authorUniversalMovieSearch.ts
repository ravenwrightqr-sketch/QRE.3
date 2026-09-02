/**
 * ONE universal movie search.
 *
 * Reality is immutable evidence. Movie search discovers competing ways to look
 * at that evidence. A lens changes which supplied relationships are privileged;
 * it never creates facts, actors, objects, chronology, or outcomes.
 *
 * Satanico sits above the lens as the observer-inference judge:
 *
 *   REALITY -> LENS-FRAMED OPPORTUNITIES -> MOVIE TRAJECTORIES -> SATANICO
 *
 * The lens is framing pressure, not a second cognition system.
 */
import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityPattern,
  RealityRelation,
} from "@qre/contracts";
import {
  discoverSatanicoInferenceOpportunities,
  type SatanicoInferenceOpportunity,
} from "./authorSatanicoEvidenceSearch.js";
import { scoreSatanicoObserverInference } from "./authorSatanicoInference.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper)\b/i;
const STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|different|changed|clean|broken|fixed|gone|back|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;
const IDENTITY_CALLBACK = /\b(?:same|remember(?:ed|s|ing)?|still)\b/i;

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(event(graph, id)?.label);
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}

function tokens(text: string): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function sharedTokenScore(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function eventStructureFor(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function relationBetween(
  graph: RealityGraph,
  left: string,
  right: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === left && relation.to === right) ||
        (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function callbackRelation(relation: RealityRelation | undefined): boolean {
  return Boolean(relation && (relation.kind === "repeats" || relation.kind === "recontextualizes"));
}

function explicitCallback(text: string): boolean {
  return CONTINUATION.test(text) || IDENTITY_CALLBACK.test(text);
}

function callbackPair(graph: RealityGraph, left: string, right: string): boolean {
  const relation = relationBetween(graph, left, right);
  if (callbackRelation(relation)) return true;
  return explicitCallback(label(graph, left)) && explicitCallback(label(graph, right));
}

type LensGuidance = {
  relationWeights: Partial<Record<RealityRelation["kind"], number>>;
  operationWeights: Partial<Record<LatentMovieTrajectoryStep["operation"], number>>;
  lexicalTerms: string[];
};

function mergeLensGuidance(target: LensGuidance, source: LensGuidance): void {
  for (const [kind, weight] of Object.entries(source.relationWeights)) {
    const key = kind as RealityRelation["kind"];
    target.relationWeights[key] = Math.max(target.relationWeights[key] ?? 0, weight ?? 0);
  }
  for (const [operation, weight] of Object.entries(source.operationWeights)) {
    const key = operation as LatentMovieTrajectoryStep["operation"];
    target.operationWeights[key] = Math.max(target.operationWeights[key] ?? 0, weight ?? 0);
  }
  target.lexicalTerms.push(...source.lexicalTerms);
}

function lensGuidance(lens?: string): LensGuidance {
  const normalized = clean(lens).toLowerCase();
  const guidance: LensGuidance = {
    relationWeights: {},
    operationWeights: {},
    lexicalTerms: [],
  };
  if (!normalized) return guidance;

  const add = (
    lexicalTerms: string[],
    relationWeights: Partial<Record<RealityRelation["kind"], number>>,
    operationWeights: Partial<Record<LatentMovieTrajectoryStep["operation"], number>>,
  ) => mergeLensGuidance(guidance, { lexicalTerms, relationWeights, operationWeights });

  if (/\b(?:funny|humor|humour|comedy|comic|absurd|playful|silly|ironic)\b/i.test(normalized)) {
    add(
      ["funny", "humor", "humour", "comedy", "comic", "absurd", "playful", "silly", "ironic"],
      { contrasts: 1, recontextualizes: 0.95, converges: 0.88, repeats: 0.62 },
      { contrast: 1, reframe: 0.95, converge: 0.88, recur: 0.62 },
    );
  }

  if (/\b(?:horror|scary|fear|dread|terror|thriller|creepy|dark)\b/i.test(normalized)) {
    add(
      ["horror", "scary", "fear", "dread", "terror", "thriller", "creepy", "dark"],
      { changes: 1, causes: 0.95, contrasts: 0.92, recontextualizes: 0.82 },
      { reveal: 1, consequence: 0.95, contrast: 0.92, reframe: 0.8 },
    );
  }

  if (/\b(?:romance|romantic|love|relationship|intimate|intimacy|connection)\b/i.test(normalized)) {
    add(
      ["romance", "romantic", "love", "relationship", "intimate", "intimacy", "connection"],
      { converges: 1, recontextualizes: 0.96, repeats: 0.86, causes: 0.64 },
      { converge: 1, reframe: 0.96, recur: 0.84, consequence: 0.64 },
    );
  }

  if (/\b(?:sentimental|nostalgic|nostalgia|memory|memories|emotional|heartfelt)\b/i.test(normalized)) {
    add(
      ["sentimental", "nostalgic", "nostalgia", "memory", "memories", "emotional", "heartfelt"],
      { repeats: 1, recontextualizes: 1, converges: 0.86, changes: 0.58 },
      { recur: 1, reframe: 1, converge: 0.86, reveal: 0.58 },
    );
  }

  if (/\b(?:mystery|mysterious|unknown|puzzle|enigmatic|secret)\b/i.test(normalized)) {
    add(
      ["mystery", "mysterious", "unknown", "puzzle", "enigmatic", "secret"],
      { recontextualizes: 1, contrasts: 0.92, converges: 0.86, causes: 0.76 },
      { reframe: 1, contrast: 0.92, converge: 0.86, consequence: 0.76 },
    );
  }

  if (/\b(?:game|gaming|play|competition|competitive|challenge)\b/i.test(normalized)) {
    add(
      ["game", "gaming", "play", "competition", "competitive", "challenge"],
      { contrasts: 1, changes: 0.92, converges: 0.86, repeats: 0.76 },
      { contrast: 1, reveal: 0.92, converge: 0.86, recur: 0.76 },
    );
  }

  if (/\b(?:adventure|action|journey|quest|epic)\b/i.test(normalized)) {
    add(
      ["adventure", "action", "journey", "quest", "epic"],
      { causes: 1, changes: 0.94, converges: 0.74, contrasts: 0.62 },
      { consequence: 1, reveal: 0.94, converge: 0.74, contrast: 0.62 },
    );
  }

  if (!guidance.lexicalTerms.length) {
    guidance.lexicalTerms.push(...[...tokens(normalized)]);
  }

  guidance.lexicalTerms = unique(guidance.lexicalTerms);
  return guidance;
}

function relationLensAffinity(relation: RealityRelation | undefined, guidance: LensGuidance): number {
  return relation ? guidance.relationWeights[relation.kind] ?? 0 : 0;
}

function operationLensAffinity(operation: LatentMovieTrajectoryStep["operation"], guidance: LensGuidance): number {
  return guidance.operationWeights[operation] ?? 0;
}

function lensAffinity(
  graph: RealityGraph,
  ids: readonly string[],
  guidance: LensGuidance,
): number {
  if (!ids.length || !guidance.lexicalTerms.length) return 0;

  const relations = ids
    .slice(1)
    .map((id, index) => relationBetween(graph, ids[index]!, id))
    .filter((relation): relation is RealityRelation => Boolean(relation));

  const relationScore = relations.length
    ? relations.reduce((sum, relation) => sum + relationLensAffinity(relation, guidance), 0) / relations.length
    : 0;

  const lexicalScore = metric(
    ids.reduce((sum, id) => {
      const text = label(graph, id).toLowerCase();
      const structure = eventStructureFor(graph, id);
      const structuralText = [
        ...(structure?.actions ?? []),
        ...(structure?.objects ?? []),
        ...(structure?.states ?? []),
        ...(structure?.semanticTags ?? []),
      ].join(" ").toLowerCase();
      const hits = guidance.lexicalTerms.filter((term) => text.includes(term) || structuralText.includes(term)).length;
      return sum + Math.min(1, hits / 2);
    }, 0) / Math.max(1, ids.length),
  );

  return metric(relationScore * 0.8 + lexicalScore * 0.2);
}

function lensRelationScore(relation: RealityRelation, guidance: LensGuidance): number {
  return metric(relation.strength * 0.45 + (guidance.relationWeights[relation.kind] ?? 0) * 0.55);
}

function subjectConnectedIds(graph: RealityGraph, subject?: string): string[] {
  const ids = graph.events.map((item) => item.id);
  if (!ids.length) return [];
  if (!clean(subject)) return ids;

  const selected = new Set(
    ids.filter((id) => label(graph, id).toLowerCase().includes(clean(subject).toLowerCase())),
  );
  if (!selected.size) selected.add(ids[0]!);

  const queue = [...selected];
  const seen = new Set(queue);
  while (queue.length) {
    const current = queue.shift()!;
    for (const candidate of ids) {
      if (seen.has(candidate)) continue;
      const relation = relationBetween(graph, current, candidate);
      const connects = Boolean(
        relation &&
          relation.strength >= 0.72 &&
          ["repeats", "recontextualizes", "contrasts", "causes", "changes", "converges"].includes(relation.kind),
      );
      const callback = callbackPair(graph, current, candidate);
      const lexical = sharedTokenScore(label(graph, current), label(graph, candidate)) >= 0.6;
      if (!connects && !callback && !lexical) continue;
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
    const fromLabel = label(graph, ids[i]!);
    if (!STATE.test(fromLabel)) continue;
    for (let j = i + 1; j < ids.length; j += 1) {
      const toLabel = label(graph, ids[j]!);
      if (!STATE.test(toLabel) || fromLabel.toLowerCase() === toLabel.toLowerCase()) continue;
      const fromNegative = NEGATIVE.test(fromLabel);
      const fromPositive = POSITIVE.test(fromLabel);
      const toNegative = NEGATIVE.test(toLabel);
      const toPositive = POSITIVE.test(toLabel);
      const polarity = fromNegative && toPositive
        ? 1
        : fromNegative !== toNegative
          ? 0.9
          : fromPositive !== toPositive
            ? 0.84
            : 0.62;
      const score = polarity + Math.min(0.08, (j - i) * 0.02);
      if (!best || score > best.score) best = { from: ids[i]!, to: ids[j]!, score };
    }
  }
  return best;
}

function eventSpecificity(graph: RealityGraph, id: string): number {
  const item = event(graph, id);
  if (!item) return 0;
  const structure = eventStructureFor(graph, id);
  return metric(
    Math.min(
      1,
      clean(item.label).split(/\s+/).filter(Boolean).length / 10 +
        (item.entities?.length ?? 0) / 14 +
        (structure?.objects.length ?? 0) / 10 +
        (structure?.semanticTags.length ?? 0) / 16 +
        (item.salient ? 0.16 : 0),
    ),
  );
}

function breadthScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1));
}

function forwardScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2) return 1;
  let forward = 0;
  for (let i = 1; i < positions.length; i += 1) if (positions[i]! > positions[i - 1]!) forward += 1;
  return metric(forward / Math.max(1, positions.length - 1));
}

function repetition(graph: RealityGraph, ids: readonly string[]): number {
  const seen = new Set<string>();
  let duplicateCount = 0;
  for (const id of ids) {
    const value = label(graph, id).toLowerCase();
    if (seen.has(value)) duplicateCount += 1;
    seen.add(value);
  }
  return metric(duplicateCount / Math.max(1, ids.length));
}

function buildTrajectory(graph: RealityGraph, ids: readonly string[], guidance: LensGuidance): LatentMovieTrajectoryStep[] {
  const selected = unique(ids)
    .sort((left, right) => position(graph, left) - position(graph, right))
    .slice(0, 7);
  if (selected.length < 3) return [];

  const patterns = graph.patterns ?? [];
  const patternForEvent = (eventId: string): RealityPattern | undefined =>
    patterns
      .filter((pattern) => pattern.eventIds.includes(eventId))
      .sort((a, b) => b.strength - a.strength)[0];

  const chooseOperation = (
    previousId: string | undefined,
    currentId: string,
    final: boolean,
  ): LatentMovieTrajectoryStep["operation"] => {
    if (final) return "payoff";
    const relation = previousId ? relationBetween(graph, previousId, currentId) : undefined;
    const pattern = patternForEvent(currentId);

    const candidates: Array<{ operation: LatentMovieTrajectoryStep["operation"]; score: number }> = [];
    if (relation) {
      const mapped: LatentMovieTrajectoryStep["operation"] =
        relation.kind === "recontextualizes" ? "reframe" :
        relation.kind === "repeats" ? "recur" :
        relation.kind === "contrasts" ? "contrast" :
        relation.kind === "causes" ? "consequence" :
        relation.kind === "converges" ? "converge" :
        "reveal";
      candidates.push({ operation: mapped, score: relationLensAffinity(relation, guidance) * 0.6 + relation.strength * 0.4 });
    }
    if (pattern?.kind === "recurrence") candidates.push({ operation: "recur", score: 0.7 });
    if (pattern?.kind === "anomaly" || pattern?.kind === "tension") candidates.push({ operation: "contrast", score: 0.7 });
    if (pattern?.kind === "transition") candidates.push({ operation: "reframe", score: 0.68 });

    const previousLabel = previousId ? label(graph, previousId) : "";
    const currentLabel = label(graph, currentId);
    if (STATE.test(previousLabel) && STATE.test(currentLabel)) candidates.push({ operation: "reframe", score: 0.6 });

    for (const [operation, weight] of Object.entries(guidance.operationWeights)) {
      candidates.push({
        operation: operation as LatentMovieTrajectoryStep["operation"],
        score: (weight ?? 0) * 0.72,
      });
    }

    candidates.sort((left, right) => right.score - left.score);
    return candidates[0]?.operation ?? "reveal";
  };

  const questionFor = (operation: LatentMovieTrajectoryStep["operation"]): string => {
    switch (operation) {
      case "contrast": return "What changed the reading?";
      case "reframe": return "What becomes newly meaningful?";
      case "recur": return "Why does this detail return?";
      case "converge": return "What do these details reveal together?";
      case "consequence": return "What follows from what is already here?";
      case "payoff": return "What remains when the pieces meet?";
      default: return "What is becoming noticeable?";
    }
  };

  return selected.map((id, index) => {
    const previousId = index > 0 ? selected[index - 1] : undefined;
    const final = index === selected.length - 1;
    const relation = previousId ? relationBetween(graph, previousId, id) : undefined;
    const operation = chooseOperation(previousId, id, final);
    const current = event(graph, id);
    const previous = previousId ? event(graph, previousId) : undefined;
    const currentStructure = eventStructureFor(graph, id);
    const previousStructure = previousId ? eventStructureFor(graph, previousId) : undefined;

    let viewerChange = `Advance through the supplied evidence: ${label(graph, id)}.`;
    if (!previousId) viewerChange = `Establish the supplied opening: ${label(graph, id)}.`;
    else if (relation?.kind === "recontextualizes") viewerChange = `The supplied detail is recontextualized by ${label(graph, id)}.`;
    else if (relation?.kind === "repeats") viewerChange = `The earlier supplied detail returns through ${label(graph, id)}.`;
    else if (relation?.kind === "contrasts") viewerChange = `The supplied contrast changes the reading between ${label(graph, previousId)} and ${label(graph, id)}.`;
    else if (relation?.kind === "causes") viewerChange = `The supplied consequence follows ${label(graph, previousId)}.`;
    else if (relation?.kind === "converges") viewerChange = `Separate supplied details converge in ${label(graph, id)}.`;
    else if (previousStructure?.states?.length && currentStructure?.states?.length && previousStructure.states[0] !== currentStructure.states[0]) {
      viewerChange = `The supplied state shifts from ${previousStructure.states[0]} to ${currentStructure.states[0]}.`;
    } else if (final) {
      viewerChange = `Land on the supplied endpoint: ${label(graph, id)}.`;
    }

    if (!current && !previous) viewerChange = `Establish the supplied opening: ${label(graph, id)}.`;

    return {
      order: index + 1,
      operation,
      eventIds: [id],
      viewerChange,
      nextQuestion: questionFor(operation),
    };
  });
}

function candidateCoverage(ids: readonly string[], opportunity: SatanicoInferenceOpportunity): number {
  if (!ids.length || !opportunity.ids.length) return 0;
  const source = new Set(ids);
  return metric(opportunity.ids.filter((id) => source.has(id)).length / opportunity.ids.length);
}

function opportunityRelevance(
  ids: readonly string[],
  opportunity: SatanicoInferenceOpportunity,
): number {
  const coverage = candidateCoverage(ids, opportunity);
  const anchors = opportunity.anchorIds.length
    ? opportunity.anchorIds.filter((id) => ids.includes(id)).length / opportunity.anchorIds.length
    : coverage;
  const support = opportunity.supportIds.length
    ? opportunity.supportIds.filter((id) => ids.includes(id)).length / opportunity.supportIds.length
    : coverage;
  return metric(coverage * 0.56 + anchors * 0.28 + support * 0.16);
}

function scoreCandidate(
  graph: RealityGraph,
  trajectory: readonly LatentMovieTrajectoryStep[],
  lens: string | undefined,
  subject: string | undefined,
  guidance: LensGuidance,
  opportunities: readonly SatanicoInferenceOpportunity[],
): Omit<LatentMovieCandidate, "id" | "lens" | "distinctiveness"> {
  const ids = unique(trajectory.flatMap((step) => step.eventIds));
  const evidence = unique(ids.map((id) => label(graph, id)).filter(Boolean));
  const relations = ids
    .slice(1)
    .map((id, index) => relationBetween(graph, ids[index]!, id))
    .filter((relation): relation is RealityRelation => Boolean(relation));
  const relationKinds = unique(relations.map((relation) => relation.kind));
  const state = statePair(graph, ids);
  const subjectCoverage = !clean(subject)
    ? 1
    : metric(ids.filter((id) => label(graph, id).toLowerCase().includes(clean(subject).toLowerCase())).length / Math.max(1, ids.length));
  const callback = metric(ids.filter((id) => callbackCoverage(graph, [id]) > 0).length / Math.max(1, ids.length));
  const structuralMovement = metric(
    (state?.score ?? 0) * 0.34 +
      Math.min(1, relationKinds.length / 3) * 0.18 +
      (ids.length >= 5 ? 0.18 : 0) +
      relations.reduce((sum, relation) => sum + relation.strength, 0) / Math.max(1, relations.length) * 0.3,
  );
  const specificity = metric(ids.reduce((sum, id) => sum + eventSpecificity(graph, id), 0) / Math.max(1, ids.length));
  const breadth = breadthScore(graph, ids);
  const order = forwardScore(graph, ids);
  const repetitionRisk = repetition(graph, ids);
  const operationDiversity = metric(unique(trajectory.map((step) => step.operation)).length / 5);
  const lensScore = lensAffinity(graph, ids, guidance);
  const bestOpportunity = opportunities.reduce((best, opportunity) => Math.max(best, opportunityRelevance(ids, opportunity) * opportunity.score), 0);
  const attentionPotential = metric(
    structuralMovement * 0.24 +
      breadth * 0.14 +
      specificity * 0.14 +
      order * 0.08 +
      operationDiversity * 0.08 +
      callback * 0.08 +
      subjectCoverage * 0.08 +
      lensScore * 0.24,
  );
  const consequencePotential = metric(structuralMovement * 0.34 + breadth * 0.16 + specificity * 0.12 + callback * 0.1 + lensScore * 0.18 + bestOpportunity * 0.1);
  const informationValue = metric(specificity * 0.2 + structuralMovement * 0.28 + breadth * 0.14 + attentionPotential * 0.16 + consequencePotential * 0.1 + lensScore * 0.12);
  const compressionPotential = metric(Math.min(1, trajectory.length / 5) * 0.34 + structuralMovement * 0.2 + operationDiversity * 0.16 + specificity * 0.12 + lensScore * 0.18);
  const truthRisk = metric(1 - (order * 0.48 + specificity * 0.18 + subjectCoverage * 0.18 + bestOpportunity * 0.16));

  const baseScore = metric(
    structuralMovement * 0.18 +
      attentionPotential * 0.14 +
      consequencePotential * 0.1 +
      breadth * 0.08 +
      specificity * 0.08 +
      order * 0.05 +
      operationDiversity * 0.05 +
      callback * 0.05 +
      subjectCoverage * 0.08 +
      lensScore * 0.24 +
      bestOpportunity * 0.05 -
      repetitionRisk * 0.07 -
      truthRisk * 0.07,
  );

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
    uncertainty: metric((1 - order) * 0.28 + structuralMovement * 0.26 + attentionPotential * 0.2 + (1 - subjectCoverage) * 0.14 + lensScore * 0.12),
    attentionPotential,
    consequencePotential,
    callbackPotential: callback,
    compressionPotential,
    repetitionRisk,
    observerInferencePotential: 0,
    score: baseScore,
  };

  const observerInferencePotential = scoreSatanicoObserverInference(graph, provisional);
  const score = metric(baseScore * 0.72 + observerInferencePotential * 0.28);

  return {
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: relationKinds,
    trajectory: [...trajectory],
    payoff: evidence[evidence.length - 1] ?? "",
    unresolvedQuestion: trajectory[trajectory.length - 1]?.nextQuestion ?? "What is becoming noticeable?",
    evidence,
    hypothesis: [
      "The movie is discovered from supplied reality rather than an external template.",
      "The lens changes attention and relationship priority, never concrete reality.",
      "Satanico judges whether the selected evidence leaves a strong human inference for the observer to complete.",
      "The final interpretation remains implicit rather than being inserted as a conclusion.",
    ],
    truthRisk,
    novelty: metric(1 - repetitionRisk),
    specificity,
    informationValue,
    uncertainty: metric((1 - order) * 0.28 + structuralMovement * 0.26 + attentionPotential * 0.2 + (1 - subjectCoverage) * 0.14 + lensScore * 0.12),
    attentionPotential,
    consequencePotential,
    callbackPotential: callback,
    compressionPotential,
    repetitionRisk,
    observerInferencePotential,
    score,
  };
}

function callbackCoverage(graph: RealityGraph, ids: readonly string[]): number {
  if (!ids.length) return 0;
  const linked = ids.filter(
    (id) => graph.relations.some((relation) => (relation.from === id || relation.to === id) && callbackRelation(relation)) || explicitCallback(label(graph, id)),
  ).length;
  return metric(linked / ids.length);
}

function addTrajectoryCandidate(
  candidates: LatentMovieCandidate[],
  graph: RealityGraph,
  id: string,
  ids: readonly string[],
  lens: string | undefined,
  subject: string | undefined,
  guidance: LensGuidance,
  opportunities: readonly SatanicoInferenceOpportunity[],
): void {
  const trajectory = buildTrajectory(graph, ids, guidance);
  if (trajectory.length < 3) return;
  candidates.push({
    id,
    lens: clean(lens) || "NONE",
    distinctiveness: 0,
    ...scoreCandidate(graph, trajectory, lens, subject, guidance, opportunities),
  });
}

function opportunityIds(graph: RealityGraph, opportunity: SatanicoInferenceOpportunity, guidance: LensGuidance): string[] {
  const ids = unique(opportunity.ids).sort((left, right) => position(graph, left) - position(graph, right));
  if (ids.length >= 3) return ids;

  const anchorRelations = graph.relations
    .filter((relation) => ids.includes(relation.from) || ids.includes(relation.to))
    .sort((left, right) => lensRelationScore(right, guidance) - lensRelationScore(left, guidance));
  const expanded = [...ids];
  for (const relation of anchorRelations) {
    expanded.push(relation.from, relation.to);
    if (unique(expanded).length >= 3) break;
  }
  return unique(expanded).sort((left, right) => position(graph, left) - position(graph, right)).slice(0, 7);
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

  const guidance = lensGuidance(input.lens);
  const opportunities = discoverSatanicoInferenceOpportunities(input.graph, 64);
  const candidates: LatentMovieCandidate[] = [];

  addTrajectoryCandidate(candidates, input.graph, "movie-source", sourceIds, input.lens, input.subject, guidance, opportunities);

  const connectedIds = subjectConnectedIds(input.graph, input.subject);
  if (connectedIds.length >= 3 && connectedIds.length < sourceIds.length) {
    addTrajectoryCandidate(candidates, input.graph, "movie-subject-connected", connectedIds, input.lens, input.subject, guidance, opportunities);
  }

  const stateIds = connectedIds.length >= 3 ? connectedIds : sourceIds;
  const state = statePair(input.graph, stateIds);
  if (state) {
    const start = position(input.graph, state.from);
    const end = position(input.graph, state.to);
    const ids = stateIds.filter((id) => {
      const current = position(input.graph, id);
      return current >= start && current <= end + 1;
    });
    if (!ids.includes(stateIds[stateIds.length - 1]!)) ids.push(stateIds[stateIds.length - 1]!);
    addTrajectoryCandidate(candidates, input.graph, "movie-transformation", ids, input.lens, input.subject, guidance, opportunities);
  }

  const lensOpportunities = [...opportunities]
    .sort((left, right) => {
      const leftIds = opportunityIds(input.graph, left, guidance);
      const rightIds = opportunityIds(input.graph, right, guidance);
      const leftScore = left.score * (0.58 + lensAffinity(input.graph, leftIds, guidance) * 0.42);
      const rightScore = right.score * (0.58 + lensAffinity(input.graph, rightIds, guidance) * 0.42);
      return rightScore - leftScore;
    })
    .slice(0, Math.max(8, limit * 3));

  for (let index = 0; index < lensOpportunities.length; index += 1) {
    const opportunity = lensOpportunities[index]!;
    addTrajectoryCandidate(
      candidates,
      input.graph,
      `movie-satanico-${index + 1}`,
      opportunityIds(input.graph, opportunity, guidance),
      input.lens,
      input.subject,
      guidance,
      opportunities,
    );
  }

  const relationSeeds = [...input.graph.relations]
    .filter((relation) => !["before", "after", "involves", "belongs_to"].includes(relation.kind))
    .sort((left, right) => lensRelationScore(right, guidance) - lensRelationScore(left, guidance))
    .slice(0, 10);

  for (let index = 0; index < relationSeeds.length; index += 1) {
    const relation = relationSeeds[index]!;
    const left = position(input.graph, relation.from);
    const right = position(input.graph, relation.to);
    if (left < 0 || right < 0) continue;
    const lower = Math.min(left, right);
    const upper = Math.max(left, right);
    const localIds = sourceIds.filter((id) => {
      const current = position(input.graph, id);
      return current >= lower && current <= Math.min(sourceIds.length - 1, upper + 2);
    });
    addTrajectoryCandidate(
      candidates,
      input.graph,
      `movie-relation-${index + 1}`,
      unique([relation.from, relation.to, ...localIds]),
      input.lens,
      input.subject,
      guidance,
      opportunities,
    );
  }

  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((candidate) => {
    const key = candidate.trajectory.map((step) => `${step.operation}:${step.eventIds.join(",")}`).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueCandidates.sort((left, right) =>
    right.score - left.score ||
    (right.observerInferencePotential ?? 0) - (left.observerInferencePotential ?? 0) ||
    right.attentionPotential - left.attentionPotential ||
    right.informationValue - left.informationValue,
  );

  const selected: LatentMovieCandidate[] = [];
  for (const candidate of uniqueCandidates) {
    if (selected.length >= limit) break;
    const similarity = selected.length
      ? Math.max(...selected.map((other) => {
          const a = new Set(candidate.evidence.map(clean));
          const b = new Set(other.evidence.map(clean));
          let shared = 0;
          for (const value of a) if (b.has(value)) shared += 1;
          return shared / Math.max(1, Math.min(a.size, b.size));
        }))
      : 0;
    candidate.distinctiveness = metric(1 - similarity);
    candidate.score = metric(
      candidate.score * 0.78 +
      candidate.distinctiveness * 0.07 +
      (candidate.observerInferencePotential ?? 0) * 0.15,
    );
    selected.push(candidate);
  }

  return selected
    .sort((left, right) =>
      right.score - left.score ||
      (right.observerInferencePotential ?? 0) - (left.observerInferencePotential ?? 0) ||
      right.distinctiveness - left.distinctiveness,
    )
    .slice(0, limit);
}
