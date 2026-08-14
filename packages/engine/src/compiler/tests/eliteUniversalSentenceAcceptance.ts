import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const CASES = [
  {
    name: "pet memory",
    prompt: "Coco walked in suspicious of the whole arrangement. The bath changed the mood. Then Coco stole a bow like compensation was part of the package. By pickup, the whole ordeal had apparently been forgiven.",
    must: ["Coco", "bath", "bow"],
    mustNot: ["owner", "homeowner", "customer"],
  },
  {
    name: "airbnb without invented owner",
    prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
    must: ["Airbnb", "Guests", "kitchen", "five stars"],
    mustNot: ["owner", "homeowner", "host"],
  },
  {
    name: "dated concert",
    prompt: "The concert started at 8pm on Friday at Riverside Theater. The crowd got restless, then the first song hit and everyone was excited.",
    must: ["8pm", "Friday", "Riverside Theater", "first song"],
  },
  {
    name: "explicit kids only",
    prompt: "Create a treasure hunt for kids with clues hidden around the museum.",
    must: ["kids", "clues", "museum"],
  },
  {
    name: "no invented kids",
    prompt: "Create a treasure hunt with clues hidden around the museum.",
    must: ["clues", "museum"],
    mustNot: ["kids", "children"],
  },
  {
    name: "family object memory",
    prompt: "My grandfather's old watch sat in a drawer for years. I found it, cleaned it, and gave it to my sister.",
    must: ["grandfather", "watch", "drawer", "sister"],
  },
  {
    name: "place and time memory",
    prompt: "We were back at the Italian restaurant where we met two weeks ago at 7pm. The lights went out and we kept talking.",
    must: ["Italian restaurant", "two weeks ago", "7pm", "lights"],
  },
  {
    name: "service without owner inference",
    prompt: "Maria cleaned the kitchen and bathrooms today.",
    must: ["Maria", "kitchen", "bathrooms", "today"],
    mustNot: ["owner", "homeowner", "host"],
  },
  {
    name: "general horror lens",
    prompt: "Make a genuinely terrifying escape-room experience where the clock stops and the door will not open.",
    must: ["clock", "door"],
  },
  {
    name: "memory growth",
    prompt: "Turn a forgotten family recipe into something everyone can add to over the years.",
    must: ["family", "recipe"],
  },
];

const FORBIDDEN_TEMPLATE = /\b(?:entered the picture|got underway|part that stayed|detail that stayed|the day moved on|the story moved|the experience can|by the end, the difference was easy to see)\b/i;
const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|trajectory|mechanic|experience plan|story structure|delivery pipeline)\b/i;

for (const test of CASES) {
  const result = compileCognitiveExperience(test.prompt);
  const sentences = result.story.beats.map((beat) => beat.text.trim()).filter(Boolean);
  const text = sentences.join(" ");
  const lower = text.toLowerCase();

  assert(sentences.length >= 2, `${test.name}: too few sentences`);
  assert.equal(new Set(sentences.map((value) => value.toLowerCase())).size, sentences.length, `${test.name}: duplicate sentence`);
  assert(!LEAK.test(text), `${test.name}: compiler vocabulary leaked\n${text}`);
  assert(!FORBIDDEN_TEMPLATE.test(text), `${test.name}: generic template survived\n${text}`);

  for (const anchor of test.must ?? []) {
    assert(lower.includes(anchor.toLowerCase()), `${test.name}: missing explicit evidence '${anchor}'\n${text}`);
  }

  for (const forbidden of test.mustNot ?? []) {
    assert(!lower.includes(forbidden.toLowerCase()), `${test.name}: invented entity '${forbidden}'\n${text}`);
  }

  const source = test.prompt.toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").trim();
  assert(text.toLowerCase().trim() !== source, `${test.name}: sentence output is just the prompt normalized`);

  console.log(`\n=== ${test.name} ===`);
  sentences.forEach((sentence, index) => console.log(`${String(index + 1).padStart(2, "0")}. ${sentence}`));
}

console.log("\nELITE UNIVERSAL SENTENCE ACCEPTANCE: PASS");
