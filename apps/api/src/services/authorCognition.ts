import type {
  AuthorDomainContext,
  AuthorExperienceState,
  LatentMovieCandidate,
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
import {
  classifyLens,
  rankLensOpportunities,
} from "./authorCharacterLensEngine.js";

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

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const uniq = <T>(values: readonly T[], limit = 24): T[] => [...new Set(values)].slice(0, limit);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
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

function parsePriorExperienceStates(values?: readonly string[]): AuthorExperienceState[] {
  const states: AuthorExperienceState[] = [];
  for (const value of values ?? []) {
    if (!value.startsWith(PRIOR_STATE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(value.slice(PRIOR_STATE_PREFIX.length)) as AuthorExperienceState;
      if (parsed?.version === 1 && parsed.tempo) states.push(parsed);
    } catch {
      /* advisory learning context */
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
  return rankLensOpportunities(envelope).map((candidate) => ({ frame: candidate.frame, reason: candidate.reason, confidence: candidate.confidence }));
}

function resolveLens(input: AuthorCognitionInput): string {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") return explicit;
  return autoLensCandidates(input)[0]?.frame ?? "NONE";
}

/**
 * Movie discovery is lens-blind.
 * The selected perceptual lens enters only after the full candidate set exists.
 */
function movieFor(
  input: AuthorCognitionInput,
  selectedLens: string,
): { latentMovieCandidates: LatentMovieCandidate[]; selectedMovie?: LatentMovieCandidate } {
  if (input.movieMode === false || !input.realityGraph) return { latentMovieCandidates: [] };

  const discovered = searchUniversalMovieCandidates({
    graph: input.realityGraph,
    subject: input.subject,
    limit: 10,
  });

  const enriched = discovered.map((candidate) => enrichMovieCandidate(candidate, input.realityGraph));
  const differentiated = selectDistinctMovieCandidates(enriched, 6, selectedLens);
  const candidates = rerankByViewerState(input.realityGraph, differentiated);

  return { latentMovieCandidates: candidates, selectedMovie: candidates[0] };
}

function traits(input: AuthorCognitionInput): string[] {
  const all = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])];
  return uniq(all.filter((value) => /\b(?:nervous|scared|fierce|sweet|gentle|wild|goofy|stubborn|proud|confident|quiet|loud|funny|mischievous|tired|calm|excited|happy|angry|afraid)\b/i.test(value)), 8);
}

function contradictions(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;
  return uniq([
    ...(graph?.unresolvedTensions ?? []),
    ...(graph?.relations.filter((relation) => relation.kind === "contrasts" || relation.kind === "changes" || relation.kind === "recontextualizes").slice(0, 8).map((relation) => `supplied relationship: ${relation.kind}`) ?? []),
  ], 12);
}

function objectRelationships(input: AuthorCognitionInput): string[] {
  return uniq(input.realityGraph?.events.filter((event) => event.entities.length > 1).map((event) => event.label) ?? [], 12);
}

function frames(input: AuthorCognitionInput, movie: LatentMovieCandidate | undefined, selectedLens: string): CharacterFrameCandidate[] {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") {
    const profile = classifyLens(explicit);
    return [{ frame: explicit, reason: `explicit user perspective; ${profile.label} may amplify ${profile.framingBias.slice(0, 4).join(", ")} without changing reality`, confidence: 0.95 }];
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
  const lens = classifyLens(selectedLens);
  return [
    "One cut is one viewer-facing sequence moment; there is no fixed word-count target.",
    "Use the minimum language required for the cut to land.",
    "Creative language may change framing and attitude but never source truth.",
    "The selected lens is an amplification grammar: intensify only the dimensions already supported by supplied reality.",
    `Lens amplification: ${lens.framingBias.slice(0, 8).join(", ")}.`,
    `Preferred realization moves: ${lens.realizationPreferences.join(", ")}.`,
    `Forbidden lens moves remain hard constraints: ${lens.forbiddenRealityMoves.join(", ")}.`,
    "A cut should change the viewer state through attention, curiosity, contrast, interruption, accumulation, or payoff.",
    "Finish when the selected payoff lands; do not manufacture a final event.",
    "Treat NONE as a valid authorial lens decision when the supplied material itself has stronger character than a genre frame.",
    "A user-selected lens is authoritative and must be preserved exactly; automatic lens selection is subordinate to it.",
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
  ];
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const selectedLens = resolveLens(input);
  const movie = movieFor(input, selectedLens);
  const priorExperienceStates = parsePriorExperienceStates(input.priorStrategies);
  const experienceState = input.realityGraph && movie.selectedMovie
    ? buildAuthorExperienceState({ graph: input.realityGraph, movie: movie.selectedMovie, lens: selectedLens, priorScenes: input.priorScenes, memoryContext: input.memoryContext, priorExperienceStates, round: input.round })
    : undefined;

  const permanentTruths = uniq([...input.facts, ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq([
    ...input.sourceMoments,
    ...(input.realityGraph?.events ?? []).map((event) => event.label),
  ], 30);
  const contradictionList = contradictions(input);
  const selectedMovie = movie.selectedMovie;

  const characterRead: CharacterRead = {
    coreTraits: traits(input),
    contradictions: contradictionList,
    statusPosture: contradictionList[0] ?? "defined by supplied reality",
    emotionalPosture: contradictionList[0] ? `emotion sits inside ${contradictionList[0]}` : "emotion should be inferred from supplied evidence",
    objectRelationships: objectRelationships(input),
    creativeFrames: frames(input, selectedMovie, selectedLens),
    allowedMoves: ["metaphor", "personification", "status language", "double meaning", "comic framing", "understatement", "callback", "recontextualization", "revisit", "future tease", "lens amplification"],
    avoidedMoves: ["invented concrete events", "invented people", "invented locations", "invented reactions", "invented chronology", "literalized lens props", "planner language", "analytic explanation"],
  };

  const selectedFrame = selectedLens;
  const attentionCandidates = buildAttentionCandidates();
  const chosen = selectedMovie ? "latent_movie" : "direct_grounded";
  const operatorMix = operationsForMovie(selectedMovie);
  const callbackTargets = callbackTargetsFor(input, permanentTruths, experienceState);
  const antiRepetitionRules = buildAntiRepetitionRules();
  const sceneRules = buildSceneRules(experienceState, selectedLens);
  const graphSummary = input.realityGraph ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations.` : "REALITY GRAPH: unavailable.";
  const dynamics = selectedMovie?.viewerStateDynamics;
  const semanticTurn = selectedMovie?.storyThesis?.semanticTurn;
  const movieSummary = selectedMovie
    ? [`SELECTED MOVIE: ${selectedMovie.hypothesis.join(" ")}`, `SEMANTIC TURN: ${semanticTurn || "none"}`, `THESIS RELATION: ${selectedMovie.storyThesis?.relationKind ?? "none"}`, `CANDIDATE COUNT: ${movie.latentMovieCandidates.length}`, `VIEWER-STATE SCORE: ${dynamics?.score ?? "n/a"}`].join(" ")
    : "MOVIE DISCOVERY: off or unavailable; remain direct and grounded.";
  const lensProfile = classifyLens(selectedFrame);
  const frameSummary = `FRAME: ${selectedFrame}. AMPLIFY: ${lensProfile.framingBias.join(", ")}. PREFER: ${lensProfile.realizationPreferences.join(", ")}. A frame changes perspective, never reality.`;
  const authorBrief = [
    `MODE: ${chosen}`,
    frameSummary,
    graphSummary,
    movieSummary,
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
    "Reality is immutable. Creativity never becomes evidence.",
    "Lens is an amplification grammar, not permission to add world facts.",
  ];

  return {
    mode: chosen,
    selectedFrame,
    chosenAttentionStrategy: chosen,
    attentionCandidates,
    characterRead,
    latentMovieCandidates: movie.latentMovieCandidates,
    selectedMovie,
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
