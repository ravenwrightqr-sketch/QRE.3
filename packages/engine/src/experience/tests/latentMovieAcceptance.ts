import { compileStoryExperience } from "../universalStoryCompiler.js";

const cases = [
  "Coco, the Pomeranian's experience at the dog groomers memory.",
  "Make a wedding event memory for my wedding Jan 1 2025.",
  "Make a story of all the beaches my surfboard has traveled.",
  "Make a memory of my trips to all the raves I've gone to.",
  "Coco walked into the groomers scared, enjoyed the bath, stole a bow, and walked out happy.",
  "Maria arrived at 9:04 AM. Her location was recorded. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The homeowner comes home to a clean house.",
];

for (const prompt of cases) {
  const result = compileStoryExperience(prompt);
  const beats = result.story.beats.map((beat) => beat.text).filter(Boolean);

  console.log("\n============================================================");
  console.log(prompt);
  console.log("------------------------------------------------------------");
  for (const text of beats) console.log(text);

  if (!beats.length) {
    throw new Error(`LATENT MOVIE FAILURE: no customer-facing story for: ${prompt}`);
  }

  const generic = beats.filter((text) =>
    /\b(?:came in|by the end|left the story open|the subject|the experience|remembrance|connection|play)\b/i.test(text),
  );

  if (generic.length >= Math.min(3, beats.length)) {
    throw new Error(`LATENT MOVIE FAILURE: generic prose dominates: ${prompt}`);
  }
}

console.log("\nLATENT MOVIE ACCEPTANCE PASSED");
