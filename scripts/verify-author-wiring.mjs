import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const checks = [];
const failures = [];

const CANONICAL_SERVICES = [
  "authorRealityGraph.ts",
  "authorCognition.ts",
  "authorLatentMovieSearch.ts",
  "authorLatentMovieConvergence.ts",
  "authorMovieDifferentiation.ts",
  "authorBrainUniversal.ts",
  "authorBeatPlanRecovery.ts",
  "authorMeaningSpine.ts",
  "authorMouthRealizationSlot.ts",
  "authorRealizationStrategyLattice.ts",
  "authorMouthCandidateSearch.ts",
  "authorMouthSequenceBeamSearch.ts",
  "authorAttentionEditor.ts",
  "authorBeatTruthGate.ts",
  "authorCutPolicy.ts",
  "authorSequenceArcGate.ts",
  "localModelRuntime.ts",
];

const RETIRED_FILES = [
  "apps/api/src/services/authorEnterpriseAdversarialMatrix.ts",
  "apps/api/src/services/authorEnterpriseIntelligence.ts",
  "apps/api/src/services/authorEnterpriseMouth.ts",
  "apps/api/src/services/authorEnterpriseMouthAcceptanceMatrix.ts",
  "apps/api/src/services/authorEnterpriseMouthPolicy.ts",
  "apps/api/src/services/authorEnterpriseRuntime.ts",
  "apps/api/src/services/authorEnterpriseSafety.ts",
  "apps/api/author-enterprise-mouth-acceptance.ts",
  "apps/api/src/services/authorMouthQualityAdapter.ts",
  "apps/api/src/services/authorMouthGroundedFallback.ts",
  "apps/api/src/services/authorMouthLanguageGate.ts",
  "apps/api/src/services/authorMouthAttentionGate.ts",
  "apps/api/src/services/authorMouthRepairPlanner.ts",
  "apps/api/src/services/authorCumulativeMeaning.ts",
  "apps/api/src/services/authorLatentMovieBeatAdapter.ts",
];

function file(path) {
  return join(root, path);
}

function exists(path) {
  return existsSync(file(path));
}

function read(path) {
  return readFileSync(file(path), "utf8");
}

function check(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}: ${detail}`);
}

function imports(source, moduleName) {
  const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `from\\s+[\"']${escaped}[\"']|import\\s*\\([^)]*[\"']${escaped}[\"']`,
  ).test(source);
}

const contracts = [
  "packages/contracts/src/cogauthor/authorBrain.ts",
  "packages/contracts/src/cogauthor/cognition.ts",
  "packages/contracts/src/cogauthor/latentMovie.ts",
  "packages/contracts/src/cogauthor/realityGraph.ts",
  "packages/contracts/src/cogauthor/mouth.ts",
  "packages/contracts/src/cogauthor/index.ts",
];

const retiredContracts = [
  "packages/contracts/src/experience/authorBrain.ts",
  "packages/contracts/src/experience/cognition.ts",
  "packages/contracts/src/experience/latentMovie.ts",
  "packages/contracts/src/experience/realityGraph.ts",
  "packages/contracts/src/experience/mouth.ts",
];

for (const path of contracts) {
  check(`exists:${path}`, exists(path), "canonical contract present");
}

for (const name of CANONICAL_SERVICES) {
  const path = `apps/api/src/services/${name}`;
  check(`exists:${path}`, exists(path), "canonical service present");
}

for (const path of retiredContracts) {
  check(`retired-contract:${path}`, !exists(path), "retired duplicate contract absent");
}

for (const path of RETIRED_FILES) {
  check(`retired-author:${path}`, !exists(path), "retired duplicate/legacy Author file absent");
}

check(
  "contracts:public-cogauthor",
  exists("packages/contracts/src/index.ts") &&
    imports(read("packages/contracts/src/index.ts"), "./cogauthor/index.js"),
  "@qre/contracts exposes canonical COGAUTHOR contracts",
);

if (exists("apps/api/src/services/authorRealityGraph.ts")) {
  const body = read("apps/api/src/services/authorRealityGraph.ts");
  check("reality:contract", imports(body, "@qre/contracts"), "RealityGraph consumes shared contracts");
  check("reality:provenance", /sourceIds/.test(body) && /provenance/.test(body), "source provenance survives graph construction");
  check("reality:relations", /relations/.test(body) && /unresolvedTensions/.test(body), "relations and tension signals survive graph construction");
}

if (exists("apps/api/src/services/authorCognition.ts")) {
  const body = read("apps/api/src/services/authorCognition.ts");
  check("cognition:movie-search", imports(body, "./authorLatentMovieSearch.js"), "Cognition delegates movie discovery");
  check("cognition:graph", /RealityGraph/.test(body), "Cognition is RealityGraph-bound");
}

if (exists("apps/api/src/services/authorLatentMovieSearch.ts")) {
  const body = read("apps/api/src/services/authorLatentMovieSearch.ts");
  check("movie:graph-input", /RealityGraph/.test(body), "movie search consumes RealityGraph");
  check("movie:convergence", imports(body, "./authorLatentMovieConvergence.js"), "movie search uses graph convergence support");
  check("movie:diversity", /selectDistinctMovieCandidates/.test(body), "movie search applies material differentiation");
  check("movie:hypothesis", /LatentMovieCandidate/.test(body) && /payoff/.test(body), "movie output remains a hypothesis/trajectory structure");
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
    "./authorSequenceArcGate.js",
    "./localModelRuntime.js",
  ];
  for (const moduleName of required) {
    check(`master:imports:${moduleName}`, imports(body, moduleName), "Master Author consumes canonical stage");
  }
  check("master:no-enterprise-author", !/authorEnterpriseMouth/.test(body), "Master Author has no shadow Enterprise Mouth authority");
  check("master:no-trajectory-branch", !imports(body, "./authorTrajectorySearch.js"), "Trajectory capability is not silently promoted to production");
  check("master:no-local-cut-validator", !/function\s+validCut\s*\(/.test(body), "Master Author does not duplicate cut policy");
  check("master:single-mouth-entry", (body.match(/generateMouthCandidatePools/g) ?? []).length >= 1, "Master Author delegates Mouth generation through the canonical Mouth API");
}

if (exists("apps/api/src/services/authorMouthCandidateSearch.ts")) {
  const body = read("apps/api/src/services/authorMouthCandidateSearch.ts");
  check("mouth:contract", imports(body, "@qre/contracts"), "Mouth uses shared contracts");
  check("mouth:reality-envelope", imports(body, "./authorRealityEnvelope.js"), "Mouth is evidence-bound");
  check("mouth:generator", /generateMouthCandidatePools/.test(body), "Mouth owns the canonical generation API");
  check(
    "mouth:sequence-generator",
    /buildCompleteSequenceMouthMessages/.test(body) &&
      /candidateSequences/.test(body) &&
      /parseCompleteSequenceBatch/.test(body),
    "Mouth generates complete candidate sequences before Beam selection",
  );
  check(
    "mouth:no-per-beat-generation",
    !/runBeatJob|MAX_CONCURRENT_REQUESTS|BEAT \\d+ PRIMARY|BEAT \\d+ REPAIR/.test(body),
    "Mouth does not contain the retired beat-local generation loop",
  );
  check(
    "mouth:no-repair-loop",
    !/MAX_REPAIRS_PER_BEAT|REPAIR THIS BEAT ONLY|QRE REPAIR FEEDBACK/.test(body),
    "Mouth does not contain the retired per-beat repair loop",
  );
  check(
    "mouth:canonical-output-contract",
    /candidateSequences/.test(body) &&
      /parseCompleteSequenceBatch/.test(body) &&
      /generateMouthCandidatePools/.test(body),
    "Mouth generation and parsing use the canonical candidateSequences contract",
  );
  check("mouth:no-enterprise-import", !imports(body, "./authorEnterpriseMouth.js"), "Mouth cannot depend on retired Enterprise orchestration");
  check("mouth:no-duplicate-contract", !/export type MouthCandidateBeat\s*=|export type MouthCandidate\s*=/.test(body), "Mouth does not redefine shared semantic contract types");
}

if (exists("packages/contracts/src/cogauthor/mouth.ts")) {
  const body = read("packages/contracts/src/cogauthor/mouth.ts");
  check("strategy:contract", /realizationStrategies\?:\s*readonly string\[\]/.test(body), "Approach-B strategy choices have an explicit shared contract field");
}

if (exists("apps/api/src/services/authorRealizationStrategyLattice.ts")) {
  const body = read("apps/api/src/services/authorRealizationStrategyLattice.ts");
  check("strategy:lattice", /deriveRealizationStrategies/.test(body) && /selectSafeStrategies/.test(body), "Approach-B strategy lattice exposes deterministic selection");
  check("strategy:no-model", !/localModelGenerate/.test(body), "strategy lattice never becomes a model author");
}

if (exists("apps/api/src/services/authorMouthSequenceBeamSearch.ts")) {
  const body = read("apps/api/src/services/authorMouthSequenceBeamSearch.ts");
  check("beam:sequence", /selectBestMouthSequence/.test(body), "Beam selects complete sequences");
  check("beam:endpoint", /completeEndpointPath/.test(body), "Beam models endpoint completion explicitly");
  check("beam:no-model", !/localModelGenerate/.test(body), "Beam remains deterministic and model-free");
}

if (exists("apps/api/src/services/authorCutPolicy.ts")) {
  const body = read("apps/api/src/services/authorCutPolicy.ts");
  check("cut:truth-floor", /inventionRisk|groundedTokenRatio/.test(body), "Cut policy preserves truth grounding");
  check("cut:frontier", /frontierValue/.test(body), "Cut policy measures information frontier behavior");
}

if (exists("apps/api/src/services/localModelRuntime.ts")) {
  const body = read("apps/api/src/services/localModelRuntime.ts");
  check("runtime:transport", /11434/.test(body), "Local model transport is explicit");
}

const allowedDirectModelCallers = new Set([
  "authorBrainUniversal.ts",
  "authorMouthCandidateSearch.ts",
  "authorBeatTruthGate.ts",
  "localModelRuntime.ts",
  "aiProvider.ts",
]);

for (const name of CANONICAL_SERVICES) {
  const path = `apps/api/src/services/${name}`;
  if (!exists(path)) continue;
  const body = read(path);
  if (!/localModelGenerate/.test(body)) continue;
  check(
    `model-owner:${name}`,
    allowedDirectModelCallers.has(name),
    allowedDirectModelCallers.has(name)
      ? "approved direct model caller"
      : "unexpected direct model generation inside an Author service",
  );
}

if (exists("apps/api/src/services/aiProvider.ts")) {
  const body = read("apps/api/src/services/aiProvider.ts");
  check("provider:no-creative-brief-author", !/localCreativeBrief|localDraft|localCritique|localRevision|localPolish/.test(body), "provider cannot recreate a second prose-author pipeline");
  check("provider:canonical-author", imports(body, "./authorBrainUniversal.js"), "provider compatibility writing delegates to canonical Author");
  check("provider:vision", /input_image|images:\s*\[/.test(body), "provider can understand user-supplied media as evidence");
}

console.log("=== QRE AUTHOR WIRING GUARD · PRODUCTION AUDIT ===");
for (const item of checks) {
  console.log(`${item.ok ? "GREEN" : "FAIL"}: ${item.name} · ${item.detail}`);
}

if (failures.length) {
  console.error(`AUTHOR WIRING GUARD FAILED · ${failures.length} issue(s)`);
  process.exit(1);
}

console.log("AUTHOR WIRING GUARD GREEN · canonical ownership, retired shadow systems, contracts, model ownership, and production boundaries verified");
