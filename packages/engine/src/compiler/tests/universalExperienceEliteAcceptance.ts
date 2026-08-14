import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

/**
 * ELITE UNIVERSAL REALIZATION ACCEPTANCE
 *
 * This suite intentionally cares about the thing the product actually is:
 * the sentences. It does not grant a pass merely because cognition ran.
 */

const cases = [
  {
    name: "memory with concrete continuity",
    prompt: "My grandfather's old watch sat in a drawer for years. I found it, cleaned it, and gave it to my sister.",
    must: ["grandfather", "watch", "drawer", "sister"],
    mustNot: ["owner", "homeowner"],
  },
  {
    name: "airbnb does not invent an owner",
    prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
    must: ["Airbnb", "Guests", "kitchen", "five stars"],
    mustNot: ["owner", "homeowner"],
  },
  {
    name: "location and time survive",
    prompt: "The concert started at 8pm on Friday at Riverside Theater. The crowd got restless, then the first song hit and everyone was excited.",
    must: ["8pm", "Friday", "Riverside Theater", "crowd", "first song"],
  },
  {
    name: "participant only when explicit",
    prompt: "Create a treasure hunt for kids with clues hidden around the museum.",
    must: ["kids", "clues", "museum"],
  },
  {
    name: "no phantom participant",
    prompt: "Create a treasure hunt with clues hidden around the museum.",
    must: ["clues", "museum"],
    mustNot: ["kids", "children"],
  },
  {
    name: "playful lens",
    prompt: "Coco walked into the groomer scared, liked the bath, stole a bow, and walked out happy.",
    must: ["Coco", "bath", "bow"],
  },
  {
    name: "dark lens is not halloween-only",
    prompt: "Make a dark corporate security training experience where the elevator stops between floors and the lights go out.",
    must: ["elevator", "lights"],
  },
  {
    name: "place becomes memory",
    prompt: "We were back at the Italian restaurant we met at two weeks ago at 7pm. The chairs were suddenly circled around us, the lights went out, and we kept talking.",
    must: ["Italian restaurant", "7pm", "chairs", "lights"],
  },
  {
    name: "open-ended creative prompt",
    prompt: "Create something memorable for a museum opening involving a broken robot from 2087.",
    must: ["museum", "robot", "2087"],
  },
];

const leak = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|trajectory|mechanic|experience plan|story structure|delivery pipeline|current state|result is clear|things got underway)\b/i;
const dead = /^(?:the story continued|the day moved on|the difference was easy to see|the result spoke for itself|something happened|the scene changed)\.?$/i;

for (const test of cases) {
  const result = compileCognitiveExperience(test.prompt);
  const sentences = result.story.beats.map((beat) => beat.text.trim()).filter(Boolean);
  const text = sentences.join(" ");

  assert(sentences.length >= 2, `${test.name}: fewer than two sentences\n${text}`);
  assert.equal(
    new Set(sentences.map((value) => value.toLowerCase())).size,
    sentences.length,
    `${test.name}: duplicate sentence\n${text}`,
  );
  assert(!leak.test(text), `${test.name}: implementation prose leaked\n${text}`);
  assert(!sentences.some((value) => dead.test(value)), `${test.name}: dead generic sentence survived\n${text}`);

  for (const anchor of test.must ?? []) {
    assert(text.toLowerCase().includes(anchor.toLowerCase()), `${test.name}: lost prompt evidence '${anchor}'\n${text}`);
  }

  for (const forbidden of test.mustNot ?? []) {
    assert(!text.toLowerCase().includes(forbidden.toLowerCase()), `${test.name}: invented '${forbidden}'\n${text}`);
  }

  const copiedCount = sentences.filter((value) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    const promptNormalized = test.prompt.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    return normalized.length > 35 && promptNormalized.includes(normalized);
  }).length;
  assert(copiedCount === 0, `${test.name}: copied prompt sentence survived\n${text}`);

  console.log(`\n=== ${test.name} ===`);
  console.log(`PROMPT: ${test.prompt}`);
  sentences.forEach((sentence, index) => console.log(`  ${index + 1}. ${sentence}`));
}

console.log("\nELITE UNIVERSAL REALIZATION ACCEPTANCE: PASS");
