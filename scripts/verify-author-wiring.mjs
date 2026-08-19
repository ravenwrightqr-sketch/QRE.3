import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const checks = [];
const failures = [];

function file(path) { return join(root, path); }
function exists(path) { return existsSync(file(path)); }
function read(path) { return readFileSync(file(path), "utf8"); }
function check(name, ok, detail) { checks.push({ name, ok, detail }); if (!ok) failures.push(`${name}: ${detail}`); }
function imports(source, moduleName) {
  const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`from\\s+[\"']${escaped}[\"']|import\\s*\\([^)]*[\"']${escaped}[\"']`).test(source);
}

const contracts = [
  "packages/contracts/src/cogauthor/authorBrain.ts",
  "packages/contracts/src/cogauthor/cognition.ts",
  "packages/contracts/src/cogauthor/latentMovie.ts",
  "packages/contracts/src/cogauthor/realityGraph.ts",
  "packages/contracts/src/cogauthor/mouth.ts",
  "packages/contracts/src/cogauthor/index.ts",
  "packages/contracts/src/experience/index.ts",
];

const retiredContracts = [
  "packages/contracts/src/experience/authorBrain.ts",
  "packages/contracts/src/experience/cognition.ts",
  "packages/contracts/src/experience/latentMovie.ts",
  "packages/contracts/src/experience/realityGraph.ts",
  "packages/contracts/src/experience/mouth.ts",
];

const services = [
  "apps/api/src/services/authorRealityGraph.ts",
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorLatentMovieSearch.ts",
  "apps/api/src/services/authorMovieDifferentiation.ts",
  "apps/api/src/services/authorBrainUniversal.ts",
  "apps/api/src/services/authorMeaningSpine.ts",
  "apps/api/src/services/authorMouthRealizationSlot.ts",
  "apps/api/src/services/authorMouthCandidateSearch.ts",
  "apps/api/src/services/authorMouthLanguageGate.ts",
  "apps/api/src/services/authorMouthQualityAdapter.ts",
  "apps/api/src/services/authorMouthGroundedFallback.ts",
  "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
  "apps/api/src/services/authorAttentionEditor.ts",
  "apps/api/src/services/authorBeatTruthGate.ts",
  "apps/api/src/services/authorCutPolicy.ts",
  "apps/api/src/services/localModelRuntime.ts",
];

for (const path of [...contracts, ...services]) check(`exists:${path}`, exists(path), "canonical file present");
for (const path of retiredContracts) check(`retired:${path}`, !exists(path), "retired duplicate contract absent");

check(
  "contracts:public-cogauthor",
  exists("packages/contracts/src/index.ts") && imports(read("packages/contracts/src/index.ts"), "./cogauthor/index.js"),
  "@qre/contracts exposes the canonical COGAUTHOR barrel",
);

if (exists("apps/api/src/services/authorRealityGraph.ts")) {
  const body = read("apps/api/src/services/authorRealityGraph.ts");
  check("reality:contract", imports(body, "@qre/contracts"), "RealityGraph compiler consumes contract types from @qre/contracts");
  check("reality:provenance", /sourceIds/.test(body) && /provenance/.test(body), "source provenance survives graph construction");
  check("reality:relations", /relations/.test(body) && /unresolvedTensions/.test(body), "relations and tension signals are retained");
}

if (exists("apps/api/src/services/authorCognition.ts")) {
  const body = read("apps/api/src/services/authorCognition.ts");
  check("cognition:movie-search", imports(body, "./authorLatentMovieSearch.js"), "Cognition delegates latent movie discovery to the canonical movie search");
  check("cognition:graph", /RealityGraph/.test(body), "Cognition accepts/uses the canonical RealityGraph");
}

if (exists("apps/api/src/services/authorLatentMovieSearch.ts")) {
  const body = read("apps/api/src/services/authorLatentMovieSearch.ts");
  check("movie:graph-input", /RealityGraph/.test(body), "Latent movie search consumes RealityGraph");
  check("movie:diversity", /selectDistinctMovieCandidates/.test(body), "Latent movie search applies the material diversity selection");
  check("movie:epistemic", /truthRisk/.test(body) && /hypothesis/.test(body), "Movie candidates remain hypotheses rather than source truth");
}

if (exists("apps/api/src/services/authorMovieDifferentiation.ts")) {
  const body = read("apps/api/src/services/authorMovieDifferentiation.ts");
  check("differentiation:material", /hasMaterialMovieDifference/.test(body) && /MIN_MATERIAL_DIVERSITY/.test(body), "Movie differentiation owns the material-difference threshold");
}

if (exists("apps/api/src/services/authorBrainUniversal.ts")) {
  const body = read("apps/api/src/services/authorBrainUniversal.ts");
  const required = [
    "./authorCognition.js",
    "./authorRealityGraph.js",
    "./authorRealityEnvelope.js",
    "./authorMeaningSpine.js",
    "./authorMouthRealizationSlot.js",
    "./authorMouthCandidateSearch.js",
    "./authorMouthSequenceBeamSearch.js",
    "./authorAttentionEditor.js",
    "./authorCutPolicy.js",
    "./authorBeatTruthGate.js",
    "./localModelRuntime.js",
  ];
  for (const moduleName of required) check(`master:imports:${moduleName}`, imports(body, moduleName), "Master Author consumes the canonical stage");
  check("master:no-enterprise-mouth-authority", !imports(body, "./authorEnterpriseMouth.js"), "Enterprise Mouth is not a shadow production author");
}

if (exists("apps/api/src/services/authorMouthCandidateSearch.ts")) {
  const body = read("apps/api/src/services/authorMouthCandidateSearch.ts");
  check("mouth:reality-envelope", imports(body, "./authorRealityEnvelope.js"), "Mouth candidate scoring is evidence-bound");
  check("mouth:no-planning", /does NOT choose meaning|does NOT choose the movie|does NOT choose the endpoint/i.test(body), "Mouth boundary explicitly forbids re-planning");
  check("mouth:local-contract-types", !/export type MouthCandidateBeat\s*=|export type MouthCandidate\s*=/.test(body), "Shared Mouth semantic contracts are not redefined inside the service");
}

if (exists("apps/api/src/services/authorMouthSequenceBeamSearch.ts")) {
  const body = read("apps/api/src/services/authorMouthSequenceBeamSearch.ts");
  check("beam:sequence", /selectBestMouthSequence/.test(body), "Beam selects complete sequences");
  check("beam:endpoint", /isCompleteEndpointPath/.test(body), "Beam requires an endpoint-complete path");
}

if (exists("apps/api/src/services/authorMouthQualityAdapter.ts")) {
  const body = read("apps/api/src/services/authorMouthQualityAdapter.ts");
  check("quality:language-gate", imports(body, "./authorMouthLanguageGate.js"), "Quality adapter respects the language gate");
  check("quality:attention-gate", imports(body, "./authorMouthAttentionGate.js"), "Quality adapter respects the attention gate");
  check("quality:no-score-laundering", !/Math\.min\(candidate\.inventionRisk,\s*0\.35\)/.test(body), "Quality adapter must not cap measured invention risk to make candidates pass");
}

if (exists("apps/api/src/services/authorCutPolicy.ts")) {
  const body = read("apps/api/src/services/authorCutPolicy.ts");
  check("cut:grounding", /inventionRisk|grounding/i.test(body), "Cut policy enforces a truth floor");
}

if (exists("apps/api/src/services/localModelRuntime.ts")) {
  const body = read("apps/api/src/services/localModelRuntime.ts");
  check("runtime:transport", /127\.0\.0\.1:11434|11434/.test(body), "Local model transport remains explicit and bounded");
}

check(
  "trajectory:status",
  !imports(read("apps/api/src/services/authorBrainUniversal.ts"), "./authorTrajectorySearch.js"),
  "Trajectory search is not declared canonical until its endpoint and consumer wiring are verified",
);
check(
  "enterprise:acceptance-only",
  exists("apps/api/author-enterprise-mouth-acceptance.ts") && !imports(read("apps/api/src/services/authorBrainUniversal.ts"), "./authorEnterpriseMouth.js"),
  "Enterprise Mouth may remain diagnostic while not acting as a second production author",
);

console.log("=== QRE AUTHOR WIRING GUARD · CANONICAL ===");
for (const item of checks) console.log(`${item.ok ? "GREEN" : "FAIL"}: ${item.name} · ${item.detail}`);
if (failures.length) {
  console.error(`AUTHOR WIRING GUARD FAILED · ${failures.length} issue(s)`);
  process.exit(1);
}
console.log("AUTHOR WIRING GUARD GREEN · canonical ownership, imports, contracts, Mouth boundary, and production authority verified");
