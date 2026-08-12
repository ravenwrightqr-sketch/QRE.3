import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { realizeUniversalExperience } from "../../experience/universalExperienceRealizer.js";

const prompts = [
  "Coco scared coming in, enjoyed bath, picked up.",
  "Coco scared coming in. Enjoyed bath. Picked up. Walked out happy.",
  "Wedding memory art piece. Wedding Jan 1 2026 in Long Beach, Pier 4. All the people invited can add to it.",
  "Housekeeper finished a huge cleaning day. Kitchen and living room were a mess. Client came home to everything spotless.",
  "My grandmother gave me this watch. I want people in the family to keep adding memories to it.",
  "Dog groomer. Max hated the bath, loved the attention, stole a bow, and left acting like he owned the place.",
  "Build my invite for a cyberpunk underground goth rave tonight in LA.",
  "Make a memory of our road trip. We missed a turn, found a strange little town, ate pie, and arrived at sunset.",
];

const META = /\b(?:compiler|cognition|cognitive|premise|directive|semantic|realization|realizer|trajectory|mechanic|story structure|experience plan)\b/i;
const ROBOT = /\b(?:another visible detail|the payoff remains tied|the difference is visible|already in view|creating the first active turn|reaches a result shaped by|carries .* into what comes next)\b/i;

for (const prompt of prompts) {
  const compiled = compileCognitiveExperience(prompt);
  const lines = realizeUniversalExperience(compiled.cognition.plan, compiled.story.beats);
  const text = lines.join(" ");

  console.log("\n============================================================");
  console.log("INPUT");
  console.log(prompt);
  console.log("------------------------------------------------------------");
  console.log("EXPERIENCE");
  for (const line of lines) console.log(`• ${line}`);

  assert.ok(lines.length >= 3, `too few lines for: ${prompt}`);
  assert.equal(META.test(text), false, `internal language leaked: ${prompt}`);
  assert.equal(ROBOT.test(text), false, `old robotic language leaked: ${prompt}`);
}

console.log("\n============================================================");
console.log("UNIVERSAL EXPERIENCE LAB READY");
console.log("This lab does NOT replace the existing realization authority yet.");
console.log("It tests a relationship-first universal playout beside it.");
console.log("============================================================");
