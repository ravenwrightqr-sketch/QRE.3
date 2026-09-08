import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const facts = [
  "Coco arrived for a grooming appointment at 10 AM",
  "Coco hates the dryer",
  "The dryer had to be used after the bath",
  "Coco stole an apple from the counter",
  "The apple was taken before the groom was finished",
  "Coco wore a red bow home",
  "Coco left after grooming was completed",
  "The red bow was still on when Coco left",
];

const prompt =
  "Create a compelling moving-text film from the supplied reality. Do not explain the interpretation.";

const lenses = ["NONE", "ACTION", "HORROR", "ROMANCE"];

const INTERNAL =
  /\b(?:cognition|planner|candidate|trajectory|compiler|realizer|semantic turn|latent movie|creative opportunity|evidence id)\b/i;

const EXPLANATION =
  /\b(?:this means|which means|the point is|the meaning is|in other words|this shows|which shows|because this)\b/i;

const GENERIC =
  /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|worth noticing|it was meaningful|it was special)\.?$/i;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function fail(message: string): never {
  throw new Error(`AUTHOR LENS ACCEPTANCE FAILED: ${message}`);
}

const outputs: Array<{
  lens: string;
  film: string[];
  normalized: string;
}> = [];

for (const lens of lenses) {
  const result = await authorBrainCanonical({
    prompt,
    subject: "Coco",
    facts,
    sourceMoments: facts,
    memoryContext: [],
    creativeLearningContext: [],
    returning: false,
    lens,
  });

  const film = result.scenes.map((scene) => scene.text);
  const normalized = normalize(film.join(" "));

  console.log(`\n================ ${lens} ================`);
  console.log(`Resolved lens: ${result.brief.angle}`);
  console.log(`Model: ${result.diagnostics.model}`);
  console.log(`Renderable: ${result.diagnostics.renderable}`);
  console.log(`Complete: ${result.diagnostics.complete}`);
  console.log(`Cuts: ${film.length}`);
  console.log("\nFILM");

  if (!film.length) {
    console.log("<NO FILM>");
  } else {
    film.forEach((text, index) => {
      console.log(`${index + 1}. ${text}`);
    });
  }

  console.log("\nPROVENANCE");
  result.sequence.cuts.forEach((cut) => {
    console.log(`${cut.order}: ${cut.sourceIds.join(", ")}`);
  });

  if (!result.movie) {
    fail(`${lens}: no selected movie metadata`);
  }

  if (!result.diagnostics.renderable || !result.diagnostics.complete) {
    fail(`${lens}: result is not renderable/complete`);
  }

  if (!result.sequence.cuts.length) {
    fail(`${lens}: empty sequence`);
  }

  if (
    result.sequence.cuts.some(
      (cut) => cut.sourceIds.length === 0,
    )
  ) {
    fail(`${lens}: provenance lost`);
  }

  if (result.diagnostics.model === "fallback") {
    fail(`${lens}: local model realization unavailable`);
  }

  if (
    film.some(
      (text) =>
        INTERNAL.test(text) ||
        EXPLANATION.test(text) ||
        GENERIC.test(text),
    )
  ) {
    fail(`${lens}: forbidden visible language`);
  }

  outputs.push({
    lens,
    film,
    normalized,
  });
}

const uniqueFilms = new Set(
  outputs.map((item) => item.normalized),
);

console.log("\n============================================================");
console.log(
  `UNIQUE FILMS: ${uniqueFilms.size}/${outputs.length}`,
);

if (uniqueFilms.size < 3) {
  fail(
    `lens collapse: only ${uniqueFilms.size}/${outputs.length} materially different films`,
  );
}

console.log("AUTHOR LENS ACCEPTANCE: PASS");