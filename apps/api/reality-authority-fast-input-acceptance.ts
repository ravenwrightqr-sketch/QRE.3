import { buildWorldModelFromFastInput } from "@qre/engine";
import { looksLikeIdentityAssertion } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

const facts = [
  "Coco",
  "dog",
  "poodle",
  "nervous at first",
  "5 PM walk",
  "Lincoln Park",
  "met two bulldogs",
  "loved the brown one",
  "rolled in mud",
  "45 minutes",
];

const identity = facts.filter((value) => looksLikeIdentityAssertion(value, "Coco"));

const graph = buildAuthorRealityGraph({
  prompt: "Create a living memory for Coco.",
  subject: "Coco",
  facts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

const identityEvents = graph.events.filter((event) => looksLikeIdentityAssertion(event.label, "Coco"));
if (identityEvents.length) {
  throw new Error(`AUTHOR REALITY AUTHORITY FAILED: identity became event(s): ${identityEvents.map((event) => event.label).join(" | ")}`);
}

for (const expected of ["nervous at first", "5 pm walk", "met two bulldogs", "rolled in mud"]) {
  if (!graph.events.some((event) => event.label.toLowerCase() === expected)) {
    throw new Error(`AUTHOR REALITY AUTHORITY FAILED: missing experience event: ${expected}`);
  }
}

const fastInput = "Coco / dog / poodle / nervous at first / 5 PM walk / Lincoln Park / met two bulldogs / loved the brown one / rolled in mud / 45 minutes";
const world = buildWorldModelFromFastInput(fastInput, { eventParticipants: ["Coco"] });

const worldIdentityEvents = world.events.filter((event) => looksLikeIdentityAssertion(event.raw, "Coco"));
if (worldIdentityEvents.length) {
  throw new Error(`UNIVERSAL WORLD AUTHORITY FAILED: identity became event(s): ${worldIdentityEvents.map((event) => event.raw).join(" | ")}`);
}

for (const expected of ["nervous at first", "5 pm walk", "met two bulldogs", "rolled in mud"]) {
  if (!world.events.some((event) => event.raw.toLowerCase() === expected)) {
    throw new Error(`UNIVERSAL WORLD AUTHORITY FAILED: missing experience event: ${expected}`);
  }
}

if (!world.identityFacts.length) {
  throw new Error("UNIVERSAL WORLD AUTHORITY FAILED: identity facts were not preserved as world state");
}

console.log("REALITY AUTHORITY GREEN");
console.log(`identityFacts=${identity.length}`);
console.log(`authorEvents=${graph.events.length}`);
console.log(`worldIdentityFacts=${world.identityFacts.length}`);
console.log(`worldEvents=${world.events.length}`);
console.log("RULE: identity establishes the world; events create the experience");
