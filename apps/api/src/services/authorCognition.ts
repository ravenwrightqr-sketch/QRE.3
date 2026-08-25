import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";
import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph?: RealityGraph;
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

export type AuthorCognitivePlan = {
  mode: string;
  selectedFrame: string;
  chosenAttentionStrategy: string;
  attentionCandidates: AttentionCandidate[];
  characterRead: CharacterRead;
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
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

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = <T>(values: readonly T[], limit = 24): T[] => [...new Set(values)].slice(0, limit);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));

function eventById(graph: RealityGraph | undefined, id: string) {
  return graph?.events.find((event) => event.id === id);
}

function semanticTurnForStep(
  _graph: RealityGraph | undefined,
  step: LatentMovieTrajectoryStep,
  _lens?: string,
): string {
  return clean(step.viewerChange);
}

function enrichMovieCandidate(
  candidate: LatentMovieCandidate,
  graph: RealityGraph | undefined,
  lens?: string,
): LatentMovieCandidate {
  if (!graph || !candidate.trajectory.length) return candidate;

  const trajectory = candidate.trajectory.map((step) => ({
    ...step,
    viewerChange: semanticTurnForStep(graph, step, lens),
  }));

  const firstMeaningful = trajectory.find((step) => step.operation !== "establish" && step.operation !== "payoff");
  const payoff = trajectory.find((step) => step.operation === "payoff");

  const carrierEventIds = uniq(
    trajectory
      .filter((step) => step !== payoff && step.operation !== "establish")
      .flatMap((step) => step.eventIds),
    8,
  );

  const sealingEventIds = uniq(payoff?.eventIds ?? [], 8);
  const initialEventId = trajectory[0]?.eventIds[0] ?? "";
  const initial = eventById(graph, initialEventId)?.label ?? candidate.evidence[0] ?? "the supplied opening";
  const semanticTurn = firstMeaningful?.viewerChange ?? "the supplied relationship changes the reading";
  const payoffLabel = eventById(graph, payoff?.eventIds[payoff.eventIds.length - 1] ?? "")?.label ?? candidate.payoff;
  const beforeEventIds = firstMeaningful?.eventIds?.length ? [firstMeaningful.eventIds[0]] : [initialEventId];
  const afterEventIds = firstMeaningful?.eventIds?.length && firstMeaningful.eventIds.length > 1
    ? [firstMeaningful.eventIds[firstMeaningful.eventIds.length - 1]]
    : [];
  const relationKind = candidate.supportingRelationKinds.find((kind) =>
    ["before", "after", "causes", "changes", "contrasts", "repeats", "belongs_to", "involves", "recontextualizes", "converges"].includes(kind),
  );

  return {
    ...candidate,
    trajectory,
    storyThesis: {
      initialReading: initial,
      semanticTurn,
      beforeEventIds,
      afterEventIds,
      relationKind,
      beforeMeaning: beforeEventIds.map((id) => clean(eventById(graph, id)?.label)).filter(Boolean),
      afterMeaning: afterEventIds.map((id) => clean(eventById(graph, id)?.label)).filter(Boolean),
      carrierEventIds,
      sealingEventIds,
      payoffDependency: `The supplied endpoint (${payoffLabel}) must feel earned by the semantic turn, not by adding a new event.`,
      counterfactualDependency: metric(0.35 + carrierEventIds.length * 0.08),
    },
    hypothesis: [
      ...candidate.hypothesis,
      `Semantic turn: ${semanticTurn}.`,
      "The realization may change status, attitude, implication, or framing, but may not create a new event.",
    ].slice(0, 8),
  };
}

function movieFor(
  input: AuthorCognitionInput,
): { latentMovieCandidates: LatentMovieCandidate[]; selectedMovie?: LatentMovieCandidate } {
  if (input.movieMode === false || !input.realityGraph) return { latentMovieCandidates: [] };

  const candidates = searchUniversalMovieCandidates({
    graph: input.realityGraph,
    subject: input.subject,
    lens: input.lens,
    limit: 10,
  }).map((candidate) => enrichMovieCandidate(candidate, input.realityGraph, input.lens));

  return { latentMovieCandidates: candidates, selectedMovie: candidates[0] };
}

function traits(input: AuthorCognitionInput): string[] {
  const all = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])];
  return uniq(all.filter((v) => /\b(?:nervous|scared|fierce|sweet|gentle|wild|goofy|stubborn|proud|confident|quiet|loud|funny|mischievous|tired|calm|excited|happy|angry|afraid)\b/i.test(v)), 8);
}

function contradictions(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;
  return uniq([
    ...(graph?.unresolvedTensions ?? []),
    ...(graph?.relations
      .filter((r) => r.kind === "contrasts" || r.kind === "changes" || r.kind === "recontextualizes")
      .slice(0, 8)
      .map((r) => `supplied relationship: ${r.kind}`) ?? []),
  ], 12);
}

function objectRelationships(input: AuthorCognitionInput): string[] {
  return uniq(
    input.realityGraph?.events
      .filter((event) => event.entities.length > 1)
      .map((event) => event.label) ?? [],
    12,
  );
}

function frames(input: AuthorCognitionInput, movie: LatentMovieCandidate | undefined): CharacterFrameCandidate[] {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") {
    return [{ frame: explicit, reason: "explicit user perspective", confidence: 0.95 }];
  }

  const relationKinds = new Set(input.realityGraph?.relations.map((r) => r.kind) ?? []);
  const out: CharacterFrameCandidate[] = [];
  if (relationKinds.has("contrasts")) out.push({ frame: "contrast", reason: "the supplied world contains a material contrast", confidence: 0.9 });
  if (relationKinds.has("recontextualizes")) out.push({ frame: "recontextualization", reason: "one supplied detail changes another detail's meaning", confidence: 0.9 });
  if (relationKinds.has("repeats") || (input.round ?? 1) > 1) out.push({ frame: "callback", reason: "the world contains continuity material", confidence: 0.88 });
  if (movie?.storyThesis?.semanticTurn) out.push({ frame: "character consequence", reason: "the selected movie has a semantic turn", confidence: 0.86 });
  return out.length ? out : [{ frame: "NONE", reason: "the natural reality is the strongest available lens", confidence: 1 }];
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const movie = movieFor(input);
  const permanentTruths = uniq([...input.facts, ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq([...input.sourceMoments, ...(input.realityGraph?.events.map((event) => event.label) ?? [])], 30);
  const contradictionList = contradictions(input);

  const characterRead: CharacterRead = {
    coreTraits: traits(input),
    contradictions: contradictionList,
    statusPosture: contradictionList[0] ?? "defined by supplied reality",
    emotionalPosture: contradictionList[0] ? `emotion sits inside ${contradictionList[0]}` : "emotion should be inferred from supplied evidence",
    objectRelationships: objectRelationships(input),
    creativeFrames: frames(input, movie.selectedMovie),
    allowedMoves: ["metaphor", "personification", "status language", "double meaning", "comic framing", "understatement", "callback", "recontextualization"],
    avoidedMoves: ["invented concrete events", "invented people", "invented locations", "invented reactions", "invented chronology", "planner language", "analytic explanation"],
  };

  const selectedFrame = characterRead.creativeFrames[0]?.frame ?? "NONE";
  const attentionCandidates: AttentionCandidate[] = [
    { strategy: "graph_relationship", reason: "Prefer supplied relationships over isolated facts.", score: 100 },
    { strategy: "change", reason: "Prefer supplied changes that alter meaning.", score: 96 },
    { strategy: "contrast", reason: "Prefer supplied contrasts when they produce a stronger movie.", score: 94 },
    { strategy: "recurrence", reason: "Use persistent repetition when memory makes it meaningful.", score: 90 },
    { strategy: "continuity", reason: "Use prior chapters when they materially change current meaning.", score: 88 },
  ];

  const chosen = movie.selectedMovie ? "latent_movie" : "direct_grounded";
  const operatorMix = movie.selectedMovie?.trajectory.map((step) => step.operation).filter(Boolean) as string[] ?? [];
  const callbackTargets = uniq([
    ...(input.priorScenes ?? []),
    ...(input.realityGraph?.recurringSignals ?? []),
    ...permanentTruths,
  ], 14);
  const antiRepetitionRules = [
    "Do not restart the subject's biography on every chapter.",
    "A callback must change meaning, not merely repeat wording.",
    "Prefer the strongest connected evidence over complete source coverage.",
    "Identity metadata is world state, not an automatic experience sequence item.",
    "Do not promote a lens phrase into a fact.",
    "A semantic turn must cite a real graph relationship.",
  ];
  const sceneRules = [
    "One beat is one viewer-facing sequence moment.",
    "Short is good; do not turn the film into a paragraph.",
    "Creative language may change framing and attitude but never source truth.",
    "Finish when the selected payoff lands.",
    "The last beat is authorized by the selected endpoint only.",
  ];
  const graphSummary = input.realityGraph
    ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations.`
    : "REALITY GRAPH: unavailable.";
  const movieSummary = movie.selectedMovie
    ? `SELECTED MOVIE: ${movie.selectedMovie.hypothesis.join(" ")} Semantic turn: ${movie.selectedMovie.storyThesis?.semanticTurn ?? "none"}. Candidate count: ${movie.latentMovieCandidates.length}.`
    : "MOVIE DISCOVERY: off or unavailable; remain direct and grounded.";
  const frameSummary = `FRAME: ${selectedFrame}. A frame changes perspective, never reality.`;
  const authorBrief = [
    `MODE: ${chosen}`,
    frameSummary,
    graphSummary,
    movieSummary,
    "Reality is immutable. Creativity never becomes evidence.",
  ];

  return {
    mode: chosen,
    selectedFrame,
    chosenAttentionStrategy: chosen,
    attentionCandidates,
    characterRead,
    latentMovieCandidates: movie.latentMovieCandidates,
    selectedMovie: movie.selectedMovie,
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
