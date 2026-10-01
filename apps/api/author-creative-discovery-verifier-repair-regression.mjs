import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./src/services/authorCreativeDiscovery.ts", import.meta.url),
  "utf8",
);

const verifyStart = source.indexOf("async function verifyDiscoveryCandidates");
const repairStart = source.indexOf("async function repairDiscoveryCandidates");
const discoveryStart = source.indexOf("export async function discoverAuthorCreativeDirection");

assert.ok(verifyStart >= 0, "Discovery verifier must exist");
assert.ok(repairStart > verifyStart, "Discovery repair must follow verifier");
assert.ok(discoveryStart > repairStart, "Discovery main function must follow repair");

const verifySource = source.slice(verifyStart, repairStart);
const repairSource = source.slice(repairStart, discoveryStart);

assert.doesNotMatch(
  verifySource,
  /worthRealizing/,
  "Semantic verifier must not request, return, or consume worthRealizing",
);
assert.match(
  verifySource,
  /required:\s*\["candidateId",\s*"grounded",\s*"unsupportedClaims"\]/,
  "Semantic verifier schema must require only candidate identity, grounded, and unsupportedClaims",
);
assert.match(
  verifySource,
  /Audit factual support only\./,
  "Semantic verifier user instruction must be factual-support only",
);
assert.match(
  verifySource,
  /Do not judge creative strength\./,
  "Semantic verifier must explicitly separate factual authority from creative taste",
);
assert.match(
  verifySource,
  /!unsupportedClaims\.length\s*&&\s*record\.grounded === true\s*&&\s*candidateIds\.has\(candidateId\)/s,
  "Semantic verifier acceptance must depend on grounding and known candidate identity only",
);

for (const banned of [
  "specific perceptual opportunity",
  "Specificity matters",
  "Generic before/after",
  "Do not reward",
  "Milo",
  "squirrels",
  "ritual",
  "ceremony",
  "ballet",
  "noir",
  "courtroom",
  "protocol",
  "IDENTITY MODE",
  "MEMORY MODE",
  "METAMORPHIC",
  "RELATIONAL",
]) {
  assert.doesNotMatch(
    verifySource,
    new RegExp(`\\b${banned.replaceAll(" ", "\\s+")}\\b`, "i"),
    `Semantic verifier prompt must not contain legacy coaching/example term: ${banned}`,
  );
}

assert.match(
  repairSource,
  /Repair is factual salvage only, not a second Discovery pass\./,
  "Repair prompt must define repair as salvage, not generation",
);
assert.match(
  repairSource,
  /Do not invent a new perception, introduce a new relationship, search for a stronger idea, reinterpret different evidence, or optimize for creativity\./,
  "Repair prompt must forbid replacement ideas",
);
assert.match(
  repairSource,
  /If factual narrowing would turn the candidate into a different idea, return no repair\./,
  "Repair prompt must reject repairs that become different ideas",
);
assert.match(
  repairSource,
  /Return zero, one, or two repaired candidates\. Zero is valid\./,
  "Repair prompt must allow zero repaired candidates",
);
assert.match(
  repairSource,
  /replace\(\/-repair\(\?:ed\)\?\$\/i,\s*""\)/,
  "Repair normalization must preserve original candidate ID lineage",
);
assert.match(
  repairSource,
  /\.\.\.original\.evidenceEventIds[\s\S]*\.\.\.candidate\.evidenceEventIds/,
  "Repair normalization must preserve original evidence IDs unless deterministic filtering removes them",
);

for (const banned of [
  "strongest perceptual opportunity",
  "Keep the creative leap",
  "Prefer a specific relation",
  "bland or false",
  "IDENTITY material",
  "MEMORY material",
  "ceremony",
  "suspicion",
  "tenderness",
  "status, significance, atmosphere",
]) {
  assert.doesNotMatch(
    repairSource,
    new RegExp(banned.replaceAll(" ", "\\s+"), "i"),
    `Repair prompt must not contain legacy creative-generator coaching: ${banned}`,
  );
}

for (const deterministicFilter of [
  "candidateCrossesDeterministicTruthFloor",
  "candidateCrossesOperationalServiceTruthFloor",
  "candidateCrossesUnsupportedTemporalEvaluation",
  "candidateReferencesUncitedEvidence",
]) {
  assert.match(
    repairSource,
    new RegExp(deterministicFilter),
    `Repair must retain deterministic filter: ${deterministicFilter}`,
  );
}

console.log("AUTHOR CREATIVE DISCOVERY VERIFIER/REPAIR GREEN - FACTUAL AUTHORITY SEPARATED FROM CREATIVE TASTE");
