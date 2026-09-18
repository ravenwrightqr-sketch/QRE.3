import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { deriveAuthorActionMechanics } from "./src/services/authorActionMechanics.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import { rankLensOpportunities } from "./src/services/authorCharacterLensEngine.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const serviceReality = [
  "9:04 AM Maria started the housekeeping service",
  "Maria cleaned the kitchen",
  "Maria cleaned bathroom one",
  "Maria cleaned bathroom two",
  "11:47 AM Maria finished the housekeeping service",
];

const graph = buildAuthorRealityGraph({
  prompt: "Turn this supplied service reality into a QRE experience.",
  subject: "Maria",
  facts: [],
  sourceMoments: serviceReality,
  memoryContext: [],
  trajectory: [],
});

const mechanics = deriveAuthorActionMechanics(
  graph,
  "Maria",
);

assert(
  mechanics.some((item) => item.kind === "sequence"),
  "Ordered service reality did not produce a sequence mechanic.",
);

assert(
  mechanics.some((item) => item.kind === "completion"),
  "Bounded service reality did not produce a completion mechanic.",
);

const eventIds = new Set(graph.events.map((event) => event.id));
assert(
  mechanics.every((mechanic) =>
    mechanic.evidenceEventIds.every((id) => eventIds.has(id)),
  ),
  "Action mechanics cited evidence outside RealityGraph.",
);

const movieCandidates = searchUniversalMovieCandidates({
  graph,
  subject: "Maria",
  lens: "NONE",
  limit: 10,
  mechanics,
});

assert(
  movieCandidates.some((candidate) =>
    candidate.id.startsWith("movie-mechanic-"),
  ),
  "Universal movie search did not create mechanics-backed competitors.",
);

const envelope = buildAuthorRealityEnvelope({
  graph,
  subject: "Maria",
});

const lensRanking = rankLensOpportunities(
  envelope,
  mechanics,
);

assert(
  lensRanking.some((candidate) =>
    /grounded mechanics:/i.test(candidate.reason),
  ),
  "Auto-lens ranking did not use grounded mechanics.",
);

const profileGraph = buildAuthorRealityGraph({
  prompt: "Create a QRE experience from supplied profile reality.",
  subject: "Milo",
  facts: ["Milo loves walks, bacon, small dogs"],
  sourceMoments: ["Milo loves walks, bacon, small dogs"],
  memoryContext: [],
  trajectory: [],
});

const profileMechanics = deriveAuthorActionMechanics(
  profileGraph,
  "Milo",
);

assert(
  !profileMechanics.some(
    (item) =>
      item.kind === "sequence" ||
      item.kind === "accumulation" ||
      item.kind === "completion",
  ),
  "Static profile preferences were incorrectly promoted into action/run mechanics: " +
    JSON.stringify(profileMechanics),
);

const unknownGraph = buildAuthorRealityGraph({
  prompt: "Make this supplied reality worth experiencing.",
  subject: "Aster",
  facts: [],
  sourceMoments: [
    "Aster found the zenthra coil",
    "The zenthra coil was broken",
    "Aster fixed the zenthra coil",
  ],
  memoryContext: [],
  trajectory: [],
});

const unknownMechanics = deriveAuthorActionMechanics(
  unknownGraph,
  "Aster",
);

const unknownIds = new Set(
  unknownGraph.events.map((event) => event.id),
);

assert(
  unknownMechanics.length > 0,
  "Unknown nouns prevented structural mechanics discovery.",
);

assert(
  unknownMechanics.every((mechanic) =>
    mechanic.evidenceEventIds.every((id) => unknownIds.has(id)),
  ),
  "Unknown-noun mechanics escaped RealityGraph evidence closure.",
);

console.log("AUTHOR ACTION MECHANICS ACCEPTANCE");
console.log(
  JSON.stringify(
    {
      service: {
        events: graph.events,
        mechanics,
        movieCandidates: movieCandidates.map((candidate) => ({
          id: candidate.id,
          score: candidate.score,
          hypothesis: candidate.hypothesis,
          trajectory: candidate.trajectory,
        })),
        lensRanking,
      },
      profile: {
        events: profileGraph.events,
        eventStructure: profileGraph.eventStructure,
        mechanics: profileMechanics,
      },
      unknownObject: {
        events: unknownGraph.events,
        eventStructure: unknownGraph.eventStructure,
        mechanics: unknownMechanics,
      },
      status: "PASS",
    },
    null,
    2,
  ),
);
