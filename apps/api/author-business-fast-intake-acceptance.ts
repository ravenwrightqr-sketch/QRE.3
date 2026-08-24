import assert from "node:assert/strict";
import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";
import { parseBusinessRealityInput, toAuthorBrainTruth } from "./src/services/authorBusinessRealityIntake.js";

const fast = parseBusinessRealityInput(
  "Maria",
  "9am / round 1 / kitchen cleaned / bathrooms / around the hallway / master / next time baby",
);

assert.deepEqual(fast.facts, [
  "9am",
  "round 1",
  "kitchen cleaned",
  "bathrooms",
  "around the hallway",
  "master",
  "next time baby",
]);
assert.equal(fast.temporal[0], "9am");
assert.equal(fast.recurrence[0], "round 1");
assert.equal(fast.future[0], "next time baby");

const richer = parseBusinessRealityInput(
  "Maria",
  "9am / round 2 / kitchen annihilated / bathrooms / pile of leaves heading toward the pool / master / next time baby",
);

assert.ok(richer.observations.includes("pile of leaves heading toward the pool"));
assert.equal(richer.facts.length, 7);

const authorInput = toAuthorBrainTruth(richer);
assert.equal(authorInput.subject, "Maria");
assert.equal(authorInput.facts.length, 7);
assert.ok(authorInput.sourceMoments.includes("pile of leaves heading toward the pool"));
assert.equal(authorInput.returning, true);

const result = await authorBrainUniversal(authorInput);
const lines = result.scenes.map((scene) => scene.text).filter(Boolean);

console.log("=".repeat(72));
console.log("QRE BUSINESS FAST INTAKE ACCEPTANCE");
console.log("=".repeat(72));
console.log("RAW INPUT");
console.log(richer.rawInput);
console.log("\nCANONICAL FACTS");
console.dir(authorInput.facts, { depth: null });
console.log("\nOBSERVATIONS");
console.dir(richer.observations, { depth: null });
console.log("\nQRE RECEIPT");
lines.forEach((line, index) => console.log(`${String(index + 1).padStart(2, "0")} · ${line}`));
console.log(`\nquality=${result.diagnostics?.qualityStatus}`);
console.log(`renderable=${result.diagnostics?.renderable}`);
console.log(`candidateSequences=${result.diagnostics?.candidateSequences}`);

assert.ok(lines.length > 0, "fast intake: author produced receipt lines");
console.log("\nQRE BUSINESS FAST INTAKE ACCEPTANCE: PASS");
