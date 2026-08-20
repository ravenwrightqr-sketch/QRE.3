import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));

const master = read("apps/api/src/services/authorBrainUniversal.ts");
const mouth = read("apps/api/src/services/authorMouthCandidateSearch.ts");
const strategy = read("apps/api/src/services/authorRealizationStrategyLattice.ts");
const engine = read("apps/api/src/services/authorCreativeRealizationEngine.ts");
const manifest = read("docs/MOUTH_PRODUCTION_MANIFEST.md");
const contract = read("packages/contracts/src/cogauthor/mouth.ts");

const checks = [
  ["engine exists", exists("apps/api/src/services/authorCreativeRealizationEngine.ts")],
  [
    "shared creative realization contract",
    contract.includes("MouthCreativeRealization") &&
      contract.includes("creativeRealization?: MouthCreativeRealization"),
  ],
  [
    "master imports creative realization stages",
    master.includes('authorCharacterLensEngine.js') &&
      master.includes('authorRealizationStrategyLattice.js') &&
      master.includes('authorCreativeRealizationEngine.js'),
  ],
  [
    "master owns creative realization",
    master.includes("buildCreativeRealization(") &&
      master.includes("creativeRealization: realization"),
  ],
  [
    "mouth consumes creative realization",
    mouth.includes("creativeRealization") &&
      mouth.includes("CREATIVE REALIZATION:") &&
      mouth.includes("REALIZATION INTENT:"),
  ],
  [
    "mouth rejects literal fact-collage guidance",
    mouth.includes("SUPPLIED FACTS ARE RAW MATERIAL, NOT AUTOMATIC VIEWER LANGUAGE.") &&
      !mouth.includes("subject + trait + action when a stronger creative realization is available"),
  ],
  [
    "strategy lattice remains strategy-only",
    strategy.includes("selectSafeStrategies") &&
      !strategy.includes("buildCreativeRealizationForBeat"),
  ],
  [
    "engine remains deterministic",
    !engine.includes("localModelGenerate") &&
      engine.includes("buildCreativeRealization"),
  ],
  ["manifest documents canonical stage", manifest.includes("authorCreativeRealizationEngine.ts")],
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
