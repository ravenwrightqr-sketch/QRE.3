import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];

const canonical = "apps/api/src/services/authorBrainUniversal.ts";
const cognition = "apps/api/src/services/authorCognition.ts";
const cutPolicy = "apps/api/src/services/authorCutPolicy.ts";
const acceptance = "apps/api/author-acceptance-suite.ts";

const forbiddenFiles = [
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/authorBrainMomentum.ts",
  "apps/api/src/services/authorBrainMomentumV2.ts",
  "apps/api/src/services/authorBrainMomentumV3.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
];

const forbiddenTests = [
  "author-beat-presence-suite.ts",
  "author-beat-presence-master-suite.ts",
  "author-ceiling-benchmark.ts",
  "author-ceiling-test.ts",
  "author-creative-superstar-suite.ts",
  "author-mouth-quality-suite.ts",
  "author-universal-ceiling-suite.ts",
  "creative-learning-readout.ts",
  "local-author-test.ts",
  "one-pass-test.ts",
];

const allowedAuthorServices = new Set([
  "authorBrainUniversal.ts",
  "authorCutPolicy.ts",
  "authorCognition.ts",
  "cinematicAuthor.ts",
  "microBeatMouth.ts",
]);

function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }

function read(path) {
  return readFileSync(join(root, path), "utf8");
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

if (!existsSync(join(root, canonical))) fail(`Missing canonical Master Author: ${canonical}`);
if (!existsSync(join(root, cognition))) fail(`Missing canonical author cognition: ${cognition}`);
if (!existsSync(join(root, cutPolicy))) fail(`Missing canonical cut policy: ${cutPolicy}`);
if (!existsSync(join(root, acceptance))) fail(`Missing canonical acceptance harness: ${acceptance}`);

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) fail(`Forbidden legacy author file exists: ${path}`);
}

const apiRoot = join(root, "apps/api");
for (const name of forbiddenTests) {
  const matches = walk(apiRoot).filter((file) => file.endsWith(name));
  for (const match of matches) fail(`Forbidden legacy author test exists: ${relative(root, match)}`);
}

const packageJson = JSON.parse(read("apps/api/package.json"));
if (packageJson.scripts?.["author:fast"] !== "tsx ./author-acceptance-suite.ts") {
  fail("apps/api author:fast must execute only author-acceptance-suite.ts");
}

const acceptanceSource = read(acceptance);
if (!/authorBrainUniversal\.js/.test(acceptanceSource)) {
  fail("Acceptance harness must import the canonical Master Author directly");
}
if (/authorFastCore|authorBrain\.js|authorBrainMomentum|creativeRelationOps/.test(acceptanceSource)) {
  fail("Acceptance harness contains a forbidden author bridge or legacy author import");
}

const canonicalSource = existsSync(join(root, canonical)) ? read(canonical) : "";
if (!/from\s+["'][^"']*authorCognition\.js["']/.test(canonicalSource)) {
  fail("Master Author must import canonical authorCognition directly");
}
if (!/buildAuthorCognitivePlan\s*\(/.test(canonicalSource)) {
  fail("Master Author must execute the canonical author cognition plan before realization");
}
if (!/from\s+["'][^"']*authorCutPolicy\.js["']/.test(canonicalSource)) {
  fail("Master Author must import the canonical authorCutPolicy directly");
}
if (!/\bevaluateCut\s*\(/.test(canonicalSource)) {
  fail("Master Author must evaluate cuts through the canonical authorCutPolicy");
}
if (/function\s+validCut\s*\(/.test(canonicalSource)) {
  fail("Master Author contains a forbidden duplicate local validCut() validator");
}

const sourceFiles = walk(join(root, "apps/api/src")).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
let masterAuthorImports = 0;
for (const file of sourceFiles) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");

  if (/from\s+["'][^"']*authorBrainUniversal\.js["']/.test(body)) masterAuthorImports += 1;

  for (const forbidden of ["authorBrain.js", "authorBrainMomentum", "authorFastCore", "creativeRelationOps"]) {
    if (new RegExp(`from\\s+[\\"'][^\\"']*${forbidden}[^\\"']*[\\"']`).test(body)) {
      fail(`Forbidden author dependency import in ${rel}: ${forbidden}`);
    }
  }
}

if (masterAuthorImports < 1) fail("No production TypeScript import reaches authorBrainUniversal.ts");

const apiServices = join(root, "apps/api/src/services");
if (existsSync(apiServices)) {
  for (const name of readdirSync(apiServices)) {
    if (!name.startsWith("author")) continue;
    if (!name.endsWith(".ts")) continue;
    if (allowedAuthorServices.has(name)) continue;
    warn(`Review author-named service for canonical ownership: apps/api/src/services/${name}`);
  }
}

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
console.log(`MASTER AUTHOR: ${canonical}`);
console.log(`CANONICAL COGNITION: ${cognition}`);
console.log(`CANONICAL CUT POLICY: ${cutPolicy}`);
console.log(`ACCEPTANCE: ${acceptance}`);
console.log(`MASTER AUTHOR IMPORTS: ${masterAuthorImports}`);

for (const message of warnings) console.warn(`WARN: ${message}`);
for (const message of failures) console.error(`FAIL: ${message}`);

if (failures.length) {
  console.error(`\nARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("ARCHITECTURE GUARD GREEN · ONE MASTER AUTHOR PATH · ONE COGNITION PLAN · ONE CUT POLICY");
