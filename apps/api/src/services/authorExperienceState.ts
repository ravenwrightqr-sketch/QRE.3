import type {
  AuthorExperienceState,
  AuthorTempo,
  LatentMovieCandidate,
  RealityGraph,
  RealityRelation,
  WorldSimulation,
} from "@qre/contracts";
import {
  detectAuthorMemoryContinuity,
  summarizeAuthorMemoryContinuity,
} from "./authorMemoryContinuity.js";
import { buildAuthorWorldSimulation } from "./authorWorldSimulation.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const uniq = <T>(values: readonly T[], limit = 64): T[] => [...new Set(values)].slice(0, limit);

function event(graph: RealityGraph, id: string) { return graph.events.find((item) => item.id === id); }
function eventLabel(graph: RealityGraph, id: string): string { return clean(event(graph, id)?.label); }
function relationKey(relation: RealityRelation): string { return [relation.kind, relation.from, relation.to].join(":"); }
function relationForStep(graph: RealityGraph, eventIds: string[]): RealityRelation | undefined {
  if (eventIds.length < 2) return undefined;
  const [from, to] = [eventIds[0], eventIds[eventIds.length - 1]];
  return graph.relations.find((relation) => (relation.from === from && relation.to === to) || (relation.from === to && relation.to === from));
}
function persistentHook(value: string, graph: RealityGraph): boolean {
  const text = clean(value).toLowerCase();
  if (!text) return false;
  return [...graph.recurringSignals, ...graph.unresolvedTensions].some((signal) => {
    const normalized = clean(signal).toLowerCase();
    return normalized.length > 2 && (text.includes(normalized) || normalized.includes(text));
  });
}
function futureRelationWeight(kind: RealityRelation["kind"]): number {
  switch (kind) {
    case "causes": return 1;
    case "changes": case "recontextualizes": case "contrasts": case "after": case "before": return 0.95;
    case "converges": return 0.9;
    case "repeats": return 0.86;
    case "involves": return 0.78;
    case "belongs_to": return 0.72;
    default: return 0.65;
  }
}
function deriveFutureEventIds(graph: RealityGraph, usedEventIds: readonly string[], payoffEventIds: readonly string[]): string[] {
  const used = new Set(usedEventIds);
  const payoff = new Set(payoffEventIds);
  return graph.events.map((item) => {
    if (used.has(item.id) || payoff.has(item.id)) return { id: item.id, score: 0 };
    const relations = graph.relations.filter((relation) => (relation.from === item.id || relation.to === item.id) && (used.has(relation.from) || used.has(relation.to)));
    return { id: item.id, score: relations.reduce((sum, relation) => sum + relation.strength * futureRelationWeight(relation.kind), 0) };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 12).map((item) => item.id);
}
function deriveTempo(input: {
  semanticSteps: LatentMovieCandidate["trajectory"];
  activeTensions: number;
  resolvedTensions: number;
  revisits: number;
  continuationValue: number;
  lookaheadValue: number;
  endpointPressure: number;
  round: number;
}): AuthorTempo {
  const { semanticSteps, activeTensions, resolvedTensions, revisits, continuationValue, lookaheadValue, endpointPressure, round } = input;
  const operations = semanticSteps.map((step) => step.operation);
  const tail = operations[operations.length - 1];
  const urgency = metric(activeTensions * 0.32 + lookaheadValue * 0.28 + continuationValue * 0.18 + Math.min(1, semanticSteps.length / 4) * 0.12 + (round > 1 ? 0.1 : 0));
  if (revisits > 0) return { mode: "revisit", urgency, compression: 0.68, revealSpacing: 0.58, holdPressure: 0.52, nextBeatPull: metric(0.58 + lookaheadValue * 0.32), reason: "New evidence exists that can change the meaning of established material.", arc: ["revisit", "reframe", lookaheadValue > 0.45 ? "tighten" : "hold"] };
  if (!semanticSteps.length) return { mode: "hook", urgency: 0.35, compression: 0.45, revealSpacing: 0.75, holdPressure: 0.25, nextBeatPull: 0.75, reason: "Establish the world before spending its meaning.", arc: ["hook", "reveal", "open"] };
  if (endpointPressure >= 0.82 || tail === "payoff") return { mode: "release", urgency, compression: 0.82, revealSpacing: 0.9, holdPressure: 0.12, nextBeatPull: metric(0.3 + continuationValue * 0.55), reason: "The selected payoff is close enough to release; do not invent another event.", arc: ["tighten", "release", continuationValue > 0.55 ? "open" : "hold"] };
  if (activeTensions >= 2 && lookaheadValue >= 0.45) return { mode: "tighten", urgency: metric(Math.max(0.65, urgency)), compression: 0.76, revealSpacing: 0.48, holdPressure: 0.22, nextBeatPull: metric(0.66 + lookaheadValue * 0.25), reason: "Multiple live tensions and a viable next thread demand tighter cuts.", arc: ["hook", "accelerate", "tighten", "payoff"] };
  if (activeTensions > resolvedTensions || continuationValue >= 0.6) return { mode: "accelerate", urgency: metric(Math.max(0.55, urgency)), compression: 0.7, revealSpacing: 0.56, holdPressure: 0.2, nextBeatPull: metric(0.6 + lookaheadValue * 0.28), reason: "The experience has unresolved movement worth carrying forward.", arc: ["hook", "accelerate", "reveal", "open"] };
  return { mode: "hold", urgency, compression: 0.52, revealSpacing: 0.72, holdPressure: 0.58, nextBeatPull: metric(0.48 + continuationValue * 0.28), reason: "Let the current meaning settle before forcing another turn.", arc: ["hook", "hold", "reframe", "release"] };
}

export function buildAuthorExperienceState(input: {
  graph: RealityGraph;
  movie?: LatentMovieCandidate;
  lens?: string;
  priorScenes?: string[];
  memoryContext?: string[];
  priorExperienceStates?: AuthorExperienceState[];
  round?: number;
  worldSimulation?: WorldSimulation;
}): AuthorExperienceState {
  const { graph, movie } = input;
  const trajectory = movie?.trajectory ?? [];
  const semanticSteps = trajectory.filter((step) => step.operation !== "establish" && step.operation !== "payoff");
  const payoffStep = trajectory.find((step) => step.operation === "payoff");
  const previous = input.priorExperienceStates ?? [];
  const prior = (key: keyof AuthorExperienceState): string[] => uniq(previous.flatMap((state) => {
    const value = state[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }));

  const priorRealityAnchors = prior("realityAnchors");
  const currentRealityAnchors = uniq(graph.events.map((item) => clean(item.label)).filter(Boolean), 64);
  const realityAnchors = uniq([...priorRealityAnchors, ...currentRealityAnchors], 64);
  const memoryRevisitIds = detectAuthorMemoryContinuity(graph.events, priorRealityAnchors);
  const continuityHooks = summarizeAuthorMemoryContinuity(graph.events, priorRealityAnchors);

  const establishedEventIds = uniq([...prior("establishedEventIds"), ...trajectory.flatMap((step) => (step.operation === "establish" || step.operation !== "payoff" ? step.eventIds : []))]);
  const changedEventIds = uniq([...prior("changedEventIds"), ...semanticSteps.flatMap((step) => step.eventIds.slice(-1))]);
  const carrierEventIds = uniq([...prior("carrierEventIds"), ...semanticSteps.flatMap((step) => step.eventIds)]);
  const payoffEventIds = uniq([...(payoffStep?.eventIds ?? [])]);
  const relations = semanticSteps.map((step) => relationForStep(graph, step.eventIds)).filter((relation): relation is RealityRelation => Boolean(relation));

  const activeTensionKeys = uniq([...prior("activeTensionKeys"), ...relations.filter((relation) => ["contrasts", "changes", "recontextualizes"].includes(relation.kind)).map(relationKey)]);
  const resolvedTensionKeys = uniq([...prior("resolvedTensionKeys"), ...relations.filter((relation) => ["causes", "after", "converges", "repeats"].includes(relation.kind)).map(relationKey)]);
  const setupEventIds = uniq([...prior("setupEventIds"), ...carrierEventIds, ...semanticSteps.flatMap((step) => step.eventIds.slice(0, 1))]);
  const callbackEventIds = uniq([...prior("callbackEventIds"), ...graph.events.filter((item) => persistentHook(item.label, graph)).map((item) => item.id)]);
  const revisitedEventIds = uniq([...prior("revisitedEventIds"), ...semanticSteps.flatMap((step) => step.eventIds).filter((id, index, ids) => ids.indexOf(id) !== index), ...memoryRevisitIds]);
  const unresolvedQuestions = uniq([...prior("unresolvedQuestions"), ...(movie?.unresolvedQuestion ? [movie.unresolvedQuestion] : []), ...relations.map((relation) => `What becomes newly meaningful after ${eventLabel(graph, relation.to)}?`)], 16);
  const carryThreads = uniq([...prior("carryThreads"), ...graph.recurringSignals, ...graph.unresolvedTensions, ...continuityHooks, ...(input.memoryContext ?? []).filter((value) => clean(value).length > 2)], 24);
  const semanticTurnKeys = uniq([...prior("semanticTurnKeys"), ...relations.map(relationKey)]);
  const relationKinds = uniq([...prior("relationKinds"), ...relations.map((relation) => relation.kind)]);
  const operations = uniq(trajectory.map((step) => step.operation));
  const semanticTurns = semanticSteps.map((step) => clean(step.viewerChange)).filter(Boolean);

  const continuationValue = metric(Math.min(1, unresolvedQuestions.length / 4) * 0.3 + Math.min(1, graph.recurringSignals.length / 4) * 0.2 + Math.min(1, callbackEventIds.length / 4) * 0.12 + Math.min(1, changedEventIds.length / 5) * 0.12 + Math.min(1, previous.length / 3) * 0.11 + Math.min(1, revisitedEventIds.length / 2) * 0.08 + ((input.round ?? 1) > 1 ? 0.15 : 0));

  const priorFutureEventIds = prior("futureEventIds");
  const futureEventIds = deriveFutureEventIds(graph, carrierEventIds, payoffEventIds);
  const consumedFutureEventIds = uniq([...prior("consumedFutureEventIds"), ...priorFutureEventIds.filter((id) => carrierEventIds.includes(id) || payoffEventIds.includes(id))], 24);
  const retiredFutureThreadKeys = uniq([...prior("retiredFutureThreadKeys"), ...priorFutureEventIds.filter((id) => consumedFutureEventIds.includes(id)).map((id) => `future:${id}`)], 32);
  const activeFutureEventIds = futureEventIds.filter((id) => !consumedFutureEventIds.includes(id));
  const futureThreadKeys = uniq(activeFutureEventIds.map((id) => `future:${id}`), 32);
  const lookaheadValue = metric(activeFutureEventIds.length ? Math.min(1, activeFutureEventIds.length / 5) : 0);

  const endpointPressure = metric(payoffEventIds.length ? 0.45 + Math.min(0.4, changedEventIds.length * 0.05) : 0.1 + Math.min(0.45, changedEventIds.length * 0.08));
  const tempo = deriveTempo({ semanticSteps, activeTensions: activeTensionKeys.length, resolvedTensions: resolvedTensionKeys.length, revisits: revisitedEventIds.length, continuationValue, lookaheadValue, endpointPressure, round: input.round ?? 1 });
  const attentionPotential = metric(Math.min(1, semanticSteps.length / 4) * 0.25 + continuationValue * 0.22 + lookaheadValue * 0.2 + tempo.nextBeatPull * 0.18 + Math.min(1, revisitedEventIds.length / 2) * 0.15);

  const worldSimulation = input.worldSimulation ?? buildAuthorWorldSimulation({
    reality: graph,
    subject: input.movie?.storyThesis?.semanticRealization?.subject,
    lens: input.lens,
    priorExperienceIds: previous.map((state) => state.selectedMovieId).filter((id): id is string => Boolean(id)),
  });

  const memoryHooks = uniq([
    ...prior("memoryHooks").filter((hook) => !retiredFutureThreadKeys.includes(hook)),
    ...graph.recurringSignals.map((value) => `recurring:${value}`),
    ...graph.unresolvedTensions.map((value) => `tension:${value}`),
    ...continuityHooks,
    ...revisitedEventIds.map((id) => `revisit:${id}`),
    ...worldSimulation.durableThreads.map((thread) => `world-thread:${thread.id}`),
    ...worldSimulation.reentry.eligibleCallbacks.map((callback) => `world-callback:${callback}`),
    ...futureThreadKeys,
    ...retiredFutureThreadKeys.slice(-8),
    `tempo:${tempo.mode}`,
  ], 64);

  return {
    version: 1,
    realityAnchors,
    worldSimulation,
    establishedEventIds,
    changedEventIds,
    carrierEventIds,
    activeTensionKeys,
    resolvedTensionKeys,
    setupEventIds,
    callbackEventIds,
    revisitedEventIds,
    unresolvedQuestions,
    carryThreads,
    futureEventIds: activeFutureEventIds,
    futureThreadKeys,
    consumedFutureEventIds,
    retiredFutureThreadKeys,
    semanticTurnKeys,
    relationKinds,
    continuationValue,
    lookaheadValue,
    endpointPressure,
    attentionPotential,
    tempo,
    selectedLens: clean(input.lens) || "neutral",
    selectedMovieId: movie?.id,
    payoffEventIds,
    earnedByEventIds: uniq([...carrierEventIds, ...(payoffStep?.eventIds ?? [])]),
    chapter: { openingEventIds: trajectory[0]?.eventIds ?? [], finalEventIds: payoffEventIds, semanticTurns, operations },
    memoryHooks,
  };
}

export function summarizeAuthorExperienceState(state: AuthorExperienceState): string[] {
  const simulation = state.worldSimulation;
  return [
    `EXPERIENCE STATE: ${state.chapter.operations.join(" → ") || "empty"}`,
    `REALITY ANCHORS: ${state.realityAnchors?.length ?? 0}`,
    `ESTABLISHED: ${state.establishedEventIds.join(", ") || "none"}`,
    `CHANGED: ${state.changedEventIds.join(", ") || "none"}`,
    `ACTIVE TENSIONS: ${state.activeTensionKeys.length}`,
    `RESOLVED TENSIONS: ${state.resolvedTensionKeys.length}`,
    `REVISITS: ${state.revisitedEventIds.join(", ") || "none"}`,
    `OPEN QUESTIONS: ${state.unresolvedQuestions.slice(0, 4).join(" | ") || "none"}`,
    `FUTURE THREADS: ${state.futureThreadKeys.slice(0, 6).join(", ") || "none"}`,
    `RETIRED FUTURES: ${state.retiredFutureThreadKeys.slice(0, 6).join(", ") || "none"}`,
    `TEMPO: ${state.tempo.mode} urgency=${state.tempo.urgency} pull=${state.tempo.nextBeatPull}`,
    `TEMPO ARC: ${state.tempo.arc.join(" → ")}`,
    `CONTINUATION=${state.continuationValue} LOOKAHEAD=${state.lookaheadValue} ATTENTION=${state.attentionPotential}`,
    ...(simulation ? [
      `WORLD SIMULATION: refs=${simulation.refs.length} relations=${simulation.relations.length} snapshots=${simulation.snapshots.length}`,
      `WORLD QUESTIONS: ${simulation.questions.slice(0, 4).map((question) => question.text).join(" | ") || "none"}`,
      `WORLD HYPOTHESES: ${simulation.viewer.hypotheses.slice(0, 3).map((hypothesis) => `${hypothesis.status}:${hypothesis.interpretation}`).join(" | ") || "none"}`,
      `WORLD PREDICTION ERRORS: ${simulation.viewer.predictionErrors.length}`,
      `WORLD THREADS: ${simulation.durableThreads.slice(0, 5).map((thread) => thread.id).join(", ") || "none"}`,
      `WORLD REENTRY: meaningCanChange=${simulation.reentry.meaningCanChange} callbacks=${simulation.reentry.eligibleCallbacks.length}`,
    ] : []),
  ];
}
