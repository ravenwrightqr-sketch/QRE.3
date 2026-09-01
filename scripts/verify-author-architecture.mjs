#!/usr/bin/env node

/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: Repository architecture guard for the production Author path.
 * LAW: QRE may surprise us.
 * Guardrails protect truth; they are not a stylistic cage. A brilliant,
 * grounded cut may win even when it breaks a preference. Only provenance,
 * safety, and architectural ownership are hard boundaries.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];

const canonical = "apps/api/src/services/authorBrainCanonical.ts";
const cognition = "apps/api/src/services/authorCognition.ts";
const acceptance = "apps/api/author-acceptance.ts";
const mouth = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
const legacyMouth = "apps/api/src/services/authorMouthCandidateSearch.ts";
const beam = "apps/api/src/services/authorMouthSequenceBeamSearch.ts";
const interpretation = "apps/api/src/services/authorMouthInterpretation.ts";
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

    if (entry.isDirectory()) {
      walk(absolute, out);
    } else if (entry.isFile()) {
      out.push(absolute);
    }
  }

  return out;
}

for (const path of [
  canonical,
  cognition,
  acceptance,
  mouth,
  legacyMouth,
  beam,
  interpretation,
  experienceRoute,
  experienceService,
  packageJsonPath,
]) {
  if (!existsSync(join(root, path))) {
    fail(`Missing canonical file: ${path}`);
  }
}

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) {
    fail(`Forbidden legacy Author file exists: ${path}`);
  }
}

if (existsSync(join(root, packageJsonPath))) {
  const packageJson = JSON.parse(read(packageJsonPath));

  if (
    packageJson.scripts?.["author:fast"] !==
    "tsx ./author-acceptance.ts"
  ) {
    fail("apps/api author:fast must execute author-acceptance.ts only");
  }
}

const sourceFiles = walk(join(root, "apps/api/src")).filter((file) =>
  /\.(ts|tsx|js|mjs)$/.test(file),
);

for (const file of sourceFiles) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");

  for (const forbidden of forbiddenAuthorImports) {
    if (
      new RegExp(
        `from\\s+["'][^"']*${forbidden}\\.js["']`,
      ).test(body)
    ) {
      fail(
        `Forbidden Author dependency import in ${rel}: ${forbidden}`,
      );
    }
  }
}

const canonicalSource = existsSync(join(root, canonical))
  ? read(canonical)
  : "";

if (
  !/from\s+["'][^"']*authorCognition\.js["']/.test(
    canonicalSource,
  )
) {
  fail("Canonical Author must import authorCognition");
}

if (!/buildAuthorCognitivePlan\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must execute Cognition");
}

if (!/buildAuthorRealityGraph\s*\(/.test(canonicalSource)) {
  fail(
    "Canonical Author must compile source truth into RealityGraph",
  );
}

if (!/buildAuthorRealityEnvelope\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must build the RealityEnvelope");
}

if (!/buildMouthCandidateMessages\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must build Mouth candidates");
}

if (!/selectBestMouthSequence\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must select the final sequence");
}

if (!/editAttentionSequence\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must run attention editing");
}

if (!/evaluateSequenceArc\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must run sequence arc evaluation");
}

if (!/localModelGenerate\s*\(/.test(canonicalSource)) {
  fail("Canonical Author must own model realization");
}

if (/compileCognitiveExperience/.test(canonicalSource)) {
  fail(
    "Canonical Author must not invoke the legacy cognitive compiler",
  );
}

const acceptanceSource = existsSync(join(root, acceptance))
  ? read(acceptance)
  : "";

if (!/authorBrainCanonical\.js/.test(acceptanceSource)) {
  fail(
    "Acceptance must invoke authorBrainCanonical directly",
  );
}

if (/authorBrainUniversal|author-acceptance-suite/.test(acceptanceSource)) {
  fail("Acceptance contains a legacy Author path");
}

const mouthSource = existsSync(join(root, mouth))
  ? read(mouth)
  : "";

const sourceLabelsMatch = mouthSource.match(
  /function\s+sourceLabels\s*\([\s\S]*?\n\}/,
);

if (!sourceLabelsMatch) {
  fail("Canonical Mouth must define sourceLabels");
} else {
  const sourceLabelsSource = sourceLabelsMatch[0];

  if (!/beat\.eventIds/.test(sourceLabelsSource)) {
    fail("Canonical Mouth source provenance must read only beat.eventIds");
  }

  if (!/envelope\.events\.find\s*\(/.test(sourceLabelsSource)) {
    fail(
      "sourceLabels must resolve against envelope.events",
    );
  }

  if (!/event\.id\s*===\s*id/.test(sourceLabelsSource)) {
    fail(
      "sourceLabels must match events by event ID",
    );
  }

  if (!/\.label/.test(sourceLabelsSource)) {
    fail(
      "sourceLabels must return the matched event label",
    );
  }
}

if (!/Prefer attitude, status, implication, contrast, recognition, interruption, consequence, callback, and compressed payoff\./i.test(mouthSource)) {
  fail(
    "Canonical Mouth must preserve consequence-aware experiential realization guidance",
  );
}

if (!/function\s+payoffScore\s*\(/.test(mouthSource) || !/payoffScore\s*\(/.test(mouthSource)) {
  fail(
    "Canonical Mouth must evaluate consequence/payoff quality before candidate acceptance",
  );
}

if (!/viewerState\?\.stateShift/.test(mouthSource)) {
  fail(
    "Canonical Mouth must evaluate the supplied viewer-state transition",
  );
}

const legacyMouthSource = existsSync(join(root, legacyMouth))
  ? read(legacyMouth)
  : "";

if (
  legacyMouthSource &&
  !/export\s+(?:async\s+)?function\s+buildMouthCandidateMessages/.test(
    legacyMouthSource,
  ) &&
  !/export\s*\{[\s\S]*\bbuildMouthCandidateMessages\b[\s\S]*\}\s+from\s+["'][^"']*authorMouthCandidateSearchCanonical\.js["']/.test(
    legacyMouthSource,
  )
) {
  warn(
    "Legacy Mouth search is present but its candidate-generation export could not be verified textually",
  );
}

const interpretationSource = existsSync(join(root, interpretation))
  ? read(interpretation)
  : "";

if (!/wholeSourceAnchor/.test(interpretationSource)) {
  fail(
    "Mouth interpretation must evaluate whole-source grounding",
  );
}

if (!/creativeFraming/.test(interpretationSource)) {
  fail(
    "Mouth interpretation must expose creative framing",
  );
}

if (!/unsupportedConcreteRisk/.test(interpretationSource)) {
  fail(
    "Mouth interpretation must measure concrete invention risk",
  );
}

const beamSource = existsSync(join(root, beam))
  ? read(beam)
  : "";

if (!/candidate\.inventionRisk/.test(beamSource)) {
  fail("Sequence beam must account for invention risk");
}

if (!/function\s+expressionQuality\s*\(/.test(beamSource)) {
  fail("Sequence beam must expose its semantic/expression quality scorer");
}

if (!/candidate\.meaningScore/.test(beamSource)) {
  fail("Sequence beam semantic quality must consume candidate meaningScore");
}

if (!/function\s+sequenceTransition\s*\(/.test(beamSource)) {
  fail("Sequence beam must rank sequence fit via sequenceTransition");
}

if (!/function\s+viewerStateFit\s*\(/.test(beamSource)) {
  fail("Sequence beam must rank sequence effect via viewerStateFit");
}

if (!/function\s+pathTransitionProfile\s*\(/.test(beamSource)) {
  fail("Sequence beam must aggregate sequence effect across the path");
}

if (!/function\s+relativeGoldPotential\s*\(/.test(beamSource)) {
  fail("Sequence beam must preserve emergent relative gold ranking");
}

const experienceRouteSource = existsSync(join(root, experienceRoute))
  ? read(experienceRoute)
  : "";

if (!/const\s+sessionId\s*=\s*randomUUID\s*\(\)/.test(experienceRouteSource)) {
  fail(
    "Experience compile route must create one sessionId for the compile request",
  );
}

if (!/sessionId\s*,/.test(experienceRouteSource) && !/sessionId\s*[:,]/.test(experienceRouteSource)) {
  fail(
    "Experience compile route must pass sessionId into compileExperience",
  );
}

const experienceServiceSource = existsSync(join(root, experienceService))
  ? read(experienceService)
  : "";

if (!/sessionId\?:\s*string/.test(experienceServiceSource)) {
  fail(
    "compileExperience must accept an optional sessionId",
  );
}

if (!/input\.sessionId/.test(experienceServiceSource)) {
  fail(
    "compileExperience must use the request sessionId for session-aware context",
  );
}

if (!/db\.scanSession\.upsert\s*\(/.test(experienceServiceSource)) {
  fail(
    "compileExperience must persist the authoring scan session when assetId and sessionId exist",
  );
}

if (!/input\.sessionId\s*\)/.test(experienceServiceSource)) {
  fail(
    "compileExperience must propagate sessionId into presence context",
  );
}

console.log("=== QRE AUTHOR ARCHITECTURE GUARD ===");
console.log(`CANONICAL AUTHOR: ${canonical}`);
console.log(`COGNITION: ${cognition}`);
console.log(`MOUTH: ${mouth}`);
console.log(`LEGACY MOUTH SEARCH: ${legacyMouth}`);
console.log(`BEAM: ${beam}`);
console.log(`INTERPRETATION: ${interpretation}`);
console.log(`EXPERIENCE ROUTE: ${experienceRoute}`);
console.log(`EXPERIENCE SERVICE: ${experienceService}`);

for (const message of warnings) {
  console.warn(`WARN: ${message}`);
}

for (const message of failures) {
  console.error(`FAIL: ${message}`);
}

if (failures.length) {
  console.error(
    `AUTHOR ARCHITECTURE GUARD FAILED · ${failures.length} violation(s)`,
  );
  process.exit(1);
}

console.log(
  "AUTHOR ARCHITECTURE GUARD GREEN · ONE CANONICAL AUTHOR · SOURCE TRUTH · COGNITION · EXPERIENCE · MEMORY/SESSION · MOUTH · COLLISION · GATING · NO LEGACY CREATIVE PATHS",
);
