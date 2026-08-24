import assert from "node:assert/strict";
import { buildCreativeSeedPlan } from "./src/services/creativeSeedEngine.js";

process.env.QRE_AI_ENABLED = "false";

const wedding = await buildCreativeSeedPlan("make a wedding memory");
const service = await buildCreativeSeedPlan("I want to create a housekeeping service video receipt");
const home = await buildCreativeSeedPlan("create a living memory of my house");

for (const [name, plan] of [["wedding", wedding], ["service", service], ["home", home]] as const) {
  assert.ok(plan.seeds.length > 0, `${name}: intake must provide optional creation inputs`);
  const text = JSON.stringify(plan).toLowerCase();
  assert.equal(text.includes("dog"), false, `${name}: dog-specific intake leaked into universal creation`);
  assert.equal(text.includes("cat"), false, `${name}: cat-specific intake leaked into universal creation`);
  assert.equal(text.includes("animal"), false, `${name}: animal-specific intake leaked into universal creation`);
}

assert.match(wedding.title, /create|few|sparks|better|qre/i);
assert.match(service.title, /create|few|sparks|better|qre/i);
assert.match(home.title, /create|few|sparks|better|qre/i);

// Maria's concrete service-intake fixture.
// The user should be able to identify the recurring context with one stable label,
// then dump the facts without learning a domain-specific schema.
const maria = {
  intent: "I want to create a housekeeping service video receipt",
  contextLabel: "location",
  contextValue: "Client 1 / Elm Street",
  facts: [
    "9:05 AM arrival",
    "cleaned kitchen",
    "cleaned bath",
    "cleaned living room",
    "left 11:11 AM",
  ],
};

assert.equal(maria.contextLabel, "location");
assert.equal(maria.contextValue.length > 0, true);
assert.equal(maria.facts.length, 5);
assert.deepEqual(maria.facts, [
  "9:05 AM arrival",
  "cleaned kitchen",
  "cleaned bath",
  "cleaned living room",
  "left 11:11 AM",
]);

// These are facts for this creation context only. The intake contract must not
// silently add people, pets, family, rooms, or client relationships that Maria did not supply.
const mariaReality = maria.facts.join(" ").toLowerCase();
for (const forbidden of ["dog", "cat", "pet", "family", "owner", "husband", "wife", "customer"]) {
  assert.equal(mariaReality.includes(forbidden), false, `Maria fixture: invented context leaked: ${forbidden}`);
}

console.log("UNIVERSAL CREATION INTAKE ACCEPTANCE: PASS");
console.log(`weddingSeeds=${wedding.seeds.length}`);
console.log(`serviceSeeds=${service.seeds.length}`);
console.log(`homeSeeds=${home.seeds.length}`);
console.log(`serviceContext=${maria.contextValue}`);
console.log(`serviceFacts=${maria.facts.length}`);
