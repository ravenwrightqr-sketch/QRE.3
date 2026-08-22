import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

const subject = "Coco";
const facts = [
  "poodle",
  "fierce",
  "loves bacon",
  "long walks at night",
  "friendly",
  "loves other dogs",
];
const prompt =
  "Create a 5-line social living dog-tag movie for Coco. Use only the supplied facts. Make Coco's personality fun and recognizable and let the sequence teach something about Coco. Do not invent people, places, objects, dialogue, private feelings, body details, or literal events.";

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
console.log("QRE PET SOCIAL ACCEPTANCE · ONE BRAIN / ONE MODEL CALL");
console.log("=".repeat(72));
console.log(`MODEL: ${String(result.diagnostics.model ?? "unknown")}`);
console.log(`MODEL CALLS: ${String(result.diagnostics.modelCalls ?? 0)}`);
console.log(`CANDIDATES: ${String(result.diagnostics.candidateSequences ?? 0)}`);
console.log(`ACCEPTED: ${String(result.diagnostics.acceptedCandidates ?? 0)}`);
console.log(`STATUS: ${String(result.diagnostics.qualityStatus ?? "UNKNOWN")}`);
console.log(`RENDERABLE: ${result.diagnostics.renderable ? "YES" : "NO"}`);
console.log(`SCORE: ${String(result.diagnostics.selectedScore ?? 0)}`);

if (result.diagnostics.qualityStatus === "ACCEPTED") {
  console.log("\n--- PET SOCIAL MOVIE ---");
  result.scenes.forEach((scene, index) => {
    console.log(`[${index + 1}] ${scene.text}`);
  });
  console.log("--- END PET SOCIAL MOVIE ---");
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
  throw new Error("PET SOCIAL INVARIANT FAILED: expected exactly one model call");
}
if (!result.diagnostics.complete || !result.sequence) {
  throw new Error("PET SOCIAL INVARIANT FAILED: no complete pet social movie");
}
if (result.scenes.length !== 5 || result.sequence.cuts.length !== 5) {
  throw new Error("PET SOCIAL INVARIANT FAILED: expected exactly five cuts");
}
