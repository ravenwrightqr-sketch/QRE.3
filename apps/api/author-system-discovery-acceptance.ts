import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { chooseArtistDirection } from "./src/services/authorArtistChoice.js";

type Case = {
  name: string;
  subject: string;
  facts: string[];
  prompt: string;
};

const cases: Case[] = [
  {
    name: "coco",
    subject: "Coco",
    facts: [
      "Coco is a poodle",
      "Coco loves bacon",
      "Coco likes squirrels",
      "Coco loves the park",
      "Coco walks",
      "Coco rolls in grass",
      "Coco likes apples",
    ],
    prompt: "Create a short living QRE experience that makes Coco instantly recognizable.",
  },
  {
    name: "housekeeping",
    subject: "The cleaning crew",
    facts: [
      "The crew arrives for kitchen and bathroom cleaning",
      "The kitchen is usually the hardest room",
      "Bathrooms are completed before the final inspection",
      "A cat watches the work",
      "The crew finishes with an inspection",
    ],
    prompt: "Create a short service experience that makes this crew feel memorable and specific.",
  },
  {
    name: "shop",
    subject: "The shelf",
    facts: [
      "The shelf holds many product flavors",
      "Products are grouped by flavor",
      "Some boxes are kept behind the counter",
      "Customers try products before leaving",
      "Popular flavors need to be replenished",
    ],
    prompt: "Create a short business experience that makes the shelf feel like it has a recognizable character or operating logic.",
  },
];

for (const testCase of cases) {
  const graph = buildAuthorRealityGraph({
    prompt: testCase.prompt,
    subject: testCase.subject,
    facts: testCase.facts,
    sourceMoments: testCase.facts,
    memoryContext: [],
    trajectory: [],
  });

  const choice = await chooseArtistDirection({
    prompt: testCase.prompt,
    subject: testCase.subject,
    graph,
    subjectMaterial: {
      identity: [],
      traits: [],
      preferences: [],
      routines: [],
      goals: [],
      relationships: [],
      memories: [],
      other: testCase.facts,
    },
    movies: [],
    lensCandidates: [],
  });

  console.log(`\\n=== ${testCase.name.toUpperCase()} ===`);
  console.log(`LENS: ${choice.selectedLens}`);
  console.log(`ATTENTION: ${choice.attentionStrategy}`);
}

console.log("\\nAUTHOR SYSTEM DISCOVERY ACCEPTANCE: COMPLETE");
