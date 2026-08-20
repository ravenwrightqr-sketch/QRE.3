import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const serviceDir = join(root, "apps", "api", "src", "services");
const repoRoots = [
  join(root, "apps", "api"),
  join(root, "packages", "contracts", "src"),
];

const RETIRED = new Set([
  "authorEnterpriseAdversarialMatrix.ts",
  "authorEnterpriseIntelligence.ts",
  "authorEnterpriseMouth.ts",
  "authorEnterpriseMouthAcceptanceMatrix.ts",
  "authorEnterpriseMouthPolicy.ts",
  "authorEnterpriseRuntime.ts",
  "authorEnterpriseSafety.ts",
  "authorMouthQualityAdapter.ts",
  "authorMouthGroundedFallback.ts",
  "authorMouthLanguageGate.ts",
  "authorMouthAttentionGate.ts",
  "authorMouthRepairPlanner.ts",
  "authorCumulativeMeaning.ts",
  "authorLatentMovieBeatAdapter.ts",
]);

function filesUnder(dir) {
  const result = [];
  if (!statSafe(dir)?.isDirectory()) return result;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(path));
    else if (/\.(?:ts|tsx|mjs|cjs|js)$/.test(entry.name)) result.push(path);
  }
  return result;
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function display(path) {
  return relative(root, path).split(sep).join("/");
}

function importedBy(source, filename) {
  const stem = filename.replace(/\.[^.]+$/, "");
  const patterns = [
    new RegExp(`['\"][^'\"]*/${escapeRegex(stem)}(?:\\.[a-z]+)?['\"]`, "g"),
    new RegExp(`['\"]\\./${escapeRegex(stem)}(?:\\.[a-z]+)?['\"]`, "g"),
    new RegExp(`['\"]@[^'\"]*${escapeRegex(stem)}['\"]`, "g"),
  ];

  return patterns.some((pattern) => pattern.test(source));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const serviceFiles = filesUnder(serviceDir)
  .filter((path) => /^author[A-Z].*\.ts$/.test(path.split(sep).pop() ?? "") || (path.endsWith("aiProvider.ts") || path.endsWith("localModelRuntime.ts")))
  .sort();

const sourceFiles = repoRoots.flatMap(filesUnder);

const consumerCount = new Map();
for (const service of serviceFiles) consumerCount.set(service, 0);

for (const consumer of sourceFiles) {
  const source = read(consumer);
  if (!source) continue;
  for (const service of serviceFiles) {
    if (consumer === service) continue;
    const filename = service.split(sep).pop();
    if (!filename) continue;
    if (importedBy(source, filename)) {
      consumerCount.set(service, (consumerCount.get(service) ?? 0) + 1);
    }
  }
}

const modelCallers = serviceFiles.filter((path) => /localModelGenerate\s*\(/.test(read(path)));
const generatorExports = [];
for (const service of serviceFiles) {
  const source = read(service);
  const matches = source.match(/export\s+(?:async\s+)?function\s+(?:generate|author|realize)[A-Z][A-Za-z0-9_]*/g) ?? [];
  for (const match of matches) generatorExports.push(`${display(service)} :: ${match}`);
}

const retiredPresent = serviceFiles.filter((path) => RETIRED.has(path.split(sep).pop() ?? ""));
const likelyOrphans = serviceFiles.filter((path) => {
  const name = path.split(sep).pop() ?? "";
  if (RETIRED.has(name)) return false;
  if (name === "authorBrainUniversal.ts") return false;
  if (name === "authorMouthCandidateSearch.ts") return false;
  if (name === "authorMouthSequenceBeamSearch.ts") return false;
  if (name === "authorMeaningSpine.ts") return false;
  if (name === "authorMouthRealizationSlot.ts") return false;
  if (name === "authorRealityGraph.ts") return false;
  if (name === "authorRealityEnvelope.ts") return false;
  if (name === "authorCognition.ts") return false;
  if (name === "authorLatentMovieSearch.ts") return false;
  if (name === "authorMovieDifferentiation.ts") return false;
  if (name === "authorBeatTruthGate.ts") return false;
  if (name === "authorCutPolicy.ts") return false;
  if (name === "authorAttentionEditor.ts") return false;
  if (name === "authorSequenceArcGate.ts") return false;
  if (name === "authorRealizationStrategyLattice.ts") return false;
  if (name === "authorBeatPlanRecovery.ts") return false;
  if (name === "localModelRuntime.ts") return false;
  if (name === "aiProvider.ts") return false;
  return (consumerCount.get(path) ?? 0) === 0;
});

console.log("=== QRE AUTHOR SERVICES AUDIT · READ-ONLY ===");
console.log(`Author-related service files: ${serviceFiles.length}`);
console.log(`Source files scanned for consumers: ${sourceFiles.length}`);
console.log(`Direct localModelGenerate callers: ${modelCallers.length}`);
console.log(`Exported generator/author entrypoints: ${generatorExports.length}`);

console.log("\n--- CONSUMER MAP ---");
for (const path of serviceFiles) {
  console.log(`${String(consumerCount.get(path) ?? 0).padStart(3, " ")} consumers · ${display(path)}`);
}

console.log("\n--- DIRECT MODEL CALLERS ---");
for (const path of modelCallers) console.log(`MODEL · ${display(path)}`);

console.log("\n--- AUTHOR ENTRYPOINTS ---");
for (const item of generatorExports) console.log(item);

console.log("\n--- LIKELY ORPHANS (REVIEW, DO NOT AUTO-DELETE) ---");
for (const path of likelyOrphans) console.log(`ORPHAN? · ${display(path)}`);

console.log("\n--- RETIRED FILES STILL PRESENT ---");
for (const path of retiredPresent) console.log(`RETIRED PRESENT · ${display(path)}`);

console.log("\n--- INTERPRETATION ---");
console.log("This command is intentionally read-only.");
console.log("A zero-consumer service is a review signal, not automatic proof of dead code.");
console.log("Direct model generation is expected only in the canonical Author/Mouth owners and controlled provider/media utilities.");
console.log("Use this before architecture changes and again after each production change cluster.");

if (retiredPresent.length) process.exitCode = 1;
