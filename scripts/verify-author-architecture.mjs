#!/usr/bin/env node

/**
 * QRE CANONICAL AUTHOR LAW
 *
 * This guard validates the architecture that actually exists.
 * It protects ownership boundaries instead of freezing historical filenames.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];

const required = [
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorCognitionUniversal.ts",
  "apps/api/src/services/authorArtistChoice.ts",
  "apps/api/src/services/authorCreativeLens.ts",
  "apps/api/src/services/authorCreativeSpine.ts",
  "apps/api/src/services/authorCreativeRealizer.ts",
  "apps/api/src/services/authorRealizedFilmJudge.ts",
  "apps/api/src/services/authorRealityGraph.ts",
  "apps/api/src/services/authorReadout.ts",
  "apps/api/author-acceptance.ts",
  "apps/api/src/routes/experience.ts",
  "apps/api/src/services/experienceService.ts",
  "apps/api/package.json",
];

const forbiddenFiles = [
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorBrainUniversal.ts.new",
  "apps/api/src/services/cinematicAuthor.ts",
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/authorBrainMomentum.ts",
  "apps/api/src/services/authorBrainMomentumV2.ts",
  "apps/api/src/services/authorBrainMomentumV3.ts",
  "apps/api/src/services/authorLatentStoryThesis.ts",
  "apps/api/src/services/authorCreativeInterpretation.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
  "apps/api/author-acceptance-suite.ts",
];

const forbiddenImports = [
  "authorBrainUniversal",
  "cinematicAuthor",
  "authorBrainMomentum",
  "authorFastCore",
  "creativeRelationOps",
];

const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => failures.push(message);

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

for (const path of required) {
  if (!existsSync(join(root, path))) fail(`Missing canonical file: ${path}`);
}

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) fail(`Forbidden legacy Author file exists: ${path}`);
}

const sourceFiles = walk(join(root, "apps/api/src")).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
for (const file of sourceFiles) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  for (const forbidden of forbiddenImports) {
    if (new RegExp(`from\\s+["'][^"']*${forbidden}\\.js["']`).test(body)) {
      fail(`Forbidden Author dependency import in ${rel}: ${forbidden}`);
    }
  }
}

const brain = read(required[0]);
const cognition = read(required[1]);
const universal = read(required[2]);
const artist = read(required[3]);
const lens = read(required[4]);
const spine = read(required[5]);
const realizer = read(required[6]);
const judge = read(required[7]);
const acceptance = read(required[10]);

for (const pattern of [
  /buildAuthorRealityGraph\s*\(/,
  /buildAuthorReadout\s*\(/,
  /buildAuthorCognitivePlan\s*\(/,
  /buildAuthorCreativeSpine\s*\(/,
  /realizeAuthorExperience\s*\(/,
]) {
  if (!pattern.test(brain)) fail(`Canonical Author missing required stage: ${pattern}`);
}

if (!/cognition\.selectedLens/.test(brain)) fail("Canonical Author must consume Artist-selected lens");
if (!/cognition\.selectedMovie/.test(brain) && !/latentMovieCandidates/.test(cognition)) {
  fail("Canonical Author must preserve the Artist-selected Movie across the handoff");
}
if (!/selectedMovie\s*\?\s*\[selectedMovie\]/.test(cognition)) {
  fail("Cognition must hand downstream only the Artist-selected Movie");
}
if (!/chooseArtistDirection\s*\(/.test(cognition)) fail("Cognition must execute Artist direction choice");
if (!/selectedLens:\s*artistChoice\.selectedLens/.test(cognition)) fail("Cognition must return Artist-selected lens");
if (!/selectedMovieIndex/.test(artist)) fail("Artist choice must expose selectedMovieIndex");
if (!/selectedLens/.test(artist)) fail("Artist choice must expose selectedLens");
if (!/NONE/.test(artist)) fail("Artist choice must treat NONE as a real lens competitor");
if (!/rankCreativeLensCandidates\s*\(/.test(lens)) fail("Lens field must rank creative lens candidates");
if (!/NONE/.test(lens)) fail("Lens field must retain NONE");
if (!/rankCreativeLensCandidates\s*\(/.test(spine)) fail("Creative Spine must consume the lens field");
if (!/lensCandidates/.test(spine)) fail("Creative Spine must expose lens candidates");
if (!/localModelGenerate\s*\(/.test(realizer)) fail("Creative Realizer must own model realization");
if (!/selectedMovieIndex/.test(realizer)) fail("Creative Realizer must preserve selected Movie metadata");
if (!/selectedSetIndex/.test(realizer)) fail("Creative Realizer must preserve Artist film selection");
if (!/judgeRealizedFilm\s*\(/.test(realizer)) fail("Creative Realizer must use the realized-film judge as diagnostic evaluation");
if (!/sourceEventIds/.test(realizer)) fail("Creative Realizer must preserve source provenance");
if (!/RealizedFilmJudgment/.test(judge)) fail("Realized-film judgment contract must remain canonical");
if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite/.test(acceptance)) fail("Acceptance contains a legacy Author path");

/* Business/catalog/knowledge remain outside the universal Author boundary. */
const boundaryFiles = [brain, cognition, universal, artist, lens, spine, realizer];
for (const body of boundaryFiles) {
  if (/(?:catalogVision|knowledgeIntake|catalog[A-Z]|business[A-Z])/i.test(body)) {
    fail("Universal Author boundary must not import or parse business/catalog/knowledge services");
    break;
  }
}

if (existsSync(join(root, "apps/api/package.json"))) {
  const packageJson = JSON.parse(read("apps/api/package.json"));
  if (packageJson.scripts?.["author:fast"] !== "tsx ./author-acceptance.ts") {
    fail("apps/api author:fast must execute author-acceptance.ts only");
  }
}

const experienceRoutePath = "apps/api/src/routes/experience.ts";
const experienceServicePath = "apps/api/src/services/experienceService.ts";
if (existsSync(join(root, experienceRoutePath))) {
  const route = read(experienceRoutePath);
  if (!/const\s+sessionId\s*=\s*randomUUID\s*\(\)/.test(route)) fail("Experience compile route must create one sessionId");
  if (!/sessionId\s*[:,)]/.test(route)) fail("Experience compile route must pass sessionId into compileExperience");
}
if (existsSync(join(root, experienceServicePath))) {
  const service = read(experienceServicePath);
  if (!/sessionId\?:\s*string/.test(service)) fail("compileExperience must accept optional sessionId");
  if (!/input\.sessionId/.test(service)) fail("compileExperience must use request sessionId");
}

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
console.log("CANONICAL AUTHOR: apps/api/src/services/authorBrainCanonical.ts");
console.log("COGNITION: apps/api/src/services/authorCognition.ts");
console.log("ARTIST: apps/api/src/services/authorArtistChoice.ts");
console.log("LENS FIELD: apps/api/src/services/authorCreativeLens.ts");
console.log("CREATIVE SPINE: apps/api/src/services/authorCreativeSpine.ts");
console.log("CREATIVE REALIZER: apps/api/src/services/authorCreativeRealizer.ts");
console.log("REALIZED-FILM JUDGE: apps/api/src/services/authorRealizedFilmJudge.ts");

for (const message of failures) console.error(`FAIL: ${message}`);

if (failures.length) {
  console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR ARCHITECTURE GUARD GREEN · ONE CANONICAL AUTHOR · ARTIST AUTHORITY · SOURCE TRUTH · NO LEGACY CREATIVE PATHS");
