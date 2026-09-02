/**
 * QRE LENS AUTHORITY GUARD
 * One canonical lens registry, one ranking authority, direct consumers.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const failures = [];
const check = (name, ok, detail) => {
  if (!ok) failures.push(`${name}: ${detail}`);
};
const read = (path) => readFileSync(join(root, path), "utf8");

const policyPath = "apps/api/src/services/authorLensPolicy.ts";
const rankingPath = "apps/api/src/services/authorLensRanking.ts";
const cognitionPath = "apps/api/src/services/authorCognition.ts";
const mouthPath = "apps/api/src/services/authorMouthCandidateSearchCanonical.ts";
const acceptancePath = "apps/api/author-lens-authority-acceptance.ts";
const legacyPath = "apps/api/src/services/authorCharacterLensEngine.ts";

check("policy:exists", existsSync(join(root, policyPath)), "canonical LensPolicy registry exists");
check("ranking:exists", existsSync(join(root, rankingPath)), "canonical LensRanking implementation exists");
check("cognition:exists", existsSync(join(root, cognitionPath)), "Cognition exists");
check("mouth:exists", existsSync(join(root, mouthPath)), "canonical Mouth exists");
check("acceptance:exists", existsSync(join(root, acceptancePath)), "lens authority acceptance exists");
check("legacy:deleted", !existsSync(join(root, legacyPath)), "legacy character lens engine must remain deleted");

const policy = existsSync(join(root, policyPath)) ? read(policyPath) : "";
const ranking = existsSync(join(root, rankingPath)) ? read(rankingPath) : "";
const cognition = existsSync(join(root, cognitionPath)) ? read(cognitionPath) : "";
const mouth = existsSync(join(root, mouthPath)) ? read(mouthPath) : "";
const acceptance = existsSync(join(root, acceptancePath)) ? read(acceptancePath) : "";

check(
  "registry:derived-names",
  /export const CANONICAL_LENS_NAMES\s*=\s*SEEDS\.map\(\(seed\) => seed\.name\)/.test(policy),
  "canonical lens names must derive from the SEEDS registry",
);
check(
  "registry:no-ranking-duplicate",
  !/const policyNames\s*=\s*\[/.test(ranking),
  "LensRanking must not define a second hardcoded lens-name registry",
);
check(
  "ranking:canonical-registry",
  /CANONICAL_LENS_NAMES/.test(ranking),
  "LensRanking consumes canonical lens names",
);
check(
  "ranking:canonical-policy",
  /resolveLensPolicy/.test(ranking),
  "LensRanking resolves policy through canonical LensPolicy",
);
check(
  "cognition:direct-policy",
  /from [\"']\.\/authorLensPolicy\.js[\"']/.test(cognition) && /resolveLensPolicy/.test(cognition),
  "Cognition resolves LensPolicy directly",
);
check(
  "cognition:direct-ranking",
  /from [\"']\.\/authorLensRanking\.js[\"']/.test(cognition) && /rankLensOpportunities/.test(cognition),
  "Cognition ranks lens opportunities through canonical LensRanking",
);
check(
  "mouth:direct-policy",
  /from [\"']\.\/authorLensPolicy\.js[\"']/.test(mouth) && /resolveLensPolicy/.test(mouth),
  "Mouth resolves LensPolicy directly",
);
check(
  "cognition:no-legacy-adapter",
  !/authorCharacterLensEngine\.js/.test(cognition),
  "Cognition does not depend on the deleted character lens engine",
);
check(
  "mouth:no-legacy-adapter",
  !/authorCharacterLensEngine\.js/.test(mouth),
  "Mouth does not depend on the deleted character lens engine",
);
check(
  "acceptance:canonical-policy",
  /authorLensPolicy\.js/.test(acceptance) && /authorLensRanking\.js/.test(acceptance),
  "lens acceptance exercises canonical policy and ranking",
);
check(
  "acceptance:no-legacy-adapter",
  !/authorCharacterLensEngine/.test(acceptance),
  "lens acceptance does not preserve a compatibility adapter path",
);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(absolute);
  }
  return out;
}

for (const file of walk(join(root, "apps/api/src"))) {
  const body = readFileSync(file, "utf8");
  const rel = relative(root, file).replaceAll("\\", "/");
  if (/authorCharacterLensEngine\.js/.test(body)) {
    failures.push(`forbidden-import: ${rel} references deleted authorCharacterLensEngine`);
  }
}

console.log("=== QRE LENS AUTHORITY GUARD ===");
for (const failure of failures) console.error(`FAIL: ${failure}`);
if (failures.length) {
  console.error(`LENS AUTHORITY GUARD FAILED · ${failures.length} violation(s)`);
  process.exit(1);
}
console.log("LENS REGISTRY GREEN");
console.log("LENS RANKING GREEN");
console.log("DIRECT CONSUMERS GREEN");
console.log("LEGACY LENS ADAPTER GREEN");
console.log("LENS AUTHORITY GUARD GREEN");
