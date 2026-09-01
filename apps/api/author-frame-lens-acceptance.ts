import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FRAME LENS ACCEPTANCE FAILED: ${message}`);
}

function run(
  name: string,
  input: Parameters<typeof buildAuthorCognitivePlan>[0],
  expectedLens: string,
): void {
  const plan = buildAuthorCognitivePlan(input);
  const frame = plan.characterRead.creativeFrames[0]?.frame ?? "NONE";
  console.log(`${name}: frame=${frame} selectedFrame=${plan.selectedFrame} lens=${input.lens ?? "NONE"}`);
  assert(
    plan.selectedFrame === expectedLens,
    `${name} expected resolved lens ${expectedLens}, got ${plan.selectedFrame}`,
  );
  assert(
    frame === expectedLens,
    `${name} expected character frame ${expectedLens}, got ${frame}`,
  );
}

const coco = {
  prompt: "Dog grooming service receipt",
  subject: "Coco",
  facts: ["poodle", "nervous", "fierce", "came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
  sourceMoments: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
};

const house = {
  prompt: "Housekeeping service receipt",
  subject: "Maria",
  facts: ["arrived at 9:04", "cleaned the kitchen", "cleaned two bathrooms", "finished at 11:47"],
  sourceMoments: ["arrived at 9:04", "cleaned the kitchen", "cleaned two bathrooms", "finished at 11:47"],
};

const movingGraph = buildAuthorRealityGraph({
  prompt: "Moving service receipt",
  subject: "the family",
  place: "Riverside to Portland",
  facts: ["three days", "kitchen packed first", "one mystery box was still missing at the end"],
  sourceMoments: ["kitchen packed first", "mystery box missing"],
  memoryContext: [],
  trajectory: [],
});

run("COCO", {
  ...coco,
  memoryContext: [],
  priorScenes: [],
  round: 1,
  lens: "comedy",
}, "comedy");

run("HOUSEKEEPING", {
  ...house,
  memoryContext: [],
  priorScenes: [],
  round: 1,
  lens: "procedural",
}, "procedural");

run("MOVING", {
  prompt: "Moving service receipt",
  subject: "the family",
  facts: ["three days", "kitchen packed first", "one mystery box was still missing at the end"],
  sourceMoments: ["kitchen packed first", "mystery box missing"],
  memoryContext: [],
  priorScenes: [],
  round: 1,
  lens: "detective",
  realityGraph: movingGraph,
}, "detective");

const memorial = buildAuthorCognitivePlan({
  prompt: "Memorial memory",
  subject: "her",
  facts: ["loved old records", "kept every birthday card", "played the same song on Sundays"],
  sourceMoments: ["same song on Sundays"],
  memoryContext: [],
  priorScenes: [],
  round: 1,
  lens: "NONE",
});

console.log(`MEMORIAL: frame=${memorial.characterRead.creativeFrames[0]?.frame ?? "NONE"} selectedFrame=${memorial.selectedFrame}`);
assert(
  memorial.selectedFrame === "NONE",
  `MEMORIAL expected explicit NONE to remain authoritative, got ${memorial.selectedFrame}`,
);

console.log("FRAME LENS ACCEPTANCE: PASS");
