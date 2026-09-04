import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.ts";

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

console.log("\n=== SEARCH OUTPUT BEFORE VIEWER RERANK ===");
console.log("count:", candidates.length);

for (const [index, candidate] of candidates.entries()) {
  const labels = candidate.trajectory.flatMap((step) =>
    step.eventIds.map(
      (id) =>
        graph.events.find((event) => event.id === id)?.label ?? id,
    ),
  );

  const broadWorld =
    labels.includes("went for a walk") &&
    labels.includes("squirrels everywhere") &&
    labels.includes("trees");

  console.log(`\n[${index}] ${candidate.id}`);
  console.dir(
    {
      score: candidate.score,
      payoff: candidate.payoff,
      broadWorld,
      evidence: candidate.evidence,
      trajectory: candidate.trajectory.map((step) => ({
        order: step.order,
        operation: step.operation,
        events: step.eventIds.map(
          (id) =>
            graph.events.find((event) => event.id === id)?.label ?? id,
        ),
      })),
    },
    { depth: null },
  );
}
