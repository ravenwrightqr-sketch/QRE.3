import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const promptStart = source.indexOf('"You are QRE Creative Search."');
const promptEnd = source.indexOf('"Protect the strange; police the facts."', promptStart);

assert.ok(promptStart >= 0, "Creative Search prompt not found");
assert.ok(promptEnd > promptStart, "Creative Search prompt end not found");

const prompt = source.slice(promptStart, promptEnd + 80);
const userInstructionStart = source.indexOf("Return exactly three independent notices.", promptEnd);
const userInstruction = source.slice(userInstructionStart, userInstructionStart + 700);

function mustContain(text, pattern, label) {
  assert.match(text, pattern, label);
}

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
  /All three notices may use the same supplied event/i,
  "Creative Search must allow all notices to reuse the same evidence",
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
  /Semantic translation is not discovery\./,
  "Creative Search must reject semantic translation as discovery",
);
mustContain(
  prompt,
  /easy paraphrase or abstraction/i,
  "Creative Search must instruct against easy paraphrase or abstraction",
);
mustContain(
  prompt,
  /conceptual synonyms/i,
  "Creative Search must instruct against synonym ladders",
);
mustContain(
  prompt,
  /new perception that was not already present in the source wording/i,
  "Creative Search must ask for new perception rather than source explanation",
);
mustContain(
  prompt,
  /not invent people, objects, places, physical actions, measurements, sensory facts, motives, outcomes, recurrence, concrete physical conditions, or any new concrete occurrence/i,
  "Creative Search must preserve closed-world concrete reality protection",
);
mustContain(
  userInstruction,
  /exactly three independent notices/i,
  "Creative Search must keep exactly three independent notices",
);
mustContain(
  userInstruction,
  /new perception rather than an explanation, paraphrase, or semantic synonym ladder/i,
  "Creative Search user instruction must prefer perception over explanation/paraphrase",
);
mustContain(
  source,
  /required:\s*\["notices"\]/,
  "Creative Search schema must still require notices",
);
mustContain(
  source,
  /minItems:\s*3,\s*\n\s*maxItems:\s*3,/,
  "Creative Search schema must still require exactly three notices",
);
mustContain(
  source,
  /required:\s*\["attention", "evidenceEventIds", "conception"\]/,
  "Creative Search notice schema must still require attention, evidenceEventIds, and conception",
);

console.log("AUTHOR CREATIVE SEARCH PROMPT GREEN - PERCEPTUAL LEAPS - PROVENANCE ONLY - THREE NOTICES");
