import { compileExperienceV10 } from "../experienceCompilerV10.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const coco = compileExperienceV10("Dog grooming for Coco. Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy. Make it funny and memorable for the client.");
const maria = compileExperienceV10("Housekeeping service for Maria. Maria arrived at 9:04 AM. She cleaned the kitchen and two bathrooms. The place was spotless when she left.");
const patty = compileExperienceV10("Dog grooming for Patty. Patty is a golden retriever. She arrived sleepy. She loved the warm towel. She watched the room and left relaxed.");

console.log("\n===== V10 CREATIVE THINKER =====\n");
console.log("COCO STORY:", coco.movie.beats.map((beat) => beat.text));
console.log("COCO INVENTIONS:", coco.inventions.map((item) => ({ text: item.text, anchors: item.anchors, novelty: item.noveltyScore })));
console.log("COCO LEARNING:", coco.learning);
console.log("MARIA STORY:", maria.movie.beats.map((beat) => beat.text));
console.log("MARIA LEARNING:", maria.learning);
console.log("PATTY STORY:", patty.movie.beats.map((beat) => beat.text));

assert(coco.version === "v10", "V10 compiler must identify itself as v10");
assert(coco.inventions.length > 0, "Coco must receive a phrase invention");
assert(coco.inventions.some((item) => /bow|bath|appointment|mission/i.test(item.text)), "Coco should receive evidence-specific creative language");
assert(coco.inventions.some((item) => item.noveltyScore >= 0.9), "Coco should receive at least one high-novelty invention");
assert(coco.learning.domain === "grooming", "Coco learning must identify grooming domain");
assert(coco.learning.recurringAnchors.some((item) => item === "bow"), "Coco learning must retain the bow anchor");
assert(maria.learning.domain === "housekeeping", "Maria learning must identify housekeeping domain");
assert(maria.movie.beats.some((beat) => /kitchen|bathrooms|battle|mess|mop|house/i.test(beat.text)), "Housekeeping should receive domain-aware creative language");
assert(patty.learning.domain === "grooming", "Patty learning must identify grooming domain");
assert(!patty.movie.beats.some((beat) => /Coco|bow|Pomeranian/i.test(beat.text)), "Patty must not inherit Coco-specific language");
assert(!coco.movie.beats.some((beat) => /mechanic|payoff|compiler|memory thread|experience design|make it funny|for the client/i.test(beat.text)), "Cognitive internals and directives must never leak");

console.log("\nV10 ACCEPTANCE: PASS\n");
