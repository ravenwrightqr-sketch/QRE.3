#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const required = [
  "apps/api/src/services/authorRealityExtractor.ts",
  "apps/api/src/services/authorCreativeDiscovery.ts",
  "apps/api/src/services/authorCreative.ts",
  "apps/api/src/services/authorCutFloor.ts",
  "apps/api/src/services/authorCreativeGroundingVerifier.ts",
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/experienceService.ts",
];
for (const p of required) if (!existsSync(join(root, p))) failures.push(`missing ${p}`);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(e.name)) continue;
    const a = join(dir, e.name);
    e.isDirectory() ? walk(a, out) : out.push(a);
  }
  return out;
}

const authorModelCallers = new Set([
  "apps/api/src/services/authorRealityExtractor.ts",
  "apps/api/src/services/authorCreativeDiscovery.ts",
  "apps/api/src/services/authorCreative.ts",
  "apps/api/src/services/authorCreativeGroundingVerifier.ts",
]);

for (const file of walk(join(root, "apps/api/src/services")).filter((p) => /\.ts$/.test(p))) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const body = readFileSync(file, "utf8");
  if (/^apps\/api\/src\/services\/author/i.test(rel) && /localModelGenerate\s*\(/.test(body) && !authorModelCallers.has(rel)) {
    failures.push(`unapproved Author model caller: ${rel}`);
  }
}

if (required.every((p) => existsSync(join(root, p)))) {
  const extractor = readFileSync(join(root, required[0]), "utf8");
  const discovery = readFileSync(join(root, required[1]), "utf8");
  const creative = readFileSync(join(root, required[2]), "utf8");
  const cutPolicy = readFileSync(join(root, required[3]), "utf8");
  const verifier = readFileSync(join(root, required[4]), "utf8");
  const brain = readFileSync(join(root, required[5]), "utf8");
  const service = readFileSync(join(root, required[6]), "utf8");

  if (!/temperature:\s*0\.18/.test(extractor)) failures.push("Reality Extractor must remain low-temperature factual extraction");
  if (!/candidates/.test(discovery) || !/selectedCandidateId/.test(discovery) || !/evidenceEventIds/.test(discovery)) failures.push("Creative Discovery must search competing grounded perceptions and select one with evidence");
  if (!/You are QRE Bare Author\./.test(creative) || !/You are QRE Mouth\./.test(creative) || !/APPROVED_BEATS/.test(creative) || !/SUPPLIED_REALITY/.test(creative)) {
    failures.push("QRE Creative must separate semantic beat planning from Mouth realization");
  }
  if (!/Reality is fixed\./.test(creative) || !/Interpretation is free\./.test(creative)) {
    failures.push("QRE Creative missing fixed-reality/free-interpretation law");
  }
  if (!/evaluateAuthorCut\s*\(/.test(creative) || !/invented-concrete-reality/.test(cutPolicy)) {
    failures.push("deterministic cut floor missing from Mouth boundary");
  }
  if (
    !/Atomic Semantic Grounding/.test(verifier) ||
    !/ATOMIC_CLAUSES/.test(verifier) ||
    !/unsupportedClaims/.test(verifier) ||
    !/verifyAuthorCreativeGrounding\s*\(/.test(brain)
  ) failures.push("Semantic grounding verifier missing from Author truth boundary");
  if (/localModelGenerate\s*\(/.test(brain)) failures.push("Canonical brain may not directly call model");
  if (!/authorBrainCanonical/.test(service)) failures.push("Production service not wired to canonical brain");
  if (!/authorExperienceStateToMemoryBatch/.test(service) || !/buildExperienceMemoryBatch/.test(service)) failures.push("Memory/persistence boundary lost");
}

console.log("=== QRE AUTHOR PRODUCTION GATE ===");
for (const f of failures) console.error("FAIL:", f);
if (failures.length) {
  console.error(`AUTHOR PRODUCTION GATE FAILED · ${failures.length}`);
  process.exit(1);
}
console.log("GREEN · FACT EXTRACTION · DISCOVERY · SEMANTIC PLAN · MOUTH · CUT FLOOR · GROUNDING · PERSISTENCE");
