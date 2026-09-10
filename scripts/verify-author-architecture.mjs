#!/usr/bin/env node

/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: Repository architecture guard for the production Author path.
 * LAW: QRE may surprise us.
 * Guardrails protect truth; they are not a stylistic cage.
 * The guard must describe the live canonical architecture, not historical
 * implementation names.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];

const canonical = "apps/api/src/services/authorBrainCanonical.ts";
const cognition = "apps/api/src/services/authorCognition.ts";
const creativeSpine = "apps/api/src/services/authorCreativeSpine.ts";
const creativeRealizer = "apps/api/src/services/authorCreativeRealizer.ts";
const artistImplementation = "apps/api/src/services/authorBeastRealizer.ts";
const realityGraph = "apps/api/src/services/authorRealityGraph.ts";
const readout = "apps/api/src/services/authorReadout.ts";
const acceptance = "apps/api/author-acceptance.ts";
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
  "apps/api/src/services/authorLatentStoryThesis.ts",
  "apps/api/src/services/authorCreativeInterpretation.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/creativeRelationOps.ts",
  "apps/api/author-acceptance-suite.ts",
];

const forbiddenAuthorImports = [
  "authorBrainUniversal",
  "cinematicAuthor",
  "authorBrainMomentum",
  "authorFastCore",
  "creativeRelationOps",
];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) {
      continue;
    }

    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile()) out.push(absolute);
  }

  return out;
}

for (const path of [
  canonical,
  cognition,
  realityGraph,
  creativeSpine,
  creativeRealizer,
  artistImplementation,
  readout,
  acceptance,
  experienceRoute,
  experienceService,
  packageJsonPath,
]) {
  if (!existsSync(join(root, path))) fail(`Missing canonical file: ${path}`);
}

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) fail(`Forbidden legacy Author file exists: ${path}`);
}

if (existsSync(join(root, packageJsonPath))) {
  const packageJson = JSON.parse(read(packageJsonPath));
  if (packageJson.scripts?.["author:fast"] !== "tsx ./author-acceptance.ts") {
    fail("apps/api author:fast must execute author-acceptance.ts only");
  }
}

const sourceFiles = walk(join(root, "apps/api/src")).filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
for (const file of sourceFiles) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  for (const forbidden of forbiddenAuthorImports) {
    if (new RegExp(`from\\s+["'][^"']*${forbidden}\\.js["']`).test(body)) {
      fail(`Forbidden Author dependency import in ${rel}: ${forbidden}`);
    }
  }
}

const canonicalSource = existsSync(join(root, canonical)) ? read(canonical) : "";
const creativeSpineSource = existsSync(join(root, creativeSpine)) ? read(creativeSpine) : "";
const realizerSource = existsSync(join(root, creativeRealizer)) ? read(creativeRealizer) : "";
const artistSource = existsSync(join(root, artistImplementation)) ? read(artistImplementation) : "";
const realityGraphSource = existsSync(join(root, realityGraph)) ? read(realityGraph) : "";
const readoutSource = existsSync(join(root, readout)) ? read(readout) : "";

if (!/from\s+["'][^"']*authorCognition\.js["']/.test(canonicalSource)) fail("Canonical Author must import authorCognition");
if (!/buildAuthorCognitivePlan\s*\(/.test(canonicalSource)) fail("Canonical Author must execute Cognition");
if (!/buildAuthorRealityGraph\s*\(/.test(canonicalSource)) fail("Canonical Author must compile source truth into RealityGraph");
if (!/buildAuthorCreativeSpine\s*\(/.test(canonicalSource)) fail("Canonical Author must execute the Creative Spine");
if (!/realizeAuthorExperience\s*\(/.test(canonicalSource)) fail("Canonical Author must delegate visible realization to the Artist/Creative Realizer");
if (!/buildAuthorReadout\s*\(/.test(canonicalSource)) fail("Canonical Author must build the factual Readout");
if (!/from\s+["'][^"']*authorCreativeRealizer\.js["']/.test(canonicalSource)) fail("Canonical Author must import the Creative Realizer");
if (/compileCognitiveExperience/.test(canonicalSource)) fail("Canonical Author must not invoke the legacy cognitive compiler");
if (/authorBrainUniversal|author-acceptance-suite/.test(existsSync(join(root, acceptance)) ? read(acceptance) : "")) fail("Acceptance contains a legacy Author path");

if (!/function\s+buildAuthorRealityGraph\s*\(/.test(realityGraphSource)) fail("RealityGraph must own source-world compilation");
if (!/function\s+buildAuthorCreativeSpine\s*\(/.test(creativeSpineSource)) fail("Creative Spine must own semantic creative opportunities");
if (!/export\s*\{[\s\S]*realizeAuthorExperience[\s\S]*\}\s*from\s*[\"']\.\/authorBeastRealizer\.js[\"']/.test(realizerSource)) fail("Creative Realizer boundary must delegate visible realization to the Artist implementation");
if (!/function\s+realizeAuthorExperience\s*\(/.test(artistSource)) fail("Artist implementation must own visible artistic realization");
if (!/source reality|source truth|concrete facts|supplied reality/i.test(artistSource)) warn("Artist source-world lock could not be mechanically verified; rely on its acceptance suite.");
if (!/buildAuthorReadout/.test(canonicalSource) || !/AuthorReadout/.test(readoutSource)) fail("Readout layer must remain present on the canonical Author path");

const experienceRouteSource = existsSync(join(root, experienceRoute)) ? read(experienceRoute) : "";
if (!/const\s+sessionId\s*=\s*randomUUID\s*\(\)/.test(experienceRouteSource)) fail("Experience compile route must create one sessionId for the compile request");
if (!/sessionId\s*[:,]/.test(experienceRouteSource)) fail("Experience compile route must pass sessionId into compileExperience");

const experienceServiceSource = existsSync(join(root, experienceService)) ? read(experienceService) : "";
if (!/sessionId\?:\s*string/.test(experienceServiceSource)) fail("compileExperience must accept an optional sessionId");
if (!/input\.sessionId/.test(experienceServiceSource)) fail("compileExperience must use the request sessionId for session-aware context");
if (!/db\.scanSession\.upsert\s*\(/.test(experienceServiceSource)) fail("compileExperience must persist the authoring scan session when assetId and sessionId exist");
if (!/input\.sessionId\s*\)/.test(experienceServiceSource)) fail("compileExperience must propagate sessionId into presence context");

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
console.log(`CANONICAL AUTHOR: ${canonical}`);
console.log(`COGNITION: ${cognition}`);
console.log(`REALITY GRAPH: ${realityGraph}`);
console.log(`CREATIVE SPINE: ${creativeSpine}`);
console.log(`CREATIVE REALIZER: ${creativeRealizer}`);
console.log(`ARTIST IMPLEMENTATION: ${artistImplementation}`);
console.log(`READOUT: ${readout}`);
console.log(`EXPERIENCE ROUTE: ${experienceRoute}`);
console.log(`EXPERIENCE SERVICE: ${experienceService}`);

for (const message of warnings) console.warn(`WARN: ${message}`);
for (const message of failures) console.error(`FAIL: ${message}`);

if (failures.length) {
  console.error(`AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}

console.log("AUTHOR ARCHITECTURE GUARD GREEN · ONE CANONICAL AUTHOR · SOURCE TRUTH · COGNITION · ARTIST REALIZATION · EXPERIENCE · MEMORY/SESSION · NO LEGACY CREATIVE PATHS");