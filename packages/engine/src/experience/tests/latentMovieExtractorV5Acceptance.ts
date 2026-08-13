import { extractLatentMovieV5 } from "../latentMovieExtractorV5.js";

const INTERNAL = /\b(?:mechanic|beat|pressure|turning point|transformation|payoff|escalation|reveal|relationship|directive|compiler|latent movie|narrative lens|story shape|fact kind|memory thread)\b/i;

const cases = [
  {
    name: "Maria service mission",
    prompt: "Maria arrived at 9:04 AM. Pin dropped in Riverside. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The place was spotless when she left.",
    subject: "Maria",
    mustFacts: ["9:04 AM", "Riverside", "kitchen", "two bathrooms", "11:47 AM", "spotless"],
    mustStory: ["ready for battle", "mission"],
  },
  {
    name: "Coco recurring grooming",
    prompt: "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy.",
    subject: "Coco",
    mustFacts: ["Pomeranian", "scared", "bath", "stole a bow", "happy"],
    mustStory: ["stole a bow"],
  },
  {
    name: "Wedding command is not an event",
    prompt: "Make a wedding event memory for my wedding Jan 1 2025. Everyone invited can add memories.",
    subject: "wedding",
    mustFacts: ["my wedding", "Date: Jan 1 2025", "People can add memories."],
    noDirectiveLeak: true,
  },
  {
    name: "Surfboard memory",
    prompt: "Make a story of all the beaches my surfboard has traveled.",
    subject: "surfboard",
    mustFacts: ["My surfboard has traveled across beaches."],
    noDirectiveLeak: true,
  },
  {
    name: "Rave memory",
    prompt: "Make a memory of my trips to all the raves I've gone to.",
    subject: "raves",
    mustFacts: ["My trips to raves are part of the memory."],
    noDirectiveLeak: true,
  },
  {
    name: "Horror",
    prompt: "Make a creepy memory of the night we heard something moving upstairs.",
    subject: "the night",
    noDirectiveLeak: true,
  },
  {
    name: "Airbnb-safe service language",
    prompt: "Maria arrived at 10 AM. She cleaned the kitchen and two bathrooms. She left at noon and the place was spotless.",
    subject: "Maria",
    mustStory: ["place was spotless"],
    mustNotStory: ["homeowner", "customer", "tenant"],
  },
];

for (const test of cases) {
  const result = extractLatentMovieV5(test.prompt);
  console.log(`\n===== ${test.name} =====`);
  console.log("THREAD:", result.memoryThread);
  console.log("DIRECTIVES:", result.directives);
  console.log("FACTS:", result.facts.map((f) => f.text));
  console.log("SUBJECT:", result.subject);
  console.log("LENS:", result.lens);
  console.log("STORY:");
  for (const beat of result.beats) console.log(`  ${beat.order + 1}. ${beat.text}`);

  if (result.subject.toLowerCase() !== test.subject.toLowerCase()) throw new Error(`${test.name}: subject expected ${test.subject}, got ${result.subject}`);
  if (!result.beats.length || result.beats.some((b) => !b.text.trim())) throw new Error(`${test.name}: empty story beat`);
  if (result.beats.some((b) => INTERNAL.test(b.text))) throw new Error(`${test.name}: internal mechanic leaked into final prose`);
  for (const expected of test.mustFacts ?? []) if (!result.facts.some((f) => f.text.toLowerCase().includes(expected.toLowerCase()))) throw new Error(`${test.name}: missing fact ${expected}`);
  for (const expected of test.mustStory ?? []) if (!result.beats.some((b) => b.text.toLowerCase().includes(expected.toLowerCase()))) throw new Error(`${test.name}: missing story phrase ${expected}`);
  for (const forbidden of test.mustNotStory ?? []) if (result.beats.some((b) => b.text.toLowerCase().includes(forbidden.toLowerCase()))) throw new Error(`${test.name}: forbidden business-specific word leaked: ${forbidden}`);
  if (test.noDirectiveLeak) {
    if (!result.directives.length) throw new Error(`${test.name}: directive was not recognized`);
    if (result.facts.some((f) => /^(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i.test(f.text))) throw new Error(`${test.name}: command leaked into facts`);
  }
  if (!result.memoryThread.key.startsWith("memory:")) throw new Error(`${test.name}: missing stable memory thread key`);
}

console.log("\nLATENT MOVIE EXTRACTOR V5 ACCEPTANCE PASSED");
