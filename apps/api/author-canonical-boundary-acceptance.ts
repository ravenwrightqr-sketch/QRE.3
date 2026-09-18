import type {
  LatentSemanticRealization,
  MouthCandidateBeat,
} from "@qre/contracts";

import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildMouthRealizationAuthority } from "./src/services/authorMouthRealizationAuthority.js";
import {
  parseMouthCandidateBatch,
  scoreMouthCandidate,
} from "./src/services/authorMouthCandidateSearchCanonical.js";
import {
  isAuthorizedMouthCandidate,
  selectBestMouthSequence,
} from "./src/services/authorMouthSequenceBeamSearch.js";
import {
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
      status,
    },
    null,
    2,
  ),
);

if (mismatches.length) {
  process.exitCode = 1;
}
