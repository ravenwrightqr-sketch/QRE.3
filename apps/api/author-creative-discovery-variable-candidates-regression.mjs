import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./src/services/authorCreativeDiscovery.ts", import.meta.url),
  "utf8",
);

const discoveryStart = source.indexOf("export async function discoverAuthorCreativeDirection");
assert.ok(discoveryStart >= 0, "Discovery function must exist");

const discoverySource = source.slice(discoveryStart);
const schemaStart = discoverySource.indexOf("jsonSchema:");
assert.ok(schemaStart >= 0, "Discovery schema must exist");
const systemStart = discoverySource.indexOf("const system = [");
assert.ok(systemStart >= 0, "Discovery system prompt must exist");

const promptSource = discoverySource.slice(systemStart, schemaStart);
const schemaSource = discoverySource.slice(schemaStart);

assert.doesNotMatch(
  promptSource,
  /CREATE FOUR|Find four|four grounded|four genuinely/i,
  "Discovery prompt must not require exactly four candidates",
);
assert.match(
  promptSource,
  /Return only reads whose meaning can be traced to supplied evidence\./,
  "Discovery prompt must avoid padding candidates",
);
assert.match(
  promptSource,
  /Fewer than the schema allows is valid; zero is valid\./,
  "Discovery prompt must permit fewer than the schema maximum",
);
for (const banned of [
  "ballet",
  "ritual",
  "audit",
  "mission",
  "game",
  "ceremony",
  "noir",
  "courtroom",
  "horror",
  "romance",
  "protocol",
  "operation",
  "RELATIONAL means",
  "METAMORPHIC means",
]) {
  assert.doesNotMatch(
    promptSource,
    new RegExp(`\\b${banned.replaceAll(" ", "\\s+")}\\b`, "i"),
    `Discovery main prompt must not contain legacy term: ${banned}`,
  );
}
assert.match(
  schemaSource,
  /candidates:\s*\{\s*type:\s*"array",\s*minItems:\s*0,\s*maxItems:\s*4,/s,
  "Discovery schema must allow zero to four candidates",
);
assert.doesNotMatch(
  discoverySource,
  /\.slice\(0,\s*4\)/,
  "Discovery normalization must not force a four-candidate cap after generation",
);
assert.match(
  discoverySource,
  /const selected =\s*[\s\S]*candidates\[0\]\s*\?\?\s*fallbackCandidate;/,
  "Discovery selection must still accept one surviving candidate and fall back on zero",
);
assert.match(
  discoverySource,
  /risk:\s*"no_grounded_discovery_candidate"/,
  "Discovery must retain deterministic fallback for zero usable candidates",
);

console.log("AUTHOR CREATIVE DISCOVERY VARIABLE CANDIDATES GREEN - ZERO TO FOUR SUPPORTED");
