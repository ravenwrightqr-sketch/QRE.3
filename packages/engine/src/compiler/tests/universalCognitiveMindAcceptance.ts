import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const cases = [
  {
    name: "pet comedy",
    prompt: "Coco came to the groomer at 9 AM, loved the bath, stole a blue bow, and went home.",
    anchors: ["Coco", "bath", "blue bow"],
    lens: "comedy",
  },
  {
    name: "home service",
    prompt: "Maria cleaned the kitchen and bathrooms at 9:04 AM, then the living room finally surrendered.",
    anchors: ["Maria", "kitchen", "living room"],
  },
  {
    name: "relationship return",
    prompt: "Alex and Sam went back to the little Italian restaurant where they met two weeks ago at 7 PM and stayed until closing.",
    anchors: ["Alex", "Sam", "Italian restaurant", "7 PM"],
    lens: "romance",
  },
  {
    name: "event night",
    prompt: "The concert started at 8 PM Friday at Riverside Theater, the crowd got restless, and the first song hit hard.",
    anchors: ["concert", "8 PM", "Riverside Theater", "crowd"],
  },
  {
    name: "living memory",
    prompt: "My grandfather's old watch sat in a drawer for forty years. I found it, cleaned it, and gave it to my sister.",
    anchors: ["grandfather", "watch", "forty years", "sister"],
  },
  {
    name: "event ticket",
    prompt: "Apocalypse Rave is Saturday at 9 PM on Harbor Street. Sara plays a laundry set and everyone stays until sunrise.",
    anchors: ["Apocalypse Rave", "Saturday", "9 PM", "Harbor Street", "Sara", "sunrise"],
  },
  {
    name: "airbnb neutrality",
    prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
    anchors: ["house", "Airbnb", "Guests", "kitchen", "five stars"],
  },
  {
    name: "horror lens",
    prompt: "We returned to the restaurant where we met. The chairs were suddenly circled around us and the lights went out.",
    anchors: ["restaurant", "chairs", "lights"],
    lens: "horror",
  },
  {
    name: "wedding",
    prompt: "We got married at 5:30 PM, my dad cried before I did, and the last dance lasted until midnight.",
    anchors: ["married", "5:30 PM", "dad", "last dance", "midnight"],
  },
  {
    name: "object memory",
    prompt: "This blue teapot has been in our family for forty years and appeared at every Thanksgiving until Grandma died.",
    anchors: ["blue teapot", "family", "forty years", "Thanksgiving", "Grandma"],
  },
  {
    name: "rescue",
    prompt: "Luna came home from the shelter terrified, hid under the table, and finally ate from my hand that night.",
    anchors: ["Luna", "shelter", "terrified", "table", "ate"],
  },
  {
    name: "physical art",
    prompt: "This keychain traveled with us to Santa Monica, the desert, and the lake. The best memory happened at sunrise.",
    anchors: ["keychain", "Santa Monica", "desert", "lake", "sunrise"],
  },
] as const;

const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|latent movie|internal state|generated output|result is available)\b/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const text = result.moments.map((moment) => moment.text).join(" ");

  for (const anchor of testCase.anchors) {
    assert.match(text.toLowerCase(), new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()), `${testCase.name}: missing source anchor '${anchor}'`);
  }

  assert.ok(result.moments.length >= Math.min(3, testCase.anchors.length), `${testCase.name}: experience did not form a meaningful sequence`);
  assert.ok(!LEAK.test(text), `${testCase.name}: internal cognitive vocabulary leaked into customer prose`);
  assert.ok(text.length > 40, `${testCase.name}: realization collapsed into trivial text`);

  console.log(`\n=== ${testCase.name} ===`);
  console.log(`PROMPT: ${testCase.prompt}`);
  result.moments.forEach((moment, index) => console.log(`  ${index + 1}. ${moment.text}`));
}

const plain = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous.");
const horror = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it horror.");
const comedy = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it funny.");

const plainText = plain.moments.map((m) => m.text).join(" ");
const horrorText = horror.moments.map((m) => m.text).join(" ");
const comedyText = comedy.moments.map((m) => m.text).join(" ");

assert.notEqual(horrorText, plainText, "horror lens did not materially change performance");
assert.notEqual(comedyText, plainText, "comedy lens did not materially change performance");
assert.ok(horrorText.toLowerCase().includes("coco"), "horror lens lost subject reality");
assert.ok(comedyText.toLowerCase().includes("coco"), "comedy lens lost subject reality");

console.log("\nUNIVERSAL COGNITIVE MIND ACCEPTANCE: PASS");
