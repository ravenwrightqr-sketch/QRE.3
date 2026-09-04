import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const fail = (message) => failures.push(message);
const exists = (path) => existsSync(join(root, path));
const read = (path) => readFileSync(join(root, path), "utf8");

const canonicalFiles = [
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorRealityGraph.ts",
  "apps/api/src/services/authorRealityEnvelope.ts",
  "apps/api/src/services/authorUniversalMovieSearch.ts",
  "apps/api/src/services/authorMouth.ts",
  "apps/api/src/services/authorMouthRealizationAuthority.ts",
  "apps/api/src/services/authorRealizationBoundary.ts",
  "apps/api/src/services/authorMetamorphicRelationSearch.ts",
  "apps/api/src/services/authorMetamorphicRelationSet.ts",
  "apps/api/src/services/authorLatentStoryThesis.ts",
];

const retired = [
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
  "apps/api/src/services/authorMouthCraft.ts",
  "apps/api/src/services/authorMouthCritic.ts",
  "apps/api/src/services/authorMouthInterpretation.ts",
  "apps/api/src/services/authorMouthSequenceCritic.ts",
  "apps/api/src/services/authorMouthCandidateSearch.ts",
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
];

for (const path of canonicalFiles) {
  if (!exists(path)) fail(`missing canonical Author file: ${path}`);
}

for (const path of retired) {
  if (exists(path)) fail(`retired Author file exists: ${path}`);
}

const brain = exists("apps/api/src/services/authorBrainCanonical.ts")
  ? read("apps/api/src/services/authorBrainCanonical.ts")
  : "";
const cognition = exists("apps/api/src/services/authorCognition.ts")
  ? read("apps/api/src/services/authorCognition.ts")
  : "";
const mouth = exists("apps/api/src/services/authorMouth.ts")
  ? read("apps/api/src/services/authorMouth.ts")
  : "";
const metamorphicSet = exists("apps/api/src/services/authorMetamorphicRelationSet.ts")
  ? read("apps/api/src/services/authorMetamorphicRelationSet.ts")
  : "";

const requiredBrainWiring = [
  [/authorCognition\.js/, "brain->cognition"],
  [/buildAuthorCognitivePlan\s*\(/, "brain->cognitive-plan"],
  [/authorRealityGraph\.js/, "brain->reality-graph"],
  [/authorRealityEnvelope\.js/, "brain->reality-envelope"],
  [/authorMouth\.js/, "brain->one-mouth"],
  [/selectBestMouthSequence\s*\(/, "brain->sequence-selection"],
];

for (const [pattern, label] of requiredBrainWiring) {
  if (!pattern.test(brain)) fail(`missing architecture wiring: ${label}`);
}

const requiredCognitionWiring = [
  [/deriveLatentStoryThesis\s*\(/, "cognition->latent-thesis"],
  [/selectDistinctMovieCandidates\s*\(/, "cognition->movie-selection"],
  [/buildAuthorMetamorphicRelationSet\s*\(/, "cognition->metamorphic-set"],
];

for (const [pattern, label] of requiredCognitionWiring) {
  if (!pattern.test(cognition)) fail(`missing cognition wiring: ${label}`);
}

if (!/buildMouthCandidateMessages\s*\(/.test(mouth)) {
  fail("canonical Mouth does not expose candidate generation");
}
if (!/completeMouthPools\s*\(/.test(mouth)) {
  fail("canonical Mouth does not expose completion/scoring");
}
if (!/selectBestMouthSequence\s*\(/.test(mouth)) {
  fail("canonical Mouth does not expose canonical sequence selection");
}

if (!/assertAuthorMetamorphicRelationSet\s*\(/.test(metamorphicSet)) {
  fail("metamorphic relation set does not hard-assert its contract");
}
if (!/evidenceClosed/.test(metamorphicSet)) {
  fail("metamorphic relation set has no evidence-closure invariant");
}

const sourceRoot = join(root, "apps/api/src");
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

let canonicalBrainImporters = 0;
for (const file of walk(sourceRoot)) {
  const body = readFileSync(file, "utf8");
  if (/from\s+["'][^"']*authorBrainCanonical\.js["']/.test(body)) canonicalBrainImporters += 1;

  const relativePath = relative(root, file).replaceAll("\\", "/");
  for (const retiredName of [
    "authorBrain.js",
    "authorBrainUniversal.js",
    "authorFastCore.js",
    "creativeRelationOps.js",
  ]) {
    if (new RegExp(`from\\s+[\\"'][^\\"']*${retiredName}[\\"']`).test(body)) {
      fail(`retired Author dependency imported in ${relativePath}: ${retiredName}`);
    }
  }
}

if (canonicalBrainImporters < 1) {
  fail("no production TypeScript importer reaches authorBrainCanonical.ts");
}

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
for (const message of failures) console.error(`FAIL: ${message}`);

if (failures.length) {
  console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR ARCHITECTURE GUARD GREEN · ONE AUTHOR · ONE COGNITION · ONE MOVIE AUTHORITY · ONE MOUTH · ONE SEQUENCE");
