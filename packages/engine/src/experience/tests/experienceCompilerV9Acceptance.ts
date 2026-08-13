import { compileExperienceV9 } from "../experienceCompilerV9.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const coco = compileExperienceV9("Dog grooming for Coco. Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy. Make it funny and memorable for the client.");
const maria = compileExperienceV9("Housekeeping service for Maria. Maria arrived at 9:04 AM. She cleaned the kitchen and two bathrooms. The place was spotless when she left.");
const patty = compileExperienceV9("Dog grooming for Patty. Patty is a golden retriever. She arrived sleepy. She loved the warm towel. She watched the room and left relaxed.");

console.log("\n===== V9 CREATIVE THINKER =====\n");
console.log("COCO OPPORTUNITIES:", coco.creativity.opportunities.map((item) => `${item.kind}:${item.score.toFixed(2)}`));
console.log("COCO INVENTIONS:", coco.inventions.map((item) => item.text));
console.log("COCO STORY:", coco.movie.beats.map((beat) => beat.text));
console.log("MARIA STORY:", maria.movie.beats.map((beat) => beat.text));
console.log("PATTY STORY:", patty.movie.beats.map((beat) => beat.text));

assert(coco.version === "v9", "V9 compiler must identify itself as v9");
assert(coco.inventions.length > 0, "Coco must receive at least one phrase invention");
assert(coco.creativity.opportunities.length >= 2, "Coco must expose multiple creative opportunities");
assert(coco.creativity.opportunities.some((item) => item.kind === "agency"), "Coco must recognize subject agency");
assert(coco.creativity.opportunities.some((item) => item.kind === "transformation"), "Coco must recognize transformation");
assert(coco.movie.beats.some((beat) => /apparently|executive decision|plan|side quest|normal/i.test(beat.text)), "Coco should receive creative reframing");
assert(!coco.movie.beats.some((beat) => /mechanic|payoff|compiler|memory thread|experience design|make it funny|for the client/i.test(beat.text)), "Cognitive internals and directives must never leak");
assert(maria.movie.beats.some((beat) => /mess|kitchen|rooms|ordinary/i.test(beat.text)), "Housekeeping should receive domain-aware realization");
assert(!patty.movie.beats.some((beat) => /Coco|bow|Pomeranian/i.test(beat.text)), "Patty must not inherit Coco details");

console.log("\nV9 ACCEPTANCE: PASS\n");
