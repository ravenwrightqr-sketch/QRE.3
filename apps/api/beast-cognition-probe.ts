import { buildAuthorCognitivePlan } from "./src/services/authorCognition.ts";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";

const facts = [
  "went for a walk",
  "squirrels everywhere",
  "trees",
  "rolled in mud",
  "mud bath",
  "mud bath was free",
  "felt good",
  "looked good",
];

const graph = buildAuthorRealityGraph({
  prompt: "Create a cinematic sequence film of this world.",
  subject: "our world",
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
});

const cognition = buildAuthorCognitivePlan({
  prompt: "Create a cinematic sequence film of this world.",
  subject: "our world",
  facts,
  sourceMoments: facts,
  realityGraph: graph,
  memoryContext: [],
  priorScenes: [],
  priorStrategies: [],
  round: 1,
  movieMode: true,
  lens: "NONE",
});

console.log("\n=== COGNITIVE PLAN MOVIE ===");

console.dir(
  {
    selectedMovie: cognition.selectedMovie,
    candidateCount:
      cognition.latentMovieCandidates?.length ?? 0,
    movieMode:
      cognition.movieMode,
    plan:
      cognition,
  },
  { depth: null },
);
