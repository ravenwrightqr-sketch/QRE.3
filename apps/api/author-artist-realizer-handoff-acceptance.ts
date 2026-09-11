import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const result = await authorBrainCanonical({
  prompt: "Create a short living QRE experience that makes Coco instantly recognizable.",
  subject: "Coco",
  facts: [
    "Coco is a poodle",
    "Coco loves bacon",
    "Coco likes squirrels",
    "Coco loves the park",
    "Coco walks",
    "Coco rolls in grass",
    "Coco likes apples",
  ],
  sourceMoments: [
    "Coco is a poodle",
    "Coco loves bacon",
    "Coco likes squirrels",
    "Coco loves the park",
    "Coco walks",
    "Coco rolls in grass",
    "Coco likes apples",
  ],
  memoryContext: [],
  trajectory: [],
  returning: false,
  visitNumber: 1,
  movieMode: true,
});

if (!result.scenes.length) {
  throw new Error(
    `Canonical Artist → Realizer acceptance failed: ${JSON.stringify(result.diagnostics.rejectedCandidates)}`,
  );
}

if (!result.diagnostics.renderable || !result.diagnostics.complete) {
  throw new Error("Canonical Artist → Realizer acceptance returned a non-renderable result.");
}

const finalText = result.scenes.map((scene) => scene.text).join("\n");
const forbiddenProductionLanguage = /\b(?:close[- ]?up|camera|zoom|pan|dolly|tracking shot|wide shot|medium shot|tight shot|montage|dissolve|smash cut|sound design|sound effect|sfx|voice[- ]over|voiceover|footage|screenplay)\b/i;
if (forbiddenProductionLanguage.test(finalText)) {
  throw new Error(`Final moving text leaked production language: ${finalText}`);
}

if (result.scenes.length < 2) {
  throw new Error("Final moving-text experience must contain at least two screens.");
}

if (!finalText.toLowerCase().includes("coco")) {
  throw new Error(`Final moving text lost the subject identity: ${finalText}`);
}

console.log("\n=== ARTIST → REALIZER HANDOFF ===");
console.log(`LENS: ${result.brief.angle}`);
console.log(`MODEL: ${result.diagnostics.model}`);
console.log(`MODEL CALLS: ${result.diagnostics.modelCalls}`);
console.log(`JUDGE SCORE: ${result.diagnostics.selectedScore}`);
console.log(`SCREENS: ${result.scenes.length}`);
console.log("\nFINAL MOVING TEXT:");
for (const [index, scene] of result.scenes.entries()) {
  console.log(`${String(index + 1).padStart(2, "0")}. ${scene.text}`);
}
console.log("\nCANONICAL ARTIST → REALIZER ACCEPTANCE: PASS");
