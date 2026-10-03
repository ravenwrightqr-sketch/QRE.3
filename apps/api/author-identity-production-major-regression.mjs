import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");

assert.match(
  source,
  /const isIdentityMode = experienceMode === "IDENTITY";/,
  "Identity mode must be represented explicitly, not hidden inside Memory naming.",
);

assert.match(
  source,
  /const usesProductionMajorMouth = isMemoryMode \|\| isIdentityMode;/,
  "Identity must be eligible for the production-major Mouth contract.",
);

assert.match(
  source,
  /const usesWholeProductionSelection = isIdentityMode \|\| \(isMemoryMode && lensSearchEnabled\);/,
  "Identity must use whole-production selection rather than the local per-beat variant selector.",
);

assert.equal(
  source.includes("Return four candidate realizations of this IDENTITY character cluster"),
  false,
  "Identity must not request the legacy four-realization topology.",
);

assert.match(
  source,
  /required: usesProductionMajorMouth\s*\?\s*\["productions", "selectedProduction", "selectionReason"\]\s*:\s*\["variantsByBeat"\]/s,
  "Identity must request the shared production-major JSON shape instead of variantsByBeat.",
);

assert.match(
  source,
  /if \(usesProductionMajorMouth\) \{[\s\S]*production-major productions are required[\s\S]*\} else \{[\s\S]*parsedMouth\?\.variantsByBeat/s,
  "Identity must enter the production-major parser before the legacy variantsByBeat parser.",
);

assert.match(
  source,
  /if \(usesWholeProductionSelection\) \{[\s\S]*selectMemoryProductionCandidate\([\s\S]*\} else if \(isMemoryMode\) \{[\s\S]*scoreMemorySequence[\s\S]*\} else \{/s,
  "Identity must enter whole-production evaluation before legacy Memory/non-Memory variant selection.",
);

console.log("AUTHOR IDENTITY PRODUCTION-MAJOR GREEN - NO LEGACY VARIANTS TOPOLOGY");
