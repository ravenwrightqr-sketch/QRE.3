import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const promptStart = source.indexOf('"You are QRE Creative Search."');
const promptEnd = source.indexOf('"Protect strange thinking; police factual invention later."', promptStart);

assert.ok(promptStart >= 0, "Creative Search prompt not found");
assert.ok(promptEnd > promptStart, "Creative Search prompt end not found");

const prompt = source.slice(promptStart, promptEnd + 80);
const userInstructionStart = source.indexOf("Return exactly three independent notices.", promptEnd);
const userInstruction = source.slice(userInstructionStart, userInstructionStart + 700);
const schemaStart = source.indexOf("jsonSchema:", userInstructionStart);
const schemaEnd = source.indexOf(").catch", schemaStart);
assert.ok(schemaStart > userInstructionStart, "Creative Search schema not found");
assert.ok(schemaEnd > schemaStart, "Creative Search schema end not found");
const schema = source.slice(schemaStart, schemaEnd);

function mustContain(text, pattern, label) {
  assert.match(text, pattern, label);
}

function mustNotContain(text, pattern, label) {
  assert.doesNotMatch(text, pattern, label);
}

mustContain(
  prompt,
  /Reality is evidence for thought\./,
  "Creative Search must frame reality as evidence for thought",
);
mustContain(
  prompt,
  /Keep evidence description, semantic translation, and explanatory reasoning private\./,
  "Creative Search must not ask for evidence description",
);
mustContain(
  prompt,
  /Give the thought made possible by the evidence\./,
  "Creative Search must not ask for evidence explanation",
);
mustContain(
  prompt,
  /semantic translation, and explanatory reasoning private/,
  "Creative Search must reject semantic translation",
);
mustContain(
  prompt,
  /Think because of the evidence, then give the thought\./,
  "Creative Search must skip intermediate explanation",
);
mustContain(
  prompt,
  /One supplied atom may support an entire conception\./,
  "Creative Search must allow one supplied atom to support a whole conception",
);
mustContain(
  prompt,
  /Unused supplied facts are completely legal\./,
  "Creative Search must allow unused supplied facts",
);
mustContain(
  prompt,
  /do not need to divide or collectively cover the supplied reality/i,
  "Creative Search must not require A/B/C to divide or collectively cover evidence",
);
mustContain(
  prompt,
  /Multiple conceptions may use the same evidence/i,
  "Creative Search must allow conceptions to reuse the same evidence",
);
mustContain(
  prompt,
  /evidenceEventIds are provenance only/i,
  "Creative Search must treat evidenceEventIds as provenance",
);
mustContain(
  prompt,
  /not output slots, rewrite assignments, coverage obligations/i,
  "Creative Search must not treat evidence as output or coverage assignment",
);
mustContain(
  prompt,
  /perception that was not already contained in the supplied fact wording/i,
  "Creative Search must ask for new perception rather than source explanation",
);
mustContain(
  prompt,
  /Keep concrete participation and world commitments inside supplied evidence: participants, objects, places, physical actions, interactions, observations, sensory facts, measurements, motives, outcomes, recurrence, physical conditions, causality, and chronology/i,
  "Creative Search must preserve closed-world concrete reality protection",
);
mustContain(
  prompt,
  /Return only conception and evidenceEventIds for each notice/i,
  "Creative Search must forbid replacement intermediate fields",
);
mustContain(
  userInstruction,
  /exactly three independent notices/i,
  "Creative Search must keep exactly three independent notices",
);
mustContain(
  userInstruction,
  /Each notice must contain only conception and evidenceEventIds/i,
  "Creative Search user instruction must require only conception and evidenceEventIds",
);
mustContain(
  userInstruction,
  /keep explanation and semantic translation private/i,
  "Creative Search user instruction must reject explanatory replacement fields",
);
mustContain(prompt, /Let the discovered relationship supply the pressure and the treatment accelerate it/,
  "Treatment must amplify discovered meaning");
mustNotContain(prompt, /"Do not|"Never/i, "Creative Search should direct creation positively");
mustContain(
  schema,
  /required:\s*\["notices"\]/,
  "Creative Search schema must still require notices",
);
mustContain(
  schema,
  /minItems:\s*3,\s*\n\s*maxItems:\s*3,/,
  "Creative Search schema must still require exactly three notices",
);
mustContain(
  schema,
  /required:\s*\["evidenceEventIds", "conception"\]/,
  "Creative Search notice schema must require evidenceEventIds and conception",
);
mustNotContain(schema, /\battention\b/, "Creative Search schema must not contain attention");

for (const field of [
  "observation",
  "meaning",
  "interpretation",
  "relation",
  "rationale",
  "explanation",
  "theme",
  "mechanic",
  "lens",
]) {
  mustNotContain(
    schema,
    new RegExp(`\\b${field}\\b`, "i"),
    `Creative Search schema must not add replacement field ${field}`,
  );
}

mustContain(
  source,
  /const sourceRelation = "model-selected evidence provenance";/,
  "Creative Search must use neutral downstream sourceRelation compatibility",
);
mustContain(
  source,
  /creativePressure:\s*conception,/,
  "Creative Search conception must still reach downstream treatments",
);
mustContain(
  source,
  /treatment:\s*conception,/,
  "Creative Search conception must still reach Mouth as treatment",
);
mustContain(
  source,
  /perceptionDelta:\s*conception,/,
  "Creative Search conception must still reach Mouth as perception delta",
);

console.log("AUTHOR CREATIVE SEARCH PROMPT GREEN - NO ATTENTION FIELD - PROVENANCE ONLY - THREE CONCEPTIONS");
