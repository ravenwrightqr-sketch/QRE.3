#!/usr/bin/env node

/**
 * QRE AUTHOR PRODUCTION GATE
 *
 * Hard repository boundary for the live canonical Author path.
 * One brain, one cognition entrypoint, one Artist realization boundary.
 * Retired implementations and duplicate creative paths are forbidden.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];

const canonicalFiles = {
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  cognition: "apps/api/src/services/authorCognition.ts",
  cognitionModel: "apps/api/src/services/authorCognitionUniversal.ts",
  realityGraph: "apps/api/src/services/authorRealityGraph.ts",
  creativeSpine: "apps/api/src/services/authorCreativeSpine.ts",
  creativeRealizer: "apps/api/src/services/authorCreativeRealizer.ts",
  artistImplementation: "apps/api/src/services/authorBeastRealizer.ts",
  readout: "apps/api/src/services/authorReadout.ts",
  experienceService: "apps/api/src/services/experienceService.ts",
  experienceRoute: "apps/api/src/routes/experience.ts",
  memoryProjection: "apps/api/src/services/memoryProjection.ts",
  acceptance: "apps/api/author-acceptance.ts",
};

const forbiddenFiles = [
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/authorBrainMomentum.ts",
  "apps/api/src/services/authorBrainMomentumV2.ts",
  "apps/api/src/services/authorBrainMomentumV3.ts",
  "apps/api/src/services/cinematicAuthor.ts",
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
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
  "apps/api/src/services/authorRealityEnvelope.ts",
  "apps/api/src/services/authorUniversalMovieSearch.ts",
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
  "authorMouthCandidateSearchCanonical.js",
  "authorMouthSequenceBeamSearch.js",
  "authorRealityEnvelope.js",
  "authorUniversalMovieSearch.js",
]);

/**
 * Direct local-model callers are intentionally allowlisted at real boundaries.
 * Cognition may ask the model for hypotheses; the Artist may ask it for visible
 * language; perception/learning adapters may use the model to interpret supplied
 * artifacts. The gate blocks every other production caller.
 */
const allowedDirectModelCallers = new Set([
  "apps/api/src/services/aiProvider.ts",
  "apps/api/src/services/localModelRuntime.ts",
  "apps/api/src/services/realityEngine.ts",
  "apps/api/src/services/authorBeatTruthGate.ts",
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorCognitionUniversal.ts",
  "apps/api/src/services/authorCreativeRealizer.ts",
  "apps/api/src/services/authorBeastRealizer.ts",
  "apps/api/src/services/authorMouthCritic.ts",
  "apps/api/src/services/authorMouthSequenceCritic.ts",
  "apps/api/src/services/creativeSeedEngine.ts",
  "apps/api/src/services/authorInformationFinder.ts",
  "apps/api/src/services/documentKnowledge.ts",
  "apps/api/src/services/websiteLearning.ts",
  "apps/api/src/services/recognition/recognitionEngine.ts",
]);

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
    if (forbiddenLegacyImportBasenames.has(basename)) {
      fail(`Forbidden legacy Author import in ${rel}: ${specifier}`);
    }
  }

  if (/localModelGenerate\s*\(/.test(body) && !allowedDirectModelCallers.has(rel)) {
    fail(`Unregistered direct local model caller in production: ${rel}`);
  }
}

const brain = existsSync(join(root, canonicalFiles.brain)) ? read(canonicalFiles.brain) : "";
const cognition = existsSync(join(root, canonicalFiles.cognition)) ? read(canonicalFiles.cognition) : "";
const cognitionModel = existsSync(join(root, canonicalFiles.cognitionModel)) ? read(canonicalFiles.cognitionModel) : "";
const creativeSpine = existsSync(join(root, canonicalFiles.creativeSpine)) ? read(canonicalFiles.creativeSpine) : "";
const realizer = existsSync(join(root, canonicalFiles.creativeRealizer)) ? read(canonicalFiles.creativeRealizer) : "";
const artistImplementation = existsSync(join(root, canonicalFiles.artistImplementation)) ? read(canonicalFiles.artistImplementation) : "";
const experienceService = existsSync(join(root, canonicalFiles.experienceService)) ? read(canonicalFiles.experienceService) : "";
const memoryProjection = existsSync(join(root, canonicalFiles.memoryProjection)) ? read(canonicalFiles.memoryProjection) : "";
const acceptance = existsSync(join(root, canonicalFiles.acceptance)) ? read(canonicalFiles.acceptance) : "";
const artistBoundarySource = `${realizer}\n${artistImplementation}`;

// Canonical orchestrator ownership.
if (!/authorCognition\.js/.test(brain)) fail("Canonical Author must consume authorCognition");
if (!/buildAuthorCognitivePlan\s*\(/.test(brain)) fail("Canonical Author must execute Cognition");
if (!/buildAuthorRealityGraph\s*\(/.test(brain)) fail("Canonical Author must own the RealityGraph boundary");
if (!/buildAuthorCreativeSpine\s*\(/.test(brain)) fail("Canonical Author must construct the Creative Spine");
if (!/realizeAuthorExperience\s*\(/.test(brain)) fail("Canonical Author must cross the Artist realization boundary");
if (!/buildAuthorReadout\s*\(/.test(brain)) fail("Canonical Author must produce the factual Readout");
if (/compileCognitiveExperience/.test(brain)) fail("Legacy cognitive compiler is forbidden from Canonical Author");

// Cognition owns semantic possibility discovery. The public cognition module is
// the canonical wrapper and the universal implementation supplies model-backed
// hypotheses plus grounded relation candidates.
if (!/authorCognitionUniversal\.js/.test(cognition)) fail("Cognition must delegate semantic discovery to the canonical universal cognition implementation");
if (!/buildUniversalCognitivePlan\s*\(/.test(cognition)) fail("Cognition wrapper must execute the universal cognitive plan");
if (!/localModelGenerate\s*\(/.test(cognitionModel)) fail("Universal cognition must own model-backed hypothesis discovery");
if (!/groundedObservationCandidates\s*\(/.test(cognitionModel)) fail("Cognition must perform grounded relationship discovery");
if (!/latentMovieCandidates/.test(cognitionModel)) fail("Cognition must return semantic movie possibilities");
if (!/validIds\s*\(/.test(cognitionModel) || !/anchorEventIds/.test(cognitionModel)) fail("Cognition must enforce grounded candidate provenance");
if (!/dedupe\s*\(/.test(cognitionModel)) fail("Cognition must differentiate/dedupe semantic candidates");
if (!/buildAuthorCognitivePlan\s*\(/.test(cognitionModel)) fail("Canonical cognition model adapter is missing its cognitive plan entrypoint");

// Artist/Creative Realizer is the sole visible-language boundary. The public
// boundary is intentionally a thin delegation layer; the Beast implementation
// owns the model call and finished-film validation.
if (!/realizeAuthorExperience/.test(realizer) || !/authorBeastRealizer\.js/.test(realizer)) fail("Creative Realizer boundary must delegate visible realization to the Artist implementation");
if (!/function\s+realizeAuthorExperience\s*\(/.test(artistImplementation)) fail("Artist implementation must own model-backed visible-language realization");
if (!/localModelGenerate\s*\(/.test(artistBoundarySource)) fail("Artist boundary must own model-backed visible-language realization");
if (!/validateScenes\s*\(/.test(artistImplementation)) fail("Artist must validate complete film sets before acceptance");
if (!/sourceEventIds/.test(artistImplementation) || !/validSourceIds\s*\(/.test(artistImplementation)) fail("Artist must bind finished language back to supplied reality");
if (!/INTERNAL/.test(artistImplementation) || !/EXPLAINING/.test(artistImplementation)) fail("Artist must block internal-architecture and explanatory leakage");
if (!/selectedMovieIndex/.test(artistImplementation) || !/selectedSetIndex/.test(artistImplementation)) fail("Artist must retain Artist selection state");
if (!/judgeRealizedFilm\s*\(/.test(artistImplementation)) warn("Artist film judgment is not mechanically visible; rely on the acceptance suite");
if (/authorMouthLanguageGate|authorMouthQualityAdapter|authorMouthAttentionGate|authorMouthGroundedFallback|authorMouthRepairPlanner|authorMouthMonster/.test(artistBoundarySource)) {
  fail("Artist realization still depends on retired Mouth services");
}

// Creative Spine remains an internal semantic-to-artistic preparation layer;
// it may derive opportunities, but it cannot become a second truth source.
if (!/graph/.test(creativeSpine)) fail("Creative Spine must operate from the RealityGraph");
if (!/opportunities/.test(creativeSpine)) fail("Creative Spine must retain derived creative opportunities");

// Durable memory remains outside the canonical Author brain and is persisted
// by the Experience adapter from the canonical RealityGraph.
if (!/buildExperienceMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must build the canonical RealityGraph memory batch");
if (!/memoryRepository\.writeBatch\s*\(/.test(experienceService)) fail("Experience service must persist Author memory through the memory repository");
if (!/authorBrainCanonical\s*\(/.test(experienceService)) fail("Experience service must call the canonical Author");
if (!/sessionId/.test(experienceService) || !/assetId/.test(experienceService)) fail("Experience service must retain asset/session identity around Author persistence");
if (!/export function buildExperienceMemoryBatch\s*\(/.test(memoryProjection)) fail("Memory projection must own the RealityGraph persistence batch builder");

// Canonical acceptance must exercise the live brain directly.
if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Canonical acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite/.test(acceptance)) fail("Canonical acceptance contains a legacy Author path");

console.log("=== QRE AUTHOR PRODUCTION GATE ===");
console.log("CANONICAL: RealityGraph -> Cognition -> Creative Spine -> Artist / Creative Realizer -> Sequence");
console.log("PERSISTENCE: Experience service -> RealityGraph memory projection -> durable memory");
console.log("TRUTH: supplied reality is authoritative; Artist owns visible treatment");
console.log("BOUNDARY: retired Author/Mouth/Movie implementations are forbidden");

for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const failure of failures) console.error(`FAIL: ${failure}`);

if (failures.length) {
  console.error(`AUTHOR PRODUCTION GATE FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR PRODUCTION GATE GREEN · ONE CANONICAL AUTHOR · ARTIST REALIZATION PROTECTED · MEMORY PERSISTENCE PROTECTED · LEGACY BLOCKED");