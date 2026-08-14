import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const cases = [
  {
    prompt: "Coco walked in suspicious of the whole arrangement. The bath changed the mood. Then Coco stole a bow like compensation was part of the package. By pickup, the whole ordeal had apparently been forgiven.",
    must: ["Coco", "bath", "bow"],
  },
  {
    prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
    must: ["Airbnb", "Guests", "kitchen", "five stars"],
    mustNot: ["owner", "homeowner"],
  },
  {
    prompt: "The concert started at 8pm on Friday at Riverside Theater. The crowd got restless, then the first song hit and everyone was excited.",
    must: ["8pm", "Friday", "Riverside Theater", "first song"],
  },
  {
    prompt: "Create a treasure hunt for kids with clues hidden around the museum.",
    must: ["kids", "museum", "clues"],
  },
  {
    prompt: "Create a treasure hunt with clues hidden around the museum.",
    must: ["museum", "clues"],
    mustNot: ["kids", "children"],
  },
  {
    prompt: "My grandfather's old watch sat in a drawer for years. I found it, cleaned it, and gave it to my sister.",
    must: ["grandfather", "watch", "drawer", "cleaned", "sister"],
  },
  {
    prompt: "At 11:45pm on Saturday, the warehouse doors opened on Harbor Street and the band walked into the rain.",
    must: ["11:45pm", "Saturday", "Harbor Street", "band", "rain"],
  },
  {
    prompt: "Make a genuinely terrifying haunted-house experience where the elevator stops between floors and the lights go out.",
    must: ["elevator", "between floors", "lights"],
  },
  {
    prompt: "Turn a forgotten family recipe into something everyone can add to over the years.",
    must: ["family", "recipe"],
  },
];

const leak = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|trajectory|mechanic|experience plan|story structure|delivery pipeline)\b/i;

for (const test of cases) {
  const result = compileCognitiveExperience(test.prompt);
  const sentences = result.story.beats.map((beat) => beat.text.trim()).filter(Boolean);
  const text = sentences.join(" ");

  assert(sentences.length >= 1, `no sentence produced: ${test.prompt}`);
  assert.equal(
    new Set(sentences.map((value) => value.toLowerCase())).size,
    sentences.length,
    `duplicate sentence: ${test.prompt}`,
  );
  assert(!leak.test(text), `compiler language leaked: ${test.prompt}\n${text}`);

  for (const anchor of test.must ?? []) {
    assert(
      text.toLowerCase().includes(anchor.toLowerCase()),
      `required prompt evidence '${anchor}' disappeared: ${test.prompt}\n${text}`,
    );
  }

  for (const forbidden of test.mustNot ?? []) {
    assert(
      !text.toLowerCase().includes(forbidden.toLowerCase()),
      `unprompted participant/entity '${forbidden}' appeared: ${test.prompt}\n${text}`,
    );
  }

  console.log(`\nPROMPT: ${test.prompt}`);
  sentences.forEach((sentence, index) => console.log(`  ${index + 1}. ${sentence}`));
}

console.log("\nUNIVERSAL EXPERIENCE SENTENCE ACCEPTANCE: PASS");
