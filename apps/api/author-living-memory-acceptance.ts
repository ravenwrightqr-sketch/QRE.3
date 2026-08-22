import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const subject = "our relationship";
const facts = [
  "met at the local bar",
  "connected",
  "talked until close",
  "seen each other every day",
];
const prompt =
  "Create a 5-line living memory of how our relationship began. Preserve the supplied facts exactly. Let the emotional meaning emerge through the sequence. Do not invent people, names, places beyond what is supplied, objects, dialogue, private feelings, or literal events.";

const result = await authorBrainUniversal({
  prompt,
  subject,
  facts,
  sourceMoments: facts,
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
});

console.log("=".repeat(72));
console.log("QRE LIVING MEMORY ACCEPTANCE · ONE BRAIN / ONE MODEL CALL");
console.log("=".repeat(72));
console.log(`MODEL: ${String(result.diagnostics.model ?? "unknown")}`);
console.log(`MODEL CALLS: ${String(result.diagnostics.modelCalls ?? 0)}`);
console.log(`CANDIDATES: ${String(result.diagnostics.candidateSequences ?? 0)}`);
console.log(`ACCEPTED: ${String(result.diagnostics.acceptedCandidates ?? 0)}`);
console.log(`STATUS: ${String(result.diagnostics.qualityStatus ?? "UNKNOWN")}`);
console.log(`RENDERABLE: ${result.diagnostics.renderable ? "YES" : "NO"}`);
console.log(`SCORE: ${String(result.diagnostics.selectedScore ?? 0)}`);

if (result.diagnostics.qualityStatus === "ACCEPTED") {
  console.log("\n--- LIVING MEMORY ---");
  result.scenes.forEach((scene, index) => {
    console.log(`[${index + 1}] ${scene.text}`);
  });
  console.log("--- END LIVING MEMORY ---");
} else {
  console.log("\n--- REJECTED MODEL OUTPUT ---");
  console.log(JSON.stringify(result.diagnostics.rejectedCandidates ?? [], null, 2));
  if (process.env.QRE_AUTHOR_DEBUG_RAW === "true") {
    console.log("\n--- RAW MODEL OUTPUT ---");
    console.log(String(result.diagnostics.rawModelOutput ?? "<no raw model output captured>"));
    console.log("--- END RAW MODEL OUTPUT ---");
  }
}

if (result.diagnostics.modelCalls !== 1) {
  throw new Error("LIVING MEMORY INVARIANT FAILED: expected exactly one model call");
}
if (!result.diagnostics.complete || !result.sequence) {
  throw new Error("LIVING MEMORY INVARIANT FAILED: no complete living memory");
}
if (result.scenes.length !== 5 || result.sequence.cuts.length !== 5) {
  throw new Error("LIVING MEMORY INVARIANT FAILED: expected exactly five cuts");
}
