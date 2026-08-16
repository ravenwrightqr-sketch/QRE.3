/**
 * QRE AUTHOR MECHANIC STRESS 10
 *
 * Purpose: human-readable idea test before mechanic-selection code exists.
 * This deliberately does NOT invoke the Monster or mutate cognition.
 * It provides ten prompts with the creative question QRE should eventually solve:
 * what is the most interesting latent frame, and should a mechanic be used at all?
 */

export type MechanicStressCase = {
  id: number;
  kind: string;
  prompt: string;
  likelyFrameTests: string[];
  mustNotForceFrame?: boolean;
};

export const AUTHOR_MECHANIC_STRESS_10: MechanicStressCase[] = [
  {
    id: 1,
    kind: "dog grooming",
    prompt: "Coco came in nervous, got a bath, stole a blue bow, left looking fabulous.",
    likelyFrameTests: ["negotiation", "heist", "celebrity prep", "transformation"],
  },
  {
    id: 2,
    kind: "housekeeping",
    prompt: "Maria arrived at 9:04, cleaned the kitchen and two bathrooms, finished at 11:47.",
    likelyFrameTests: ["mission", "speedrun", "operation", "boss fight"],
  },
  {
    id: 3,
    kind: "moving service",
    prompt: "Three days, Riverside to Portland, kitchen packed first, one mystery box was still missing at the end.",
    likelyFrameTests: ["spy extraction", "heist", "mission", "investigation"],
  },
  {
    id: 4,
    kind: "car wash",
    prompt: "Black SUV came in filthy, wheels were covered in brake dust, left looking brand new.",
    likelyFrameTests: ["pit stop", "restoration", "transformation", "race prep"],
  },
  {
    id: 5,
    kind: "barber",
    prompt: "He asked for a clean fade, kept checking the mirror, walked out saying almost nothing.",
    likelyFrameTests: ["reveal", "character upgrade", "status change", "understatement"],
  },
  {
    id: 6,
    kind: "wedding",
    prompt: "They both wrote vows, barely looked at each other before the ceremony, then couldn't stop smiling afterward.",
    likelyFrameTests: ["countdown", "reveal", "romantic tension", "release"],
  },
  {
    id: 7,
    kind: "personal vision",
    prompt: "I want three years of raves, sushi everywhere, millions of coffee shops, and to meet lots of new women.",
    likelyFrameTests: ["quest", "achievement", "adventure", "campaign"],
  },
  {
    id: 8,
    kind: "travel memory",
    prompt: "We went back to Huntington. Same pier. Different year. Stayed until sunset.",
    likelyFrameTests: ["return", "memory loop", "reframing", "time passage"],
  },
  {
    id: 9,
    kind: "home knowledge",
    prompt: "Paint is recorded, kitchen appliance manuals are saved, and the HVAC was replaced in 2024.",
    likelyFrameTests: ["archive", "command center", "legacy", "property dossier"],
  },
  {
    id: 10,
    kind: "memorial",
    prompt: "She loved old records, kept every birthday card, and always played the same song on Sundays.",
    likelyFrameTests: ["memory", "refrain", "portrait", "quiet observation"],
    mustNotForceFrame: true,
  },
];

function printCase(test: MechanicStressCase): void {
  console.log(`\n[${test.id}] ${test.kind.toUpperCase()}`);
  console.log(`PROMPT: ${test.prompt}`);
  console.log(`FRAME TESTS: ${test.likelyFrameTests.join(" | ")}`);
  if (test.mustNotForceFrame) console.log("RULE: DO NOT FORCE A GAME/SPY/QUEST FRAME.");
}

console.log("=".repeat(82));
console.log("QRE AUTHOR MECHANIC STRESS 10");
console.log("IDEA TEST — WHAT FRAME, IF ANY, MAKES THE REALITY MORE INTERESTING?");
console.log("No templates. No implementation changes. Human-read the opportunities first.");
console.log("=".repeat(82));

for (const test of AUTHOR_MECHANIC_STRESS_10) printCase(test);

console.log("\nTEST STANDARD");
console.log("1. Frame must increase the experience, not merely label the category.");
console.log("2. Frame is a lens, never a scripted sequence.");
console.log("3. Sequence must still be discovered from the facts and beat-to-beat change.");
console.log("4. Low frame confidence means: stay natural.");
console.log("5. Creative interpretation may change the reading of facts; it may not invent concrete reality.");
