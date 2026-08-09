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

for (const prompt of prompts) {
  const result = compileCognitiveExperience(prompt);

  console.log("\n========================================");
  console.log(prompt);
  console.log("========================================");
  console.log("DIRECTION:", result.cognition.selectedHypothesis.kind);
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
