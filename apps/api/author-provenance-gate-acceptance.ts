import type { AuthorRealityProvenance } from "@qre/contracts";
import { buildRealityProvenance } from "./src/services/authorRealityProvenance.js";
import { validateAuthorProvenance } from "./src/services/authorProvenanceGate.js";

type GateFact = { text: string; provenance: AuthorRealityProvenance };

const make = (text: string): GateFact => ({
  text,
  provenance: buildRealityProvenance(text, "memory", { subject: "Coco" }),
});

const petFacts = [
  make("long walks at night"),
  make("fierce"),
  make("friendly"),
  make("loves bacon"),
];

const clean = validateAuthorProvenance(
  [
    "Coco loves long walks at night.",
    "Coco is fierce and friendly.",
    "Coco loves bacon.",
  ],
  petFacts,
);
if (clean.length) throw new Error(`PROVENANCE GATE FAILED: grounded output rejected ${JSON.stringify(clean)}`);

const hallucinatedPlace = validateAuthorProvenance(
  ["Coco owns the park."],
  petFacts,
);
if (!hallucinatedPlace.some((item) => item.reason === "unsupported_place")) {
  throw new Error("PROVENANCE GATE FAILED: invented place passed");
}

const hallucinatedObject = validateAuthorProvenance(
  ["Coco stole the tennis ball."],
  petFacts,
);
if (!hallucinatedObject.some((item) => item.reason === "unsupported_object")) {
  throw new Error("PROVENANCE GATE FAILED: invented object passed");
}

const inventedRelationship = validateAuthorProvenance(
  ["Coco met her best friend."],
  petFacts,
);
if (!inventedRelationship.some((item) => item.reason === "unsupported_person")) {
  throw new Error("PROVENANCE GATE FAILED: invented person/relationship passed");
}

const memoryFacts = [
  make("met at the local bar"),
  make("connected"),
  make("talked until close"),
  make("seen each other every day"),
];
const inventedBarHistory = validateAuthorProvenance(
  ["They talked until close and never left the bar."],
  memoryFacts,
);
if (inventedBarHistory.some((item) => item.reason === "unsupported_place")) {
  throw new Error("PROVENANCE GATE FAILED: existing place should remain usable");
}

console.log("AUTHOR PROVENANCE GATE ACCEPTANCE: PASS");
console.log(`grounded=${clean.length === 0}`);
console.log(`invented_place=${hallucinatedPlace.some((item) => item.reason === "unsupported_place")}`);
console.log(`invented_object=${hallucinatedObject.some((item) => item.reason === "unsupported_object")}`);
console.log(`invented_person=${inventedRelationship.some((item) => item.reason === "unsupported_person")}`);
console.log(`memory_place_preserved=${!inventedBarHistory.some((item) => item.reason === "unsupported_place")}`);
