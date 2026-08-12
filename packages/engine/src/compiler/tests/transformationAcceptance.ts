import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { inspectTransformation } from "../../experience/premiseRealizer.js";

/**
 * BUSINESS-FACING TRANSFORMATION ACCEPTANCE
 *
 * These probes do not merely prove that cognition exists. They print the
 * actual customer-facing experience and enforce the central product promise:
 * ordinary prompts should become concrete, attention-moving experiences.
 */

const prompts = [
  {
    name: "Coco groomer",
    prompt:
      "Make a funny dog groomer story receipt about Coco to send to the client. Show Coco arriving, getting groomed, looking great, and being ready to go home.",
    mustInclude: [/coco/i, /groom/i],
    mustTransform: true,
  },
  {
    name: "Housekeeper",
    prompt:
      "Make a playful story receipt for Maria. The housekeeper cleaned the kitchen and living room, and the home is ready for the client.",
    mustInclude: [/kitchen|living room/i, /home|clean/i],
    mustTransform: true,
  },
  {
    name: "Mechanic",
    prompt:
      "Make a confident customer story for Mike. His brakes were repaired and the car is ready to drive again.",
    mustInclude: [/brake/i, /car/i],
    mustTransform: true,
  },
  {
    name: "Wedding",
    prompt:
      "Create a beautiful wedding story from the ceremony to the reception and leave the couple with a memory they can keep.",
    mustInclude: [/wedding|ceremony|reception|memory/i],
    mustTransform: true,
  },
  {
    name: "Old bicycle",
    prompt:
      "Turn my old red bicycle into a funny story that people can keep adding to.",
    mustInclude: [/bicycle/i],
    mustTransform: true,
  },
];

const robotic = /\b(?:acts:|adds to what is happening|becomes identifiable|goes further by|reaches the payoff by|takes the next step:|carries the result forward by|another visible detail is|the difference is visible in|the payoff remains tied to)\b/i;

for (const probe of prompts) {
  const compiled = compileCognitiveExperience(probe.prompt);
  const story = compiled.story.beats.map((beat) => beat.text).filter(Boolean);
  const text = story.join(" ");

  console.log("\n============================================================");
  console.log(`TRANSFORMATION LAB — ${probe.name}`);
  console.log("============================================================");
  console.log(`PROMPT: ${probe.prompt}`);
  console.log("\nPLAYABLE EXPERIENCE:\n");
  for (const [index, beat] of compiled.story.beats.entries()) {
    console.log(`${String(index + 1).padStart(2, "0")} ${beat.kind.toUpperCase()}: ${beat.text}`);
  }

  const transformation = inspectTransformation(compiled.story.beats[0]!, compiled.cognition.plan);
  console.log("\nTRANSFORMATION READ:", JSON.stringify(transformation, null, 2));

  assert.ok(story.length >= 3, `${probe.name}: too few playable beats`);
  for (const pattern of probe.mustInclude) {
    assert.match(text, pattern, `${probe.name}: concrete prompt evidence disappeared`);
  }
  assert.equal(robotic.test(text), false, `${probe.name}: robotic compiler prose survived`);
  if (probe.mustTransform) {
    assert.ok(
      compiled.story.beats.some((beat) => /transformation|payoff/i.test(beat.kind)),
      `${probe.name}: no transformation/payoff beat survived`,
    );
  }

  console.log("\n✓ transformation acceptance passed");
}

console.log("\n============================================================");
console.log("✓ UNIVERSAL TRANSFORMATION / BUSINESS EXPERIENCE ACCEPTANCE PASSED");
console.log("============================================================");
