/*
 * QRE NEUTRAL HOUSEKEEPING HUMAN-EYE ACCEPTANCE
 *
 * Purpose:
 * Prove the restored canonical Author can turn ordinary completed work into
 * customer-facing media without forcing a worker to be the experience subject.
 *
 * No supplied creative lens.
 * No Maria.
 * No invented client/owner/resident.
 */
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const INPUT = {
  prompt: "Create the post-service customer experience for a housekeeping company.",
  subject: "housekeeping service",
  facts: [
    "Arrived at 9:04 AM",
    "Cleaned the kitchen",
    "Cleaned two bathrooms",
    "Finished at 11:47 AM",
  ],
  sourceMoments: [] as string[],
  memoryContext: [] as string[],
  trajectory: [] as string[],
  creativeLearningContext: [] as string[],
  returning: false,
  visitNumber: 1,
  movieMode: true,
  domainContext: {
    experienceMode: "MEMORY",
    category: "SERVICE",
    serviceType: "HOUSEKEEPING",
  },
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const result = await authorBrainCanonical(INPUT);

console.log("\n=== HOUSEKEEPING / AUTO / NO WORKER STAR ===");
console.log("PROMPT:", INPUT.prompt);
console.log("SUBJECT:", INPUT.subject);
console.log("LENS: AUTO");
console.log("ARTIST ANGLE:", result.brief.angle);
console.log("MOVIE:", result.movie?.id ?? "none");
console.log("MODE:", result.realizationMode);
console.log("MODEL:", result.diagnostics.model);
console.log("MODEL CALLS:", result.diagnostics.modelCalls);
console.log("MOVIE CANDIDATES:", result.diagnostics.candidateSequences);
console.log("\nREALITY:");
for (const event of result.world.events) {
  console.log(`- ${event.id}: ${clean(event.label)}`);
}
console.log("\nFINAL MEDIA:");
result.scenes.forEach((scene, index) => {
  console.log(`[${index + 1}] ${clean(scene.text)}`);
});
console.log("\nSEQUENCE PROVENANCE:");
for (const cut of result.sequence.cuts) {
  console.log(`[${cut.order}] ${cut.sourceIds.join(", ")} :: ${clean(cut.informationGain)}`);
}
console.log("\nQUALITY:");
console.log(JSON.stringify(result.diagnostics, null, 2));

assert.ok(result.movie, "No Movie selected");
assert.ok(result.scenes.length >= 1, "No viewer-facing media generated");
assert.equal(
  result.sequence.cuts.length,
  result.scenes.length,
  "SequencePlay diverged from generated media",
);

const text = result.scenes.map((scene) => clean(scene.text)).join(" ");

assert.doesNotMatch(
  text,
  /\b(?:Maria|she|her|client|owner|resident|homeowner)\b/i,
  "Generated media invented or centered an unsupplied person",
);

assert.doesNotMatch(
  text,
  /\b(?:cognition|planner|candidate|trajectory|viewer state|semantic turn|compiler|realizer|provenance|evidenceEventIds|Mouth|Author)\b/i,
  "Internal architecture leaked into viewer-facing media",
);

console.log("\nHOUSEKEEPING NEUTRAL HUMAN-EYE PROBE: COMPLETE");
