#!/usr/bin/env node

/**
 * QRE CANONICAL AUTHOR LAW
 *
 * Author currently produces a sequence-text film: moving text across
 * attention-changing screens. This guard prevents old competing artifact
 * models and presentation-production abstractions from returning to Author.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const bannedArtifactToken = ["mo", "vie"].join("");
const sequenceHeader = /sequence-text film[\s\S]{0,900}sequence|sequence-text film[\s\S]{0,900}attention-changing/i;
const forbiddenSelection = /\b(?:selectedMovie|movieMode|movieSelection|movieCandidates|latentMovie|movieIndex)\b/i;
const productionConcept = /\b(?:cameraPlan|shotList|soundtrackPlan|transitionPlan|screenplayPlan|genreEngine|audiovisualPlan)\b/i;

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
  "apps/api/src/services/authorLatentMovieSearch.ts",
  "apps/api/src/services/authorMovieDifferentiation.ts",
  "packages/contracts/src/movie",
];

const forbiddenImports = ["authorBrainUniversal", "cinematicAuthor", "authorBrainMomentum", "authorFastCore", "creativeRelationOps", "authorLatentMovieSearch", "authorMovieDifferentiation"];
const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => failures.push(message);
function walk(dir, out = []) { if (!existsSync(dir)) return out; for (const entry of readdirSync(dir, { withFileTypes: true })) { if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue; const absolute = join(dir, entry.name); if (entry.isDirectory()) walk(absolute, out); else if (entry.isFile()) out.push(absolute); } return out; }

for (const path of required) if (!existsSync(join(root, path))) fail(`Missing canonical file: ${path}`);
for (const path of forbiddenFiles) if (existsSync(join(root, path))) fail(`Forbidden legacy Author artifact exists: ${path}`);

const authorSourceFiles = walk(join(root, "apps/api/src/services")).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file) && /author/i.test(file));
for (const file of authorSourceFiles) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  if (body.toLowerCase().includes(bannedArtifactToken)) fail(`Banned competing artifact token found in ${rel}`);
  if (forbiddenSelection.test(body)) fail(`Legacy selection semantics found in ${rel}`);
  if (productionConcept.test(body)) fail(`Presentation-production abstraction found in ${rel}`);
  for (const forbidden of forbiddenImports) if (body.includes(forbidden)) fail(`Forbidden legacy Author dependency in ${rel}: ${forbidden}`);
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
for (const [path, body] of [[required[0], brain], [required[1], cognition], [required[2], universal], [required[3], artist], [required[4], lens], [required[5], spine], [required[6], realizer], [required[7], judge], [required[8], realityGraph], [required[9], readout]]) if (!sequenceHeader.test(body)) fail(`Missing sequence-only header: ${path}`);

if (!/buildAuthorRealityGraph\s*\(/.test(brain)) fail("Canonical Author missing RealityGraph stage");
if (!/buildAuthorReadout\s*\(/.test(brain)) fail("Canonical Author missing Readout stage");
if (!/buildAuthorCognitivePlan\s*\(/.test(brain)) fail("Canonical Author missing Cognition stage");
if (!/buildAuthorCreativeSpine\s*\(/.test(brain)) fail("Canonical Author missing Creative Spine stage");
if (!/realizeAuthorExperience\s*\(/.test(brain)) fail("Canonical Author missing Mouth/Realizer stage");
if (!/creativeProposition/.test(artist)) fail("Artist must expose the central creative proposition");
if (!/SequenceCandidate/.test(cognition) || !/sequenceCandidates/.test(cognition)) fail("Cognition must expose SequenceCandidate possibilities");
if (!/selectedSequence/.test(cognition)) fail("Cognition must expose the selected semantic sequence possibility");
if (!/centralProposition/.test(realizer)) fail("Realizer must consume the Artist central proposition");
if (!/judgeRealizedSequence\s*\(/.test(realizer)) fail("Realizer must use Judge diagnostically");
if (!/RealizedSequenceJudgment/.test(judge)) fail("Sequence judgment contract must remain canonical");
if (!/creativeProposition/.test(judge)) fail("Judge must evaluate the Artist proposition");
if (!/rankCreativeLensCandidates\s*\(/.test(lens)) fail("Lens Field must rank perceptual candidates");
if (!/NONE/.test(lens)) fail("Lens Field must retain NONE");
if (!/rankCreativeLensCandidates\s*\(/.test(spine)) fail("Creative Spine must consume the lens field");
if (!/sourceEventIds/.test(realizer)) fail("Realizer must preserve source provenance");
if (!/authorBrainCanonical\.js/.test(acceptance)) fail("Acceptance must invoke authorBrainCanonical directly");
if (/authorBrainUniversal|author-acceptance-suite/.test(acceptance)) fail("Acceptance contains a legacy Author path");

const forbiddenDomainImports = /from\s+["'][^"']*\/(?:catalog|business|knowledge)[^"']*\.js["']/i;
const forbiddenDomainCalls = /\b(?:catalogVision|knowledgeIntake|business[A-Z][A-Za-z0-9_]*)\s*\(/;
for (const [path, body] of [[required[0], brain], [required[1], cognition], [required[2], universal], [required[3], artist], [required[4], lens], [required[5], spine], [required[6], realizer]]) if (forbiddenDomainImports.test(body) || forbiddenDomainCalls.test(body)) fail(`Universal Author boundary must not import or invoke business/catalog/knowledge services: ${path}`);

if (existsSync(join(root, "apps/api/package.json"))) {
  const packageJson = JSON.parse(read("apps/api/package.json"));
  if (packageJson.scripts?.["author:fast"] !== "tsx ./author-acceptance.ts") fail("apps/api author:fast must execute author-acceptance.ts only");
}

const experienceRoutePath = "apps/api/src/routes/experience.ts";
const experienceServicePath = "apps/api/src/services/experienceService.ts";
if (existsSync(join(root, experienceRoutePath))) {
  const route = read(experienceRoutePath);
  if (!/const\s+sessionId\s*=\s*randomUUID\s*\(\)/.test(route)) fail("Experience compile route must create one sessionId");
  if (!/sessionId\s*[:,)]/.test(route)) fail("Experience compile route must pass request sessionId into compileExperience");
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
console.log("NO COMPETING ARTIFACT MODEL");
for (const message of failures) console.error(`FAIL: ${message}`);
if (failures.length) { console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`); process.exit(1); }
console.log("AUTHOR ARCHITECTURE GUARD GREEN · SEQUENCE-TEXT FILM · ARTIST PROPOSITION AUTHORITY · NO COMPETING ARTIFACT MODEL");
