import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
const probes = [
  {
    name: "Dog Groomer",
    prompt:
      "Make a story receipt for Coco's grooming appointment that the groomer can send to the owner after the appointment.",
  },
  {
    name: "Housekeeper",
    prompt:
      "Make a story receipt a housekeeper can send to the client after cleaning their home. Show that they arrived, cleaned the living room and kitchen, and finished the job.",
  },
  {
    name: "Pet Groomer",
    prompt:
      "Make a fun customer story for a dog grooming business that shows Coco arriving, getting groomed, looking great, and being ready to go home.",
  },
];

for (const probe of probes) {
  const compiled = compileCognitiveExperience(probe.prompt);

  console.log("\n");
  console.log("=".repeat(80));
  console.log(probe.name);
  console.log("=".repeat(80));

  console.log("\nPROMPT:");
  console.log(probe.prompt);

  console.log("\nTITLE:");
  console.log(compiled.title);

  console.log("\nSTORY:");
  for (const [index, beat] of compiled.story.beats.entries()) {
    console.log(`\n${index + 1}. [${beat.kind}]`);
    console.log(beat.text);
  }

  console.log("\nMOMENTS:");
  console.dir(compiled.moments, { depth: null });

  console.log("\nCOGNITION:");
  console.dir(compiled.cognition, { depth: null });

  console.log("\nCINEMATIC SCENES:");
  console.dir(compiled.cinematicScenes, { depth: null });

  console.log("\n" + "=".repeat(80));
}