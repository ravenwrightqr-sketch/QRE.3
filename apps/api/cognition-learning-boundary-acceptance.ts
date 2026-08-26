import {
  compileCognitiveExperience,
} from "@qre/engine";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const prompt =
  "Coco was groomed at Elm Street Grooming on Friday. Coco wore the red bow.";

const base = compileCognitiveExperience(
  prompt,
  {
    feedback: {
      accepted: [],
      rejected: [],
    },
  },
);

const learned = compileCognitiveExperience(
  prompt,
  {
    feedback: {
      accepted: [
        "Make it short and punchy with a callback.",
      ],
      rejected: [
        "Avoid explanatory repetition.",
      ],
    },
  },
);

assert(
  JSON.stringify(base.world.events) ===
    JSON.stringify(learned.world.events),
  "BEHAVIOR LEAK: learned feedback changed world events.",
);

assert(
  JSON.stringify(base.world.entities) ===
    JSON.stringify(learned.world.entities),
  "BEHAVIOR LEAK: learned feedback changed world entities.",
);

assert(
  JSON.stringify(base.world.places) ===
    JSON.stringify(learned.world.places),
  "BEHAVIOR LEAK: learned feedback changed world places.",
);

assert(
  JSON.stringify(base.world.times) ===
    JSON.stringify(learned.world.times),
  "BEHAVIOR LEAK: learned feedback changed world times.",
);

assert(
  JSON.stringify(base.world.evidence) ===
    JSON.stringify(learned.world.evidence),
  "BEHAVIOR LEAK: learned feedback changed factual evidence.",
);

const baseReality =
  base.moments.map((moment) => ({
    text: moment.text,
    payload: moment.payload,
  }));

const learnedReality =
  learned.moments.map((moment) => ({
    text: moment.text,
    payload: moment.payload,
  }));

assert(
  base.moments.length === learned.moments.length,
  "BEHAVIOR LEAK: learned feedback changed moment count.",
);

assert(
  base.world.memoryMatches.length ===
    learned.world.memoryMatches.length,
  "BEHAVIOR LEAK: learned feedback changed memory resolution.",
);

assert(
  learned.learningSignals.some(
    (signal) =>
      /short|callback|explanation|repetition/i.test(
        signal,
      ),
  ),
  "Behavioral learning signal did not survive compilation.",
);

assert(
  learned.state.creativeLearning.preferences.some(
    (value) =>
      /short|callback|explanation|repetition/i.test(
        value,
      ),
  ),
  "Behavioral preference was not persisted into cognitive state.",
);

assert(
  !learned.state.creativeLearning.accepted.some(
    (value) =>
      /coco|elm|bow|friday|groomed|red/i.test(
        value,
      ),
  ),
  "BEHAVIOR LEAK: factual world content entered accepted learning state.",
);

assert(
  !learned.state.creativeLearning.rejected.some(
    (value) =>
      /coco|elm|bow|friday|groomed|red/i.test(
        value,
      ),
  ),
  "BEHAVIOR LEAK: factual world content entered rejected learning state.",
);

assert(
  !learned.state.creativeLearning.usedPhrases.some(
    (value) =>
      /coco|elm|bow|friday|groomed|red/i.test(
        value,
      ),
  ),
  "BEHAVIOR LEAK: factual world content entered learned phrase state.",
);

console.log(
  "COGNITION LEARNING BOUNDARY ACCEPTANCE: PASS",
);

console.log(
  `WorldEvents=${learned.world.events.length}`,
);

console.log(
  `WorldEntities=${learned.world.entities.length}`,
);

console.log(
  `WorldPlaces=${learned.world.places.length}`,
);

console.log(
  `Moments=${learned.moments.length}`,
);

console.log(
  `LearningPreferences=${learned.state.creativeLearning.preferences.join(", ")}`,
);

console.log(
  `LearningAccepted=${learned.state.creativeLearning.accepted.join(", ")}`,
);

console.log(
  `LearningRejected=${learned.state.creativeLearning.rejected.join(", ")}`,
);

console.log(
  `BaseFirstMoment=${baseReality[0]?.text ?? ""}`,
);

console.log(
  `LearnedFirstMoment=${learnedReality[0]?.text ?? ""}`,
);