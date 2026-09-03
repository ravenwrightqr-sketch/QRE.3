#!/usr/bin/env node

/** QRE CANONICAL AUTHOR LAW · production architecture guard */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const canonical = "apps/api/src/services/authorBrainCanonical.ts";
const cognition = "apps/api/src/services/authorCognition.ts";
const acceptance = "apps/api/author-acceptance.ts";
const mouth = "apps/api/src/services/authorMouth.ts";
const mouthSeam = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
const legacyMouthSeam = "apps/api/src/services/authorMouthCandidateSearch.ts";
const beamSeam = "apps/api/src/services/authorMouthSequenceBeamSearch.ts";
const experienceRoute = "apps/api/src/routes/experience.ts";
const experienceService = "apps/api/src/services/experienceService.ts";
const packageJsonPath = "apps/api/package.json";

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
  "apps/api/src/services/authorMouthCraft.ts",
  "apps/api/src/services/authorMouthCritic.ts",
  "apps/api/src/services/authorMouthInterpretation.ts",
  "apps/api/src/services/authorMouthSequenceCritic.ts",
];

const forbiddenImports = [
  "authorBrainUniversal",
  "cinematicAuthor",
  "authorBrainMomentum",
  "authorFastCore",
  "creativeRelationOps",
  "authorMouthCraft",
  "authorMouthCritic",
  "authorMouthInterpretation",
  "authorMouthSequenceCritic",
];

const exists = (p) => existsSync(join(root, p));
const read = (p) => readFileSync(join(root, p), "utf8");
function fail(message) { failures.push(message); }

for (const p of [canonical, cognition, acceptance, mouth, mouthSeam, legacyMouthSeam, beamSeam, experienceRoute, experienceService, packageJsonPath]) {
  if (!exists(p)) fail(`Missing canonical file: ${p}`);
}
for (const p of forbiddenFiles) if (exists(p)) fail(`Forbidden legacy Author/Mouth file exists: ${p}`);

if (exists(packageJsonPath)) {
  const pkg = JSON.parse(read(packageJsonPath));
  if (pkg.scripts?.["author:fast"] !== "tsx ./author-acceptance.ts") fail("apps/api author:fast must execute author-acceptance.ts only");
}

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

for (const file of walk(join(root, "apps/api/src"))) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  for (const forbidden of forbiddenImports) {
    if (new RegExp(`from\\s+[\"'][^\"']*${forbidden}\\.js[\"']`).test(body)) fail(`Forbidden Author dependency import in ${rel}: ${forbidden}`);
  }
}

const brainSource = exists(canonical) ? read(canonical) : "";
const mouthSource = exists(mouth) ? read(mouth) : "";
const acceptanceSource = exists(acceptance) ? read(acceptance) : "";
const seamSource = exists(mouthSeam) ? read(mouthSeam) : "";
const legacySeamSource = exists(legacyMouthSeam) ? read(legacyMouthSeam) : "";
const beamSource = exists(beamSeam) ? read(beamSeam) : "";

for (const [re, message] of [
  [/from\s+["'][^"']*authorCognition\.js["']/, "Canonical Author must import authorCognition"],
  [/buildAuthorCognitivePlan\s*\(/, "Canonical Author must execute Cognition"],
  [/buildAuthorRealityGraph\s*\(/, "Canonical Author must compile source truth into RealityGraph"],
  [/buildAuthorRealityEnvelope\s*\(/, "Canonical Author must build the RealityEnvelope"],
  [/buildMouthCandidateMessages\s*\(/, "Canonical Author must build Mouth candidates"],
  [/scoreMouthCandidate\s*\(/, "Canonical Author must score Mouth candidates"],
  [/selectBestMouthSequence\s*\(/, "Canonical Author must select the final Mouth sequence"],
  [/editAttentionSequence\s*\(/, "Canonical Author must run attention editing"],
  [/evaluateSequenceArc\s*\(/, "Canonical Author must run sequence arc evaluation"],
  [/localModelGenerate\s*\(/, "Canonical Author must own model realization"],
]) if (!re.test(brainSource)) fail(message);

if (/compileCognitiveExperience/.test(brainSource)) fail("Canonical Author must not invoke the legacy cognitive compiler");
if (!/authorBrainCanonical\.js/.test(acceptanceSource)) fail("Acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite/.test(acceptanceSource)) fail("Acceptance contains a legacy Author path");

if (!/function\s+sourceLabels\s*\(/.test(mouthSource)) fail("Canonical Mouth must own source-label resolution");
if (!/beat\.eventIds/.test(mouthSource) || !/envelope\.events\.find\s*\(/.test(mouthSource) || !/\.id\s*===\s*id/.test(mouthSource)) fail("Canonical Mouth source provenance must resolve beat event IDs against RealityEnvelope");
for (const [re, message] of [
  [/Reality freedom is LOW\. Framing freedom is HIGH\./, "Canonical Mouth must preserve the truth/framing boundary"],
  [/Grounding is not authorization\./, "Canonical Mouth must distinguish grounding from authorization"],
  [/approved-semantic-realization/, "Canonical Mouth must support approved semantic realization"],
  [/literal-source-restatement/, "Canonical Mouth must preserve a literal source fallback"],
  [/candidate\.inventionRisk/, "Canonical Mouth must evaluate invention risk"],
  [/viewerState\?\.stateShift/, "Canonical Mouth must evaluate supplied viewer-state transition"],
  [/function\s+pathIncrement\s*\(/, "Canonical Mouth must rank sequence paths incrementally"],
  [/candidate\.meaningScore/, "Canonical Mouth sequence ranking must consume candidate meaningScore"],
  [/candidate\.cohesionScore/, "Canonical Mouth sequence ranking must consume candidate cohesion"],
  [/lexicalNovelty/, "Canonical Mouth sequence ranking must account for novelty across the path"],
  [/export function selectBestMouthSequence/, "Canonical Mouth must own sequence selection"],
]) if (!re.test(mouthSource)) fail(message);

if (seamSource && !/from\s+["'][^"']*authorMouth\.js["']/.test(seamSource)) fail("Canonical Mouth seam must re-export from authorMouth.ts");
if (legacySeamSource && !/from\s+["'][^"']*authorMouth\.js["']/.test(legacySeamSource)) fail("Legacy Mouth compatibility seam must re-export from authorMouth.ts");
if (beamSource && !/from\s+["'][^"']*authorMouth\.js["']/.test(beamSource)) fail("Sequence beam compatibility seam must re-export from authorMouth.ts");

const routeSource = exists(experienceRoute) ? read(experienceRoute) : "";
if (!/const\s+sessionId\s*=\s*randomUUID\s*\(\)/.test(routeSource)) fail("Experience compile route must create one sessionId");
if (!/sessionId\s*[:,]/.test(routeSource)) fail("Experience compile route must pass sessionId into compileExperience");

const serviceSource = exists(experienceService) ? read(experienceService) : "";
if (!/sessionId\?:\s*string/.test(serviceSource)) fail("compileExperience must accept an optional sessionId");
if (!/input\.sessionId/.test(serviceSource)) fail("compileExperience must use the request sessionId");
if (!/db\.scanSession\.upsert\s*\(/.test(serviceSource)) fail("compileExperience must persist the authoring scan session");
if (!/input\.sessionId\s*\)/.test(serviceSource)) fail("compileExperience must propagate sessionId into presence context");

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
console.log(`CANONICAL AUTHOR: ${canonical}`);
console.log(`COGNITION: ${cognition}`);
console.log(`MOUTH: ${mouth}`);
console.log(`MOUTH COMPATIBILITY SEAM: ${mouthSeam}`);
console.log(`LEGACY SEARCH SEAM: ${legacyMouthSeam}`);
console.log(`SEQUENCE COMPATIBILITY SEAM: ${beamSeam}`);
console.log(`EXPERIENCE ROUTE: ${experienceRoute}`);
console.log(`EXPERIENCE SERVICE: ${experienceService}`);

for (const message of failures) console.error(`FAIL: ${message}`);
if (failures.length) {
  console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("AUTHOR ARCHITECTURE GUARD GREEN · ONE CANONICAL AUTHOR · ONE COGNITION · ONE MOUTH · COMPATIBILITY SEAMS ONLY");
