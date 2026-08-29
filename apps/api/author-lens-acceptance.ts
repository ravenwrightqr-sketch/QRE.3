import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const subject = process.argv[2] || "Coco";
const facts = (process.argv[3] || "came in nervous|started running the place|the bows were approved|the mirror approved|left fabulous|peace is temporary")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);

const prompt = process.argv[4] || "Create a short QRE-style living memory / receipt film.";
const lenses = (process.argv.slice(5).length ? process.argv.slice(5) : ["comedy", "fierce", "horror", "romance"])
  .map((value) => value.trim())
  .filter(Boolean);

const results: Array<{
  lens: string;
  sequence: string[];
  score: number;
}> = [];

for (const lens of lenses) {
  const result = await authorBrainCanonical({
    prompt,
    subject,
    facts,
    sourceMoments: facts,
    memoryContext: [],
    creativeLearningContext: [],
    lens,
  });

  if (result.diagnostics.qualityStatus !== "ACCEPTED") {
    throw new Error(`LENS ACCEPTANCE FAILED: ${lens} returned ${result.diagnostics.qualityStatus}`);
  }

  if (!result.diagnostics.complete || !result.diagnostics.renderable) {
    throw new Error(`LENS ACCEPTANCE FAILED: ${lens} produced incomplete/non-renderable output`);
  }

  if (result.diagnostics.modelCalls !== 1) {
    throw new Error(`LENS ACCEPTANCE FAILED: ${lens} expected exactly 1 model realization request, got ${result.diagnostics.modelCalls}`);
  }

  if (result.sequence.cuts.some((cut) => cut.sourceIds.length === 0)) {
    throw new Error(`LENS ACCEPTANCE FAILED: ${lens} lost source provenance`);
  }

  results.push({
    lens,
    sequence: result.scenes.map((scene) => scene.text),
    score: result.diagnostics.selectedScore,
  });
}

console.log("=".repeat(72));
console.log("QRE AUTHOR LENS ACCEPTANCE · SAME REALITY / MULTIPLE CREATIVE FRAMES");
console.log("=".repeat(72));
console.log(`SUBJECT: ${subject}`);
console.log(`LENSES: ${lenses.join(", ")}`);

for (const result of results) {
  console.log(`\n--- ${result.lens.toUpperCase()} ---`);
  console.log(`SCORE: ${result.score}`);
  result.sequence.forEach((text, index) => {
    console.log(`[${index + 1}] ${text}`);
  });
}

const normalizedSequences = results.map((result) => result.sequence.join(" | ").toLowerCase());
const materiallyDistinct = new Set(normalizedSequences).size > 1;

if (lenses.length > 1 && !materiallyDistinct) {
  throw new Error("LENS ACCEPTANCE FAILED: supplied lenses did not materially change the realization sequence");
}

console.log("\nSTATUS: ACCEPTED");
console.log("LENS PATH: explicit lens -> Cognition -> movie search -> Mouth -> sequence Beam");
