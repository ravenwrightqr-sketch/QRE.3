import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { inspectTransformation } from "../../experience/premiseRealizer.js";

/**
 * BUSINESS-FACING TRANSFORMATION ACCEPTANCE
 *
 * The compiler must preserve concrete reality while allowing the cognitive
 * shape and creative tone to vary. These are deliberately cross-domain probes:
 * the domain is content, not architecture.
 */

const prompts = [
  {
    name: "Coco groomer",
    prompt: "Make a funny dog groomer story receipt about Coco to send to the client. Show Coco arriving, getting groomed, looking great, and being ready to go home.",
    mustInclude: [/coco/i, /groom/i],
    mustTransform: true,
  },
  {
    name: "Housekeeper",
    prompt: "Make a playful story receipt for Maria. The housekeeper cleaned the kitchen and living room, and the home is ready for the client.",
    mustInclude: [/kitchen|living room/i, /home|clean/i],
    mustTransform: true,
  },
  {
    name: "Mechanic",
    prompt: "Make a confident customer story for Mike. His brakes were repaired and the car is ready to drive again.",
    mustInclude: [/brake/i, /car/i],
    mustTransform: true,
  },
  {
    name: "Wedding",
    prompt: "Create a beautiful wedding story from the ceremony to the reception and leave the couple with a memory they can keep.",
    mustInclude: [/wedding|ceremony|reception/i, /memory/i],
    mustTransform: true,
  },
  {
    name: "Old bicycle",
    prompt: "Turn my old red bicycle into a funny story that people can keep adding to.",
    mustInclude: [/bicycle/i, /red/i],
    mustTransform: true,
  },
  {
    name: "Gym",
    prompt: "Make a hard-charging story about Jordan finishing a brutal workout, hitting a new personal record, and walking out exhausted but proud.",
    mustInclude: [/Jordan/i, /workout/i, /record|proud/i],
    mustTransform: true,
  },
  {
    name: "Couple memory",
    prompt: "Create a romantic memory story for Alex and Sam about their first date at the little Italian restaurant where they stayed talking until closing.",
    mustInclude: [/Alex|Sam/i, /Italian restaurant/i, /first date/i],
    mustTransform: true,
  },
  {
    name: "Rave memory",
    prompt: "Make a wild rave memory about the warehouse, the bass, the lights, and the moment the whole crowd started dancing together.",
    mustInclude: [/warehouse/i, /bass/i, /lights/i, /crowd|dancing/i],
    mustTransform: true,
  },
  {
    name: "Rescue animal",
    prompt: "Tell the story of Luna being rescued, meeting her foster family, and finally finding a home where she can stay.",
    mustInclude: [/Luna/i, /rescued|rescue/i, /foster/i, /home/i],
    mustTransform: true,
  },
  {
    name: "House memory",
    prompt: "Build a continuing story for the old house: the front porch, the kitchen, the first family dinner, and all the memories that can be added later.",
    mustInclude: [/house/i, /porch/i, /kitchen/i, /family dinner/i],
    mustTransform: true,
  },
  {
    name: "Geo memory",
    prompt: "Create a location memory for Riverside at sunset: the streetlights came on, the air cooled down, and the place felt completely different at night.",
    mustInclude: [/Riverside/i, /sunset/i, /streetlights/i, /night/i],
    mustTransform: true,
  },
];

const robotic = /\b(?:acts:|adds to what is happening|becomes identifiable|goes further by|reaches the payoff by|takes the next step:|carries the result forward by|another visible detail is|the difference is visible in|the payoff remains tied to)\b/i;
const leakedSemantic = /\b(?:the situation is static|the subject has a concrete reason to continue|a concrete unexpected detail has entered the experience|the initial surprise now produces|the creative turn lands as|the current state remains available)\b/i;

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
  assert.equal(leakedSemantic.test(text), false, `${probe.name}: cognitive control language leaked into customer prose`);
  assert.ok(compiled.story.beats.length >= 3 && compiled.story.beats.length <= 7, `${probe.name}: story escaped the 3–7 scene budget`);
  if (probe.mustTransform) {
    assert.ok(compiled.story.beats.some((beat) => /transformation|payoff/i.test(beat.kind)), `${probe.name}: no transformation/payoff beat survived`);
  }

  console.log("\n✓ transformation acceptance passed");
}

console.log("\n============================================================");
console.log("✓ UNIVERSAL TRANSFORMATION / BUSINESS EXPERIENCE ACCEPTANCE PASSED");
console.log("============================================================");
