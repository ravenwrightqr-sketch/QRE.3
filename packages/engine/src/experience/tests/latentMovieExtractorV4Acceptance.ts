import { extractLatentMovieV4 } from "../latentMovieExtractorV4.js";

const INTERNAL = /\b(?:mechanic|beat|pressure|turning point|transformation|payoff|escalation|reveal|relationship|directive|compiler|latent movie|narrative lens|story shape)\b/i;

const cases = [
  {
    name: "Maria service mission",
    prompt: "Maria arrived at 9:04 AM. Pin dropped in Riverside. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The place was spotless when she left.",
    subject: "Maria",
    lens: "cinematic",
    mustFacts: ["9:04 AM", "Riverside", "kitchen", "two bathrooms", "11:47 AM", "spotless"],
    mustStory: ["ready for battle", "mission was winning"],
  },
  {
    name: "Coco funny",
    prompt: "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy.",
    subject: "Coco",
    lens: "funny",
    mustFacts: ["Pomeranian", "scared", "bath", "stole a bow", "happy"],
    mustStory: ["stole a bow", "battle"],
  },
  {
    name: "Wedding directive becomes payload",
    prompt: "Make a wedding event memory for my wedding Jan 1 2025. Everyone invited can add memories.",
    subject: "wedding",
    lens: "warm",
    mustFacts: ["my wedding Jan 1 2025", "Date: Jan 1 2025", "People can add memories."],
    noDirectiveLeak: true,
  },
  {
    name: "Surfboard directive becomes payload",
    prompt: "Make a story of all the beaches my surfboard has traveled.",
    subject: "surfboard",
    lens: "cinematic",
    mustFacts: ["My surfboard has traveled across beaches."],
    noDirectiveLeak: true,
  },
  {
    name: "Rave memory directive becomes payload",
    prompt: "Make a memory of my trips to all the raves I've gone to.",
    subject: "raves",
    lens: "warm",
    mustFacts: ["My trips to raves are part of the memory."],
    noDirectiveLeak: true,
  },
  {
    name: "Horror",
    prompt: "Make a creepy memory of the night we heard something moving upstairs.",
    subject: "the night",
    lens: "horror",
    mustFacts: [],
    noDirectiveLeak: true,
  },
];

for (const test of cases) {
  const result = extractLatentMovieV4(test.prompt);
  console.log(`\n===== ${test.name} =====`);
  console.log("DIRECTIVES:", result.directives);
  console.log("FACTS:", result.facts.map((f) => f.text));
  console.log("SUBJECT:", result.subject);
  console.log("LENS:", result.lens);
  console.log("RELATIONSHIPS:", result.relationships.map((r) => `${r.from} ${r.relation} ${r.to}`));
  console.log("ARC:", result.arc);
  console.log("STORY:");
  for (const beat of result.beats) console.log(`  ${beat.order + 1}. ${beat.text}`);

  if (result.subject.toLowerCase() !== test.subject.toLowerCase()) throw new Error(`${test.name}: subject expected ${test.subject}, got ${result.subject}`);
  if (result.lens !== test.lens) throw new Error(`${test.name}: lens expected ${test.lens}, got ${result.lens}`);
  if (!result.beats.length || result.beats.some((b) => !b.text.trim())) throw new Error(`${test.name}: empty story beat`);
  for (const expected of test.mustFacts) if (!result.facts.some((f) => f.text.toLowerCase().includes(expected.toLowerCase()))) throw new Error(`${test.name}: missing fact ${expected}`);
  if (test.mustStory) for (const expected of test.mustStory) if (!result.beats.some((b) => b.text.toLowerCase().includes(expected.toLowerCase()))) throw new Error(`${test.name}: missing story phrase ${expected}`);
  if (test.noDirectiveLeak) {
    if (result.facts.some((f) => /^(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i.test(f.text))) throw new Error(`${test.name}: directive leaked into facts`);
    if (!result.directives.length) throw new Error(`${test.name}: directive was not recognized`);
  }
  if (result.beats.some((b) => INTERNAL.test(b.text))) throw new Error(`${test.name}: internal mechanic leaked into final prose`);
}

console.log("\nLATENT MOVIE EXTRACTOR V4 ACCEPTANCE PASSED");
