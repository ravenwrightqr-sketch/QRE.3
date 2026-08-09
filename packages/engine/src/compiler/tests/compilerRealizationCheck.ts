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
];

const FORBIDDEN_REALIZATION_PATTERNS = [
  /\bCompletely enters the frame\b/i,
  /\bmake .+ matter through\b/i,
  /\bthe experience puts? into focus\b/i,
  /\bthe subject now means more\b/i,
  /\bthe thing the experience\b/i,
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

  for (const text of texts) {
    for (const pattern of FORBIDDEN_REALIZATION_PATTERNS) {
      if (pattern.test(text)) {
        throw new Error(
          `Generic realization leaked into "${prompt}": ${text}`,
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

console.log("\nPASS: cognitive story realization remains subject-native");
