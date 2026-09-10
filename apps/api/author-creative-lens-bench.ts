import "dotenv/config";
import type { AuthorBrainTruth } from "@qre/contracts";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

/**
 * Universal creative bench.
 *
 * The same Canonical Author, the same Gemma creative model, and the same
 * production lens path are exercised across the creative experiences QRE
 * actually needs to nail first. No API, Prisma, persistence, or Neon.
 *
 * Default: run every case sequentially.
 * Single case: pnpm exec tsx apps/api/author-creative-lens-bench.ts coco
 *
 * Cases:
 *   coco         social dog tag / playful negotiation
 *   groomer      dog-grooming service experience / negotiation
 *   housekeeping housekeeping service experience / operation
 *   moving       moving service experience / investigation
 *   realestate   real-estate media / transformation
 *   carwash      car-wash service experience / transformation
 *   memorial     living-memory experience / refrain
 */

type CreativeCase = {
  id: string;
  name: string;
  lens: string;
  input: AuthorBrainTruth;
};

const cases: CreativeCase[] = [
  {
    id: "coco",
    name: "COCO TAG",
    lens: "negotiation",
    input: {
      prompt: "Make a fun living dog tag. Let Coco have a point of view.",
      subject: "Coco",
      lens: "negotiation",
      facts: [
        "Pomeranian",
        "loves walks",
        "squirrels",
        "bacon",
        "apples",
      ],
      sourceMoments: [
        "Pomeranian",
        "loves walks",
        "squirrels",
        "bacon",
        "apples",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
  {
    id: "groomer",
    name: "DOG GROOMER",
    lens: "negotiation",
    input: {
      prompt: "Make a dog-grooming service experience the client will actually want to watch.",
      subject: "Coco",
      lens: "negotiation",
      facts: [
        "poodle",
        "came in nervous",
        "got a bath",
        "stole a blue bow",
        "left looking fabulous",
      ],
      sourceMoments: [
        "came in nervous",
        "got a bath",
        "stole a blue bow",
        "left looking fabulous",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
  {
    id: "housekeeping",
    name: "HOUSEKEEPING",
    lens: "operation",
    input: {
      prompt: "Make a housekeeping service experience from the real work, not a boring receipt.",
      subject: "Maria",
      lens: "operation",
      facts: [
        "arrived at 9:04",
        "cleaned the kitchen",
        "cleaned two bathrooms",
        "finished at 11:47",
      ],
      sourceMoments: [
        "arrived at 9:04",
        "cleaned the kitchen",
        "cleaned two bathrooms",
        "finished at 11:47",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
  {
    id: "moving",
    name: "MOVING COMPANY",
    lens: "investigation",
    input: {
      prompt: "Make a moving-service experience that feels like an actual experience, not a report.",
      subject: "the family",
      lens: "investigation",
      place: "Riverside to Portland",
      facts: [
        "three days",
        "kitchen packed first",
        "one mystery box was still missing at the end",
      ],
      sourceMoments: [
        "three days",
        "kitchen packed first",
        "mystery box missing",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
  {
    id: "realestate",
    name: "REAL ESTATE MEDIA",
    lens: "transformation",
    input: {
      prompt: "Make media for a house that makes someone stop scrolling and look again.",
      subject: "the house",
      lens: "transformation",
      facts: [
        "three bedrooms",
        "sunlit kitchen",
        "large backyard",
        "new flooring",
        "Riverside",
      ],
      sourceMoments: [
        "sunlit kitchen",
        "large backyard",
        "new flooring",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
  {
    id: "carwash",
    name: "CAR WASH",
    lens: "transformation",
    input: {
      prompt: "Make a car-wash client experience that turns the before-and-after into something worth watching.",
      subject: "the black SUV",
      lens: "transformation",
      facts: [
        "came in filthy",
        "mud on the wheels",
        "cleaned inside and out",
        "left glossy",
      ],
      sourceMoments: [
        "came in filthy",
        "mud on the wheels",
        "cleaned inside and out",
        "left glossy",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
  {
    id: "memorial",
    name: "MEMORY",
    lens: "refrain",
    input: {
      prompt: "Make a living-memory experience from these supplied details. Do not turn it into a generic memorial.",
      subject: "her",
      lens: "refrain",
      facts: [
        "loved old records",
        "kept every birthday card",
        "played the same song on Sundays",
      ],
      sourceMoments: [
        "loved old records",
        "kept every birthday card",
        "same song on Sundays",
      ],
      memoryContext: [],
      trajectory: [],
      creativeLearningContext: [],
      returning: false,
    },
  },
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function selectedCases(argv: string[]): CreativeCase[] {
  const requested = argv.filter((arg) => !arg.startsWith("--"));
  if (!requested.length || requested.includes("all")) return cases;

  const selected = cases.filter((item) => requested.includes(item.id));
  if (!selected.length) {
    throw new Error(
      `Unknown case(s): ${requested.join(", ")}. Valid cases: ${cases.map((item) => item.id).join(", ")}`,
    );
  }
  return selected;
}

process.env.QRE_AUTHOR_REALIZATION_MODE = "single";
process.env.QRE_AUTHOR_FAST_MODEL ??= "gemma3:12b";
process.env.QRE_AUTHOR_FALLBACK_MODEL ??= "";
process.env.QRE_AUTHOR_DEBUG_RAW = "false";

const selected = selectedCases(process.argv.slice(2));
let failed = 0;

console.log("=".repeat(78));
console.log("QRE CREATIVE LENS BENCH");
console.log("CANONICAL AUTHOR · GEMMA 3 12B · SINGLE REALIZATION · NO DATABASE");
console.log("=".repeat(78));
console.log(`CASES: ${selected.map((item) => item.id).join(", ")}`);

for (const test of selected) {
  const started = Date.now();

  console.log("\n" + "-".repeat(78));
  console.log(`${test.name} [${test.id}]`);
  console.log(`REQUESTED LENS: ${test.lens}`);
  console.log(`SUBJECT: ${test.input.subject}`);
  console.log(`FACTS: ${test.input.facts.join(" | ")}`);

  try {
    const result = await authorBrainCanonical(test.input);
    const scenes = result.scenes
      .map((scene) => clean(scene.text))
      .filter(Boolean);

    console.log(`TIME: ${((Date.now() - started) / 1000).toFixed(2)}s`);
    console.log(`MODEL: ${result.diagnostics.model}`);
    console.log(`MODEL CALLS: ${result.diagnostics.modelCalls}`);
    console.log(`RESOLVED LENS: ${result.brief.angle}`);
    console.log(`STATUS: ${result.diagnostics.qualityStatus}`);
    console.log(`RENDERABLE: ${result.diagnostics.renderable}`);
    console.log(`COMPLETE: ${result.diagnostics.complete}`);
    console.log("--- MOVING TEXT ---");
    scenes.forEach((line, index) => console.log(`[${index + 1}] ${line}`));
    console.log("--- END MOVING TEXT ---");

    if (
      !result.diagnostics.complete ||
      !result.diagnostics.renderable ||
      scenes.length !== result.sequence.cuts.length
    ) {
      throw new Error("Canonical Author returned an invalid creative experience");
    }
  } catch (error) {
    failed += 1;
    console.error(
      `FAILED: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

console.log("\n" + "=".repeat(78));
console.log(`CREATIVE LENS BENCH: ${failed ? "FAIL" : "PASS"}`);
console.log(`RAN: ${selected.length} · FAILED: ${failed}`);
console.log("=".repeat(78));

if (failed) process.exitCode = 1;
