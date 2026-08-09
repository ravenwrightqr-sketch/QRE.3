import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const prompts = [
  "Create a memorial for my grandmother",
  "Make a QR experience for a nightclub",
  "Teach someone how to make sourdough",
  "Create a treasure hunt for kids",
  "A luxury watch brand wants something mysterious",
  "Create something completely weird involving aliens and a gas station",
  "Make my surfboard feel like it has traveled more than I have",
  "I run a tattoo shop but I don't want another boring loyalty program",
  "Create a dog groomer story for Max the poodle about the experience.",
  "Write a horror story about a house that should feel increasingly wrong.",
  "Create a living memory story about my dog that keeps growing over time.",
  "Document a housekeeper's work for the client, but make the result satisfying and human.",
];

const FORBIDDEN_REALIZATION_PATTERNS = [
  /\bcompletely enters the frame\b/i,
  /\bmake .+ matter through\b/i,
  /\bthe experience puts? into focus\b/i,
  /\bthe subject now means more\b/i,
  /\bthe thing the experience\b/i,
  /\bhas become more meaningful through the interaction\b/i,
  /\bturns observed detail into an evidence-aware experience\b/i,
];

const EXPECTED_REALIZATION_SIGNALS: Array<{
  prompt: string;
  signals: RegExp[];
}> = [
  {
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    signals: [
      /Max/i,
      /groomer|appointment|pampering/i,
      /celebrity|owns the place|luxurious|regular poodle/i,
    ],
  },
  {
    prompt: "Write a horror story about a house that should feel increasingly wrong.",
    signals: [
      /house/i,
      /wrong|ordinary|truth|notice|dark/i,
    ],
  },
  {
    prompt: "Create a living memory story about my dog that keeps growing over time.",
    signals: [
      /dog/i,
      /memory|history|story|life/i,
      /growing|chapter|future|another/i,
    ],
  },
  {
    prompt: "Document a housekeeper's work for the client, but make the result satisfying and human.",
    signals: [
      /house|housekeeper|clean|home/i,
      /personal|finished|details|satisfying/i,
    ],
  },
];

for (const prompt of prompts) {
  const result = compileCognitiveExperience(prompt);
  const direction = result.cognition.selectedHypothesis.kind;
  const texts = result.story.beats.map((beat) => beat.text);

  if (result.cognition.plan.direction !== direction) {
    throw new Error(
      `Cognitive direction drift for "${prompt}": ${result.cognition.plan.direction} !== ${direction}`,
    );
  }

  if (result.moments.length !== result.story.beats.length) {
    throw new Error(
      `Moment/beat count drift for "${prompt}": ${result.moments.length} !== ${result.story.beats.length}`,
    );
  }

  if (result.cinematicScenes.length !== result.story.beats.length) {
    throw new Error(
      `Moment/scene count drift for "${prompt}": ${result.moments.length} !== ${result.cinematicScenes.length}`,
    );
  }

  for (const text of texts) {
    for (const pattern of FORBIDDEN_REALIZATION_PATTERNS) {
      if (pattern.test(text)) {
        throw new Error(
          `Generic realization leaked into "${prompt}": ${text}`,
        );
      }
    }
  }

  const expected = EXPECTED_REALIZATION_SIGNALS.find(
    (item) => item.prompt === prompt,
  );

  if (expected) {
    const fullText = texts.join(" ");

    for (const signal of expected.signals) {
      if (!signal.test(fullText)) {
        throw new Error(
          `Subject-native realization signal ${signal} missing for "${prompt}": ${fullText}`,
        );
      }
    }
  }

  console.log("\n========================================");
  console.log(prompt);
  console.log("========================================");
  console.log("DIRECTION:", direction);
  console.log("BEATS:", result.story.beats.map((beat) => beat.kind));
  console.log("FLOW:", result.flowSteps.map((step) => step.type));
  console.log("MOMENTS:");

  for (const moment of result.moments) {
    console.log(
      "  -",
      "text" in moment ? moment.text : JSON.stringify(moment),
    );
  }
}

console.log("\nPASS: Super Cog story realization remains subject-native, genre-aware, and payoff-driven");
