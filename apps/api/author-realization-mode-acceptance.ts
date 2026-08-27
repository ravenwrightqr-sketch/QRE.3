import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { classifyAuthorRealizationMode } from "./src/services/authorRealizationMode.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`AUTHOR REALIZATION MODE FAILED: ${message}`);
}

function run(
  name: string,
  input: {
    prompt: string;
    facts: string[];
    sourceMoments?: string[];
    movieMode?: boolean;
  },
  expected: string,
): void {
  const sourceMoments = input.sourceMoments ?? input.facts;
  const graph = buildAuthorRealityGraph({
    prompt: input.prompt,
    subject: "Coco",
    facts: input.facts,
    sourceMoments,
    memoryContext: [],
    trajectory: [],
  });
  const mode = classifyAuthorRealizationMode({
    prompt: input.prompt,
    facts: input.facts,
    sourceMoments,
    relationKinds: graph.relations.map((relation) => relation.kind),
    movieMode: input.movieMode,
  });
  console.log(`${name}: ${mode}`);
  assert(mode === expected, `${name} expected=${expected} got=${mode}`);
}

run(
  "sparse_pet_collection",
  {
    prompt: "Make this a short QRE-style living memory.",
    facts: [
      "Coco is a poodle",
      "loves bacon",
      "likes squirrels",
      "loves the park",
      "walks",
      "rolls in grass",
      "likes apples",
    ],
  },
  "collection",
);

run(
  "state_only",
  {
    prompt: "Remember the current state.",
    facts: ["nervous", "happy after"],
  },
  "state",
);

run(
  "dense_service_episode",
  {
    prompt: "Make a QRE service sequence.",
    facts: [
      "10:10 entered location",
      "cleaned 2 bathrooms",
      "cleaned the kitchen",
      "finished",
      "booted round 2",
    ],
  },
  "sequence-film",
);

run(
  "coffee_episode",
  {
    prompt: "Make a short living memory.",
    facts: [
      "met at coffee shop",
      "Purge Coffee",
      "love at first sight",
      "talked til close",
      "kicked us out",
    ],
  },
  "sequence-film",
);

run(
  "explicit_creative_request",
  {
    prompt: "Make Coco's zombie squirrel park adventure.",
    facts: ["likes squirrels", "loves the park"],
  },
  "sequence-film",
);

run(
  "explicit_movie_switch",
  {
    prompt: "Keep it grounded.",
    facts: ["likes squirrels"],
    movieMode: true,
  },
  "sequence-film",
);

console.log("AUTHOR REALIZATION MODE ACCEPTANCE: PASS");
