import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildMouthCandidateMessages } from "./src/services/authorMouth.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`WORLD SIMULATION WIRING ACCEPTANCE FAILED: ${message}`);
  }
}

const subject = "Milo";

const facts = [
  "Milo is a small dog",
  "Milo wears a dog tag",
  "Milo loves bacon",
];

const sourceMoments = [
  "Here is Milo",
  "Do I smell bacon?",
  "The tag is still on him",
];

const graph = buildAuthorRealityGraph({
  prompt: "Milo dog tag bacon",
  subject,
  place: "",
  facts,
  sourceMoments,
  memoryContext: [],
  trajectory: [],
});

const cognition = buildAuthorCognitivePlan({
  prompt: "Milo dog tag bacon",
  subject,
  place: "",
  facts,
  sourceMoments,
  memoryContext: [],
  priorScenes: [],
  priorStrategies: [],
  round: 1,
  movieMode: true,
  lens: "game",
  realityGraph: graph,
});

assert(
  cognition.experienceState?.worldSimulation,
  "Cognition produced no World Simulation",
);

assert(
  cognition.selectedMovie,
  "Cognition produced no selected Movie",
);

assert(
  cognition.selectedMovie.storyThesis?.observerExperience?.simulation,
  "selected Movie lost World Simulation",
);

assert(
  cognition.selectedMovie.storyThesis.observerExperience.simulation ===
    cognition.experienceState.worldSimulation,
  "Cognition duplicated World Simulation instead of carrying one instance into experience state",
);

const trajectoryStep = cognition.selectedMovie.trajectory[0];

assert(
  trajectoryStep,
  "selected Movie has no trajectory step",
);

const observerExperience =
  cognition.selectedMovie.storyThesis.observerExperience;

const envelope = buildAuthorRealityEnvelope({
  graph,
  subject,
});

const messages = buildMouthCandidateMessages({
  envelope,
  lens: "game",
  worldSimulation:
    cognition.experienceState.worldSimulation,
  beats: [
    {
      order: 1,
      role: "establishing",
      eventIds: trajectoryStep.eventIds,
      change: trajectoryStep.viewerChange,
      next: trajectoryStep.nextQuestion,
      frontier: trajectoryStep.nextQuestion,
      semanticRealization:
        cognition.selectedMovie.storyThesis.semanticRealization,
      observerExperience,
    },
  ],
});

assert(
  messages.length === 2,
  "Mouth did not receive canonical system + user request",
);
const request = JSON.parse(String(messages[1]?.content ?? "{}")) as {
  worldSimulation?: unknown;
};

assert(
  request.worldSimulation,
  "World Simulation did not reach Mouth request",
);

assert(
  JSON.stringify(request.worldSimulation) ===
    JSON.stringify(cognition.experienceState.worldSimulation),
  "Mouth received World Simulation with different contents than Cognition/Experience State",
);
console.log("WORLD SIMULATION WIRING: PASS");
console.log(
  `worldRefs=${cognition.experienceState.worldSimulation.refs.length}`,
);
console.log(
  `worldRelations=${cognition.experienceState.worldSimulation.relations.length}`,
);
console.log(
  `worldQuestions=${cognition.experienceState.worldSimulation.questions.length}`,
);
console.log(
  `viewerHypotheses=${cognition.experienceState.worldSimulation.viewer.hypotheses.length}`,
);
console.log(
  `predictionErrors=${cognition.experienceState.worldSimulation.viewer.predictionErrors.length}`,
);
console.log("COGNITION_TO_MOVIE=TRUE");
console.log("MOVIE_TO_AUTHOR_STATE=TRUE");
console.log("COGNITION_TO_MOUTH=TRUE");