#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const read = (p) => readFileSync(join(root, p), "utf8");

const files = {
  extractor: "apps/api/src/services/authorRealityExtractor.ts",
  graph: "apps/api/src/services/authorRealityGraph.ts",
  discovery: "apps/api/src/services/authorCreativeDiscovery.ts",
  creative: "apps/api/src/services/authorCreative.ts",
  cutPolicy: "apps/api/src/services/authorCutFloor.ts",
  brain: "apps/api/src/services/authorBrainCanonical.ts",
  service: "apps/api/src/services/experienceService.ts",
  route: "apps/api/src/routes/experience.ts",
  acceptance: "apps/api/author-universal-core-acceptance.ts",
};

for (const [role, path] of Object.entries(files)) {
  if (!existsSync(join(root, path))) failures.push(`missing ${role}: ${path}`);
}

if (!failures.length) {
  const brain = read(files.brain);
  const creative = read(files.creative);
  const service = read(files.service);
  const route = read(files.route);
  const acceptance = read(files.acceptance);

  for (const specifier of [
    "authorRealityExtractor.js",
    "authorRealityGraph.js",
    "authorCreativeDiscovery.js",
    "authorCreative.js",
  ]) {
    if (!brain.includes(specifier)) failures.push(`brain missing ${specifier}`);
  }

  if (!/extractAuthorReality\s*\(/.test(brain)) failures.push("brain does not extract reality");
  if (!/buildAuthorRealityGraph\s*\(/.test(brain)) failures.push("brain does not build RealityGraph");
  if (!/discoverAuthorCreativeDirection\s*\(/.test(brain)) failures.push("brain does not execute Creative Discovery");
  if (!/createAuthorExperience\s*\(/.test(brain)) failures.push("brain does not execute QRE Creative");
  if (
    !/You are QRE Bare Author Structure Planner\./.test(creative) ||
    !/Discovery already owns meaning\./.test(creative) ||
    !/You are QRE Mouth\./.test(creative)
  ) failures.push("creative does not separate Discovery meaning, Author structure, and Mouth");
  if (!/evaluateAuthorCut\s*\(/.test(creative)) failures.push("creative does not execute deterministic cut floor");
  if (!/authorBrainCanonical\s*\(/.test(service)) failures.push("experienceService does not execute canonical brain");
  if (!/compileExperience\s*\(/.test(route)) failures.push("experience route does not execute compileExperience");
  if (!/authorBrainCanonical/.test(acceptance)) failures.push("universal acceptance does not call canonical brain");
}

console.log("=== QRE AUTHOR WIRING GUARD ===");
for (const f of failures) console.error("FAIL:", f);
if (failures.length) {
  console.error(`AUTHOR WIRING GUARD FAILED · ${failures.length}`);
  process.exit(1);
}
console.log("GREEN · ROUTE -> SERVICE -> BRAIN -> REALITY -> DISCOVERY -> AUTHOR STRUCTURE -> MOUTH -> CUT FLOOR");
