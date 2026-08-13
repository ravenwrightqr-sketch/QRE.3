import { extractLatentMovieV3 } from "../latentMovieExtractorV3.js";

const cases = [
  {
    name: "Coco grooming",
    prompt: "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy.",
    subject: "Coco",
    lens: "funny",
    mustContain: ["stole a bow", "happy"],
  },
  {
    name: "Maria housekeeping",
    prompt: "Maria arrived at 9:04 AM. Her location was recorded. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The place was spotless when she left.",
    subject: "Maria",
    lens: "cinematic",
    mustContain: ["9:04 AM", "kitchen", "two bathrooms", "11:47 AM"],
  },
  {
    name: "Wedding directive separation",
    prompt: "Make a wedding event memory for my wedding Jan 1 2025. Everyone invited can add memories.",
    subject: "wedding",
    lens: "warm",
    mustContain: [],
    noDirectiveLeak: true,
  },
  {
    name: "Surfboard directive separation",
    prompt: "Make a story of all the beaches my surfboard has traveled.",
    subject: "surfboard",
    lens: "cinematic",
    mustContain: [],
    noDirectiveLeak: true,
  },
  {
    name: "Rave directive separation",
    prompt: "Make a memory of my trips to all the raves I've gone to.",
    subject: "trips",
    lens: "warm",
    mustContain: [],
    noDirectiveLeak: true,
  },
  {
    name: "Horror",
    prompt: "Make a creepy memory of the night we heard something moving upstairs.",
    subject: "the night",
    lens: "horror",
    mustContain: [],
    noDirectiveLeak: true,
  },
  {
    name: "Mystery",
    prompt: "Tell the story of a strange key we found at the old house.",
    subject: "key",
    lens: "mysterious",
    mustContain: [],
    noDirectiveLeak: true,
  },
  {
    name: "Mess to victory",
    prompt: "Maria arrived at 9:04 AM. The kitchen was a mess. The bathrooms were worse. She finished at 11:47 AM and left everything spotless.",
    subject: "Maria",
    lens: "cinematic",
    mustContain: ["ready for battle", "mission was winning"],
  },
];

for (const test of cases) {
  const result = extractLatentMovieV3(test.prompt);
  console.log(`\n===== ${test.name} =====`);
  console.log("DIRECTIVES:", result.directives);
  console.log("FACTS:", result.facts.map((f) => f.text));
  console.log("SUBJECT:", result.movie.subject);
  console.log("LENS:", result.lenses[0]);
  console.log("RELATIONSHIPS:", result.relationships.map((r) => `${r.from} ${r.relation} ${r.to}`));
  console.log("ARC:", result.arc);
  console.log("STORY:");
  for (const beat of result.beats) console.log(`  ${beat.order + 1}. ${beat.text}`);

  if (result.movie.subject.toLowerCase() !== test.subject.toLowerCase()) {
    throw new Error(`${test.name}: subject expected ${test.subject}, got ${result.movie.subject}`);
  }
  if (result.lenses[0] !== test.lens) throw new Error(`${test.name}: lens expected ${test.lens}, got ${result.lenses[0]}`);
  if (!result.beats.length || result.beats.some((b) => !b.text.trim())) throw new Error(`${test.name}: empty story beat`);
  for (const expected of test.mustContain) {
    if (!result.facts.some((f) => f.text.toLowerCase().includes(expected.toLowerCase()))) {
      throw new Error(`${test.name}: missing fact ${expected}`);
    }
  }
  if (test.noDirectiveLeak) {
    if (result.facts.some((f) => /^(?:make|create|build|turn|transform|write|tell|give|generate|design|produce|show)\b/i.test(f.text))) {
      throw new Error(`${test.name}: compiler directive leaked into facts`);
    }
    if (result.directives.length === 0) throw new Error(`${test.name}: directive was not recognized`);
  }
}

console.log("\nLATENT MOVIE EXTRACTOR V3 ACCEPTANCE PASSED");
