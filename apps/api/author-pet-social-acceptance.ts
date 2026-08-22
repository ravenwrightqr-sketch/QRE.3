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
const prompt = [
  "Create a fun living dog-tag / social-media play-out for Coco.",
  "Use the supplied facts as the complete reality.",
  "Make it entertaining and reveal Coco's personality through the supplied facts.",
  "It may be funny, playful, surprising, or charming, but it must never invent a new person, place, object, action, relationship, behavior, dialogue, sensory detail, or event.",
  "The result should feel useful on a living pet profile while still being something people want to watch and share.",
  "Write a 5-line sequence.",
].join(" ");

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
const debugRaw = process.env.QRE_AUTHOR_DEBUG_RAW === "true";

console.log("=".repeat(72));
console.log("QRE AUTHOR ACCEPTANCE · PET SOCIAL / LIVING DOG TAG");
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
  if (debugRaw) {
    console.log("\n--- RAW MODEL OUTPUT ---");
    console.log(String(result.diagnostics.rawModelOutput ?? "<no raw model output captured>"));
    console.log("--- END RAW MODEL OUTPUT ---");
  }
  console.log("--- NO MODEL PROSE RENDERED ---");
} else {
  console.log("\n--- OUTPUT ---");
  result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${scene.text}`));
  console.log("--- END OUTPUT ---");
  if (debugRaw) {
    console.log("\n--- RAW MODEL OUTPUT ---");
    console.log(String(result.diagnostics.rawModelOutput ?? "<no raw model output captured>"));
    console.log("--- END RAW MODEL OUTPUT ---");
  }
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
