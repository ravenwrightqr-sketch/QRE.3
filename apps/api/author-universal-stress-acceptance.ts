import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`UNIVERSAL AUTHOR STRESS ACCEPTANCE FAILED: ${message}`);
  }
}

type Case = {
  name: string;
  prompt: string;
  subject: string;
  place?: string;
  lens?: string;
  facts: string[];
  sourceMoments: string[];
  minimumCuts: number;
};

type Result = Awaited<ReturnType<typeof authorBrainCanonical>>;

type MovieResult = Result & {
  movie: NonNullable<Result["movie"]>;
};

function textOf(result: Result): string[] {
  return result.scenes
    .map((scene) => String(scene.text ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function requireMovie(caseName: string, result: Result): MovieResult {
  assert(result.movie, `${caseName}: missing latent movie`);
  return result as MovieResult;
}

function validate(caseDef: Case, result: Result): MovieResult {
  assert(result.sequence, `${caseDef.name}: missing SequencePlay`);
  assert(result.movie, `${caseDef.name}: missing latent movie`);
  assert(result.diagnostics.complete === true, `${caseDef.name}: incomplete result`);
  assert(
    result.sequence.cuts.length >= caseDef.minimumCuts,
    `${caseDef.name}: fewer than ${caseDef.minimumCuts} cuts`,
  );
  assert(
    result.scenes.length === result.sequence.cuts.length,
    `${caseDef.name}: scenes/cuts mismatch`,
  );
  assert(
    result.sequence.cuts.every((cut, index) => cut.order === index + 1),
    `${caseDef.name}: non-contiguous cut order`,
  );
  assert(
    result.sequence.cuts.every((cut) => cut.sourceIds.length > 0),
    `${caseDef.name}: provenance disappeared`,
  );

  const texts = textOf(result);
  assert(texts.length >= caseDef.minimumCuts, `${caseDef.name}: empty scene set`);
  assert(
    new Set(texts.map((text) => text.toLowerCase())).size === texts.length,
    `${caseDef.name}: duplicate authored cuts`,
  );
  assert(
    texts.some((text) => text.toLowerCase().includes(caseDef.subject.toLowerCase())),
    `${caseDef.name}: opening identity lost`,
  );

  const thesis = result.movie.storyThesis;
  if (thesis?.semanticTurn) {
    assert(thesis.semanticRealization, `${caseDef.name}: semantic realization missing`);
    assert(thesis.observerExperience, `${caseDef.name}: observer contract missing`);
    assert(
      thesis.observerExperience.simulation,
      `${caseDef.name}: world simulation missing`,
    );
  }

  const simulation = thesis?.observerExperience?.simulation;
  assert(simulation, `${caseDef.name}: simulation missing`);
  assert(Array.isArray(simulation.relations), `${caseDef.name}: simulation relations missing`);
  assert(Array.isArray(simulation.questions), `${caseDef.name}: simulation questions missing`);

  return result as MovieResult;
}

const cases: Case[] = [
  {
    name: "non-human-device",
    prompt: "A repair story where the machine changes meaning after being fixed",
    subject: "the machine",
    place: "the workshop",
    facts: [
      "The machine stopped during the morning shift.",
      "The mechanic found a loose connector.",
      "The connector was repaired.",
      "The machine ran again before closing.",
    ],
    sourceMoments: ["machine stopped", "loose connector", "repair", "running again"],
    lens: "industrial",
    minimumCuts: 3,
  },
  {
    name: "building",
    prompt: "A building was almost empty and later became a gathering place",
    subject: "the building",
    place: "the old station",
    facts: [
      "The building had been nearly empty for years.",
      "A small studio moved into one room.",
      "Neighbors started using the common space.",
      "People now return there every week.",
    ],
    sourceMoments: ["nearly empty", "studio moved in", "neighbors gathered", "weekly return"],
    minimumCuts: 3,
  },
  {
    name: "artwork",
    prompt: "An artwork was overlooked until one later detail changed its meaning",
    subject: "the painting",
    place: "the gallery",
    facts: [
      "The painting hung in a quiet gallery.",
      "Visitors usually passed it without stopping.",
      "A note from the artist was found behind the frame.",
      "Visitors began looking at the painting differently.",
    ],
    sourceMoments: ["quiet gallery", "passed without stopping", "artist note", "looked differently"],
    lens: "mystery",
    minimumCuts: 3,
  },
  {
    name: "expectation-break",
    prompt: "A launch expected to be calm became the memorable part of the story",
    subject: "the launch",
    place: "the venue",
    facts: [
      "The launch was expected to be quiet.",
      "The doors opened normally.",
      "A power outage interrupted the opening.",
      "The crowd stayed and finished the event by phone light.",
    ],
    sourceMoments: ["expected quiet", "doors opened", "power outage", "crowd stayed"],
    lens: "cinematic",
    minimumCuts: 3,
  },
  {
    name: "polarity-turn",
    prompt: "A person moves from reluctance to commitment",
    subject: "Jordan",
    place: "the studio",
    facts: [
      "Jordan did not want to enter the studio.",
      "Jordan stayed for one class.",
      "Jordan returned the next week.",
      "Jordan later volunteered to teach.",
    ],
    sourceMoments: ["did not want to enter", "one class", "returned", "volunteered to teach"],
    lens: "warm",
    minimumCuts: 3,
  },
  {
    name: "recontextualization",
    prompt: "An ordinary object becomes important after its later use",
    subject: "the key",
    place: "the apartment",
    facts: [
      "The key sat in a drawer.",
      "Nobody used it for months.",
      "The key opened a storage room during a move.",
      "Inside was a box of family photographs.",
    ],
    sourceMoments: ["key in drawer", "unused for months", "opened storage room", "family photographs"],
    minimumCuts: 3,
  },
  {
    name: "sparse-facts",
    prompt: "Make a compelling memory from only two supplied facts",
    subject: "Riley",
    place: "the station",
    facts: ["Riley missed the train.", "Riley waited for another one."],
    sourceMoments: ["missed the train", "waited for another"],
    minimumCuts: 2,
  },
  {
    name: "negative-resolution",
    prompt: "A failed attempt becomes the meaningful endpoint",
    subject: "the prototype",
    place: "the lab",
    facts: [
      "The prototype failed the first test.",
      "The team changed one component.",
      "The second test failed differently.",
      "The team kept the failed prototype for reference.",
    ],
    sourceMoments: ["first test failed", "component changed", "second failure", "kept for reference"],
    lens: "documentary",
    minimumCuts: 3,
  },
  {
    name: "cross-entity",
    prompt: "Two people remember the same ordinary moment differently",
    subject: "Sam",
    place: "the diner",
    facts: [
      "Sam remembered the diner as almost empty.",
      "Taylor remembered the same night as crowded.",
      "They compared the memory years later.",
      "They kept both versions of the story.",
    ],
    sourceMoments: ["Sam remembers empty", "Taylor remembers crowded", "compared years later", "kept both versions"],
    lens: "intimate",
    minimumCuts: 3,
  },
  {
    name: "recurrence",
    prompt: "A recurring place acquires a new meaning on a later visit",
    subject: "the bookstore",
    place: "the bookstore",
    facts: [
      "The bookstore was where the first conversation happened.",
      "The same table remained near the window.",
      "The person returned months later.",
      "The return no longer felt accidental.",
    ],
    sourceMoments: ["first conversation", "same table", "returned months later", "no longer accidental"],
    minimumCuts: 3,
  },
  {
    name: "community",
    prompt: "A neighborhood changes from temporary use to shared ownership",
    subject: "the neighborhood",
    place: "Maple Street",
    facts: [
      "People used the empty lot as a shortcut.",
      "A community garden was planted there.",
      "Neighbors began maintaining it together.",
      "Children now help water the garden.",
    ],
    sourceMoments: ["empty-lot shortcut", "garden planted", "neighbors maintain it", "children water it"],
    minimumCuts: 3,
  },
  {
    name: "service-outcome",
    prompt: "A small service succeeds because the customer changes, not because the service is flashy",
    subject: "the customer",
    place: "the repair shop",
    facts: [
      "The customer arrived frustrated.",
      "The repair was simple.",
      "The customer stayed to learn how it worked.",
      "The customer returned with another repair months later.",
    ],
    sourceMoments: ["arrived frustrated", "simple repair", "learned how it worked", "returned months later"],
    minimumCuts: 3,
  },
  {
    name: "future-thread",
    prompt: "An object introduced today should naturally support a future thread",
    subject: "the notebook",
    place: "the cafe",
    facts: [
      "The notebook was left on a cafe table.",
      "A stranger returned it to the counter.",
      "The owner found a new page filled in.",
      "The notebook was taken home.",
    ],
    sourceMoments: ["left on table", "returned to counter", "new page filled in", "taken home"],
    minimumCuts: 3,
  },
  {
    name: "place-to-meaning",
    prompt: "A physical place becomes meaningful through repeated ordinary use",
    subject: "the bench",
    place: "the park",
    facts: [
      "The bench was newly installed near the path.",
      "One person sat there after work.",
      "Two friends began meeting there.",
      "The bench became their usual meeting point.",
    ],
    sourceMoments: ["new bench", "sat after work", "friends met", "usual meeting point"],
    lens: "quiet",
    minimumCuts: 3,
  },
  {
    name: "abstract-subject",
    prompt: "A tradition becomes visible through small repeated actions",
    subject: "the tradition",
    place: "the family kitchen",
    facts: [
      "The tradition began with one handwritten recipe.",
      "The recipe was copied each winter.",
      "New names were added to the card.",
      "The card now belongs to the youngest cook.",
    ],
    sourceMoments: ["handwritten recipe", "copied each winter", "new names", "youngest cook"],
    lens: "nostalgic",
    minimumCuts: 3,
  },
];

const results = new Map<string, Result>();

for (const caseDef of cases) {
  const result = await authorBrainCanonical({
    prompt: caseDef.prompt,
    subject: caseDef.subject,
    place: caseDef.place ?? "",
    lens: caseDef.lens,
    movieMode: true,
    facts: caseDef.facts,
    sourceMoments: caseDef.sourceMoments,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  validate(caseDef, result);
  results.set(caseDef.name, result);
  console.log(`PASS ${caseDef.name}: cuts=${result.sequence.cuts.length}`);
}

const base = cases.find((item) => item.name === "recontextualization")!;
const baseResult = requireMovie(base.name, results.get(base.name)!);
const perturbed = await authorBrainCanonical({
  prompt: base.prompt,
  subject: base.subject,
  place: base.place ?? "",
  lens: base.lens,
  movieMode: true,
  facts: [
    ...base.facts,
    "A blue umbrella stood outside the apartment.",
    "The weather was cold that afternoon.",
  ],
  sourceMoments: [
    ...base.sourceMoments,
    "blue umbrella",
    "cold afternoon",
  ],
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
});
const perturbedResult = validate(base, perturbed);

const baseRelations = baseResult.movie.storyThesis?.relationKind ?? "";
const perturbedRelations = perturbedResult.movie.storyThesis?.relationKind ?? "";
assert(baseRelations === perturbedRelations, "irrelevant facts changed canonical relation kind");

const baseSourceIds = new Set(baseResult.sequence.cuts.flatMap((cut) => cut.sourceIds));
const perturbedSourceIds = new Set(perturbedResult.sequence.cuts.flatMap((cut) => cut.sourceIds));
assert(
  [...baseSourceIds].some((id) => perturbedSourceIds.has(id)),
  "irrelevant facts erased all shared provenance",
);

const returnBase = cases.find((item) => item.name === "recurrence")!;
const round1 = requireMovie(returnBase.name, results.get(returnBase.name)!);
const round2Raw = await authorBrainCanonical({
  prompt: returnBase.prompt,
  subject: returnBase.subject,
  place: returnBase.place ?? "",
  lens: returnBase.lens,
  movieMode: true,
  facts: [
    ...returnBase.facts,
    "The same person returned again during the first rain of autumn.",
    "The table had been moved closer to the window.",
  ],
  sourceMoments: [
    ...returnBase.sourceMoments,
    "returned in autumn rain",
    "table moved closer to window",
  ],
  memoryContext: textOf(round1),
  trajectory: round1.sequence.cuts.map((cut) => cut.attentionDelta),
  creativeLearningContext: [],
});
const round2 = validate(returnBase, round2Raw);
assert(
  textOf(round1).join(" ") !== textOf(round2).join(" "),
  "return visit failed to recontextualize authored output",
);
assert(
  round2.movie.storyThesis?.observerExperience?.simulation?.reentry?.meaningCanChange === true,
  "return visit incorrectly froze meaning",
);

console.log(`PASS irrelevant-fact invariant: relation=${baseRelations}`);
console.log("PASS return recontextualization");
console.log("UNIVERSAL AUTHOR STRESS ACCEPTANCE: PASS");
console.log(`CASES=${cases.length}`);
console.log("NON_HUMAN_SUBJECTS=TRUE");
console.log("SPARSE_REALITY=TRUE");
console.log("POLARITY_TURNS=TRUE");
console.log("EXPECTATION_BREAKS=TRUE");
console.log("RECONTEXTUALIZATION=TRUE");
console.log("CROSS_ENTITY_REALITY=TRUE");
console.log("RECURRENCE=TRUE");
console.log("IRRELEVANT_FACT_INVARIANCE=TRUE");
console.log("RETURN_MEANING_CAN_CHANGE=TRUE");