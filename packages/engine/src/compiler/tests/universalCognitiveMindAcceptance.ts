import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../cognition/universalMind.js";
import { resolveMemory } from "../../cognition/memoryResolver.js";

type AcceptanceCase = { name: string; prompt: string; anchors: readonly string[]; forbidden?: readonly string[] };
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
  { name: "arbitrary named place", prompt: "Alex and Sam met at Disneyland in June, returned to Huntington Beach Pier in August, and left smiling.", anchors: ["Alex", "Sam", "Disneyland", "Huntington Beach Pier", "August"] },
  { name: "novel place phrase", prompt: "We waited beside the old observatory behind the abandoned rail depot until midnight.", anchors: ["old observatory", "abandoned rail depot", "midnight"] },
] as const;
const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|mechanic|mechanics|latent movie|internal state|generated output|result is available)\b/i;
const ROBOTIC = /\b(?:approached .* compensation|negotiat(?:ed|ing) terms|arrived with opinions|entered like there was already a disagreement)\b/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const text = result.moments.map((m) => m.text ?? m.description ?? m.title ?? "").join(" ");
  for (const anchor of testCase.anchors) assert.ok(text.toLowerCase().includes(anchor.toLowerCase()), `${testCase.name}: missing '${anchor}'`);
  for (const forbidden of testCase.forbidden ?? []) assert.ok(!text.toLowerCase().includes(forbidden.toLowerCase()), `${testCase.name}: invented '${forbidden}'`);
  assert.ok(result.moments.length >= 1, `${testCase.name}: no experience moments`);
  assert.equal(result.moments.length, result.cinematicScenes.length, `${testCase.name}: moment/scene drift`);
  assert.ok(!LEAK.test(text), `${testCase.name}: cognitive leakage`);
  assert.ok(!ROBOTIC.test(text), `${testCase.name}: robotic generic realization`);
}

const homeService = compileCognitiveExperience("Maria cleaned the kitchen and bathrooms at 9:04 AM, then the living room finally surrendered.");
assert.ok(homeService.world.entities.some((value) => /living room/i.test(value)), "world model must preserve unseen location-like entities");
assert.ok(homeService.world.evidence.some((item) => /living room/i.test(item.detail)), "location evidence must survive into world evidence");

const arbitraryPlaces = compileCognitiveExperience("Alex and Sam met at Disneyland in June, returned to Huntington Beach Pier in August, and left smiling.");
assert.ok(arbitraryPlaces.world.places.some((place) => /Disneyland/i.test(place)), "Disneyland must be discovered as a place from context");
assert.ok(arbitraryPlaces.world.places.some((place) => /Huntington Beach Pier/i.test(place)), "Huntington Beach Pier must be discovered as a place from context");
assert.ok(arbitraryPlaces.world.relations.some((relation) => relation.from === "Alex" && relation.relation === "experienced_at" && /Disneyland/i.test(relation.to)), "Alex/Disneyland relation missing");
assert.ok(arbitraryPlaces.world.relations.some((relation) => relation.from === "Sam" && relation.relation === "experienced_at" && /Huntington Beach Pier/i.test(relation.to)), "Sam/pier relation missing");

const multiEvent = compileCognitiveExperience("Alex arrived at the restaurant. Sam joined Alex. They stayed until closing.");
assert.ok(multiEvent.world.events.length >= 2, "multi-event input should preserve multiple world events");
assert.ok(multiEvent.moments.length >= 2, "multiple meaningful events should produce multiple experience moments");
assert.equal(multiEvent.moments.length, multiEvent.cinematicScenes.length, "multi-event moment/scene drift");
assert.ok(multiEvent.moments.map((m) => m.text ?? "").join(" ").toLowerCase().includes("alex"), "multi-event realization lost Alex");
assert.ok(multiEvent.moments.map((m) => m.text ?? "").join(" ").toLowerCase().includes("sam"), "multi-event realization lost Sam");

const relationship = compileCognitiveExperience("Alex and Sam went back to the little Italian restaurant where they met two weeks ago at 7 PM and stayed until closing.");
assert.deepEqual(new Set(relationship.world.participants), new Set(["Alex", "Sam"]), "shared event must preserve both identities");
assert.ok(relationship.world.relations.some((relation) => relation.from === "Alex" && relation.relation === "shared_event" && relation.to === "Sam"), "missing Alex→Sam shared_event relationship");
assert.ok(relationship.world.relations.some((relation) => relation.from === "Sam" && relation.relation === "shared_event" && relation.to === "Alex"), "missing Sam→Alex shared_event relationship");
assert.ok(relationship.world.relations.some((relation) => relation.from === "Alex" && /restaurant/i.test(relation.to)), "relationship world lost Alex/place relation");
assert.ok(relationship.world.relations.some((relation) => relation.from === "Sam" && /restaurant/i.test(relation.to)), "relationship world lost Sam/place relation");
assert.ok(relationship.moments.map((m) => m.text ?? "").join(" ").toLowerCase().includes("alex"), "relationship realization lost Alex");
assert.ok(relationship.moments.map((m) => m.text ?? "").join(" ").toLowerCase().includes("sam"), "relationship realization lost Sam");

const resolvedContext = { memorySummary: ["Alex and Sam met at the Little Italian restaurant two weeks ago."] };
const resolvedMemory = resolveMemory("We went back two weeks later at 7 PM.", resolvedContext);
assert.equal(resolvedMemory.questions.length, 0, `unique memory resolver unexpectedly asked: ${JSON.stringify(resolvedMemory)}`);
const resolved = compileCognitiveExperience("We went back two weeks later at 7 PM.", resolvedContext);
assert.equal(resolved.world.places.length, 1, "memory should rebuild one unique place into current world");
assert.ok(/Little Italian restaurant/i.test(resolved.world.places[0] ?? ""), "memory should resolve the remembered place into current world");
assert.ok(resolved.world.events.some((event) => /Little Italian restaurant/i.test(event.place ?? "")), "resolved memory place must attach to current event");
assert.equal(resolved.adaptiveQuestions.length, 0, "known unique memory should not trigger a question");

const ambiguousContext = { memorySummary: ["First met at the Little Italian restaurant.", "Later returned to Harbor Street."] };
const resolvedAmbiguity = resolveMemory("We went back two weeks later at 7 PM.", ambiguousContext);
assert.ok(resolvedAmbiguity.questions.includes("Which place did you go back to?"), `resolver ambiguity state incorrect: ${JSON.stringify(resolvedAmbiguity)}`);
const ambiguous = compileCognitiveExperience("We went back two weeks later at 7 PM.", ambiguousContext);
assert.ok(ambiguous.adaptiveQuestions.includes("Which place did you go back to?"), `compiler lost resolver ambiguity: ${JSON.stringify({ adaptiveQuestions: ambiguous.adaptiveQuestions, memoryMatches: ambiguous.world.memoryMatches, places: ambiguous.world.places })}`);

const before = compileCognitiveExperience("Alex and Sam met at the Italian restaurant.");
const after = compileCognitiveExperience("Alex and Sam returned to the Italian restaurant where they met.", { memorySummary: ["Alex and Sam met at the Italian restaurant."] });
assert.ok(after.world.memoryMatches.length > 0, "new event must connect to history");
assert.ok(after.discoveries.some((value) => /connects to/i.test(value)), "history connection should become a discovery");
assert.ok(after.world.events.length >= before.world.events.length, "new event must not erase prior world structure");

const plain = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous.");
const comedy = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it funny.");
const horror = compileCognitiveExperience("Coco came in nervous, got a bath, stole a bow, and left looking fabulous. Make it horror.");
const plainText = plain.moments.map((m) => m.text ?? "").join(" ");
const comedyText = comedy.moments.map((m) => m.text ?? "").join(" ");
const horrorText = horror.moments.map((m) => m.text ?? "").join(" ");
assert.notEqual(comedyText, plainText, "comedy lens did not change performance");
assert.notEqual(horrorText, plainText, "horror lens did not change performance");
assert.ok(/Coco/i.test(comedyText) && /Coco/i.test(horrorText), "creative lens lost source identity");

const single = compileCognitiveExperience("The keychain survived the trip.");
assert.equal(single.moments.length, 1, "a single meaningful event should be allowed to produce one moment");

const learning = compileCognitiveExperience("Coco stole the blue bow.", { creativePreferences: ["playful", "short sentences"], feedback: { accepted: ["absurd interpretation"], rejected: ["generic opener"] } });
assert.ok(learning.learningSignals.some((s) => s.includes("accepted:absurd interpretation")), "learning signal missing");

console.log("UNIVERSAL COGNITIVE MIND ACCEPTANCE: PASS");