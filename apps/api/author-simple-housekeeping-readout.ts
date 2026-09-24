import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const facts = [
  "arrived at 9:04",
  "cleaned the kitchen",
  "cleaned two bathrooms",
  "finished at 11:47",
];

const result = await authorBrainCanonical({
  prompt: "Create the QRE readout from this completed housekeeping service.",
  subject: "housekeeping service",
  facts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  returning: false,
  visitNumber: 1,
  movieMode: true,
});

console.log("\n=== QRE SIMPLE HOUSEKEEPING READOUT ===");

console.log("\nFACTUAL READOUT");
for (const event of result.world.events) {
  console.log(`- ${event.id}: ${event.label}`);
}

console.log("\nCREATIVE DISCOVERY");
console.log(JSON.stringify(result.diagnostics.creativeDiscovery ?? null, null, 2));

console.log("\nSELECTED TREATMENT");
console.log(JSON.stringify(result.diagnostics.selectedTreatment ?? null, null, 2));

console.log("\nQRE OUTPUT");
result.scenes.forEach((scene, index) => {
  console.log(`[${index + 1}] ${scene.text}`);
});

console.log("\nMODEL CALLS");
console.log(result.diagnostics.modelCalls);
