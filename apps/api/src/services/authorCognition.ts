 /**
  * QRE AUTHOR COGNITION
  * --------------------
  *
  * Purpose:
  * Convert supplied reality into a coherent cognitive plan for Author.
  *
  * Authority flow:
  *
  *   supplied reality
  *        ↓
  *   RealityGraph
  *        ↓
  *   movie discovery
  *        ↓
  *   sealed metamorphic relation set
  *        ↓
  *   latent story thesis
  *        ↓
  *   movie differentiation
  *        ↓
  *   viewer-state reranking
  *        ↓
  *   AuthorCognitivePlan
  *
  * Core law:
  *   Reality is evidence.
  *   Cognition interprets relationships between supplied evidence.
  *   Metamorphic reasoning identifies changes in meaning.
  *   A lens changes HOW reality lands, never WHAT happened.
  *   Creativity may transform presentation but never becomes evidence.
  *
  * This module owns COGNITION.
  * It does not own source truth-it does not redefine source truth., database persistence, or Mouth realization.
  *
  * Function map:
  *
   *   Reads previously persisted Author experience state from advisory context.
  *
  * enrichMovieCandidate()
  *   Attaches the graph-backed latent story thesis to one discovered movie.
  *   Requires the sealed metamorphic relation set.
  *
  * autoLensCandidates()
  *   Derives candidate lenses from the canonical RealityEnvelope.
  *
  * resolveLens()
  *   Chooses the explicit user lens or delegates to automatic lens selection.
  *
  * movieFor()
  *   Runs the complete cognitive movie-discovery path:
  *   world simulation → candidate discovery → metamorphic sealing →
  *   thesis enrichment → differentiation → viewer-state reranking.
  *
  * traits()
  *   Extracts supplied trait/behavior signals without inventing character facts.
  *
  * contradictions()
  *   Collects supplied tensions, contrasts, changes, anomalies, and transitions.
  *
  * objectRelationships()
  *   Collects supplied relationships between entities, events, and continuity.
  *
  * frames()
  *   Produces possible character/perspective frames while preserving lens authority.
  *
  * operationsForMovie()
  *   Extracts the actual trajectory operations from the selected movie.
  *
  * callbackTargetsFor()
  *   Identifies established material that is legitimately eligible for callback/reentry.
  *
  * buildAttentionCandidates()
  *   Defines the cognitive attention strategies available to Author.
  *
  * buildAntiRepetitionRules()
  *   Protects continuity, metamorphic novelty, and against repetition disguised as novelty.
  *
  * buildSceneRules()
  *   Converts cognition into realization constraints for downstream Author stages.
  *
  * buildAuthorCognitivePlan()
  *   Assembles the final cognitive plan consumed by the canonical Author pipeline.
  *
  * Boundary:
  *   RealityGraph contains supplied reality and derived structural anatomy.
  *   Latent movie candidates belong to Cognition, not RealityGraph.
  *   MetamorphicRelationSet is the sealed bridge between reality analysis and
  *   semantic interpretation.
  */
import type {
  AuthorDomainContext,
  AuthorExperienceState,
  AuthorMetamorphicRelationSet,
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
import { buildAuthorWorldSimulation } from "./authorWorldSimulation.js";
import {
  assertAuthorMetamorphicRelationSet,
  buildAuthorMetamorphicRelationSet,
} from "./authorMetamorphicRelationSet.js";
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
  priorExperienceStates?: AuthorExperienceState[];
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

type AuthorWorldSimulation = ReturnType<typeof buildAuthorWorldSimulation>;

type MovieSearchResult = {
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  worldSimulation?: AuthorWorldSimulation;
};

function enrichMovieCandidate(
  candidate: LatentMovieCandidate,
  graph: RealityGraph | undefined,
  metamorphicRelationSet: AuthorMetamorphicRelationSet,
): LatentMovieCandidate {
  if (!graph || !candidate.trajectory.length) {
    return candidate;
  }

  const storyThesis = deriveLatentStoryThesis(
    graph,
    candidate,
    metamorphicRelationSet,
  );

  return {
    ...candidate,
    storyThesis,
    hypothesis: [
      ...candidate.hypothesis,
      ...(storyThesis.semanticTurn
        ? [`Semantic turn: ${storyThesis.semanticTurn}`]
        : [
            "No graph-backed semantic turn was present; presentation movement remains distinct from semantic interpretation.",
          ]),
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
function movieFor(
  input: AuthorCognitionInput,
  selectedLens: string,
  priorExperienceStates: readonly AuthorExperienceState[],
): MovieSearchResult {
  if (input.movieMode === false || !input.realityGraph) {
    return { latentMovieCandidates: [] };
  }

  const realityGraph = input.realityGraph;

  const worldSimulation = buildAuthorWorldSimulation({
    reality: realityGraph,
    subject: input.subject,
    lens: selectedLens,
    priorExperienceIds: priorExperienceStates
      .map((state) => state.selectedMovieId)
      .filter((id): id is string => Boolean(id)),
    rememberedRefIds: priorExperienceStates.flatMap(
      (state) => state.worldSimulation?.reentry.rememberedRefIds ?? [],
    ),
  });

  const discovered = searchUniversalMovieCandidates({
    graph: realityGraph,
    subject: input.subject,
    limit: 10,
  });

  const simulationObserver = {
    objective:
      "Construct a viewer-facing situation model from supplied world relationships; preserve uncertainty until evidence earns an update.",
    surprise:
      worldSimulation.viewer.predictionErrors
        .map((item) => item.observed)
        .slice(0, 3)
        .join(" | ") || "Meaning should emerge from changing relationships.",
    curiosity:
      worldSimulation.questions
        .slice(0, 3)
        .map((item) => item.text)
        .join(" | ") || "What becomes newly meaningful?",
    attention: worldSimulation.viewer.attentionField
      .slice(0, 6)
      .map((item) => item.reason),
    landing:
      worldSimulation.durableThreads[0]?.text ||
      "Allow the supplied endpoint to resolve the strongest open relation.",
    explanationForbidden: true,
    simulation: worldSimulation,
  };

  const enriched = discovered.map((candidate) => {
    const sourceEventIds = [
      ...new Set(
        candidate.trajectory.flatMap((step) => step.eventIds),
      ),
    ];

    const metamorphicRelationSet =
      buildAuthorMetamorphicRelationSet(
        realityGraph,
        sourceEventIds,
      );

    assertAuthorMetamorphicRelationSet(
      metamorphicRelationSet,
    );

    const candidateWithThesis = enrichMovieCandidate(
      candidate,
      realityGraph,
      metamorphicRelationSet,
    );

    const observer =
      candidateWithThesis.storyThesis?.observerExperience;

    if (!candidateWithThesis.storyThesis) {
      return candidateWithThesis;
    }

    return {
      ...candidateWithThesis,
      storyThesis: {
        ...candidateWithThesis.storyThesis,
        observerExperience: {
          ...(observer ?? simulationObserver),
          simulation: worldSimulation,
          attention:
            observer?.attention?.length
              ? observer.attention
              : simulationObserver.attention,
          curiosity:
            observer?.curiosity ||
            simulationObserver.curiosity,
          surprise:
            observer?.surprise ||
            simulationObserver.surprise,
          landing:
            observer?.landing ||
            simulationObserver.landing,
          explanationForbidden: true,
        },
      },
    };
  });

  const differentiated = selectDistinctMovieCandidates(
    enriched,
    6,
    selectedLens,
  );

  const candidates = rerankByViewerState(
    realityGraph,
    differentiated,
  );

  return {
    latentMovieCandidates: candidates,
    selectedMovie: candidates[0],
    worldSimulation,
  };
}
function traits(input: AuthorCognitionInput): string[] {
  const all = [
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
    ...(input.realityGraph?.events.map((event) => event.label) ?? []),
  ];

  const traitSignals = all.filter((value) => {
    const text = clean(value);
    if (!text) return false;

    return (
      /\b(is|was|seems|feels|looks|acts|behaves|stays|keeps|remains|becomes|became|likes|loves|hates|prefers|avoids|always|never|often|usually)\b/i.test(
        text,
      ) ||
      /\b(character|personality|behavior|temperament|style|habit|pattern|tendency|attitude|posture|manner)\b/i.test(
        text,
      )
    );
  });

  return uniq(
    traitSignals.length ? traitSignals : all,
    8,
  );
}
function contradictions(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;

  if (!graph) return [];

  const relationshipContradictions = graph.relations
    .filter(
      (relation) =>
        relation.kind === "contrasts" ||
        relation.kind === "changes" ||
        relation.kind === "recontextualizes" ||
        relation.kind === "converges",
    )
    .sort((a, b) => b.strength - a.strength)
    .map(
      (relation) =>
        `supplied relationship: ${relation.kind} (${relation.from} -> ${relation.to})`,
    );

  const structuralContradictions = (graph.patterns ?? [])
    .filter(
      (pattern) =>
        pattern.kind === "tension" ||
        pattern.kind === "anomaly" ||
        pattern.kind === "transition",
    )
    .sort((a, b) => b.strength - a.strength)
    .map((pattern) => `supplied pattern: ${pattern.kind} — ${pattern.label}`);

  return uniq(
    [
      ...graph.unresolvedTensions,
      ...relationshipContradictions,
      ...structuralContradictions,
    ],
    12,
  );
}
function objectRelationships(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;

  if (!graph) return [];

  const eventRelationships = graph.events
    .filter((event) => event.entities.length > 0)
    .map((event) => {
      const entities = uniq(event.entities, 8).join(" ↔ ");
      return entities
        ? `${entities}: ${event.label}`
        : event.label;
    });

  const graphRelationships = graph.relations
    .filter(
      (relation) =>
        relation.kind === "involves" ||
        relation.kind === "belongs_to" ||
        relation.kind === "recontextualizes" ||
        relation.kind === "converges" ||
        relation.kind === "repeats",
    )
    .sort((a, b) => b.strength - a.strength)
    .map(
      (relation) =>
        `${relation.kind}: ${relation.from} ↔ ${relation.to}`,
    );

  const continuityRelationships = (graph.entityContinuity ?? [])
    .filter((entity) => entity.eventIds.length > 1)
    .sort((a, b) => b.salienceScore - a.salienceScore)
    .map(
      (entity) =>
        `${entity.kind}: ${entity.name} across ${entity.eventIds.length} supplied events`,
    );

  return uniq(
    [
      ...eventRelationships,
      ...graphRelationships,
      ...continuityRelationships,
    ],
    12,
  );
}
function frames(
  input: AuthorCognitionInput,
  movie: LatentMovieCandidate | undefined,
  selectedLens: string,
): CharacterFrameCandidate[] {
  const explicit = clean(input.lens);

  if (explicit && explicit.toLowerCase() !== "let qre decide") {
    const profile = classifyLens(explicit);

    return [
      {
        frame: explicit,
        reason:
          `explicit user perspective; ${profile.label} may amplify ` +
          `${profile.framingBias.slice(0, 4).join(", ")} without changing reality`,
        confidence: 0.95,
      },
    ];
  }

  const automatic = autoLensCandidates(input);
  const selectedAutomatic = automatic.filter(
    (candidate) => candidate.frame === selectedLens,
  );

  const movieFrame =
    movie?.storyThesis?.semanticTurn
      ? [
          {
            frame: "semantic consequence",
            reason:
              "the selected movie contains a graph-backed change in meaning that can guide presentation without changing supplied reality",
            confidence: 0.9,
          },
        ]
      : [];

  return [
    ...selectedAutomatic,
    ...movieFrame,
    ...automatic.filter(
      (candidate) =>
        candidate.frame !== selectedLens &&
        candidate.frame !== "NONE",
    ),
  ].filter(
    (candidate, index, values) =>
      values.findIndex((item) => item.frame === candidate.frame) === index,
  );
}
function operationsForMovie(
  movie: LatentMovieCandidate | undefined,
): string[] {
  if (!movie) return [];

  return uniq(
    movie.trajectory
      .map((step) => clean(step.operation))
      .filter(Boolean),
    12,
  );
}

function callbackTargetsFor(
  input: AuthorCognitionInput,
  permanentTruths: readonly string[],
  experienceState: AuthorExperienceState | undefined,
): string[] {
  const explicitCallbacks = input.priorScenes ?? [];
  const recurringSignals = input.realityGraph?.recurringSignals ?? [];
  const memoryHooks = experienceState?.memoryHooks ?? [];
  const eligibleCallbacks =
    experienceState?.worldSimulation?.reentry.eligibleCallbacks ?? [];

  return uniq(
    [
      ...explicitCallbacks,
      ...eligibleCallbacks,
      ...memoryHooks,
      ...recurringSignals,
      ...(permanentTruths.length
        ? permanentTruths.filter((truth) =>
            [...memoryHooks, ...recurringSignals].some(
              (signal) =>
                clean(truth).toLowerCase() ===
                clean(signal).toLowerCase(),
            ),
          )
        : []),
    ],
    20,
  );
}

function buildAttentionCandidates(): AttentionCandidate[] {
  return [
    {
      strategy: "graph_relationship",
      reason:
        "Prefer supplied relationships because relationships explain how reality changes meaning without inventing new reality.",
      score: 100,
    },
    {
      strategy: "meaning_shift",
      reason:
        "Prefer moments where supplied evidence causes the viewer's interpretation, expectation, status, or implication to change.",
      score: 99,
    },
    {
      strategy: "viewer_state_change",
      reason:
        "Prefer cuts that materially change attention, curiosity, expectation, tension, recognition, or payoff.",
      score: 98,
    },
    {
      strategy: "metamorphic_relation",
      reason:
        "Prefer a sealed metamorphic relation when the same supplied evidence can produce a stronger change in meaning.",
      score: 97,
    },
    {
      strategy: "contrast",
      reason:
        "Use supplied contrast when opposing or unexpected supplied elements materially change the reading.",
      score: 94,
    },
    {
      strategy: "recontextualization",
      reason:
        "Use supplied recurrence or context only when a later supplied element changes the meaning of an earlier one.",
      score: 92,
    },
  ];
}
function buildAntiRepetitionRules(): string[] {
  return [
    "Do not restart the subject's biography on every chapter.",
    "A callback must change meaning, not merely repeat wording.",
    "A revisit must return to established evidence only when new supplied evidence changes its reading.",
    "Prefer the strongest connected evidence over complete source coverage.",
    "Identity metadata is world state, not an automatic experience sequence item.",
    "Do not promote a lens phrase into a fact.",
    "A semantic turn must be grounded in supplied graph relationships or sequence-backed supplied interpretation.",
    "A metamorphic relation must explain what changed in meaning; do not reuse a relation merely because the same events recur.",
    "Do not manufacture novelty by adding concrete events, actors, objects, locations, reactions, chronology, or outcomes.",
    "Preserve authorized future threads when continuation value is high; do not resolve them prematurely.",
  ];
}
function buildSceneRules(
  experienceState: AuthorExperienceState | undefined,
  selectedLens: string,
): string[] {
  const lens = classifyLens(selectedLens);

  return [
    "One cut is one viewer-facing sequence moment; there is no fixed word-count target.",
    "Use the minimum language required for the cut to land.",
    "Reality is supplied evidence. Creative language may transform presentation, attitude, implication, emphasis, or framing, but may not alter what happened.",
    "The semantic movie must be grounded in the supplied reality graph.",
    "Prefer the strongest graph relationship and its metamorphic consequence rather than isolated fact coverage.",
    "A metamorphic relation must identify how supplied pieces change one another's meaning.",
    "The lens changes HOW the supplied reality lands, never WHAT happened.",
    "Do not convert lens language, metaphor, personification, or framing into new concrete facts.",
    "Do not invent events, actors, objects, locations, actions, reactions, chronology, or outcomes.",
    `Lens amplification may emphasize only supported dimensions: ${lens.framingBias.slice(0, 8).join(", ")}.`,
    `Preferred realization moves: ${lens.realizationPreferences.join(", ")}.`,
    `Forbidden lens moves remain hard constraints: ${lens.forbiddenRealityMoves.join(", ")}.`,
    "A cut should move the viewer through attention, curiosity, expectation, contrast, interruption, accumulation, recognition, recontextualization, or payoff.",
    "A callback or revisit is valuable only when supplied evidence changes the meaning of what is being revisited.",
    "Finish when the earned payoff lands; do not manufacture a final event.",
    "Treat NONE as a valid authorial lens decision when the supplied material itself has stronger character than a genre frame.",
    "A user-selected lens is authoritative and must be preserved exactly; automatic lens selection is subordinate to it.",
    ...(experienceState ? summarizeAuthorExperienceState(experienceState) : []),
  ];
}
export function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): AuthorCognitivePlan {
  const priorExperienceStates = input.priorExperienceStates ?? [];
  const selectedLens = resolveLens(input);
  const movie = movieFor(
    input,
    selectedLens,
    priorExperienceStates,
  );

  const selectedMovie = movie.selectedMovie;

  const experienceState =
    input.realityGraph && selectedMovie
      ? buildAuthorExperienceState({
          graph: input.realityGraph,
          movie: selectedMovie,
          lens: selectedLens,
          priorScenes: input.priorScenes,
          memoryContext: input.memoryContext,
          priorExperienceStates,
          round: input.round,
          worldSimulation: movie.worldSimulation,
        })
      : undefined;

  const permanentTruths = uniq(
    [...input.facts, ...(input.memoryContext ?? [])],
    30,
  );

  const currentEvidence = uniq(
    [
      ...input.sourceMoments,
      ...(input.realityGraph?.events ?? []).map(
        (event) => event.label,
      ),
    ],
    30,
  );

  const contradictionList = contradictions(input);

  const characterRead: CharacterRead = {
    coreTraits: traits(input),
    contradictions: contradictionList,
    statusPosture:
      contradictionList[0] ?? "defined by supplied reality",
    emotionalPosture: contradictionList[0]
      ? `emotion sits inside ${contradictionList[0]}`
      : "emotion should be inferred from supplied evidence",
    objectRelationships: objectRelationships(input),
    creativeFrames: frames(
      input,
      selectedMovie,
      selectedLens,
    ),
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
    ],
  };

  const attentionCandidates = buildAttentionCandidates();

  const chosenAttention =
    attentionCandidates.find(
      (candidate) => candidate.strategy === "metamorphic_relation",
    ) ??
    attentionCandidates.find(
      (candidate) => candidate.strategy === "meaning_shift",
    ) ??
    attentionCandidates[0];

  const chosenAttentionStrategy =
    chosenAttention?.strategy ??
    (selectedMovie ? "latent_movie" : "direct_grounded");

  const mode = selectedMovie
    ? "latent_movie"
    : "direct_grounded";

  const operatorMix = operationsForMovie(selectedMovie);

  const callbackTargets = callbackTargetsFor(
    input,
    permanentTruths,
    experienceState,
  );

  const antiRepetitionRules =
    buildAntiRepetitionRules();

  const sceneRules = buildSceneRules(
    experienceState,
    selectedLens,
  );

  const graphSummary = input.realityGraph
    ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations.`
    : "REALITY GRAPH: unavailable.";

  const dynamics =
    selectedMovie?.viewerStateDynamics;

  const semanticTurn =
    selectedMovie?.storyThesis?.semanticTurn;

  const simulation =
    experienceState?.worldSimulation ??
    movie.worldSimulation;

  const movieSummary = selectedMovie
    ? [
        `SELECTED MOVIE: ${selectedMovie.hypothesis.join(" ")}`,
        `SEMANTIC TURN: ${semanticTurn || "none"}`,
        `THESIS RELATION: ${selectedMovie.storyThesis?.relationKind ?? "none"}`,
        `CANDIDATE COUNT: ${movie.latentMovieCandidates.length}`,
        `VIEWER-STATE SCORE: ${dynamics?.score ?? "n/a"}`,
        `WORLD SIMULATION: ${
          simulation
            ? `${simulation.refs.length} refs / ${simulation.relations.length} relations / ${simulation.questions.length} questions`
            : "none"
        }`,
      ].join(" ")
    : "MOVIE DISCOVERY: off or unavailable; remain direct and grounded.";

  const lensProfile = classifyLens(selectedLens);

  const frameSummary =
    `FRAME: ${selectedLens}. ` +
    `AMPLIFY: ${lensProfile.framingBias.join(", ")}. ` +
    `PREFER: ${lensProfile.realizationPreferences.join(", ")}. ` +
    `A frame changes perspective, never reality.`;

  const authorBrief = [
    `MODE: ${mode}`,
    `ATTENTION: ${chosenAttentionStrategy}`,
    frameSummary,
    graphSummary,
    movieSummary,
    ...(experienceState
      ? summarizeAuthorExperienceState(experienceState)
      : []),
    "Reality is immutable. Creativity never becomes evidence.",
    "Lens is an amplification grammar, not permission to add world facts.",
    "Metamorphic reasoning is the preferred path for changing meaning from supplied reality.",
  ];

  return {
    mode,
    selectedFrame: selectedLens,
    chosenAttentionStrategy,
    attentionCandidates,
    characterRead,
    latentMovieCandidates:
      movie.latentMovieCandidates,
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