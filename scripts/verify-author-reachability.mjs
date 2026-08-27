/**
 * QRE AUTHOR REACHABILITY GUARD
 * ROLE: production repository invariant.
 * LAW: one canonical Author entry; no retired creative path may become reachable.
 * HARD: source truth, provenance, architecture, and ownership.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const canonical = "apps/api/src/services/authorBrainCanonical.ts";
const experienceService = "apps/api/src/services/experienceService.ts";
const creationService = "apps/api/src/services/experienceCreationServices.ts";
const rootPackage = "package.json";

const forbiddenFiles = [
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorBrainUniversal.ts.new",
  "apps/api/src/services/cinematicAuthor.ts",
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/authorBrainMomentum.ts",
  "apps/api/src/services/authorBrainMomentumV2.ts",
  "apps/api/src/services/authorBrainMomentumV3.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
  "apps/api/author-acceptance-suite.ts",
];

const forbiddenTokens = [
  "authorBrainUniversal",
  "authorBrainMomentum",
  "authorFastCore",
  "creativeRelationOps",
  "cinematicAuthor",
  "qre-universal-author",
  "qre-cinematic-author",
];

function rel(file) {
  return relative(root, file).replaceAll("\\", "/");
}

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

function source(path) {
  return readFileSync(join(root, path), "utf8");
}

for (const path of [canonical, experienceService, creationService, rootPackage]) {
  if (!existsSync(join(root, path))) failures.push(`missing-required-file: ${path}`);
}

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) failures.push(`forbidden-file-reachable: ${path}`);
}

const productionRoots = [
  join(root, "apps/api/src"),
  join(root, "apps/web/src"),
  join(root, "packages"),
];

for (const directory of productionRoots) {
  for (const file of walk(directory).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file))) {
    const path = rel(file);
    const isNonProductionHarness = /(^|\/)(test|tests|__tests__|fixtures|acceptance)(\/|\.)/i.test(path);
    if (isNonProductionHarness) continue;

    const body = readFileSync(file, "utf8");
    for (const token of forbiddenTokens) {
      if (body.includes(token)) failures.push(`forbidden-token: ${path} contains ${token}`);
    }
  }
}

const compile = existsSync(join(root, experienceService)) ? source(experienceService) : "";
const canonicalSource = existsSync(join(root, canonical)) ? source(canonical) : "";
const creation = existsSync(join(root, creationService)) ? source(creationService) : "";
const packageJson = existsSync(join(root, rootPackage)) ? JSON.parse(source(rootPackage)) : {};

if (!/authorBrainCanonical/.test(compile)) failures.push("experience-service: missing canonical Author call");
for (const token of [
  "compileCognitiveExperience",
  "authorMicroBeats",
  "searchUniversalMovieCandidates",
  "summarizeCognitiveAnalytics",
]) {
  if (compile.includes(token)) failures.push(`experience-service: legacy creative dependency ${token}`);
}

if (/qre-cinematic-author/.test(creation)) failures.push("creation-service: stale cinematic author identity");
if (/generativeAuthor\s*:\s*cinematicScenes\.some/.test(creation)) failures.push("creation-service: author identity inferred from stale cinematic metadata");

if (!/authorBrainCanonical/.test(canonicalSource)) failures.push("canonical-author: canonical entry not present");
if (/compileCognitiveExperience/.test(canonicalSource)) failures.push("canonical-author: invokes legacy creative compiler");

const rootScripts = JSON.stringify(packageJson.scripts ?? {});
for (const token of forbiddenTokens) {
  if (rootScripts.includes(token)) failures.push(`root-package: script references ${token}`);
}

console.log("=== QRE AUTHOR REACHABILITY GUARD ===");
console.log(`CANONICAL: ${canonical}`);
console.log(`PRODUCTION ADAPTER: ${experienceService}`);
console.log(`CREATION BOUNDARY: ${creationService}`);
for (const failure of failures) console.error(`FAIL: ${failure}`);
if (failures.length) {
  console.error(`AUTHOR REACHABILITY GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("AUTHOR REACHABILITY GUARD GREEN · NO RETIRED CREATIVE PATHS REACHABLE");
