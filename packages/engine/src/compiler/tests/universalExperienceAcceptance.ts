import { compileUniversalExperience } from "../../universal/compiler.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNIVERSAL SENTENCE ACCEPTANCE FAILED: ${message}`);
}

function run(prompt: string) {
  const result = compileUniversalExperience(prompt);
  console.log(`\nPROMPT: ${prompt}`);
  result.lines.forEach((line, index) => console.log(`  ${index + 1}. ${line}`));
  return result;
}

const coco = run(
  "Coco walked in suspicious of the whole arrangement. The bath changed the mood. Then Coco stole a bow like compensation was part of the package. By pickup, the whole ordeal had apparently been forgiven.",
);
const cocoText = coco.lines.join(" ").toLowerCase();
assert(coco.lines.length >= 3, "Coco produces a real multi-line experience");
assert(cocoText.includes("coco"), "explicit subject survives");
assert(cocoText.includes("bath"), "intermediate event survives");
assert(cocoText.includes("bow"), "distinctive consequence survives");
assert(!/groomer|tattoo|nightclub|treasure hunt/i.test(cocoText), "no domain branch leaks into the prose");

const airbnb = run(
  "A house is rented as an Airbnb. Guests arrive, discover the kitchen is spotless, and leave five stars.",
);
const airbnbText = airbnb.lines.join(" ").toLowerCase();
assert(airbnbText.includes("house"), "house remains an input-grounded subject");
assert(airbnbText.includes("kitchen"), "place/detail evidence survives");
assert(airbnbText.includes("five stars"), "final consequence survives");
assert(!airbnbText.includes("owner"), "owner is never invented");
assert(airbnbText.includes("guests"), "explicit guests may be preserved");

const locationTime = run(
  "The concert started at 8pm on Friday at Riverside Theater. The crowd got restless, then the first song hit and everyone was excited.",
);
const event = locationTime.model.events.find((item) => item.time || item.date || item.place);
assert(event, "event metadata exists");
assert(event?.time?.toLowerCase().includes("8pm"), "time is attached to an event");
assert(event?.date?.toLowerCase().includes("friday"), "date is attached to an event");
assert(event?.place?.toLowerCase().includes("riverside theater"), "place is attached to an event");
const locationTimeText = locationTime.lines.join(" ").toLowerCase();
assert(locationTimeText.includes("concert"), "concert remains grounded in the prompt");
assert(locationTimeText.includes("restless") || locationTimeText.includes("excited"), "state evidence survives");

const kids = run("Create a treasure hunt for kids with clues hidden around the museum.");
const kidsText = kids.lines.join(" ").toLowerCase();
assert(kidsText.includes("kids"), "an explicitly supplied participant may survive");
assert(kidsText.includes("museum"), "an explicitly supplied place may survive");

const noKids = run("Create a treasure hunt with clues hidden around the museum.");
const noKidsText = noKids.lines.join(" ").toLowerCase();
assert(!/\bkids?\b|\bchildren\b/.test(noKidsText), "kids are not invented when the prompt does not say kids");

const memory = run(
  "My grandfather's old watch sat in a drawer for years. I found it, cleaned it, and gave it to my sister.",
);
const memoryText = memory.lines.join(" ").toLowerCase();
assert(memoryText.includes("watch"), "object subject survives");
assert(memoryText.includes("sister"), "explicit relationship survives");
assert(!/groomer|tattoo|nightclub|housekeeper/i.test(memoryText), "unrelated domain vocabulary never appears");

const instruction = run("Create something memorable for a museum opening.");
assert(instruction.lines.length >= 1, "instruction-only prompts still return human language");
assert(!/compiler|cognition|premise|directive|trajectory|mechanic/i.test(instruction.lines.join(" ")), "internal vocabulary never reaches customer prose");

console.log("\nUNIVERSAL EXPERIENCE SENTENCE ACCEPTANCE: PASS\n");
