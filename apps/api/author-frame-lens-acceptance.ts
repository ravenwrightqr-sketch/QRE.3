import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FRAME LENS ACCEPTANCE FAILED: ${message}`);
}

function run(
  name: string,
  input: Parameters<typeof buildAuthorCognitivePlan>[0],
  expected: string,
): void {
  const plan = buildAuthorCognitivePlan(input);
  console.log(`${name}: frame=${plan.characterRead.creativeFrames[0]?.frame ?? "NONE"} lens=${input.lens ?? "NONE"}`);
  assert(input.lens === expected, `${name} expected resolved lens ${expected}, got ${input.lens ?? "NONE"}`);
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

run("COCO", { ...coco, memoryContext: [], priorScenes: [], round: 1 }, "negotiation");
run("HOUSEKEEPING", { ...house, memoryContext: [], priorScenes: [], round: 1 }, "operation");
run("MOVING", {
  prompt: "Moving service receipt",
  subject: "the family",
  facts: ["three days", "kitchen packed first", "one mystery box was still missing at the end"],
  sourceMoments: ["kitchen packed first", "mystery box missing"],
  memoryContext: [],
  priorScenes: [],
  round: 1,
  realityGraph: movingGraph,
}, "investigation");

const memorial = buildAuthorCognitivePlan({
  prompt: "Memorial memory",
  subject: "her",
  facts: ["loved old records", "kept every birthday card", "played the same song on Sundays"],
  sourceMoments: ["same song on Sundays"],
  memoryContext: [],
  priorScenes: [],
  round: 1,
});

console.log(`MEMORIAL: frame=${memorial.characterRead.creativeFrames[0]?.frame ?? "NONE"}`);
assert(
  memorial.characterRead.creativeFrames[0]?.frame === "refrain" || memorial.characterRead.creativeFrames[0]?.frame === "quiet observation",
  "memorial should stay natural rather than receive a game frame",
);

console.log("FRAME LENS ACCEPTANCE: PASS");
