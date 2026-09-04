import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.ts";
import {
  rerankByViewerState,
  scoreViewerStateTrajectory,
} from "./src/services/authorViewerState.ts";

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

console.log("\n=== BEFORE VIEWER RERANK ===");

for (const candidate of candidates) {
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

  console.log(candidate.id, {
    baseScore: candidate.score,
    broadWorld,
    evidence: candidate.evidence,
  });
}

const reranked = rerankByViewerState(
  graph,
  candidates,
);

console.log("\n=== AFTER VIEWER RERANK ===");

for (const candidate of reranked) {
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

  const dynamics = scoreViewerStateTrajectory(
    graph,
    candidate,
  );

  console.log(candidate.id, {
    finalScore: candidate.score,
    baseScore: candidate.score,
    broadWorld,
    evidence: candidate.evidence,
    dynamics,
  });
}

const broad = candidates.find((candidate) => {
  const labels = candidate.trajectory.flatMap((step) =>
    step.eventIds.map(
      (id) =>
        graph.events.find((event) => event.id === id)?.label ?? id,
    ),
  );

  return (
    labels.includes("went for a walk") &&
    labels.includes("squirrels everywhere") &&
    labels.includes("trees")
  );
});

if (broad) {
  const dynamics = scoreViewerStateTrajectory(
    graph,
    broad,
  );

  console.log("\n=== BROAD WORLD DIAGNOSTIC ===");
  console.dir(
    {
      id: broad.id,
      baseScoreBeforeRerank: broad.score,
      viewerDynamics: dynamics,
      rerankedFormula:
        `final = baseScore * 0.57 + viewerDynamics.score * 0.43`,
      resultingScore:
        Math.round(
          (
            broad.score * 0.57 +
            dynamics.score * 0.43
          ) *
            1000,
        ) / 1000,
    },
    { depth: null },
  );
}
