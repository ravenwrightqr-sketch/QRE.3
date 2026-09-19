import type {
  AuthorDomainContext,
  AuthorExperienceState,
  AuthorPlayoutMode,
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
import { buildAuthorWorldSimulation } from "./authorWorldSimulation.js";
import {
  deriveAuthorActionMechanics,
  type AuthorActionMechanic,
} from "./authorActionMechanics.js";

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
  playoutMode?: AuthorPlayoutMode;
  /** @deprecated Compatibility only. Prefer playoutMode. */
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

export type ObserverInferenceHypothesis = {
  kind: string;
  evidenceEventIds: string[];
  latentRead: string;
  grounding: number;
  relationalStrength: number;
  latentInterpretability: number;
  observerInferencePotential: number;
  predictionMomentum: number;
  unresolvedSpace: number;
  unsupportedAssumptionRisk: number;
  score: number;
};

export type AuthorCognitivePlan = {
  mode: string;
  selectedFrame: string;
  chosenAttentionStrategy: string;
  attentionCandidates: AttentionCandidate[];
  characterRead: CharacterRead;
  actionMechanics: AuthorActionMechanic[];
  selectedActionMechanics: AuthorActionMechanic[];
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  inferenceHypotheses: ObserverInferenceHypothesis[];
  selectedInference?: ObserverInferenceHypothesis;
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

const uniq = <T>(
  values: readonly T[],
  limit = 24,
): T[] => [...new Set(values)].slice(0, limit);

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );

const PRIOR_STATE_PREFIX =
  "QRE_AUTHOR_EXPERIENCE_STATE::";

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
    ...(context.services ?? []).map((item) => `service: ${item}`),
    ...(context.differentiators ?? []).map((item) => `business differentiator: ${item}`),
    ...(context.signals ?? []).map((item) => `business signal: ${item}`),
    ...(context.subjectKinds ?? []).map((item) => `supported subject kind: ${item}`),
    ...(context.importantFacts ?? []).map((item) => `important business fact: ${item}`),
    ...(context.knownCapabilities ?? []).map((item) => `known capability: ${item}`),
    ...(context.contextualSignals ?? []).map((item) => `contextual signal: ${item}`),
  ].filter(Boolean);
}

function eventById(
  graph: RealityGraph | undefined,
  id: string,
): RealityGraph["events"][number] | undefined {
  return graph?.events.find(
    (event) => event.id === id,
  );
}

function parsePriorExperienceStates(
  values?: readonly string[],
): AuthorExperienceState[] {
  const states: AuthorExperienceState[] = [];

  for (const value of values ?? []) {
    if (
      !value.startsWith(
        PRIOR_STATE_PREFIX,
      )
    ) {
      continue;
    }

    try {
      const parsed = JSON.parse(
        value.slice(
          PRIOR_STATE_PREFIX.length,
        ),
      ) as AuthorExperienceState;

      if (
        parsed?.version === 1 &&
        parsed.tempo
      ) {
        states.push(parsed);
      }
    } catch {
      /*
       * Learning context is advisory.
       * Malformed historical state must never
       * break Author cognition.
       */
    }
  }

  return states;
}

/**
 * The movie trajectory already owns viewer-facing
 * descriptions of individual cuts.
 *
 * This helper deliberately does NOT manufacture
 * semantic meaning.
 *
 * A cut description such as:
 *
 *   "Another supplied part of the world enters: squirrels everywhere."
 *
 * remains a cut description.
 *
 * It is NOT a story thesis.
 */
/**
 * Canonical movie enrichment boundary.
 *
 * Movie search owns candidate discovery.
 * Viewer reranking owns candidate ordering.
 * The latent story-thesis module owns semantic interpretation.
 *
 * Cognition does not reinterpret the trajectory and does not
 * synthesize a competing thesis.
 */
function enrichMovieCandidate(
  candidate: LatentMovieCandidate,
  graph: RealityGraph | undefined,
  worldSimulation?: ReturnType<typeof buildAuthorWorldSimulation>,
): LatentMovieCandidate {
  if (
    !graph ||
    !candidate.trajectory.length
  ) {
    return candidate;
  }

  const storyThesis =
    deriveLatentStoryThesis(
      graph,
      candidate,
    );

  const observer =
    storyThesis.observerExperience;

  const observerWithSimulation =
    observer || worldSimulation
      ? {
          ...(observer ?? {
            objective:
              "Construct a viewer-facing realization from the supplied world without changing its truth.",
            surprise:
              "Meaning should emerge from changing supplied relationships.",
            curiosity:
              "What becomes newly meaningful?",
            attention: [
              "notice the strongest supplied relationship",
              "let surrounding detail accumulate",
              "recognize the turn",
            ],
            landing:
              "Let the supplied relationship create the realization.",
            explanationForbidden: true,
          }),
        }
      : undefined;

  return {
    ...candidate,
    storyThesis: {
      ...storyThesis,
      ...(observerWithSimulation
        ? {
            observerExperience:
              observerWithSimulation,
          }
        : {}),
    },
    hypothesis: [
      ...candidate.hypothesis,
      ...(storyThesis.semanticTurn
        ? [
            `Semantic turn: ${storyThesis.semanticTurn}`,
          ]
        : [
            "No graph-backed semantic turn was present; presentation movement remains distinct from semantic interpretation.",
          ]),
      "The realization may change status, attitude, implication, or framing, but may not create a new event.",
    ].slice(
      0,
      8,
    ),
  };
}
/**
 * Auto lens selection is owned by the canonical character-lens engine.
 * Cognition supplies the canonical RealityEnvelope so there is one lens
 * registry and one opportunity-ranking implementation.
 */
function autoLensCandidates(
  input: AuthorCognitionInput,
  mechanics: readonly AuthorActionMechanic[] = [],
): CharacterFrameCandidate[] {
  if (!input.realityGraph) {
    return [
      {
        frame: "NONE",
        reason:
          "RealityGraph unavailable; preserve supplied reality until a canonical world representation exists.",
        confidence: 0,
      },
    ];
  }

  const envelope =
    buildAuthorRealityEnvelope({
      graph: input.realityGraph,
      subject: input.subject,
    });

  return rankLensOpportunities(
    envelope,
    mechanics,
  ).map((candidate) => ({
    frame: candidate.frame,
    reason: candidate.reason,
    confidence: candidate.confidence,
  }));
}

function resolveLens(
  input: AuthorCognitionInput,
  mechanics: readonly AuthorActionMechanic[] = [],
): string {
  const explicit =
    clean(input.lens);

  if (
    explicit &&
    explicit.toLowerCase() !==
      "let qre decide"
  ) {
    return explicit;
  }

  return (
    autoLensCandidates(input, mechanics)[0]
      ?.frame ?? "NONE"
  );
}

/**
 * Movie discovery is deliberately isolated.
 *
 * Search:
 *   RealityGraph -> candidate movies
 *
 * Rerank:
 *   candidate movies -> viewer-state ordering
 *
 * Enrichment:
 *   selected movie -> canonical story thesis
 *
 * Cognition does not select a second movie.
 */
const PREFERENCE_RELATION =
  /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|hate|hates|avoid|avoids|into)\b/i;

function movieEventIds(candidate: LatentMovieCandidate): string[] {
  return uniq(candidate.trajectory.flatMap((step) => step.eventIds), 32);
}

function relationStrengthFor(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 0;
  let strongest = 0;
  let total = 0;
  let count = 0;
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const relation = graph.relations
        .filter((item) =>
          (item.from === ids[left] && item.to === ids[right]) ||
          (item.from === ids[right] && item.to === ids[left]),
        )
        .sort((a, b) => b.strength - a.strength)[0];
      if (!relation) continue;
      if (["before", "after", "involves", "belongs_to"].includes(relation.kind)) continue;
      strongest = Math.max(strongest, relation.strength);
      total += relation.strength;
      count += 1;
    }
  }
  const average = count ? total / count : 0;
  return metric(strongest * 0.62 + average * 0.38);
}

function eventSpecificityForInference(graph: RealityGraph, ids: readonly string[]): number {
  if (!ids.length) return 0;
  const values = ids.map((id) => {
    const structure = graph.eventStructure?.find((item) => item.eventId === id);
    const current = graph.events.find((item) => item.id === id);
    return metric(
      Number(structure?.salienceScore ?? 0) * 0.42 +
      Math.min(1, (structure?.semanticTags.length ?? 0) / 4) * 0.18 +
      Math.min(1, (structure?.objects.length ?? 0) / 3) * 0.16 +
      Math.min(1, (structure?.actions.length ?? 0) / 3) * 0.14 +
      (current?.salient ? 0.1 : 0),
    );
  });
  return metric(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

function predictionMomentumForInference(candidate: LatentMovieCandidate): number {
  const questions = uniq(candidate.trajectory.map((step) => clean(step.nextQuestion)).filter(Boolean), 16);
  const operationKinds = new Set(candidate.trajectory.map((step) => clean(step.operation)).filter(Boolean)).size;
  return metric(
    Math.min(1, questions.length / Math.max(1, candidate.trajectory.length)) * 0.58 +
    Math.min(1, operationKinds / 4) * 0.24 +
    (candidate.trajectory.length >= 2 ? 0.18 : 0),
  );
}

function preferenceConstellationHypothesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ObserverInferenceHypothesis | undefined {
  const ids = movieEventIds(candidate);
  const preferenceIds = ids.filter((id) =>
    PREFERENCE_RELATION.test(clean(graph.events.find((event) => event.id === id)?.label)),
  );
  if (preferenceIds.length < 2) return undefined;
  const grounding = metric(preferenceIds.length / Math.max(1, ids.length));
  const relationalStrength = Math.max(
    relationStrengthFor(graph, preferenceIds),
    metric(Math.min(1, preferenceIds.length / 3) * 0.72),
  );
  const specificity = eventSpecificityForInference(graph, preferenceIds);
  const predictionMomentum = predictionMomentumForInference(candidate);
  const unresolvedSpace = 0.94;
  const unsupportedAssumptionRisk = metric(Math.max(0, 0.22 - grounding * 0.16));
  const latentInterpretability = metric(
    relationalStrength * 0.42 +
    specificity * 0.18 +
    grounding * 0.22 +
    unresolvedSpace * 0.18,
  );
  const observerInferencePotential = metric(
    latentInterpretability * 0.38 +
    relationalStrength * 0.22 +
    predictionMomentum * 0.18 +
    unresolvedSpace * 0.22,
  );
  const score = metric(
    observerInferencePotential * 0.58 +
    grounding * 0.16 +
    relationalStrength * 0.14 +
    specificity * 0.12 -
    unsupportedAssumptionRisk * 0.2,
  );
  return {
    kind: "preference_constellation",
    evidenceEventIds: preferenceIds,
    latentRead:
      "The supplied preferences form a recognizable pattern of specific taste. Let the observer construct the character read; do not name it for them.",
    grounding,
    relationalStrength,
    latentInterpretability,
    observerInferencePotential,
    predictionMomentum,
    unresolvedSpace,
    unsupportedAssumptionRisk,
    score,
  };
}

function semanticHypothesis(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ObserverInferenceHypothesis | undefined {
  const semantic = candidate.storyThesis?.semanticRealization;
  if (!semantic?.evidenceEventIds.length) return undefined;
  const ids = semantic.evidenceEventIds;
  const grounding = metric(
    ids.filter((id) => graph.events.some((event) => event.id === id)).length / Math.max(1, ids.length),
  );
  const relationalStrength = relationStrengthFor(graph, ids);
  const specificity = eventSpecificityForInference(graph, ids);
  const confidence = metric(Number(semantic.confidence ?? 0.5));
  const predictionMomentum = predictionMomentumForInference(candidate);
  const unresolvedSpace = candidate.storyThesis?.observerExperience?.explanationForbidden ? 0.92 : 0.62;
  const unsupportedAssumptionRisk = metric(
    Math.max(0, (1 - grounding) * 0.72 + (1 - confidence) * 0.12),
  );
  const latentInterpretability = metric(
    confidence * 0.34 +
    relationalStrength * 0.24 +
    specificity * 0.16 +
    grounding * 0.16 +
    unresolvedSpace * 0.1,
  );
  const observerInferencePotential = metric(
    latentInterpretability * 0.34 +
    predictionMomentum * 0.22 +
    unresolvedSpace * 0.22 +
    relationalStrength * 0.22,
  );
  const score = metric(
    observerInferencePotential * 0.52 +
    grounding * 0.18 +
    relationalStrength * 0.14 +
    confidence * 0.16 -
    unsupportedAssumptionRisk * 0.22,
  );
  return {
    kind: clean(semantic.mechanism) || "semantic_relationship",
    evidenceEventIds: [...ids],
    latentRead:
      clean(semantic.viewerShift) ||
      clean(semantic.creativeOpportunity) ||
      "A grounded relationship changes what the supplied details mean together.",
    grounding,
    relationalStrength,
    latentInterpretability,
    observerInferencePotential,
    predictionMomentum,
    unresolvedSpace,
    unsupportedAssumptionRisk,
    score,
  };
}

function inferenceHypothesesFor(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ObserverInferenceHypothesis[] {
  return [
    preferenceConstellationHypothesis(graph, candidate),
    semanticHypothesis(graph, candidate),
  ]
    .filter((item): item is ObserverInferenceHypothesis => Boolean(item))
    .sort((left, right) =>
      right.score - left.score ||
      right.observerInferencePotential - left.observerInferencePotential ||
      left.unsupportedAssumptionRisk - right.unsupportedAssumptionRisk,
    );
}

function applyInferencePressure(
  candidate: LatentMovieCandidate,
  hypothesis: ObserverInferenceHypothesis | undefined,
): LatentMovieCandidate {
  if (!hypothesis || !candidate.storyThesis) return candidate;
  const observer = candidate.storyThesis.observerExperience;
  return {
    ...candidate,
    storyThesis: {
      ...candidate.storyThesis,
      observerExperience: {
        objective: hypothesis.latentRead,
        surprise: observer?.surprise ?? "Let the observer recognize the hidden relationship before QRE names it.",
        curiosity: observer?.curiosity ?? "Preserve enough unresolved space for the observer to complete the read.",
        attention: observer?.attention?.length
          ? observer.attention
          : [
              "show grounded evidence",
              "let a prediction form",
              "add evidence that changes the prediction",
              "stop when the observer can complete the meaning",
            ],
        landing: observer?.landing ?? "Land on evidence, not an explanation of the inference.",
        explanationForbidden: true,
      },
    },
    hypothesis: [
      ...candidate.hypothesis,
      "Observer inference: " + hypothesis.kind,
      "Observer inference potential: " + hypothesis.observerInferencePotential.toFixed(3),
      "Hidden read: " + hypothesis.latentRead,
    ].slice(0, 10),
  };
}
function movieFor(
  input: AuthorCognitionInput,
  priorExperienceStates: readonly AuthorExperienceState[],
  mechanics: readonly AuthorActionMechanic[],
): {
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  inferenceHypotheses: ObserverInferenceHypothesis[];
  selectedInference?: ObserverInferenceHypothesis;
  worldSimulation?: ReturnType<typeof buildAuthorWorldSimulation>;
} {
  if (
    input.playoutMode === "operational" ||
    input.movieMode === false ||
    !input.realityGraph
  ) {
    return {
      latentMovieCandidates: [],
      inferenceHypotheses: [],
    };
  }

  /*
   * Movie/meaning discovery is lens-neutral.
   * Lens pressure is applied only after Cognition has selected the strongest
   * grounded movie/metamorphic relation.
   */
  const discoveryLens = "NONE";

  const worldSimulation =
    buildAuthorWorldSimulation({
      reality:
        input.realityGraph,
      subject:
        input.subject,
      lens: discoveryLens,
      priorExperienceIds:
        priorExperienceStates
          .map(
            (state) =>
              state.selectedMovieId,
          )
          .filter(
            (id): id is string =>
              Boolean(id),
          ),
      rememberedRefIds:
        priorExperienceStates.flatMap(
          (state) =>
            state.worldSimulation
              ?.reentry
              .rememberedRefIds ??
            [],
        ),
    });

  const searched =
    searchUniversalMovieCandidates({
      graph: input.realityGraph,
      subject: input.subject,
      lens: discoveryLens,
      limit: 10,
      mechanics,
    });

  const enriched =
    searched.map((candidate) =>
      enrichMovieCandidate(
        candidate,
        input.realityGraph,
        worldSimulation,
      ),
    );

  const differentiated =
    selectDistinctMovieCandidates(
      enriched,
      6,
    );

  const viewerRanked =
    rerankByViewerState(
      input.realityGraph,
      differentiated,
    );

  const rankedWithInference = viewerRanked
    .map((candidate) => {
      const hypotheses = inferenceHypothesesFor(
        input.realityGraph!,
        candidate,
      );
      const selectedInference = hypotheses[0];
      const inferenceScore =
        selectedInference?.observerInferencePotential ?? 0;
      const combinedScore = metric(
        candidate.score * 0.58 +
        inferenceScore * 0.42,
      );

      return {
        candidate: applyInferencePressure(
          {
            ...candidate,
            score: combinedScore,
          },
          selectedInference,
        ),
        hypotheses,
        selectedInference,
        combinedScore,
      };
    })
    .sort((left, right) =>
      right.combinedScore - left.combinedScore ||
      (right.selectedInference?.observerInferencePotential ?? 0) -
        (left.selectedInference?.observerInferencePotential ?? 0),
    );

  const candidates =
    rankedWithInference.map((entry) => entry.candidate);
  const selectedEntry =
    rankedWithInference[0];

  return {
    latentMovieCandidates: candidates,
    selectedMovie: selectedEntry?.candidate,
    inferenceHypotheses:
      selectedEntry?.hypotheses ?? [],
    selectedInference:
      selectedEntry?.selectedInference,
    worldSimulation,
  };
}

function traits(
  input: AuthorCognitionInput,
): string[] {
  const all = [
    ...input.facts,
    ...input.sourceMoments,
    ...(input.memoryContext ?? []),
  ];

  return uniq(
    all.filter((value) =>
      /\b(?:nervous|scared|fierce|sweet|gentle|wild|goofy|stubborn|proud|confident|quiet|loud|funny|mischievous|tired|calm|excited|happy|angry|afraid)\b/i.test(
        value,
      ),
    ),
    8,
  );
}

function contradictions(
  input: AuthorCognitionInput,
): string[] {
  const graph =
    input.realityGraph;

  return uniq(
    [
      ...(graph?.unresolvedTensions ??
        []),
      ...(graph?.relations
        .filter(
          (relation) =>
            relation.kind ===
              "contrasts" ||
            relation.kind ===
              "changes" ||
            relation.kind ===
              "recontextualizes",
        )
        .slice(0, 8)
        .map(
          (relation) =>
            `supplied relationship: ${relation.kind}`,
        ) ??
        []),
    ],
    12,
  );
}

function objectRelationships(
  input: AuthorCognitionInput,
): string[] {
  return uniq(
    input.realityGraph?.events
      .filter(
        (event) =>
          event.entities.length >
          1,
      )
      .map(
        (event) =>
          event.label,
      ) ?? [],
    12,
  );
}

function frames(
  input: AuthorCognitionInput,
  movie:
    | LatentMovieCandidate
    | undefined,
  selectedLens: string,
  mechanics: readonly AuthorActionMechanic[],
): CharacterFrameCandidate[] {
  const explicit =
    clean(input.lens);

  if (
    explicit &&
    explicit.toLowerCase() !==
      "let qre decide"
  ) {
    const profile = classifyLens(explicit);
    return [
      {
        frame: explicit,
        reason: `explicit user perspective; ${profile.label} may amplify ${profile.framingBias.slice(0, 4).join(", ")} without changing reality`,
        confidence: 0.95,
      },
    ];
  }

  const automatic =
    autoLensCandidates(
      input,
      mechanics,
    );

  if (
    automatic[0]?.frame ===
      selectedLens &&
    automatic[0]?.frame !== "NONE"
  ) {
    return automatic;
  }

  const relationKinds =
    new Set(
      input.realityGraph?.relations.map(
        (relation) =>
          relation.kind,
      ) ?? [],
    );

  const out:
    CharacterFrameCandidate[] =
    [];

  if (
    relationKinds.has(
      "contrasts",
    )
  ) {
    out.push({
      frame: "contrast",
      reason:
        "the supplied world contains a material contrast",
      confidence: 0.9,
    });
  }

  if (
    relationKinds.has(
      "recontextualizes",
    )
  ) {
    out.push({
      frame:
        "recontextualization",
      reason:
        "one supplied detail changes another detail's meaning",
      confidence: 0.9,
    });
  }

  if (
    relationKinds.has("repeats") ||
    (input.round ?? 1) > 1
  ) {
    out.push({
      frame: "callback",
      reason:
        "the world contains continuity material",
      confidence: 0.88,
    });
  }

  if (
    movie?.storyThesis
      ?.semanticTurn
  ) {
    out.push({
      frame:
        "character consequence",
      reason:
        "the selected movie contains a real graph-backed semantic turn",
      confidence: 0.86,
    });
  }

  return out.length
    ? out
    : automatic;
}

function operationsForMovie(
  movie:
    | LatentMovieCandidate
    | undefined,
): string[] {
  if (!movie) {
    return [];
  }

  return movie.trajectory
    .map(
      (step) =>
        clean(step.operation),
    )
    .filter(Boolean);
}

function callbackTargetsFor(
  input: AuthorCognitionInput,
  permanentTruths: readonly string[],
  experienceState:
    | AuthorExperienceState
    | undefined,
): string[] {
  return uniq(
    [
      ...(input.priorScenes ??
        []),
      ...(input.realityGraph
        ?.recurringSignals ??
        []),
      ...permanentTruths,
      ...(experienceState
        ?.memoryHooks ?? []),
    ],
    20,
  );
}

function buildAttentionCandidates():
  AttentionCandidate[] {
  return [
    {
      strategy:
        "graph_relationship",
      reason:
        "Prefer supplied relationships over isolated facts.",
      score: 100,
    },
    {
      strategy:
        "viewer_state_change",
      reason:
        "Prefer cuts that materially change attention, curiosity, expectation, or meaning.",
      score: 99,
    },
    {
      strategy: "change",
      reason:
        "Prefer supplied changes that alter meaning.",
      score: 96,
    },
    {
      strategy: "contrast",
      reason:
        "Prefer supplied contrasts when they produce a stronger movie.",
      score: 94,
    },
    {
      strategy: "recurrence",
      reason:
        "Use persistent repetition when memory makes it meaningful.",
      score: 90,
    },
    {
      strategy: "continuity",
      reason:
        "Use prior chapters when they materially change current meaning.",
      score: 88,
    },
  ];
}

function buildAntiRepetitionRules():
  string[] {
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

function buildSceneRules(
  experienceState:
    | AuthorExperienceState
    | undefined,
  selectedLens: string,
): string[] {
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
    ...(experienceState
      ? summarizeAuthorExperienceState(
          experienceState,
        )
      : []),
  ];
}

export function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): AuthorCognitivePlan {

const priorExperienceStates =
  parsePriorExperienceStates(
    input.priorStrategies,
  );

const actionMechanics =
  input.realityGraph
    ? deriveAuthorActionMechanics(
        input.realityGraph,
        input.subject,
      )
    : [];

const movie =
  movieFor(
    input,
    priorExperienceStates,
    actionMechanics,
  );

const selectedEvidenceIds = new Set(
  movie.selectedMovie?.storyThesis
    ?.semanticRealization
    ?.evidenceEventIds ??
    movie.selectedMovie?.anchorEventIds ??
    [],
);

const selectedActionMechanics =
  selectedEvidenceIds.size
    ? actionMechanics.flatMap((mechanic) => {
        const overlapCount =
          mechanic.evidenceEventIds.filter((id) =>
            selectedEvidenceIds.has(id),
          ).length;

        const evidenceSupport =
          overlapCount /
          Math.max(
            1,
            mechanic.evidenceEventIds.length,
          );

        if (evidenceSupport < 0.5) {
          return [];
        }

        return [
          {
            ...mechanic,
            strength: metric(
              mechanic.strength *
                evidenceSupport,
            ),
            signals: [
              ...mechanic.signals,
              "selected-evidence-support:" +
                evidenceSupport.toFixed(2),
            ],
          },
        ];
      })
    : actionMechanics;

const treatmentMechanics =
  selectedEvidenceIds.size
    ? selectedActionMechanics
    : actionMechanics;

/*
 * Lens is treatment pressure, not story authority.
 * Resolve it only after the strongest grounded movie/metamorphic relation has
 * been discovered without lens influence. Auto-lens receives only mechanics
 * that overlap the winning interpretation when such evidence exists.
 */
const selectedLens =
  resolveLens(
    input,
    treatmentMechanics,
  );

  const experienceState =
    input.realityGraph &&
    movie.selectedMovie
      ? buildAuthorExperienceState(
          {
            graph:
              input.realityGraph,
            movie:
              movie.selectedMovie,
            lens:
              selectedLens,
            priorScenes:
              input.priorScenes,
            memoryContext:
              input.memoryContext,
            priorExperienceStates,
            round:
              input.round,
            worldSimulation:
              movie.worldSimulation,
          },
        )
      : undefined;

  const domainContext =
    domainContextText(
      input.domainContext,
    );

  const permanentTruths =
    uniq(
      [
        ...input.facts,
        ...(input.memoryContext ??
          []),
      ],
      30,
    );

  const currentEvidence =
    uniq(
      [
        ...input.sourceMoments,
        ...(
          input.realityGraph
            ?.events ??
          []
        ).map(
          (event) =>
            event.label,
        ),
      ],
      30,
    );

  const contradictionList =
    contradictions(input);

  const selectedMovie =
    movie.selectedMovie;

  const characterRead:
    CharacterRead = {
    coreTraits:
      traits(input),

    contradictions:
      contradictionList,

    statusPosture:
      contradictionList[0] ??
      "defined by supplied reality",

    emotionalPosture:
      contradictionList[0]
        ? `emotion sits inside ${contradictionList[0]}`
        : "emotion should be inferred from supplied evidence",

    objectRelationships:
      objectRelationships(input),

    creativeFrames:
      frames(
        input,
        selectedMovie,
        selectedLens,
        treatmentMechanics,
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

  const selectedFrame =
    selectedLens;

  const attentionCandidates =
    buildAttentionCandidates();

  const chosen =
    selectedMovie
      ? "latent_movie"
      : "direct_grounded";

  const operatorMix =
    operationsForMovie(
      selectedMovie,
    );

  const callbackTargets =
    callbackTargetsFor(
      input,
      permanentTruths,
      experienceState,
    );

  const antiRepetitionRules =
    buildAntiRepetitionRules();

  const sceneRules =
    buildSceneRules(
      experienceState,
      selectedLens,
    );

  const graphSummary =
    input.realityGraph
      ? `REALITY GRAPH: ${input.realityGraph.events.length} events, ${input.realityGraph.relations.length} relations.`
      : "REALITY GRAPH: unavailable.";

  const dynamics =
    selectedMovie?.viewerStateDynamics;

  const semanticTurn =
    selectedMovie?.storyThesis
      ?.semanticTurn;

  const movieSummary =
    selectedMovie
      ? [
          `SELECTED MOVIE: ${selectedMovie.hypothesis.join(" ")}`,
          `SEMANTIC TURN: ${semanticTurn || "none"}`,
          `THESIS RELATION: ${
            selectedMovie.storyThesis
              ?.relationKind ??
            "none"
          }`,
          `CANDIDATE COUNT: ${movie.latentMovieCandidates.length}`,
          `VIEWER-STATE SCORE: ${
            dynamics?.score ??
            "n/a"
          }`,
          "OBSERVER INFERENCE: " +
            (movie.selectedInference?.kind ?? "none"),
          "OBSERVER INFERENCE POTENTIAL: " +
            String(movie.selectedInference?.observerInferencePotential ?? "n/a"),
          "HIDDEN READ: " +
            (movie.selectedInference?.latentRead ?? "none"),
        ].join(" ")
      : "MOVIE DISCOVERY: off or unavailable; remain direct and grounded.";

  const lensProfile =
    classifyLens(selectedFrame);

  const frameSummary =
    `FRAME: ${selectedFrame}. AMPLIFY: ${lensProfile.framingBias.join(", ")}. PREFER: ${lensProfile.realizationPreferences.join(", ")}. A frame changes perspective, never reality.`;

  const authorBrief =
    [
      `MODE: ${chosen}`,
      frameSummary,
      graphSummary,
      ...(actionMechanics.length
        ? [
            "ACTION MECHANICS (INTERPRETIVE, NOT FACTS): " +
              actionMechanics
                .slice(0, 8)
                .map(
                  (item) =>
                    item.kind +
                    "=" +
                    item.strength.toFixed(2) +
                    "[" +
                    item.evidenceEventIds.join(",") +
                    "]",
                )
                .join(" | "),
            "SELECTED-MEANING MECHANICS: " +
              treatmentMechanics
                .slice(0, 6)
                .map((item) => item.kind)
                .join(", "),
            "Mechanics may shape movie search and treatment only. They never become concrete-world claims.",
          ]
        : []),
      ...(domainContext.length
        ? [
            `DOMAIN CONTEXT (CONTEXT ONLY, NOT OCCURRENCE EVIDENCE): ${domainContext.join(" | ")}`,
            "Domain context may classify the world and legitimate service/business capabilities. It may not invent a person, ownership, tenancy, client relationship, location, action, or event.",
          ]
        : []),
      movieSummary,
      ...(experienceState
        ? summarizeAuthorExperienceState(
            experienceState,
          )
        : []),
      "Reality is immutable. Creativity never becomes evidence.",
      "Lens is an amplification grammar, not permission to add world facts.",
    ];

  return {
    mode: chosen,

    selectedFrame,

    chosenAttentionStrategy:
      chosen,

    attentionCandidates,

    characterRead,

    actionMechanics,

    selectedActionMechanics:
      treatmentMechanics,

    latentMovieCandidates:
      movie.latentMovieCandidates,

    selectedMovie,

    inferenceHypotheses:
      movie.inferenceHypotheses,

    selectedInference:
      movie.selectedInference,

    experienceState,

    operatorMix,

    callbackTargets,

    antiRepetitionRules,

    sceneRules,

    authorBrief,

    permanentTruths,

    currentEvidence,

    contradictions:
      contradictionList,

    graphSummary,

    movieSummary,

    frameSummary,
  };
}



