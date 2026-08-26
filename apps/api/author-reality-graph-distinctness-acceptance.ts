import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

const facts = [
  "Coco is a dog",
  "Coco is a poodle",
  "Coco likes squirrels",
  "Coco walks",
  "Coco loves bacon",
  "Coco likes some dogs",
  "Coco loves the park",
  "Coco likes summer",
  "Coco rolls in grass",
  "Coco likes apples",
];

const graph = buildAuthorRealityGraph({
  prompt: "Create a QRE sequence from supplied reality for Coco.",
  subject: "Coco",
  facts,
  sourceMoments: [],
});

const badPairs = new Set([
  "Coco likes some dogs|Coco likes summer",
  "Coco likes summer|Coco likes apples",
  "Coco likes apples|Coco likes squirrels",
  "Coco likes squirrels|Coco likes some dogs",
]);

const labels = new Map(graph.events.map((event) => [event.id, event.label]));
const falseConvergences = graph.relations.filter((relation) => {
  if (relation.kind !== "converges") return false;
  const a = labels.get(relation.from) ?? "";
  const b = labels.get(relation.to) ?? "";
  return badPairs.has(`${a}|${b}`) || badPairs.has(`${b}|${a}`);
});

const convergencePairs = graph.relations
  .filter((relation) => relation.kind === "converges")
  .map((relation) => `${labels.get(relation.from) ?? relation.from} <-> ${labels.get(relation.to) ?? relation.to}`);

console.log("QRE REALITY GRAPH DISTINCTNESS ACCEPTANCE");
console.log(`EVENTS=${graph.events.length}`);
console.log(`CONVERGENCES=${convergencePairs.length}`);
for (const pair of convergencePairs) console.log(`  ${pair}`);

if (falseConvergences.length) {
  console.error(`FALSE_CONVERGENCES=${falseConvergences.length}`);
  process.exit(1);
}

console.log("FALSE_CONVERGENCES=0");
console.log("REALITY GRAPH DISTINCTNESS: PASS");
