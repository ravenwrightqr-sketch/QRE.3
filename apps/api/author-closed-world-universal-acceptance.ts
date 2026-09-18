import type {
  LatentSemanticRealization,
  MouthCandidateBeat,
} from "@qre/contracts";

import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildMouthRealizationAuthority } from "./src/services/authorMouthRealizationAuthority.js";
import {
  scoreMouthCandidate,
} from "./src/services/authorMouthCandidateSearchCanonical.js";
import {
  isAuthorizedMouthCandidate,
} from "./src/services/authorMouthSequenceBeamSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type Treatment = {
  label: string;
  intensity: number;
  framingBias: string[];
  realizationPreferences: string[];
  forbiddenRealityMoves: string[];
};

type World = ReturnType<typeof buildWorld>;

const recognition = (
  eventIds: string[],
  subject: string,
): LatentSemanticRealization => ({
  mechanism: eventIds.length > 1 ? "convergence" : "continuation",
  evidenceEventIds: eventIds,
  beforeEventIds: eventIds.slice(0, 1),
  afterEventIds: eventIds.slice(-1),
  subject,
  realizationMove: "recognize",
  creativeOpportunity: "recognition",
  feltEffect:
    "The viewer should recognize what the supplied evidence implies without QRE inventing a concrete occurrence.",
  viewerShift:
    "Supplied details become a stronger interpretation while concrete reality remains unchanged.",
  languageAim:
    "Use implication, status, metaphor, compression, juxtaposition, or recontextualization without adding concrete reality.",
  confidence: 0.9,
});

function buildWorld(input: {
  subject: string;
  sourceMoments: string[];
  facts?: string[];
  memoryContext?: string[];
  treatment: Treatment;
}) {
  const graph = buildAuthorRealityGraph({
    prompt:
      "Realize this supplied reality without inventing any participant, relationship, role, event, object, place, action, chronology, or sensory fact.",
    subject: input.subject,
    facts: input.facts ?? [],
    sourceMoments: input.sourceMoments,
    memoryContext: input.memoryContext ?? [],
    trajectory: [],
  });
  const envelope = buildAuthorRealityEnvelope({
    graph,
    subject: input.subject,
  });
  const eventIds = graph.events.map((event) => event.id);
  const semantic = recognition(eventIds, input.subject);
  const beat: MouthCandidateBeat = {
    order: 1,
    role: "payoff",
    attentionFunction:
      "Cause a grounded viewer inference from the supplied evidence. Do not explain or invent.",
    eventIds,
    change:
      "The supplied evidence acquires an interpretive frame without acquiring new concrete facts.",
    next: "",
    frontier: "",
    relationKinds: ["converges"],
    semanticRealization: semantic,
    observerExperience: {
      objective:
        "Let the viewer infer the frame from supplied reality.",
      surprise:
        "Ordinary supplied reality can support a different perception without becoming a different event.",
      curiosity:
        "What does this supplied evidence feel like under the selected treatment?",
      attention: ["specific evidence", "relationship", "recognition"],
      landing:
        "Recognition lands without explanation.",
      explanationForbidden: true,
      feltEffect:
        "The frame feels earned rather than fabricated.",
      viewerShift:
        "Information becomes interpretation.",
      realizationDirection:
        "Compress toward implication and status.",
    },
  };

  beat.realizationAuthority = buildMouthRealizationAuthority({
    beat,
    envelope,
    treatment: input.treatment,
  });

  return {
    graph,
    envelope,
    beat,
  };
}

function candidate(world: World, text: string) {
  return scoreMouthCandidate({
    text,
    beat: world.beat,
    envelope: world.envelope,
  });
}

function expectAllowed(world: World, text: string, label: string) {
  const scored = candidate(world, text);
  assert(
    isAuthorizedMouthCandidate(scored),
    `${label} should be allowed: ${JSON.stringify(scored)}`,
  );
  return scored;
}

function expectRejected(world: World, text: string, label: string) {
  const scored = candidate(world, text);
  assert(
    !isAuthorizedMouthCandidate(scored),
    `${label} should be rejected: ${JSON.stringify(scored)}`,
  );
  return scored;
}

const battle: Treatment = {
  label: "battle",
  intensity: 0.84,
  framingBias: [
    "opposition",
    "territory",
    "pressure",
    "clearance",
    "progression",
    "objective",
    "victory",
    "aftermath",
  ],
  realizationPreferences: [
    "status_inversion",
    "compression",
    "consequence",
    "reversal",
    "understatement",
  ],
  forbiddenRealityMoves: [
    "invented combat",
    "invented opponent",
    "invented weapon",
    "invented damage",
    "invented casualty",
  ],
};

const detective: Treatment = {
  label: "detective",
  intensity: 0.88,
  framingBias: [
    "clue",
    "pattern",
    "observation",
    "inference",
    "contradiction",
    "missing piece",
    "reveal",
    "recognition",
  ],
  realizationPreferences: [
    "implication",
    "recontextualization",
    "callback",
    "contrast",
    "reversal",
  ],
  forbiddenRealityMoves: [
    "invented detective",
    "invented clue",
    "invented investigation event",
  ],
};

const noir: Treatment = {
  label: "noir",
  intensity: 0.8,
  framingBias: [
    "suspicion",
    "implication",
    "evidence",
    "missing piece",
    "moral ambiguity",
    "watching",
    "quiet pressure",
    "return",
  ],
  realizationPreferences: [
    "implication",
    "understatement",
    "recontextualization",
    "callback",
    "double_meaning",
  ],
  forbiddenRealityMoves: [
    "invented detective",
    "invented crime",
    "invented weapon",
    "invented night scene",
  ],
};

const housekeeping = buildWorld({
  subject: "Maria",
  sourceMoments: [
    "Maria arrived",
    "Maria cleaned the kitchen",
    "Maria cleaned two bathrooms",
    "Maria finished the service",
  ],
  treatment: battle,
});

const serviceFrame = expectAllowed(
  housekeeping,
  "Kitchen. Objective.",
  "Supplied service object may carry battle framing",
);
const inventedHomeowner = expectRejected(
  housekeeping,
  "The homeowner approved.",
  "Unsupplied homeowner must not exist",
);
const inventedTenant = expectRejected(
  housekeeping,
  "The tenant watched.",
  "Unsupplied tenant must not exist",
);
const inventedClient = expectRejected(
  housekeeping,
  "The client loved it.",
  "Unsupplied client must not exist",
);

const groomer = buildWorld({
  subject: "Coco",
  sourceMoments: [
    "Coco went to the groomer",
    "Coco was groomed",
    "Coco had a red bow",
  ],
  treatment: detective,
});

const bowFrame = expectAllowed(
  groomer,
  "Red bow. Evidence.",
  "Supplied bow may carry detective framing",
);
const inventedGroomerActor = expectRejected(
  groomer,
  "The groomer laughed.",
  "A groomer destination/context must not become a person who acted",
);

const rave = buildWorld({
  subject: "Raven",
  sourceMoments: [
    "Raven checked in at Warehouse 9",
    "Raven left at 2 AM",
  ],
  treatment: noir,
});

const inventedDj = expectRejected(
  rave,
  "The DJ noticed.",
  "Unsupplied DJ must not exist",
);
const inventedCrowd = expectRejected(
  rave,
  "The crowd watched.",
  "Unsupplied crowd must not exist",
);

const relationship = buildWorld({
  subject: "Our relationship",
  sourceMoments: [
    "We met at The Underground",
    "We talked until closing",
    "We didn't expect it",
  ],
  treatment: noir,
});

const inventedBartender = expectRejected(
  relationship,
  "The bartender knew.",
  "Unsupplied bartender must not exist",
);
const inventedOtherPeople = expectRejected(
  relationship,
  "Everyone else noticed.",
  "Unsupplied other people must not exist",
);

const property = buildWorld({
  subject: "101 Elm",
  sourceMoments: [
    "101 Elm was built in 1928",
    "101 Elm was renovated in 2014",
  ],
  treatment: noir,
});

const inventedOwner = expectRejected(
  property,
  "The owner restored it.",
  "Unsupplied property owner must not exist",
);
const inventedOccupant = expectRejected(
  property,
  "The tenant moved in.",
  "Unsupplied property occupant must not exist",
);

const unknownObject = buildWorld({
  subject: "Aster",
  sourceMoments: [
    "Aster found the zenthra coil",
    "The zenthra coil was broken",
    "Aster fixed the zenthra coil",
  ],
  treatment: detective,
});

const unknownNounFrame = expectAllowed(
  unknownObject,
  "Zenthra coil. Evidence.",
  "Unknown supplied noun must remain usable",
);

const currentVisit = buildWorld({
  subject: "Milo",
  sourceMoments: [
    "Milo went to the park",
  ],
  memoryContext: [
    "Milo loves walks",
    "Milo likes small dogs",
  ],
  treatment: noir,
});

const inventedPast = expectRejected(
  currentVisit,
  "Milo went to the park previously.",
  "Remembered preference context must not invent prior occurrence chronology",
);

const recurrenceGraph = buildAuthorRealityGraph({
  prompt: "Realize supplied recurrence.",
  subject: "Milo",
  facts: [],
  sourceMoments: ["Milo returned again"],
  memoryContext: [],
  trajectory: [],
});
const recurrenceEnvelope = buildAuthorRealityEnvelope({
  graph: recurrenceGraph,
  subject: "Milo",
});
const recurrenceId = recurrenceGraph.events[0]?.id;
assert(recurrenceId, "Recurrence fixture produced no event.");
const recurrenceSemantic: LatentSemanticRealization = {
  mechanism: "recurrence",
  evidenceEventIds: [recurrenceId],
  beforeEventIds: [],
  afterEventIds: [recurrenceId],
  subject: "Milo",
  realizationMove: "recognize_callback",
  creativeOpportunity: "callback_recontextualization",
  feltEffect: "The return is recognized as recurrence.",
  viewerShift: "One occurrence becomes a supplied return.",
  languageAim: "Compress the supplied recurrence without inventing another visit.",
  confidence: 0.9,
};
const recurrenceBeat: MouthCandidateBeat = {
  order: 1,
  role: "payoff",
  attentionFunction: "Recognize supplied recurrence.",
  eventIds: [recurrenceId],
  change: "Supplied recurrence becomes visible.",
  next: "",
  frontier: "",
  relationKinds: ["repeats"],
  semanticRealization: recurrenceSemantic,
};
recurrenceBeat.realizationAuthority = buildMouthRealizationAuthority({
  beat: recurrenceBeat,
  envelope: recurrenceEnvelope,
  treatment: noir,
});
const recurrenceCandidate = scoreMouthCandidate({
  text: "Again.",
  beat: recurrenceBeat,
  envelope: recurrenceEnvelope,
});
assert(
  isAuthorizedMouthCandidate(recurrenceCandidate),
  `Supplied recurrence should authorize compressed recurrence framing: ${JSON.stringify(recurrenceCandidate)}`,
);

console.log(
  "AUTHOR CLOSED-WORLD UNIVERSAL ACCEPTANCE",
  JSON.stringify(
    {
      serviceFrame,
      inventedHomeowner,
      inventedTenant,
      inventedClient,
      bowFrame,
      inventedGroomerActor,
      inventedDj,
      inventedCrowd,
      inventedBartender,
      inventedOtherPeople,
      inventedOwner,
      inventedOccupant,
      unknownNounFrame,
      inventedPast,
      recurrenceCandidate,
      status: "PASS",
    },
    null,
    2,
  ),
);
