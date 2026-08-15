import { generateAiExperienceDraft } from "./src/services/aiProvider.js";

const draft = await generateAiExperienceDraft({
  prompt: "Coco came in nervous, got a bath, stole a blue bow, and left looking fabulous. Make it genuinely funny and memorable.",
  lens: "comedy",
  sourceMoments: [
    "Coco came in nervous.",
    "Coco got a bath.",
    "Coco stole a blue bow.",
    "Coco left looking fabulous."
  ],
  facts: [
    "Coco was nervous on arrival.",
    "Coco received a bath.",
    "Coco stole a blue bow.",
    "Coco left looking fabulous."
  ],
  memoryContext: [],
  audience: "customer-facing QRE experience"
});

console.log("\n===== QRE LOCAL AUTHOR =====\n");
console.log(draft);
console.log("\n============================\n");
