import assert from "node:assert/strict";
import { buildCreativeSeedPlan } from "./src/services/creativeSeedEngine.js";

process.env.QRE_AI_ENABLED = "false";

const wedding = await buildCreativeSeedPlan("make a wedding memory");
const service = await buildCreativeSeedPlan("make video receipts for my cleaning service");
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

console.log("UNIVERSAL CREATION INTAKE ACCEPTANCE: PASS");
console.log(`weddingSeeds=${wedding.seeds.length}`);
console.log(`serviceSeeds=${service.seeds.length}`);
console.log(`homeSeeds=${home.seeds.length}`);
