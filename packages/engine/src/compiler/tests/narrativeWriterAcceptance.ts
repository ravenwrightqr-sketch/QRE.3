import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../cognition/universalMind.js";

const cases = [
  {
    name: "pet comedy",
    prompt: "Coco came in nervous, got a bath, stole a blue bow, and left looking fabulous. Make it funny.",
    anchors: ["Coco", "bath", "blue bow", "looking fabulous"],
    lens: "comedy",
  },
  {
    name: "wedding romance",
    prompt: "The wedding is tonight. Everyone knows the couple, but nobody knows what happens after the vows. Make it romantic and cinematic.",
    anchors: ["wedding", "tonight", "couple", "vows"],
    lens: "romance",
  },
  {
    name: "return memory",
    prompt: "We went there again. Huntington. We watched the sunset from the pier and stayed until the lights came on.",
    anchors: ["Huntington", "sunset", "pier", "lights"],
    lens: "neutral",
  },
  {
    name: "horror",
    prompt: "The hotel room looked ordinary until the old photograph above the desk was noticed. Then the lights flickered.",
    anchors: ["hotel room", "old photograph", "desk", "lights flickered"],
    lens: "horror",
  },
  {
    name: "real estate",
    prompt: "The realtor opened the front door, and sunlight crossed the empty living room. The family imagined where the couch would go.",
    anchors: ["realtor", "front door", "empty living room", "couch"],
    lens: "neutral",
  },
  {
    name: "service",
    prompt: "Maria arrived at 9:04 AM, cleaned the kitchen and two bathrooms, and finished at 11:47 AM. The homeowner came home to a spotless house.",
    anchors: ["Maria", "9:04 AM", "kitchen", "two bathrooms", "11:47 AM", "spotless house"],
    lens: "neutral",
  },
  {
    name: "object memory",
    prompt: "The blue suitcase survived three airports, one missed train, and a rainy walk home. Ten years later it was still by the door.",
    anchors: ["blue suitcase", "three airports", "missed train", "rainy walk home", "Ten years later"],
    lens: "romance",
  },
  {
    name: "event",
    prompt: "The concert ended at midnight, but the crowd stayed in the parking lot singing while the road emptied around them.",
    anchors: ["concert", "midnight", "crowd", "parking lot", "road emptied"],
    lens: "wild",
  },
  {
    name: "mystery",
    prompt: "The camera recorded the first dance, the toast, and the person laughing in the back row. Nobody remembered inviting them.",
    anchors: ["camera", "first dance", "toast", "back row", "inviting them"],
    lens: "horror",
  },
  {
    name: "ticket prompt",
    prompt: "Turn this concert QR into something people will remember.",
    anchors: ["concert", "QR", "remember"],
    lens: "neutral",
  },
] as const;

const badFragment = /(?:^|\s)(?:in nervous|re again|we there again|we the|it there through|out the final plate|t midnight)(?:\s|[.!?]|$)/i;
const internalLanguage = /\b(?:second meaning|obvious detail|foreground\/background|source preserved|creative_details|compiler|cognitive plan|narrative writer)\b/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const text = result.moments.map((moment) => moment.text ?? "").join(" ").trim();
  assert.ok(text.length > 0, `${testCase.name}: empty narrative`);
  for (const anchor of testCase.anchors) assert.ok(text.toLowerCase().includes(anchor.toLowerCase()), `${testCase.name}: missing '${anchor}'`);
  assert.equal(badFragment.test(text), false, `${testCase.name}: parser fragment escaped into prose: ${text}`);
  assert.equal(internalLanguage.test(text), false, `${testCase.name}: internal writer vocabulary escaped into prose: ${text}`);
  assert.equal(result.world.lens, testCase.lens, `${testCase.name}: expected ${testCase.lens} lens`);
  assert.ok(result.moments.every((moment) => (moment.text ?? "").trim().split(/\s+/).length >= 6), `${testCase.name}: fragment-level moment returned`);
}

const base = compileCognitiveExperience("Coco stole the blue bow.");
const comedy = compileCognitiveExperience("Coco stole the blue bow. Make it funny.");
const horror = compileCognitiveExperience("Coco stole the blue bow. Make it horror.");
const romance = compileCognitiveExperience("Coco stole the blue bow. Make it romantic.");
assert.notEqual(comedy.moments.map((m) => m.text).join(" "), base.moments.map((m) => m.text).join(" "), "comedy should change the narrative");
assert.notEqual(horror.moments.map((m) => m.text).join(" "), base.moments.map((m) => m.text).join(" "), "horror should change the narrative");
assert.notEqual(romance.moments.map((m) => m.text).join(" "), base.moments.map((m) => m.text).join(" "), "romance should change the narrative");

console.log(`NARRATIVE WRITER ACCEPTANCE: PASS (${cases.length} whole-scene prompts)`);
