import { compileExperienceV13 } from "../experienceCompilerV13.js";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`V13 ACCEPTANCE FAILED: ${message}`);
}

console.log("\n===== V13 UNIVERSAL WORLD MEMORY =====\n");

const first = compileExperienceV13(
  "Coco arrived for grooming, had a bath, stole a bow, and left happy at 10:30 AM.",
  { memoryScope: { assetId: "coco-v13" } },
);
const second = compileExperienceV13(
  "Coco came back for another grooming appointment, saw the bows again, and chewed one at 10:30 AM.",
  { memoryScope: { assetId: "coco-v13" }, memory: first.memory },
);
const couple = compileExperienceV13(
  "John and Jane celebrated their wedding anniversary at the beach with family.",
  { memoryScope: { assetId: "couple-v13" } },
);
const home = compileExperienceV13(
  "The Beach House welcomed guests for a weekend near the ocean with Wi-Fi, coffee, and hiking nearby.",
  { memoryScope: { assetId: "home-v13" } },
);

console.log("COCO PATTERNS:", second.memory.world.patterns.map((x) => x.pattern));
console.log("COCO PLACES:", second.memory.world.locations.map((x) => x.name));
console.log("COCO TIME:", second.memory.world.timeContexts);
console.log("COCO MILESTONES:", second.memory.world.milestones.map((x) => x.title));
console.log("COUPLE KIND:", couple.memory.world.subjectKind);
console.log("COUPLE RELATIONS:", couple.memory.relations.map((x) => x.relation));
console.log("HOME KIND:", home.memory.world.subjectKind);
console.log("HOME SIGNALS:", home.memoryWorldSignals);

assert(second.memory.events.length > first.memory.events.length, "world memory retains prior events");
assert(second.memory.world.patterns.length > 0, "recurring patterns emerge across experiences");
assert(second.memory.world.timeContexts.length > 0, "time context is retained");
assert(couple.memory.relations.some((x) => x.relation === "married_to"), "relationships survive universalization");
assert(home.memory.world.subjectKind === "place" || home.memory.world.subjectKind === "property", "homes become universal world entities");
assert(second.movie.beats.every((beat) => !/mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text)), "internals never leak");

console.log("\nV13 ACCEPTANCE: PASS\n");
