import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../cognition/universalMind.js";

type StressCase = { name: string; prompt: string; anchors: readonly string[]; creative?: boolean };

const cases: readonly StressCase[] = [
  { name: "ordinary errand", prompt: "Maya stopped for coffee before work and found a note under the cup.", anchors: ["Maya", "coffee", "note", "cup"] },
  { name: "pet salon", prompt: "Coco arrived nervous, survived the bath, stole the blue bow, and left looking proud.", anchors: ["Coco", "bath", "blue bow"] },
  { name: "repair shop", prompt: "Luis brought in the old guitar on Tuesday, replaced two strings, and heard it sing again.", anchors: ["Luis", "old guitar", "Tuesday", "two strings"] },
  { name: "restaurant memory", prompt: "Alex and Sam returned to the Italian restaurant where they met and ordered the same dessert.", anchors: ["Alex", "Sam", "Italian restaurant", "same dessert"] },
  { name: "family object", prompt: "Grandma's silver watch crossed three generations before it reached Nina.", anchors: ["Grandma", "silver watch", "three generations", "Nina"] },
  { name: "concert", prompt: "The concert started at 8 PM, the crowd went quiet, and the first bass hit shook the room.", anchors: ["concert", "8 PM", "crowd", "bass"] },
  { name: "wedding", prompt: "The wedding is tonight. Everyone knows the couple, but nobody knows what happens after the vows.", anchors: ["wedding", "tonight", "couple", "vows"], creative: true },
  { name: "horror", prompt: "We returned to the motel. The hallway lights blinked, room 12 was open, and nobody remembered leaving it that way.", anchors: ["motel", "hallway lights", "room 12"], creative: true },
  { name: "romance", prompt: "Elena kept the movie ticket from their first date for nine years.", anchors: ["Elena", "movie ticket", "first date", "nine years"], creative: true },
  { name: "comedy", prompt: "The groomer called Max's haircut finished. Max inspected the mirror and immediately objected.", anchors: ["groomer", "Max", "haircut", "mirror"], creative: true },
  { name: "business", prompt: "A bakery launches a midnight pastry and wants the QR experience to feel like an event.", anchors: ["bakery", "midnight pastry", "QR", "event"], creative: true },
  { name: "product", prompt: "This camera survived a road trip through the desert, rain, and one very stupid decision.", anchors: ["camera", "road trip", "desert", "rain"], creative: true },
  { name: "object journey", prompt: "The red suitcase went from Portland to Phoenix to a cabin by the lake.", anchors: ["red suitcase", "Portland", "Phoenix", "cabin", "lake"] },
  { name: "social", prompt: "Four friends met after ten years apart and spent the first twenty minutes laughing at the same story.", anchors: ["Four friends", "ten years", "twenty minutes", "same story"], creative: true },
  { name: "service", prompt: "Maria cleaned the house, found the lost ring behind the dryer, and left the kitchen shining.", anchors: ["Maria", "house", "lost ring", "dryer", "kitchen"] },
  { name: "travel", prompt: "At sunrise we missed the train, bought peaches, and watched the station empty.", anchors: ["sunrise", "missed the train", "peaches", "station"] },
  { name: "memory", prompt: "My father taught me to swim in this pool when I was eight.", anchors: ["father", "swim", "pool", "eight"], creative: true },
  { name: "rave", prompt: "Apocalypse Rave starts Saturday on Harbor Street. Sara plays last and sunrise is the unofficial ending.", anchors: ["Apocalypse Rave", "Saturday", "Harbor Street", "Sara", "sunrise"], creative: true },
  { name: "utility", prompt: "Show guests how to find the emergency exit without making the experience boring.", anchors: ["guests", "emergency exit"], creative: true },
  { name: "sparse", prompt: "Surprise me with the keychain.", anchors: ["keychain"], creative: true },
  { name: "sparse memory", prompt: "Grandpa gave me the compass.", anchors: ["Grandpa", "compass"], creative: true },
  { name: "state change", prompt: "The room was empty, then the lights came on and everyone started talking.", anchors: ["room", "lights", "everyone", "talking"] },
  { name: "three events", prompt: "Jamie arrived. The printer jammed. Jamie fixed it and laughed.", anchors: ["Jamie", "printer", "fixed", "laughed"], creative: true },
  { name: "details", prompt: "The chairs were circled around us, the lights went out, and a blue mug was still warm.", anchors: ["chairs", "lights", "blue mug"] },
  { name: "relationship", prompt: "Alex and Sam met in June, fought in July, and booked the same motel again in August.", anchors: ["Alex", "Sam", "June", "July", "August", "motel"], creative: true },
  { name: "legacy", prompt: "The restaurant has been in the family for forty years and still serves the same soup.", anchors: ["restaurant", "family", "forty years", "same soup"], creative: true },
  { name: "pet rescue", prompt: "Luna came home from the shelter terrified, hid under the table, and finally ate from my hand.", anchors: ["Luna", "shelter", "terrified", "table", "ate"], creative: true },
  { name: "craft", prompt: "Rosa painted the sign by hand, missed a letter, laughed, and kept it anyway.", anchors: ["Rosa", "sign", "hand", "letter", "laughed"] },
  { name: "hotel", prompt: "Guests arrive at the hotel after midnight and discover a note waiting on the bed.", anchors: ["Guests", "hotel", "midnight", "note", "bed"], creative: true },
  { name: "festival", prompt: "The festival gates opened at noon, the drummer started early, and strangers began dancing.", anchors: ["festival", "noon", "drummer", "strangers", "dancing"], creative: true },
  { name: "surprise party", prompt: "Nobody was supposed to know about the party, but the cake gave everything away.", anchors: ["party", "cake"], creative: true },
  { name: "museum", prompt: "The painting was moved three inches to the left and suddenly the room felt different.", anchors: ["painting", "three inches", "room"] },
  { name: "car", prompt: "The old car refused to start until Nina turned the radio on.", anchors: ["old car", "Nina", "radio"], creative: true },
  { name: "guitar", prompt: "The guitar had a crack by the bridge, a faded sticker, and one string that always went flat.", anchors: ["guitar", "crack", "bridge", "sticker", "string"] },
  { name: "timeline", prompt: "At 9:04 AM Maria entered. At 11:47 AM she finished. The house was quiet again.", anchors: ["9:04 AM", "11:47 AM", "Maria", "house"] },
  { name: "weird", prompt: "The vending machine returned the wrong snack three times and nobody complained.", anchors: ["vending machine", "wrong snack", "three times"], creative: true },
  { name: "surreal", prompt: "The hotel room had no window, but everyone could hear the ocean.", anchors: ["hotel room", "no window", "ocean"], creative: true },
  { name: "commerce", prompt: "A salon wants the QR experience to turn a routine haircut into something customers remember.", anchors: ["salon", "QR", "haircut", "customers"], creative: true },
  { name: "quiet", prompt: "Nothing happened except the first snow of the year.", anchors: ["first snow", "year"], creative: true },
] as const;

const LEAK = /\b(?:cognitive|compiler|premise|directive|hypothesis|semantic|realizer|experience plan|story structure|progression model|interaction model|discovery model|trajectory|latent movie|internal state|generated output)\b/i;
const ROBOTIC = /\b(?:the experience became|this was memorable|the moment became|everything changed|turned into a journey|a meaningful experience)\b/i;
const GENERIC = /\b(?:welcome to|discover the magic|make memories|unforgettable experience|one of a kind|journey of|worth remembering)\b/i;
const TEMPLATE = /\b(?:common sense quietly left|the plan was still technically intact|nothing announced danger|it looked ordinary while it was happening|the sensible version|the day changed lanes|nobody had scheduled the ridiculous part)\b/i;

const outputs: string[] = [];
let creativeCount = 0;
let provenanceCount = 0;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const text = result.moments.map((m) => m.text ?? m.description ?? m.title ?? "").join(" ").trim();
  outputs.push(text);
  assert.ok(text.length > 0, `${testCase.name}: empty realization`);
  assert.ok(result.moments.length >= 1, `${testCase.name}: no moments`);
  assert.equal(result.moments.length, result.cinematicScenes.length, `${testCase.name}: scene drift`);
  assert.ok(!LEAK.test(text), `${testCase.name}: cognitive leakage`);
  assert.ok(!ROBOTIC.test(text), `${testCase.name}: robotic realization`);
  assert.ok(!GENERIC.test(text), `${testCase.name}: generic phrase leakage`);
  assert.ok(!TEMPLATE.test(text), `${testCase.name}: shared-template leakage`);

  const lowerText = text.toLowerCase();
  const covered = testCase.anchors.filter((anchor) => lowerText.includes(anchor.toLowerCase())).length;
  assert.ok(covered / testCase.anchors.length >= 0.75, `${testCase.name}: anchor coverage ${covered}/${testCase.anchors.length}`);

  const sentenceLeads = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase())
    .filter(Boolean);
  if (sentenceLeads.length >= 2) {
    const leadSet = new Set(sentenceLeads);
    assert.ok(leadSet.size / sentenceLeads.length >= 0.66, `${testCase.name}: sentence openings collapse to a repeated lead`);
  }

  if (testCase.creative) {
    assert.notEqual(text.toLowerCase(), testCase.prompt.toLowerCase(), `${testCase.name}: creative prompt was only echoed`);
    const hasProvenance = result.moments.some((moment) => Array.isArray(moment.payload.creativeDetails) && moment.payload.creativeDetails.length > 0);
    assert.ok(hasProvenance, `${testCase.name}: creative provenance missing`);
    creativeCount += 1;
    if (hasProvenance) provenanceCount += 1;
  }
}

const uniqueOutputs = new Set(outputs.map((value) => value.toLowerCase()));
assert.ok(uniqueOutputs.size >= Math.floor(cases.length * 0.88), `creative output collapse: ${uniqueOutputs.size}/${cases.length} unique`);
assert.ok(creativeCount >= 20, "stress corpus lost creative cases");
assert.equal(provenanceCount, creativeCount, "every creative case must expose provenance");

const feedbackFirst = compileCognitiveExperience("Coco stole the bow.", { feedback: { accepted: ["comedy works"], rejected: ["flat phrasing"] } });
const feedbackSecond = compileCognitiveExperience("Coco stole another bow.", { state: feedbackFirst.state });
assert.equal(feedbackSecond.state.compileCount, 2, "learning state must persist across compiles");
assert.ok(feedbackSecond.world.lens === "comedy", "learned successful lens should influence future neutral generation");
assert.ok(feedbackSecond.state.creativeLearning.noveltyPressure >= feedbackFirst.state.creativeLearning.noveltyPressure, "novelty pressure should not decay after a rejection signal");

const historyFirst = compileCognitiveExperience("Nina visited the lake at sunrise and found a red canoe.");
const historySecond = compileCognitiveExperience("Nina returned to the lake and saw the canoe again.", { state: historyFirst.state, memorySummary: ["Nina visited the lake at sunrise and found a red canoe."] });
assert.ok(historySecond.world.memoryMatches.length > 0, "history should resolve into the second experience");
assert.ok((historySecond.state.entityStates.find((entity) => /nina/i.test(entity.entity))?.appearances ?? 0) >= 2, "recurring entity must accumulate state");
assert.ok(historySecond.state.entityStates.some((entity) => /nina/i.test(entity.entity) && entity.places.some((place) => /lake/i.test(place))), "entity state should retain recurring place");

console.log(`CREATIVE SUPERSTAR ACCEPTANCE: PASS (${cases.length} unseen-style prompts)`);
