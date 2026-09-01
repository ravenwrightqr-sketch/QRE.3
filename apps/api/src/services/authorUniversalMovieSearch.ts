import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

/**
 * ONE universal movie search.
 *
 * Search discovers presentation hypotheses over supplied RealityGraph data.
 * It never invents facts, people, objects, chronology, or outcomes.
 *
 * The search deliberately keeps different kinds of movies alive:
 * - source-order living-memory film
 * - transformation film
 * - relationship/recontextualization film
 * - callback/recurrence film
 *
 * Cognition remains the sole owner of movie selection.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper)\b/i;
const STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|different|changed|clean|broken|fixed|gone|back|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;
const ACTION = /\b(?:arrived|dropped|cleaned|groomed|finished|started|picked|left|visited|met|called|talked|worked|played|danced|went|came|returned|bought|sold|built|fixed|washed|served|stayed|made|found|lost|got|wore|used|married|celebrated|opened|closed|moved|traveled|traveled|scanned|contributed|attended)\b/i;

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(event(graph, id)?.label);
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}

function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  const leftPos = position(graph, left);
  const rightPos = position(graph, right);
  if (leftPos < 0 || rightPos < 0) return undefined;
  return graph.relations
    .filter((relation) =>
      (relation.from === left && relation.to === right) ||
      (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function sourceOrder(ids: readonly string[]): number[] {
  return ids.map((id) => id.length);
}

function forwardScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((index) => index >= 0);
  if (positions.length < 2) return 1;
  let forward = 0;
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index]! > positions[index - 1]!) forward += 1;
  }
  return metric(forward / Math.max(1, positions.length - 1));
}

function breadthScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((index) => index >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  const span = Math.max(...positions) - Math.min(...positions);
  return metric(span / Math.max(1, graph.events.length - 1));
}

function eventSpecificity(graph: RealityGraph, id: string): number {
  const item = event(graph, id);
  if (!item) return 0;
  const tokenCount = clean(item.label).split(/\s+/).filter(Boolean).length;
  const entityCount = item.entities?.length ?? 0;
  return metric(Math.min(1, tokenCount / 8 + entityCount / 8 + (item.salient ? 0.18 : 0)));
}

function repetition(graph: RealityGraph, ids: readonly string[]): number {
  const labels = ids.map((id) => label(graph, id).toLowerCase());
  const seen = new Set<string>();
  let dupes = 0;
  for (const value of labels) {
    if (seen.has(value)) dupes += 1;
    seen.add(value);
  }
  return metric(dupes / Math.max(1, labels.length));
}

function statePair(graph: RealityGraph, ids: readonly string[]): { from: string; to: string; score: number } | undefined {
  let best: { from: string; to: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const from = label(graph, ids[i]!);
    if (!STATE.test(from)) continue;
    const fromNeg = NEGATIVE.test(from);
    const fromPos = POSITIVE.test(from);
    for (let j = i + 1; j < ids.length; j += 1) {
      const to = label(graph, ids[j]!);
      if (!STATE.test(to)) continue;
      if (from.toLowerCase() === to.toLowerCase()) continue;
      const toNeg = NEGATIVE.test(to);
      const toPos = POSITIVE.test(to);
      const polarity = fromNeg && toPos ? 1 : fromNeg !== toNeg ? 0.9 : fromPos !== toPos ? 0.84 : 0.62;
      const spread = Math.min(0.08, (j - i) * 0.02);
      const score = polarity + spread;
      if (!best || score > best.score) best = { from: ids[i]!, to: ids[j]!, score };
    }
  }
  return best;
}

function operationFor(relation: RealityRelation | undefined, previous: string, current: string, final: boolean): LatentMovieTrajectoryStep["operation"] {
  if (final) return "payoff";
  if (relation?.kind === "recontextualizes") return "reframe";
  if (relation?.kind === "repeats") return "recur";
  if (relation?.kind === "converges") return "converge";
  if (relation?.kind === "contrasts") return "contrast";
  if (relation?.kind === "causes") return "consequence";
  if (relation?.kind === "changes") return "reveal";
  if (STATE.test(previous) && STATE.test(current)) return "reveal";
  return "reveal";
}

function questionFor(operation: LatentMovieTrajectoryStep["operation"]): string {
  switch (operation) {
    case "contrast": return "What changed the reading?";
    case "reframe": return "What does this make newly meaningful?";
    case "recur": return "Why is this back?";
    case "converge": return "What comes together here?";
    case "consequence": return "What follows?";
    case "payoff": return "What remains?";
    default: return "What comes next?";
  }
}

function buildTrajectory(graph: RealityGraph, ids: readonly string[]): LatentMovieTrajectoryStep[] {
  if (ids.length < 3) return [];
  const selected = ids.slice(0, 7);
  return selected.map((id, index) => {
    const final = index === selected.length - 1;
    const previousId = index > 0 ? selected[index - 1] : undefined;
    const previousLabel = previousId ? label(graph, previousId) : "";
    const relation = previousId ? relationBetween(graph, previousId, id) : undefined;
    const operation = operationFor(relation, previousLabel, label(graph, id), final);
    return {
      order: index + 1,
      operation,
      eventIds: [id],
      viewerChange: index === 0
        ? `Begin with ${label(graph, id)}.`
        : final
          ? `Land on the supplied ending: ${label(graph, id)}.`
          : relation
            ? `${relation.kind}: ${previousLabel} -> ${label(graph, id)}.`
            : `Bring forward ${label(graph, id)}.`,
      nextQuestion: questionFor(operation),
    };
  });
}

function scoreCandidate(graph: RealityGraph, trajectory: readonly LatentMovieTrajectoryStep[], lens?: string): Omit<LatentMovieCandidate, "id" | "lens" | "distinctiveness"> {
  const ids = unique(trajectory.flatMap((step) => step.eventIds));
  const evidence = unique(ids.map((id) => label(graph, id)).filter(Boolean));
  const relations = trajectory.flatMap((step) => {
    if (step.eventIds.length < 2) return [];
    const relation = relationBetween(graph, step.eventIds[0]!, step.eventIds[step.eventIds.length - 1]!);
    return relation ? [relation] : [];
  });
  const relationKinds = unique(relations.map((relation) => relation.kind));
  const state = statePair(graph, ids);
  const semanticMovement = metric(
    (state?.score ?? 0) * 0.55 +
    Math.min(1, relationKinds.length / 3) * 0.25 +
    (ids.length >= 5 ? 0.2 : 0),
  );
  const specificity = metric(ids.reduce((sum, id) => sum + eventSpecificity(graph, id), 0) / Math.max(1, ids.length));
  const breadth = breadthScore(graph, ids);
  const order = forwardScore(graph, ids);
  const continuity = metric((graph.recurringSignals.length ? 0.4 : 0) + (CONTINUATION.test(evidence.join(" ")) ? 0.6 : 0));
  const endpoint = ids.length && position(graph, ids[ids.length - 1]!) === graph.events.length - 1 ? 1 : metric((position(graph, ids[ids.length - 1]!) + 1) / Math.max(1, graph.events.length));
  const operationDiversity = metric(unique(trajectory.map((step) => step.operation)).length / 4);
  const recurrence = metric(Math.min(1, graph.recurringSignals.length / 3));
  const repetitionRisk = repetition(graph, ids);
  const attentionPotential = metric(
    semanticMovement * 0.28 +
    breadth * 0.22 +
    specificity * 0.14 +
    order * 0.12 +
    endpoint * 0.1 +
    operationDiversity * 0.08 +
    recurrence * 0.06,
  );
  const consequencePotential = metric(
    semanticMovement * 0.36 + endpoint * 0.24 + specificity * 0.12 + breadth * 0.16 + continuity * 0.12,
  );
  const callbackPotential = recurrence;
  const informationValue = metric(
    specificity * 0.25 + semanticMovement * 0.3 + breadth * 0.2 + attentionPotential * 0.15 + consequencePotential * 0.1,
  );
  const compressionPotential = metric(
    Math.min(1, trajectory.length / 5) * 0.4 + semanticMovement * 0.25 + operationDiversity * 0.2 + specificity * 0.15,
  );
  const truthRisk = metric(1 - (order * 0.65 + specificity * 0.2 + endpoint * 0.15));
  const score = metric(
    semanticMovement * 0.25 +
    attentionPotential * 0.18 +
    consequencePotential * 0.15 +
    breadth * 0.14 +
    specificity * 0.1 +
    endpoint * 0.08 +
    operationDiversity * 0.06 +
    callbackPotential * 0.04 -
    repetitionRisk * 0.1 -
    truthRisk * 0.08,
  );

  return {
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: relationKinds,
    trajectory: [...trajectory],
    payoff: evidence[evidence.length - 1] ?? "",
    unresolvedQuestion: trajectory.at(-1)?.nextQuestion ?? "What comes next?",
    evidence,
    hypothesis: [
      "The movie is discovered from supplied reality rather than an industry template.",
      "The strongest semantic movement is preserved without inventing facts.",
      "Source order is presentation order only; it is not silently upgraded into factual chronology.",
      "The lens changes framing, not reality.",
    ],
    truthRisk,
    novelty: metric(1 - repetitionRisk),
    specificity,
    informationValue,
    uncertainty: metric((1 - order) * 0.35 + semanticMovement * 0.35 + attentionPotential * 0.3),
    attentionPotential,
    consequencePotential,
    callbackPotential,
    compressionPotential,
    repetitionRisk,
    score,
  };
}

export function searchUniversalMovieCandidates(input: { graph: RealityGraph; subject?: string; lens?: string; limit?: number }): LatentMovieCandidate[] {
  const limit = Math.max(3, Math.min(12, input.limit ?? 8));
  const events = input.graph.events.filter((item) => clean(item.label));
  if (events.length < 3) return [];

  const sourceIds = events.map((item) => item.id);
  const candidates: LatentMovieCandidate[] = [];

  const sourceTrajectory = buildTrajectory(input.graph, sourceIds);
  if (sourceTrajectory.length >= 3) {
    candidates.push({ id: "movie-source", lens: clean(input.lens) || "NONE", distinctiveness: 0, ...scoreCandidate(input.graph, sourceTrajectory, input.lens) });
  }

  const state = statePair(input.graph, sourceIds);
  if (state) {
    const start = position(input.graph, state.from);
    const end = position(input.graph, state.to);
    const ids = sourceIds.slice(Math.max(0, start), Math.min(sourceIds.length, end + 2));
    if (!ids.includes(sourceIds[sourceIds.length - 1]!)) ids.push(sourceIds[sourceIds.length - 1]!);
    const trajectory = buildTrajectory(input.graph, ids);
    if (trajectory.length >= 3) {
      candidates.push({ id: "movie-transformation", lens: clean(input.lens) || "NONE", distinctiveness: 0, ...scoreCandidate(input.graph, trajectory, input.lens) });
    }
  }

  const relationSeeds = [...input.graph.relations]
    .filter((relation) => !["before", "after", "involves", "belongs_to"].includes(relation.kind))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  for (let index = 0; index < relationSeeds.length; index += 1) {
    const relation = relationSeeds[index]!;
    const left = position(input.graph, relation.from);
    const right = position(input.graph, relation.to);
    if (left < 0 || right < 0) continue;
    const ordered = left <= right ? [relation.from, relation.to] : [relation.to, relation.from];
    const ids = unique([
      ...ordered,
      ...sourceIds.slice(Math.min(...ordered.map((id) => position(input.graph, id))), Math.min(sourceIds.length, Math.max(...ordered.map((id) => position(input.graph, id))) + 2)),
      sourceIds[sourceIds.length - 1]!,
    ]);
    const trajectory = buildTrajectory(input.graph, ids);
    if (trajectory.length >= 3) {
      const scored = scoreCandidate(input.graph, trajectory, input.lens);
      candidates.push({ id: `movie-relation-${index + 1}`, lens: clean(input.lens) || "NONE", distinctiveness: 0, ...scored });
    }
  }

  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((candidate) => {
    const key = candidate.trajectory.map((step) => `${step.operation}:${step.eventIds.join(",")}`).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueCandidates.sort((a, b) => b.score - a.score);

  const selected: LatentMovieCandidate[] = [];
  for (const candidate of uniqueCandidates) {
    if (selected.length >= limit) break;
    const similarity = selected.length
      ? Math.max(...selected.map((other) => {
          const a = new Set(candidate.evidence);
          const b = new Set(other.evidence);
          let shared = 0;
          for (const value of a) if (b.has(value)) shared += 1;
          return shared / Math.max(1, Math.min(a.size, b.size));
        }))
      : 0;
    candidate.distinctiveness = metric(1 - similarity);
    candidate.score = metric(candidate.score * 0.84 + candidate.distinctiveness * 0.16);
    selected.push(candidate);
  }

  return selected.sort((a, b) => b.score - a.score).slice(0, limit);
}
