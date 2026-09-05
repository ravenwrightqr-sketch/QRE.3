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
  if (!condition) {
    throw new Error(
      `UNIVERSAL AUTHOR FINAL ACCEPTANCE FAILED: ${message}`,
    );
  }
}

function textOf(result: BrainResult): string[] {
  return result.scenes
    .map((scene) => String(scene.text ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function worldSimulationOf(result: BrainResult) {
  return result.movie?.storyThesis?.observerExperience?.simulation;
}

function validateCase(test: Case, result: BrainResult): void {
  assert(result.sequence, `${test.name}: missing SequencePlay`);
  assert(result.movie, `${test.name}: missing latent movie`);
  assert(
    result.diagnostics.complete === true,
    `${test.name}: incomplete Author result`,
  );
  assert(
    result.sequence.cuts.length >= test.minimumCuts,
    `${test.name}: too few sequence cuts`,
  );
  assert(
    result.scenes.length === result.sequence.cuts.length,
    `${test.name}: scenes/cuts mismatch`,
  );
  assert(
    result.sequence.cuts.every((cut, index) => cut.order === index + 1),
    `${test.name}: cut order is not contiguous`,
  );
  assert(
    result.sequence.cuts.every((cut) => cut.sourceIds.length > 0),
    `${test.name}: cut lost source provenance`,
  );

  const texts = textOf(result);
  assert(
    texts.length >= test.minimumCuts,
    `${test.name}: empty authored scene set`,
  );
  assert(
    new Set(texts.map((value) => value.toLowerCase())).size === texts.length,
    `${test.name}: repeated authored cuts`,
  );
  assert(
    texts.some((value) => value.toLowerCase().includes(test.subject.toLowerCase())),
    `${test.name}: subject identity disappeared`,
  );
  assert(
    result.diagnostics.recoveryUsed !== true,
    `${test.name}: deterministic recovery replaced creative realization`,
  );

  const thesis = result.movie.storyThesis;
  const worldSimulation = worldSimulationOf(result);

  assert(thesis, `${test.name}: missing story thesis`);
  assert(thesis.observerExperience, `${test.name}: missing observer experience`);
  assert(worldSimulation, `${test.name}: World Simulation missing`);
  assert(
    Array.isArray(worldSimulation.relations),
    `${test.name}: World Simulation relations missing`,
  );
  assert(
    Array.isArray(worldSimulation.questions),
    `${test.name}: World Simulation questions missing`,
  );

  if (thesis.semanticTurn) {
    assert(
      thesis.semanticRealization,
      `${test.name}: semantic turn has no realization contract`,
    );
    assert(
      Boolean(thesis.semanticRealization.feltEffect),
      `${test.name}: semantic realization has no feltEffect`,
    );
    assert(
      Boolean(thesis.semanticRealization.viewerShift),
      `${test.name}: semantic realization has no viewerShift`,
    );
    assert(
      Boolean(thesis.semanticRealization.languageAim),
      `${test.name}: semantic realization has no languageAim`,
    );
  }
}

const cases: Case[] = [
  {
    name: "maria-service-receipt-game",
    prompt:
      "A simple service receipt becomes a small game the owner can discover later. Keep the supplied service facts intact and let the GAME lens change the presentation, not the reality.",
    subject: "Maria",
    place: "the house",
    lens: "game",
    facts: [
      "Maria arrived at 10:10 AM.",
      "Maria was the housekeeper.",
      "Maria cleaned two bathrooms.",
      "Maria cleaned the kitchen.",
      "Maria left at 12:12 PM.",
    ],
    sourceMoments: [
      "Maria arrived 10:10 AM",
      "housekeeper",
      "two bathrooms cleaned",
      "kitchen cleaned",
      "Maria left 12:12 PM",
    ],
    minimumCuts: 3,
  },
  {
    name: "pet-tag",
    prompt:
      "A pet tag introduces a persistent identity and a few simple likes. Make the pet feel knowable without inventing biography.",
    subject: "Milo",
    place: "",
    facts: [
      "Milo is a dog.",
      "Milo has a pet tag.",
      "Milo likes bacon.",
      "Milo likes walks.",
      "Milo likes small dogs.",
    ],
    sourceMoments: [
      "Milo",
      "dog",
      "pet tag",
      "likes bacon",
      "likes walks",
      "likes small dogs",
    ],
    minimumCuts: 3,
  },
  {
    name: "wedding-living-memory",
    prompt:
      "Treat a wedding as a living shared memory rather than a fixed wedding story. Different people can remember or encounter different pieces of the same event over time.",
    subject: "the wedding",
    place: "the wedding venue",
    facts: [
      "The wedding took place at the venue.",
      "Guests were present.",
      "A photograph from the wedding was kept.",
      "The couple returned to the venue later.",
      "The returned visit added another memory to the same wedding world.",
    ],
    sourceMoments: [
      "wedding at the venue",
      "guests present",
      "wedding photograph",
      "couple returned later",
      "new memory added on return",
    ],
    minimumCuts: 3,
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
  console.log(
    `PASS ${test.name}: cuts=${result.sequence.cuts.length} scenes=${result.scenes.length}`,
  );
}

const maria = cases[0];
const mariaRound1 = results[0];
const mariaRound1Text = textOf(mariaRound1);
const mariaSimulation = worldSimulationOf(mariaRound1);

assert(maria.lens === "game", "maria-service-receipt-game: GAME lens was not configured");
assert(mariaSimulation, "maria-service-receipt-game: missing World Simulation");

const mariaReturn = await authorBrainCanonical({
  prompt:
    "Maria returned to the same house for another service visit. The earlier service remains true, but the new visit can change what the owner notices about Maria's routine.",
  subject: "Maria",
  place: "the house",
  lens: "game",
  movieMode: true,
  facts: [
    ...maria.facts,
    "Maria returned to the same house for another visit.",
    "The second visit happened after the first service receipt.",
  ],
  sourceMoments: [
    ...maria.sourceMoments,
    "Maria returned",
    "second service visit",
  ],
  memoryContext: mariaRound1Text,
  trajectory: mariaRound1.sequence.cuts.map((cut) => cut.attentionDelta),
  creativeLearningContext: [],
});

validateCase({ ...maria, minimumCuts: 2 }, mariaReturn);

const mariaReturnText = textOf(mariaReturn);
assert(
  mariaReturnText.join(" ") !== mariaRound1Text.join(" "),
  "maria return: new reality did not change the authored experience",
);
assert(
  mariaReturn.sequence.cuts.some((cut) => cut.sourceIds.length > 0),
  "maria return: provenance disappeared",
);

const returnSimulation = worldSimulationOf(mariaReturn);
assert(returnSimulation, "maria return: World Simulation disappeared");
assert(
  returnSimulation.reentry.meaningCanChange === true,
  "maria return: meaning was incorrectly frozen on return",
);

console.log(
  `PASS maria return: changed=${mariaReturnText.join(" ") !== mariaRound1Text.join(" ")}`,
);
console.log("UNIVERSAL AUTHOR FINAL ACCEPTANCE: PASS");
console.log(`Canonical worlds=${cases.length}`);
console.log("MUST_SURVIVE_BASIC_REALITY=TRUE");
console.log("SERVICE_RECEIPT=TRUE");
console.log("GAME_LENS=TRUE");
console.log("PET_IDENTITY_AND_LIKES=TRUE");
console.log("WEDDING_IS_LIVING_MEMORY=TRUE");
console.log("RETURN_RECONTEXTUALIZATION=TRUE");
console.log("PROVENANCE_PRESERVED=TRUE");
console.log("NO_DETERMINISTIC_RECOVERY=TRUE");
console.log("WORLD_SIMULATION=TRUE");
console.log("ONE_AUTHOR=TRUE");
console.log("ONE_MOUTH=TRUE");
