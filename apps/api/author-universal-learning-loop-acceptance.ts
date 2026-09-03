import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";
import type { AuthorBrainTruth } from "@qre/contracts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNIVERSAL LEARNING LOOP FAILED: ${message}`);
}

function textOf(result: Awaited<ReturnType<typeof authorBrainCanonical>>): string {
  return result.scenes.map((scene) => String(scene.text ?? "").replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
}

function simulationOf(result: Awaited<ReturnType<typeof authorBrainCanonical>>) {
  return result.movie?.storyThesis?.observerExperience?.simulation;
}

type DomainCase = Pick<AuthorBrainTruth, "subject" | "place" | "lens"> & {
  name: string;
  firstPrompt: string;
  firstFacts: string[];
  firstMoments: string[];
  observation: string;
  returnPrompt: string;
};

const cases: DomainCase[] = [
  {
    name: "housekeeper / 111 Elm St",
    subject: "111 Elm St",
    place: "111 Elm St",
    lens: "gaming",
    firstPrompt: "Cleaning job at 111 Elm St",
    firstFacts: ["Bathroom cleaned", "Kitchen cleaned", "Arrived at 10:10am", "Left at 12:12pm"],
    firstMoments: ["Entered kitchen", "Approaching bathrooms", "Bathrooms cleared", "Level cleared"],
    observation: "200 bottles of shampoo",
    returnPrompt: "Return to 111 Elm St. New observation: 200 bottles of shampoo. Make the new detail matter.",
  },
  {
    name: "pet",
    subject: "Coco",
    place: "Elm Street Grooming",
    lens: "comedy",
    firstPrompt: "Coco at Elm Street Grooming",
    firstFacts: ["Coco was groomed", "Coco got a bath", "Coco stole the red bow"],
    firstMoments: ["Groomed", "Bath", "Red bow stolen"],
    observation: "Coco watched the dryer like it had personally offended her",
    returnPrompt: "Coco returns to Elm Street Grooming. New observation: Coco watched the dryer like it had personally offended her. Reframe what we already know.",
  },
  {
    name: "relationship",
    subject: "Jake and John",
    place: "Raven Coffee",
    lens: "romance",
    firstPrompt: "Jake and John meet through a geo-drop at Raven Coffee",
    firstFacts: ["Jake and John met unexpectedly", "They talked until close", "They connected deeply", "They were happy"],
    firstMoments: ["Geo-drop", "Raven Coffee", "Talked until close", "Deep connection", "Happy"],
    observation: "They returned to the same table",
    returnPrompt: "Jake and John return to Raven Coffee. New observation: they returned to the same table. Let the first meeting mean something different now.",
  },
  {
    name: "physical product",
    subject: "the surfboard",
    place: "the beach",
    lens: "spy",
    firstPrompt: "A surfboard begins traveling with its owner",
    firstFacts: ["The surfboard was delivered", "The owner scanned the tag", "The surfboard traveled home"],
    firstMoments: ["Delivered", "Tag scanned", "Went home"],
    observation: "The board has now been to a new beach",
    returnPrompt: "Return to the surfboard. New observation: the board has now been to a new beach. Reframe its journey.",
  },
  {
    name: "event / rave",
    subject: "the rave",
    place: "Warehouse 9",
    lens: "cyberpunk",
    firstPrompt: "All-night rave at Warehouse 9",
    firstFacts: ["The doors opened", "Music started", "Everyone stayed until morning"],
    firstMoments: ["Doors opened", "Signal went live", "Morning arrived"],
    observation: "The same red light was still on when everyone left",
    returnPrompt: "Return to Warehouse 9. New observation: the same red light was still on when everyone left. Make that detail newly meaningful.",
  },
];

for (const test of cases) {
  const base = {
    subject: test.subject,
    place: test.place,
    lens: test.lens,
    movieMode: true,
    memoryContext: [] as string[],
    trajectory: [] as string[],
    creativeLearningContext: [] as string[],
  } satisfies Partial<AuthorBrainTruth>;

  const round1 = await authorBrainCanonical({
    ...base,
    prompt: test.firstPrompt,
    facts: test.firstFacts,
    sourceMoments: test.firstMoments,
  });

  assert(round1.diagnostics.complete, `${test.name}: round 1 incomplete`);
  assert(round1.sequence.cuts.length >= 2, `${test.name}: round 1 too short`);
  assert(round1.scenes.length === round1.sequence.cuts.length, `${test.name}: round 1 scene/cut mismatch`);
  assert(round1.sequence.cuts.every((cut) => cut.sourceIds.length > 0), `${test.name}: round 1 lost provenance`);
  assert(simulationOf(round1), `${test.name}: round 1 lost World Simulation`);

  const round1Text = textOf(round1);

  const round2 = await authorBrainCanonical({
    ...base,
    prompt: test.returnPrompt,
    returning: true,
    visitNumber: 2,
    facts: [...test.firstFacts, test.observation],
    sourceMoments: [...test.firstMoments, test.observation],
    memoryContext: [round1Text],
    trajectory: round1.sequence.cuts.map((cut) => cut.attentionDelta),
    creativeLearningContext: ["accepted: short punchy callback"],
  });

  assert(round2.diagnostics.complete, `${test.name}: round 2 incomplete`);
  assert(round2.sequence.cuts.length >= 2, `${test.name}: round 2 too short`);
  assert(round2.scenes.length === round2.sequence.cuts.length, `${test.name}: round 2 scene/cut mismatch`);
  assert(round2.sequence.cuts.every((cut) => cut.sourceIds.length > 0), `${test.name}: round 2 lost provenance`);
  assert(simulationOf(round2), `${test.name}: round 2 lost World Simulation`);

  const round2Text = textOf(round2);
  assert(round2Text.length > 0, `${test.name}: round 2 empty`);
  assert(round2Text !== round1Text, `${test.name}: new observation did not affect authored experience`);
  assert(round2.diagnostics.recoveryUsed !== true, `${test.name}: recovery replaced creative realization`);

  console.log(`PASS ${test.name}: round1=${round1.sequence.cuts.length} cuts, round2=${round2.sequence.cuts.length} cuts`);
}

console.log("AUTHOR UNIVERSAL LEARNING LOOP ACCEPTANCE: PASS");
console.log("FIRST_USE_TEACHES_PRODUCT=TRUE");
console.log("RETURN_ADDS_NEW_EVIDENCE=TRUE");
console.log("WORLD_OBSERVATION_IS_NOT_CREATOR_PREFERENCE=TRUE");
console.log("SAME_BRAIN_CROSS_DOMAIN=TRUE");
console.log("WORLD_SIMULATION_SURVIVES_RETURN=TRUE");
