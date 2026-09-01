#!/usr/bin/env node

/**
 * QRE AUTHOR PRODUCTION GATE
 *
 * Hard repository boundary for production Author.
 * One brain, one movie owner, one generative Mouth. Compatibility shims may
 * exist for tests, but production source may not import alternate generators.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];

const canonicalFiles = {
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  cognition: "apps/api/src/services/authorCognition.ts",
  movieSearch: "apps/api/src/services/authorUniversalMovieSearch.ts",
  differentiation: "apps/api/src/services/authorMovieDifferentiation.ts",
  realityGraph: "apps/api/src/services/authorRealityGraph.ts",
  realityEnvelope: "apps/api/src/services/authorRealityEnvelope.ts",
  creativeInterpretation: "apps/api/src/services/authorCreativeInterpretation.ts",
  thesis: "apps/api/src/services/authorLatentStoryThesis.ts",
  mouth: "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  beam: "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
  experienceService: "apps/api/src/services/experienceService.ts",
  experienceRoute: "apps/api/src/routes/experience.ts",
  acceptance: "apps/api/author-acceptance.ts",
};

const forbiddenFiles = [
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/cinematicAuthor.ts",
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/authorBrainMomentum.ts",
  "apps/api/src/services/authorBrainMomentumV2.ts",
  "apps/api/src/services/authorBrainMomentumV3.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
  "apps/api/src/services/authorCumulativeMeaning.ts",
  "apps/api/src/services/authorLatentMovieBeatAdapter.ts",
  "apps/api/src/services/authorMouthAttentionGate.ts",
  "apps/api/src/services/authorMouthGroundedFallback.ts",
  "apps/api/src/services/authorMouthLanguageGate.ts",
  "apps/api/src/services/authorMouthQualityAdapter.ts",
  "apps/api/src/services/authorMouthRepairPlanner.ts",
  "apps/api/src/services/authorMouthMonster.ts",
  "apps/api/src/services/authorMemoryIntelligence.ts",
  "apps/api/src/services/microBeatMouth.ts",
];

const forbiddenLegacyImportBasenames = new Set([
  "authorBrainUniversal.js",
  "cinematicAuthor.js",
  "authorBrain.js",
  "authorBrainMomentum.js",
  "authorBrainMomentumV2.js",
  "authorBrainMomentumV3.js",
  "authorFastCore.js",
  "creativeRelationOps.js",
  "microBeatMouth.js",
  "authorLatentMovieSearch.js",
  "authorLatentMovieBeatAdapter.js",
  "authorMouthAttentionGate.js",
  "authorMouthGroundedFallback.js",
  "authorMouthLanguageGate.js",
  "authorMouthQualityAdapter.js",
  "authorMouthRepairPlanner.js",
  "authorMouthMonster.js",
  "authorMemoryIntelligence.js",
  "authorCumulativeMeaning.js",
]);

const allowedDirectModelCallers = new Set([
  "apps/api/src/services/aiProvider.ts",
  "apps/api/src/services/authorBeatTruthGate.ts",
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorMouthCritic.ts",
  "apps/api/src/services/authorMouthSequenceCritic.ts",
  "apps/api/src/services/localModelRuntime.ts",
  "apps/api/src/services/creativeSeedEngine.ts",
]);

const reviewOnlyFiles = new Set();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
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

for (const [role, path] of Object.entries(canonicalFiles)) {
  if (!existsSync(join(root, path))) fail(`Missing canonical ${role}: ${path}`);
}

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) fail(`Retired/forbidden production file exists: ${path}`);
}

const productionFiles = walk(join(root, "apps/api/src"))
  .filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));

for (const file of productionFiles) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");

  const importRegex = /(?:from\s+|import\s*\()(["'])([^"']+)\1/g;
  let match;
  while ((match = importRegex.exec(body)) !== null) {
    const specifier = match[2];
    const basename = specifier.split("/").pop() ?? specifier;
    if (!forbiddenLegacyImportBasenames.has(basename)) continue;

    const legacyMouthShimOnly =
      basename === "authorMouthCandidateSearch.js" &&
      rel === "apps/api/src/services/authorBrainCanonical.ts" &&
      /deriveViewerStateCut/.test(body);

    const testOnlyAcceptance = reviewOnlyFiles.has(rel);

    if (!legacyMouthShimOnly && !testOnlyAcceptance) {
      fail(`Forbidden legacy Author import in ${rel}: ${specifier}`);
    }
  }

  if (/localModelGenerate\s*\(/.test(body) && !allowedDirectModelCallers.has(rel)) {
    fail(`Unregistered direct local model caller in production: ${rel}`);
  }
}

const brain = existsSync(join(root, canonicalFiles.brain)) ? read(canonicalFiles.brain) : "";
const cognition = existsSync(join(root, canonicalFiles.cognition)) ? read(canonicalFiles.cognition) : "";
const mouth = existsSync(join(root, canonicalFiles.mouth)) ? read(canonicalFiles.mouth) : "";
const movieSearch = existsSync(join(root, canonicalFiles.movieSearch)) ? read(canonicalFiles.movieSearch) : "";
const experienceService = existsSync(join(root, canonicalFiles.experienceService)) ? read(canonicalFiles.experienceService) : "";
const acceptance = existsSync(join(root, canonicalFiles.acceptance)) ? read(canonicalFiles.acceptance) : "";
const mouthShimPath = "apps/api/src/services/authorMouthCandidateSearch.ts";
const mouthShim = existsSync(join(root, mouthShimPath)) ? read(mouthShimPath) : "";

if (!/authorCognition\.js/.test(brain)) fail("Canonical Author must consume authorCognition");
if (!/buildAuthorCognitivePlan\s*\(/.test(brain)) fail("Canonical Author must execute Cognition");
if (!/buildAuthorRealityGraph\s*\(/.test(brain)) fail("Canonical Author must own the source-truth graph boundary");
if (!/buildAuthorRealityEnvelope\s*\(/.test(brain)) fail("Canonical Author must build the RealityEnvelope");
if (!/buildMouthCandidateMessages\s*\(/.test(brain)) fail("Canonical Author must invoke canonical Mouth generation");
if (!/selectBestMouthSequence\s*\(/.test(brain)) fail("Canonical Author must select the final Mouth sequence");
if (!/deriveViewerStateCut/.test(brain)) fail("Canonical Author must retain the canonical viewer-state cut boundary");
if (/compileCognitiveExperience/.test(brain)) fail("Legacy cognitive compiler is forbidden from Canonical Author");

if (!/authorUniversalMovieSearch\.js/.test(cognition)) fail("Cognition must own Universal Movie Search");
if (/authorLatentMovieSearch\.js/.test(cognition)) fail("Cognition still references legacy latent movie search");
if (!/searchUniversalMovieCandidates\s*\(/.test(cognition)) fail("Cognition must call searchUniversalMovieCandidates");
if (!/selectDistinctMovieCandidates\s*\(/.test(cognition)) fail("Cognition must retain movie differentiation");
if (!/rerankByViewerState\s*\(/.test(cognition)) fail("Cognition must retain viewer-state reranking");

if (!/buildSystemPrompt\s*\(/.test(mouth)) fail("Canonical Mouth must own its generation prompt");
if (!/FEEL IT\. DO NOT EXPLAIN IT\./i.test(mouth)) fail("Canonical Mouth must preserve the feel-not-explain law");
if (!/exactly three materially different variants per beat/i.test(mouth)) fail("Canonical Mouth must demand materially different variants");
if (!/bounded-creative-bet/.test(mouth)) fail("Canonical Mouth must retain bounded creative framing");
if (!/unsafe-realization/.test(mouth)) fail("Canonical Mouth must retain a hard unsafe realization outcome");
if (!/observerDiscoveryScore/.test(mouth)) fail("Canonical Mouth must produce observer-discovery quality");
if (/authorMouthLanguageGate|authorMouthQualityAdapter|authorMouthAttentionGate|authorMouthGroundedFallback/.test(mouth)) fail("Canonical Mouth still depends on retired Mouth services");

if (mouthShim) {
  if (/localModelGenerate|evaluateCandidate|buildGoldRealizationDoctrine/.test(mouthShim)) {
    fail("Compatibility Mouth shim still contains generative/scoring implementation");
  }
  if (!/authorMouthCandidateSearchCanonical\.js/.test(mouthShim) || !/authorViewerStateCut\.js/.test(mouthShim)) {
    fail("Compatibility Mouth shim must only point at canonical Mouth/viewer-state owners");
  }
}

if (!/forwardScore\s*\(/.test(movieSearch)) fail("Universal Movie Search must score forward movement");
if (!/statePair\s*\(/.test(movieSearch)) fail("Universal Movie Search must discover state transformations");
if (!/buildTrajectory\s*\(/.test(movieSearch)) fail("Universal Movie Search must build an evidence-backed trajectory");
if (!/payoff/.test(movieSearch)) fail("Universal Movie Search must preserve a payoff endpoint");
if (/trajectory\.at\(\-1\)/.test(movieSearch)) fail("Universal Movie Search must remain compatible with the repository TypeScript target");

if (!/authorExperienceStateToMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must persist Author experience state into memory");
if (!/buildExperienceMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must persist the RealityGraph memory batch");
if (!/input\.assetId/.test(experienceService) || !/input\.sessionId/.test(experienceService)) fail("Experience service must retain asset/session identity around Author persistence");

if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Canonical acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite/.test(acceptance)) fail("Canonical acceptance contains a legacy Author path");
if (!/result\.sequence\.cuts\.length > 0 \? 1 : 0/.test(acceptance)) fail("Fast Author acceptance must allow exactly one canonical Mouth model realization request when a sequence exists");

for (const reviewOnly of reviewOnlyFiles) {
  if (!existsSync(join(root, reviewOnly))) continue;
  warn(`REVIEW-ONLY: ${reviewOnly}`);
}

console.log("=== QRE AUTHOR PRODUCTION GATE ===");
console.log("CANONICAL: authorBrainCanonical -> authorCognition -> universal movie search -> canonical Mouth -> sequence");
console.log("PERSISTENCE: Author state + RealityGraph remain part of the production path");
console.log("TRUTH: retired/duplicate Author generators are forbidden from production");

for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const failure of failures) console.error(`FAIL: ${failure}`);

if (failures.length) {
  console.error(`AUTHOR PRODUCTION GATE FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR PRODUCTION GATE GREEN · ONE PATH · ONE MOUTH · PERSISTENCE PROTECTED · LEGACY BLOCKED");
