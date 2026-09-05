/*
 * QRE AUTHOR READOUT + SEMANTIC GATE ACCEPTANCE
 *
 * Readout is factual and boring by design.
 * Author/Mouth are downstream creative systems.
 * This suite exists to prevent "rendered" from being mistaken for "good".
 */
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";
import { evaluateLatentMovie } from "./src/services/authorSemanticGate.js";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function factualReadout(result: Awaited<ReturnType<typeof authorBrainCanonical>>): string {
  return result.world.events.map((event) => {
    const parts = [event.time, event.label, event.place].map(clean).filter(Boolean);
    return parts.join(" — ");
  }).join("\n");
}

const cases = [
  {
    name: "CAT WATCHES HOUSEKEEPER",
    prompt: "Maria cleaned the kitchen, felt watched, cleaned one bathroom, and then the cat appeared. Maria knew the cat was watching her.",
    subject: "Maria",
    facts: [
      "Maria cleaned the kitchen",
      "Maria felt watched",
      "Maria cleaned one bathroom",
      "a cat appeared",
      "Maria knew the cat was watching her",
    ],
  },
  {
    name: "RESTAURANT STRANGE BUT ROMANTIC",
    prompt: "The restaurant was closed. The lights were off. Chairs were on the ceiling. Alex and Sam were together.",
    subject: "Alex + Sam",
    lens: "ROMANCE",
    facts: [
      "the restaurant was closed",
      "the lights were off",
      "chairs were on the ceiling",
      "Alex and Sam were together",
    ],
  },
  {
    name: "PAUL MEMORY",
    prompt: "Paul loved old records, kept every birthday card, played the same song every Sunday, and is gone.",
    subject: "Paul",
    facts: [
      "Paul loved old records",
      "Paul kept every birthday card",
      "Paul played the same song every Sunday",
      "Paul is gone",
    ],
  },
];

for (const testCase of cases) {
  const result = await authorBrainCanonical({
    prompt: testCase.prompt,
    subject: testCase.subject,
    lens: testCase.lens,
    facts: testCase.facts,
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  const readout = factualReadout(result);
  console.log(`\n=== ${testCase.name} ===`);
  console.log("READOUT:");
  console.log(readout);
  console.log(`FRAME: ${result.brief.angle}`);
  console.log(`MOVIE: ${result.movie?.id ?? "none"}`);

  assert.ok(readout.length > 0, "Readout must contain supplied reality");
  assert.doesNotMatch(readout, /\b(?:mission|boss|speedrun|movie|story|plot|journey|the audience|the viewer|interesting|meaningful)\b/i, "Readout leaked creative interpretation");
  assert.ok(result.movie, "Cognition must produce a Movie for concrete supplied reality");

  const semantic = evaluateLatentMovie(result.movie!, result.world);
  console.log(`SEMANTIC SCORE: ${semantic.score}`);
  console.log(`SEMANTIC SIGNALS: ${JSON.stringify(semantic.signals)}`);
  semantic.reasons.forEach((reason) => console.log(`REJECT: ${reason}`));
  assert.equal(semantic.accepted, true, `latent Movie failed semantic gate: ${semantic.reasons.join("; ")}`);
}

console.log("\nAUTHOR READOUT + SEMANTIC GATE: COMPLETE");
