import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";

const cases = [
  {
    name: "dog-groomer-promo",
    prompt: "CREATE A VIDEO FOR MY DOG GROOMING BUSINESS",
    lens: "service_promo",
  },
  {
    name: "housekeeping-battle",
    prompt: "Maria arrived at 9:04 AM, cleaned the bathroom, living room, and kitchen, and finished at 11:47 AM. Make it a quiet battle for control of the house.",
    lens: "comedy",
  },
  {
    name: "wedding-memory",
    prompt: "Make a wedding memory cinematic.",
    lens: "romantic",
  },
  {
    name: "horror",
    prompt: "The hotel room looked ordinary until the old photograph above the desk was noticed. Then the lights flickered.",
    lens: "horror",
  },
];

for (const test of cases) {
  console.log(`\n${"=".repeat(92)}`);
  console.log(`${test.name}: ${test.prompt}`);
  console.time(test.name);
  const scenes = await authorCinematicSequence({
    prompt: test.prompt,
    lens: test.lens,
    subject: "",
    place: "",
    sourceMoments: [],
    facts: [],
    memoryContext: [],
    creativeLearningContext: [],
    trajectory: [],
  });
  console.timeEnd(test.name);
  console.log(`SCENES: ${scenes.length}`);
  for (const [index, scene] of scenes.entries()) {
    console.log(`\n[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text.split(/\s+/).length} words · ${scene.durationHintMs ?? "auto"}ms`);
    console.log(scene.text);
  }
}

console.log(`\n${"=".repeat(92)}`);
console.log("AUTHOR BENCHMARK COMPLETE");
