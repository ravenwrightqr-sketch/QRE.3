import assert from "node:assert/strict";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCreativeSpine } from "./src/services/authorCreativeSpine.js";

const cases = [
  {
    name: "COCO SERVICE",
    subject: "Coco",
    facts: ["Coco arrived dirty", "bath happened", "Coco became clean", "blue bow", "pickup happened"],
    lenses: ["comedy", "noir", "heist + comedy", "game + fierce", "horror"],
  },
  {
    name: "MARIA HOUSE RESET",
    subject: "Maria",
    facts: ["Maria entered at 9:04 AM", "Maria cleaned the kitchen", "Maria cleaned bathroom one", "Maria cleaned bathroom two", "Maria finished at 11:47 AM"],
    lenses: ["game", "military", "comedy", "documentary"],
  },
  {
    name: "RESTAURANT",
    subject: "Alex + Sam",
    facts: ["the restaurant was closed", "the lights were off", "chairs were on the ceiling", "Alex and Sam were together"],
    lenses: ["romance", "horror", "comedy", "deadpan"],
  },
  {
    name: "PAUL MEMORY",
    subject: "Paul",
    facts: ["Paul loved old records", "Paul kept every birthday card", "Paul played the same song every Sunday", "Paul is gone"],
    lenses: ["none", "tender", "documentary", "horror"],
    returning: true,
  },
  {
    name: "MOVING",
    subject: "the move",
    facts: ["the kitchen was packed", "the bedroom was emptied", "three boxes remained", "the new address was confirmed"],
    lenses: ["heist", "spy + comedy", "game"],
  },
  {
    name: "HOUSE MEMORY",
    subject: "the house",
    facts: ["we moved into the house in 2018", "Sunday dinners happened in the kitchen", "the children grew up upstairs", "we left the house in 2026"],
    lenses: ["tender", "documentary", "noir"],
    returning: true,
  },
  {
    name: "CAR WASH",
    subject: "Jordan's car",
    facts: ["Jordan's car arrived dirty", "the wash was completed", "Jordan's car left clean"],
    lenses: ["comedy", "fierce", "documentary", "heist"],
  },
  {
    name: "COCO DOG TAG",
    subject: "Coco",
    facts: ["Coco loves apples", "Coco likes small dogs", "Coco loves walks", "Coco watches squirrels", "Coco likes bacon"],
    lenses: ["fierce", "comedy", "documentary", "wild"],
  },
];

function canonicalRelationSignature(spine: ReturnType<typeof buildAuthorCreativeSpine>): string {
  return spine.relationSet.relations
    .map((relation) => `${relation.type}|${relation.mechanism}|${relation.evidenceEventIds.slice().sort().join(",")}`)
    .join("||");
}

for (const testCase of cases) {
  const graph = buildAuthorRealityGraph({
    prompt: `${testCase.name}: ${testCase.facts.join(" / ")}`,
    subject: testCase.subject,
    facts: testCase.facts,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
  });

  const neutral = buildAuthorCreativeSpine({ graph, subject: testCase.subject, returning: testCase.returning });
  assert.equal(neutral.relationSet.evidenceClosed, true, `${testCase.name}: relation evidence escaped reality`);
  assert.equal(neutral.relationSet.sourceEventIds.length, graph.events.length, `${testCase.name}: event coverage changed`);

  console.log(`\n=== ${testCase.name} ===`);
  console.log(`EVENTS: ${graph.events.length}`);
  console.log(`RELATIONS: ${neutral.relationSet.relationCount}`);
  console.log(`SELECTED: ${neutral.selectedRelationId ?? "none"}`);
  if (neutral.relationSet.relations[0]) {
    const relation = neutral.relationSet.relations[0];
    console.log(`MECHANISM: ${relation.mechanism}`);
    console.log(`OPPORTUNITY: ${relation.creativeOpportunity}`);
    console.log(`BEFORE: ${relation.before}`);
    console.log(`AFTER: ${relation.after}`);
    console.log(`FEEL: ${relation.feltEffect}`);
    console.log(`VIEWER: ${relation.viewerShift}`);
    console.log(`SCORE: ${relation.score}`);
  }

  let firstSignature = canonicalRelationSignature(neutral);
  const treatmentSignatures = new Set<string>();

  for (const lens of testCase.lenses) {
    const spine = buildAuthorCreativeSpine({ graph, subject: testCase.subject, lens, returning: testCase.returning });
    assert.equal(canonicalRelationSignature(spine), firstSignature, `${testCase.name}: lens changed relation discovery`);
    assert.equal(spine.lensTreatment.guardrails.length >= 5, true, `${testCase.name}: lens guardrails missing`);
    assert.equal(spine.relationSet.evidenceClosed, true, `${testCase.name}: ${lens} closed over evidence`);
    treatmentSignatures.add(spine.lensTreatment.pressure.join("|"));
    console.log(`LENS ${lens}: ${spine.lensTreatment.pressure.join(" + ")}`);
  }

  if (testCase.lenses.length > 1) {
    assert.ok(treatmentSignatures.size > 1, `${testCase.name}: composable lens stack did not materially change treatment`);
  }
}

console.log("\nUNIVERSAL CREATIVE SPINE ACCEPTANCE: COMPLETE");
