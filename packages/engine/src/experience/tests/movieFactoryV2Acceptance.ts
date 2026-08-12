import { findLatentMovie } from "../movieFactoryV2.js";

const cases = [
  {
    name: "Coco grooming",
    prompt: "Coco is a Pomeranian. She came into the groomer scared. She ended up enjoying the bath. She stole a bow. She walked out happy.",
    expectSubject: "Coco",
    expectStyle: "funny",
  },
  {
    name: "Maria housekeeping",
    prompt: "Maria arrived at 9:04 AM. Her location was recorded. She cleaned the kitchen and two bathrooms. She finished at 11:47 AM. The homeowner comes home to a clean house.",
    expectSubject: "Maria",
    expectStyle: "cinematic",
    expectText: "ready for battle",
  },
  {
    name: "Wedding",
    prompt: "Make a wedding event memory for my wedding Jan 1 2025. Everyone invited can add memories.",
    expectSubject: "wedding",
    expectStyle: "warm",
    expectText: "Jan 1 2025",
  },
  {
    name: "Surfboard",
    prompt: "Make a story of all the beaches my surfboard has traveled.",
    expectSubject: "surfboard",
    expectStyle: "cinematic",
    expectText: "surfboard",
  },
  {
    name: "Raves",
    prompt: "Make a memory of my trips to all the raves I've gone to.",
    expectSubject: "trips",
    expectStyle: "warm",
    expectText: "raves",
  },
  {
    name: "Horror",
    prompt: "Make a creepy memory of the night we heard something moving upstairs.",
    expectStyle: "horror",
  },
  {
    name: "Mystery",
    prompt: "Tell the story of a strange key we found at the old house.",
    expectStyle: "mysterious",
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
  if (!result.movie.events.length) throw new Error(`${test.name}: no latent events discovered`);
  if (!result.beats.length) throw new Error(`${test.name}: no story beats generated`);
  if (result.beats.some((beat) => !beat.text.trim())) throw new Error(`${test.name}: empty prose beat`);
  if (test.expectSubject && result.movie.subject.toLowerCase() !== test.expectSubject.toLowerCase()) {
    throw new Error(`${test.name}: subject expected ${test.expectSubject}, got ${result.movie.subject}`);
  }
  if (test.expectStyle && result.style !== test.expectStyle) {
    throw new Error(`${test.name}: style expected ${test.expectStyle}, got ${result.style}`);
  }
  if (test.expectText && !result.beats.some((beat) => beat.text.toLowerCase().includes(test.expectText.toLowerCase()))) {
    throw new Error(`${test.name}: expected transformed phrase ${test.expectText}`);
  }
  if (result.movie.events.some((event) => /^(?:make|create|build|turn|write|tell)\b/i.test(event.fact))) {
    throw new Error(`${test.name}: compiler instruction leaked into latent movie events`);
  }
}

console.log("\nLATENT MOVIE FACTORY V2 ACCEPTANCE PASSED");
