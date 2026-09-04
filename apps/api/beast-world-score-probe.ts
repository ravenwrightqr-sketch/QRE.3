import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";
import { scoreWholeWorldSequence } from "./src/services/authorWholeWorldSequenceScorer.ts";
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
  limit: 30,
});

console.log("candidate count:", candidates.length);

for (const candidate of candidates) {
  const world = scoreWholeWorldSequence(
    graph,
    candidate,
  );

  console.log("\n", candidate.id);
  console.dir({
    score: candidate.score,
    evidence: candidate.evidence,
    world,
  }, { depth: null });
}
