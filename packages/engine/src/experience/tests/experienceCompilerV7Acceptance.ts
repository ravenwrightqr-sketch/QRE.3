import { compileExperienceV7 } from "../experienceCompilerV7.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const coco = compileExperienceV7(
  "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy.",
  { businessName: "Bettie's Grooming", businessDomain: "dog grooming" },
);

const patty = compileExperienceV7(
  "Patty is a golden retriever. She arrived sleepy. She loved the warm towel. She watched the room and left relaxed.",
  { businessName: "Bettie's Grooming", businessDomain: "dog grooming" },
);

const housekeeping = compileExperienceV7(
  "Maria arrived at 9:04 AM. She cleaned the kitchen and two bathrooms. The place was spotless when she left.",
  { businessDomain: "housekeeping" },
);

const wedding = compileExperienceV7(
  "Make a wedding memory for Jan 1 2025. Everyone invited can add memories.",
);

const manifestation = compileExperienceV7(
  "I want a daily manifestation experience about becoming financially free and building my dream life.",
);

console.log("\n===== V7 HUMAN → EXPERIENCE =====\n");
for (const [name, result] of Object.entries({ coco, patty, housekeeping, wedding, manifestation })) {
  console.log(name.toUpperCase(), {
    domain: result.intent.domain,
    purpose: result.intent.purpose,
    subject: result.intent.subject,
    type: result.blueprint.type,
    tones: result.blueprint.tone,
    title: result.title,
    beats: result.movie.beats.map((beat) => beat.text),
  });
}

assert(coco.intent.domain === "dog_grooming", "Coco must infer dog grooming context");
assert(coco.intent.subject === "Coco", "Coco must remain the subject");
assert(coco.blueprint.type === "story" || coco.blueprint.type === "memory", "Coco must compile into an experience");
assert(coco.movie.beats.every((beat) => !/mechanic|payoff|compiler|memory thread|story moved forward/i.test(beat.text)), "Coco must not leak internal mechanics");
assert(coco.movie.beats.every((beat) => !/Maria|Patty/i.test(beat.text)), "Coco must not inherit another entity");
assert(patty.movie.beats.every((beat) => !/Coco|Maria|bow/i.test(beat.text)), "Patty must not inherit Coco details");
assert(housekeeping.intent.domain === "housekeeping", "Housekeeping context must be recognized");
assert(housekeeping.movie.beats.every((beat) => !/homeowner/i.test(beat.text)), "Housekeeping prose must remain occupant-neutral");
assert(wedding.intent.domain === "wedding", "Wedding must infer its domain");
assert(manifestation.intent.domain === "personal", "Personal manifestation must infer personal context");
assert(manifestation.intent.memoryEnabled, "Personal experiences should be memory-capable");
assert(coco.blueprint.cognitivePlan, "V7 blueprint must carry cognitive planning");
assert(coco.flowSteps.length === coco.movie.beats.length, "Every movie beat must become runtime flow");

console.log("\nV7 ACCEPTANCE: PASS\n");
