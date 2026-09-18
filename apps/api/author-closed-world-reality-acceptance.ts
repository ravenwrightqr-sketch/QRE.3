import type {
  LatentSemanticRealization,
  MemoryContext,
  MouthCandidate,
  MouthCandidateBeat,
} from "@qre/contracts";

import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { classifyLens } from "./src/services/authorCharacterLensEngine.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import { buildMouthRealizationAuthority } from "./src/services/authorMouthRealizationAuthority.js";
import { scoreMouthCandidate } from "./src/services/authorMouthCandidateSearchCanonical.js";
import { isAuthorizedMouthCandidate } from "./src/services/authorMouthSequenceBeamSearch.js";
import {
  authorExperienceMemoryContext,
  authorExperienceStateToMemoryBatch,
} from "./src/services/authorExperienceMemory.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type World = {
  subject: string;
  facts: string[];
  graph: ReturnType<typeof buildAuthorRealityGraph>;
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>;
  beat: MouthCandidateBeat;
};

type ClosedWorldReport = {
  name: string;
  expected: "allowed" | "rejected";
  actual: "allowed" | "rejected";
  text: string;
  reasons: string[];
  authorization: MouthCandidate["authorization"];
};

const reports: ClosedWorldReport[] = [];

function semantic(input: {
  subject: string;
  evidenceEventIds: string[];
  beforeEventIds?: string[];
  afterEventIds?: string[];
  before?: string;
  after: string;
  mechanism?: string;
  relationKind?: "changes" | "contrasts" | "recontextualizes" | "repeats" | "causes" | "converges" | "involves";
  realizationMove: string;
  creativeOpportunity: LatentSemanticRealization["creativeOpportunity"];
  feltEffect: string;
  viewerShift: string;
  languageAim: string;
}): LatentSemanticRealization {
  return {
    mechanism: input.mechanism ?? "recontextualization",
    evidenceEventIds: input.evidenceEventIds,
    beforeEventIds: input.beforeEventIds ?? input.evidenceEventIds.slice(0, 1),
    afterEventIds: input.afterEventIds ?? input.evidenceEventIds.slice(-1),
    before: input.before ?? "",
    after: input.after,
    subject: input.subject,
    relation:
      input.evidenceEventIds.length >= 2
        ? {
            kind: input.relationKind ?? "recontextualizes",
            fromEventId: input.evidenceEventIds[0]!,
            toEventId: input.evidenceEventIds[input.evidenceEventIds.length - 1]!,
          }
        : undefined,
    realizationMove: input.realizationMove,
    creativeOpportunity: input.creativeOpportunity,
    feltEffect: input.feltEffect,
    viewerShift: input.viewerShift,
    languageAim: input.languageAim,
    confidence: 0.9,
  };
}

function makeWorld(input: {
  subject: string;
  facts: string[];
  memoryContext?: string[];
  semanticRealization?: LatentSemanticRealization;
}): World {
  const graph = buildAuthorRealityGraph({
    prompt: "Write a QRE-style living memory.",
    subject: input.subject,
    facts: input.facts,
    sourceMoments: input.facts,
    memoryContext: input.memoryContext ?? [],
    trajectory: [],
  });

  const envelope = buildAuthorRealityEnvelope({
    graph,
    subject: input.subject,
  });

  const beat: MouthCandidateBeat = {
    order: 1,
    role: input.semanticRealization ? "payoff" : "reveal",
    attentionFunction:
      "Realize authorized meaning without inventing concrete reality.",
    eventIds: graph.events.map((event) => event.id),
    change: input.facts.join(" "),
    next: "",
    frontier: "",
    relationKinds: graph.relations.map((relation) => relation.kind),
    semanticRealization: input.semanticRealization,
    observerExperience: input.semanticRealization
      ? {
          objective: "Let the viewer feel the authorized meaning.",
          surprise: "The wording can change while the reality cannot.",
          curiosity: "Which interpretation did the evidence earn?",
          attention: ["meaning", "status", "relation"],
          landing: input.semanticRealization.after,
          explanationForbidden: true,
          feltEffect: input.semanticRealization.feltEffect,
          viewerShift: input.semanticRealization.viewerShift,
          realizationDirection: input.semanticRealization.languageAim,
        }
      : undefined,
  };

  beat.realizationAuthority = buildMouthRealizationAuthority({
    beat,
    envelope,
  });

  return {
    subject: input.subject,
    facts: input.facts,
    graph,
    envelope,
    beat,
  };
}

function classify(world: World, text: string): MouthCandidate {
  return scoreMouthCandidate({
    text,
    beat: world.beat,
    envelope: world.envelope,
  });
}

function record(input: {
  name: string;
  world: World;
  text: string;
  expected: "allowed" | "rejected";
  reason?: RegExp;
}) {
  const candidate = classify(input.world, input.text);
  const actual = isAuthorizedMouthCandidate(candidate) ? "allowed" : "rejected";
  const reasons = [
    ...candidate.reasons,
    ...candidate.authorization.reasons,
  ];

  reports.push({
    name: input.name,
    expected: input.expected,
    actual,
    text: input.text,
    reasons,
    authorization: candidate.authorization,
  });

  assert(
    actual === input.expected,
    `${input.name}: expected ${input.expected}, got ${actual}: ${JSON.stringify({
      text: input.text,
      reasons,
      authorization: candidate.authorization,
    })}`,
  );

  if (input.reason) {
    assert(
      reasons.some((reason) => input.reason!.test(reason)),
      `${input.name}: expected reason ${input.reason}, got ${JSON.stringify(reasons)}`,
    );
  }
}

function sortedJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(sortedJson).sort().join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${sortedJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

const concreteVeto = /concrete|authority|unsupplied|chronology/i;

record({
  name: "grooming does not imply a groomer actor",
  world: makeWorld({
    subject: "Coco",
    facts: ["Coco was groomed.", "Coco was clean."],
  }),
  text: "The groomer smiled.",
  expected: "rejected",
  reason: concreteVeto,
});

record({
  name: "cleaning a kitchen does not imply homeowner emotion",
  world: makeWorld({
    subject: "Maria",
    facts: ["Maria cleaned the kitchen."],
  }),
  text: "The homeowner was thrilled.",
  expected: "rejected",
  reason: concreteVeto,
});

record({
  name: "venue does not imply bartender witness",
  world: makeWorld({
    subject: "We",
    facts: ["We met at The Underground."],
  }),
  text: "The bartender watched us talk.",
  expected: "rejected",
  reason: concreteVeto,
});

const raveWorld = makeWorld({
  subject: "Raven",
  facts: ["Raven went to the rave."],
});

for (const text of [
  "The crowd cheered.",
  "Friends joined.",
  "The DJ noticed her.",
]) {
  record({
    name: `rave setting does not imply ${text}`,
    world: raveWorld,
    text,
    expected: "rejected",
    reason: concreteVeto,
  });
}

record({
  name: "renovated property does not imply owner agency",
  world: makeWorld({
    subject: "101 Elm",
    facts: ["101 Elm was renovated in 2014."],
  }),
  text: "The owner renovated the house.",
  expected: "rejected",
  reason: concreteVeto,
});

const housekeepingWorld = makeWorld({
  subject: "Property",
  facts: ["Kitchen cleaned.", "Bathroom cleaned."],
  semanticRealization: semantic({
    subject: "Property",
    evidenceEventIds: ["event-1", "event-2"],
    after: "the service reads as completion",
    realizationMove: "compress_to_completion_status",
    creativeOpportunity: "status_turn",
    feltEffect: "completion without inventing a person",
    viewerShift: "from tasks to completion",
    languageAim: "completion status",
  }),
});

for (const text of [
  "The tenant came home.",
  "The family returned.",
  "The Airbnb guest arrived.",
]) {
  record({
    name: `cleaned rooms do not imply ${text}`,
    world: housekeepingWorld,
    text,
    expected: "rejected",
    reason: concreteVeto,
  });
}

record({
  name: "personless service can still be authored",
  world: housekeepingWorld,
  text: "Complete.",
  expected: "allowed",
});

const zenthraWorld = makeWorld({
  subject: "Aster",
  facts: [
    "Aster found the zenthra coil.",
    "The zenthra coil was broken.",
    "Aster fixed the zenthra coil.",
  ],
});

record({
  name: "unknown supplied noun remains usable reality",
  world: zenthraWorld,
  text: "The zenthra coil was fixed.",
  expected: "allowed",
});

record({
  name: "unknown supplied noun does not authorize a machine",
  world: zenthraWorld,
  text: "The coil powered the machine.",
  expected: "rejected",
  reason: concreteVeto,
});

const bowWorld = makeWorld({
  subject: "Coco",
  facts: ["Coco had a red bow.", "Coco stole the red bow."],
  semanticRealization: semantic({
    subject: "Coco",
    evidenceEventIds: ["event-1", "event-2"],
    before: "red bow as possession",
    after: "red bow as claimed status",
    relationKind: "recontextualizes",
    realizationMove: "reframe_object_as_status",
    creativeOpportunity: "status_turn",
    feltEffect: "the red bow becomes official status",
    viewerShift: "from object to attitude",
    languageAim: "official status, not source replay",
  }),
});

record({
  name: "bounded red-bow status can be authored without source replay",
  world: bowWorld,
  text: "Official.",
  expected: "allowed",
});

assert(
  !bowWorld.facts.some((fact) => /^official\.?$/i.test(fact)),
  "Red-bow authorship case accidentally relies on supplied source replay.",
);

const heistAuthority = buildMouthRealizationAuthority({
  beat: raveWorld.beat,
  envelope: raveWorld.envelope,
  treatment: classifyLens("heist"),
});
const romanceAuthority = buildMouthRealizationAuthority({
  beat: raveWorld.beat,
  envelope: raveWorld.envelope,
  treatment: classifyLens("romance"),
});

assert(
  sortedJson(heistAuthority.reality) === sortedJson(romanceAuthority.reality),
  `Lens treatment changed concrete reality closure: ${JSON.stringify({
    heist: heistAuthority.reality,
    romance: romanceAuthority.reality,
  })}`,
);

const memoryWorld = makeWorld({
  subject: "Milo",
  facts: ["Milo went to the park."],
  memoryContext: ["Milo loves walks"],
});

const memoryPlan = buildAuthorCognitivePlan({
  prompt: "Write a QRE-style living memory.",
  subject: "Milo",
  lens: "NONE",
  facts: ["Milo went to the park."],
  sourceMoments: ["Milo went to the park."],
  memoryContext: ["Milo loves walks"],
  realityGraph: memoryWorld.graph,
});

assert(
  memoryPlan.permanentTruths.some((truth) => /Milo loves walks/i.test(truth)),
  "Persisted preference memory was not available as context.",
);

record({
  name: "preference memory does not invent prior park chronology",
  world: memoryWorld,
  text: "Milo went to the park previously.",
  expected: "rejected",
  reason: /chronology|concrete|authority/i,
});

const memoryMovies = searchUniversalMovieCandidates({
  graph: memoryWorld.graph,
  subject: "Milo",
  lens: "NONE",
  limit: 4,
});
assert(memoryMovies[0], "Memory isolation case produced no deterministic movie.");

const generatedState = buildAuthorExperienceState({
  graph: memoryWorld.graph,
  movie: memoryMovies[0]!,
  lens: "NONE",
  memoryContext: ["Milo loves walks"],
  priorScenes: ["Official."],
  round: 1,
});
const generatedBatch = authorExperienceStateToMemoryBatch({
  assetId: "asset-closed-world",
  state: generatedState,
  occurredAt: "2026-09-18T12:00:00.000Z",
});
const generatedContext: MemoryContext = {
  assetId: "asset-closed-world",
  generatedAt: "2026-09-18T12:00:00.000Z",
  entities: [],
  facts: [],
  relations: [],
  events: generatedBatch.events.map((event, index) => ({
    id: event.id ?? `generated-state-${index + 1}`,
    type: event.type,
    summary: index === 0 ? "Official." : event.summary,
    occurredAt: event.occurredAt,
    source: event.source,
    confidence: event.confidence,
    entityIds: event.entityIds,
    sessionId: event.sessionId,
    metadata: event.metadata,
  })),
};
const generatedMemory = authorExperienceMemoryContext(generatedContext);

assert(
  !generatedMemory.some((line) => /^official\.?$/i.test(line)),
  `Generated realized text leaked into factual memory context: ${JSON.stringify(generatedMemory)}`,
);

record({
  name: "generated realized text does not become concrete authority",
  world: makeWorld({
    subject: "Milo",
    facts: ["Milo went to the park."],
    memoryContext: generatedMemory,
  }),
  text: "Official.",
  expected: "rejected",
});

console.log("AUTHOR CLOSED WORLD REALITY ACCEPTANCE");
console.log(
  JSON.stringify(
    {
      cases: reports,
      lensRealityClosure: {
        heist: heistAuthority.reality,
        romance: romanceAuthority.reality,
      },
      generatedMemory,
    },
    null,
    2,
  ),
);
