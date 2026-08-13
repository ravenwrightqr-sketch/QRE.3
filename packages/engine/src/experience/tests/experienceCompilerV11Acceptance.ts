import {
  compileExperienceV11,
  type CompiledExperienceV11,
} from "../experienceCompilerV11.js";
import {
  createCreativeLearningProfileV11,
  suggestCreativeStrategyV11,
} from "../creativeLearningV11.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const cocoPrompts = [
  "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy.",
  "Coco came back today. She loved the bath again. She stole another bow and walked out happy.",
  "Coco returned for another grooming appointment. The bath went well and she left happy after stealing another bow.",
];

const mariaPrompts = [
  "Maria arrived at 9:04 AM. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The place was spotless when she left.",
  "Maria came back for another cleaning job. The kitchen and bathrooms were a mess, and she left the place spotless.",
];

let profile = createCreativeLearningProfileV11();
let lastCoco: CompiledExperienceV11 | undefined;

for (const prompt of cocoPrompts) {
  lastCoco = compileExperienceV11(prompt, {
    businessDomain: "dog grooming",
    creativeLearning: profile,
  });
  profile = lastCoco.creativeLearning;
}

for (const prompt of mariaPrompts) {
  const result = compileExperienceV11(prompt, {
    businessDomain: "housekeeping",
    creativeLearning: profile,
  });
  profile = result.creativeLearning;
}

const grooming = suggestCreativeStrategyV11(profile, "grooming");
const housekeeping = suggestCreativeStrategyV11(profile, "housekeeping");

console.log("\n===== V11 CREATIVE LEARNING LOOP =====\n");
console.log("OBSERVATIONS:", profile.observations);
console.log("ACCEPTED:", profile.acceptedObservations);
console.log("GROOMING STRATEGY:", grooming);
console.log("HOUSEKEEPING STRATEGY:", housekeeping);
console.log("COCO LAST STORY:", lastCoco?.movie.beats.map((beat) => beat.text));
console.log("COCO LEARNING:", lastCoco?.learning);

assert(profile.version === "v11", "Profile must be V11");
assert(profile.observations > 0, "Learning loop must observe inventions");
assert(profile.acceptedObservations === profile.observations, "Default generated inventions should be accepted in this probe");
assert(grooming.operation, "Grooming must learn a preferred creative operation");
assert(grooming.anchors.some((anchor) => /bath|bow|scared|happy|stole/i.test(anchor)), "Grooming must learn concrete recurring anchors");
assert(grooming.patterns.length > 0, "Grooming must learn reusable phrase patterns");
assert(housekeeping.operation, "Housekeeping must learn a preferred creative operation");
assert(housekeeping.anchors.some((anchor) => /kitchen|bathrooms|spotless|cleaned/i.test(anchor)), "Housekeeping must learn domain evidence");
assert(!grooming.anchors.some((anchor) => /kitchen|bathrooms/i.test(anchor)), "Grooming must not learn housekeeping anchors");
assert(!housekeeping.anchors.some((anchor) => /bow|pomeranian/i.test(anchor)), "Housekeeping must not learn grooming anchors");
assert(lastCoco?.movie.beats.every((beat) => !/mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text)), "Learning must never leak internal language");

console.log("\nV11 ACCEPTANCE: PASS\n");
