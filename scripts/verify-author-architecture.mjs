#!/usr/bin/env node

/**
 * QRE CANONICAL AUTHOR LAW
 *
 * Author currently produces one thing: a sequence-text film — text moving as
 * a sequence of attention-changing screens. This guard prevents future work
 * from reintroducing a conventional movie abstraction, production language,
 * or cinematic decision layer into Author.
 *
 * `LatentMovieCandidate` is a historical compatibility name only. It means
 * grounded sequence possibility. Never turn it into a movie/film-production
 * model, camera plan, soundtrack plan, transition system, or genre engine.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const canonicalSequenceHeader = /sequence-text film[\s\S]{0,900}not (?:a )?(?:conventional )?movie|sequence-text film[\s\S]{0,900}historical.*compatibility/i;
const forbiddenMovieArchitecture = /\b(?:camera(?:\s+plan)?|shot\s+list|soundtrack|music\s+cue|sound\s+design|transition\s+(?:plan|system)|screenplay|film(?:maker|making)|cinematic\s+(?:production|brief|plan)|movie\s+genre|genre\s+engine|production\s+(?:plan|brief)|audiovisual\s+(?:plan|production)|fade\s+(?:in|out)|zoom(?:\s+in|\s+out)?|pan(?:ning)?|dolly|tracking\s+shot|montage)\b/i;
const forbiddenMovieSelection = /\b(?:select(?:ed)?\s+movie|choose\s+(?:a|the)\s+movie|movie\s+selection|movie\s+index|movie\s+ranking|competing\s+movies|movie\s+hypotheses)\b/i;

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
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
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
    if (new RegExp(`from\\s+["'][^"']*${forbidden}\\.js["']`).test(body)) fail(`Forbidden Author dependency import in ${rel}: ${forbidden}`);
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
const realityGraph = read(required[8]);
const readout = read(required[9]);
const acceptance = read(required[10]);

for (const [path, body] of [
  [required[0], brain], [required[1], cognition], [required[2], universal], [required[3], artist],
  [required[4], lens], [required[5], spine], [required[6], realizer], [required[7], judge],
  [required[8], realityGraph], [required[9], readout],
]) {
  if (!canonicalSequenceHeader.test(body)) fail(`Author file missing canonical sequence-text warning header: ${path}`);
}

for (const [path, body] of [
  [required[0], brain], [required[1], cognition], [required[2], universal], [required[3], artist],
  [required[6], realizer], [required[7], judge],
]) {
  if (forbiddenMovieArchitecture.test(body)) fail(`Author file contains movie/cinematic production architecture: ${path}`);
  if (forbiddenMovieSelection.test(body)) fail(`Author file contains movie-selection semantics: ${path}`);
}

for (const pattern of [
  /buildAuthorRealityGraph\s*\(/,
  /buildAuthorReadout\s*\(/,
  /buildAuthorCognitivePlan\s*\(/,
  /buildAuthorCreativeSpine\s*\(/,
  /realizeAuthorExperience\s*\(/,
]) {
  if (!pattern.test(brain)) fail(`Canonical Author missing required stage: ${pattern}`);
}

if (!/cognition\.selectedLens/.test(brain) && !/selectedLens/.test(cognition)) fail("Author must preserve the Artist-selected perceptual frame when one exists");
if (!/artistDirection/.test(cognition)) fail("Cognition must expose Artist direction");
if (!/creativeProposition/.test(artist)) fail("Artist must expose the central creative proposition");
if (/selectedMovieIndex/.test(artist)) fail("Artist must not choose a Movie; proposition is the creative authority");
if (!/selectedLens/.test(artist)) fail("Artist choice must expose perceptual frame selection");
if (!/NONE/.test(artist)) fail("Artist choice must treat NONE as a real perceptual option");
if (!/rankCreativeLensCandidates\s*\(/.test(lens)) fail("Lens field must rank creative lens candidates");
if (!/NONE/.test(lens)) fail("Lens field must retain NONE");
if (!/rankCreativeLensCandidates\s*\(/.test(spine)) fail("Creative Spine must consume the lens field");
if (!/lensCandidates/.test(spine)) fail("Creative Spine must expose lens candidates");
if (!/localModelGenerate\s*\(/.test(realizer)) fail("Creative Realizer must own model realization");
if (!/sourceEventIds/.test(realizer)) fail("Creative Realizer must preserve source provenance");
if (!/centralProposition/.test(realizer)) fail("Creative Realizer must consume the Artist central proposition");
if (/selectedMovieIndex/.test(realizer)) fail("Creative Realizer must not select a Movie");
if (!/judgeRealizedFilm\s*\(/.test(realizer)) fail("Creative Realizer must use Judge only for diagnostic evaluation");
if (!/RealizedFilmJudgment/.test(judge)) fail("Realized sequence judgment contract must remain canonical");
if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Acceptance must invoke authorBrainCanonical directly");

const forbiddenDomainImports = /from\s+["'][^"']*\/(?:catalog|business|knowledge)[^"']*\.js["']/i;
const forbiddenDomainCalls = /\b(?:catalogVision|knowledgeIntake|business[A-Z][A-Za-z0-9_]*)\s*\(/;
for (const [path, body] of [[required[0], brain], [required[1], cognition], [required[2], universal], [required[3], artist], [required[4], lens], [required[5], spine], [required[6], realizer]]) {
  if (forbiddenDomainImports.test(body) || forbiddenDomainCalls.test(body)) fail(`Universal Author boundary must not import or invoke business/catalog/knowledge services: ${path}`);
}

if (existsSync(join(root, "apps/api/package.json"))) {
  const packageJson = JSON.parse(read("apps/api/package.json"));
  if (packageJson.scripts?.["author:fast"] !== "tsx ./author-acceptance.ts") fail("apps/api author:fast must execute author-acceptance.ts only");
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
console.log("CANONICAL ARTIFACT: SEQUENCE-TEXT FILM");
console.log("COGNITION: GROUNDED RELATIONSHIPS + PATTERNS");
console.log("ARTIST: ONE CREATIVE PROPOSITION");
console.log("MOUTH: VISIBLE MOVING TEXT");
console.log("JUDGE: DIAGNOSTIC ONLY");
console.log("NO MOVIE-PRODUCTION ABSTRACTION");

for (const message of failures) console.error(`FAIL: ${message}`);
if (failures.length) {
  console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("AUTHOR ARCHITECTURE GUARD GREEN · SEQUENCE-TEXT FILM · ARTIST PROPOSITION AUTHORITY · NO MOVIE PRODUCTION MODEL");