import type {
  AuthorExperienceState,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
} from "@qre/contracts";
import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";
import { rerankByViewerState } from "./authorViewerState.js";
import {
  buildAuthorExperienceState,
  summarizeAuthorExperienceState,
} from "./authorExperienceState.js";

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

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = <T>(values: readonly T[], limit = 24): T[] => [...new Set(values)].slice(0, limit);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const PRIOR_STATE_PREFIX = "QRE_AUTHOR_EXPERIENCE_STATE::";

function eventById(graph: RealityGraph | undefined, id: string) {
  return graph?.events.find((event) => event.id === id);
}

function parsePriorExperienceStates(values?: string[]): AuthorExperienceState[] {
  const states: AuthorExperienceState[] = [];
  for (const value of values ?? []) {
    if (!value.startsWith(PRIOR_STATE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(value.slice(PRIOR_STATE_PREFIX.length)) as AuthorExperienceState;
      if (parsed?.version === 1 && parsed.tempo) states.push(parsed);
    } catch {
      // Learning context is advisory; malformed state must never break Author.
    }
  }
  return states;
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

const AUTO_LENS_RULES: ReadonlyArray<{
  lens: string;
  terms: readonly string[];
  relationKinds: readonly RealityGraph["relations"][number]["kind"][];
  base: number;
}> = [
  { lens: "game", terms: ["round", "level", "score", "boost", "power", "stage", "booted", "cleared", "complete", "completed", "next"], relationKinds: ["changes", "causes", "converges"], base: 0.46 },
  { lens: "spy", terms: ["logged", "location", "geo", "watched", "corner", "evidence", "tracked", "target", "mission"], relationKinds: ["involves", "causes", "before", "after"], base: 0.43 },
  { lens: "heist", terms: ["evidence", "stole", "stolen", "secured", "operation", "exit", "clean", "cleaned", "disappeared"], relationKinds: ["causes", "changes", "converges"], base: 0.4 },
  { lens: "courtroom", terms: ["case", "defense", "court", "judge", "evidence", "verdict", "approved", "denied", "guilty", "innocent"], relationKinds: ["changes", "contrasts", "causes"], base: 0.4 },
  { lens: "horror", terms: ["ghost", "shadow", "blood", "dead", "dark", "watching", "corner", "haunted", "disappeared", "quiet"], relationKinds: ["before", "after", "repeats", "contrasts", "changes"], base: 0.39 },
  { lens: "noir", terms: ["case", "evidence", "quiet", "late", "dark", "watched", "secret", "missing", "returned"], relationKinds: ["before", "after", "changes", "recontextualizes"], base: 0.37 },
  { lens: "romantic", terms: ["met", "rave", "eyes", "familiar", "connection", "talked", "every", "day", "vows", "married"], relationKinds: ["converges", "repeats", "recontextualizes", "changes"], base: 0.42 },
  { lens: "documentary", terms: ["time", "miles", "location", "started", "finished", "recorded", "measured", "logged"], relationKinds: ["before", "after", "involves", "belongs_to"], base: 0.34 },
];

function evidenceText(input: AuthorCognitionInput): string {
  return [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...((input.realityGraph?.events ?? []).map((event) => event.label))]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function nativeRealityStrength(input: AuthorCognitionInput): number {
  const events = input.realityGraph?.events ?? [];
  if (!events.length) return 0.5;

  const averageSpecificity = events.reduce((sum, event) => {
    const tokenCount = clean(event.label).split(/\s+/).filter(Boolean).length;
    const entityCount = event.entities?.length ?? 0;
    return sum + Math.min(1, tokenCount / 9 + entityCount / 12);
  }, 0) / events.length;

  const strongAction = events.filter((event) =>
    /\b(?:dodg(?:e|ed)|watch(?:ing|ed)?|met|talked|locked|opened|closed|returned|walked|ran|cleaned|finished|started|danced|married|kissed|built|bought|sold)\b/i.test(event.label),
  ).length;

  return metric(averageSpecificity * 0.72 + Math.min(1, strongAction / Math.max(1, events.length)) * 0.28);
}

function autoLensCandidates(input: AuthorCognitionInput): CharacterFrameCandidate[] {
  const text = evidenceText(input);
  const relationKinds = new Set(input.realityGraph?.relations.map((relation) => relation.kind) ?? []);
  const native = nativeRealityStrength(input);

  const scored = AUTO_LENS_RULES.map((rule) => {
    const termHits = rule.terms.filter((term) => text.includes(term)).length;
    const relationHits = rule.relationKinds.filter((kind) => relationKinds.has(kind)).length;
    const keywordScore = Math.min(1, termHits / 4);
    const relationScore = Math.min(1, relationHits / 3);
    const confidence = metric(rule.base + keywordScore * 0.34 + relationScore * 0.16);
    return {
      frame: rule.lens,
      reason: `${rule.lens} fits supplied vocabulary/relations without changing reality.`,
      confidence,
    };
  }).sort((a, b) => b.confidence - a.confidence);

  const best = scored[0];
  if (!best || best.confidence < 0.68 || native >= best.confidence + 0.12) {
    return [{
      frame: "NONE",
      reason: "No creative lens materially improves the supplied reality; preserve the native material.",
      confidence: metric(Math.max(0.7, native)),
    }];
  }

  return [best, {
    frame: "NONE",
    reason: "Natural reality remains the safe fallback when no lens is materially stronger.",
    confidence: metric(Math.max(0.55, native)),
  }];
}

function resolveLens(input: AuthorCognitionInput): string {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") return explicit;
  return autoLensCandidates(input)[0]?.frame ?? "NONE";
}

function movieFor(
  input: AuthorCognitionInput,
  lens: string,
): { latentMovieCandidates: LatentMovieCandidate[]; selectedMovie?: LatentMovieCandidate } {
  if (input.movieMode === false || !input.realityGraph) return { latentMovieCandidates: [] };

  const candidates = rerankByViewerState(
    input.realityGraph,
    searchUniversalMovieCandidates({
      graph: input.realityGraph,
      subject: input.subject,
      lens,
      limit: 10,
    }),
  ).map((candidate) => enrichMovieCandidate(candidate, input.realityGraph, lens));

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

function frames(input: AuthorCognitionInput, movie: LatentMovieCandidate | undefined, selectedLens: string): CharacterFrameCandidate[] {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") {
    return [{ frame: explicit, reason: "explicit user perspective", confidence: 0.95 }];
  }

  const automatic = autoLensCandidates(input);
  if (automatic[0]?.frame === selectedLens && automatic[0]?.frame !== "NONE") return automatic;

  const relationKinds = new Set(input.realityGraph?.relations.map((r) => r.kind) ?? []);
  const out: CharacterFrameCandidate[] = [];
  if (relationKinds.has("contrasts")) out.push({ frame: "contrast", reason: "the supplied world contains a material contrast", confidence: 0.9 });
  if (relationKinds.has("recontextualizes")) out.push({ frame: "recontextualization", reason: "one supplied detail changes another detail's meaning", confidence: 0.9 });
  if (relationKinds.has("repeats") || (input.round ?? 1) > 1) out.push({ frame: "callback", reason: "the world contains continuity material", confidence: 0.88 });
  if (movie?.storyThesis?.semanticTurn) out.push({ frame: "character consequence", reason: "the selected movie has a semantic turn", confidence: 0.86 });
  return out.length ? out : automatic;
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const selectedLens = resolveLens(input);
  const movie = movieFor(input, selectedLens);
  const priorExperienceStates = parsePriorExperienceStates(input.priorStrategies);
  const experienceState = input.realityGraph && movie.selectedMovie
    ? buildAuthorExperienceState({
        graph: input.realityGraph,
        movie: movie.selectedMovie,
        lens: selectedLens,
        priorScenes: input.priorScenes,
        memoryContext: input.memoryContext,
        priorExperienceStates,
        round: input.round,
      })
    : undefined;

  const permanentTruths = uniq([...input.facts, ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq([...input.sourceMoments, ...(input.realityGraph?.events.map((event) => event.label) ?? [])], 30);
  const contradictionList = contradictions(input);

  const characterRead: CharacterRead = {
    coreTraits: traits(input),
    contradictions: contradictionList,
    statusPosture: contradictionList[0] ?? "defined by supplied reality",
    emotionalPosture: contradictionList[0] ? `emotion sits inside ${contradictionList[0]}` : "emotion should be inferred from supplied evidence",
    objectRelationships: objectRelationships(input),
    creativeFrames: frames(input, movie.selectedMovie, selectedLens),
    allowedMoves: ["metaphor", "personification", "status language", "double meaning", "comic framing", "understatement", "callback", "recontextualization", "revisit", "future tease"],
    avoidedMoves: ["invented concrete events", "invented people", "invented locations", "invented reactions", "invented chronology", "planner language", "analytic explanation"],
  };

  const selectedFrame = selectedLens;
  const attentionCandidates: AttentionCandidate[] = [
    { strategy: "graph_relationship", reason: "Prefer supplied relationships over isolated facts.", score: 100 },
    { strategy: "viewer_state_change", reason: "Prefer cuts that materially change attention, curiosity, expectation, or meaning.", score: 99 },
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
    ...(experienceState?.memoryHooks ?? []),
  ], 20);

  const antiRepetitionRules = [
    "Do not restart the subject's biography on every chapter.",
    "A callback must change meaning, not merely repeat wording.",
    "A revisit must return to established evidence only after new evidence exists to change its reading.",
    "Prefer the strongest connected evidence over complete source coverage.",
    "Identity metadata is world state, not an automatic experience sequence item.",
    "Do not promote a lens phrase into a fact.",
    "A semantic turn must cite a real graph relationship.",
    "Leave an authorized future thread alive when continuation value is high.",
  ];

  const sceneRules = [
    "One cut is one viewer-facing sequence moment; there is no fixed word-count target.",
    "Use the minimum language required for the cut to land.",
    "Creative language may change framing and attitude but never source truth.",
    "A cut should change the viewer state through attention, curiosity, contrast, interruption, accumulation, or payoff.",
    "Finish when the selected payoff lands; do not manufacture a final event.",
    "Treat NONE as a valid authorial lens decision when the supplied material itself has stronger character than a genre frame.",
    "A user-selected lens is authoritative and must be preserved exactly; automatic lens selection is subordinate to it.",
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
  ];

  const graphSummary = input.realityGraph
    ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations.`
    : "REALITY GRAPH: unavailable.";
  const dynamics = movie.selectedMovie?.viewerStateDynamics;
  const movieSummary = movie.selectedMovie
    ? `SELECTED MOVIE: ${movie.selectedMovie.hypothesis.join(" ")} Semantic turn: ${movie.selectedMovie.storyThesis?.semanticTurn ?? "none"}. Candidate count: ${movie.latentMovieCandidates.length}. Viewer-state score: ${dynamics?.score ?? "n/a"}.`
    : "MOVIE DISCOVERY: off or unavailable; remain direct and grounded.";
  const frameSummary = `FRAME: ${selectedFrame}. A frame changes perspective, never reality.`;
  const authorBrief = [
    `MODE: ${chosen}`,
    frameSummary,
    graphSummary,
    movieSummary,
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
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
