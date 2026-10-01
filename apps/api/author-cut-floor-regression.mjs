import assert from "node:assert/strict";
import { evaluateAuthorCut } from "./dist/services/authorCutFloor.js";

function reasonsFor(text, facts = ["The visit happened."]) {
  return evaluateAuthorCut(text, {
    subject: "Case",
    facts,
    semanticAuthority: [
      "brief rebellion",
      "short visit",
      "long meeting",
      "duration characterization",
    ],
  }).reasons;
}

for (const text of [
  "A brief rebellion.",
  "A short visit.",
  "A long meeting.",
]) {
  assert.ok(
    !reasonsFor(text).includes("unsupported-temporal-comparison"),
    `non-comparative duration characterization must not trigger temporal comparison: ${text}`,
  );
}

for (const text of [
  "Shorter than before.",
  "Longer than usual.",
  "Faster this time.",
  "The longest one yet.",
  "Less quickly than before.",
  "As slow as last time.",
]) {
  assert.ok(
    reasonsFor(text).includes("unsupported-temporal-comparison"),
    `unsupported temporal comparison must still be detected: ${text}`,
  );
}

assert.ok(
  !reasonsFor("Longer than usual.", ["The visit was longer than usual."])
    .includes("unsupported-temporal-comparison"),
  "a supplied temporal comparison should not be rejected as unsupported",
);

console.log("AUTHOR CUT FLOOR REGRESSION GREEN - TEMPORAL COMPARISON IS COMPARATIVE");
