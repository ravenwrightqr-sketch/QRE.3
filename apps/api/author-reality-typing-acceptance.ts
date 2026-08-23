import { classifyPersonality, typeRealityFacts } from "./src/services/authorRealityTyping.js";

const subject = "Coco";
const facts = [
  "poodle",
  "fierce",
  "loves bacon",
  "long walks at night",
  "friendly",
  "loves other dogs",
];

const typed = typeRealityFacts(facts, subject);
const personality = classifyPersonality(facts);

console.log("=".repeat(72));
console.log("QRE REALITY TYPING ACCEPTANCE · COG INPUT ORGANIZATION");
console.log("=".repeat(72));
for (const fact of typed) console.log(`${fact.type.padEnd(14)} ${fact.text}`);
console.log("\n--- PERSONALITY MAP ---");
console.log(`traits=${JSON.stringify(personality.traits)}`);
console.log(`preferences=${JSON.stringify(personality.preferences)}`);
console.log(`socialSignals=${JSON.stringify(personality.socialSignals)}`);

const traitSet = new Set(personality.traits.map((value) => value.toLowerCase()));
const preferenceSet = new Set(personality.preferences.map((value) => value.toLowerCase()));
const traitOk = traitSet.has("fierce") && traitSet.has("friendly");
const preferenceOk = preferenceSet.has("loves bacon") && preferenceSet.has("loves other dogs");
const identityOk = !typed.some((fact) => fact.text === "poodle" && fact.type !== "identity");

if (!traitOk || !preferenceOk || !identityOk) {
  throw new Error("REALITY TYPING INVARIANT FAILED");
}

console.log("\nREALITY TYPING ACCEPTANCE: PASS");
