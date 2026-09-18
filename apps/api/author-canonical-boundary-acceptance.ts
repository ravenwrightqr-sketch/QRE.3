import type {
  LatentMovieCandidate,
  LatentSemanticRealization,
  MouthCandidateBeat,
} from "@qre/contracts";

import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildMouthRealizationAuthority } from "./src/services/authorMouthRealizationAuthority.js";
import { deriveViewerStateCut } from "./src/services/authorMouthCandidateSearch.js";
import {
  parseMouthCandidateBatch,
  scoreMouthCandidate,
} from "./src/services/authorMouthCandidateSearchCanonical.js";
import {
  isAuthorizedMouthCandidate,
  selectBestMouthSequence,
} from "./src/services/authorMouthSequenceBeamSearch.js";
import {
  authorBrainCanonical,
  buildLiteralRecoveryCandidate,
  composeTrajectoryBeats,
  evaluateAuthorAuthorshipQuality,
  evaluateAuthorSourceReplay,
} from "./src/services/authorBrainCanonical.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import { deriveLatentStoryThesis } from "./src/services/authorLatentStoryThesis.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const subject = "Mira";
const facts = [
  "Mira arrived nervous",
  "Mira selected the red ticket",
  "Mira left approved",
  "Mira returned again",
];

const graph = buildAuthorRealityGraph({
  prompt: "Write a QRE-style living memory.",
  subject,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
});

const envelope = buildAuthorRealityEnvelope({ graph, subject });

const semanticRealization: LatentSemanticRealization = {
  mechanism: "state_change",
  evidenceEventIds: ["event-1", "event-3"],
  beforeEventIds: ["event-1"],
  afterEventIds: ["event-3"],
  before: "nervous arrival",
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
  viewerShift: "from uncertainty to official acceptance",
  languageAim: "status verdict, not source replay",
  confidence: 0.91,
};

function beat(input: {
  order: number;
  eventIds: string[];
  change: string;
  role?: string;
  semanticRealization?: LatentSemanticRealization;
}): MouthCandidateBeat {
  const candidateBeat: MouthCandidateBeat = {
    order: input.order,
    eventIds: input.eventIds,
    role: input.role ?? "reveal",
    attentionFunction:
      "Realize authorized meaning without inventing concrete reality.",
    change: input.change,
    next: "",
    frontier: "",
    relationKinds: input.semanticRealization?.relation
      ? [input.semanticRealization.relation.kind]
      : [],
    semanticRealization: input.semanticRealization,
    observerExperience: input.semanticRealization
      ? {
          objective: "Let the viewer feel the status turn.",
          surprise: "The exit changes what the arrival meant.",
          curiosity: "How did uncertainty become approval?",
          attention: ["uncertainty", "turn", "verdict"],
          landing: "approval",
          explanationForbidden: true,
          feltEffect: "approved status",
          viewerShift: "uncertainty becomes acceptance",
          realizationDirection: "compress to status language",
        }
      : undefined,
  };

  candidateBeat.realizationAuthority = buildMouthRealizationAuthority({
    beat: candidateBeat,
    envelope,
  });

  return candidateBeat;
}

const ticketBeat = beat({
  order: 1,
  eventIds: ["event-2"],
  change: "Mira selected the red ticket",
});

const statusBeat = beat({
  order: 2,
  eventIds: ["event-1", "event-3"],
  change: "uncertainty becomes official approval",
  role: "payoff",
  semanticRealization,
});

const recurrenceBeat = beat({
  order: 3,
  eventIds: ["event-4"],
  change: "Mira returned again",
  role: "payoff",
  semanticRealization: {
    ...semanticRealization,
    mechanism: "recurrence",
    evidenceEventIds: ["event-4"],
    beforeEventIds: [],
    afterEventIds: ["event-4"],
    before: "",
    after: "return becomes a pattern",
    relation: undefined,
    realizationMove: "recognize_callback",
    creativeOpportunity: "callback_recontextualization",
    feltEffect: "return feels expected",
    viewerShift: "from one visit to recurrence",
    languageAim: "recurrence framing",
  },
});

function scored(text: string, candidateBeat: MouthCandidateBeat) {
  return scoreMouthCandidate({ text, beat: candidateBeat, envelope });
}

type BoundaryCase = {
  name: string;
  expected: "allowed" | "rejected";
  actual: "allowed" | "rejected";
  text: string;
  reasons: string[];
  authorization: unknown;
};

function candidateCase(
  name: string,
  text: string,
  candidateBeat: MouthCandidateBeat,
  expected: "allowed" | "rejected",
): BoundaryCase {
  const candidate = scored(text, candidateBeat);
  return {
    name,
    expected,
    actual: isAuthorizedMouthCandidate(candidate) ? "allowed" : "rejected",
    text,
    reasons: candidate.reasons,
    authorization: candidate.authorization,
  };
}

const cases: BoundaryCase[] = [
  candidateCase("preserved concrete object", "The red ticket.", ticketBeat, "allowed"),
  candidateCase("object substitution", "The gold trophy.", ticketBeat, "rejected"),
  candidateCase("specificity downgrade", "The red thing.", ticketBeat, "rejected"),
  candidateCase("unsupported body action", "Hands trembling.", statusBeat, "rejected"),
  candidateCase("unsupported atmosphere/environment", "Steam filled the room.", statusBeat, "rejected"),
  candidateCase("unsupported dialogue/speech", "She whispered yes.", statusBeat, "rejected"),
  candidateCase("unsupported physical action", "Mira danced.", statusBeat, "rejected"),
  candidateCase("authorized status framing", "Official.", statusBeat, "allowed"),
  candidateCase("authorized recurrence framing", "Again.", recurrenceBeat, "allowed"),
  candidateCase("low lexical overlap + explicit earned meaning", "Verdict.", statusBeat, "allowed"),
  candidateCase("low lexical overlap + no earned meaning", "Official.", ticketBeat, "rejected"),
];

const preservedObject = scored("The red ticket.", ticketBeat);
const substitutedObject = scored("The gold trophy.", ticketBeat);

const beam = selectBestMouthSequence(
  [
    {
      order: 1,
      viewerState: {
        beforeState: "ticket unknown",
        afterState: "ticket selected",
        attentionMove: "orient",
        curiosityPressure: 0.3,
        contrast: 0.2,
        interruption: 0.1,
        accumulation: 0.4,
        tempo: 0.5,
        payoffPressure: 0.2,
        stateShift: 0.6,
        predictionError: 0.2,
        evidenceEventIds: ["event-2"],
      },
      candidates: [substitutedObject, preservedObject],
    },
  ],
  { width: 4, candidatesPerBeat: 4 },
);

cases.push({
  name: "Beam cannot select unauthorized candidate",
  expected: "allowed",
  actual: beam.candidates[0]?.text === preservedObject.text ? "allowed" : "rejected",
  text: beam.candidates[0]?.text ?? "",
  reasons: beam.candidates[0]?.reasons ?? [],
  authorization: beam.candidates[0]?.authorization,
});

const replayCandidate = scored("Mira arrived nervous", statusBeat);
const replayCheck = evaluateAuthorSourceReplay(
  {
    candidates: [replayCandidate],
    texts: [replayCandidate.text],
    score: replayCandidate.score,
  },
  envelope,
);

cases.push({
  name: "source replay truth-safe but not authored",
  expected: "allowed",
  actual: replayCheck.truthSafe && !replayCheck.authored ? "allowed" : "rejected",
  text: replayCandidate.text,
  reasons: [replayCheck.reason],
  authorization: replayCandidate.authorization,
});

const miloGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE experience.",
  subject: "Milo",
  facts: ["Milo loves walks, bacon, small dogs"],
  sourceMoments: ["Milo loves walks, bacon, small dogs"],
  memoryContext: [],
  trajectory: [],
});
const miloEnvelope = buildAuthorRealityEnvelope({
  graph: miloGraph,
  subject: "Milo",
});
const miloMovies = searchUniversalMovieCandidates({
  graph: miloGraph,
  subject: "Milo",
  lens: "NONE",
  limit: 8,
}).map((candidate) => ({
  ...candidate,
  storyThesis: deriveLatentStoryThesis(
    miloGraph,
    candidate,
  ),
}));
const miloMovie = miloMovies.find(
  (candidate) =>
    candidate.storyThesis?.semanticRealization?.mechanism === "convergence" &&
    (candidate.storyThesis.semanticRealization.evidenceEventIds.length ?? 0) >= 3,
);
assert(
  miloMovie,
  `Day-one profile did not produce a multi-evidence convergence: ${JSON.stringify(miloMovies)}`,
);

const miloBeats = composeTrajectoryBeats(
  miloMovie,
  miloEnvelope,
);
const miloEvidenceIds =
  miloMovie.storyThesis?.semanticRealization?.evidenceEventIds ?? [];

assert(
  miloBeats.length < miloEvidenceIds.length,
  `Semantic-unit composition still serialized one visible beat per source fact: ${JSON.stringify(miloBeats)}`,
);
assert(
  miloEvidenceIds.every((id) =>
    miloBeats.some((candidateBeat) =>
      candidateBeat.eventIds.includes(id),
    ),
  ),
  `Semantic compression dropped provenance evidence: ${JSON.stringify({
    evidence: miloEvidenceIds,
    beats: miloBeats,
  })}`,
);

const miloViewerStates = miloBeats.map(
  (candidateBeat, index, allBeats) =>
    deriveViewerStateCut(
      candidateBeat,
      index,
      allBeats,
      miloEnvelope,
    ),
);

assert(
  miloViewerStates.every(
    (state) =>
      Boolean(state.inferenceBefore) &&
      Boolean(state.inferenceAfter) &&
      Number(state.inferenceSpace ?? 0) > 0 &&
      Number(state.groundingConfidence ?? 0) > 0,
  ),
  `Viewer inference state was not derived from grounded semantic evidence: ${JSON.stringify(miloViewerStates)}`,
);

assert(
  miloViewerStates.every(
    (state) =>
      state.evidenceEventIds.every((id) =>
        miloGraph.events.some((event) => event.id === id),
      ),
  ),
  `Viewer inference state escaped supplied event authority: ${JSON.stringify(miloViewerStates)}`,
);

const factParadeQuality = evaluateAuthorAuthorshipQuality({
  texts: [
    "Walks. Bacon. Small dogs.",
    "Then bacon.",
    "Small dogs complete it.",
  ],
  envelope: miloEnvelope,
  movie: miloMovie,
  subject: "Milo",
});

assert(
  !factParadeQuality.accepted &&
    factParadeQuality.factParadeRisk >= 0.68,
  `Truth-safe fact parade still qualified as authored: ${JSON.stringify(factParadeQuality)}`,
);

const subjectPrefixQuality = evaluateAuthorAuthorshipQuality({
  texts: [
    "Milo loves walks.",
    "Milo loves bacon.",
    "Milo loves small dogs.",
  ],
  envelope: miloEnvelope,
  movie: miloMovie,
  subject: "Milo",
});

assert(
  !subjectPrefixQuality.accepted &&
    subjectPrefixQuality.subjectPrefixRisk >= 0.67,
  `Repeated subject-prefix enumeration still qualified as authored: ${JSON.stringify(subjectPrefixQuality)}`,
);

const transformedQuality = evaluateAuthorAuthorshipQuality({
  texts: ["Priorities. Specific ones."],
  envelope: miloEnvelope,
  movie: miloMovie,
  subject: "Milo",
});

assert(
  transformedQuality.accepted,
  `Low-replay transformed realization was over-rejected by authorship quality: ${JSON.stringify(transformedQuality)}`,
);

const miloSemanticBeat = {
  ...miloBeats[0]!,
  viewerState: miloViewerStates[0],
};
miloSemanticBeat.realizationAuthority =
  buildMouthRealizationAuthority({
    beat: miloSemanticBeat,
    envelope: miloEnvelope,
  });

const miloParadeCandidate = scoreMouthCandidate({
  text: "Walks. Bacon. Small dogs.",
  beat: miloSemanticBeat,
  envelope: miloEnvelope,
});
const miloTransformedCandidate = scoreMouthCandidate({
  text: "Priorities. Specific ones.",
  beat: miloSemanticBeat,
  envelope: miloEnvelope,
});
const miloInventedCandidate = scoreMouthCandidate({
  text: "Milo winked.",
  beat: miloSemanticBeat,
  envelope: miloEnvelope,
});

assert(
  miloParadeCandidate.reasons.includes("fact-parade-like"),
  `Multi-evidence enumeration was not recognized as a fact parade: ${JSON.stringify(miloParadeCandidate)}`,
);
assert(
  isAuthorizedMouthCandidate(miloTransformedCandidate) &&
    miloTransformedCandidate.score > miloParadeCandidate.score,
  `Semantic transformation did not outrank fact parade wording: ${JSON.stringify({
    parade: miloParadeCandidate,
    transformed: miloTransformedCandidate,
  })}`,
);
assert(
  !isAuthorizedMouthCandidate(miloInventedCandidate),
  `Semantic compression widened concrete reality authority: ${JSON.stringify(miloInventedCandidate)}`,
);

const parsedWholeSequences = parseMouthCandidateBatch(
  JSON.stringify({
    sequenceVariants: [
      { texts: ["A1", "A2", "A3"] },
      { texts: ["B1", "B2", "B3"] },
      { texts: ["C1", "C2", "C3"] },
    ],
  }),
  3,
);

assert(parsedWholeSequences, "Whole-sequence Mouth output failed to parse.");
assert(
  parsedWholeSequences.variantsByBeat.length === 3,
  `Whole-sequence variants were not transposed into 3 beat pools: ${JSON.stringify(parsedWholeSequences)}`,
);
assert(
  JSON.stringify(parsedWholeSequences.variantsByBeat.map((item) => item.variants)) ===
    JSON.stringify([
      ["A1", "B1", "C1"],
      ["A2", "B2", "C2"],
      ["A3", "B3", "C3"],
    ]),
  `Whole-sequence variants did not preserve cross-variant beat candidates: ${JSON.stringify(parsedWholeSequences.variantsByBeat)}`,
);

cases.push({
  name: "whole-sequence generation transposes into independent beat pools",
  expected: "allowed",
  actual:
    parsedWholeSequences.variantsByBeat[1]?.variants.includes("B2") &&
    parsedWholeSequences.variantsByBeat[1]?.variants.includes("C2")
      ? "allowed"
      : "rejected",
  text: JSON.stringify(parsedWholeSequences.variantsByBeat),
  reasons: [],
  authorization: undefined,
});


const serviceGraph = buildAuthorRealityGraph({
  prompt: "Maria cleaned the kitchen and bathroom. Done.",
  subject: "Maria",
  facts: [
    "Maria cleaned the bedroom last week",
  ],
  sourceMoments: [
    "Maria cleaned the kitchen",
    "Maria cleaned the bathroom",
    "Service done",
  ],
  memoryContext: [],
  trajectory: [],
});

const serviceEnvelope = buildAuthorRealityEnvelope({
  graph: serviceGraph,
  subject: "Maria",
});

const serviceBeat: MouthCandidateBeat = {
  order: 1,
  role: "payoff",
  attentionFunction:
    "Realize the supplied service completion without inventing relationships.",
  eventIds: serviceGraph.events.map((event) => event.id),
  change: "service work completed",
  next: "",
  frontier: "",
  relationKinds: [],
};

serviceBeat.realizationAuthority =
  buildMouthRealizationAuthority({
    beat: serviceBeat,
    envelope: serviceEnvelope,
  });

const inventedHomeowner = scoreMouthCandidate({
  text: "The homeowner's kitchen surrendered.",
  beat: serviceBeat,
  envelope: serviceEnvelope,
});

const literalServiceRecovery =
  buildLiteralRecoveryCandidate({
    beat: serviceBeat,
    envelope: serviceEnvelope,
  });

assert(
  literalServiceRecovery,
  "Literal recovery did not produce a source-grounded candidate.",
);
assert(
  isAuthorizedMouthCandidate(literalServiceRecovery) &&
    literalServiceRecovery.authorization.directGrounded === true &&
    literalServiceRecovery.inventionRisk === 0 &&
    literalServiceRecovery.forbiddenMoveRisk === 0,
  `Literal recovery failed the truth-safe floor: ${JSON.stringify(literalServiceRecovery)}`,
);

const literalRecoveryReplay =
  evaluateAuthorSourceReplay(
    {
      candidates: [literalServiceRecovery],
      texts: [literalServiceRecovery.text],
      score: literalServiceRecovery.score,
    },
    serviceEnvelope,
  );

assert(
  literalRecoveryReplay.truthSafe === true &&
    literalRecoveryReplay.authored === false,
  `Literal recovery was not separated from authorship: ${JSON.stringify(literalRecoveryReplay)}`,
);

cases.push({
  name: "literal model-failure recovery remains truth-safe but not authored",
  expected: "allowed",
  actual:
    literalRecoveryReplay.truthSafe &&
    !literalRecoveryReplay.authored
      ? "allowed"
      : "rejected",
  text: literalServiceRecovery.text,
  reasons: literalServiceRecovery.reasons,
  authorization: literalServiceRecovery.authorization,
});


cases.push({
  name: "business context cannot invent homeowner relationship",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(inventedHomeowner)
    ? "allowed"
    : "rejected",
  text: inventedHomeowner.text,
  reasons: inventedHomeowner.reasons,
  authorization: inventedHomeowner.authorization,
});

const inventedClient = scoreMouthCandidate({
  text: "The client approved.",
  beat: serviceBeat,
  envelope: serviceEnvelope,
});

cases.push({
  name: "business context cannot invent client relationship",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(inventedClient)
    ? "allowed"
    : "rejected",
  text: inventedClient.text,
  reasons: inventedClient.reasons,
  authorization: inventedClient.authorization,
});

const suppliedRoleGraph = buildAuthorRealityGraph({
  prompt: "Record the supplied service result.",
  subject: "Maria",
  facts: [],
  sourceMoments: [
    "Maria cleaned the kitchen",
    "Client approved the service",
  ],
  memoryContext: [],
  trajectory: [],
});

const suppliedRoleEnvelope = buildAuthorRealityEnvelope({
  graph: suppliedRoleGraph,
  subject: "Maria",
});

const suppliedRoleBeat: MouthCandidateBeat = {
  order: 1,
  role: "payoff",
  attentionFunction:
    "Realize only the supplied service result and supplied relationship roles.",
  eventIds: suppliedRoleGraph.events.map((event) => event.id),
  change: "supplied service result",
  next: "",
  frontier: "",
  relationKinds: [],
};

suppliedRoleBeat.realizationAuthority =
  buildMouthRealizationAuthority({
    beat: suppliedRoleBeat,
    envelope: suppliedRoleEnvelope,
  });

const suppliedClient = scoreMouthCandidate({
  text: "Client approved the service.",
  beat: suppliedRoleBeat,
  envelope: suppliedRoleEnvelope,
});

cases.push({
  name: "supplied business relationship role remains available",
  expected: "allowed",
  actual: isAuthorizedMouthCandidate(suppliedClient)
    ? "allowed"
    : "rejected",
  text: suppliedClient.text,
  reasons: suppliedClient.reasons,
  authorization: suppliedClient.authorization,
});

const treatmentServiceBeat: MouthCandidateBeat = {
  ...serviceBeat,
  realizationAuthority:
    buildMouthRealizationAuthority({
      beat: serviceBeat,
      envelope: serviceEnvelope,
      treatment: {
        label: "battle",
        intensity: 0.84,
        framingBias: [
          "opposition",
          "territory",
          "clearance",
          "victory",
          "aftermath",
        ],
        realizationPreferences: [
          "status_inversion",
          "compression",
          "consequence",
        ],
        forbiddenRealityMoves: [
          "invented combat",
          "invented opponent",
          "invented weapon",
          "invented damage",
        ],
      },
    }),
};

const treatmentStatus = scoreMouthCandidate({
  text: "Kitchen: victory.",
  beat: treatmentServiceBeat,
  envelope: serviceEnvelope,
});

cases.push({
  name: "lens treatment may metaphorically frame supplied service reality",
  expected: "allowed",
  actual: isAuthorizedMouthCandidate(treatmentStatus)
    ? "allowed"
    : "rejected",
  text: treatmentStatus.text,
  reasons: treatmentStatus.reasons,
  authorization: treatmentStatus.authorization,
});

const treatmentInventedRole = scoreMouthCandidate({
  text: "Homeowner: victory.",
  beat: treatmentServiceBeat,
  envelope: serviceEnvelope,
});

const treatmentDefeated = scoreMouthCandidate({
  text: "Kitchen defeated.",
  beat: treatmentServiceBeat,
  envelope: serviceEnvelope,
});

const treatmentSurrendered = scoreMouthCandidate({
  text: "Bathroom surrendered.",
  beat: treatmentServiceBeat,
  envelope: serviceEnvelope,
});

const treatmentSmuggledActor = scoreMouthCandidate({
  text: "Kitchen attacked the homeowner.",
  beat: treatmentServiceBeat,
  envelope: serviceEnvelope,
});

cases.push({
  name: "lens treatment may use a nonliteral predicate over a supplied target",
  expected: "allowed",
  actual: isAuthorizedMouthCandidate(treatmentDefeated)
    ? "allowed"
    : "rejected",
  text: treatmentDefeated.text,
  reasons: treatmentDefeated.reasons,
  authorization: treatmentDefeated.authorization,
});

cases.push({
  name: "lens treatment may personify another supplied target without creating a new fact",
  expected: "allowed",
  actual: isAuthorizedMouthCandidate(treatmentSurrendered)
    ? "allowed"
    : "rejected",
  text: treatmentSurrendered.text,
  reasons: treatmentSurrendered.reasons,
  authorization: treatmentSurrendered.authorization,
});

cases.push({
  name: "fantasy treatment cannot smuggle in an unsupplied participant",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(treatmentSmuggledActor)
    ? "allowed"
    : "rejected",
  text: treatmentSmuggledActor.text,
  reasons: treatmentSmuggledActor.reasons,
  authorization: treatmentSmuggledActor.authorization,
});


const serviceSequenceGraph = buildAuthorRealityGraph({
  prompt: "Realize only the supplied service sequence.",
  subject: "Maria",
  facts: [],
  sourceMoments: [
    "9:04 AM Maria started the housekeeping service",
    "Maria cleaned the kitchen",
    "Maria cleaned the bathroom",
    "Maria cleaned the living room",
    "11:47 AM Maria finished the housekeeping service",
  ],
  memoryContext: [],
  trajectory: [],
});

const serviceSequenceIds =
  serviceSequenceGraph.events.map((event) => event.id);

const serviceSequenceMovie: LatentMovieCandidate = {
  id: "service-sequence-semantic-acceptance",
  lens: "NONE",
  anchorEventIds: serviceSequenceIds,
  supportingRelationKinds: [],
  trajectory: serviceSequenceIds.map((eventId, index) => ({
    order: index + 1,
    operation:
      index === 0
        ? "establish"
        : index === serviceSequenceIds.length - 1
          ? "payoff"
          : "reveal",
    eventIds: [eventId],
    viewerChange:
      serviceSequenceGraph.events[index]?.label ?? "",
    nextQuestion: "",
  })),
  payoff:
    serviceSequenceGraph.events[
      serviceSequenceGraph.events.length - 1
    ]?.label ?? "",
  unresolvedQuestion: "",
  evidence:
    serviceSequenceGraph.events.map((event) => event.label),
  hypothesis: [
    "The supplied work sequence should be interpreted from its actual events.",
  ],
  truthRisk: 0,
  novelty: 0.5,
  specificity: 0.8,
  informationValue: 0.8,
  uncertainty: 0.4,
  attentionPotential: 0.7,
  consequencePotential: 0.5,
  callbackPotential: 0,
  compressionPotential: 0.8,
  repetitionRisk: 0,
  distinctiveness: 0.7,
  score: 0.75,
};

const serviceSequenceThesis =
  deriveLatentStoryThesis(
    serviceSequenceGraph,
    serviceSequenceMovie,
  );

const serviceSequenceSemantic =
  serviceSequenceThesis.semanticRealization;

assert(
  serviceSequenceSemantic,
  "Service sequence produced no semantic realization.",
);

assert(
  serviceSequenceSemantic.mechanism !== "recurrence",
  `Shared service vocabulary was incorrectly promoted into recurrence: ${JSON.stringify(serviceSequenceSemantic)}`,
);

assert(
  serviceSequenceSemantic.evidenceEventIds.length >= 3 &&
    serviceSequenceSemantic.evidenceEventIds.some(
      (id) =>
        id !== serviceSequenceIds[0] &&
        id !== serviceSequenceIds[serviceSequenceIds.length - 1],
    ),
  `Semantic selection dropped legitimate middle service evidence: ${JSON.stringify(serviceSequenceSemantic)}`,
);

cases.push({
  name: "shared service noun is not recurrence and middle work remains semantic evidence",
  expected: "allowed",
  actual:
    serviceSequenceSemantic.mechanism !== "recurrence" &&
    serviceSequenceSemantic.evidenceEventIds.length >= 3
      ? "allowed"
      : "rejected",
  text: JSON.stringify(serviceSequenceSemantic),
  reasons: [],
  authorization: undefined,
});


cases.push({
  name: "lens treatment cannot create an unsupplied service relationship",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(treatmentInventedRole)
    ? "allowed"
    : "rejected",
  text: treatmentInventedRole.text,
  reasons: treatmentInventedRole.reasons,
  authorization: treatmentInventedRole.authorization,
});


function scopedRealityBeat(input: {
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>;
  eventIds: string[];
  change: string;
}): MouthCandidateBeat {
  const candidateBeat: MouthCandidateBeat = {
    order: 1,
    role: "payoff",
    attentionFunction:
      "Realize only explicitly supplied reality. Context is not participant authority.",
    eventIds: input.eventIds,
    change: input.change,
    next: "",
    frontier: "",
    relationKinds: [],
  };

  candidateBeat.realizationAuthority =
    buildMouthRealizationAuthority({
      beat: candidateBeat,
      envelope: input.envelope,
    });

  return candidateBeat;
}

const groomerContextGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE experience from supplied reality.",
  subject: "Coco",
  facts: [],
  sourceMoments: [
    "Coco went to the groomer",
  ],
  memoryContext: [],
  trajectory: [],
});
const groomerContextEnvelope =
  buildAuthorRealityEnvelope({
    graph: groomerContextGraph,
    subject: "Coco",
  });
const groomerContextBeat = scopedRealityBeat({
  envelope: groomerContextEnvelope,
  eventIds: groomerContextGraph.events.map((event) => event.id),
  change: "Coco went to the groomer",
});
const groomerPromotedToActor = scoreMouthCandidate({
  text: "The groomer smiled.",
  beat: groomerContextBeat,
  envelope: groomerContextEnvelope,
});
cases.push({
  name: "context noun cannot become an actor",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(groomerPromotedToActor)
    ? "allowed"
    : "rejected",
  text: groomerPromotedToActor.text,
  reasons: groomerPromotedToActor.reasons,
  authorization: groomerPromotedToActor.authorization,
});

const explicitGroomerGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE experience from supplied reality.",
  subject: "Coco",
  facts: [],
  sourceMoments: [
    "The groomer smiled at Coco",
  ],
  memoryContext: [],
  trajectory: [],
});
const explicitGroomerEnvelope =
  buildAuthorRealityEnvelope({
    graph: explicitGroomerGraph,
    subject: "Coco",
  });
const explicitGroomerBeat = scopedRealityBeat({
  envelope: explicitGroomerEnvelope,
  eventIds: explicitGroomerGraph.events.map((event) => event.id),
  change: "The groomer smiled at Coco",
});
const suppliedGroomerActor = scoreMouthCandidate({
  text: "The groomer smiled.",
  beat: explicitGroomerBeat,
  envelope: explicitGroomerEnvelope,
});
cases.push({
  name: "explicitly supplied secondary actor remains available",
  expected: "allowed",
  actual: isAuthorizedMouthCandidate(suppliedGroomerActor)
    ? "allowed"
    : "rejected",
  text: suppliedGroomerActor.text,
  reasons: suppliedGroomerActor.reasons,
  authorization: suppliedGroomerActor.authorization,
});

const raveGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE experience from supplied reality.",
  subject: "Raven",
  facts: [],
  sourceMoments: [
    "Raven arrived at Neon District",
  ],
  memoryContext: [],
  trajectory: [],
});
const raveEnvelope = buildAuthorRealityEnvelope({
  graph: raveGraph,
  subject: "Raven",
});
const raveBeat = scopedRealityBeat({
  envelope: raveEnvelope,
  eventIds: raveGraph.events.map((event) => event.id),
  change: "Raven arrived at Neon District",
});
const inventedCrowd = scoreMouthCandidate({
  text: "The crowd cheered.",
  beat: raveBeat,
  envelope: raveEnvelope,
});
cases.push({
  name: "venue context cannot invent a crowd",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(inventedCrowd)
    ? "allowed"
    : "rejected",
  text: inventedCrowd.text,
  reasons: inventedCrowd.reasons,
  authorization: inventedCrowd.authorization,
});

const livingMemoryGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE living memory.",
  subject: "Our relationship",
  facts: [],
  sourceMoments: [
    "We met at The Underground",
  ],
  memoryContext: [],
  trajectory: [],
});
const livingMemoryEnvelope =
  buildAuthorRealityEnvelope({
    graph: livingMemoryGraph,
    subject: "Our relationship",
  });
const livingMemoryBeat = scopedRealityBeat({
  envelope: livingMemoryEnvelope,
  eventIds: livingMemoryGraph.events.map((event) => event.id),
  change: "We met at The Underground",
});
const inventedBartender = scoreMouthCandidate({
  text: "The bartender watched.",
  beat: livingMemoryBeat,
  envelope: livingMemoryEnvelope,
});
cases.push({
  name: "living-memory venue cannot invent another person",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(inventedBartender)
    ? "allowed"
    : "rejected",
  text: inventedBartender.text,
  reasons: inventedBartender.reasons,
  authorization: inventedBartender.authorization,
});


const arbitraryGroomerActor = scoreMouthCandidate({
  text: "The stylist celebrated.",
  beat: groomerContextBeat,
  envelope: groomerContextEnvelope,
});
cases.push({
  name: "arbitrary unsupplied role cannot become an actor",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(arbitraryGroomerActor)
    ? "allowed"
    : "rejected",
  text: arbitraryGroomerActor.text,
  reasons: arbitraryGroomerActor.reasons,
  authorization: arbitraryGroomerActor.authorization,
});

const contextNounPromotedThroughObject = scoreMouthCandidate({
  text: "Coco made the groomer laugh.",
  beat: groomerContextBeat,
  envelope: groomerContextEnvelope,
});
cases.push({
  name: "context noun cannot become a participating person through another actor",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(contextNounPromotedThroughObject)
    ? "allowed"
    : "rejected",
  text: contextNounPromotedThroughObject.text,
  reasons: contextNounPromotedThroughObject.reasons,
  authorization: contextNounPromotedThroughObject.authorization,
});

const arbitraryVenueActor = scoreMouthCandidate({
  text: "The promoter waved.",
  beat: raveBeat,
  envelope: raveEnvelope,
});
cases.push({
  name: "arbitrary venue-associated person cannot be invented",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(arbitraryVenueActor)
    ? "allowed"
    : "rejected",
  text: arbitraryVenueActor.text,
  reasons: arbitraryVenueActor.reasons,
  authorization: arbitraryVenueActor.authorization,
});

const inventedRecipient = scoreMouthCandidate({
  text: "Sent to client.",
  beat: serviceBeat,
  envelope: serviceEnvelope,
});
cases.push({
  name: "service output cannot invent an unsupplied recipient",
  expected: "rejected",
  actual: isAuthorizedMouthCandidate(inventedRecipient)
    ? "allowed"
    : "rejected",
  text: inventedRecipient.text,
  reasons: inventedRecipient.reasons,
  authorization: inventedRecipient.authorization,
});

const operational = await authorBrainCanonical({
  prompt: "Maria cleaned the kitchen and bathroom. Done.",
  subject: "Maria",
  facts: [],
  sourceMoments: [
    "Maria cleaned the kitchen",
    "Maria cleaned the bathroom",
    "Service done",
  ],
  domainContext: {
    category: "business",
    businessType: "housekeeping",
    serviceType: "housekeeping",
    serviceName: "home cleaning",
    knownCapabilities: [
      "clean kitchens",
      "clean bathrooms",
    ],
  },
  playoutMode: "operational",
  lens: "battle",
  movieMode: false,
  memoryContext: [
    "prior service: bedroom cleaned",
    "prior service: garage cleaned",
  ],
  trajectory: [
    "prior service completed",
  ],
});

assert(
  operational.diagnostics.modelCalls === 0,
  `Operational receipt playout called the model: ${JSON.stringify(operational.diagnostics)}`,
);
assert(
  operational.diagnostics.truthSafe === true &&
    operational.diagnostics.renderable === true &&
    operational.diagnostics.qualityStatus === "ACCEPTED",
  `Operational receipt playout was not accepted as factual renderable output: ${JSON.stringify(operational.diagnostics)}`,
);
assert(
  operational.diagnostics.authored === false,
  "Operational receipt playout was incorrectly classified as creative authorship.",
);
assert(
  operational.scenes.every((scene) =>
    !/homeowner|tenant|landlord|occupant|guest|client|owner/i.test(scene.text),
  ),
  `Operational receipt invented an unsupplied relationship: ${JSON.stringify(operational.scenes)}`,
);
assert(
  operational.scenes.every((scene) =>
    !/bedroom|garage|last week|prior service/i.test(scene.text),
  ),
  `Operational receipt replayed remembered or prior-job reality as current: ${JSON.stringify(operational.scenes)}`,
);

cases.push({
  name: "operational playout is factual sequence data with zero model calls",
  expected: "allowed",
  actual:
    operational.diagnostics.modelCalls === 0 &&
    operational.diagnostics.truthSafe === true &&
    operational.diagnostics.renderable === true
      ? "allowed"
      : "rejected",
  text: JSON.stringify(operational.scenes.map((scene) => scene.text)),
  reasons: [],
  authorization: {
    playoutMode: "operational",
    modelCalls: operational.diagnostics.modelCalls,
    truthSafe: operational.diagnostics.truthSafe,
    authored: operational.diagnostics.authored,
  },
});


const profileSource = ["Milo loves walks, bacon, small dogs"];
const profileGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE experience from supplied reality.",
  subject: "Milo",
  facts: profileSource,
  sourceMoments: profileSource,
  memoryContext: [],
  trajectory: [],
});
const profileEnvelope = buildAuthorRealityEnvelope({
  graph: profileGraph,
  subject: "Milo",
});
const profileEventIds = profileGraph.events.map((event) => event.id);

assert(
  profileEventIds.length === 3,
  `Profile list recovery did not preserve three supplied preference facts: ${JSON.stringify(profileGraph.events)}`,
);

const profileMovie: LatentMovieCandidate = {
  id: "profile-convergence-acceptance",
  lens: "NONE",
  anchorEventIds: profileEventIds,
  supportingRelationKinds: ["convergence"],
  trajectory: profileEventIds.map((eventId, index) => ({
    order: index + 1,
    operation:
      index === 0
        ? "establish"
        : index === profileEventIds.length - 1
          ? "payoff"
          : "reveal",
    eventIds: [eventId],
    viewerChange: profileGraph.events[index]?.label ?? "",
    nextQuestion: "",
  })),
  payoff: "recognition",
  unresolvedQuestion: "",
  evidence: profileGraph.events.map((event) => event.label),
  hypothesis: ["Supplied preferences converge into one character reading."],
  storyThesis: {
    initialReading: "Several preferences are supplied.",
    semanticTurn: "The supplied preferences form one recognizable character impression.",
    semanticRealization: {
      mechanism: "convergence",
      evidenceEventIds: profileEventIds,
      beforeEventIds: [profileEventIds[0]!],
      afterEventIds: [profileEventIds[profileEventIds.length - 1]!],
      before: profileGraph.events[0]?.label,
      after: profileGraph.events[profileGraph.events.length - 1]?.label,
      subject: "Milo",
      realizationMove: "recognize",
      creativeOpportunity: "recognition",
      feltEffect:
        "The viewer recognizes character from the supplied preferences without receiving a personality summary.",
      viewerShift:
        "Separate supplied preferences become one recognizable character impression.",
      languageAim:
        "Use implication and compression; do not enumerate the source facts or invent behavior.",
      confidence: 0.9,
    },
    beforeMeaning: ["separate preferences"],
    afterMeaning: ["one character impression"],
    beforeEventIds: [profileEventIds[0]!],
    afterEventIds: [profileEventIds[profileEventIds.length - 1]!],
    relationKind: "convergence",
    carrierEventIds: profileEventIds,
    sealingEventIds: [profileEventIds[profileEventIds.length - 1]!],
    payoffDependency: "The final supplied preference changes how the preference set is read.",
    counterfactualDependency: 0.8,
  },
  truthRisk: 0,
  novelty: 0.7,
  specificity: 0.8,
  informationValue: 0.8,
  uncertainty: 0.5,
  attentionPotential: 0.8,
  consequencePotential: 0.4,
  callbackPotential: 0.4,
  compressionPotential: 0.9,
  repetitionRisk: 0.1,
  distinctiveness: 0.8,
  score: 0.82,
};

const profileComposed = composeTrajectoryBeats(
  profileMovie,
  profileEnvelope,
);
const profileBeats = profileComposed.map((item, index, all) => ({
  ...item,
  viewerState: deriveViewerStateCut(item, index, all, profileEnvelope),
}));

assert(
  profileBeats.length < profileEventIds.length && profileBeats.length >= 2,
  `Semantic convergence did not become an inference-shaped beat sequence: ${JSON.stringify(profileBeats)}`,
);
assert(
  new Set(profileBeats.flatMap((item) => item.eventIds ?? [])).size ===
    profileEventIds.length,
  `Semantic beat compression dropped supplied evidence provenance: ${JSON.stringify(profileBeats)}`,
);
assert(
  profileBeats.some((item) => (item.eventIds?.length ?? 0) > 1),
  `Semantic composition still serialized one source fact per cut: ${JSON.stringify(profileBeats)}`,
);

const profileFactParade = evaluateAuthorAuthorshipQuality({
  texts: [
    "Walks. Bacon. Small dogs.",
    "Then bacon.",
    "Small dogs complete it.",
  ],
  envelope: profileEnvelope,
  movie: profileMovie,
  subject: "Milo",
  beats: profileBeats,
});
assert(
  !profileFactParade.accepted,
  `Fact parade incorrectly passed authored quality: ${JSON.stringify(profileFactParade)}`,
);

const profileSubjectReplay = evaluateAuthorAuthorshipQuality({
  texts: [
    "Milo loves walks.",
    "Milo loves bacon.",
    "Milo loves small dogs.",
  ],
  envelope: profileEnvelope,
  movie: profileMovie,
  subject: "Milo",
  beats: profileBeats,
});
assert(
  !profileSubjectReplay.accepted,
  `Subject-prefix source listing incorrectly passed authored quality: ${JSON.stringify(profileSubjectReplay)}`,
);

cases.push({
  name: "semantic convergence follows viewer inference rather than fact count",
  expected: "allowed",
  actual:
    profileBeats.length < profileEventIds.length &&
    profileBeats.length >= 2
      ? "allowed"
      : "rejected",
  text: JSON.stringify(
    profileBeats.map((item) => ({
      order: item.order,
      eventIds: item.eventIds,
      change: item.change,
      viewerState: item.viewerState,
    })),
  ),
  reasons: [],
  authorization: undefined,
});

cases.push({
  name: "fact parade cannot qualify as authored",
  expected: "rejected",
  actual: profileFactParade.accepted ? "allowed" : "rejected",
  text: "Walks. Bacon. Small dogs. / Then bacon. / Small dogs complete it.",
  reasons: profileFactParade.reasons,
  authorization: undefined,
});

cases.push({
  name: "subject-prefix source listing cannot qualify as authored",
  expected: "rejected",
  actual: profileSubjectReplay.accepted ? "allowed" : "rejected",
  text: "Milo loves walks. / Milo loves bacon. / Milo loves small dogs.",
  reasons: profileSubjectReplay.reasons,
  authorization: undefined,
});

const mismatches = cases.filter((item) => item.expected !== item.actual);
const status = mismatches.length ? "FAIL" : "PASS";

console.log("AUTHOR CANONICAL BOUNDARY ACCEPTANCE");
console.log(
  JSON.stringify(
    {
      cases,
      mismatches,
      beamWinner: beam.candidates[0],
      sourceReplay: replayCheck,
      operationalPlayout: {
        scenes: operational.scenes,
        diagnostics: operational.diagnostics,
      },
      status,
    },
    null,
    2,
  ),
);

if (mismatches.length) {
  process.exitCode = 1;
}
