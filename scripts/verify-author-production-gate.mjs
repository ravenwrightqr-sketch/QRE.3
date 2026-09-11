#!/usr/bin/env node

/**
 * QRE AUTHOR PRODUCTION GATE
 *
 * Protect the CURRENT canonical Author architecture rather than retired
 * Movie Search / micro-Mouth implementations.
 *
 * RealityGraph -> Readout -> Cognition -> Artist -> Creative Spine ->
 * Creative Realizer -> Sequence -> Experience service persistence.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const canonicalFiles = {
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  cognition: "apps/api/src/services/authorCognition.ts",
  cognitionModel: "apps/api/src/services/authorCognitionUniversal.ts",
  artist: "apps/api/src/services/authorArtistChoice.ts",
  lensField: "apps/api/src/services/authorCreativeLens.ts",
  spine: "apps/api/src/services/authorCreativeSpine.ts",
  realizer: "apps/api/src/services/authorCreativeRealizer.ts",
  judge: "apps/api/src/services/authorRealizedFilmJudge.ts",
  realityGraph: "apps/api/src/services/authorRealityGraph.ts",
  experienceService: "apps/api/src/services/experienceService.ts",
  experienceRoute: "apps/api/src/routes/experience.ts",
  acceptance: "apps/api/author-acceptance.ts",
};

const forbiddenFiles = [
  "apps/api/src/services/authorUniversalMovieSearch.ts",
  "apps/api/src/services/authorMovieDifferentiation.ts",
  "apps/api/src/services/authorRealityEnvelope.ts",
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
  "apps/api/src/services/authorCreativeInterpretation.ts",
  "apps/api/src/services/authorLatentStoryThesis.ts",
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
  "authorMouthCandidateSearchCanonical.js",
  "authorMouthSequenceBeamSearch.js",
  "authorMouthAttentionGate.js",
  "authorMouthGroundedFallback.js",
  "authorMouthLanguageGate.js",
  "authorMouthQualityAdapter.js",
  "authorMouthRepairPlanner.js",
  "authorMouthMonster.js",
  "authorMemoryIntelligence.js",
  "authorCumulativeMeaning.js",
  "authorUniversalMovieSearch.js",
  "authorMovieDifferentiation.js",
  "authorRealityEnvelope.js",
]);

const allowedDirectModelCallers = new Set([
  "apps/api/src/services/authorArtistChoice.ts",
  "apps/api/src/services/authorCognitionUniversal.ts",
  "apps/api/src/services/authorCreativeRealizer.ts",
  "apps/api/src/services/authorInformationFinder.ts",
  "apps/api/src/services/websiteLearning.ts",
  "apps/api/src/services/authorMouthCritic.ts",
  "apps/api/src/services/authorMouthSequenceCritic.ts",
  "apps/api/src/services/aiProvider.ts",
  "apps/api/src/services/authorBeatTruthGate.ts",
  "apps/api/src/services/creativeSeedEngine.ts",
  "apps/api/src/services/localModelRuntime.ts",
]);

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fail(message) {
  failures.push(message);
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

for (const file of walk(join(root, "apps/api/src")).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file))) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  const importRegex = /(?:from\s+|import\s*\()(["'])([^"']+)\1/g;
  let match;
  while ((match = importRegex.exec(body)) !== null) {
    const basename = match[2].split("/").pop() ?? match[2];
    if (forbiddenLegacyImportBasenames.has(basename)) {
      fail(`Forbidden legacy Author import in ${rel}: ${match[2]}`);
    }
  }
  if (/localModelGenerate\s*\(/.test(body) && !allowedDirectModelCallers.has(rel)) {
    fail(`Unregistered direct local model caller in production: ${rel}`);
  }
}

const brain = read(canonicalFiles.brain);
const cognition = read(canonicalFiles.cognition);
const cognitionModel = read(canonicalFiles.cognitionModel);
const artist = read(canonicalFiles.artist);
const lensField = read(canonicalFiles.lensField);
const spine = read(canonicalFiles.spine);
const realizer = read(canonicalFiles.realizer);
const judge = read(canonicalFiles.judge);
const experienceService = read(canonicalFiles.experienceService);
const experienceRoute = read(canonicalFiles.experienceRoute);
const acceptance = read(canonicalFiles.acceptance);

// Canonical Author ownership and handoff.
if (!/authorCognition\.js/.test(brain)) fail("Canonical Author must consume authorCognition");
if (!/buildAuthorCognitivePlan\s*\(/.test(brain)) fail("Canonical Author must execute Cognition");
if (!/buildAuthorRealityGraph\s*\(/.test(brain)) fail("Canonical Author must own the RealityGraph boundary");
if (!/buildAuthorReadout\s*\(/.test(brain)) fail("Canonical Author must build the factual Readout");
if (!/buildAuthorCreativeSpine\s*\(/.test(brain)) fail("Canonical Author must build the Creative Spine");
if (!/realizeAuthorExperience\s*\(/.test(brain)) fail("Canonical Author must invoke the Creative Realizer");
if (!/cognition\.selectedLens/.test(brain)) fail("Canonical Author must consume Artist-selected lens direction");
if (!/Artist receives all possibilities|Artist choice|Artist.*choice/i.test(brain)) fail("Canonical Author must document Artist authority");
if (/authorUniversalMovieSearch|authorMouthCandidateSearchCanonical|authorMouthSequenceBeamSearch|authorRealityEnvelope/.test(brain)) fail("Canonical Author contains a retired generation path");

// Cognition and Artist authority.
if (!/authorCognitionUniversal\.js/.test(cognition)) fail("Cognition must consume Universal Cognition");
if (!/searchSatanicoRelations\s*\(/.test(cognition)) fail("Cognition must retain grounded relation discovery");
if (!/chooseArtistDirection\s*\(/.test(cognition)) fail("Cognition must delegate final creative direction to Artist");
if (!/selectedLens:\s*artistChoice\.selectedLens/.test(cognition)) fail("Cognition must return the Artist-selected lens");
if (!/latentMovieCandidates:\s*selectedMovie\s*\?\s*\[selectedMovie\]/.test(cognition)) fail("Cognition must hand only the Artist-selected Movie into realization");
if (!/export async function buildAuthorCognitivePlan/.test(cognitionModel)) fail("Universal Cognition must expose the cognitive-plan builder");
if (!/localModelGenerate\s*\(/.test(cognitionModel)) fail("Universal Cognition must retain its governed model boundary");
if (!/selectedLens:\s*string/.test(artist)) fail("Artist must expose selectedLens");
if (!/selectedMovieIndex\?:\s*number/.test(artist)) fail("Artist must expose selectedMovieIndex");
if (!/NONE/.test(artist)) fail("Artist must retain NONE as a real option");
if (!/Artist.*final|final.*Artist|Artist makes the final/i.test(artist)) fail("Artist must own final direction choice");
if (!/localModelGenerate\s*\(/.test(artist)) fail("Artist must use the governed model boundary");

// Universal Lens Field and Creative Spine.
if (!/rankCreativeLensCandidates\s*\(/.test(lensField)) fail("Lens Field must rank creative candidates");
if (!/none/i.test(lensField)) fail("Lens Field must retain NONE");
if (!/rankCreativeLensCandidates\s*\(/.test(spine)) fail("Creative Spine must consume the Lens Field");

// Realizer owns visible language; judge remains diagnostic only.
if (!/localModelGenerate\s*\(/.test(realizer)) fail("Creative Realizer must own its governed model boundary");
if (!/selectedMovieIndex\?:\s*number/.test(realizer)) fail("Creative Realizer must retain Artist-selected Movie metadata");
if (!/selectedSetIndex\?:\s*number/.test(realizer)) fail("Creative Realizer must retain visible-set selection metadata");
if (!/judgeRealizedFilm\s*\(/.test(realizer)) fail("Creative Realizer must use the realized-film judge");
if (!/sourceEventIds/.test(realizer)) fail("Creative Realizer must preserve source provenance");
if (!/creativePermission\s*:/.test(realizer) || !/truthRule\s*:/.test(realizer)) fail("Creative Realizer must retain bounded creative framing and truth rules");
if (!/RealizedFilmJudgment/.test(judge)) fail("Realized-film judge must expose RealizedFilmJudgment");
if (!/inventionRisk/.test(judge) || !/unsupported concrete material/i.test(judge)) fail("Realized-film judge must hard-reject unsupported concrete material");

// Production adapter + persistence.
if (!/authorBrainCanonical\.js/.test(experienceService)) fail("Experience service must invoke the canonical Author");
if (!/experienceStateToMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must persist Author experience state into memory");
if (!/buildExperienceMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must persist the RealityGraph memory batch");
if (!/input\.assetId/.test(experienceService) || !/input\.sessionId/.test(experienceService)) fail("Experience service must retain asset/session identity around persistence");
if (!/compileExperience\s*\(/.test(experienceRoute) || !/from \"\.\.\/services\/experienceService\.js\"/.test(experienceRoute)) fail("Experience route must reach the canonical Experience service path");

// Acceptance exercises the same Brain as production.
if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Canonical acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite|authorUniversalMovieSearch|authorMouthCandidateSearchCanonical/.test(acceptance)) fail("Canonical acceptance contains a retired Author path");

console.log("=== QRE AUTHOR PRODUCTION GATE ===");
console.log("CANONICAL: RealityGraph -> Readout -> Cognition -> Artist -> Creative Spine -> Creative Realizer -> Sequence");
console.log("AUTHORITY: Artist chooses direction; Realizer owns visible language");
console.log("PERSISTENCE: Author state + RealityGraph remain part of the production path");
console.log("TRUTH: retired creative paths are forbidden, not required");

for (const failure of failures) console.error(`FAIL: ${failure}`);

if (failures.length) {
  console.error(`AUTHOR PRODUCTION GATE FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR PRODUCTION GATE GREEN · CURRENT CANONICAL PATH PROTECTED · LEGACY BLOCKED");
