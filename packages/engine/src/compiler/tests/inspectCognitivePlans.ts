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

  console.log("\n\n========================================");
  console.log("PROMPT:", prompt);
  console.log("========================================");

  console.log("\nDIRECTION:");
  console.dir(result.cognition.selectedHypothesis, { depth: null });

  console.log("\nCOGNITIVE PLAN:");
  console.dir(result.cognition.plan, { depth: null });

  console.log("\nSTORY:");
  console.log(result.story.beats.map((beat) => ({
    kind: beat.kind,
    text: beat.text,
  })));
}
