import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.ts";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.ts";

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

console.log("\n=== GRAPH EVENTS ===");

console.dir(
  graph.events.map((event, index) => ({
    index,
    id: event.id,
    label: event.label,
  })),
  { depth: null },
);

console.log("\n=== RELATIONS ===");

console.dir(
  graph.relations.map((relation) => ({
    from:
      graph.events.find(
        (event) => event.id === relation.from,
      )?.label ?? relation.from,
    to:
      graph.events.find(
        (event) => event.id === relation.to,
      )?.label ?? relation.to,
    kind: relation.kind,
    strength: relation.strength,
  })),
  { depth: null },
);

const cognition = buildAuthorCognitivePlan({
  prompt: "Create a cinematic sequence film of this world.",
  lens: "NONE",
  subject: "our world",
  facts,
  sourceMoments: facts,
  realityGraph: graph,
  memoryContext: [],
  priorScenes: [],
  priorStrategies: [],
  movieMode: true,
});

console.log("\n=== SELECTED MOVIE ===");

console.dir(
  cognition.selectedMovie
    ? {
        id: cognition.selectedMovie.id,
        score: cognition.selectedMovie.score,
        payoff: cognition.selectedMovie.payoff,
        trajectory:
          cognition.selectedMovie.trajectory.map(
            (step) => ({
              order: step.order,
              operation: step.operation,
              events: step.eventIds.map(
                (id) =>
                  graph.events.find(
                    (event) => event.id === id,
                  )?.label ?? id,
              ),
              viewerChange:
                step.viewerChange,
            }),
          ),
      }
    : null,
  { depth: null },
);
