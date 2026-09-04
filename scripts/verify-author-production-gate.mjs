#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const fail = [];
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
  "apps/api/src/services/authorMetamorphicRelationSearch.ts",
  "apps/api/src/services/authorMetamorphicRelationSet.ts",
  "packages/contracts/src/cogauthor/metamorphic.ts",
  "packages/contracts/src/cogauthor/realizationAuthority.ts",
  "apps/api/author-acceptance.ts",
  "apps/api/author-mouth-universal-acceptance.ts",
  "apps/api/author-metamorphic-pipeline-acceptance.ts",
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

for (const p of required) if (!exists(p)) fail.push(`missing:${p}`);
for (const p of retired) if (exists(p)) fail.push(`retired Mouth file exists:${p}`);

const brain = exists(required[0]) ? read(required[0]) : "";
const cognition = exists(required[1]) ? read(required[1]) : "";
const mouth = exists(required[5]) ? read(required[5]) : "";
const mouthAuthority = exists(required[6]) ? read(required[6]) : "";
const boundary = exists(required[7]) ? read(required[7]) : "";
const thesis = exists("apps/api/src/services/authorLatentStoryThesis.ts") ? read("apps/api/src/services/authorLatentStoryThesis.ts") : "";
const differentiation = exists("apps/api/src/services/authorMovieDifferentiation.ts") ? read("apps/api/src/services/authorMovieDifferentiation.ts") : "";
const relationSet = exists("apps/api/src/services/authorMetamorphicRelationSet.ts") ? read("apps/api/src/services/authorMetamorphicRelationSet.ts") : "";

const wiringChecks = [
  [/buildAuthorCognitivePlan\s*\(/, "brain->cognition"],
  [/buildAuthorRealityGraph\s*\(/, "brain->reality-graph"],
  [/buildAuthorRealityEnvelope\s*\(/, "brain->reality-envelope"],
  [/buildMouthCandidateMessages\s*\(/, "brain->mouth-generation"],
  [/completeMouthPools\s*\(/, "brain->mouth-completion-scoring"],
  [/selectBestMouthSequence\s*\(/, "brain->mouth-selection"],
  [/from\s+["'][^"']*authorViewerStateCut\.js["']/i, "brain->viewer-state-cut"],
  [/from\s+["'][^"']*authorMouth\.js["']/i, "brain->canonical-mouth"],
];
for (const [re, label] of wiringChecks) if (!re.test(brain)) fail.push(`missing wiring:${label}`);

for (const [re, label] of [
  [/deriveLatentStoryThesis\s*\(/, "cognition->latent-thesis"],
  [/selectDistinctMovieCandidates\s*\(/, "cognition->movie-selection"],
]) if (!re.test(cognition)) fail.push(`missing cognition wiring:${label}`);

for (const [re, label] of [
  [/buildAuthorMetamorphicRelationSet\s*\(/, "thesis->relation-set"],
  [/metamorphicRelationSet\s*:/, "thesis->sealed-set-carriage"],
]) if (!re.test(thesis)) fail.push(`missing metamorphic thesis wiring:${label}`);

for (const [re, label] of [
  [/assertAuthorMetamorphicRelationSet\s*\(/, "selection->set-assertion"],
  [/sealedSet\s*\(/, "selection->sealed-set-read"],
  [/metamorphicPotential\s*\(/, "selection->metamorphic-priority"],
]) if (!re.test(differentiation)) fail.push(`missing metamorphic selection wiring:${label}`);

for (const [re, label] of [
  [/assertAuthorMetamorphicRelationSet\s*\(/, "mouth->set-assertion"],
  [/metamorphicRelationSet\s*:/, "mouth->set-carriage"],
  [/relationSetFor\s*\(/, "mouth->sealed-set-reader"],
]) if (!re.test(mouthAuthority)) fail.push(`missing Mouth metamorphic wiring:${label}`);

for (const [re, label] of [
  [/buildAuthorMetamorphicRelationSet\s*\(/, "relation-set->search"],
  [/searchMetamorphicRelations\s*\(/, "relation-set->canonical-search"],
  [/assertAuthorMetamorphicRelationSet\s*\(/, "relation-set->hard-assertion"],
]) if (!re.test(relationSet)) fail.push(`missing metamorphic authority wiring:${label}`);

const mouthLaws = [
  [/concrete reality is beat-scoped\./i, "truth/framing law"],
  [/the lens changes HOW the supplied reality lands, never WHAT happened\./i, "truth/framing law"],
  [/approved semantic meaning/i, "authorization separation"],
  [/new concrete facts are not/i, "authorization separation"],
  [/approved semantic realization/i, "semantic authorization"],
  [/literal-source-restatement/i, "literal fallback"],
  [/lens changes HOW .*reality lands, never WHAT happened/i, "lens boundary"],
];
for (const [re, label] of mouthLaws) if (!re.test(mouth)) fail.push(`missing Mouth law:${label}`);

if (!/Mouth may invent language freely inside the approved semantic meaning\./i.test(boundary)) fail.push("missing realization boundary law:language-inside-meaning");
if (!/new concrete\s+(?:occurrence|claim).*spatial fact.*action by a known entity/i.test(boundary)) fail.push("missing realization boundary law:concrete-world-guard");
if (!/evidenceEventIds/.test(mouthAuthority) || !/earnedInterpretations/.test(mouthAuthority)) fail.push("missing Mouth authority:semantic-evidence-separation");

const files = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(e.name)) continue;
    const a = join(dir, e.name);
    if (e.isDirectory()) walk(a);
    else if (e.isFile() && /\.(ts|tsx|js|mjs)$/.test(e.name)) files.push(a);
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
  ]) if (new RegExp(`from\\s+[\\"'][^\\"']*${oldName}\\.js[\\"']`).test(body)) fail.push(`retired import:${rel}->${oldName}`);
}

console.log("=== QRE AUTHOR PRODUCTION GATE ===");
for (const f of fail) console.error(`FAIL: ${f}`);
if (fail.length) {
  console.error(`AUTHOR PRODUCTION GATE FAILED · ${fail.length} violation(s)`);
  process.exit(1);
}
console.log("AUTHOR PRODUCTION GATE GREEN · ONE AUTHOR · ONE COGNITION · ONE MOUTH · ONE SEQUENCE · METAMORPHIC SET SEALED · METAMORPHIC BYPASS CLOSED · ZERO MOUTH SEAMS");
