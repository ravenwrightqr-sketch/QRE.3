import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";
import { polishAuthorScenes } from "./src/services/authorMouthMonster.js";

const raw = process.argv.slice(2).join(" ").trim();
const facts = raw.split(/[,\n.;•]+/).map((x) => x.trim()).filter(Boolean);
const input = {
  prompt: process.env.QRE_AUTHOR_PROMPT || "Make a living memory from this supplied reality.",
  subject: facts[0],
  facts,
  sourceMoments: facts,
  lens: process.env.QRE_AUTHOR_LENS || "funny, specific, affectionate, slightly fierce",
  memoryContext: [], trajectory: [], creativeLearningContext: [],
};

console.log("=".repeat(80));
console.log("QRE MONSTER AUTHOR ACCEPTANCE · EVIDENCE-FIRST MOUTH");
console.log("REALITY → MOVIE → COGNITION → MOMENTUM → MONSTER MOUTH → SENTENCE QUALITY");
console.log("=".repeat(80));

const result = await authorBrainUniversal(input);
if (!result.sequence) throw new Error("No usable sequence");

const monster = await polishAuthorScenes(input, result.sequence, "playful");
console.log("\n--- MONSTER MOUTH ---");
monster.texts.forEach((text, i) => console.log(`[${i + 1}] ${text}`));
console.log("--- END MONSTER MOUTH ---");
console.log(`BEATS: ${monster.scenes.length}`);
monster.scenes.forEach((scene, i) => console.log(`[${i + 1}] ${scene.text}`));
console.log(`REJECTED: ${monster.rejected}`);
console.log(`SEQUENCE BEATS: ${result.sequence.cuts.length}`);
