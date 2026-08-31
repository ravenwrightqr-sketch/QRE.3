import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const forbiddenPaths = [
  "packages/engine/src/cognition/universalMind.ts",
  "packages/engine/src/cognition/universalMindContext.ts",
  "packages/engine/src/cognition/worldModel.ts",
  "packages/engine/src/cognition/worldSanitizer.ts",
  "packages/engine/src/cognition/mindState.ts",
  "packages/engine/src/cognition/narrativeWorld.ts",
  "packages/engine/src/cognition/narrativeWriter.ts",
  "packages/engine/src/cognition/creativeWriter.ts",
  "packages/engine/src/cognition/creativeComposition.ts",
  "packages/engine/src/cognition/creativePolicy.ts",
  "packages/engine/src/cognition/creativeRevision.ts",
  "packages/engine/src/cognition/creativeVoiceEngine.ts",
  "packages/engine/src/cognition/experiencePlanner.ts",
  "packages/engine/src/cognition/experienceCritic.ts",
  "packages/engine/src/cognition/proseSurface.ts",
  "packages/engine/src/cognition/significanceEngine.ts",
  "packages/engine/src/cognition/fastInput.ts",
  "packages/engine/src/compiler",
];

const forbiddenSymbols = [
  "UniversalMind",
  "universalMind",
  "compileCognitiveExperience",
  "buildWorldModel",
  "buildWorldModelFromFastInput",
  "normalizeFastInput",
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile()) out.push(absolute);
  }
  return out;
}

for (const path of forbiddenPaths) {
  if (existsSync(join(root, path))) {
    failures.push(`FORBIDDEN LEGACY PATH PRESENT: ${path}`);
  }
}

const scannedRoots = [
  join(root, "apps/api/src"),
  join(root, "apps/api"),
  join(root, "packages/engine/src"),
];

for (const file of scannedRoots.flatMap((dir) => walk(dir))) {
  if (file.endsWith("verify-no-legacy-engine-cognition.mjs")) continue;
  const text = readFileSync(file, "utf8");
  for (const symbol of forbiddenSymbols) {
    if (text.includes(symbol)) {
      failures.push(`FORBIDDEN LEGACY COGNITION SYMBOL: ${symbol} in ${file.replace(root + "\\", "")}`);
    }
  }
}

if (failures.length) {
  console.error("=== QRE LEGACY ENGINE COGNITION GUARD ===");
  for (const failure of failures) console.error(`FAIL · ${failure}`);
  console.error(`LEGACY ENGINE COGNITION GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("LEGACY ENGINE COGNITION GUARD GREEN · NO SECOND ENGINE BRAIN");
