import "dotenv/config";

import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const input = {
  prompt: "Create a customer-facing service receipt sequence for today's grooming visit.",
  subject: "Coco",
  facts: [
    "Coco is a Pomeranian",
  ],
  sourceMoments: [
    "walked in like a lawyer was already contacted",
    "eyebrow up",
    "got a bath",
    "had red bows",
    "scared at first",
    "happy at end",
  ],
  movieMode: true,
};

const result = await authorBrainCanonical(input);

const lines = result.scenes.map((scene) => scene.text).filter(Boolean);
const joined = lines.join(" ").toLowerCase();

const forbidden = [
  "lawyer arrived",
  "lawyer entered",
  "legal presence",
  "a lawyer was there",
  "coco summoned a lawyer",
  "coco called a lawyer",
];

const violations = forbidden.filter((value) => joined.includes(value));
if (violations.length) {
  throw new Error(`FORBIDDEN CONCRETIZATION: ${violations.join(" | ")}`);
}

if (!result.sequence.cuts.length) throw new Error("NO_SEQUENCE_CUTS");
if (!result.diagnostics.renderable) throw new Error("NOT_RENDERABLE");
if (!result.diagnostics.complete) throw new Error("INCOMPLETE_SEQUENCE");
if (result.diagnostics.modelCalls < 1) throw new Error("MOUTH_NOT_CALLED");

console.log("=== QRE UNIVERSAL SERVICE RECEIPT ACCEPTANCE ===");
console.log(`subject=${input.subject}`);
console.log(`mode=${result.realizationMode}`);
console.log(`movie=${result.movie?.id ?? "none"}`);
console.log(`cuts=${result.sequence.cuts.length}`);
console.log(`modelCalls=${result.diagnostics.modelCalls}`);
console.log(`score=${result.diagnostics.selectedScore}`);
console.log("\n--- SERVICE RECEIPT ---\n");
for (const line of lines) console.log(line + "\n");
console.log("PASS · one universal Author produced a grounded service-receipt experience");
