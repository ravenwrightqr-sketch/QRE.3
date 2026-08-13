import { compileExperienceV15 } from "../experienceCompilerV15.js";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`V15 ACCEPTANCE FAILED: ${message}`);
}

console.log("\n===== V15 MEMORY FORESIGHT =====\n");

const first = compileExperienceV15(
  "Coco visited the groomer in August, had a bath, was happy, and loved the bow.",
  { memoryScope: { assetId: "coco-v15" } },
);
const second = compileExperienceV15(
  "Coco returned to the groomer in August, was happy again, and loved the bow.",
  { memoryScope: { assetId: "coco-v15" }, memory: first.memory },
);
const couple = compileExperienceV15(
  "John and Jane are married and prefer quiet beach dinners.",
  { memoryScope: { assetId: "couple-v15" } },
);
const home = compileExperienceV15(
  "The home is in Palm Springs and the owners love brunch nearby.",
  { memoryScope: { assetId: "home-v15" } },
);

console.log("COCO TEMPORAL:", second.memory.foresight.temporalPatterns.map((x) => x.key));
console.log("COCO CUES:", second.memory.foresight.cues.map((x) => x.cue));
console.log("COUPLE CUES:", couple.memory.foresight.cues.map((x) => x.cue));
console.log("HOME CUES:", home.memory.foresight.cues.map((x) => x.cue));

assert(second.memory.foresight.temporalPatterns.length > 0, "time patterns are learned");
assert(second.memory.foresight.cues.some((x) => x.kind === "returning"), "returning behavior becomes a cue");
assert(second.memory.foresight.cues.some((x) => x.kind === "preference"), "preferences become cues");
assert(couple.memory.foresight.cues.some((x) => x.cue.includes("quiet beach dinners")), "couple preferences survive into foresight");
assert(home.memory.foresight.cues.some((x) => x.kind === "place" && x.cue.includes("Palm Springs")), "places become cues");
assert(second.movie.beats.every((beat) => !/mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text)), "internals never leak");

console.log("\nV15 ACCEPTANCE: PASS\n");
