import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const facts = [
  "arrived at 9:04",
  "vacuumed the living room",
  "dusted the shelves",
  "wiped the counters",
  "cleaned the kitchen",
  "cleaned two bathrooms",
  "mopped the floors",
  "finished at 11:47",
];

const result = await authorBrainCanonical({
  prompt: "Create the QRE experience from this completed housekeeping service.",
  subject: "housekeeping service",
  facts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  returning: false,
  visitNumber: 1,
  playoutMode: "experience",
  domainContext: {
    category: "home services",
    businessType: "housekeeping",
    businessName: "Example Housekeeping",
    serviceType: "residential cleaning",
    services: [
      "vacuuming",
      "dusting",
      "surface cleaning",
      "kitchen cleaning",
      "bathroom cleaning",
      "mopping",
    ],
    importantFacts: [
      "residential housekeeping service",
      "the recorded tasks are completed service work",
    ],
  },
});

console.log("\n=== QRE SERVICE COMPRESSION READOUT ===");

console.log("\nCURRENT REALITY");
for (const event of result.world.events) {
  console.log(`- ${event.id}: ${event.label}`);
}

console.log("\nCREATIVE DISCOVERY");
console.log(JSON.stringify(result.diagnostics.creativeDiscovery ?? null, null, 2));

console.log("\nQRE EXPERIENCE");
result.scenes.forEach((scene, index) => {
  console.log(`[${index + 1}] ${scene.text}`);
});

console.log("\nMODEL CALLS");
console.log(result.diagnostics.modelCalls);
