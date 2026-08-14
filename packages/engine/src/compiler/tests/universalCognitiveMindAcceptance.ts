import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { compileUniversalExperienceBrain, messageText } from "../universalExperienceBrain.js";

const cases = [
  { name: "pet comedy", prompt: "Coco came to the groomer at 9 AM, loved the bath, stole a blue bow, and went home.", anchors: ["Coco", "groomer", "bath", "blue bow"], },
  { name: "home service", prompt: "Maria cleaned the kitchen and bathrooms at 9:04 AM, then the living room finally surrendered.", anchors: ["Maria", "kitchen", "bathrooms", "living room"], },
  { name: "relationship return", prompt: "Alex and Sam went back to the little Italian restaurant where they met two weeks ago at 7 PM and stayed until closing.", anchors: ["Alex", "Sam", "Italian restaurant", "7 PM", "closing"], },
  { name: "event night", prompt: "The concert started at 8 PM Friday at Riverside Theater, the crowd got restless, and the first song hit hard.", anchors: ["concert", "8 PM", "Riverside Theater", "crowd"], },
  { name: "living memory", prompt: "My grandfather's old watch sat in a drawer for forty years. I found it, cleaned it, and gave it to my sister.", anchors: ["grandfather", "watch", "forty years", "sister"], },
  { name: "event ticket", prompt: "Apocalypse Rave is Saturday at 9 PM on Harbor Street. Sara plays a laundry set and everyone stays until sunrise.", anchors: ["Apocalypse Rave", "Saturday", "9 PM", "Harbor Street", "Sara", "sunrise"], },
  { name: "airbnb neutrality", prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.", anchors: ["house", "Airbnb", "Guests", "kitchen", "five stars"], forbidden: ["owner", "homeowner"], },
  { name: "horror lens", prompt: "We returned to the restaurant where we met. The chairs were suddenly circled around us and the lights went out.", anchors: ["restaurant", "chairs", "lights"], },
  { name: "wedding", prompt: "We got married at 5:30 PM, my dad cried before I did, and the last dance lasted until midnight.", anchors: ["married", "5:30 PM", "dad", "last dance", "midnight"], },
  { name: "object memory", prompt: "This blue teapot has been in our family for forty years and appeared at every Thanksgiving until Grandma died.", anchors: ["blue teapot", "family", "forty years", "Thanksgiving", "Grandma"], },
  { name: "rescue", prompt: "Luna came home from the shelter terrified, hid under the table, and finally ate from my hand that night.", anchors: ["Luna", "shelter", "terrified", "table", "ate"], },
  { name: "physical art", prompt: "This keychain traveled with us to Santa Monica, the desert, and the lake. The best memory happened at sunrise.", anchors: ["keychain", "Santa Monica", "desert", "lake", "sunrise"], },
] as const;

const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|internal state|generated output|result is available)\b/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const text = result.moments.map(messageText).join(" ");
  for (const anchor of testCase.anchors) assert.ok(text.toLowerCase().includes(anchor.toLowerCase()), `${testCase.name}: missing '${anchor}'`);
  for (const forbidden of testCase.forbidden ?? []) assert.ok(!text.toLowerCase().includes(forbidden.toLowerCase()), `${testCase.name}: invented '${forbidden}'`);
  assert.ok(result.moments.length >= 2, `${testCase.name}: too few experience moments`);
  assert.equal(result.moments.length, result.cinematicScenes.length, `${testCase.name}: moment/scene drift`);
  assert.ok(text.length > 40, `${testCase.name}: realization collapsed`);
  assert.ok(!LEAK.test(text), `${testCase.name}: cognitive leakage`);

  console.log(`\n=== ${testCase.name} ===`);
  console.log(`PROMPT: ${testCase.prompt}`);
  result.moments.forEach((moment, index) => console.log(`  ${index + 1}. ${messageText(moment)}`));
}

const memory = compileUniversalExperienceBrain(
  "We went back two weeks later at 7 PM.",
  undefined,
  { memorySummary: ["Alex and Sam met at the Little Italian restaurant two weeks ago."] },
);
assert.ok(memory.world.places.some((place) => /Italian restaurant/i.test(place)), "memory should resolve a unique prior place");
assert.equal(memory.adaptiveQuestions.length, 0, "resolved memory should not ask for a known place");

const ambiguous = compileUniversalExperienceBrain(
  "We went back two weeks later at 7 PM.",
  undefined,
  { memorySummary: ["First met at the Little Italian restaurant.", "Later returned to Harbor Street."] },
);
assert.ok(ambiguous.adaptiveQuestions.includes("Which place did you go back to?"), "ambiguous memory should ask a targeted question");

const plain = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous.");
const horror = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it horror.");
const comedy = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it funny.");
const plainText = plain.moments.map(messageText).join(" ");
const horrorText = horror.moments.map(messageText).join(" ");
const comedyText = comedy.moments.map(messageText).join(" ");
assert.notEqual(horrorText, plainText, "horror lens did not change performance");
assert.notEqual(comedyText, plainText, "comedy lens did not change performance");
assert.ok(/coco/i.test(horrorText) && /coco/i.test(comedyText), "lens lost source identity");

console.log("\nUNIVERSAL COGNITIVE MIND ACCEPTANCE: PASS");
