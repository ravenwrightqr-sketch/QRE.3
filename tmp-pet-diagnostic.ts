import { authorBrainCanonical } from "./apps/api/src/services/authorBrainCanonical.js";

async function main() {
  const result = await authorBrainCanonical({
    prompt: "Milo dog tag and bacon memory",
    subject: "Milo",
    place: "",
    lens: "game",
    movieMode: true,
    facts: [
      "Milo is a small dog",
      "Milo wears a dog tag",
      "Milo loves bacon",
      "Milo loves walks",
      "Milo likes small dogs"
    ],
    sourceMoments: [
      "Here is Milo",
      "small dogs",
      "walks",
      "bacon"
    ],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  console.log("\n=== DIAGNOSTICS ===");
  console.dir(result.diagnostics, { depth: null });

  console.log("\n=== SCENES ===");
  console.dir(
    result.scenes.map((scene) => ({
      order: scene.order,
      text: scene.text,
    })),
    { depth: null }
  );

  console.log("\n=== CUTS ===");
  console.dir(
    result.sequence?.cuts.map((cut) => ({
      order: cut.order,
      text: cut.text,
      sourceIds: cut.sourceIds,
      reasons: cut.reasons,
    })),
    { depth: null }
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});