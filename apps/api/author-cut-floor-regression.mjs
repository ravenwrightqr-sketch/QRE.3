import assert from "node:assert/strict";
import { evaluateAuthorCut } from "./src/services/authorCutFloor.js";

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

function cameraReasonsFor(text) {
  return evaluateAuthorCut(text, {
    subject: "Maple Street house",
    facts: [
      "Front porch photographed on Thursday.",
      "Afternoon showing.",
      "Open house on Saturday.",
      "Offer came Monday.",
      "Jessica is the listing agent.",
      "The porch camera caught the delivery.",
    ],
    semanticAuthority: [
      "the house got attention first",
      "the porch created the first impression",
      "the timeline made Jessica look caught by events",
    ],
  }).reasons;
}

assert.equal(evaluateAuthorCut("Bows.", {
  subject: "Coco", facts: ["Blue bows were added."],
}).accepted, true, "A grounded one-word cut must remain valid");

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

for (const text of [
  "The Maple Street house got its close-up first.",
  "The porch stole the spotlight.",
  "The open house became the second act.",
  "The listing had already taken its shot.",
  "The whole thing felt staged by the calendar.",
  "Jessica got framed by the timeline, not by the camera.",
  "The porch camera caught the delivery.",
]) {
  assert.ok(
    !cameraReasonsFor(text).includes("camera-language"),
    `ordinary rhetorical or world-object language must not trigger camera-language: ${text}`,
  );
}

for (const text of [
  "Close-up on the house.",
  "The camera pans across the porch.",
  "Cut to the front door.",
  "Fade to the kitchen.",
  "We see Jessica enter.",
  "The scene opens on the porch.",
  "Final shot: the Monday offer.",
  "Zoom in on the listing photo.",
  "The camera lingers on the porch.",
  "We open on the house.",
  "A wide shot of the front door.",
  "Frame Jessica beside the sign.",
  "Camera: pan across the porch.",
  "EXT. MAPLE STREET - DAY",
  "INT. KITCHEN - NIGHT",
  "The porch got its close-up first, then we fade to Monday.",
  "The house stole the spotlight. Cut to the front door.",
  "Jessica got framed by the timeline. The camera pans across the porch.",
]) {
  assert.ok(
    cameraReasonsFor(text).includes("camera-language"),
    `presentation machinery must trigger camera-language: ${text}`,
  );
}

console.log("AUTHOR CUT FLOOR REGRESSION GREEN");
