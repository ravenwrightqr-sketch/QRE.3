import "dotenv/config";
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const reality = {
  prompt: "Create a living memory experience for Paul.",
  subject: "Paul",
  facts: [
    "Paul kept old records.",
    "Paul saved birthday cards.",
    "Paul listened to the same song every Sunday.",
    "Paul moved away.",
  ],
  sourceMoments: [
    "Old records.",
    "Birthday cards.",
    "Same song. Every Sunday.",
    "Paul moved away.",
  ],
  memoryContext: [
    "Paul is a person with a long history of Sunday music rituals.",
    "The old records and birthday cards are persistent artifacts connected to Paul.",
  ],
  trajectory: [],
  creativeLearningContext: [],
  movieMode: true,
};

const result = await authorBrainCanonical(reality);
const text = result.scenes.map((scene) => scene.text).filter(Boolean).join("\n");

console.log("=== AUTHOR LIVING MEMORY ACCEPTANCE ===");
console.log(`SUBJECT: ${reality.subject}`);
console.log(`MOVIE: ${result.movie?.id ?? "none"}`);
console.log(`LENS: ${result.brief.angle}`);
console.log(`SCORE: ${result.diagnostics.selectedScore}`);
console.log(`QUALITY: ${result.diagnostics.qualityStatus}`);
console.log(`RENDERABLE: ${result.diagnostics.renderable}`);
console.log("--- OUTPUT ---");
console.log(text);
console.log("--- END OUTPUT ---");

assert.equal(result.diagnostics.qualityStatus, "ACCEPTED");
assert.equal(result.diagnostics.renderable, true);
assert.equal(result.diagnostics.complete, true);
assert.ok(result.movie, "living memory did not produce a Movie");
assert.ok(result.sequence.cuts.length >= 2, "living memory needs multiple beats");
assert.match(text, /Paul|records|birthday|Sunday|song|moved away/i, "living memory lost its concrete anchors");
assert.doesNotMatch(text, /sunset|rain|coffee shop|street|park|photo album|hospital/i, "memory realization invented unsupported scenery/details");

console.log("PASS · living memory survives as a universal Author experience without a memorial-specific author");
