import assert from "node:assert/strict";
import { compileCognitiveExperience } from "../../cognition/universalMind.js";

const prompts = [
  "Coco came in nervous, got a bath, stole a blue bow, and left looking fabulous.",
  "Maria arrived at 9:04 AM, cleaned the kitchen and two bathrooms, and finished at 11:47 AM.",
  "Alex and Sam met at the Little Italian restaurant, talked for three hours, and went back two weeks later.",
  "The wedding is tonight. Everyone knows the couple, but nobody knows what happens after the vows.",
  "We went back to Huntington Beach yesterday and watched the sunset from the pier.",
  "Dad played the old guitar in the garage while everyone else packed the car.",
  "The blue suitcase survived three airports, one missed train, and a rainy walk home.",
  "A customer arrived for a haircut, chose the same style as last time, and left laughing.",
  "The chef brought out the final plate just as the birthday candles were being lit.",
  "The hotel room looked ordinary until the old photograph above the desk was noticed.",
  "The realtor opened the front door, and sunlight crossed the empty living room.",
  "The open house started at noon and the first family arrived early with three generations.",
  "The concert ended at midnight, but the crowd stayed in the parking lot singing.",
  "The rain started during the proposal, and nobody moved under the awning.",
  "The dog hated the dryer, loved the foot rub, and left carrying a bow like a trophy.",
  "The keychain was bought in Portland and later appeared on a beach two hundred miles away.",
  "The camera recorded the first dance, the toast, and the person laughing in the back row.",
  "The ticket was printed at breakfast and scanned that evening at the theater.",
  "The housekeeper found a child's drawing behind the nightstand while preparing the room.",
  "The salon was quiet until the client showed the old photo of the haircut she wanted back.",
  "A couple moved into the house in June and planted the first tree in October.",
  "The family returned to the same cabin every summer for six years.",
  "The first date happened at a coffee shop; the tenth anniversary happened at the same table.",
  "The groom forgot the rings for twelve seconds and found them in his jacket pocket.",
  "The bride kept one dried flower from the bouquet.",
  "The cat climbed onto the suitcase exactly when the car was supposed to leave.",
  "A musician lost a guitar pick on stage and found it in the audience after the show.",
  "The bartender remembered the customer's favorite drink without being asked.",
  "The server spilled the water, laughed, and somehow made the table relax.",
  "The mechanic finished the repair and left a tiny note under the windshield wiper.",
  "The painter found a blue mark on the wall after moving the last piece of furniture.",
  "The photographer returned to the same park a year later with the same camera.",
  "The teacher kept the class photo for twenty years.",
  "The old chair was moved to the porch when the baby arrived.",
  "The restaurant closed at ten, but the owner stayed another hour talking with the last table.",
  "The real estate sign went up Monday and disappeared Friday.",
  "The beach was empty at sunrise and crowded by noon.",
  "The arcade token was found inside the moving box ten years later.",
  "The birthday cake arrived one minute before everyone started singing.",
  "The event started late, became loud, and ended with strangers hugging.",
  "The groomer wrote the dog's name on the bow before sending the photo.",
  "The client said the service was routine, then asked for the story to be saved.",
  "The family dog recognized the same grooming room on the next visit.",
  "A real estate buyer returned to a house because they remembered the afternoon light.",
  "The agent showed the neighborhood coffee shop before showing the backyard.",
  "The closing day ended with the keys on the kitchen counter.",
  "The moving truck arrived before sunrise and left after dark.",
  "The restaurant's first customer of the day came back as its final customer that night.",
  "The artist signed the back of the photograph instead of the front.",
  "The video began with an empty room and ended with everyone dancing in it.",
];

const forbidden = /\b(common sense quietly left|the day changed lanes|the sensible version|nobody had scheduled the ridiculous part|starting to mean second meaning|looked like the obvious detail|nothing in the moment asked for a speech|now it reads like setup|earlier, .* seemed like the beginning)\b/i;
const fragment = /(?:^|\s)(?:in|at|on|to|from|with|by)\s+[a-z]+\.?$/i;
const directiveLeak = /\b(?:make it|make this|make the story|write it|write this)\b/i;
const parserGarbage = /\b(?:re again|we there again|we the|ten years?\b.*participant|in nervous|and left looking fabulous|one minute\.|ordinary\.)\b/i;

let transformed = 0;
let creative = 0;
let clean = 0;
const openingLeads = new Set<string>();
const printed: string[] = [];

for (const prompt of prompts) {
  const result = compileCognitiveExperience(prompt);
  const text = result.moments.map((moment) => moment.text ?? "").join(" ").trim();
  assert.ok(text.length > 0, `empty prose for: ${prompt}`);
  if (text.toLowerCase() !== prompt.toLowerCase()) transformed += 1;
  if (result.moments.some((moment) => Array.isArray(moment.payload?.creativeDetails) && moment.payload.creativeDetails.length > 0)) creative += 1;
  assert.equal(forbidden.test(text), false, `generic/template prose escaped: ${text}`);
  assert.equal(fragment.test(text), false, `fragment prose escaped: ${text}`);
  assert.equal(directiveLeak.test(text), false, `authoring directive leaked into prose: ${text}`);
  assert.equal(parserGarbage.test(text), false, `parser garbage escaped into prose: ${text}`);
  const firstWords = text.toLowerCase().split(/\s+/).slice(0, 3).join(" ");
  openingLeads.add(firstWords);
  clean += 1;
  if (printed.length < 12) printed.push(text);
}

assert.ok(transformed >= prompts.length * 0.8, `writer transformed only ${transformed}/${prompts.length}`);
assert.ok(creative >= prompts.length * 0.85, `creative realization appeared only ${creative}/${prompts.length}`);
assert.ok(clean === prompts.length, `clean prose only ${clean}/${prompts.length}`);
assert.ok(openingLeads.size >= Math.ceil(prompts.length * 0.55), `writer opening diversity too low: ${openingLeads.size}/${prompts.length}`);

const comedy = compileCognitiveExperience("Coco stole the blue bow. Make it funny.");
const horror = compileCognitiveExperience("The hotel room looked ordinary until the old photograph above the desk was noticed. Then the lights flickered.");
const romance = compileCognitiveExperience("The old chair was moved to the porch when the baby arrived. It stayed there through three summers.");
const mystery = compileCognitiveExperience("The camera recorded the first dance, the toast, and the person laughing in the back row. Nobody remembered inviting them.");
const base = compileCognitiveExperience("Coco stole the blue bow.");
assert.notEqual(comedy.world.lens, "neutral", "comedy directive was not understood");
assert.notEqual(horror.world.lens, "neutral", "horror trajectory was not inferred");
assert.notEqual(romance.world.lens, "neutral", "romance trajectory was not inferred");
assert.notEqual(mystery.world.lens, "neutral", "mystery trajectory was not inferred");
assert.notEqual(comedy.moments.map((m) => m.text).join(" "), base.moments.map((m) => m.text).join(" "), "comedy collapsed to base voice");
assert.notEqual(horror.moments.map((m) => m.text).join(" "), base.moments.map((m) => m.text).join(" "), "horror collapsed to base voice");
assert.notEqual(romance.moments.map((m) => m.text).join(" "), base.moments.map((m) => m.text).join(" "), "romance collapsed to base voice");

console.log(`WRITER CEILING ACCEPTANCE: PASS (${prompts.length} adversarial prompts)`);
console.log("Sample returned prose:");
for (const line of printed) console.log(`- ${line}`);
