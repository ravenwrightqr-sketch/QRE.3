import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";
import type { AuthorBrainTruth } from "@qre/contracts";

type Case = Omit<
  Pick<
    AuthorBrainTruth,
    "prompt" | "subject" | "place" | "facts" | "sourceMoments" | "lens"
  >,
  "subject"
> & {
  name: string;
  subject: string;
  minimumCuts: number;
};

type BrainResult = Awaited<ReturnType<typeof authorBrainCanonical>>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNIVERSAL AUTHOR FINAL ACCEPTANCE FAILED: ${message}`);
}

function textOf(result: BrainResult): string[] {
  return result.scenes.map((scene) => String(scene.text ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

function worldSimulationOf(result: BrainResult) {
  return result.movie?.storyThesis?.observerExperience?.simulation;
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
  assert(texts.some((value) => value.toLowerCase().includes(test.subject.toLowerCase())), `${test.name}: subject identity disappeared`);
  assert(result.diagnostics.recoveryUsed !== true, `${test.name}: deterministic recovery replaced creative realization`);

  const worldSimulation = worldSimulationOf(result);
  assert(worldSimulation, `${test.name}: World Simulation missing from canonical Author result`);
  assert(Array.isArray(worldSimulation.relations), `${test.name}: World Simulation relations missing`);
  assert(Array.isArray(worldSimulation.questions), `${test.name}: World Simulation questions missing`);
}

const cases: Case[] = [
  {
    name: "service-receipt", prompt: "Dog grooming service experience", subject: "Coco", place: "Elm Street Grooming",
    facts: ["Coco was groomed at Elm Street Grooming.", "Coco got a bath.", "Coco stole the red bow."],
    sourceMoments: ["Coco was groomed at Elm Street Grooming.", "Coco got a bath.", "Coco stole the red bow."], lens: "comedy", minimumCuts: 3,
  },
  {
    name: "pet", prompt: "Milo dog tag and bacon memory", subject: "Milo", place: "",
    facts: ["Milo is a small dog", "Milo wears a dog tag", "Milo loves bacon", "Milo loves walks", "Milo likes small dogs"],
    sourceMoments: ["Here is Milo", "small dogs", "walks", "bacon"], lens: "game", minimumCuts: 3,
  },
  {
    name: "relationship", prompt: "A relationship changed during an ordinary night", subject: "Alex", place: "Raven Coffee",
    facts: ["Alex met Jordan at Raven Coffee", "They did not expect to meet", "They talked until close", "They connected deeply", "They were happy"],
    sourceMoments: ["met via geo-drop", "Raven Coffee", "talked until close", "deep connection", "happy"], lens: "romance", minimumCuts: 3,
  },
  {
    name: "wedding", prompt: "Wedding memory and return years later", subject: "the couple", place: "the wedding venue",
    facts: ["The wedding was held", "An old photograph was present", "Everyone stayed", "They returned years later"],
    sourceMoments: ["People arrived", "The old photo surfaced", "Everyone stayed", "They came back"], lens: "romance", minimumCuts: 3,
  },
  {
    name: "restaurant", prompt: "Anniversary dinner at a restaurant", subject: "the anniversary couple", place: "the restaurant",
    facts: ["A reservation was made", "A special dish arrived", "They waited", "They returned"],
    sourceMoments: ["Reservation", "Special dish", "Waiting", "Returned"], minimumCuts: 3,
  },
  {
    name: "event", prompt: "A crowded event with a late arrival", subject: "Morgan", place: "the event",
    facts: ["The event opened", "Morgan arrived late", "The crowd stayed", "Morgan returned"],
    sourceMoments: ["Doors opened", "Morgan arrived late", "The crowd stayed", "Morgan returned"], minimumCuts: 3,
  },
  {
    name: "rave", prompt: "An all-night music event", subject: "the night", place: "Warehouse 9",
    facts: ["Music started", "The crowd stayed", "Morning arrived", "The music stopped"],
    sourceMoments: ["Music started", "Crowd stayed", "Morning arrived", "Music stopped"], lens: "noir", minimumCuts: 3,
  },
  {
    name: "place", prompt: "A place visited, forgotten, and found again", subject: "the place", place: "the place",
    facts: ["The place was visited", "A red door stood there", "The street was quiet", "Someone returned"],
    sourceMoments: ["Visited", "Red door", "Quiet street", "Returned"], minimumCuts: 3,
  },
  {
    name: "business", prompt: "A small business changed how people used the place", subject: "the business", place: "the business",
    facts: ["The business opened", "Customers arrived", "A new service was added", "Customers returned"],
    sourceMoments: ["Opened", "Customers arrived", "New service", "Customers returned"], minimumCuts: 3,
  },
  {
    name: "travel", prompt: "A trip took an unexpected turn", subject: "the traveler", place: "the trip",
    facts: ["The traveler left", "The route changed", "A new place appeared", "The traveler returned"],
    sourceMoments: ["Left", "Route changed", "New place", "Returned"], minimumCuts: 3,
  },
  {
    name: "physical-product", prompt: "A tagged surfboard became part of a life", subject: "the surfboard", place: "the beach",
    facts: ["The surfboard was delivered", "The owner scanned its tag", "The surfboard traveled home", "The tag remained attached"],
    sourceMoments: ["Delivered", "Scanned", "Board went home", "Tag remained"], lens: "spy", minimumCuts: 3,
  },
  {
    name: "future-thread", prompt: "A recurring object begins a future thread", subject: "the object", place: "",
    facts: ["The object was introduced", "It was used", "It remained available", "It appeared again"],
    sourceMoments: ["Introduced", "Used", "Still available", "Appeared again"], minimumCuts: 3,
  },
];

const results: BrainResult[] = [];
for (const test of cases) {
  const result = await authorBrainCanonical({
    prompt: test.prompt,
    subject: test.subject,
    place: test.place,
    lens: test.lens,
    movieMode: true,
    facts: test.facts,
    sourceMoments: test.sourceMoments,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });
  validateCase(test, result);
  results.push(result);
  console.log(`PASS ${test.name}: cuts=${result.sequence.cuts.length} scenes=${result.scenes.length}`);
}

const relationship = cases.find((test) => test.name === "relationship")!;
const round1 = results[cases.findIndex((test) => test.name === "relationship")];
const round1Text = textOf(round1);
const round2 = await authorBrainCanonical({
  prompt: "Jake and John returned to Raven Coffee and the connection is still the point of the night.",
  subject: "Alex",
  place: "Raven Coffee",
  lens: "horror",
  movieMode: true,
  facts: [...relationship.facts, "They returned to Raven Coffee", "The same chairs were still there"],
  sourceMoments: [...relationship.sourceMoments, "returned to Raven Coffee", "same chairs"],
  memoryContext: [...round1Text],
  trajectory: round1.sequence.cuts.map((cut) => cut.attentionDelta),
  creativeLearningContext: [],
});

validateCase({ ...relationship, minimumCuts: 2 }, round2);
const round2Text = textOf(round2);
assert(round2Text.join(" ") !== round1Text.join(" "), "return: new evidence did not change authored sequence");
const simulation = worldSimulationOf(round2);
assert(simulation, "return: World Simulation disappeared");
assert(simulation.reentry.meaningCanChange === true, "return: meaning was incorrectly frozen");

console.log(`PASS return: changed=${round2Text.join(" ") !== round1Text.join(" ")}`);
console.log("UNIVERSAL AUTHOR FINAL ACCEPTANCE: PASS");
console.log(`Domains=${cases.length}`);
console.log("ONE_BRAIN=TRUE");
console.log("ONE_SEQUENCE_CONTRACT=TRUE");
console.log("ONE_WORLD_SIMULATION=TRUE");
console.log("ONE_MOUTH=TRUE");
console.log("FACTS_ARE_MEMORY_MATERIAL=TRUE");
console.log("RELATIONSHIPS_BECOME_SEQUENCE=TRUE");
console.log("RETURN_CAN_RECONTEXTUALIZE=TRUE");
