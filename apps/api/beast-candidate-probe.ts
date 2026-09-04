import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.ts";
import { rerankByViewerState } from "./src/services/authorViewerState.ts";
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

const candidates = searchUniversalMovieCandidates({
  graph,
  subject: "our world",
  limit: 12,
});

console.log("\n=== UNIVERSAL CANDIDATES ===");

const ranked = rerankByViewerState(
  graph,
  candidates,
);

console.dir(
  ranked.map((candidate) => ({
    id: candidate.id,
    score: candidate.score,
    baseScore: candidate.score,
    payoff: candidate.payoff,
    evidence: candidate.evidence,
    trajectory: candidate.trajectory.map((step) => ({
      order: step.order,
      operation: step.operation,
      events: step.eventIds.map(
        (id) =>
          graph.events.find(
            (event) => event.id === id,
          )?.label ?? id,
      ),
    })),
    viewer: candidate.viewerStateDynamics,
  })),
  { depth: null },
);
