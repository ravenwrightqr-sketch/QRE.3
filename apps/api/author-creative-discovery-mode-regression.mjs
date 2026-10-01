import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./src/services/authorCreativeDiscovery.ts", import.meta.url),
  "utf8",
);

assert.match(
  source,
  /mode:\s*"RELATIONAL"\s*\|\s*"METAMORPHIC"/,
  "Discovery candidate type must retain the compatibility mode field",
);
assert.match(
  source,
  /const DEFAULT_DISCOVERY_MODE:\s*AuthorCreativeCandidate\["mode"\]\s*=\s*"RELATIONAL";/,
  "Discovery must assign the existing compatibility/default mode internally",
);
assert.match(
  source,
  /mode:\s*DEFAULT_DISCOVERY_MODE/,
  "normalized Discovery candidates must receive deterministic compatibility mode",
);
assert.doesNotMatch(
  source,
  /function normalizeMode/,
  "Discovery mode must not be normalized from model output",
);
assert.doesNotMatch(
  source,
  /mode:\s*candidate\.mode/,
  "Discovery verification/repair model payloads must not include candidate mode",
);
assert.doesNotMatch(
  source,
  /mode:\s*\{\s*type:\s*"string"\s*,\s*enum:\s*\["RELATIONAL",\s*"METAMORPHIC"\]\s*\}/,
  "Discovery model-facing schemas must not ask models to author mode",
);
assert.doesNotMatch(
  source,
  /required:\s*\[[^\]]*"mode"[^\]]*\]/,
  "Discovery model-facing schemas must not require mode",
);
assert.doesNotMatch(
  source,
  /RELATIONAL means|METAMORPHIC means/,
  "Discovery prompt must not teach mode labels as creative semantics",
);
console.log("AUTHOR CREATIVE DISCOVERY MODE REGRESSION GREEN - MODE IS INTERNAL COMPATIBILITY ONLY");
