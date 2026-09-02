import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const cases = [
  {
    name: "COCO / COMEDY",
    subject: "Coco",
    lens: "comedy",
    facts: [
      "Coco came in nervous",
      "started running the place",
      "bows were not approved",
      "the mirror was approved",
      "left looking fabulous",
      "peace was temporary",
    ],
  },
  {
    name: "COCO / COURTROOM",
    subject: "Coco",
    lens: "courtroom",
    facts: [
      "Coco came in nervous",
      "started running the place",
      "bows were not approved",
      "the mirror was approved",
      "left looking fabulous",
      "peace was temporary",
    ],
  },
  {
    name: "COCO / SPY",
    subject: "Coco",
    lens: "spy",
    facts: [
      "Coco came in nervous",
      "started running the place",
      "bows were not approved",
      "the mirror was approved",
      "left looking fabulous",
      "peace was temporary",
    ],
  },
  {
    name: "COCO / GAME",
    subject: "Coco",
    lens: "game",
    facts: [
      "Coco came in nervous",
      "started running the place",
      "bows were not approved",
      "the mirror was approved",
      "left looking fabulous",
      "peace was temporary",
    ],
  },
  {
    name: "HOUSEKEEPING / SPY",
    subject: "the house",
    lens: "spy",
    facts: [
      "geodrop",
      "cleaned kitchen",
      "felt eyes on me",
      "cleaned two bathrooms",
      "cat watched",
      "final inspection",
    ],
  },
  {
    name: "HOUSEKEEPING / HEIST",
    subject: "the house",
    lens: "heist",
    facts: [
      "geodrop",
      "cleaned kitchen",
      "felt eyes on me",
      "cleaned two bathrooms",
      "cat watched",
      "final inspection",
    ],
  },
  {
    name: "HOUSEKEEPING / MILITARY",
    subject: "the house",
    lens: "military",
    facts: [
      "geodrop",
      "cleaned kitchen",
      "felt eyes on me",
      "cleaned two bathrooms",
      "cat watched",
      "final inspection",
    ],
  },
  {
    name: "HOUSEKEEPING / HORROR",
    subject: "the house",
    lens: "horror",
    facts: [
      "geodrop",
      "cleaned kitchen",
      "felt eyes on me",
      "cleaned two bathrooms",
      "cat watched",
      "final inspection",
    ],
  },
  {
    name: "HOUSEKEEPING / GAME",
    subject: "the house",
    lens: "game",
    facts: [
      "geodrop",
      "cleaned kitchen",
      "felt eyes on me",
      "cleaned two bathrooms",
      "cat watched",
      "final inspection",
    ],
  },
  {
    name: "WEDDING / SENTIMENTAL",
    subject: "the wedding",
    lens: "sentimental",
    facts: [
      "the ceremony began",
      "everyone stayed",
      "the last table kept talking",
      "music ended",
      "people still stayed",
      "we were the last ones to leave",
    ],
  },
  {
    name: "RELATIONSHIP / ROMANCE",
    subject: "the relationship",
    lens: "romance",
    facts: [
      "we met at the restaurant",
      "everyone else left",
      "we kept talking",
      "the restaurant closed",
      "we still were not ready to go",
    ],
  },
  {
    name: "BOAT / ADVENTURE",
    subject: "the boat trip",
    lens: "adventure",
    facts: [
      "left the marina",
      "crossed the bay",
      "stayed out past sunset",
      "the wind dropped",
      "we turned back",
      "we were not ready to go home",
    ],
  },
] as const;

const forbiddenExplanation = /\b(?:obviously|therefore|this shows|this proves|the point is|the lesson is|means that|is really|in other words)\b/i;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const test of cases) {
  console.log("\n" + "=".repeat(86));
  console.log(`${test.name} · lens=${test.lens}`);
  console.log("=".repeat(86));

  const result = await authorBrainCanonical({
    prompt: "Create a short QRE experience. Feel it; do not explain it. Preserve supplied reality.",
    subject: test.subject,
    facts: [...test.facts],
    sourceMoments: [...test.facts],
    memoryContext: [],
    creativeLearningContext: [],
    lens: test.lens,
  });

  console.log(`MODEL=${result.diagnostics.model}`);
  console.log(`STATUS=${result.diagnostics.qualityStatus}`);
  console.log(`RENDERABLE=${result.diagnostics.renderable ? "YES" : "NO"}`);
  console.log(`SCORE=${result.diagnostics.selectedScore}`);
  console.log("--- WRITTEN EXPERIENCE ---");
  for (const [index, scene] of result.scenes.entries()) {
    console.log(`[${index + 1}] ${scene.text}`);
  }
  console.log("--- END WRITTEN EXPERIENCE ---");

  assert(result.diagnostics.complete, `${test.name}: Author did not complete`);
  assert(result.diagnostics.renderable, `${test.name}: result is not renderable`);
  assert(result.sequence.cuts.length === result.scenes.length, `${test.name}: scene/cut mismatch`);
  assert(result.sequence.cuts.length >= 2, `${test.name}: sequence too short`);
  assert(result.sequence.cuts.every((cut) => cut.sourceIds.length > 0), `${test.name}: missing source provenance`);

  const written = result.scenes.map((scene) => scene.text).join(" ");
  assert(!forbiddenExplanation.test(written), `${test.name}: explanatory conclusion leaked into realization`);
}

console.log("\n" + "=".repeat(86));
console.log("QRE UNIVERSAL LENS PRODUCT ACCEPTANCE · PASS");
console.log(`CASES=${cases.length}`);
console.log("REALITY=immutable");
console.log("LENS=universal perceptual policy");
console.log("SATANICO=observer-inference authority");
console.log("REALIZATION=feel it; do not explain it");
console.log("=".repeat(86));
