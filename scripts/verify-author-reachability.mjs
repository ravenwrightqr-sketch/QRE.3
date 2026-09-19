#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const forbidden = [
  "authorBrainUniversal",
  "authorCognition",
  "authorCreativeSpine",
  "authorMeaningPressure",
  "authorCreativeLensBrief",
  "authorMovieDifferentiation",
  "authorCutPolicy",
  "authorRealityEnvelope",
  "authorCharacterLensEngine",
  "authorMetamorphicSearch",
  "authorMouthCandidateSearch",
  "authorMouthSequenceBeamSearch",
  "authorMouthInterpretation",
  "microBeatMouth",
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(e.name)) continue;
    const a = join(dir, e.name);
    e.isDirectory() ? walk(a, out) : out.push(a);
  }
  return out;
}

for (const file of walk(join(root, "apps/api/src")).filter((p) => /\.(ts|tsx|js|mjs)$/.test(p))) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const body = readFileSync(file, "utf8");
  for (const token of forbidden) {
    if (body.includes(token)) failures.push(`${rel}: retired Author token ${token}`);
  }
}

const servicePath = join(root, "apps/api/src/services/experienceService.ts");
if (!existsSync(servicePath)) failures.push("missing experienceService");
else {
  const body = readFileSync(servicePath, "utf8");
  if (!body.includes("authorBrainCanonical")) failures.push("experienceService does not reach canonical Author");
  for (const core of ["authorRealityExtractor", "authorCreativeDiscovery", "authorCreative"]) {
    if (body.includes(core)) failures.push(`experienceService bypasses canonical brain via ${core}`);
  }
}

const brainPath = join(root, "apps/api/src/services/authorBrainCanonical.ts");
if (!existsSync(brainPath)) failures.push("missing canonical brain");
else {
  const body = readFileSync(brainPath, "utf8");
  for (const core of ["authorRealityExtractor", "authorRealityGraph", "authorCreativeDiscovery", "authorCreative"]) {
    if (!body.includes(core)) failures.push(`canonical brain does not reach ${core}`);
  }
}

console.log("=== QRE AUTHOR REACHABILITY GUARD ===");
for (const f of failures) console.error("FAIL:", f);
if (failures.length) {
  console.error(`AUTHOR REACHABILITY GUARD FAILED · ${failures.length}`);
  process.exit(1);
}
console.log("GREEN · PRODUCTION REACHES ONE CREATIVE CORE ONLY");
