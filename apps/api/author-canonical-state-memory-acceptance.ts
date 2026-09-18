import type {
  LatentSemanticRealization,
  MouthCandidateBeat,
} from "@qre/contracts";

import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorBehaviorProfile } from "./src/services/authorBehaviorProfile.js";
import { rankLensOpportunities } from "./src/services/authorCharacterLensEngine.js";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";
import { buildAuthorReadout } from "./src/services/authorReadout.js";
import { classifyAuthorRealizationMode } from "./src/services/authorRealizationMode.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import { deriveLatentStoryThesis } from "./src/services/authorLatentStoryThesis.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { scoreViewerStateTrajectory } from "./src/services/authorViewerState.js";
import { deriveViewerStateCut } from "./src/services/authorViewerStateCut.js";
import { buildMouthRealizationAuthority } from "./src/services/authorMouthRealizationAuthority.js";
import { buildMouthCandidateMessages } from "./src/services/authorMouthCandidateSearchCanonical.js";
import { buildCreativeLensBrief } from "./src/services/authorCreativeLensBrief.js";
import { buildExperienceMemoryBatch } from "./src/services/memoryProjection.js";
import { authorExperienceMemoryContext } from "./src/services/authorExperienceMemory.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const subject = "Mira";
const facts = [
  "Mira arrived uncertain",
  "Mira selected the red ticket",
  "Mira left approved",
];

const dayOneMiloGraph = buildAuthorRealityGraph({
  prompt: "Milo loves walks, bacon, small dogs",
  subject: "Milo",
  facts: [],
  sourceMoments: ["Milo loves walks, bacon, small dogs"],
});

const dayOneLabels = dayOneMiloGraph.events.map((event) => event.label);
assert(
  dayOneLabels.includes("Milo loves walks") &&
    dayOneLabels.includes("Milo loves bacon") &&
    dayOneLabels.includes("Milo loves small dogs"),
  `Day-one profile intake lost the supplied preference relationship: ${JSON.stringify(dayOneLabels)}`,
);

const dayOneMovies = searchUniversalMovieCandidates({
  graph: dayOneMiloGraph,
  subject: "Milo",
  lens: "NONE",
  limit: 8,
});
assert(dayOneMovies.length > 0, "Day-one profile reality produced no movie candidates.");

const dayOneTheses = dayOneMovies.map((movie) =>
  deriveLatentStoryThesis(dayOneMiloGraph, movie),
);
assert(
  dayOneTheses.some(
    (thesis) =>
      thesis.semanticRealization?.mechanism === "convergence" &&
      thesis.semanticRealization?.evidenceEventIds.length >= 2 &&
      /personality|character|profile|preferences/i.test(
        [
          thesis.semanticRealization.feltEffect,
          thesis.semanticRealization.viewerShift,
          thesis.semanticRealization.languageAim,
        ].filter(Boolean).join(" "),
      ),
  ),
  `Day-one profile reality did not produce a character-level semantic opportunity: ${JSON.stringify(dayOneTheses)}`,
);

const dayOneMemoryBatch = buildExperienceMemoryBatch({
  operationId: "day-one-profile-memory",
  assetId: "asset-milo",
  graph: dayOneMiloGraph,
  subject: "Milo",
  subjectKind: "dog",
  source: "prompt",
  observedAt: "2026-09-17T12:00:00.000Z",
});

assert(
  dayOneMemoryBatch.events.length === 0,
  `Stable profile assertions were incorrectly persisted as occurrences: ${JSON.stringify(dayOneMemoryBatch.events)}`,
);

assert(
  dayOneMemoryBatch.facts.filter((fact) => fact.kind === "preference").length >= 3,
  `Day-one preferences were not persisted as durable subject facts: ${JSON.stringify(dayOneMemoryBatch.facts)}`,
);

const heistPlan = buildAuthorCognitivePlan({
  prompt: "Milo loves walks, bacon, small dogs",
  subject: "Milo",
  lens: "heist",
  facts: [],
  sourceMoments: ["Milo loves walks, bacon, small dogs"],
  realityGraph: dayOneMiloGraph,
});

const romancePlan = buildAuthorCognitivePlan({
  prompt: "Milo loves walks, bacon, small dogs",
  subject: "Milo",
  lens: "romance",
  facts: [],
  sourceMoments: ["Milo loves walks, bacon, small dogs"],
  realityGraph: dayOneMiloGraph,
});

assert(
  heistPlan.selectedMovie?.id === romancePlan.selectedMovie?.id,
  `Lens changed movie discovery instead of only treatment pressure: ${JSON.stringify({
    heist: heistPlan.selectedMovie?.id,
    romance: romancePlan.selectedMovie?.id,
  })}`,
);

assert(
  heistPlan.selectedFrame === "heist" &&
    romancePlan.selectedFrame === "romance",
  "Late lens treatment was not preserved after lens-neutral movie discovery.",
);

const livingMemoryGraph = buildAuthorRealityGraph({
  prompt:
    "We met at The Underground, hit it off right away, didn't expect it",
  subject: "Our relationship",
  facts: [],
  sourceMoments: [
    "We met at The Underground, hit it off right away, didn't expect it",
  ],
});

const livingMemoryMovies = searchUniversalMovieCandidates({
  graph: livingMemoryGraph,
  subject: "Our relationship",
  lens: "NONE",
  limit: 8,
});

const livingMemoryTheses = livingMemoryMovies.map((movie) =>
  deriveLatentStoryThesis(livingMemoryGraph, movie),
);

assert(
  livingMemoryTheses.some(
    (thesis) =>
      thesis.semanticRealization?.mechanism === "expectation_shift",
  ),
  `Living Memory intake failed to discover the supplied expectation collision: ${JSON.stringify(livingMemoryTheses)}`,
);

const livingMemoryBatch = buildExperienceMemoryBatch({
  operationId: "living-memory-day-one",
  assetId: "asset-living-memory",
  graph: livingMemoryGraph,
  subject: "Our relationship",
  subjectKind: "relationship",
  source: "prompt",
  observedAt: "2026-09-17T12:00:00.000Z",
});

assert(
  livingMemoryBatch.events.some((event) => /met at The Underground/i.test(event.summary)),
  "The supplied meeting occurrence was not persisted as history.",
);

assert(
  livingMemoryBatch.facts.some(
    (fact) =>
      fact.predicate === "supplied_context" &&
      /didn'?t expect/i.test(fact.value),
  ),
  `The supplied expectation was incorrectly treated as an occurrence or lost: ${JSON.stringify(livingMemoryBatch.facts)}`,
);

const openWorldGraph = buildAuthorRealityGraph({
  prompt:
    "Aster found the zenthra coil, the zenthra coil was broken, Aster fixed the zenthra coil",
  subject: "Aster",
  facts: [],
  sourceMoments: [
    "Aster found the zenthra coil",
    "the zenthra coil was broken",
    "Aster fixed the zenthra coil",
  ],
});

assert(
  openWorldGraph.eventStructure?.some(
    (item) =>
      item.objects.some((value) =>
        /zenthra|coil/i.test(value),
      ),
  ),
  `Open-world object extraction failed for an unknown noun: ${JSON.stringify(openWorldGraph.eventStructure)}`,
);

const openWorldMovies = searchUniversalMovieCandidates({
  graph: openWorldGraph,
  subject: "Aster",
  lens: "NONE",
  limit: 8,
});

const openWorldTheses = openWorldMovies.map((movie) =>
  deriveLatentStoryThesis(openWorldGraph, movie),
);

assert(
  openWorldTheses.some(
    (thesis) =>
      (thesis.semanticRealization?.evidenceEventIds.length ?? 0) >= 2,
  ),
  `Unknown real-world nouns could not participate in semantic discovery: ${JSON.stringify(openWorldTheses)}`,
);

const sparseOneGraph = buildAuthorRealityGraph({
  prompt: "Aster keeps the zenthra coil",
  subject: "Aster",
  facts: [],
  sourceMoments: ["Aster keeps the zenthra coil"],
});

const sparseOneMovies = searchUniversalMovieCandidates({
  graph: sparseOneGraph,
  subject: "Aster",
  lens: "NONE",
  limit: 8,
});

assert(
  sparseOneMovies.length > 0,
  "A single supplied truth failed to wake up movie discovery.",
);

const sparseOneThesis = deriveLatentStoryThesis(
  sparseOneGraph,
  sparseOneMovies[0]!,
);

assert(
  sparseOneThesis.semanticRealization?.evidenceEventIds.length === 1 &&
    /information to significance|supplied detail/i.test(
      [
        sparseOneThesis.semanticRealization.feltEffect,
        sparseOneThesis.semanticRealization.viewerShift,
        sparseOneThesis.semanticRealization.languageAim,
      ].filter(Boolean).join(" "),
    ),
  `Single-detail reality did not receive bounded semantic authority: ${JSON.stringify(sparseOneThesis)}`,
);

const sparseTwoGraph = buildAuthorRealityGraph({
  prompt: "Aster keeps the zenthra coil, Aster avoids the north room",
  subject: "Aster",
  facts: [],
  sourceMoments: [
    "Aster keeps the zenthra coil",
    "Aster avoids the north room",
  ],
});

const sparseTwoMovies = searchUniversalMovieCandidates({
  graph: sparseTwoGraph,
  subject: "Aster",
  lens: "NONE",
  limit: 8,
});

assert(
  sparseTwoMovies.length > 0,
  "Two supplied truths failed to produce a movie candidate.",
);

const sparseTwoThesis = deriveLatentStoryThesis(
  sparseTwoGraph,
  sparseTwoMovies[0]!,
);

assert(
  sparseTwoThesis.semanticRealization?.mechanism === "convergence" &&
    sparseTwoThesis.semanticRealization.evidenceEventIds.length === 2 &&
    /juxtaposition|do not invent causality/i.test(
      [
        sparseTwoThesis.semanticRealization.feltEffect,
        sparseTwoThesis.semanticRealization.viewerShift,
        sparseTwoThesis.semanticRealization.languageAim,
      ].filter(Boolean).join(" "),
    ),
  `Two-detail reality did not receive non-causal juxtaposition authority: ${JSON.stringify(sparseTwoThesis)}`,
);

const graph = buildAuthorRealityGraph({
  prompt: "Write a QRE-style living memory.",
  subject,
  facts,
  sourceMoments: facts,
  memoryContext: ["Mira had visited before"],
  trajectory: [],
});

const envelope = buildAuthorRealityEnvelope({ graph, subject });

const semanticRealization: LatentSemanticRealization = {
  mechanism: "state_change",
  evidenceEventIds: ["event-1", "event-3"],
  beforeEventIds: ["event-1"],
  afterEventIds: ["event-3"],
  before: "uncertain arrival",
  after: "approved exit",
  subject,
  relation: {
    kind: "changes",
    fromEventId: "event-1",
    toEventId: "event-3",
  },
  realizationMove: "feel_state_transition",
  creativeOpportunity: "status_turn",
  feltEffect: "approval lands as status",
  viewerShift: "from uncertainty to approval",
  languageAim: "state progression without source replay",
  confidence: 0.9,
};

const baseBeats: MouthCandidateBeat[] = [
  {
    order: 1,
    role: "establishing",
    eventIds: ["event-1"],
    change: "uncertain arrival",
    next: "What changes?",
    frontier: "What changes?",
    relationKinds: [],
  },
  {
    order: 2,
    role: "reveal",
    eventIds: ["event-2"],
    change: "red ticket selected",
    next: "What does the selection become?",
    frontier: "What does the selection become?",
    relationKinds: [],
  },
  {
    order: 3,
    role: "payoff",
    eventIds: ["event-1", "event-3"],
    change: "uncertainty becomes approval",
    next: "",
    frontier: "",
    paysOff: ["approved exit"],
    relationKinds: ["changes"],
    semanticRealization,
    observerExperience: {
      objective: "Track the viewer from uncertainty to approval.",
      surprise: "The last state changes the first one.",
      curiosity: "What did the arrival become?",
      attention: ["arrival", "selection", "approval"],
      landing: "approved exit",
      explanationForbidden: true,
      feltEffect: "approval lands",
      viewerShift: "uncertainty resolves",
      realizationDirection: "compress to viewer-state payoff",
    },
  },
];

const authorityBeats = baseBeats.map((beat) => ({
  ...beat,
  realizationAuthority: buildMouthRealizationAuthority({ beat, envelope }),
}));

const enrichedBeats = authorityBeats.map((beat, index, allBeats) => ({
  ...beat,
  viewerState: deriveViewerStateCut(beat, index, allBeats, envelope),
}));

assert(
  enrichedBeats.every((beat) => beat.realizationAuthority),
  "Viewer-state enrichment dropped realizationAuthority.",
);

assert(
  enrichedBeats[1]?.viewerState?.beforeState === enrichedBeats[0]?.change,
  `Beat 2 viewer state did not remember beat 1 meaning: ${JSON.stringify(enrichedBeats[1]?.viewerState)}`,
);

assert(
  enrichedBeats[2]?.viewerState?.attentionMove === "land",
  `Payoff beat did not land viewer state: ${JSON.stringify(enrichedBeats[2]?.viewerState)}`,
);

const movieCandidates = searchUniversalMovieCandidates({
  graph,
  subject,
  lens: "status comedy",
  limit: 8,
});
const graphEventIds = new Set(graph.events.map((event) => event.id));
assert(movieCandidates.length >= 1, "Universal movie search did not produce a current candidate.");
assert(
  movieCandidates.every((candidate) =>
    candidate.trajectory
      .flatMap((step) => step.eventIds)
      .every((id) => graphEventIds.has(id)),
  ),
  "Universal movie search invented event IDs.",
);

const selectedMovieBase = movieCandidates[0]!;
const selectedMovie = {
  ...selectedMovieBase,
  storyThesis: deriveLatentStoryThesis(
    graph,
    selectedMovieBase,
  ),
};

assert(
  selectedMovie.storyThesis.semanticRealization,
  "Canonical movie enrichment did not attach semantic realization before persistence.",
);

const heistBrief = buildCreativeLensBrief({
  lens: "heist",
  movie: selectedMovie,
  envelope,
});
const gameBrief = buildCreativeLensBrief({
  lens: "game",
  movie: selectedMovie,
  envelope,
});

assert(
  heistBrief.metamorphic.relationKind === gameBrief.metamorphic.relationKind &&
    JSON.stringify(heistBrief.metamorphic.evidenceEventIds) ===
      JSON.stringify(gameBrief.metamorphic.evidenceEventIds),
  `Lens changed the discovered metamorphic relation: ${JSON.stringify({
    heist: heistBrief.metamorphic,
    game: gameBrief.metamorphic,
  })}`,
);
assert(
  heistBrief.lens.label !== gameBrief.lens.label &&
    JSON.stringify(heistBrief.treatmentMoves) !== JSON.stringify(gameBrief.treatmentMoves),
  "Different lenses did not create different treatment pressure.",
);
assert(
  heistBrief.realityInvariants.some((value) =>
    /only concrete-world authority/i.test(value),
  ),
  "Creative Lens Brief lost RealityGraph sovereignty.",
);

const identityBatch = buildExperienceMemoryBatch({
  operationId: "identity-anchor-test",
  assetId: "asset-identity-test",
  graph,
  subject,
  subjectKind: "person",
  source: "prompt",
  observedAt: "2026-09-17T12:00:00.000Z",
});

const identityEntity = identityBatch.entities.find(
  (entity) =>
    entity.name === subject &&
    entity.kind === "person" &&
    entity.metadata?.qreIdentityAnchor === true,
);
assert(identityEntity, "Durable memory did not persist the QRE subject identity anchor.");
assert(
  identityBatch.facts.some(
    (fact) =>
      fact.entityId === identityEntity.id &&
      fact.predicate === "qre_identity_anchor" &&
      fact.value === subject,
  ),
  "Durable memory did not persist the identity-anchor fact.",
);
assert(
  identityBatch.relations.some(
    (relation) =>
      relation.fromEntityId === identityEntity.id &&
      relation.relation === "participates_in",
  ),
  "Durable identity anchor was not linked to supplied world events.",
);

const messages = buildMouthCandidateMessages({
  envelope,
  beats: enrichedBeats,
  lens: "status comedy",
  creativeLensBrief: buildCreativeLensBrief({
    lens: "status comedy",
    movie: selectedMovie,
    envelope,
  }),
});

const userPayload = JSON.parse(messages[1]?.content ?? "{}") as {
  beats?: Array<Record<string, unknown>>;
};

const projectedAuthority = userPayload.beats?.[2]?.realizationAuthority as
  | Record<string, unknown>
  | undefined;

assert(projectedAuthority, "Mouth prompt did not receive realizationAuthority.");
assert(projectedAuthority.reality, "Projected authority missing reality.");
assert(projectedAuthority.meaning, "Projected authority missing meaning.");
assert(
  projectedAuthority.earnedInterpretations,
  "Projected authority missing earnedInterpretations.",
);
assert(
  projectedAuthority.permittedRealizationModes,
  "Projected authority missing permittedRealizationModes.",
);
assert(projectedAuthority.inferenceBudget, "Projected authority missing inferenceBudget.");
assert(projectedAuthority.creativeMoves, "Projected authority missing creativeMoves.");
assert(projectedAuthority.forbiddenMoves, "Projected authority missing forbiddenMoves.");
assert(
  !("metamorphicRelationSet" in projectedAuthority),
  "Mouth prompt leaked metamorphicRelationSet.",
);

const projectedReality = projectedAuthority.reality as {
  entities?: unknown[];
  actions?: unknown[];
  objects?: unknown[];
  states?: unknown[];
};
const lowerValues = (values: unknown[] | undefined): string[] =>
  (values ?? []).map((value) => String(value).toLowerCase());
const projectedEntities = lowerValues(projectedReality.entities);
const projectedActions = lowerValues(projectedReality.actions);
const projectedObjects = lowerValues(projectedReality.objects);
const projectedStates = lowerValues(projectedReality.states);

assert(
  projectedEntities.includes("mira"),
  `Projected payoff authority lost scoped entity: ${JSON.stringify(projectedReality)}`,
);
assert(
  projectedActions.includes("arrived") && projectedActions.includes("left"),
  `Projected payoff authority lost scoped actions: ${JSON.stringify(projectedReality)}`,
);
assert(
  projectedStates.includes("uncertainty") && projectedStates.includes("approval"),
  `Projected payoff authority lost scoped state/status concepts: ${JSON.stringify(projectedReality)}`,
);
assert(
  projectedObjects.length === 0,
  `Projected payoff authority invented object authority from state/status evidence: ${JSON.stringify(projectedReality)}`,
);

const neutralProfile = buildAuthorBehaviorProfile([]);
assert(neutralProfile.confidence === 0, "Empty behavior profile invented confidence.");
assert(neutralProfile.learnedSignals.length === 0, "Empty behavior profile invented learned signals.");

const learnedProfile = buildAuthorBehaviorProfile([
  "accepted:short punchy callback",
  "accepted:sharp reveal",
  "rejected:explanatory longform",
  "engagement:0.9",
  "revisit:returning continuity",
]);
assert(learnedProfile.confidence > 0, "Behavior profile ignored supplied learning evidence.");
assert(
  learnedProfile.learnedSignals.some((signal) => /SHORT|EXPLANATORY|CALLBACK|SURPRISE|REVISIT/i.test(signal)),
  `Behavior profile did not expose learned signals: ${JSON.stringify(learnedProfile)}`,
);

assert(
  classifyAuthorRealizationMode({
    prompt: "Summarize the profile.",
    facts: ["Mira likes red tickets"],
    sourceMoments: [],
    relationKinds: [],
  }) === "collection",
  "Stable profile facts became sequence-film evidence.",
);
assert(
  classifyAuthorRealizationMode({
    prompt: "Write a QRE-style living memory.",
    facts,
    sourceMoments: facts,
    relationKinds: graph.relations.map((relation) => relation.kind),
    movieMode: true,
  }) === "sequence-film",
  "Episode evidence did not select sequence-film realization mode.",
);

const lensRanking = rankLensOpportunities(envelope);
assert(lensRanking.length > 0, "Lens ranking produced no current production candidates.");
assert(
  lensRanking.every((lens) => /never concrete reality/i.test(lens.reason) || lens.frame === "NONE"),
  `Lens ranking stopped preserving the reality boundary: ${JSON.stringify(lensRanking)}`,
);

const roundOneState = buildAuthorExperienceState({
  graph,
  movie: selectedMovie,
  lens: "status comedy",
  memoryContext: [],
  round: 1,
});
const roundTwoState = buildAuthorExperienceState({
  graph,
  movie: selectedMovie,
  lens: "status comedy",
  memoryContext: ["carry: red ticket"],
  priorExperienceStates: [roundOneState],
  round: 2,
});
assert(
  roundTwoState.realityAnchors.length >= roundOneState.realityAnchors.length,
  "Experience-state rehydration dropped prior reality anchors.",
);
assert(
  roundTwoState.carryThreads.some((thread) => /red ticket/i.test(thread)),
  "Experience-state rehydration dropped memory carry thread.",
);

const viewerDynamics = scoreViewerStateTrajectory(graph, selectedMovie);
assert(
  viewerDynamics.score > 0 && viewerDynamics.payoff > 0,
  `Viewer-state trajectory failed to score current movie: ${JSON.stringify(viewerDynamics)}`,
);

const continuityContext = authorExperienceMemoryContext({
  assetId: "asset-memory-test",
  generatedAt: "2026-09-17T12:00:00.000Z",
  entities: [],
  facts: [],
  relations: [],
  events: [
    {
      id: "author-state-1",
      type: "author_experience_state",
      summary: "prior author state",
      occurredAt: "2026-09-17T11:00:00.000Z",
      source: "system",
      confidence: 1,
      entityIds: [],
      metadata: {
        authorExperienceState: roundTwoState,
      },
    },
  ],
});

assert(
  continuityContext.some((value) => /prior lens:/i.test(value)),
  "Re-entry memory dropped the selected lens.",
);
assert(
  continuityContext.some((value) => /semantic relation:|relation kind:/i.test(value)),
  `Re-entry memory dropped semantic continuity: ${JSON.stringify(continuityContext)}`,
);
assert(
  continuityContext.some((value) => /carry:|revisit:|open question:/i.test(value)),
  "Re-entry memory dropped return/callback pressure.",
);

const readout = buildAuthorReadout({
  subject,
  graph,
  learnedProfile,
  movieCandidates,
  selectedMovie,
  experienceState: roundTwoState,
  mouthLines: ["Official."],
  finalScenes: ["Official."],
});
assert(readout.invariants.truthPreserved, "Readout did not preserve source truth invariant.");
assert(readout.invariants.learnedPreferenceOnly, "Readout allowed learned profile outside preference bounds.");
assert(readout.invariants.movieSelectedBeforeMouth, "Readout lost selected movie before Mouth.");
assert(readout.invariants.noPlannerLanguage, "Readout detected planner language in final output.");
assert(readout.invariants.noPartialSuccess, "Readout accepted a partial gate failure.");

console.log("AUTHOR CANONICAL STATE MEMORY ACCEPTANCE");
console.log(
  JSON.stringify(
    {
      viewerStateProgression: enrichedBeats.map((beat) => ({
        order: beat.order,
        before: beat.viewerState?.beforeState,
        after: beat.viewerState?.afterState,
        move: beat.viewerState?.attentionMove,
        evidenceEventIds: beat.viewerState?.evidenceEventIds,
        hasRealizationAuthority: Boolean(beat.realizationAuthority),
      })),
      projectedAuthority,
      recoveredInvariants: {
        lensBoundary: {
          heist: heistBrief,
          game: gameBrief,
        },
        identityAnchor: {
          entity: identityEntity,
          relationCount: identityBatch.relations.filter(
            (relation) =>
              relation.fromEntityId === identityEntity.id &&
              relation.relation === "participates_in",
          ).length,
        },
        learnedProfile,
        realizationModes: ["collection", "sequence-film"],
        lensRanking: lensRanking.slice(0, 3),
        movieCandidateCount: movieCandidates.length,
        roundOneState: {
          anchors: roundOneState.realityAnchors.length,
          tempo: roundOneState.tempo.mode,
        },
        roundTwoState: {
          anchors: roundTwoState.realityAnchors.length,
          carryThreads: roundTwoState.carryThreads,
          tempo: roundTwoState.tempo.mode,
        },
        viewerDynamics,
        readoutInvariants: readout.invariants,
      },
      status: "PASS",
    },
    null,
    2,
  ),
);
