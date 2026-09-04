#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const exists = (p) => existsSync(join(root, p));
const read = (p) => readFileSync(join(root, p), "utf8");

const required = [
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorUniversalMovieSearch.ts",
  "apps/api/src/services/authorRealityGraph.ts",
  "apps/api/src/services/authorRealityEnvelope.ts",
  "apps/api/src/services/authorMouth.ts",
  "apps/api/src/services/authorMouthRealizationAuthority.ts",
  "apps/api/src/services/authorRealizationBoundary.ts",
  "apps/api/src/services/authorCharacterLensEngine.ts",
  "apps/api/src/services/authorViewerStateCut.ts",
  "apps/api/src/services/authorRealizationMode.ts",
  "apps/api/author-acceptance.ts",
  "apps/api/author-mouth-universal-acceptance.ts",
];

const retired = [
  "apps/api/src/services/authorMouthCraft.ts",
  "apps/api/src/services/authorMouthCritic.ts",
  "apps/api/src/services/authorMouthInterpretation.ts",
  "apps/api/src/services/authorMouthSequenceCritic.ts",
  "apps/api/src/services/authorMouthCandidateSearch.ts",
  "apps/api/src/services/authorMouthCandidateSearchCanonical.ts",
  "apps/api/src/services/authorMouthSequenceBeamSearch.ts",
];

for (const p of required) if (!exists(p)) failures.push(`missing:${p}`);
for (const p of retired) if (exists(p)) failures.push(`retired Mouth file exists:${p}`);

const brain = exists(required[0]) ? read(required[0]) : "";
const mouth = exists(required[5]) ? read(required[5]) : "";
const mouthAuthority = exists(required[6]) ? read(required[6]) : "";
const boundary = exists(required[7]) ? read(required[7]) : "";

// Verify the canonical orchestration path. Candidate scoring is deliberately
// a Mouth-owned implementation detail; Brain reaches it through pool completion.
for (const [re, label] of [
  [/buildAuthorCognitivePlan\s*\(/, "brain->cognition"],
  [/buildAuthorRealityGraph\s*\(/, "brain->reality-graph"],
  [/buildAuthorRealityEnvelope\s*\(/, "brain->reality-envelope"],
  [/buildMouthCandidateMessages\s*\(/, "brain->mouth-generation"],
  [/completeMouthPools\s*\(/, "brain->mouth-completion-scoring"],
  [/selectBestMouthSequence\s*\(/, "brain->mouth-selection"],
  [/authorViewerStateCut\.js/i, "brain->viewer-state-cut"],
  [/authorMouth\.js/i, "brain->canonical-mouth"],
]) if (!re.test(brain)) failures.push(`missing wiring:${label}`);

for (const [re, label] of [
  [/scoreMouthCandidate\s*\(/, "mouth->candidate-scoring"],
  [/evaluateRealizationBoundary\s*\(/, "mouth->realization-boundary"],
  [/selectBestMouthSequence\s*\(/, "mouth->sequence-selection"],
]) if (!re.test(mouth)) failures.push(`missing Mouth authority:${label}`);

// Metamorphic authority is received, asserted, and carried into realization;
// Mouth never gets permission to originate a replacement relation set.
for (const [re, label] of [
  [/assertAuthorMetamorphicRelationSet\s*\(/, "Mouth->sealed-relation-set"],
  [/metamorphicRelationSet(?:\s*[,;:]|\s*=)/, "Mouth->set-carriage"],
  [/earnedInterpretations\s*[:=]/, "Mouth->earned-meaning"],
  [/evidenceEventIds\s*[:=]/, "Mouth->semantic-evidence"],
]) if (!re.test(mouthAuthority)) failures.push(`missing Mouth metamorphic wiring:${label}`);

// The truth/framing law is expressed as data separation and a hard boundary:
// concrete reality and semantic meaning are separate inputs, and only concrete
// claims raise invention risk.
for (const [re, label] of [
  [/localReality\s*=\s*tokenSet\s*\(/, "truth-channel"],
  [/semantic\s*=\s*tokenSet\s*\(/, "meaning-channel"],
  [/concreteClaim\s*=\s*/, "concrete-world-guard"],
  [/inventionRisk:\s*concreteClaim\s*\?\s*0\.95\s*:\s*0/, "hard-invention-boundary"],
]) if (!re.test(boundary)) failures.push(`realization boundary law missing:${label}`);

// Ensure grounding/evidence cannot itself become an authorization bypass.
for (const [re, label] of [
  [/assertAuthorMetamorphicRelationSet\s*\(/, "authorization-assertion"],
  [/approvedNovelLanguageTokens/, "approved-semantic-language"],
  [/foreignTokens/, "foreign-reality-rejection"],
  [/novelConcreteTokens/, "novel-concrete-rejection"],
]) if (!re.test(boundary + "\n" + mouthAuthority)) failures.push(`authorization boundary missing:${label}`);

const files = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(absolute);
  }
}
walk(join(root, "apps/api/src"));

for (const file of files) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  for (const oldName of [
    "authorMouthCraft",
    "authorMouthCritic",
    "authorMouthInterpretation",
    "authorMouthSequenceCritic",
    "authorMouthCandidateSearch",
    "authorMouthCandidateSearchCanonical",
    "authorMouthSequenceBeamSearch",
  ]) {
    if (new RegExp(`from\\s+[\"'][^\"']*${oldName}\\.js[\"']`).test(body)) {
      failures.push(`retired import:${rel}->${oldName}`);
    }
  }
}

console.log("=== QRE AUTHOR / ONE MOUTH WIRING GUARD ===");
for (const failure of failures) console.error(`FAIL: ${failure}`);
if (failures.length) {
  console.error(`ONE MOUTH WIRING GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("ONE MOUTH WIRING GUARD GREEN · ONE AUTHOR · ONE COGNITION · ONE MOUTH · ONE SEQUENCE · ZERO MOUTH SEAMS");
