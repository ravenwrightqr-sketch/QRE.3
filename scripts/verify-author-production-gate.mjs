#!/usr/bin/env node

/**
 * QRE AUTHOR PRODUCTION GATE
 *
 * Hard repository boundary for the current production Author architecture.
 * One canonical brain, one cognition entrypoint, one Artist authority boundary,
 * one creative realizer, one finished-film judge, one runtime projection path.
 *
 * This gate deliberately protects the architecture that actually exists.
 * Retired Movie Search / micro-Mouth files are forbidden rather than required.
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
    fail(`Forbidden legacy Author import in ${rel}: ${specifier}`);
  }

  if (/localModelGenerate\s*\(/.test(body) && !allowedDirectModelCallers.has(rel)) {
    fail(`Unregistered direct local model caller in production: ${rel}`);
  }
}

const brain = existsSync(join(root, canonicalFiles.brain)) ? read(canonicalFiles.brain) : "";
const cognition = existsSync(join(root, canonicalFiles.cognition)) ? read(canonicalFiles.cognition) : "";
const cognitionModel = existsSync(join(root, canonicalFiles.cognitionModel)) ? read(canonicalFiles.cognitionModel) : "";
const artist = existsSync(join(root, canonicalFiles.artist)) ? read(canonicalFiles.artist) : "";
const lensField = existsSync(join(root, canonicalFiles.lensField)) ? read(canonicalFiles.lensField) : "";
const spine = existsSync(join(root, canonicalFiles.spine)) ? read(canonicalFiles.spine) : "";
const realizer = existsSync(join(root, canonicalFiles.realizer)) ? read(canonicalFiles.realizer) : "";
const judge = existsSync(join(root, canonicalFiles.judge)) ? read(canonicalFiles.judge) : "";
const experienceService = existsSync(join(root, canonicalFiles.experienceService)) ? read(canonicalFiles.experienceService) : "";
const experienceRoute = existsSync(join(root, canonicalFiles.experienceRoute)) ? read(canonicalFiles.experienceRoute) : "";
const acceptance = existsSync(join(root, canonicalFiles.acceptance)) ? read(canonicalFiles.acceptance) : "";

// Brain ownership and handoff.
if (!/authorCognition\.js/.test(brain)) fail("Canonical Author must consume authorCognition");
if (!/buildAuthorCognitivePlan\s*\(/.test(brain)) fail("Canonical Author must execute Cognition");
if (!/buildAuthorRealityGraph\s*\(/.test(brain)) fail("Canonical Author must own the source-truth graph boundary");
if (!/buildAuthorReadout\s*\(/.test(brain)) fail("Canonical Author must build the factual Readout");
if (!/buildAuthorCreativeSpine\s*\(/.test(brain)) fail("Canonical Author must build the Creative Spine");
if (!/realizeAuthorExperience\s*\(/.test(brain)) fail("Canonical Author must invoke the Creative Realizer");
if (!/cognition\.selectedLens/.test(brain)) fail("Canonical Author must consume Artist-selected lens direction");
if (!/Artist receives all possibilities|Artist choice|Artist.*choice/i.test(brain)) {
  fail("Canonical Author must document the Artist authority boundary");
}
if (/authorUniversalMovieSearch|authorMouthCandidateSearchCanonical|authorMouthSequenceBeamSearch|authorRealityEnvelope/.test(brain)) {
  fail("Canonical Author contains retired generation-path references");
}

// Cognition owns semantic discovery and delegates final treatment to Artist.
if (!/authorCognitionUniversal\.js/.test(cognition)) fail("Cognition must consume Universal Cognition");
if (!/searchSatanicoRelations\s*\(/.test(cognition)) fail("Cognition must retain grounded relation discovery");
if (!/chooseArtistDirection\s*\(/.test(cognition)) fail("Cognition must delegate final creative direction to Artist");
if (!/selectedLens:\s*artistChoice\.selectedLens/.test(cognition)) fail("Cognition must return the Artist-selected lens");
if (!/latentMovieCandidates:\s*selectedMovie\s*\?\s*\[selectedMovie\]/.test(cognition)) {
  fail("Cognition must hand only the Artist-selected Movie into realization");
}
if (cognition.includes("authorUniversalMovieSearch.js") || cognition.includes("authorLatentMovieSearch.js")) {
  fail("Cognition contains retired movie-search references");
}

// Universal Cognition may use the local model for cognition; it must not become a second Author.
if (!/export async function buildAuthorCognitivePlan/.test(cognitionModel)) {
  fail("Universal Cognition model layer must expose the canonical cognitive-plan builder");
}
if (!/localModelGenerate\s*\(/.test(cognitionModel)) {
  fail("Universal Cognition model layer must retain its governed local model boundary");
}

// Artist is a real selection boundary, not a deterministic post-filter.
if (!/selectedLens:\s*string/.test(artist)) fail("Artist must expose selectedLens");
if (!/selectedMovieIndex\?:\s*number/.test(artist)) fail("Artist must expose selectedMovieIndex");
if (!/NONE/.test(artist)) fail("Artist must retain NONE as a real creative option");
if (!/Artist.*final|final.*Artist|Artist makes the final/i.test(artist)) fail("Artist must own final direction choice");
if (!/localModelGenerate\s*\(/.test(artist)) fail("Artist must make its direction choice through the governed model boundary");
if (!/attention mechanic/i.test(artist)) fail("Artist must explicitly design an attention mechanic");
if (!/open loop/i.test(artist)) fail("Artist must explicitly consider an open loop");
if (!/forward pull/i.test(artist)) fail("Artist must explicitly optimize for forward pull");
if (!/NONE is a real option/i.test(artist)) fail("Artist must distinguish NONE from a safe default");

// Lens field and Creative Spine remain universal and independent of business services.
if (!/rankCreativeLensCandidates\s*\(/.test(lensField)) fail("Lens Field must rank creative candidates");
if (!/none/i.test(lensField)) fail("Lens Field must keep NONE as a candidate");
if (!/rankCreativeLensCandidates\s*\(/.test(spine)) fail("Creative Spine must consume the Lens Field");

// Creative Realizer is the one place that turns Artist direction into visible language.
if (!/localModelGenerate\s*\(/.test(realizer)) fail("Creative Realizer must own its governed model boundary");
if (!/selectedMovieIndex\?:\s*number/.test(realizer)) fail("Creative Realizer must retain Artist-selected Movie metadata");
if (!/selectedSetIndex\?:\s*number/.test(realizer)) fail("Creative Realizer must retain final visible-set selection metadata");
if (!/judgeRealizedFilm\s*\(/.test(realizer)) fail("Creative Realizer must use the realized-film judge");
if (!/sourceEventIds/.test(realizer)) fail("Creative Realizer must preserve source provenance");
if (!/bounded creative|bounded-creative-bet/i.test(realizer)) fail("Creative Realizer must retain bounded creative framing");
if (!/unsafe-realization/.test(realizer)) fail("Creative Realizer must retain hard unsafe realization rejection");

if (!/RealizedFilmJudgment/.test(judge)) fail("Realized-film judge must expose RealizedFilmJudgment");
if (!/truth|grounded|provenance/i.test(judge)) fail("Realized-film judge must retain truth/provenance evaluation");

// Persistence must remain around the canonical Author adapter.
if (!/authorBrainCanonical\.js/.test(experienceService)) fail("Experience service must invoke the canonical Author");
if (!/experienceStateToMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must persist Author experience state into memory");
if (!/buildExperienceMemoryBatch\s*\(/.test(experienceService)) fail("Experience service must persist the RealityGraph memory batch");
if (!/input\.assetId/.test(experienceService) || !/input\.sessionId/.test(experienceService)) {
  fail("Experience service must retain asset/session identity around Author persistence");
}
if (!/compileExperience\s*\(/.test(experienceRoute)) fail("Experience route must reach the canonical Experience service path");

// Acceptance must exercise the same Brain used by production.
if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Canonical acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite|authorUniversalMovieSearch|authorMouthCandidateSearchCanonical/.test(acceptance)) {
  fail("Canonical acceptance contains a retired Author path");
}

console.log("=== QRE AUTHOR PRODUCTION GATE ===");
console.log("CANONICAL: RealityGraph -> Readout -> Cognition -> Artist -> Creative Spine -> Creative Realizer -> Sequence");
console.log("AUTHORITY: Artist chooses direction; Realizer owns visible language");
console.log("ATTENTION: Artist designs hook/open-loop/escalation/payoff pressure");
console.log("PERSISTENCE: Author state + RealityGraph remain part of the production path");
console.log("TRUTH: retired creative paths are forbidden, not required");

for (const failure of failures) console.error(`FAIL: ${failure}`);

if (failures.length) {
  console.error(`AUTHOR PRODUCTION GATE FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR PRODUCTION GATE GREEN · CURRENT CANONICAL PATH PROTECTED · LEGACY BLOCKED");
