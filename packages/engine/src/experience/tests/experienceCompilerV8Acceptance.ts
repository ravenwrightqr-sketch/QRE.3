import { compileExperienceV8 } from "../experienceCompilerV8.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const coco = compileExperienceV8(
  "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy. Make it funny and memorable for the client.",
  { businessName: "Bettie Groomer", businessDomain: "dog grooming", ownerKey: "bettie-groomer", entityKey: "coco" },
);

const patty = compileExperienceV8(
  "Patty is a golden retriever. She arrived sleepy. She loved the warm towel. She watched the room and left relaxed. Make this feel like her own little adventure.",
  { businessName: "Bettie Groomer", businessDomain: "dog grooming", ownerKey: "bettie-groomer", entityKey: "patty" },
);

const housekeeping = compileExperienceV8(
  "Maria arrived at 9:04 AM. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The place was spotless when she left. Turn the service into something the client remembers.",
  { businessName: "Bright Home", businessDomain: "housekeeping", ownerKey: "bright-home", entityKey: "service-maria" },
);

console.log("\n===== V8 EXPERIENCE DESIGN =====\n");
console.log("COCO DESIGN:", coco.design);
console.log("COCO STORY:", coco.movie.beats.map((beat) => beat.text));
console.log("PATTY STORY:", patty.movie.beats.map((beat) => beat.text));
console.log("HOUSEKEEPING STORY:", housekeeping.movie.beats.map((beat) => beat.text));

assert(coco.version === "v8", "Coco must compile through V8");
assert(coco.design.trajectory === "transformation", "Coco should recognize a transformation trajectory");
assert(coco.design.voice.includes("mischievous"), "Coco should receive a mischievous voice opportunity");
assert(coco.movie.beats.some((beat) => /agenda|negotiating|side quest|incident|nervous|changed/i.test(beat.text)), "Coco should receive creative reframing");
assert(patty.movie.beats.every((beat) => !/Coco|bow/i.test(beat.text)), "Patty must not inherit Coco details");
assert(housekeeping.movie.beats.some((beat) => /mess|kitchen|rooms|clean/i.test(beat.text)), "Housekeeping should retain domain-grounded language");
assert([...coco.movie.beats, ...patty.movie.beats, ...housekeeping.movie.beats].every((beat) => !/mechanic|compiler|memory thread|trajectory|blueprint|cognitive plan|story moved forward/i.test(beat.text)), "Internal design language must never leak into prose");
assert(coco.moments.every((moment) => moment.description === coco.movie.beats[moment.order]?.text), "Moments must use the realized movie");

console.log("\nV8 ACCEPTANCE: PASS\n");
