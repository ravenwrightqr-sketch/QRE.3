import type {
  AuthorDomainContext,
  AuthorExperienceState,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
} from "@qre/contracts";
import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";
import { rerankByViewerState } from "./authorViewerState.js";
import { selectDistinctMovieCandidates } from "./authorMovieDifferentiation.js";
import {
  buildAuthorExperienceState,
  summarizeAuthorExperienceState,
} from "./authorExperienceState.js";
import { deriveLatentStoryThesis } from "./authorLatentStoryThesis.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { rankLensOpportunities } from "./authorLensRanking.js";
import { resolveLensPolicy } from "./authorLensPolicy.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph?: RealityGraph;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  priorStrategies?: string[];
  round?: number;
  movieMode?: boolean;
};

export type AttentionCandidate = {
  strategy: string;
  reason: string;
  score: number;
};

export type CharacterFrameCandidate = {
  frame: string;
  reason: string;
  confidence: number;
};

export type CharacterRead = {
  coreTraits: string[];
  contradictions: string[];
  statusPosture: string;
  emotionalPosture: string;
  objectRelationships: string[];
  creativeFrames: CharacterFrameCandidate[];
  allowedMoves: string[];
  avoidedMoves: string[];
};

export type CognitiveReadoutDecision = {
  order: number;
  eventIds: string[];
  purpose: string;
  currentEvidence: string[];
  futureEvidence: string[];
  viewerStateBefore: string;
  viewerStateAfter: string;
  attentionTarget: string;
  semanticTurn?: string;
  withheldInformation: string[];
  nextPressure: string;
  terminal: boolean;
};

export type AuthorCognitivePlan = {
  mode: string;
  selectedFrame: string;
  chosenAttentionStrategy: string;
  attentionCandidates: AttentionCandidate[];
  characterRead: CharacterRead;
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  readoutPlan: CognitiveReadoutDecision[];
  experienceState?: AuthorExperienceState;
  operatorMix: string[];
  callbackTargets: string[];
  antiRepetitionRules: string[];
  sceneRules: string[];
  authorBrief: string[];
  permanentTruths: string[];
  currentEvidence: string[];
  contradictions: string[];
  graphSummary: string;
  movieSummary: string;
  frameSummary: string;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const uniq = <T>(values: readonly T[], limit = 24): T[] =>
  [...new Set(values)].slice(0, limit);

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const PRIOR_STATE_PREFIX = "QRE_AUTHOR_EXPERIENCE_STATE::";

function domainContextText(context?: AuthorDomainContext): string[] {
  if (!context) return [];
  return [
    context.category ? `domain category: ${context.category}` : "",
    context.businessType ? `business type: ${context.businessType}` : "",
    context.businessName ? `business name: ${context.businessName}` : "",
    context.businessDescription ? `business description: ${context.businessDescription}` : "",
    context.serviceType ? `service type: ${context.serviceType}` : "",
    context.serviceName ? `service: ${context.serviceName}` : "",
    context.subjectKind ? `subject kind: ${context.subjectKind}` : "",
    ...(context.knownCapabilities ?? []).map((item) => `known capability: ${item}`),
    ...(context.contextualSignals ?? []).map((item) => `contextual signal: ${item}`),
  ].filter(Boolean);
}

function eventById(graph: RealityGraph | undefined, id: string): RealityGraph["events"][number] | undefined {
  return graph?.events.find((event) => event.id === id);
}

function structureById(graph: RealityGraph | undefined, id: string) {
  return graph?.eventStructure?.find((item) => item.eventId === id);
}

function relationKindsBetween(graph: RealityGraph | undefined, from: string, to: string): string[] {
  if (!graph) return [];
  return uniq(
    graph.relations
      .filter((relation) => relation.from === from && relation.to === to)
      .map((relation) => relation.kind),
    10,
  );
}

function relationStrengthBetween(graph: RealityGraph | undefined, from: string, to: string): number {
  if (!graph) return 0;
  return graph.relations
    .filter((relation) => relation.from === from && relation.to === to)
    .reduce((max, relation) => Math.max(max, relation.strength), 0);
}

function hasStrongTemporalRelation(graph: RealityGraph | undefined, from: string, to: string): boolean {
  const kinds = relationKindsBetween(graph, from, to);
  return kinds.includes("before") || kinds.includes("after") || kinds.includes("causes") || kinds.includes("changes");
}

function parsePriorExperienceStates(values?: readonly string[]): AuthorExperienceState[] {
  const states: AuthorExperienceState[] = [];
  for (const value of values ?? []) {
    if (!value.startsWith(PRIOR_STATE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(value.slice(PRIOR_STATE_PREFIX.length)) as AuthorExperienceState;
      if (parsed?.version === 1 && parsed.tempo) states.push(parsed);
    } catch {
      /* historical learning context is advisory */
    }
  }
  return states;
}

function enrichMovieCandidate(candidate: LatentMovieCandidate, graph: RealityGraph | undefined): LatentMovieCandidate {
  if (!graph || !candidate.trajectory.length) return candidate;
  const storyThesis = deriveLatentStoryThesis(graph, candidate);
  return {
    ...candidate,
    storyThesis,
    hypothesis: [
      ...candidate.hypothesis,
      ...(storyThesis.semanticTurn
        ? [`Semantic turn: ${storyThesis.semanticTurn}`]
        : ["No graph-backed semantic turn was present; presentation movement remains distinct from semantic interpretation."]),
      "The realization may change status, attitude, implication, or framing, but may not create a new event.",
    ].slice(0, 8),
  };
}

function autoLensCandidates(input: AuthorCognitionInput): CharacterFrameCandidate[] {
  if (!input.realityGraph) {
    return [{ frame: "NONE", reason: "RealityGraph unavailable; preserve supplied reality until a canonical world representation exists.", confidence: 0 }];
  }
  const envelope = buildAuthorRealityEnvelope({ graph: input.realityGraph, subject: input.subject });
  return rankLensOpportunities(envelope).map((candidate) => ({
    frame: candidate.frame,
    reason: candidate.reason,
    confidence: candidate.confidence,
  }));
}

function resolveLens(input: AuthorCognitionInput): string {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") return explicit;
  return autoLensCandidates(input)[0]?.frame ?? "NONE";
}

function explicitSourceSpineScore(graph: RealityGraph | undefined, candidate: LatentMovieCandidate): number {
  if (!graph) return 0;
  const ids = uniq(candidate.trajectory.flatMap((step) => step.eventIds), 40);
  if (ids.length < 3) return 0;

  let temporalLinks = 0;
  let structuralLinks = 0;
  let denseEvents = 0;
  let salient = 0;

  for (let index = 0; index < ids.length; index += 1) {
    const structure = structureById(graph, ids[index]);
    if (structure && (structure.actions.length || structure.temporalMarkers.length)) denseEvents += 1;
    const event = eventById(graph, ids[index]);
    if (event?.salient) salient += 1;
    if (index === 0) continue;
    const from = ids[index - 1];
    const to = ids[index];
    if (hasStrongTemporalRelation(graph, from, to) || hasStrongTemporalRelation(graph, to, from)) temporalLinks += 1;
    if (relationKindsBetween(graph, from, to).length || relationKindsBetween(graph, to, from).length) structuralLinks += 1;
  }

  const density = denseEvents / Math.max(ids.length, 1);
  const temporal = temporalLinks / Math.max(ids.length - 1, 1);
  const structural = structuralLinks / Math.max(ids.length - 1, 1);
  const salience = salient / Math.max(ids.length, 1);
  return metric(density * 0.32 + temporal * 0.34 + structural * 0.18 + salience * 0.16);
}

function sourceLedCandidate(candidates: LatentMovieCandidate[], graph: RealityGraph | undefined): LatentMovieCandidate | undefined {
  const source = candidates.find((candidate) => candidate.id === "movie-source");
  if (!source) return undefined;
  return explicitSourceSpineScore(graph, source) >= 0.48 ? source : undefined;
}

function movieFor(input: AuthorCognitionInput, lens: string): {
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
} {
  if (input.movieMode === false || !input.realityGraph) return { latentMovieCandidates: [] };

  const searched = searchUniversalMovieCandidates({
    graph: input.realityGraph,
    subject: input.subject,
    lens,
    limit: 10,
  });
  const enriched = searched.map((candidate) => enrichMovieCandidate(candidate, input.realityGraph));
  const differentiated = selectDistinctMovieCandidates(enriched, 6);
  const ranked = rerankByViewerState(input.realityGraph, differentiated);
  const selectedMovie = sourceLedCandidate(ranked, input.realityGraph) ?? ranked[0];
  return { latentMovieCandidates: ranked, selectedMovie };
}

function traits(input: AuthorCognitionInput): string[] {
  return uniq(
    [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])].filter((value) =>
      /\b(?:nervous|scared|fierce|sweet|gentle|wild|goofy|stubborn|proud|confident|quiet|loud|funny|mischievous|tired|calm|excited|happy|angry|afraid)\b/i.test(value),
    ),
    8,
  );
}

function contradictions(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;
  return uniq([
    ...(graph?.unresolvedTensions ?? []),
    ...(graph?.relations
      .filter((relation) => relation.kind === "contrasts" || relation.kind === "changes" || relation.kind === "recontextualizes")
      .slice(0, 8)
      .map((relation) => `supplied relationship: ${relation.kind}`) ?? []),
  ], 12);
}

function objectRelationships(input: AuthorCognitionInput): string[] {
  return uniq(
    input.realityGraph?.events.filter((event) => event.entities.length > 1).map((event) => event.label) ?? [],
    12,
  );
}

function frames(input: AuthorCognitionInput, movie: LatentMovieCandidate | undefined, selectedLens: string): CharacterFrameCandidate[] {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") {
    const policy = resolveLensPolicy(explicit);
    return [{
      frame: explicit,
      reason: `explicit user perspective; ${policy.worldOrbit.slice(0, 4).join(", ")} is the permitted world orbit, with ${policy.observerTarget.slice(0, 4).join(", ")} as the observer target`,
      confidence: 0.95,
    }];
  }
  const automatic = autoLensCandidates(input);
  if (automatic[0]?.frame === selectedLens && automatic[0]?.frame !== "NONE") return automatic;
  const relationKinds = new Set(input.realityGraph?.relations.map((relation) => relation.kind) ?? []);
  const out: CharacterFrameCandidate[] = [];
  if (relationKinds.has("contrasts")) out.push({ frame: "contrast", reason: "the supplied world contains a material contrast", confidence: 0.9 });
  if (relationKinds.has("recontextualizes")) out.push({ frame: "recontextualization", reason: "one supplied detail changes another detail's meaning", confidence: 0.9 });
  if (relationKinds.has("repeats") || (input.round ?? 1) > 1) out.push({ frame: "callback", reason: "the world contains continuity material", confidence: 0.88 });
  if (movie?.storyThesis?.semanticTurn) out.push({ frame: "character consequence", reason: "the selected movie contains a real graph-backed semantic turn", confidence: 0.86 });
  return out.length ? out : automatic;
}

function operationsForMovie(movie: LatentMovieCandidate | undefined): string[] {
  return movie?.trajectory.map((step) => clean(step.operation)).filter(Boolean) ?? [];
}

function callbackTargetsFor(input: AuthorCognitionInput, permanentTruths: readonly string[], experienceState: AuthorExperienceState | undefined): string[] {
  return uniq([
    ...(input.priorScenes ?? []),
    ...(input.realityGraph?.recurringSignals ?? []),
    ...permanentTruths,
    ...(experienceState?.memoryHooks ?? []),
  ], 20);
}

function buildAttentionCandidates(): AttentionCandidate[] {
  return [
    { strategy: "graph_relationship", reason: "Prefer supplied relationships over isolated facts.", score: 100 },
    { strategy: "viewer_state_change", reason: "Prefer cuts that materially change attention, curiosity, expectation, or meaning.", score: 99 },
    { strategy: "change", reason: "Prefer supplied changes that alter meaning.", score: 96 },
    { strategy: "contrast", reason: "Prefer supplied contrasts when they produce a stronger movie.", score: 94 },
    { strategy: "recurrence", reason: "Use persistent repetition when memory makes it meaningful.", score: 90 },
    { strategy: "continuity", reason: "Use prior chapters when they materially change current meaning.", score: 88 },
  ];
}

function buildAntiRepetitionRules(): string[] {
  return [
    "Do not restart the subject's biography on every chapter.",
    "A callback must change meaning, not merely repeat wording.",
    "A revisit must return to established evidence only after new evidence exists to change its reading.",
    "Prefer the strongest connected evidence over complete source coverage.",
    "Identity metadata is world state, not an automatic experience sequence item.",
    "Do not promote a lens phrase into a fact.",
    "A semantic turn must cite a real graph relationship or sequence-backed supplied interpretation.",
    "Leave an authorized future thread alive when continuation value is high.",
  ];
}

function buildSceneRules(experienceState: AuthorExperienceState | undefined, selectedLens: string): string[] {
  const lens = resolveLensPolicy(selectedLens);
  return [
    "Readout count is not fixed. Cognition determines how many viewer-facing transitions the experience earns.",
    "One readout is one viewer-facing sequence moment; it is not required to correspond one-to-one with source sentences.",
    "Use the minimum language required for the current readout to land.",
    "Creative language may change framing and attitude but never source truth.",
    "The selected lens is a perceptual policy: privilege only its authorized world orbit and observer target over supplied reality.",
    `Human spine: ${lens.humanSpine}.`,
    `World orbit: ${lens.worldOrbit.join(", ")}.`,
    `Environmental operators: ${lens.environmentalOperators.join(", ")}.`,
    `Observer target: ${lens.observerTarget.join(", ")}.`,
    `Preferred realization moves: ${lens.realizationMoves.join(", ")}.`,
    `Forbidden lens moves remain hard constraints: ${lens.forbiddenRealityMoves.join(", ")}.`,
    `Lens intensity: ${lens.intensity}.`,
    "A readout should change viewer state through attention, curiosity, contrast, interruption, accumulation, recontextualization, or payoff.",
    "Never spend a future outcome in an earlier readout merely because Cognition knows it exists.",
    "Finish when the selected payoff lands; do not manufacture a final event.",
    "Treat NONE as a valid authorial lens decision when the supplied material itself has stronger character than a genre frame.",
    "A user-selected lens is authoritative and must be preserved exactly; automatic lens selection is subordinate to it.",
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
  ];
}

function purposeForStep(step: LatentMovieTrajectoryStep, index: number, total: number): string {
  if (index === 0) return "establish";
  if (index === total - 1 || step.operation === "payoff") return "payoff";
  if (step.operation === "consequence" || step.operation === "converge") return "consequence";
  if (step.operation === "reframe") return "recontextualize";
  if (step.operation === "contrast") return "contrast";
  if (step.operation === "recur") return "recontextualize";
  if (step.operation === "escalate") return "escalate";
  return "reveal";
}

function collectEvidence(graph: RealityGraph | undefined, eventIds: readonly string[]): string[] {
  return uniq(
    eventIds.flatMap((id) => {
      const event = eventById(graph, id);
      return event ? [event.label, ...(event.sourceIds ?? [])] : [];
    }),
    12,
  );
}

function nextFutureEvidence(graph: RealityGraph | undefined, steps: readonly LatentMovieTrajectoryStep[], index: number): string[] {
  return collectEvidence(graph, steps.slice(index + 1).flatMap((step) => step.eventIds ?? []));
}

function attentionTargetFor(graph: RealityGraph | undefined, step: LatentMovieTrajectoryStep): string {
  const evidence = collectEvidence(graph, step.eventIds);
  return evidence[0] || clean(step.viewerChange) || "current supplied change";
}

function readoutStateBefore(previous?: CognitiveReadoutDecision): string {
  return previous?.viewerStateAfter || "baseline attention";
}

function readoutStateAfter(step: LatentMovieTrajectoryStep): string {
  return clean(step.viewerChange) || "attention advances";
}

function shouldMergeReadouts(graph: RealityGraph | undefined, left: LatentMovieTrajectoryStep, right: LatentMovieTrajectoryStep): boolean {
  const leftIds = uniq(left.eventIds, 20);
  const rightIds = uniq(right.eventIds, 20);
  if (!leftIds.length || !rightIds.length) return true;
  if (hasStrongTemporalRelation(graph, leftIds[leftIds.length - 1], rightIds[0])) return false;
  if (left.operation !== right.operation) return false;
  if (clean(left.viewerChange) !== clean(right.viewerChange)) return false;
  return relationStrengthBetween(graph, leftIds[leftIds.length - 1], rightIds[0]) < 0.45;
}

function materializeReadoutTrajectory(
  candidate: LatentMovieCandidate,
  graph: RealityGraph | undefined,
): { movie: LatentMovieCandidate; decisions: CognitiveReadoutDecision[] } {
  const sourceSteps = candidate.trajectory.filter((step) => step.eventIds.length || clean(step.viewerChange));
  if (!sourceSteps.length) return { movie: candidate, decisions: [] };

  const sourceLed = candidate.id === "movie-source" && sourceSteps.length >= 3;
  const expanded: LatentMovieTrajectoryStep[] = [];

  for (const step of sourceSteps) {
    const ids = uniq(step.eventIds, 20);
    if (sourceLed && ids.length > 1) {
      for (const eventId of ids) expanded.push({ ...step, eventIds: [eventId] });
      continue;
    }
    const temporalIds = ids.length > 1 && ids.some((id, index) => index > 0 && hasStrongTemporalRelation(graph, ids[index - 1], id));
    if (temporalIds) {
      for (const eventId of ids) expanded.push({ ...step, eventIds: [eventId] });
    } else {
      expanded.push({ ...step, eventIds: ids });
    }
  }

  const merged: LatentMovieTrajectoryStep[] = [];
  for (const step of expanded) {
    const previous = merged[merged.length - 1];
    if (previous && !sourceLed && shouldMergeReadouts(graph, previous, step)) {
      merged[merged.length - 1] = {
        ...previous,
        eventIds: uniq([...(previous.eventIds ?? []), ...(step.eventIds ?? [])], 20),
        viewerChange: clean(step.viewerChange) || previous.viewerChange,
        nextQuestion: clean(step.nextQuestion) || previous.nextQuestion,
        operation: step.operation === "payoff" ? "payoff" : previous.operation,
      };
    } else {
      merged.push({ ...step, eventIds: uniq(step.eventIds, 20) });
    }
  }

  const decisions: CognitiveReadoutDecision[] = [];
  const steps = merged.map((step, index) => ({ ...step, order: index + 1 }));

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const terminal = index === steps.length - 1 || step.operation === "payoff";
    const previous = decisions[index - 1];
    const currentEvidence = collectEvidence(graph, step.eventIds);
    const futureEvidence = nextFutureEvidence(graph, steps, index);
    const semanticTurn = candidate.storyThesis?.semanticTurn;
    const purpose = purposeForStep(step, index, steps.length);

    decisions.push({
      order: index + 1,
      eventIds: [...step.eventIds],
      purpose,
      currentEvidence,
      futureEvidence,
      viewerStateBefore: readoutStateBefore(previous),
      viewerStateAfter: readoutStateAfter(step),
      attentionTarget: attentionTargetFor(graph, step),
      semanticTurn,
      withheldInformation: futureEvidence.slice(0, 3),
      nextPressure: clean(step.nextQuestion),
      terminal,
    });
  }

  return {
    movie: {
      ...candidate,
      trajectory: steps,
    },
    decisions,
  };
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const selectedLens = resolveLens(input);
  const movie = movieFor(input, selectedLens);
  const selectedMovieSeed = movie.selectedMovie;

  const materialized = selectedMovieSeed && input.realityGraph
    ? materializeReadoutTrajectory(selectedMovieSeed, input.realityGraph)
    : { movie: selectedMovieSeed, decisions: [] as CognitiveReadoutDecision[] };

  const selectedMovie = materialized.movie;
  const latentMovieCandidates = movie.latentMovieCandidates.map((candidate) =>
    candidate.id === selectedMovie?.id && selectedMovie ? selectedMovie : candidate,
  );

  const priorExperienceStates = parsePriorExperienceStates(input.priorStrategies);
  const experienceState = input.realityGraph && selectedMovie
    ? buildAuthorExperienceState({
        graph: input.realityGraph,
        movie: selectedMovie,
        lens: selectedLens,
        priorScenes: input.priorScenes,
        memoryContext: input.memoryContext,
        priorExperienceStates,
        round: input.round,
      })
    : undefined;

  const permanentTruths = uniq([...input.facts, ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq([
    ...input.sourceMoments,
    ...(input.realityGraph?.events ?? []).map((event) => event.label),
  ], 30);
  const contradictionList = contradictions(input);

  const characterRead: CharacterRead = {
    coreTraits: traits(input),
    contradictions: contradictionList,
    statusPosture: contradictionList[0] ?? "defined by supplied reality",
    emotionalPosture: contradictionList[0] ? `emotion sits inside ${contradictionList[0]}` : "emotion should be inferred from supplied evidence",
    objectRelationships: objectRelationships(input),
    creativeFrames: frames(input, selectedMovie, selectedLens),
    allowedMoves: [
      "metaphor",
      "personification",
      "status language",
      "double meaning",
      "comic framing",
      "understatement",
      "callback",
      "recontextualization",
      "revisit",
      "future tease",
      "lens amplification",
    ],
    avoidedMoves: [
      "invented concrete events",
      "invented people",
      "invented locations",
      "invented reactions",
      "invented chronology",
      "literalized lens props",
      "planner language",
      "analytic explanation",
      "future-outcome leakage into current readout",
    ],
  };

  const attentionCandidates = buildAttentionCandidates();
  const chosen = selectedMovie ? "latent_movie" : "direct_grounded";
  const operatorMix = operationsForMovie(selectedMovie);
  const callbackTargets = callbackTargetsFor(input, permanentTruths, experienceState);
  const antiRepetitionRules = buildAntiRepetitionRules();
  const sceneRules = buildSceneRules(experienceState, selectedLens);

  const graphSummary = input.realityGraph
    ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations.`
    : "REALITY GRAPH: unavailable.";

  const dynamics = selectedMovie?.viewerStateDynamics;
  const semanticTurn = selectedMovie?.storyThesis?.semanticTurn;
  const movieSummary = selectedMovie
    ? [
        `SELECTED MOVIE: ${selectedMovie.hypothesis.join(" ")}`,
        `SEMANTIC TURN: ${semanticTurn || "none"}`,
        `THESIS RELATION: ${selectedMovie.storyThesis?.relationKind ?? "none"}`,
        `CANDIDATE COUNT: ${movie.latentMovieCandidates.length}`,
        `VIEWER-STATE SCORE: ${dynamics?.score ?? "n/a"}`,
        `COGNITIVE READOUTS: ${materialized.decisions.length}`,
        `READOUT PURPOSES: ${materialized.decisions.map((decision) => decision.purpose).join(" -> ") || "none"}`,
      ].join(" ")
    : "MOVIE DISCOVERY: off or unavailable; remain direct and grounded.";

  const lensPolicy = resolveLensPolicy(selectedLens);
  const frameSummary = `FRAME: ${selectedLens}. HUMAN SPINE: ${lensPolicy.humanSpine}. WORLD ORBIT: ${lensPolicy.worldOrbit.join(", ")}. OBSERVER TARGET: ${lensPolicy.observerTarget.join(", ")}. REALIZATION: ${lensPolicy.realizationMoves.join(", ")}. FORBIDDEN: ${lensPolicy.forbiddenRealityMoves.join(", ")}. A frame changes perspective, never reality.`;

  const authorBrief = [
    `MODE: ${chosen}`,
    frameSummary,
    graphSummary,
    movieSummary,
    `DOMAIN: ${domainContextText(input.domainContext).join(" | ") || "universal"}`,
    `COGNITIVE READOUT AUTHORITY: ${materialized.decisions.length} viewer-facing transitions selected from supplied reality and approved semantic structure.`,
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
    "Reality is immutable. Creativity never becomes evidence.",
    "Lens is an amplification policy, not permission to add world facts.",
    "Cognition owns readout count, order, current evidence, future reservation, and sequence termination.",
  ];

  return {
    mode: chosen,
    selectedFrame: selectedLens,
    chosenAttentionStrategy: chosen,
    attentionCandidates,
    characterRead,
    latentMovieCandidates,
    selectedMovie,
    readoutPlan: materialized.decisions,
    experienceState,
    operatorMix,
    callbackTargets,
    antiRepetitionRules,
    sceneRules,
    authorBrief,
    permanentTruths,
    currentEvidence,
    contradictions: contradictionList,
    graphSummary,
    movieSummary,
    frameSummary,
  };
}
