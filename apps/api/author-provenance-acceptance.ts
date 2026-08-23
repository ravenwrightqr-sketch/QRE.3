import { buildRealityProvenance, provenanceAllows, provenanceForbids } from "./src/services/authorRealityProvenance.js";

const pet = buildRealityProvenance("long walks at night", "memory", { subject: "Coco" });
const memory = buildRealityProvenance("talked until close", "memory", { subject: "relationship" });
const place = buildRealityProvenance("local bar", "location", { subject: "relationship" });
const trait = buildRealityProvenance("fierce", "memory", { subject: "Coco" });

if (pet.factType !== "activity") throw new Error(`PROVENANCE FAILED: expected activity, got ${pet.factType}`);
if (!provenanceAllows(pet, "callback")) throw new Error("PROVENANCE FAILED: activity should allow callback");
if (memory.factType !== "event") throw new Error(`PROVENANCE FAILED: expected event, got ${memory.factType}`);
if (!provenanceAllows(memory, "derive_significance")) throw new Error("PROVENANCE FAILED: event should allow significance derivation");
if (place.factType !== "place") throw new Error(`PROVENANCE FAILED: expected place, got ${place.factType}`);
if (!provenanceAllows(place, "derive_recurrence")) throw new Error("PROVENANCE FAILED: place should allow recurrence");
if (trait.factType !== "trait") throw new Error(`PROVENANCE FAILED: expected trait, got ${trait.factType}`);
if (!provenanceAllows(trait, "derive_significance")) throw new Error("PROVENANCE FAILED: trait should allow significance");
for (const item of [pet, memory, place, trait]) {
  if (!provenanceForbids(item, "invent_person")) throw new Error("PROVENANCE FAILED: person invention must remain forbidden");
  if (!provenanceForbids(item, "invent_relationship")) throw new Error("PROVENANCE FAILED: relationship invention must remain forbidden");
  if (!provenanceForbids(item, "invent_place")) throw new Error("PROVENANCE FAILED: place invention must remain forbidden");
  if (!provenanceForbids(item, "invent_literal_event")) throw new Error("PROVENANCE FAILED: literal event invention must remain forbidden");
}

console.log("AUTHOR PROVENANCE ACCEPTANCE: PASS");
console.log(`activity permissions=${pet.permissions.join(",")}`);
console.log(`event permissions=${memory.permissions.join(",")}`);
console.log(`place permissions=${place.permissions.join(",")}`);
console.log(`trait permissions=${trait.permissions.join(",")}`);
