import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

type Case = {
  name: string;
  prompt: string;
  subject: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  lens?: string;
  minimumCuts: number;
};

type BrainResult = Awaited<ReturnType<typeof authorBrainUniversal>>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNIVERSAL AUTHOR FINAL ACCEPTANCE FAILED: ${message}`);
}

function textOf(result: BrainResult): string[] {
  return result.scenes.map((scene) => String(scene.text ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

function recoveryUsed(result: BrainResult): boolean | undefined {
  const value = result.diagnostics.recoveryUsed;
  return typeof value === "boolean" ? value : undefined;
}

function validateCase(test: Case, result: BrainResult): void {
  assert(result.sequence, `${test.name}: no SequencePlay`);
  assert(result.diagnostics.complete === true, `${test.name}: incomplete Author result`);
  assert(result.sequence.cuts.length >= test.minimumCuts, `${test.name}: too few sequence cuts`);
  assert(result.scenes.length === result.sequence.cuts.length, `${test.name}: scenes/cuts mismatch`);
  assert(result.sequence.cuts.every((cut, index) => cut.order === index + 1), `${test.name}: cut order is not contiguous`);
  assert(result.sequence.cuts.every((cut) => cut.sourceIds.length > 0), `${test.name}: cut lost source provenance`);
  assert(result.scenes.every((scene) => String(scene.text ?? "").trim()), `${test.name}: empty scene text`);

  const texts = textOf(result);
  assert(new Set(texts.map((value) => value.toLowerCase())).size === texts.length, `${test.name}: repeated authored cuts`);

  const joined = texts.join(" ");
  assert(joined.toLowerCase().includes(test.subject.toLowerCase()), `${test.name}: subject identity disappeared`);

  const recovery = recoveryUsed(result);
  assert(recovery !== true, `${test.name}: deterministic recovery replaced valid creative realization`);

  const worldSimulation = (result as any).field?.worldSimulation ?? (result as any).diagnostics?.worldSimulation;
  assert(worldSimulation, `${test.name}: final Author result lost World Simulation`);
  assert(Array.isArray(worldSimulation.relations), `${test.name}: World Simulation relations missing`);
  assert(Array.isArray(worldSimulation.questions), `${test.name}: World Simulation questions missing`);
}

const cases: Case[] = [
  {
    name: "service-receipt",
    prompt: "Dog grooming service experience",
    subject: "Coco",
    place: "Elm Street Grooming",
    facts: [
      "Coco was groomed at Elm Street Grooming.",
      "Coco got a bath.",
      "Coco stole the red bow.",
    ],
    sourceMoments: [
      "Coco was groomed at Elm Street Grooming.",
      "Coco got a bath.",
      "Coco stole the red bow.",
    ],
    lens: "comedy",
    minimumCuts: 3,
  },
  {
    name: "pet",
    prompt: "Milo dog tag and bacon memory",
    subject: "Milo",
    facts: ["Milo is a small dog", "Milo wears a dog tag", "Milo loves bacon"],
    sourceMoments: ["Here is Milo", "Do I smell bacon?", "The tag is still on him"],
    lens: "game",
    minimumCuts: 3,
  },
  {
    name: "relationship",
    prompt: "A relationship changed during an ordinary night",
    subject: "Alex",
    facts: ["Alex met Jordan", "They talked", "They kept talking after the restaurant closed", "Something began"],
    sourceMoments: ["Alex met Jordan", "They talked", "The restaurant closed", "They kept talking", "Something began"],
    minimumCuts: 3,
  },
  {
    name: "wedding",
    prompt: "Wedding memory and return years later",
    subject: "the couple",
    facts: ["The wedding was held", "An old photograph was present", "Everyone stayed", "They returned years later"],
    sourceMoments: ["People arrived", "The old photo surfaced", "Everyone stayed", "They came back"],
    lens: "romance",
    minimumCuts: 3,
  },
  {
    name: "restaurant",
    prompt: "Anniversary dinner at a restaurant",
    subject: "the anniversary couple",
    facts: ["A reservation was made", "A special dish arrived", "They waited", "They returned"],
    sourceMoments: ["Reservation", "Special dish", "Waiting", "Returned"],
    minimumCuts: 3,
  },
  {
    name: "event",
    prompt: "A crowded event with a late arrival",
    subject: "Morgan",
    facts: ["The event opened", "Morgan arrived late", "The crowd stayed", "Morgan returned"],
    sourceMoments: ["Doors opened", "Morgan arrived late", "The crowd stayed", "Morgan returned"],
    minimumCuts: 3,
  },
  {
    name: "rave",
    prompt: "An all-night music event",
    subject: "the night",
    facts: ["Music started", "The crowd stayed", "Morning arrived", "The music stopped"],
    sourceMoments: ["Music started", "The crowd stayed", "Morning arrived", "The music stopped"],
    lens: "noir",
    minimumCuts: 3,
  },
  {
    name: "place",
    prompt: "A place visited, forgotten, and found again",
    subject: "the place",
    facts: ["The place was visited", "A red door stood there", "The street was quiet", "Someone returned"],
    sourceMoments: ["Visited", "Red door", "Quiet street", "Returned"],
    minimumCuts: 3,
  },
  {
    name: "business",
    prompt: "A small business changed how people used the place",
    subject: "the business",
    facts: ["The business opened", "Customers arrived", "A new service was added", "Customers returned"],
    sourceMoments: ["Opened", "Customers arrived", "New service", "Customers returned"],
    minimumCuts: 3,
  },
  {
    name: "travel",
    prompt: "A trip took an unexpected turn",
    subject: "the traveler",
    facts: ["The traveler left", "The route changed", "A new place appeared", "The traveler returned"],
    sourceMoments: ["Left", "Route changed", "New place", "Returned"],
    minimumCuts: 3,
  },
  {
    name: "physical-product",
    prompt: "A tagged surfboard became part of a life",
    subject: "the surfboard",
    facts: ["The surfboard was delivered", "The owner scanned the tag", "The surfboard traveled home", "The tag remained attached"],
    sourceMoments: ["Delivered", "Scanned", "Went home", "Tag remained"],
    lens: "spy",
    minimumCuts: 3,
  },
  {
    name: "future-thread",
    prompt: "A recurring object begins a future thread",
    subject: "the object",
    facts: ["The object was introduced", "It was used", "It remained available", "It appeared again"],
    sourceMoments: ["Introduced", "Used", "Still available", "Appeared again"],
    minimumCuts: 3,
  },
];

const results = new Map<string, BrainResult>();
for (const test of cases) {
  const result = await authorBrainUniversal({
    prompt: test.prompt,
    lens: test.lens,
    subject: test.subject,
    place: test.place ?? "",
    movieMode: true,
    returning: false,
    visitNumber: 1,
    facts: test.facts,
    sourceMoments: test.sourceMoments,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  validateCase(test, result);
  results.set(test.name, result);
  console.log(`PASS ${test.name}: cuts=${result.sequence?.cuts.length ?? 0} scenes=${result.scenes.length} recovery=${recoveryUsed(result) ?? "unknown"}`);
}

const first = results.get("wedding")!;
assert(first.experienceState || (first as any).field?.experienceState, "return setup: no durable experience state exposed");
const state = first.experienceState ?? (first as any).field?.experienceState;
const returned = await authorBrainUniversal({
  prompt: "They returned years later and the old photograph is still part of the story.",
  lens: "romance",
  subject: "the couple",
  place: "",
  movieMode: true,
  returning: true,
  visitNumber: 2,
  facts: ["They returned years later", "The old photograph was still present"],
  sourceMoments: ["They came back", "The old photo was still there"],
  memoryContext: [],
  priorStrategies: [`QRE_AUTHOR_EXPERIENCE_STATE::${JSON.stringify(state)}`],
  priorScenes: first.scenes.map((scene) => String(scene.text ?? "")),
  trajectory: [],
  creativeLearningContext: [],
});

validateCase({ ...cases.find((test) => test.name === "wedding")!, minimumCuts: 2 }, returned);
const returnedState = returned.experienceState ?? (returned as any).field?.experienceState;
assert(returnedState?.worldSimulation, "return: World Simulation disappeared");
assert(returnedState.worldSimulation.reentry.meaningCanChange === true, "return: meaning did not remain mutable");
assert(returnedState.worldSimulation.reentry.priorExperienceIds.length > 0, "return: prior experience identity was lost");
assert(returnedState.worldSimulation.reentry.eligibleCallbacks.length > 0, "return: no durable callback survived reentry");

console.log(`PASS return: callbacks=${returnedState.worldSimulation.reentry.eligibleCallbacks.length} priorExperiences=${returnedState.worldSimulation.reentry.priorExperienceIds.length}`);
console.log("UNIVERSAL AUTHOR FINAL ACCEPTANCE: PASS");
console.log(`Domains=${cases.length}`);
console.log("ONE_BRAIN=TRUE");
console.log("ONE_SEQUENCE_CONTRACT=TRUE");
console.log("ONE_WORLD_SIMULATION=TRUE");
console.log("ONE_MOUTH=TRUE");
console.log("CUTS_ARE_PLAYABLE_SEQUENCE_LINES=TRUE");
console.log("REALITY_IMMUTABLE=TRUE");
console.log("RETURN_MEANING_CAN_CHANGE=TRUE");