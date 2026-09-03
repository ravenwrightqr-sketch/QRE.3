import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNIVERSAL LEARNING LOOP FAILED: ${message}`);
}

type DomainCase = {
  name: string;
  subject: string;
  place: string;
  lens: string;
  firstFacts: string[];
  firstMoments: string[];
  observation: string;
  secondPrompt: string;
};

const cases: DomainCase[] = [
  {
    name: "housekeeper / 111 Elm St",
    subject: "111 Elm St",
    place: "111 Elm St",
    lens: "gaming",
    firstFacts: ["Bathroom cleaned", "Kitchen cleaned", "Arrived at 10:10am", "Left at 12:12pm"],
    firstMoments: ["Booting", "Entered kitchen", "Approaching bathrooms", "Bathrooms cleared", "Level cleared"],
    observation: "200 bottles of shampoo",
    secondPrompt: "Add the new observation: 200 bottles of shampoo. Notice anything odd? Make the return experience different from round one.",
  },
  {
    name: "pet",
    subject: "Coco",
    place: "Elm Street Grooming",
    lens: "comedy",
    firstFacts: ["Coco was groomed", "Coco got a bath", "Coco stole the red bow"],
    firstMoments: ["Groomed", "Bath", "Red bow stolen"],
    observation: "Coco watched the dryer like it had personally offended her",
    secondPrompt: "Add the new observation: Coco watched the dryer like it had personally offended her. Return and reframe the established world.",
  },
  {
    name: "relationship",
    subject: "the couple",
    place: "the restaurant",
    lens: "romance",
    firstFacts: ["They met at the restaurant", "They talked for hours", "They left together"],
    firstMoments: ["A first meeting", "Hours passed", "They left together"],
    observation: "They returned to the same table years later",
    secondPrompt: "Add the new observation: They returned to the same table years later. Let the return change the meaning of the first visit.",
  },
  {
    name: "physical product",
    subject: "the surfboard",
    place: "the beach",
    lens: "spy",
    firstFacts: ["The surfboard was delivered", "The owner scanned its tag", "The board went home"],
    firstMoments: ["Package delivered", "Tag scanned", "Board went home"],
    observation: "The tag was scanned again after the board disappeared for a week",
    secondPrompt: "Add the new observation: The tag was scanned again after the board disappeared for a week. Let the return create a new reading.",
  },
  {
    name: "event",
    subject: "the rave",
    place: "Warehouse 9",
    lens: "cyberpunk",
    firstFacts: ["The doors opened", "Music started", "Everyone stayed until morning"],
    firstMoments: ["Doors unlocked", "Signal went live", "Morning arrived"],
    observation: "The same red light was still on when everyone left",
    secondPrompt: "Add the new observation: The same red light was still on when everyone left. Return and make the established detail newly meaningful.",
  },
];

function truthishText(result: Awaited<ReturnType<typeof authorBrainUniversal>>): string {
  return result.scenes.map((scene) => scene.text).join(" ");
}

for (const test of cases) {
  const round1 = await authorBrainUniversal({
    prompt: test.name,
    subject: test.subject,
    place: test.place,
    lens: test.lens,
    movieMode: true,
    returning: false,
    visitNumber: 1,
    facts: test.firstFacts,
    sourceMoments: test.firstMoments,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  assert(round1.sequence, `${test.name}: round 1 produced no SequencePlay`);
  assert(round1.sequence.cuts.length >= 2, `${test.name}: round 1 needs at least two cuts`);
  assert(round1.sequence.cuts.every((cut) => cut.order >= 1), `${test.name}: round 1 cut ordering invalid`);
  assert(round1.sequence.cuts.every((cut) => cut.sourceIds.length > 0), `${test.name}: round 1 lost source provenance`);
  assert(round1.scenes.length === round1.sequence.cuts.length, `${test.name}: round 1 scene/cut mismatch`);
  assert((round1.diagnostics as any).worldSimulation, `${test.name}: round 1 did not expose World Simulation`);

  const round1Text = truthishText(round1);
  assert(round1Text.length > 0, `${test.name}: round 1 produced no authored language`);

  const learnedContext = [
    "accepted: short punchy callback",
    "behavior-preference: return with changed meaning",
    `observation: ${test.observation}`,
  ];

  const round2 = await authorBrainUniversal({
    prompt: test.secondPrompt,
    subject: test.subject,
    place: test.place,
    lens: test.lens,
    movieMode: true,
    returning: true,
    visitNumber: 2,
    facts: [...test.firstFacts, test.observation],
    sourceMoments: [...test.firstMoments, test.observation],
    memoryContext: [
      `prior authored sequence: ${round1Text}`,
      `prior subject: ${test.subject}`,
      `prior place: ${test.place}`,
    ],
    trajectory: round1.sequence.cuts.map((cut) => cut.attentionDelta),
    creativeLearningContext: learnedContext,
  });

  assert(round2.sequence, `${test.name}: round 2 produced no SequencePlay`);
  assert(round2.scenes.length === round2.sequence.cuts.length, `${test.name}: round 2 scene/cut mismatch`);
  assert(round2.sequence.cuts.every((cut) => cut.sourceIds.length > 0), `${test.name}: round 2 lost source provenance`);
  assert((round2.diagnostics as any).worldSimulation, `${test.name}: round 2 lost World Simulation`);

  const round2Text = truthishText(round2);
  assert(round2Text.length > 0, `${test.name}: round 2 produced no authored language`);
  assert(round2Text !== round1Text, `${test.name}: round 2 did not materially change authored language`);
  assert(
    round2.sequence.cuts.some((cut) => cut.role === "callback" || cut.role === "reframe" || cut.role === "discovery" || cut.role === "consequence" || cut.role === "payoff"),
    `${test.name}: round 2 did not expose a meaningful return/readjustment cut`,
  );

  console.log(`PASS: ${test.name}`);
  console.log(`  round1Cuts=${round1.sequence.cuts.length} round2Cuts=${round2.sequence.cuts.length}`);
  console.log(`  round1Text=${JSON.stringify(round1Text)}`);
  console.log(`  round2Text=${JSON.stringify(round2Text)}`);
}

console.log("AUTHOR UNIVERSAL LEARNING LOOP ACCEPTANCE: PASS");
console.log("FIRST_USE_TEACHES_PRODUCT=TRUE");
console.log("RETURN_ADDS_NEW_EVIDENCE=TRUE");
console.log("SAME_BRAIN_CROSS_DOMAIN=TRUE");
console.log("WORLD_SIMULATION_SURVIVES_RETURN=TRUE");
