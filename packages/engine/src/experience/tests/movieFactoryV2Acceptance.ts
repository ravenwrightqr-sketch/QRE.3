import { findLatentMovie } from "../movieFactoryV2.js";

const cases = [
  {
    name: "Coco grooming",
    prompt: "Coco is a Pomeranian. She came into the groomer scared. She ended up enjoying the bath. She stole a bow. She walked out happy.",
  },
  {
    name: "Maria housekeeping",
    prompt: "Maria arrived at 9:04 AM. Her location was recorded. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The homeowner comes home to a clean house.",
  },
  {
    name: "Wedding",
    prompt: "Make a wedding event memory for my wedding Jan 1 2025. Everyone invited can add memories.",
  },
  {
    name: "Surfboard",
    prompt: "Make a story of all the beaches my surfboard has traveled.",
  },
  {
    name: "Raves",
    prompt: "Make a memory of my trips to all the raves I've gone to.",
  },
];

for (const test of cases) {
  const result = findLatentMovie(test.prompt);
  console.log(`\n===== ${test.name} =====`);
  console.log("SUBJECT:", result.movie.subject);
  console.log("STYLE:", result.style);
  console.log("EVENTS:");
  for (const event of result.movie.events) console.log(`  ${event.order + 1}. ${event.fact}`);
  console.log("STORY:");
  for (const beat of result.beats) console.log(`  ${beat.order + 1}. ${beat.text}`);

  if (!result.movie.subject) throw new Error(`${test.name}: missing subject`);
  if (!result.movie.events.length) throw new Error(`${test.name}: no events discovered`);
  if (!result.beats.length) throw new Error(`${test.name}: no story beats generated`);
  if (result.beats.some((beat) => !beat.text.trim())) throw new Error(`${test.name}: empty prose beat`);
}

console.log("\nLATENT MOVIE FACTORY V2 ACCEPTANCE PASSED");
