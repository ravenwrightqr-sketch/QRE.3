import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];

const canonical = {
  author: "apps/api/src/services/authorBrainCanonical.ts",
  cognition: "apps/api/src/services/authorCognition.ts",
  reality: "apps/api/src/services/authorRealityGraph.ts",
  envelope: "apps/api/src/services/authorRealityEnvelope.ts",
  movieSearch: "apps/api/src/services/authorUniversalMovieSearch.ts",
  viewerState: "apps/api/src/services/authorViewerState.ts",
  mouthBoundary: "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  mouthImplementation: "apps/api/src/services/authorMouthCandidateSearch.ts",
  mouthInterpretation: "apps/api/src/services/authorMouthInterpretation.ts",
  beam: "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
  attention: "apps/api/src/services/authorAttentionEditor.ts",
  arc: "apps/api/src/services/authorSequenceArcGate.ts",
  experienceService: "apps/api/src/services/experienceService.ts",
};

const forbiddenAuthorFiles = [
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorBrainUniversal.ts.new",
  "apps/api/src/services/authorBrainMomentum.ts",
  "apps/api/src/services/authorBrainMomentumV2.ts",
  "apps/api/src/services/authorBrainMomentumV3.ts",
  "apps/api/src/services/authorFastCore.ts",
  "apps/api/src/services/cinematicAuthor.ts",
  "apps/api/src/services/authorBrain.ts",
  "apps/api/src/services/creativeRelationOps.ts",
  "apps/api/author-acceptance-suite.ts",
];

const historicalScriptPattern = /(?:finalize|fix|patch|apply|wire|align|repair|integrate)-author-/i;

function rel(path) {
  return relative(root, path).replaceAll("\\", "/");
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
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

function resolveRelative(importer, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const base = join(dirname(importer), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`.replace(/\.js$/, ".ts"),
    `${base}.mjs`.replace(/\.mjs$/, ".mjs"),
    join(base, "index.ts"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function importsFrom(source, specifierPattern) {
  return source.match(specifierPattern) ?? [];
}

function directImports(file) {
  const body = readFileSync(file, "utf8");
  const imports = [];
  for (const match of body.matchAll(/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g)) {
    imports.push({ specifier: match[1], resolved: resolveRelative(file, match[1]) });
  }
  return imports;
}

function transitiveReachable(startFiles) {
  const queue = startFiles.map((path) => join(root, path)).filter(existsSync);
  const seen = new Set();
  while (queue.length) {
    const file = queue.shift();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    for (const item of directImports(file)) {
      if (item.resolved && item.resolved.startsWith(root)) queue.push(item.resolved);
    }
  }
  return seen;
}

console.log("=== QRE AUTHOR CANONICAL AUDIT ===");
console.log("READ-ONLY · no files are deleted or rewritten by this audit.");

for (const [name, path] of Object.entries(canonical)) {
  if (existsSync(join(root, path))) console.log(`KEEP · ${name} · ${path}`);
  else failures.push(`missing canonical owner: ${path}`);
}

for (const path of forbiddenAuthorFiles) {
  if (existsSync(join(root, path))) {
    warnings.push(`legacy surface present: ${path}`);
  }
}

const serviceRoot = join(root, "apps/api/src/services");
const serviceFiles = walk(serviceRoot).filter((file) => /^author[A-Z].*\.ts$/.test(file.split("/").pop() ?? ""));
const sourceRoot = join(root, "apps/api/src");
const sourceFiles = walk(sourceRoot).filter((file) => /\.(ts|tsx|js|mjs)$/.test(extname(file)));
const reachable = transitiveReachable([canonical.author]);

console.log(`Author service files: ${serviceFiles.length}`);
console.log(`API source files scanned: ${sourceFiles.length}`);
console.log(`Canonical Author relative reachable files: ${reachable.size}`);

console.log("\n--- REACHABILITY ---");
for (const file of serviceFiles.sort()) {
  console.log(`${reachable.has(file) ? "REACHABLE" : "ORPHAN?  "} · ${rel(file)}`);
}

console.log("\n--- SEMANTIC OWNERSHIP CHECKS ---");
const authorSource = read(canonical.author);
const cognitionSource = read(canonical.cognition);
const experienceSource = read(canonical.experienceService);

const ownershipChecks = [
  ["Author calls Cognition", /buildAuthorCognitivePlan\s*\(/.test(authorSource)],
  ["Author builds RealityGraph", /buildAuthorRealityGraph\s*\(/.test(authorSource)],
  ["Cognition owns movie search", /searchUniversalMovieCandidates\s*\(/.test(cognitionSource)],
  ["Cognition produces selectedMovie", /selectedMovie/.test(cognitionSource)],
  ["Author does not call movie search directly", !/searchUniversalMovieCandidates\s*\(/.test(authorSource)],
  ["Experience service uses canonical Author", /authorBrainCanonical/.test(experienceSource)],
  ["No legacy cognitive compiler in Author", !/compileCognitiveExperience/.test(authorSource)],
  ["No legacy universal Author import in API", !sourceFiles.some((file) => {
    const body = readFileSync(file, "utf8");
    return /from\s+["'][^"']*(?:authorBrainUniversal|cinematicAuthor|authorBrainMomentum|authorFastCore|creativeRelationOps)/.test(body);
  })],
];

for (const [label, ok] of ownershipChecks) {
  if (ok) console.log(`PASS · ${label}`);
  else failures.push(`ownership violation: ${label}`);
}

console.log("\n--- CONTRACT OWNERSHIP ---");
const contractRoot = join(root, "packages/contracts/src");
const canonicalContractPaths = {
  cognition: "packages/contracts/src/experience/cognition.ts",
  realityGraph: "packages/contracts/src/experience/realityGraph.ts",
  latentMovie: "packages/contracts/src/experience/latentMovie.ts",
  authorBrain: "packages/contracts/src/experience/authorBrain.ts",
  mouth: "packages/contracts/src/cogauthor/mouth.ts",
};
for (const [name, path] of Object.entries(canonicalContractPaths)) {
  if (existsSync(join(root, path))) console.log(`CANONICAL · ${name} · ${path}`);
  else failures.push(`missing contract owner: ${path}`);
}

const compatibilityExpectations = {
  "packages/contracts/src/cogauthor/cognition.ts": "../experience/cognition.js",
  "packages/contracts/src/cogauthor/realityGraph.ts": "../experience/realityGraph.js",
  "packages/contracts/src/cogauthor/latentMovie.ts": "../experience/latentMovie.js",
  "packages/contracts/src/cogauthor/authorBrain.ts": "../experience/authorBrain.js",
};
for (const [path, target] of Object.entries(compatibilityExpectations)) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    failures.push(`missing compatibility contract: ${path}`);
    continue;
  }
  const body = readFileSync(absolute, "utf8");
  if (!body.includes(`from \"${target}\"`)) {
    failures.push(`compatibility surface is not a re-export shim: ${path}`);
  } else {
    console.log(`SHIM · ${path} → ${target}`);
  }
}

console.log("\n--- ENGINE COGNITION BOUNDARY ---");
const engineCognitionRoot = join(root, "packages/engine/src/cognition");
const engineFiles = walk(engineCognitionRoot).filter((file) => /\.(ts|tsx|js|mjs)$/.test(extname(file)));
const engineConsumers = [];
for (const file of sourceFiles) {
  const body = readFileSync(file, "utf8");
  if (/from\s+["']@qre\/engine["']/.test(body) && /compileCognitiveExperience|universalMind/.test(body)) {
    engineConsumers.push(rel(file));
  }
}
console.log(`Engine cognition files: ${engineFiles.length}`);
if (engineConsumers.length) {
  for (const consumer of engineConsumers) warnings.push(`engine cognition consumer requires review: ${consumer}`);
} else {
  console.log("No API source file was found importing UniversalMind/compileCognitiveExperience from @qre/engine.");
}

console.log("\n--- HISTORICAL TOOLING ---");
const scripts = walk(join(root, "scripts")).filter((file) => /\.(mjs|js)$/.test(extname(file)));
const historical = scripts.filter((file) => historicalScriptPattern.test(rel(file)) || /author/.test(rel(file)));
for (const file of historical.sort()) console.log(`TOOL/HISTORY · ${rel(file)}`);

console.log("\n--- EMPTY / TEMPORARY ARTIFACTS ---");
const suspect = [];
for (const base of [join(root, "apps/api"), join(root, "packages")]) {
  for (const file of walk(base)) {
    if (!extname(file) || statSize(file) === 0 || /\.tmp$/.test(file) || /\.done$/.test(file)) suspect.push(rel(file));
  }
}
for (const item of suspect.sort()) console.log(`REVIEW · ${item}`);

console.log("\n--- VERDICT ---");
for (const warning of warnings) console.warn(`WARN · ${warning}`);
for (const failure of failures) console.error(`FAIL · ${failure}`);

if (failures.length) {
  console.error(`AUTHOR CANONICAL AUDIT FAILED · ${failures.length} hard violation(s)`);
  process.exit(1);
}
console.log("AUTHOR CANONICAL AUDIT GREEN · hard ownership invariants hold; review warnings separately");

function statSize(path) {
  try {
    return readFileSync(path).byteLength;
  } catch {
    return -1;
  }
}
