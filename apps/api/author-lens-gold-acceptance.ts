import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCreativeSpine } from "./src/services/authorCreativeSpine.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`AUTHOR LENS GOLD ACCEPTANCE FAILED: ${message}`);
}

const graph = buildAuthorRealityGraph({
  prompt: "Dog grooming service receipt",
  subject: "Coco",
  place: "Riverside",
  facts: [
    "Coco is a small poodle",
    "Coco arrived at 10 AM",
    "Coco had opinions",
    "Coco got a bath",
    "Coco resisted the dryer",
    "Coco stole an apple",
    "Coco finished the groom",
    "Coco wore a blue bow",
  ],
  sourceMoments: [
    "Coco arrived at 10 AM",
    "Coco got a bath",
    "Coco resisted the dryer",
    "Coco stole an apple",
    "Coco finished the groom",
    "Coco wore a blue bow",
  ],
  memoryContext: [],
  trajectory: [],
});

const lenses = [
  "comedy",
  "romance",
  "horror",
  "tenderness",
  "nostalgia",
  "chaos",
  "fierce",
  "absurd",
  "dramatic",
  "quiet",
] as const;

const treatments = lenses.map((lens) => {
  const spine = buildAuthorCreativeSpine({ graph, subject: "Coco", lens });
  return { lens, treatment: spine.lensTreatment, selectedRelationId: spine.selectedRelationId };
});

for (const { lens, treatment } of treatments) {
  console.log(`${lens}: primary=${treatment.primary} pressure=${treatment.pressure.join(", ")}`);
  assert(treatment.primary === lens, `${lens} did not resolve to its canonical lens`);
  assert(treatment.guardrails.some((rule) => rule.includes("only concrete authority")), `${lens} lost reality authority guardrail`);
  assert(treatment.guardrails.some((rule) => rule.includes("may not create a new")), `${lens} lost invention guardrail`);
}

const none = buildAuthorCreativeSpine({ graph, subject: "Coco", lens: "NONE" });
console.log(`NONE: primary=${none.lensTreatment.primary} selectedRelation=${none.selectedRelationId ?? "NONE"}`);
assert(none.lensTreatment.primary === "none", "NONE should not force a genre");
assert(!none.lensTreatment.pressure.length, "NONE should not inject creative pressure");

const comedy = treatments.find((item) => item.lens === "comedy")!;
const horror = treatments.find((item) => item.lens === "horror")!;
assert(
  comedy.treatment.pressure.join("|") !== horror.treatment.pressure.join("|"),
  "different lenses collapsed into the same pressure",
);

const allEvidenceIds = new Set(graph.events.map((event) => event.id));
for (const opportunity of buildAuthorCreativeSpine({ graph, subject: "Coco", lens: "comedy" }).opportunities) {
  for (const id of opportunity.evidenceEventIds) assert(allEvidenceIds.has(id), `lens opportunity referenced unknown evidence ${id}`);
}

console.log("AUTHOR LENS GOLD ACCEPTANCE: PASS");
