import assert from "node:assert/strict";
import { compileUniversalRealityExperience } from "../universalRealityCompiler.js";

const cases = [
  {
    name: "service memory",
    prompt: "Maria went to tango with the kitchen and bathrooms today at 9:04 AM, then the living room finally surrendered.",
    required: ["Maria", "kitchen", "bathrooms"],
  },
  {
    name: "airbnb without invented owner",
    prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
    required: ["house", "guests", "kitchen"],
    forbidden: ["owner", "homeowner"],
  },
  {
    name: "relationship continuity",
    prompt: "We were back at the Italian restaurant we met at two weeks ago at 7pm, and we stayed talking until closing.",
    required: ["Italian restaurant", "two weeks ago", "7pm"],
  },
  {
    name: "geo event",
    prompt: "At 11:45pm on Saturday, the warehouse doors opened on Harbor Street and the band walked into the rain.",
    required: ["Harbor Street", "11:45pm", "Saturday", "band"],
  },
  {
    name: "wedding",
    prompt: "The ceremony ended, the couple laughed through the reception, and the last dance became the part everyone kept talking about.",
    required: ["ceremony", "couple", "reception", "last dance"],
  },
  {
    name: "rescue",
    prompt: "Luna was rescued from the shelter, learned to trust people, and eventually slept beside the new family.",
    required: ["Luna", "shelter", "rescued"],
  },
  {
    name: "creative prompt",
    prompt: "Make a genuinely terrifying haunted-house experience with a hallway that keeps getting longer.",
    required: ["haunted-house", "hallway"],
  },
];

for (const testCase of cases) {
  const result = compileUniversalRealityExperience(testCase.prompt);
  const text = result.beats.map((beat) => beat.text).join(" ").toLowerCase();

  for (const anchor of testCase.required) {
    assert.ok(text.includes(anchor.toLowerCase()), `${testCase.name}: missing source evidence '${anchor}'`);
  }

  for (const forbidden of testCase.forbidden ?? []) {
    assert.ok(!text.includes(forbidden.toLowerCase()), `${testCase.name}: invented participant/role '${forbidden}'`);
  }

  assert.ok(result.moments.length >= 3, `${testCase.name}: too few runtime moments`);
  assert.equal(result.moments.length, result.cinematicScenes.length, `${testCase.name}: moment/scene drift`);

  const unique = new Set(result.moments.map((moment) => moment.type === "message" ? moment.text.trim().toLowerCase() : JSON.stringify(moment)));
  assert.ok(unique.size >= Math.min(3, result.moments.length), `${testCase.name}: repetitive realization`);

  const leaked = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|trajectory|mechanic|result is available|current state|next experiential state)\b/i;
  assert.ok(!leaked.test(text), `${testCase.name}: cognitive scaffolding leaked into customer language`);

  console.log(`✓ ${testCase.name}`);
  result.beats.forEach((beat, i) => console.log(`  ${i + 1}. ${beat.text}`));
}

console.log("UNIVERSAL REALITY ACCEPTANCE: PASS");
