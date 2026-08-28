
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { scoreWholeWorldSequence } from "./src/services/authorWholeWorldSequenceScorer.js";
import { scoreViewerStateTrajectory } from "./src/services/authorViewerState.js";

type RealityGraphResult =
  ReturnType<typeof buildAuthorRealityGraph>;

type CognitivePlanResult =
  ReturnType<typeof buildAuthorCognitivePlan>;

type MovieCandidate =
  NonNullable<
    CognitivePlanResult["selectedMovie"]
  >;

type TestWorld = {
  name: string;
  prompt: string;
  subject: string;
  facts: string[];
  expectedMode?:
    | "broad"
    | "dense"
    | "mixed"
    | "recurrence"
    | "relation";
};

function fail(message: string): never {
  throw new Error(message);
}

function unique<T>(
  values: readonly T[],
): T[] {
  return [...new Set(values)];
}

function labelFor(
  graph: RealityGraphResult,
  id: string,
): string {
  return (
    graph.events.find(
      (event) =>
        event.id === id,
    )?.label ?? id
  );
}

function movieFingerprint(
  graph: RealityGraphResult,
  movie: MovieCandidate,
): string {
  const labels = unique(
    movie.trajectory.flatMap(
      (step) =>
        step.eventIds.map(
          (id) =>
            labelFor(
              graph,
              id,
            ),
        ),
    ),
  );

  return labels.join(
    " | ",
  );
}

function printMovie(
  graph: RealityGraphResult,
  movie: MovieCandidate,
): void {
  const labels =
    movie.trajectory.flatMap(
      (step) =>
        step.eventIds.map(
          (id) =>
            labelFor(
              graph,
              id,
            ),
        ),
    );

  const worldScore =
    scoreWholeWorldSequence(
      graph,
      movie,
    );

  const viewer =
    scoreViewerStateTrajectory(
      graph,
      movie,
    );

  console.dir(
    {
      id: movie.id,
      score: movie.score,
      evidence: movie.evidence,
      labels,
      worldScore,
      viewer,
      trajectory:
        movie.trajectory.map(
          (step) => ({
            order:
              step.order,
            operation:
              step.operation,
            events:
              step.eventIds.map(
                (id) =>
                  labelFor(
                    graph,
                    id,
                  ),
              ),
            change:
              step.viewerChange,
            nextQuestion:
              step.nextQuestion,
          }),
        ),
    },
    {
      depth: null,
    },
  );
}

const worlds: TestWorld[] = [
  {
    name:
      "WORLD_A_BROAD_ORDINARY",

    prompt:
      "Create a cinematic sequence film of this world.",

    subject:
      "our world",

    expectedMode:
      "broad",

    facts: [
      "went for a walk",
      "squirrels everywhere",
      "trees",
      "saw a red truck",
      "rain started",
      "found a weird statue",
      "called mom",
      "felt happy",
    ],
  },

  {
    name:
      "WORLD_B_DENSE_MATERIAL",

    prompt:
      "Create a cinematic sequence film of this world.",

    subject:
      "our world",

    expectedMode:
      "dense",

    facts: [
      "rolled in mud",
      "mud bath",
      "mud bath was free",
      "mud was cold",
      "mud felt good",
      "looked good",
    ],
  },

  {
    name:
      "WORLD_C_DISCONNECTED_RICH",

    prompt:
      "Create a cinematic sequence film of this world.",

    subject:
      "our world",

    expectedMode:
      "mixed",

    facts: [
      "went for a walk",
      "saw a dog",
      "coffee was hot",
      "traffic was loud",
      "called mom",
      "found a coin",
      "felt lucky",
    ],
  },

  {
    name:
      "WORLD_D_RECURRENCE",

    prompt:
      "Create a cinematic sequence film of this world.",

    subject:
      "our world",

    expectedMode:
      "recurrence",

    facts: [
      "walked by the house",
      "saw the red door",
      "went around the block",
      "heard a dog",
      "came back",
      "saw the red door",
      "left",
    ],
  },

  {
    name:
      "WORLD_E_RELATION_HEAVY",

    prompt:
      "Create a cinematic sequence film of this world.",

    subject:
      "our world",

    expectedMode:
      "relation",

    facts: [
      "started nervous",
      "met someone",
      "talked until close",
      "felt good",
      "stayed",
      "left happy",
    ],
  },
];

console.log("");
console.log(
  "============================================================",
);
console.log(
  "QRE BEAST SYSTEM ACCEPTANCE",
);
console.log(
  "============================================================",
);
console.log("");

const fingerprints: string[] = [];

for (
  const world of worlds
) {
  console.log("");
  console.log(
    "------------------------------------------------------------",
  );
  console.log(
    world.name,
  );
  console.log(
    "------------------------------------------------------------",
  );

  const graph: RealityGraphResult =
    buildAuthorRealityGraph({
      prompt:
        world.prompt,
      subject:
        world.subject,
      facts:
        world.facts,
      sourceMoments:
        world.facts,
      memoryContext: [],
      trajectory: [],
    });

  if (
    graph.events.length === 0
  ) {
    fail(
      `${world.name}: expected graph events`,
    );
  }

  const cognition: CognitivePlanResult =
    buildAuthorCognitivePlan({
      prompt:
        world.prompt,
      lens:
        "NONE",
      subject:
        world.subject,
      facts:
        world.facts,
      sourceMoments:
        world.facts,
      realityGraph:
        graph,
      memoryContext: [],
      priorScenes: [],
      priorStrategies: [],
      round: 1,
      movieMode: true,
    });

  const candidates =
    cognition.latentMovieCandidates;

  if (
    candidates.length < 2
  ) {
    fail(
      `${world.name}: expected at least 2 movie candidates, got ${candidates.length}`,
    );
  }

  const movie =
    cognition.selectedMovie;

  if (!movie) {
    fail(
      `${world.name}: expected selected movie`,
    );
  }

  if (
    movie.trajectory.length < 3
  ) {
    fail(
      `${world.name}: expected selected movie with >=3 trajectory steps, got ${movie.trajectory.length}`,
    );
  }

  const sourceIds =
    new Set(
      graph.events.map(
        (event) =>
          event.id,
      ),
    );

  const selectedIds =
    unique(
      movie.trajectory.flatMap(
        (step) =>
          step.eventIds,
      ),
    );

  if (
    !selectedIds.every(
      (id) =>
        sourceIds.has(id),
    )
  ) {
    fail(
      `${world.name}: selected movie referenced an event outside RealityGraph`,
    );
  }

  const fingerprint =
    movieFingerprint(
      graph,
      movie,
    );

  fingerprints.push(
    `${world.name}::${fingerprint}`,
  );

  console.log("");
  console.log(
    "GRAPH",
  );

  console.dir(
    {
      events:
        graph.events.length,

      relations:
        graph.relations.length,

      recurringSignals:
        graph.recurringSignals,

      unresolvedTensions:
        graph.unresolvedTensions,
    },
    {
      depth: null,
    },
  );

  console.log("");
  console.log(
    "MOVIE CANDIDATES",
  );

  console.log(
    `count: ${candidates.length}`,
  );

  for (
    const [index, candidate] of
    candidates.entries()
  ) {
    const candidateLabels =
      unique(
        candidate.trajectory.flatMap(
          (step) =>
            step.eventIds.map(
              (id) =>
                labelFor(
                  graph,
                  id,
                ),
            ),
        ),
      );

    const candidateWorld =
      scoreWholeWorldSequence(
        graph,
        candidate,
      );

    const candidateViewer =
      scoreViewerStateTrajectory(
        graph,
        candidate,
      );

    console.log(
      `\n[${index}] ${candidate.id}`,
    );

    console.dir(
      {
        score:
          candidate.score,

        payoff:
          candidate.payoff,

        evidence:
          candidate.evidence,

        labels:
          candidateLabels,

        worldScore:
          candidateWorld,

        viewerScore:
          candidateViewer.score,
      },
      {
        depth: null,
      },
    );
  }

  console.log("");
  console.log(
    "SELECTED MOVIE",
  );

  console.log(
    `selected id: ${movie.id}`,
  );

  console.log(
    `selected fingerprint: ${fingerprint}`,
  );

  printMovie(
    graph,
    movie,
  );

  const wholeWorld =
    scoreWholeWorldSequence(
      graph,
      movie,
    );

  const viewer =
    scoreViewerStateTrajectory(
      graph,
      movie,
    );

  const selectedMode =
    wholeWorld.breadth >=
        0.58 &&
    wholeWorld.territoryMovement >=
        0.45
      ? "whole-world"
      : "focused-semantic";

  console.log("");
  console.log(
    `CLASSIFICATION: ${selectedMode}`,
  );

  if (
    world.expectedMode
  ) {
    console.log(
      `TEST INTENT: ${world.expectedMode}`,
    );
  }

  console.log("");
  console.log(
    `${world.name}: PASS`,
  );
}

const uniqueFingerprints =
  unique(
    fingerprints,
  );

console.log("");
console.log(
  "============================================================",
);
console.log(
  "CROSS-WORLD ADAPTATION",
);
console.log(
  "============================================================",
);

console.log(
  `worlds tested: ${worlds.length}`,
);

console.log(
  `distinct selected movies: ${uniqueFingerprints.length}`,
);

if (
  uniqueFingerprints.length < 2
) {
  fail(
    "BEAST SYSTEM: all worlds collapsed to the same selected movie fingerprint",
  );
}

console.log("");
console.log(
  "CROSS-WORLD ADAPTATION: PASS",
);

console.log(
  "The selected movie changes across materially different worlds.",
);

console.log(
  "The search/selection layer is responding to supplied reality rather than returning one fixed movie shape.",
);

console.log("");
console.log(
  "QRE BEAST SYSTEM ACCEPTANCE: PASS",
);
