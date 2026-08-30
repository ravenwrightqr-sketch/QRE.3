/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: Verify the production Author wiring.
 * LAW: QRE may surprise us.
 * Guardrails protect truth; they are not a stylistic cage. A brilliant,
 * grounded cut may win even when it breaks a preference. Provenance,
 * architecture, and safety are hard; style is scored.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const warnings = [];
const check = (name, ok, detail) => {
  (ok ? warnings : failures).push(`${name}: ${detail}`);
};
const read = (path) => readFileSync(join(root, path), "utf8");

const canonical = "apps/api/src/services/authorBrainCanonical.ts";
const cognition = "apps/api/src/services/authorCognition.ts";
const realityGraph = "apps/api/src/services/authorRealityGraph.ts";
const movieSearch = "apps/api/src/services/authorUniversalMovieSearch.ts";
const mouth = "apps/api/src/services/authorMouthCandidateSearch.ts";
const interpretation = "apps/api/src/services/authorMouthInterpretation.ts";
const beam = "apps/api/src/services/authorMouthSequenceBeamSearch.ts";
const acceptance = "apps/api/author-acceptance.ts";
const packageJson = "apps/api/package.json";

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

const forbiddenImportNames = [
  "authorBrainUniversal",
  "cinematicAuthor",
  "authorBrainMomentum",
  "authorFastCore",
  "creativeRelationOps",
];

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

for (const path of [canonical, cognition, realityGraph, movieSearch, mouth, interpretation, beam, acceptance, packageJson]) {
  check(`exists:${path}`, existsSync(join(root, path)), "canonical file present");
}

for (const path of forbiddenFiles) {
  if (existsSync(join(root, path))) failures.push(`forbidden-file: ${path}`);
}

for (const file of walk(join(root, "apps/api/src")).filter((path) => /\.(ts|tsx|js|mjs)$/.test(path))) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  for (const forbidden of forbiddenImportNames) {
    if (new RegExp(`from\\s+["'][^"']*${forbidden}\\.js["']`).test(body)) {
      failures.push(`forbidden-import: ${rel} imports ${forbidden}`);
    }
  }
}

const canonicalSource = existsSync(join(root, canonical)) ? read(canonical) : "";
check("canonical:cognition", /buildAuthorCognitivePlan\s*\(/.test(canonicalSource), "Author invokes canonical cognition");
check("canonical:graph", /buildAuthorRealityGraph\s*\(/.test(canonicalSource), "Author builds source RealityGraph");
const cognitionSource = existsSync(join(root, cognition))
  ? read(cognition)
  : "";

check(
  "cognition:movie",
  /searchUniversalMovieCandidates\s*\(/.test(cognitionSource)
    && /selectedMovie/.test(cognitionSource),
  "Cognition owns movie discovery and selected-movie authority",
);
check("canonical:mouth", /buildMouthCandidateMessages\s*\(/.test(canonicalSource) && /selectBestMouthSequence\s*\(/.test(canonicalSource), "Author owns Mouth realization and sequence selection");
check("canonical:attention", /editAttentionSequence\s*\(/.test(canonicalSource), "Author runs attention editing");
check("canonical:arc", /evaluateSequenceArc\s*\(/.test(canonicalSource), "Author runs sequence arc gate");
check("canonical:model", /localModelGenerate\s*\(/.test(canonicalSource), "Author owns model realization");
check("canonical:no-legacy-compiler", !/compileCognitiveExperience/.test(canonicalSource), "Author does not invoke legacy creative compiler");

const acceptanceSource = existsSync(join(root, acceptance)) ? read(acceptance) : "";
check("acceptance:canonical", /authorBrainCanonical\.js/.test(acceptanceSource), "Acceptance invokes canonical Author");
check("acceptance:no-legacy", !/authorBrainUniversal|author-acceptance-suite/.test(acceptanceSource), "Acceptance has no legacy Author path");

const packageSource = existsSync(join(root, packageJson)) ? JSON.parse(read(packageJson)) : {};
check("package:author-fast", packageSource.scripts?.["author:fast"] === "tsx ./author-acceptance.ts", "author:fast targets canonical acceptance");

const mouthSource = existsSync(join(root, mouth)) ? read(mouth) : "";
const sourceForBeatStart = mouthSource.indexOf("function sourceForBeat(");
const sourceForBeatEnd = sourceForBeatStart >= 0
  ? mouthSource.indexOf("function supportedEventsForBeat(", sourceForBeatStart)
  : -1;
const sourceForBeatBody = sourceForBeatStart >= 0 && sourceForBeatEnd > sourceForBeatStart
  ? mouthSource.slice(sourceForBeatStart, sourceForBeatEnd)
  : "";
check("mouth:provenance", sourceForBeatStart >= 0, "Mouth has an explicit source provenance boundary");
check(
  "mouth:no-planner-label-promotion",
  /beat\.eventIds/.test(sourceForBeatBody)
    && !/setsUp|paysOff/.test(sourceForBeatBody)
    && !/sourceLabels/.test(sourceForBeatBody),
  "Only beat eventIds may resolve into source labels",
);

const interpretationSource = existsSync(join(root, interpretation)) ? read(interpretation) : "";
check("interpretation:whole-source", /wholeSourceAnchor/.test(interpretationSource), "Interpretation sees the supplied reality corpus");
check("interpretation:creative-lane", /creativeFraming/.test(interpretationSource), "Interpretation exposes bounded creative framing");
check("interpretation:concrete-risk", /unsupportedConcreteRisk/.test(interpretationSource), "Interpretation measures concrete invention risk");

const beamSource = existsSync(join(root, beam)) ? read(beam) : "";
check("beam:creative-ranking", /semanticQuality/.test(beamSource) && /sequenceFit/.test(beamSource), "Beam ranks semantic quality and sequence fit");
check("beam:safety", /inventionRisk/.test(beamSource) && /forbiddenMoveRisk/.test(beamSource), "Beam enforces invention safety");

console.log("=== QRE AUTHOR WIRING GUARD ===");
console.log(`CANONICAL AUTHOR: ${canonical}`);
console.log(`CANONICAL COGNITION: ${cognition}`);
console.log(`CANONICAL MOUTH: ${mouth}`);
console.log(`CANONICAL BEAM: ${beam}`);
for (const message of warnings) console.log(`GREEN: ${message}`);
for (const message of failures) console.error(`FAIL: ${message}`);
if (failures.length) {
  console.error(`AUTHOR WIRING GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("AUTHOR WIRING GUARD GREEN · ONE AUTHOR · ONE SEQUENCE · ONE MOUTH · QRE MAY SURPRISE US");
