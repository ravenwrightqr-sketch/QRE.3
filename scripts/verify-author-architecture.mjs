#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const required = [
  "apps/api/src/services/authorRealityExtractor.ts",
  "apps/api/src/services/authorRealityGraph.ts",
  "apps/api/src/services/authorCreativeDiscovery.ts",
  "apps/api/src/services/authorCreative.ts",
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/experienceService.ts",
  "apps/api/src/routes/experience.ts",
  "apps/api/author-universal-core-acceptance.ts",
];
const forbiddenFiles = [
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorCognitionUniversal.ts",
  "apps/api/src/services/authorCreativeSpine.ts",
  "apps/api/src/services/authorMeaningPressure.ts",
  "apps/api/src/services/authorCreativeLensBrief.ts",
  "apps/api/src/services/authorMovieDifferentiation.ts",
  "apps/api/src/services/authorCutPolicy.ts",
  "apps/api/src/services/authorRealityEnvelope.ts",
  "apps/api/src/services/authorCharacterLensEngine.ts",
  "apps/api/src/services/authorMetamorphicSearch.ts",
  "apps/api/src/services/authorMouth.ts",
  "apps/api/src/services/authorMouthCandidateSearch.ts",
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
  "apps/api/src/services/authorMouthInterpretation.ts",
  "apps/api/src/services/microBeatMouth.ts",
];
const forbiddenTokens = [
  "authorBrainUniversal",
  "authorCognition",
  "authorCreativeSpine",
  "authorMeaningPressure",
  "authorCreativeLensBrief",
  "authorMovieDifferentiation",
  "authorCutPolicy",
  "authorRealityEnvelope",
  "authorCharacterLensEngine",
  "authorMetamorphicSearch",
  "authorMouthCandidateSearch",
  "authorMouthSequenceBeamSearch",
  "authorMouthInterpretation",
  "microBeatMouth",
];

const allowedAuthorServiceFiles = new Set([
  "authorRealityExtractor.ts",
  "authorRealityGraph.ts",
  "authorCreativeDiscovery.ts",
  "authorCreative.ts",
  "authorBrainCanonical.ts",
  "authorReadout.ts",
  "authorTruth.ts",
  "authorExperienceMemory.ts",
  "authorExperienceState.ts",
  "authorBehaviorProfile.ts",
  "authorAdaptiveTempo.ts",
]);

const read = (p) => readFileSync(join(root, p), "utf8");
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(e.name)) continue;
    const a = join(dir, e.name);
    e.isDirectory() ? walk(a, out) : out.push(a);
  }
  return out;
}

for (const p of required) if (!existsSync(join(root, p))) failures.push(`missing-required: ${p}`);
for (const p of forbiddenFiles) if (existsSync(join(root, p))) failures.push(`forbidden-legacy-file: ${p}`);

const brain = existsSync(join(root, required[4])) ? read(required[4]) : "";
for (const token of ["authorRealityExtractor.js", "authorRealityGraph.js", "authorCreativeDiscovery.js", "authorCreative.js"]) {
  if (!brain.includes(token)) failures.push(`canonical-brain missing ${token}`);
}
if (/localModelGenerate\s*\(/.test(brain)) failures.push("canonical-brain must orchestrate, not call the model directly");

const authorServiceDir = join(root, "apps/api/src/services");
for (const file of walk(authorServiceDir).filter((p) => /author[^/\\]*\.ts$/i.test(p))) {
  const name = file.split(/[\\/]/).pop();
  if (name && !allowedAuthorServiceFiles.has(name)) {
    failures.push(`unapproved-author-service-file: ${relative(root, file).replaceAll("\\", "/")}`);
  }
}

const sourceFiles = walk(join(root, "apps/api/src")).filter((p) => /\.(ts|tsx|js|mjs)$/.test(p));
for (const file of sourceFiles) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const body = readFileSync(file, "utf8");
  for (const token of forbiddenTokens) {
    if (body.includes(token)) failures.push(`forbidden-token: ${rel} contains ${token}`);
  }
}

const service = existsSync(join(root, "apps/api/src/services/experienceService.ts"))
  ? read("apps/api/src/services/experienceService.ts")
  : "";
if (!/authorBrainCanonical/.test(service)) failures.push("experienceService must call authorBrainCanonical");
if (!/authorExperienceStateToMemoryBatch/.test(service)) failures.push("experienceService must preserve Author memory persistence");
if (!/buildExperienceMemoryBatch/.test(service)) failures.push("experienceService must preserve RealityGraph persistence");

const pkg = JSON.parse(read("apps/api/package.json"));
if (pkg.scripts?.["author:fast"] !== "tsx ./author-universal-core-acceptance.ts") {
  failures.push("author:fast must target universal core acceptance");
}

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
for (const f of failures) console.error("FAIL:", f);
if (failures.length) {
  console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length}`);
  process.exit(1);
}
console.log("GREEN · ONE AUTHOR PATH · REALITY -> CREATIVE DISCOVERY -> QRE CREATIVE -> RUNTIME");
