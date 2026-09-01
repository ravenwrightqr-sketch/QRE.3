import type {
  LatentMovieCandidate,
  LatentStoryThesis,
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp)\b/i;
const STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|different|changed|quiet|loud|wild|sweet|gentle|strange|new|old)\b/i;

function label(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((event) => event.id === id)?.label);
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((event) => event.id === id);
}

function orderedEventIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function relationBetweenForward(
  graph: RealityGraph,
  from: string,
  to: string,
): RealityRelation | undefined {
  const fromPosition = position(graph, from);
  const toPosition = position(graph, to);
  if (fromPosition < 0 || toPosition < 0 || fromPosition >= toPosition) return undefined;
  return graph.relations
    .filter((relation) => {
      const direct = relation.from === from && relation.to === to;
      const inverse = relation.from === to && relation.to === from;
      return direct || inverse;
    })
    .sort((a, b) => b.strength - a.strength)[0];
}

function strongestStateChange(
  graph: RealityGraph,
  ids: readonly string[],
): { from: string; to: string; score: number } | undefined {
  let best: { from: string; to: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const fromLabel = label(graph, ids[i]!);
    if (!STATE.test(fromLabel)) continue;

    for (let j = i + 1; j < ids.length; j += 1) {
      const toLabel = label(graph, ids[j]!);
      if (!STATE.test(toLabel)) continue;
      if (fromLabel.toLowerCase() === toLabel.toLowerCase()) continue;

      const fromNegative = NEGATIVE.test(fromLabel);
      const toNegative = NEGATIVE.test(toLabel);
      const fromPositive = POSITIVE.test(fromLabel);
      const toPositive = POSITIVE.test(toLabel);
      const score = fromNegative && toPositive
        ? 1
        : fromNegative !== toNegative
          ? 0.9
          : fromPositive !== toPositive
            ? 0.84
            : 0.62;

      const spaced = Math.min(0.08, (j - i) * 0.02);
      const total = score + spaced;
      if (!best || total > best.score) best = { from: ids[i]!, to: ids[j]!, score: total };
    }
  }
  return best;
}

function strongestForwardRelation(
  graph: RealityGraph,
  ids: readonly string[],
): { from: string; to: string; relation: RealityRelation; score: number } | undefined {
  let best: { from: string; to: string; relation: RealityRelation; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = relationBetweenForward(graph, ids[i]!, ids[j]!);
      if (!relation) continue;
      const priority = relation.kind === "contrasts"
        ? 1
        : relation.kind === "recontextualizes"
          ? 0.96
          : relation.kind === "changes"
            ? 0.9
            : relation.kind === "repeats"
              ? 0.84
              : relation.kind === "converges"
                ? 0.8
                : relation.kind === "causes"
                  ? 0.86
                  : 0.62;
      const total = relation.strength * 0.72 + priority * 0.28;
      if (!best || total > best.score) best = { from: ids[i]!, to: ids[j]!, relation, score: total };
    }
  }
  return best;
}

function semanticTurnFromState(graph: RealityGraph, state: { from: string; to: string; score: number } | undefined): string {
  if (!state) return "";
  return `${label(graph, state.from)} gives way to ${label(graph, state.to)}`;
}

function semanticTurnFromRelation(
  graph: RealityGraph,
  relation: { from: string; to: string; relation: RealityRelation },
): string {
  const from = label(graph, relation.from);
  const to = label(graph, relation.to);
  switch (relation.relation.kind) {
    case "contrasts":
      return `${to} changes the reading of ${from}`;
    case "recontextualizes":
      return `${to} makes ${from} mean something new`;
    case "changes":
      return `${from} changes into ${to}`;
    case "repeats":
      return `${to} returns with new weight`;
    case "converges":
      return `${from} and ${to} come together`;
    case "causes":
      return `${from} leads into ${to}`;
    default:
      return `${from} and ${to} become newly connected`;
  }
}

function sealingIds(candidate: LatentMovieCandidate, carriers: readonly string[]): string[] {
  const carrierSet = new Set(carriers);
  return unique(
    candidate.trajectory
      .slice(1)
      .flatMap((step) => step.eventIds)
      .filter((id) => !carrierSet.has(id)),
  ).slice(-2);
}

function payoffDependency(graph: RealityGraph, candidate: LatentMovieCandidate, carriers: readonly string[]): string {
  const endpoint = candidate.trajectory.at(-1)?.eventIds.at(-1) ?? "";
  if (!endpoint) return "";
  const carrier = carriers.at(-1);
  if (carrier) {
    const relation = graph.relations.find((item) =>
      (item.from === endpoint && item.to === carrier) ||
      (item.to === endpoint && item.from === carrier),
    );
    if (relation) return `The ending grows out of ${label(graph, carrier)}.`;
  }
  const preceding = candidate.trajectory.at(-2)?.eventIds.at(-1);
  return preceding
    ? `The ending lands after ${label(graph, preceding)}.`
    : `The supplied ending remains the final truth.`;
}

function counterfactualDependency(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
  carriers: readonly string[],
): number {
  if (!carriers.length) return 0;
  const ids = orderedEventIds(candidate);
  const endpoint = ids.at(-1);
  const linked = carriers.filter((carrier) =>
    ids.includes(carrier) && graph.relations.some((relation) =>
      (relation.from === carrier && ids.includes(relation.to)) ||
      (relation.to === carrier && ids.includes(relation.from)),
    ),
  ).length;
  const endpointLinked = endpoint && carriers.some((carrier) => graph.relations.some((relation) =>
    (relation.from === endpoint && relation.to === carrier) ||
    (relation.to === endpoint && relation.from === carrier),
  )) ? 1 : 0;
  return metric(linked / Math.max(1, carriers.length) * 0.7 + endpointLinked * 0.3);
}

export function deriveLatentStoryThesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): LatentStoryThesis {
  const ids = orderedEventIds(candidate);
  const endpoint = ids.at(-1) ?? "";
  const state = strongestStateChange(graph, ids);
  const relation = strongestForwardRelation(graph, ids);

  const useState = Boolean(state && (!relation || state.score >= relation.score + 0.08));
  const from = useState ? state?.from : relation?.from;
  const to = useState ? state?.to : relation?.to;
  const relationKind = useState ? "changes" : relation?.relation.kind;
  const semanticTurn = useState
    ? semanticTurnFromState(graph, state)
    : relation
      ? semanticTurnFromRelation(graph, relation)
      : endpoint
        ? `The sequence lands on ${label(graph, endpoint)}`
        : "";

  const carriers = unique([from ?? "", to ?? ""].filter((id) => id && id !== endpoint));
  const sealing = sealingIds(candidate, carriers);

  return {
    initialReading: label(graph, ids[0] ?? "") || clean(candidate.evidence[0]),
    semanticTurn,
    beforeMeaning: from ? [label(graph, from)] : [],
    afterMeaning: to ? [label(graph, to)] : [],
    beforeEventIds: from ? [from] : [],
    afterEventIds: to ? [to] : [],
    relationKind,
    carrierEventIds: carriers,
    sealingEventIds: sealing,
    payoffDependency: payoffDependency(graph, candidate, carriers),
    counterfactualDependency: counterfactualDependency(graph, candidate, carriers),
    observerExperience: {
      objective: semanticTurn || "Make the supplied change perceptible without explaining it.",
      surprise: relationKind === "contrasts" || relationKind === "recontextualizes" ? "Change the reading without inventing a fact." : "Find surprise in the supplied combination of details.",
      curiosity: candidate.unresolvedQuestion || "What comes next?",
      attention: ["hook", "micro-question", "movement", "reframe", "payoff"],
      landing: label(graph, endpoint) || "supplied ending",
      explanationForbidden: true,
    },
  };
}
