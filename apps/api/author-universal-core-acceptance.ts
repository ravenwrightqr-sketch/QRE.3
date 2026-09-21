import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type Case = {
  name: string;
  subject: string;
  facts: string[];
  domainContext?: Record<string, unknown>;
};

const cases: Case[] = [
  {
    name: "HOUSEKEEPING",
    subject: "housekeeping service",
    facts: [
      "arrived at 9:04",
      "cleaned the kitchen",
      "cleaned two bathrooms",
      "finished at 11:47",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "SERVICE",
      serviceType: "HOUSEKEEPING",
    },
  },
  {
    name: "COCO",
    subject: "Coco",
    facts: [
      "Coco was nervous",
      "Coco got a bath",
      "a bow was added",
      "Coco tried to remove the bow",
      "Coco left happy",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "PET GROOMING",
      subjectType: "DOG",
      serviceType: "PET GROOMING",
    },
  },
  {
    name: "COCO_BLIND",
    subject: "Coco",
    facts: [
      "Coco was nervous",
      "Coco got a bath",
      "a bow was added",
      "Coco tried to remove the bow",
      "Coco left happy",
    ],
  },
  {
    name: "MILO",
    subject: "Milo",
    facts: [
      "Milo loves walks",
      "Milo loves bacon",
      "Milo loves small dogs",
    ],
    domainContext: {
      experienceMode: "IDENTITY",
      category: "DOG TAG",
      subjectType: "DOG",
      outputType: "LIVING DOG TAG",
    },
  },
  {
    name: "RELATIONSHIP",
    subject: "Alex",
    facts: [
      "felt nervous before meeting Alex",
      "talked for two hours",
      "felt lighter afterward",
      "met Alex again the next week",
    ],
    domainContext: {
      experienceMode: "MEMORY",
      category: "RELATIONSHIP MEMORY",
      subjectType: "PERSON",
    },
  },
];

const requestedCase = String(process.env.QRE_AUTHOR_CASE ?? "").trim().toUpperCase();
const selectedCases = requestedCase
  ? cases.filter((test) => test.name === requestedCase)
  : cases;

if (requestedCase && !selectedCases.length) {
  throw new Error(`Unknown QRE_AUTHOR_CASE: ${requestedCase}. Expected one of: ${cases.map((test) => test.name).join(", ")}`);
}

for (const test of selectedCases) {
  const result = await authorBrainCanonical({
    prompt: "Create the QRE experience from supplied reality.",
    subject: test.subject,
    facts: test.facts,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
    domainContext: test.domainContext,
    returning: false,
    visitNumber: 1,
    movieMode: true,
  });

  console.log(`\n=== ${test.name} ===`);

  console.log("\nREALITY");
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
}

console.log("\nQRE UNIVERSAL CORE ACCEPTANCE: COMPLETE");
