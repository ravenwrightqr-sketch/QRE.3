import type {
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

/**
 * ONE universal movie search.
 *
 * RealityGraph is immutable source evidence.
 * This module only chooses presentation hypotheses over that evidence.
 * It never creates facts, people, objects, chronology, or outcomes.
 *
 * The search deliberately keeps three kinds of hypotheses alive:
 *   1. source-order living-memory sequence
 *   2. relationship-driven sequence
 *   3. transformation / callback sequence
 *
 * The strongest hypothesis is the one that gives the later Mouth a real
 * human-sized movie: hook -> question -> movement -> realization -> payoff.
 */

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const STATE_NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const STATE_POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp)\b/i;
const STATE_ANY = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|different|changed|clean|dirty|broken|fixed|gone|back|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;
const ACTION_ANY = /\b(?:arrived|dropped|cleaned|groomed|finished|started|picked|left|visited|met|called|talked|worked|played|danced|went|came|returned|bought|sold|built|fixed|washed|served|stayed|made|got|found|lost|looked|felt|seemed|became|changed|wore|used)\b/i;
const CONTINUATION_ANY = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|again|until|later)\b/i;
const STATUS_WORDS = /\b(?:fabulous|fab|dapper|fierce|cool|sharp|ready|done|cleared|approved|complete|finished|upgrade|victory|win|winner|exit|peace|temporary|temporarily|resumed|made it|level|mission|operation|case|verdict|negotiations?)\b/i;

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(event(graph, id)?.label);
}

function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter((relation) =>
      (relation.from === left && relation.to === right) ||
      (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function eventPosition(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}

function eventSpecificity(graph: RealityGraph, id: string): number {
  const item = event(graph, id);
  if (!item) return 0;
  const words = clean(item.label).split(/\s+/).filter(Boolean).length;
  const entities = item.entities?.length ?? 0;
  return metric(Math.min(1, words / 8 + entities / 10 + (item.salient ? 0.2 : 0)));
}

function terminality(graph: RealityGraph, id: string): number {
  const index = eventPosition(graph, id);
  if (index < 0 || !graph.events.length) return 0;
  return metric((index + 1) / graph.events.length);
}

function stateTransitionScore(graph: RealityGraph, ids: readonly string[]): { score: number; from?: string; to?: string } {
  let best = 0;
  let bestFrom: string | undefined;
  let bestTo: string | undefined;

  for (let i = 0; i < ids.length; i += 1) {
    const left = label(graph, ids[i]!);
    if (!STATE_ANY.test(left)) continue;

    for (let j = i + 1; j < ids.length; j += 1) {
      const right = label(graph, ids[j]!);
      if (!STATE_ANY.test(right)) continue;

      const leftNegative = STATE_NEGATIVE.test(left);
      const rightNegative = STATE_NEGATIVE.test(right);
      const leftPositive = STATE_POSITIVE.test(left);
      const rightPositive = STATE_POSITIVE.test(right);

      const polarity = leftNegative && rightPositive
        ? 1
        : leftNegative !== rightNegative
          ? 0.9
          : leftPositive !== rightPositive
            ? 0.82
            : left !== right
              ? 0.64
              : 0.3;

      const distance = Math.min(0.12, (j - i) * 0.025);
      const score = polarity + distance;
      if (score > best) {
        best = score;
        bestFrom = ids[i];
        bestTo = ids[j];
      }
    }
  }

  return { score: metric(best), from: bestFrom, to: bestTo };
}

function relationKindsFor(graph: RealityGraph, ids: readonly string[]): string[] {
  const set = new Set(ids);
  return unique(
    graph.relations
      .filter((relation) => set.has(relation.from) && set.has(relation.to))
      .map((relation) => relation.kind),
  );
}

function forwardOrderScore(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 1;
  const positions = ids.map((id) => eventPosition(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2) return 0;
  let forward = 0;
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i]! > positions[i - 1]!) forward += 1;
  }
  return metric(forward / Math.max(1, positions.length - 1));
}

function sourceSpanScore(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => eventPosition(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1));
}

function localMovementScore(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 0;
  const labels = ids.map((id) => label(graph, id));
  let freshness = 0;
  for (let i = 1; i < labels.length; i += 1) {
    const a = new Set(labels[i - 1]!.toLowerCase().split(/\W+/).filter((token) => token.length >= 3));
    const b = new Set(labels[i]!.toLowerCase().split(/\W+/).filter((token) => token.length >= 3));
    let shared = 0;
    for (const token of a) if (b.has(token)) shared += 1;
    const overlap = shared / Math.max(1, Math.min(a.size, b.size));
    freshness += 1 - overlap;
  }
  return metric(freshness / Math.max(1, labels.length - 1));
}

function callbackScore(graph: RealityGraph, ids: readonly string[]): number {
  let separated = 0;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 2; j < ids.length; j += 1) {
      const a = new Set(label(graph, ids[i]!).toLowerCase().split(/\W+/).filter((token) => token.length >= 3));
      const b = new Set(label(graph, ids[j]!).toLowerCase().split(/\W+/).filter((token) => token.length >= 3));
      let shared = 0;
      for (const token of a) if (b.has(token)) shared += 1;
      const overlap = shared / Math.max(1, Math.min(a.size, b.size));
      if (overlap >= 0.58) separated += 1;
    }
  }
  const signalBoost = Math.min(1, graph.recurringSignals.length / 3);
  return metric(Math.min(1, separated * 0.18) * 0.72 + signalBoost * 0.28);
}

function operationFor(relation: RealityRelation | undefined, previous: string, current: string, last: boolean): LatentMovieTrajectoryStep["operation"] {
  if (last) return "payoff";
  if (relation?.kind === "repeats") return "recur";
  if (relation?.kind === "recontextualizes") return "reframe";
  if (relation?.kind === "contrasts") return "contrast";
  if (relation?.kind === "causes") return "consequence";
  if (relation?.kind === "changes") return "reveal";
  if (STATE_ANY.test(previous) && STATE_ANY.test(current) && previous !== current) return "reveal";
  return "reveal";
}

function questionFor(operation: LatentMovieTrajectoryStep["operation"]): string {
  switch (operation) {
    case "contrast": return "What changed?";
    case "reframe": return "What does this make newly meaningful?";
    case "recur": return "Why is this back?";
    case "consequence": return "What follows?";
    case "payoff": return "What remains?";
    default: return "What comes next?";
  }
}

function buildSourceSequence(graph: RealityGraph, limit = 7): LatentMovieTrajectoryStep[] {
  const events = graph.events.filter((item) => clean(item.label));
  if (events.length < 3) return [];
  const selected = events.length <= limit
    ? events
    : [...events.slice(0, limit - 1), events[events.length - 1]!];

  return selected.map((item, index) => {
    const last = index === selected.length - 1;
    const previous = selected[index - 1];
    const relation = previous ? relationBetween(graph, previous.id, item.id) : undefined;
    const operation = index === 0 ? "establish" : operationFor(relation, label(graph, previous?.id ?? ""), item.label, last);
    return {
      order: index + 1,
      operation,
      eventIds: [item.id],
      viewerChange: index === 0
        ? `Establish ${item.label}.`
        : last
          ? `Land on ${item.label}.`
          : relation
            ? `${relation.kind}: ${previous?.label ?? ""} -> ${item.label}.`
            : `Reveal ${item.label}.`,
      nextQuestion: questionFor(operation),
    };
  });
}

function buildForwardTransformation(graph: RealityGraph, limit = 7): LatentMovieTrajectoryStep[] {
  const events = graph.events.filter((item) => clean(item.label));
  if (events.length < 3) return [];

  const statePair = stateTransitionScore(graph, events.map((item) => item.id));
  const anchorIndex = statePair.from ? eventPosition(graph, statePair.from) : 0;
  const targetIndex = statePair.to ? eventPosition(graph, statePair.to) : Math.min(events.length - 1, anchorIndex + 2);
  const start = Math.max(0, Math.min(anchorIndex, events.length - 1));
  const end = Math.max(start + 1, Math.min(targetIndex, events.length - 1));

  const ids: string[] = [];
  ids.push(events[start]!.id);

  for (let i = start + 1; i <= end && ids.length < limit - 1; i += 1) ids.push(events[i]!.id);
  for (let i = end + 1; i < events.length && ids.length < limit - 1; i += 1) {
    if (events[i]!.id !== ids[ids.length - 1]) ids.push(events[i]!.id);
  }

  const payoff = events[events.length - 1]!;
  if (!ids.includes(payoff.id)) ids.push(payoff.id);

  return ids.slice(0, limit).map((id, index, all) => {
    const item = event(graph, id)!;
    const previous = index > 0 ? event(graph, all[index - 1]!) : undefined;
    const last = index === all.length - 1;
    const relation = previous ? relationBetween(graph, previous.id, item.id) : undefined;
    const operation = index === 0 ? "establish" : operationFor(relation, previous?.label ?? "", item.label, last);
    return {
      order: index + 1,
      operation,
      eventIds: [item.id],
      viewerChange: last
        ? `Land on ${item.label}.`
        : relation
          ? `${relation.kind}: ${previous?.label ?? ""} -> ${item.label}.`
          : `Advance to ${item.label}.`,
      nextQuestion: questionFor(operation),
    };
  });
}

function buildRelationSequence(graph: RealityGraph, relation: RealityRelation, limit = 7): LatentMovieTrajectoryStep[] {
  const fromPos = eventPosition(graph, relation.from);
  const toPos = eventPosition(graph, relation.to);
  if (fromPos < 0 || toPos < 0) return [];

  const ordered = fromPos <= toPos
    ? [relation.from, relation.to]
    : [relation.to, relation.from];

  const ids = unique(ordered);
  for (const item of graph.events) {
    if (ids.length >= limit - 1) break;
    if (!ids.includes(item.id) && eventPosition(graph, item.id) > Math.min(fromPos, toPos)) ids.push(item.id);
  }
  const endpoint = graph.events[graph.events.length - 1];
  if (endpoint && !ids.includes(endpoint.id)) ids.push(endpoint.id);

  return ids.slice(0, limit).map((id, index, all) => {
    const item = event(graph, id)!;
    const previous = index > 0 ? event(graph, all[index - 1]!) : undefined;
    const last = index === all.length - 1;
    const rel = previous ? relationBetween(graph, previous.id, item.id) : undefined;
    const operation = index === 0 ? "establish" : operationFor(rel, previous?.label ?? "", item.label, last);
    return {
      order: index + 1,
      operation,
      eventIds: [item.id],
      viewerChange: rel
        ? `${rel.kind}: ${previous?.label ?? ""} -> ${item.label}.`
        : last
          ? `Land on ${item.label}.`
          : `Reveal ${item.label}.`,
      nextQuestion: questionFor(operation),
    };
  });
}

function scoreTrajectory(graph: RealityGraph, trajectory: readonly LatentMovieTrajectoryStep[], lens?: string): Omit<LatentMovieCandidate, "id" | "lens" | "distinctiveness"> {
  const ids = unique(trajectory.flatMap((step) => step.eventIds));
  const evidence = ids.map((id) => label(graph, id)).filter(Boolean);
  const specificity = metric(evidence.reduce((sum, _, index) => sum + eventSpecificity(graph, ids[index]!), 0) / Math.max(1, evidence.length));
  const relationKinds = relationKindsFor(graph, ids);
  const transition = stateTransitionScore(graph, ids);
  const forward = forwardOrderScore(graph, ids);
  const span = sourceSpanScore(graph, ids);
  const movement = localMovementScore(graph, ids);
  const callback = callbackScore(graph, ids);
  const relationStrength = metric(
    trajectory.slice(1).reduce((sum, step) => {
      if (step.eventIds.length < 2) return sum;
      const relation = relationBetween(graph, step.eventIds[0]!, step.eventIds.at(-1)!);
      return sum + (relation?.strength ?? 0);
    }, 0) / Math.max(1, trajectory.length - 1),
  );
  const payoffId = ids.at(-1);
  const endpoint = payoffId ? terminality(graph, payoffId) : 0;
  const statusPotential = evidence.some((item) => STATUS_WORDS.test(item)) ? 0.18 : 0;
  const relationDiversity = metric(Math.min(1, relationKinds.length / 4));
  const shape = metric(
    trajectory.length / 5 * 0.24 +
      movement * 0.24 +
      forward * 0.2 +
      transition.score * 0.2 +
      relationDiversity * 0.08 +
      statusPotential * 0.04,
  );

  const informationValue = metric(
    specificity * 0.18 +
      movement * 0.16 +
      transition.score * 0.22 +
      relationStrength * 0.12 +
      forward * 0.12 +
      endpoint * 0.08 +
      callback * 0.08 +
      span * 0.04,
  );

  const attentionPotential = metric(
    transition.score * 0.24 +
      movement * 0.16 +
      relationStrength * 0.12 +
      callback * 0.1 +
      informationValue * 0.22 +
      forward * 0.1 +
      endpoint * 0.06,
  );

  const consequencePotential = metric(
    transition.score * 0.26 +
      endpoint * 0.26 +
      relationStrength * 0.16 +
      informationValue * 0.18 +
      forward * 0.08 +
      callback * 0.06,
  );

  const compressionPotential = metric(
    movement * 0.3 +
      trajectory.length / 6 * 0.2 +
      attentionPotential * 0.22 +
      specificity * 0.14 +
      transition.score * 0.14,
  );

  const uncertainty = metric(
    transition.score * 0.28 +
      movement * 0.16 +
      informationValue * 0.18 +
      callback * 0.12 +
      (relationKinds.includes("contrasts") || relationKinds.includes("recontextualizes") ? 0.16 : 0) +
      (trajectory.length < 4 ? 0.08 : 0),
  );

  const truthRisk = metric(
    1 - (
      forward * 0.32 +
      specificity * 0.18 +
      relationStrength * 0.16 +
      endpoint * 0.18 +
      movement * 0.16
    ),
  );

  const score = metric(
    informationValue * 0.2 +
      attentionPotential * 0.2 +
      transition.score * 0.16 +
      consequencePotential * 0.12 +
      specificity * 0.08 +
      forward * 0.08 +
      movement * 0.06 +
      callback * 0.04 +
      compressionPotential * 0.03 +
      relationDiversity * 0.03 -
      truthRisk * 0.04,
  );

  return {
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: relationKinds,
    trajectory: trajectory.map((step, index) => ({ ...step, order: index + 1 })),
    payoff: payoffId ? label(graph, payoffId) : "",
    unresolvedQuestion: trajectory.at(-2)?.nextQuestion ?? "What comes next?",
    evidence,
    hypothesis: [
      "Reality remains unchanged.",
      "Presentation order is a creative traversal, not a new chronology claim.",
      transition.from && transition.to ? `The strongest supplied state movement is ${label(graph, transition.from)} -> ${label(graph, transition.to)}.` : "No dominant supplied state polarity was required.",
      "Mouth may realize this as attitude, status, implication, humor, tenderness, tension, or another supported framing.",
    ],
    truthRisk,
    novelty: movement,
    specificity,
    informationValue,
    uncertainty,
    attentionPotential,
    consequencePotential,
    callbackPotential: callback,
    compressionPotential,
    repetitionRisk: metric(1 - movement),
    viewerStateDynamics: {
      attention: attentionPotential,
      curiosity: uncertainty,
      contrast: relationKinds.includes("contrasts") ? 0.9 : transition.score,
      interruption: metric((1 - forward) * 0.4 + uncertainty * 0.6),
      accumulation: metric(ids.length / Math.max(1, graph.events.length)),
      payoff: endpoint,
      tempo: metric(0.45 + attentionPotential * 0.35 + movement * 0.2),
      continuity: forward,
      predictionError: uncertainty,
      stateShift: transition.score,
      score,
    },
    score,
  };
}

function semanticFamily(candidate: LatentMovieCandidate): string {
  const operations = candidate.trajectory.map((step) => step.operation);
  if (operations.includes("recur")) return "callback";
  if (operations.includes("contrast") || operations.includes("reframe")) return "recontextualization";
  if (candidate.viewerStateDynamics?.stateShift && candidate.viewerStateDynamics.stateShift >= 0.75) return "transformation";
  if (candidate.trajectory.length >= 5) return "living-sequence";
  return "relationship";
}

export function searchUniversalMovieCandidates(input: {
  graph: RealityGraph;
  subject?: string;
  lens?: string;
  limit?: number;
}): LatentMovieCandidate[] {
  const limit = Math.max(3, Math.min(12, Math.floor(input.limit ?? 8)));
  const graph = input.graph;
  const candidates: LatentMovieCandidate[] = [];

  const add = (trajectory: LatentMovieTrajectoryStep[], source: string) => {
    if (trajectory.length < 3) return;
    const scored = scoreTrajectory(graph, trajectory, input.lens);
    candidates.push({
      id: `${source}-${candidates.length + 1}`,
      lens: clean(input.lens) || "neutral",
      ...scored,
      distinctiveness: 0,
    });
  };

  add(buildSourceSequence(graph), "source");
  add(buildForwardTransformation(graph), "transform");

  const strongestRelations = [...graph.relations]
    .filter((relation) => relation.strength >= 0.42)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6);

  for (const relation of strongestRelations) add(buildRelationSequence(graph, relation), "relation");

  const deduped = new Map<string, LatentMovieCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.trajectory.map((step) => step.eventIds.join(",")).join(">")}|${candidate.trajectory.map((step) => step.operation).join(">")}`;
    if (!deduped.has(key) || deduped.get(key)!.score < candidate.score) deduped.set(key, candidate);
  }

  const ranked = [...deduped.values()].sort((a, b) => b.score - a.score);
  const selected: LatentMovieCandidate[] = [];
  const familyCount = new Map<string, number>();

  for (const candidate of ranked) {
    if (selected.length >= limit) break;
    const family = semanticFamily(candidate);
    const count = familyCount.get(family) ?? 0;
    if (count >= 3) continue;

    const similarity = selected.length
      ? Math.max(...selected.map((other) => {
          const a = new Set(candidate.evidence.map((x) => x.toLowerCase()));
          const b = new Set(other.evidence.map((x) => x.toLowerCase()));
          let shared = 0;
          for (const token of a) if (b.has(token)) shared += 1;
          return shared / Math.max(1, Math.min(a.size, b.size));
        }))
      : 0;

    const distinctiveness = metric(
      (1 - similarity) * 0.42 +
      metric(candidate.trajectory.length / 6) * 0.14 +
      (candidate.viewerStateDynamics?.stateShift ?? 0) * 0.22 +
      (candidate.callbackPotential ?? 0) * 0.12 +
      (candidate.attentionPotential ?? 0) * 0.10,
    );

    candidate.distinctiveness = distinctiveness;
    candidate.score = metric(candidate.score * 0.82 + distinctiveness * 0.18);
    selected.push(candidate);
    familyCount.set(family, count + 1);
  }

  return selected.sort((a, b) => b.score - a.score).slice(0, limit);
}
