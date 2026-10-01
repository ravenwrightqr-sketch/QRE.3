import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./src/services/authorCreativeDiscovery.ts", import.meta.url),
  "utf8",
);
const canonicalSource = readFileSync(
  new URL("./src/services/authorBrainCanonical.ts", import.meta.url),
  "utf8",
);

const discoveryStart = source.indexOf("export async function discoverAuthorCreativeDirection");
assert.ok(discoveryStart >= 0, "Discovery function must exist");

const discoverySource = source.slice(discoveryStart);
const systemStart = discoverySource.indexOf("const system = [");
const schemaStart = discoverySource.indexOf("jsonSchema:");
const parsedStart = discoverySource.indexOf("const parsed = parseJson", schemaStart);

assert.ok(systemStart >= 0, "Discovery system prompt must exist");
assert.ok(schemaStart > systemStart, "Discovery model schema must follow prompt");
assert.ok(parsedStart > schemaStart, "Discovery parsing must follow schema");

const promptSource = discoverySource.slice(systemStart, schemaStart);
const schemaSource = discoverySource.slice(schemaStart, parsedStart);
const returnSource = discoverySource.slice(parsedStart);

assert.doesNotMatch(
  schemaSource,
  /"lens"/,
  "Discovery model-facing schema must not ask the model for lens",
);
assert.doesNotMatch(
  schemaSource,
  /\blens:\s*\{\s*type:\s*"string"/,
  "Discovery model-facing schema must not define a lens property",
);
assert.doesNotMatch(
  promptSource,
  /Use the requested lens|otherwise return NONE|choose (?:a |the )?lens|return (?:a |the )?lens/i,
  "Discovery prompt must not teach lens selection or ask the model to return lens",
);

assert.match(
  source,
  /export type AuthorCreativeDiscovery = \{[\s\S]*?\blens:\s*string;/,
  "Discovery output contract must retain lens",
);
assert.match(
  returnSource,
  /lens:\s*requestedLens\s*\|\|\s*"NONE"/,
  "Discovery must deterministically preserve requested lens or return NONE",
);
assert.match(
  source,
  /const requestedLens = clean\(input\.requestedLens\);/,
  "Discovery must preserve requested lens text without model-authored replacement",
);
assert.match(
  canonicalSource,
  /angle:\s*discoveryResult\.discovery\.lens/,
  "Downstream canonical brief contract must still consume discovery.lens",
);

for (const retainedField of [
  "experienceShape",
]) {
  assert.match(
    schemaSource,
    new RegExp(`"${retainedField}"`),
    `Discovery schema must not change ${retainedField}`,
  );
}

assert.doesNotMatch(
  promptSource,
  /CREATIVE_INTENT|requestedLens:/,
  "Requested treatment must not be supplied to meaning discovery",
);
for (const deterministicField of ["playableEventIds", "backgroundEventIds"]) {
  assert.doesNotMatch(
    promptSource,
    new RegExp(deterministicField),
    `Discovery prompt must not assign ${deterministicField} to the model`,
  );
  assert.doesNotMatch(
    schemaSource,
    new RegExp(deterministicField),
    `${deterministicField} must be deterministic, not model-authored`,
  );
  assert.match(
    source,
    new RegExp(`${deterministicField}:\\s*string\\[\\]`),
    `Discovery must retain its ${deterministicField} compatibility output`,
  );
}

console.log("AUTHOR CREATIVE DISCOVERY LENS REGRESSION GREEN - LENS IS DETERMINISTIC OUTPUT ONLY");
