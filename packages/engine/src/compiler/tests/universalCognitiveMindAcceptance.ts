import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../cognition/universalMind.js";

type AcceptanceCase = {
  name: string;
  prompt: string;
  anchors: readonly string[];
  forbidden?: readonly string[];
};

const cases: readonly AcceptanceCase[] = [
  { name: "pet comedy", prompt: "Coco came to the groomer at 9 AM, loved the bath, stole a blue bow, and went home.", anchors: ["Coco", "groomer", "bath", "blue bow"] },
  { name: "home service", prompt: "Maria cleaned the kitchen and bathrooms at 9:04 AM, then the living room finally surrendered.", anchors: ["Maria", "kitchen", "bathrooms", "living room"] },
  { name: "relationship return", prompt: "Alex and Sam went back to the little Italian restaurant where they met two weeks ago at 7 PM and stayed until closing.", anchors: ["Alex", "Sam", "Italian restaurant", "7 PM", "closing"] },
  { name: "event night", prompt: "The concert started at 8 PM Friday at Riverside Theater, the crowd got restless, and the first song hit hard.", anchors: ["concert", "8 PM", "Riverside Theater", "crowd"] },
  { name: "object memory", prompt: "This blue teapot has been in our family for forty years and appeared at every Thanksgiving until Grandma died.", anchors: ["blue teapot", "family", "forty years", "Thanksgiving", "Grandma"] },
  { name: "event ticket", prompt: "Apocalypse Rave is Saturday at 9 PM on Harbor Street. Sara plays a laundry set and everyone stays until sunrise.", anchors: ["Apocalypse Rave", "Saturday", "9 PM", "Harbor Street", "Sara", "sunrise"] },
  { name: "airbnb neutrality", prompt: "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.", anchors: ["house", "Airbnb", "Guests", "kitchen", "five stars"], forbidden: ["owner", "homeowner"] },
  { name: "horror lens", prompt: "We returned to the restaurant where we met. The chairs were suddenly circled around us and the lights went out. Make it horror.", anchors: ["restaurant", "chairs", "lights"] },
  { name: "rescue", prompt: "Luna came home from the shelter terrified, hid under the table, and finally ate from my hand that night.", anchors: ["Luna", "shelter", "terrified", "table", "ate"] },
  { name: "physical art", prompt: "This keychain traveled with us to Santa Monica, the desert, and the lake. The best memory happened at sunrise.", anchors: ["keychain", "Santa Monica", "desert", "lake", "sunrise"] },
] as const;

const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|internal state|generated output|result is available)\b/i;
const ROBOTIC = /\b(?:approached .* compensation|negotiat(?:ed|ing) terms|arrived with opinions|entered like there was already a disagreement)\b/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const text = result.moments.map((m) => m.text ?? m.description ?? m.title ?? "").join(" ");
  for (const anchor of testCase.anchors) assert.ok(text.toLowerCase().includes(anchor.toLowerCase()), `${testCase.name}: missing '${anchor}'`);
  for (const forbidden of testCase.forbidden ?? []) assert.ok(!text.toLowerCase().includes(forbidden.toLowerCase()), `${testCase.name}: invented '${forbidden}'`);
  assert.ok(result.moments.length >= 2, `${testCase.name}: too few experience moments`);
  assert.equal(result.moments.length, result.cinematicScenes.length, `${testCase.name}: moment/scene drift`);
  assert.ok(!LEAK.test(text), `${testCase.name}: cognitive leakage`);
  assert.ok(!ROBOTIC.test(text), `${testCase.name}: robotic generic realization`);
}

const relationship = compileCognitiveExperience("Alex and Sam went back to the little Italian restaurant where they met two weeks ago at 7 PM and stayed until closing.");
assert.ok(relationship.world.participants.includes("Alex"), "relationship world lost Alex");
assert.ok(relationship.world.participants.includes("Sam"), "relationship world lost Sam");
assert.ok(relationship.world.relations.some((relation) => relation.from === "Alex" && /restaurant/i.test(relation.to)), "relationship world lost Alex/place relation");
assert.ok(relationship.world.relations.some((relation) => relation.from === "Sam" && /restaurant/i.test(relation.to)), "relationship world lost Sam/place relation");
assert.ok(relationship.moments.map((m) => m.text ?? "").join(" ").toLowerCase().includes("alex"), "relationship realization lost Alex");
assert.ok(relationship.moments.map((m) => m.text ?? "").join(" ").toLowerCase().includes("sam"), "relationship realization lost Sam");

const resolved = compileCognitiveExperience("We went back two weeks later at 7 PM.", { memorySummary: ["Alex and Sam met at the Little Italian restaurant two weeks ago."] });
assert.ok(resolved.world.places.some((p) => /Italian restaurant|restaurant/i.test(p)), "memory should resolve a unique place");
assert.equal(resolved.adaptiveQuestions.length, 0, "known unique memory should not trigger a question");

const ambiguous = compileCognitiveExperience("We went back two weeks later at 7 PM.", { memorySummary: ["First met at the Little Italian restaurant.", "Later returned to Harbor Street."] });
assert.ok(ambiguous.adaptiveQuestions.includes("Which place did you go back to?"), "ambiguous memory should ask one targeted question");

const plain = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous.");
const comedy = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it funny.");
const horror = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it horror.");
const plainText = plain.moments.map((m) => m.text ?? "").join(" ");
const comedyText = comedy.moments.map((m) => m.text ?? "").join(" ");
const horrorText = horror.moments.map((m) => m.text ?? "").join(" ");
assert.notEqual(comedyText, plainText, "comedy lens did not change performance");
assert.notEqual(horrorText, plainText, "horror lens did not change performance");
assert.ok(/Coco/i.test(comedyText) && /Coco/i.test(horrorText), "creative lens lost source identity");

const learning = compileCognitiveExperience("Coco stole the blue bow.", { creativePreferences: ["playful", "short sentences"], feedback: { accepted: ["absurd interpretation"], rejected: ["generic opener"] } });
assert.ok(learning.learningSignals.some((s) => s.includes("accepted:absurd interpretation")), "learning signal missing");

console.log("UNIVERSAL COGNITIVE MIND ACCEPTANCE: PASS");
