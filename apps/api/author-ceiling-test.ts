import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";

console.log("\n===== QRE CINEMATIC AUTHOR TEST =====\n");

console.time("author");

const scenes = await authorCinematicSequence({
  prompt: "CREATE A VIDEO FOR MY DOG GROOMING BUSINESS",
  lens: "service_promo",
  subject: "",
  place: "",
  sourceMoments: [],
  facts: [],
  memoryContext: [],
  creativeLearningContext: [],
  trajectory: [],
});

console.timeEnd("author");

console.log("\nSCENES RETURNED:", scenes.length);

for (const [index, scene] of scenes.entries()) {
  console.log(`\n--- SCENE ${index + 1} [${scene.kind ?? "unknown"}] ---`);
  console.log(scene.text);
}

console.log("\n===== END =====\n");
