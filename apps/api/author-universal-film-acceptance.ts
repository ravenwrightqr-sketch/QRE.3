import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type Case = {
  name: string;
  subject: string;
  lens?: string;
  facts: string[];
  prompt: string;
};

const cases: Case[] = [
  {
    name: "COCO DOG TAG",
    subject: "Coco",
    facts: [
      "Coco arrived",
      "Coco is a small dog",
      "Coco loves apples",
      "Coco walks in the park",
      "Coco chases squirrels",
    ],
    prompt: "Make a tiny living memory for Coco from only these facts. Do not explain the facts. Make the real details feel alive.",
  },
  {
    name: "MARIA HOUSE RESET",
    subject: "Maria",
    facts: [
      "Maria started cleaning at 9:04",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "Maria finished at 11:47",
    ],
    prompt: "Turn Maria's supplied house reset into short watchable media. Discover the strongest progression. Do not invent employees, events, or a literal mission.",
  },
  {
    name: "RESTAURANT ROMANCE",
    subject: "Alex and Sam",
    lens: "romance",
    facts: [
      "Alex and Sam arrived at the restaurant",
      "the restaurant was closed",
      "the lights were off",
      "chairs were on the ceiling",
      "they stayed together",
    ],
    prompt: "Make this short memory feel like the beginning of something between Alex and Sam. The strange restaurant facts are real; do not invent why they happened.",
  },
  {
    name: "PAUL MEMORY",
    subject: "Paul",
    facts: [
      "Paul loved old records",
      "Paul kept every birthday card",
      "Paul played the same song every Sunday",
      "Paul moved away",
      "Paul is gone",
    ],
    prompt: "Make a compact living memory for Paul. Let the supplied repetition and later absence change the meaning. Do not write a eulogy or explanation.",
  },
  {
    name: "MOVING",
    subject: "the move",
    lens: "heist + comedy",
    facts: [
      "boxes filled the hallway",
      "the couch was still upstairs",
      "the kitchen was already empty",
      "two trips remained",
      "the truck left at 11:47",
    ],
    prompt: "Make the move feel like an escalating operation using only the supplied reality. The mission feeling is a lens, not a literal event.",
  },
  {
    name: "HOUSE MEMORY",
    subject: "the house",
    facts: [
      "the house was empty when we first entered",
      "the kitchen had green cabinets",
      "the old table stayed",
      "we ate the first dinner at that table",
      "years later the house was sold",
    ],
    prompt: "Make a short memory of the house that could be worth replaying years later. Find the meaning carried by the supplied table and return without inventing history.",
  },
  {
    name: "CAR WASH",
    subject: "the car",
    lens: "fierce",
    facts: [
      "the car arrived covered in dust",
      "the wheels were cleaned",
      "the paint was polished",
      "the car left shining",
    ],
    prompt: "Make the car the star. Turn the supplied transformation into short media, not an advertisement for the car wash.",
  },
];

const forbidden = /\b(?:this means|which means|the point is|the meaning is|the viewer|the audience|the narrative|cognition|planner|candidate|trajectory|evidence|metamorphic|latent movie|creative opportunity)\b/i;
const leadName = (text: string, subject: string): boolean => new RegExp(`^${subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:\\b|:)`, "i").test(text.trim());
const words = (text: string): number => (text.match(/\b[\w’'-]+\b/g) ?? []).length;

function fail(message: string): never {
  throw new Error(`UNIVERSAL FILM ACCEPTANCE FAILED: ${message}`);
}

const outputs: string[] = [];
for (const test of cases) {
  const result = await authorBrainCanonical({
    prompt: test.prompt,
    subject: test.subject,
    lens: test.lens,
    facts: test.facts,
    sourceMoments: test.facts,
    memoryContext: [],
    creativeLearningContext: [],
  });

  if (!result.diagnostics.complete || !result.diagnostics.renderable) {
    fail(`${test.name}: final experience is not renderable`);
  }
  if (!result.movie) fail(`${test.name}: no selected Movie`);
  if (!result.scenes.length) fail(`${test.name}: no scenes`);
  if (result.sequence.cuts.some((cut) => cut.sourceIds.length === 0)) {
    fail(`${test.name}: provenance lost`);
  }
  if (result.scenes.some((scene) => forbidden.test(scene.text))) {
    fail(`${test.name}: internal/explanatory language leaked into Mouth`);
  }

  const repeatedNameOpen = result.scenes.length >= 2 && result.scenes.every((scene) => leadName(scene.text, test.subject));
  if (repeatedNameOpen) fail(`${test.name}: subject became an authorial template`);

  if (!result.scenes.every((scene) => words(scene.text) <= 24)) {
    fail(`${test.name}: Mouth became prose instead of media`);
  }

  const allText = result.scenes.map((scene) => scene.text).join(" ");
  outputs.push(allText);
  console.log(`\n=== ${test.name} ===`);
  console.log(`MOVIE: ${result.movie.id}`);
  console.log(`LENS: ${test.lens ?? "none"}`);
  console.log(`SCORE: ${result.diagnostics.selectedScore}`);
  console.log(`SCENES: ${result.scenes.length}`);
  result.scenes.forEach((scene, index) => console.log(`${index + 1}. ${scene.text}`));
}

const normalized = outputs.map((text) => text.toLowerCase().replace(/\W+/g, " ").trim());
const uniqueOutputs = new Set(normalized).size;
if (uniqueOutputs < Math.ceil(cases.length * 0.8)) {
  fail(`cross-domain output collapse: ${uniqueOutputs}/${cases.length} materially unique experiences`);
}

async function runLens(subject: string, facts: string[], prompt: string, lens: string): Promise<{ text: string; sourceIds: string[] }> {
  const result = await authorBrainCanonical({
    prompt,
    subject,
    lens,
    facts,
    sourceMoments: facts,
    memoryContext: [],
    creativeLearningContext: [],
  });
  if (!result.diagnostics.complete || !result.movie || !result.scenes.length) {
    fail(`same-reality/${lens}: no renderable film`);
  }
  return {
    text: result.scenes.map((scene) => scene.text).join(" "),
    sourceIds: result.sequence.cuts.flatMap((cut) => cut.sourceIds).sort(),
  };
}

const lensFacts = [
  "the restaurant was closed",
  "the lights were off",
  "chairs were on the ceiling",
  "Alex and Sam stayed together",
];
const lensPrompt = "Make a short memory from these facts. The lens must change the feeling, never the reality.";
const comedy = await runLens("Alex and Sam", lensFacts, lensPrompt, "comedy");
const romance = await runLens("Alex and Sam", lensFacts, lensPrompt, "romance");
const horror = await runLens("Alex and Sam", lensFacts, lensPrompt, "horror");

if (comedy.sourceIds.join("|") !== romance.sourceIds.join("|") || comedy.sourceIds.join("|") !== horror.sourceIds.join("|")) {
  fail("same reality produced different provenance envelopes across lenses");
}
const sameRealityOutputs = new Set([comedy.text, romance.text, horror.text]);
if (sameRealityOutputs.size < 2) {
  fail("same reality collapsed to one identical film across comedy/romance/horror");
}

console.log("\n=== SAME REALITY / LENS DIVERGENCE ===");
console.log(`COMEDY: ${comedy.text}`);
console.log(`ROMANCE: ${romance.text}`);
console.log(`HORROR: ${horror.text}`);
console.log("PROVENANCE: SAME");
console.log("EXPERIENCE: DIVERGENT");
console.log("\nUNIVERSAL FILM ACCEPTANCE: COMPLETE");
console.log("REALITY → RELATIONSHIP → MOVIE → LENS → MOUTH → PLAYABLE MEDIA");
