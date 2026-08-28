import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const subject = process.argv[2] || "Coco";
const facts = (process.argv[3] || "came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);
const prompt = process.argv[4] || "Write a short QRE-style living memory.";

const result = await authorBrainCanonical({
  prompt,
  subject,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  creativeLearningContext: [],
});

const qualityStatus = String(result.diagnostics.qualityStatus ?? "UNKNOWN");
const renderable = Boolean(result.diagnostics.renderable);

console.log("=".repeat(72));
console.log("QRE AUTHOR ACCEPTANCE · CANONICAL BRAIN / ONE REALIZATION PATH");
console.log("=".repeat(72));
console.log(`MODEL: ${String(result.diagnostics.model ?? "unknown")}`);
console.log(`REALIZATION MODE: ${result.realizationMode}`);
console.log(`MODEL REQUESTS: ${String(result.diagnostics.modelCalls ?? 0)}`);
console.log(`CANDIDATES: ${String(result.diagnostics.candidateSequences ?? 0)}`);
console.log(`ACCEPTED: ${String(result.diagnostics.acceptedCandidates ?? 0)}`);
console.log(`STATUS: ${qualityStatus}`);
console.log(`RENDERABLE: ${renderable ? "YES" : "NO"}`);
console.log(`SCORE: ${String(result.diagnostics.selectedScore ?? 0)}`);

if (qualityStatus !== "ACCEPTED") {
  console.log("\n--- REJECTED ---");
  console.log(JSON.stringify(result.diagnostics.rejectedCandidates ?? [], null, 2));
} else {
  console.log("\n--- QRE SEQUENCE ---");
  result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${scene.text}`));
  console.log("--- END QRE SEQUENCE ---");
}
const expectedRequests =
  result.sequence.cuts.length > 0 ? 1 : 0;
if (result.diagnostics.modelCalls !== expectedRequests) {
  throw new Error(`AUTHOR INVARIANT FAILED: expected ${expectedRequests} model realization requests, got ${result.diagnostics.modelCalls}`);
}
if (!result.diagnostics.complete) {
  throw new Error("AUTHOR INVARIANT FAILED: no complete grounded authored sequence");
}
if (!result.sequence || result.scenes.length !== result.sequence.cuts.length) {
  throw new Error("AUTHOR INVARIANT FAILED: scene/sequence count mismatch");
}
if (result.sequence.cuts.some((cut) => cut.sourceIds.length === 0)) {
  throw new Error("AUTHOR INVARIANT FAILED: every cut must retain source provenance");
}
