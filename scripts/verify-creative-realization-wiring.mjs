import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));

const checks = [
  ["engine exists", exists("apps/api/src/services/authorCreativeRealizationEngine.ts")],
  ["shared creative realization contract", read("packages/contracts/src/cogauthor/mouth.ts").includes("MouthCreativeRealization") && read("packages/contracts/src/cogauthor/mouth.ts").includes("creativeRealization?: MouthCreativeRealization")],
  ["master owns creative realization", read("apps/api/src/services/authorBrainUniversal.ts").includes("buildCreativeRealizationForBeat") && read("apps/api/src/services/authorBrainUniversal.ts").includes("creativeRealization:" )],
  ["mouth consumes creative realization", read("apps/api/src/services/authorMouthCandidateSearch.ts").includes("creativeRealization") && read("apps/api/src/services/authorMouthCandidateSearch.ts").includes("SUPPLIED FACTS ARE RAW MATERIAL, NOT AUTOMATIC VIEWER LANGUAGE.")],
  ["mouth rejects literal fact-collage guidance", !read("apps/api/src/services/authorMouthCandidateSearch.ts").includes("Came in nervous.\n    Fierce anyway.\n    Then came the bow.")],
  ["strategy lattice delegates realization", read("apps/api/src/services/authorRealizationStrategyLattice.ts").includes("buildCreativeRealization") && read("apps/api/src/services/authorRealizationStrategyLattice.ts").includes("buildCreativeRealizationForBeat")],
  ["manifest documents canonical stage", read("docs/MOUTH_PRODUCTION_MANIFEST.md").includes("authorCreativeRealizationEngine.ts")],
];

console.log("=== QRE CREATIVE REALIZATION WIRING GUARD ===");
let failed = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? "GREEN" : "FAIL"}: ${label}`);
  if (!passed) failed += 1;
}

if (failed) {
  throw new Error(`CREATIVE REALIZATION WIRING GUARD FAILED · ${failed} issue(s)`);
}

console.log("CREATIVE REALIZATION WIRING GUARD GREEN · creative meaning is a canonical production stage");
