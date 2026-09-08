/*
 * QRE UNIVERSAL LENS / ARTIST ACCEPTANCE
 *
 * Same sparse first-time business reality. No memory. No prior scenes.
 *
 * This test deliberately uses the canonical Author path so the lens is not
 * tested as an isolated prompt helper:
 *
 * RealityGraph -> Readout -> CreativeSpine -> Cognition/Artist -> Movie
 * -> Creative Realizer -> SequencePlay / AuthorScene
 *
 * PASS means:
 * - AUTO lets the Artist choose a treatment without a preselected lens.
 * - Explicit lens runs reach the canonical Artist/Creative Realizer path.
 * - All variants preserve the same supplied reality/provenance boundary.
 * - The result remains an actual sequence-film, not a receipt-shaped readout.
 *
 * This is an experiment harness, not an assertion that any one lens is
 * universally best for housekeeping. The interesting result is what the
 * Artist selects for AUTO and how materially the same truth changes under
 * the explicit lens treatments.
 */
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

const BASE = {
  prompt: "Housekeeping service receipt",
  subject: "Maria",
  place: "Client service address",
  facts: [
    "Maria arrived at 10:10 AM",
    "Maria cleaned two bathrooms",
    "Maria cleaned the kitchen",
    "Maria left at 1:00 PM",
    "a geo drop was recorded",
    "photos were captured for each room",
  ],
  sourceMoments: [
    "arrived at 10:10 AM",
    "cleaned two bathrooms",
    "cleaned the kitchen",
    "left at 1:00 PM",
    "geo drop",
    "photos of each room",
  ],
  memoryContext: [] as string[],
  trajectory: [] as string[],
  creativeLearningContext: [] as string[],
  returning: false,
  visitNumber: 1,
  movieMode: true,
};

const LENSES = [
  "game",
  "military",
  "spy",
  "heist",
  "fierce",
  "deadpan",
  "comedy",
  "documentary",
] as const;

const FORBIDDEN_INVENTION = [
  /customer watched/i,
  /client watched/i,
  /owner watched/i,
  /Maria fought/i,
  /Maria attacked/i,
  /Maria was attacked/i,
  /enemy/i,
  /weapon/i,
  /police/i,
  /gun/i,
  /explosion/i,
  /boss arrived/i,
  /manager arrived/i,
  /employee cheered/i,
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function outputText(result: Awaited<ReturnType<typeof authorBrainCanonical>>): string {
  return result.scenes.map((scene) => clean(scene.text)).filter(Boolean).join(" ");
}

function printResult(
  name: string,
  lens: string | undefined,
  result: Awaited<ReturnType<typeof authorBrainCanonical>>,
): void {
  console.log(`\n=== ${name} ===`);
  console.log(`INPUT LENS: ${lens ?? "AUTO"}`);
  console.log(`ARTIST ANGLE: ${result.brief.angle}`);
  console.log(`MOVIE: ${result.movie?.id ?? "none"}`);
  console.log(`MODE: ${result.realizationMode}`);
  console.log(`MODEL: ${result.diagnostics.model}`);
  console.log(`CALLS: ${result.diagnostics.modelCalls}`);
  console.log(`CANDIDATES: ${result.diagnostics.candidateSequences}`);
  result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${clean(scene.text)}`));
}

async function assertCanonicalResult(
  name: string,
  result: Awaited<ReturnType<typeof authorBrainCanonical>>,
): Promise<void> {
  assert.equal(result.diagnostics.qualityStatus, "ACCEPTED", `${name}: Author rejected the reality`);
  assert.equal(result.diagnostics.renderable, true, `${name}: result is not renderable`);
  assert.equal(result.diagnostics.complete, true, `${name}: result is incomplete`);
  assert.ok(result.movie, `${name}: no Movie selected`);
  assert.equal(result.sequence.cuts.length, result.scenes.length, `${name}: SequencePlay diverged from scenes`);
  assert.ok(result.scenes.length >= 2, `${name}: boring input collapsed to a non-film`);
  assert.ok(result.scenes.length <= 12, `${name}: sequence exploded beyond bounded experience`);

  const text = outputText(result);

  for (const pattern of FORBIDDEN_INVENTION) {
    assert.doesNotMatch(text, pattern, `${name}: invented concrete event ${pattern}`);
  }

  for (const fact of [
    "10:10",
    "1:00",
    "bathroom",
    "kitchen",
  ]) {
    assert.match(text, new RegExp(fact, "i"), `${name}: grounded signal missing: ${fact}`);
  }

  for (const cut of result.sequence.cuts) {
    assert.ok(cut.sourceIds.length > 0, `${name}: cut ${cut.order} has no provenance`);
    assert.ok(
      cut.sourceIds.every((id) => result.world.events.some((event) => event.id === id)),
      `${name}: cut ${cut.order} contains unknown provenance id`,
    );
  }

  assert.doesNotMatch(
    text,
    /\b(?:cognition|planner|candidate|trajectory|viewer state|semantic turn|compiler|realizer|provenance|evidenceEventIds|Mouth|Author)\b/i,
    `${name}: internal architecture leaked into viewer-facing text`,
  );
}

// 1. TRUE FIRST-TIME BUSINESS USER: no lens supplied.
const auto = await authorBrainCanonical(BASE);
printResult("MARIA AUTO / FIRST VISIT", undefined, auto);
await assertCanonicalResult("MARIA AUTO / FIRST VISIT", auto);

assert.notEqual(
  clean(auto.brief.angle).toLowerCase(),
  "",
  "AUTO: Artist produced no creative angle",
);

// 2. Same exact reality, explicit lens treatments. These still travel through
// the canonical Author -> Creative Spine -> Realizer path. They are not direct
// calls to a lens prompt.
for (const lens of LENSES) {
  const result = await authorBrainCanonical({ ...BASE, lens });
  printResult(`MARIA / ${lens.toUpperCase()}`, lens, result);
  await assertCanonicalResult(`MARIA / ${lens.toUpperCase()}`, result);

  const angle = clean(result.brief.angle).toLowerCase();
  assert.ok(
    angle.includes(lens),
    `MARIA / ${lens.toUpperCase()}: explicit lens did not survive into the canonical creative angle: ${result.brief.angle}`,
  );
}

console.log("\nMARIA UNIVERSAL LENS / ARTIST ACCEPTANCE: PASS");
