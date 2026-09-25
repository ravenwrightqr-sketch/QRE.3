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
import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const INPUT: AuthorBrainTruth = {
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

const treatments = Array.isArray(result.diagnostics.creativeTreatments)
  ? result.diagnostics.creativeTreatments
  : [];
const rejectedTreatments = Array.isArray(result.diagnostics.rejectedTreatments)
  ? result.diagnostics.rejectedTreatments
  : [];

function productionForTreatment(value: unknown): string {
  const record = value as { id?: unknown; semanticMechanic?: unknown };
  if (clean(record.semanticMechanic).toUpperCase() === "NONE") return "D";
  const match = clean(record.id).match(/(\d+)/);
  const index = match ? Number(match[1]) : 1;
  return index === 2 ? "B" : index === 3 ? "C" : "A";
}

console.log("\nSEMANTIC MECHANIC:");
console.log(JSON.stringify((treatments[0] as { semanticMechanic?: unknown } | undefined)?.semanticMechanic ?? null, null, 2));

console.log("\nCREATIVE NOTICE:");
console.log(JSON.stringify(result.diagnostics.creativeNotice ?? null, null, 2));
for (const label of ["A", "B", "C"]) {
  const treatment = treatments.find((item) => productionForTreatment(item) === label);
  const rejected = rejectedTreatments.find((item) =>
    productionForTreatment((item as { treatment?: unknown }).treatment) === label,
  ) as { treatment?: unknown; reason?: unknown } | undefined;
  const source = treatment ?? rejected?.treatment;
  console.log(`\nTREATMENT ${label}:`);
  console.log(clean((source as { treatment?: unknown } | undefined)?.treatment));
  console.log(`PERCEPTION DELTA ${label}:`);
  console.log(clean((source as { perceptionDelta?: unknown } | undefined)?.perceptionDelta));
  console.log(`EXPRESSIVE BEHAVIORS ${label}:`);
  console.log(JSON.stringify((source as { expressiveBehaviors?: unknown } | undefined)?.expressiveBehaviors ?? [], null, 2));
  console.log(treatment ? "VALID" : `REJECTED: ${clean(rejected?.reason) || "not generated"}`);
}

console.log("\nBARE D:");
console.log(JSON.stringify(treatments.find((item) => productionForTreatment(item) === "D") ?? null, null, 2));

console.log("\nFULL MOUTH PRODUCTIONS A/B/C/D:");
const memoryProductions = Array.isArray(result.diagnostics.memoryProductions)
  ? result.diagnostics.memoryProductions
  : [];
for (const production of memoryProductions) {
  const record = production as {
    production?: unknown;
    accepted?: unknown;
    score?: unknown;
    reasons?: unknown;
    lines?: Array<{ order?: unknown; text?: unknown; sourceEventIds?: unknown }>;
  };
  console.log(`\nPRODUCTION ${clean(record.production)} accepted=${String(record.accepted)} score=${String(record.score)}`);
  console.log(`reasons: ${JSON.stringify(record.reasons ?? [])}`);
  for (const line of record.lines ?? []) {
    console.log(`[${String(line.order)}] ${clean(line.text)} :: ${JSON.stringify(line.sourceEventIds ?? [])}`);
  }
}

console.log("\nMODEL NOMINATION / FINAL SELECTED WHOLE PRODUCTION:");
console.log(JSON.stringify({
  selectedProduction: result.diagnostics.selectedProduction,
  mouthFallback: result.diagnostics.mouthFallback,
  selectedScenes: result.scenes.map((scene) => clean(scene.text)),
}, null, 2));

console.log("\nTREATMENT VALIDATION / REJECTIONS:");
console.log(JSON.stringify({
  productionContractComplete: result.diagnostics.productionContractComplete,
  creativeSearchFallbackReason: result.diagnostics.creativeSearchFallbackReason,
  assessment: result.diagnostics.treatmentSetAssessment,
  rejectedTreatments,
}, null, 2));

console.log("\nGROUNDING RESULTS:");
console.log(JSON.stringify(result.diagnostics.grounding ?? null, null, 2));

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
