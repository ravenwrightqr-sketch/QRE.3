import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type SatanicoCase = {
  name: string;
  subject: string;
  facts: readonly string[];
  prompt: string;
};

const cases: readonly SatanicoCase[] = [
  {
    name: "DOG TAG / FIDO",
    subject: "Fido",
    facts: [
      "Fido entered",
      "Fido is a Pomeranian",
      "Fido loves walks",
      "Fido loves small dogs",
      "Fido loves Cheetos",
    ],
    prompt:
      "Make a short living memory for Fido's dog tag. Discover the strangest grounded relationship hiding among the supplied facts. Do not invent events.",
  },
  {
    name: "WEDDING",
    subject: "the wedding",
    facts: [
      "the ceremony started at 4:00 PM",
      "rain began during the vows",
      "everyone moved under the covered patio",
      "the cake stayed dry",
      "the couple cut the cake outside",
    ],
    prompt:
      "Make a short living wedding memory. Find a surprising true relationship among the supplied events rather than summarizing the wedding.",
  },
  {
    name: "RELATIONSHIP",
    subject: "Mike and Joe",
    facts: [
      "Mike and Joe met at Luigi's",
      "they talked until closing",
      "the restaurant emptied",
      "they kept talking",
      "they both knew it was the start of something great",
    ],
    prompt:
      "Make a short living memory for Mike and Joe. Discover the latent movie in the relationship among the supplied facts. Do not invent events.",
  },
  {
    name: "HOUSE",
    subject: "the house",
    facts: [
      "the house was empty",
      "the kitchen was painted green",
      "the old table stayed",
      "boxes filled the hallway",
      "the first dinner happened at the old table",
    ],
    prompt:
      "Make a short living memory about the house. Find the strongest grounded recontextualization hiding in the facts instead of listing rooms or objects.",
  },
  {
    name: "BUSINESS",
    subject: "the shop",
    facts: [
      "the shop opened at 9:00 AM",
      "the first customer bought one sticker",
      "the owner kept the first dollar",
      "the sticker became the shop's best seller",
      "the shop still displays the first dollar",
    ],
    prompt:
      "Make a short living memory for the shop. Discover the unusual true relationship among the first sale, the kept dollar, and the later success.",
  },
  {
    name: "TRAVEL",
    subject: "the trip",
    facts: [
      "we missed the train",
      "we walked through the old market",
      "we found a tiny bakery",
      "we stayed for coffee",
      "we arrived at the hotel after dark",
    ],
    prompt:
      "Make a short living travel memory. Find the movie hidden in the way the missed train changes the meaning of the rest of the trip.",
  },
  {
    name: "OBJECT",
    subject: "the ring",
    facts: [
      "the ring belonged to my grandmother",
      "a scratch is visible on the inside",
      "I wore it during the move",
      "I stopped wearing it for years",
      "I put it on again last week",
    ],
    prompt:
      "Make a short living memory for the ring. Discover why the repeated physical detail and return to wearing it matter together. Do not invent history.",
  },
  {
    name: "MIXED REALITY",
    subject: "Coco",
    facts: [
      "Coco arrived nervous",
      "the bathroom was cleaned",
      "Coco watched the room",
      "a blue bow was chosen",
      "Coco left looking fabulous",
      "the same blue bow was remembered later",
    ],
    prompt:
      "Make Coco's short living memory. Keep unrelated ambient facts in reality without forcing them into Coco's movie. Let a supplied callback change the meaning of an earlier detail.",
  },
];

function fail(message: string): never {
  throw new Error(`SATANICO ACCEPTANCE FAILED: ${message}`);
}

for (const test of cases) {
  const result = await authorBrainCanonical({
    prompt: test.prompt,
    subject: test.subject,
    facts: [...test.facts],
    sourceMoments: [...test.facts],
    memoryContext: [],
    creativeLearningContext: [],
  });

  const diagnostics = result.diagnostics;
  const scenes = result.scenes;

  console.log("\n============================================================");
  console.log(`SATANICO · ${test.name}`);
  console.log("============================================================");
  console.log(`STATUS: ${diagnostics.qualityStatus ?? "UNKNOWN"}`);
  console.log(`RENDERABLE: ${diagnostics.renderable ? "YES" : "NO"}`);
  console.log(`SCORE: ${diagnostics.selectedScore ?? 0}`);
  console.log(`MODEL REQUESTS: ${diagnostics.modelCalls ?? 0}`);
  console.log(`SCENES: ${scenes.length}`);

  if (!result.sequence || !scenes.length) {
    fail(`${test.name} produced no authored sequence`);
  }

  if (!diagnostics.complete) {
    fail(`${test.name} did not produce a complete grounded sequence`);
  }

  if (result.sequence.cuts.some((cut) => cut.sourceIds.length === 0)) {
    fail(`${test.name} lost provenance on at least one cut`);
  }

  scenes.forEach((scene, index) => {
    console.log(`[${index + 1}] ${scene.text}`);
  });
}

console.log("\n============================================================");
console.log("SATANICO UNIVERSAL ACCEPTANCE · ALL CASES PASSED");
console.log("REALITY TRUTH · PROVENANCE · COMPLETE SEQUENCE · CROSS-DOMAIN");
console.log("============================================================");
