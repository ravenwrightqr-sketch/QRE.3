import { compileUniversalExperience } from "../../experience/universalExperienceCompiler.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNIVERSAL EXPERIENCE FAILED: ${message}`);
}

function run(prompt: string): string[] {
  const result = compileUniversalExperience(prompt);
  console.log(`\nPROMPT: ${prompt}`);
  result.lines.forEach((line, index) => console.log(`  ${index + 1}. ${line}`));
  return result.lines;
}

const coco = run(
  "Coco walked in suspicious of the whole arrangement. The bath changed the mood. Then Coco stole a bow like compensation was part of the package. By pickup, the whole ordeal had apparently been forgiven.",
);
assert(coco.length >= 3, "Coco produces a multi-line experience");
assert(coco.join(" ").toLowerCase().includes("coco"), "explicit subject survives");
assert(coco.join(" ").toLowerCase().includes("bath"), "prompt evidence survives");
assert(coco.join(" ").toLowerCase().includes("bow"), "distinctive consequence survives");
assert(!coco.join(" ").match(/groomer|tattoo|nightclub|treasure hunt/i), "no unrelated domain vocabulary is injected");

const house = run(
  "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
);
assert(house.join(" ").toLowerCase().includes("house"), "house is treated as supplied subject evidence");
assert(house.join(" ").toLowerCase().includes("kitchen"), "house details survive");
assert(house.join(" ").toLowerCase().includes("five stars"), "final consequence survives");
assert(!house.join(" ").toLowerCase().includes("owner"), "owner is never invented");

const concert = run(
  "The concert started late, the crowd got restless, then the first song hit and everyone was excited.",
);
assert(concert.join(" ").toLowerCase().includes("concert"), "concert survives as input evidence");
assert(concert.join(" ").toLowerCase().includes("restless"), "intermediate state survives");
assert(concert.join(" ").toLowerCase().includes("excited"), "observed final state survives");

const unrelated = run(
  "My grandfather's old watch sat in a drawer for years. I found it, cleaned it, and gave it to my sister.",
);
assert(unrelated.join(" ").toLowerCase().includes("watch"), "object subject survives");
assert(unrelated.join(" ").toLowerCase().includes("sister"), "relationship consequence survives");
assert(!unrelated.join(" ").match(/groomer|tattoo|nightclub|housekeeper/i), "unrelated prompt stays unrelated");

const instructionOnly = run("Create something memorable for a museum opening.");
assert(instructionOnly.length >= 1, "instruction-only prompt still realizes useful language");
assert(!instructionOnly.join(" ").match(/compiler|cognition|premise|directive|trajectory|mechanic/i), "internal vocabulary never reaches prose");

console.log("\nUNIVERSAL EXPERIENCE SENTENCE ACCEPTANCE: PASS\n");
