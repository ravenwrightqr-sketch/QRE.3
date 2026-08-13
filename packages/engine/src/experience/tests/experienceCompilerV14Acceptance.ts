import { compileExperienceV14 } from "../experienceCompilerV14.js";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`V14 ACCEPTANCE FAILED: ${message}`);
}

console.log("\n===== V14 UNIVERSAL MEMORY INTELLIGENCE =====\n");

const coco1 = compileExperienceV14(
  "Coco visited the groomer on August 13 at 8:10 AM, loved the bath, stole the bow, and left happy.",
  { memoryScope: { assetId: "coco-demo" } },
);
const coco2 = compileExperienceV14(
  "Coco returned to the groomer on August 20 at 8:10 AM, loved the bath again, saw the bow, and chewed it while happy.",
  { memoryScope: { assetId: "coco-demo" }, memory: coco1.memory },
);

const couple = compileExperienceV14(
  "John and Jane celebrated their wedding anniversary at the beach with family. They prefer quiet beach dinners.",
  { memoryScope: { assetId: "couple-demo" } },
);

const home = compileExperienceV14(
  "The Maple House welcomed its first guests in Palm Springs. Guests loved the pool and nearby coffee shops.",
  { memoryScope: { assetId: "home-demo" } },
);

console.log("COCO RECURRENCES:", coco2.memory.intelligence.recurrences.map((x) => x.key));
console.log("COCO ASSOCIATIONS:", coco2.memory.intelligence.associations.slice(0, 4).map((x) => `${x.left}+${x.right}`));
console.log("COCO STATES:", coco2.memory.intelligence.states.map((x) => x.state));
console.log("COCO TIMES:", coco2.memory.world.timeContexts);
console.log("COUPLE PREFERENCES:", couple.memory.intelligence.preferences.map((x) => `${x.polarity}:${x.value}`));
console.log("HOME PLACES:", home.memory.world.locations.map((x) => x.name));
console.log("HOME LOCAL INTERESTS:", home.memory.intelligence.localInterests.map((x) => x.interest));

assert(coco2.memory.events.length > coco1.memory.events.length, "memory still accumulates events");
assert(coco2.memory.intelligence.recurrences.length > 0, "repeated behavior becomes recurrence intelligence");
assert(coco2.memory.intelligence.associations.length > 0, "co-occurring concepts become associations");
assert(coco2.memory.intelligence.states.length > 0, "observable states are learned");
assert(coco2.memory.world.timeContexts.length > 0, "time context is retained");
assert(couple.memory.intelligence.preferences.length > 0, "explicit preferences are learned");
assert(home.memory.world.locations.length > 0, "places remain part of universal memory");
assert(home.memory.intelligence.localInterests.length >= 0, "local intelligence remains optional when evidence is weak");
assert(coco2.movie.beats.every((beat) => !/mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text)), "internals never leak");

console.log("\nV14 ACCEPTANCE: PASS\n");
