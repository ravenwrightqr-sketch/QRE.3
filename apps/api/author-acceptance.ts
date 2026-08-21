import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const subject = process.argv[2] || "Coco";
const facts = (process.argv[3] || "came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);
const prompt = process.argv[4] || "Write a 5-line sequence about Coco. Final line: Peace was temporary.";

const result = await authorBrainUniversal({
  prompt,
  subject,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
});

const qualityStatus = String(result.diagnostics.qualityStatus ?? "UNKNOWN");
const renderable = Boolean(result.diagnostics.renderable);

console.log("=".repeat(72));
console.log("QRE AUTHOR ACCEPTANCE · ONE BRAIN / ONE MODEL CALL");
console.log("=".repeat(72));
console.log(`MODEL: ${String(result.diagnostics.model ?? "unknown")}`);
console.log(`MODEL CALLS: ${String(result.diagnostics.modelCalls ?? 0)}`);
console.log(`CANDIDATES: ${String(result.diagnostics.candidateSequences ?? 0)}`);
console.log(`ACCEPTED: ${String(result.diagnostics.acceptedCandidates ?? 0)}`);
console.log(`STATUS: ${qualityStatus}`);
console.log(`RENDERABLE: ${renderable ? "YES" : "NO"}`);
console.log(`SCORE: ${String(result.diagnostics.selectedScore ?? 0)}`);

if (qualityStatus !== "ACCEPTED") {
  console.log("\n--- REJECTED MODEL OUTPUT ---");
  console.log(JSON.stringify(result.diagnostics.rejectedCandidates ?? [], null, 2));
  console.log("--- NO MODEL PROSE RENDERED ---");
} else {
  console.log("\n--- OUTPUT ---");
  result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${scene.text}`));
  console.log("--- END OUTPUT ---");
}

if (result.diagnostics.modelCalls !== 1) {
  throw new Error("AUTHOR INVARIANT FAILED: expected exactly one model call");
}
if (!result.diagnostics.complete) {
  throw new Error("AUTHOR INVARIANT FAILED: no complete authored sequence");
}
if (!result.sequence || result.scenes.length !== result.sequence.cuts.length) {
  throw new Error("AUTHOR INVARIANT FAILED: scene/sequence count mismatch");
}
