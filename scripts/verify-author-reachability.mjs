import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const fail = (message) => failures.push(message);
const exists = (path) => existsSync(join(root, path));

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(absolute);
  }
  return out;
}

const sourceRoot = join(root, "apps/api/src");
const files = walk(sourceRoot);
const canonicalBrain = "authorBrainCanonical";
const canonicalMouth = "authorMouth";
const retiredAuthorNames = [
  "authorBrain",
  "authorBrainUniversal",
  "authorFastCore",
  "creativeRelationOps",
];
const retiredMouthNames = [
  "authorMouthCraft",
  "authorMouthCritic",
  "authorMouthInterpretation",
  "authorMouthSequenceCritic",
  "authorMouthCandidateSearch",
  "authorMouthCandidateSearchCanonical",
  "authorMouthSequenceBeamSearch",
];

let canonicalBrainImporters = 0;
let canonicalMouthImporters = 0;

for (const file of files) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");

  if (new RegExp(`from\\s+[\\"'][^\\"']*${canonicalBrain}\\.js[\\"']`).test(body)) {
    canonicalBrainImporters += 1;
  }

  if (new RegExp(`from\\s+[\\"'][^\\"']*${canonicalMouth}\\.js[\\"']`).test(body)) {
    canonicalMouthImporters += 1;
  }

  for (const name of retiredAuthorNames) {
    const pattern = new RegExp(`from\\s+[\\"'][^\\"']*${name}(?:\\.js)?[\\"']`);
    if (pattern.test(body)) fail(`retired Author reachability in ${rel}: ${name}`);
  }

  for (const name of retiredMouthNames) {
    const pattern = new RegExp(`from\\s+[\\"'][^\\"']*${name}\\.js[\\"']`);
    if (pattern.test(body)) fail(`retired Mouth reachability in ${rel}: ${name}`);
  }
}

if (!canonicalBrainImporters) fail("no production path reaches authorBrainCanonical.ts");
if (!canonicalMouthImporters) fail("no production path reaches canonical authorMouth.ts");

const brainPath = join(root, "apps/api/src/services/authorBrainCanonical.ts");
if (existsSync(brainPath)) {
  const brain = readFileSync(brainPath, "utf8");
  for (const required of [
    "buildAuthorCognitivePlan",
    "buildAuthorRealityGraph",
    "buildAuthorRealityEnvelope",
    "buildMouthCandidateMessages",
    "selectBestMouthSequence",
  ]) {
    if (!new RegExp(`\\b${required}\\s*\\(`).test(brain)) {
      fail(`canonical Author does not reach required stage: ${required}`);
    }
  }
}

console.log("=== QRE AUTHOR REACHABILITY GUARD ===");
for (const message of failures) console.error(`FAIL: ${message}`);

if (failures.length) {
  console.error(`AUTHOR REACHABILITY GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR REACHABILITY GUARD GREEN · CANONICAL AUTHOR AND MOUTH ARE REACHABLE · NO RETIRED AUTHOR/MOUTH BRIDGES");
