/*
 * QRE EXPERIENTIAL COMPRESSION — UNIVERSAL HUMAN-EYE PROBE
 *
 * North star:
 *   reality accumulates
 *   cognition expands meaning
 *   sequence accumulates perception
 *   visible language compresses expression
 *
 * This harness deliberately does NOT hardcode a target sentence.
 * Run one case at a time with:
 *   $env:QRE_AUTHOR_CASE="relationship"
 *   $env:QRE_AUTHOR_CASE="milo"
 *   $env:QRE_AUTHOR_CASE="housekeeping"
 */
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type CaseName = "relationship" | "milo" | "housekeeping";

const CASES: Record<CaseName, Parameters<typeof authorBrainCanonical>[0]> = {
  relationship: {
    prompt: "Create the living relationship memory experience from the supplied reality.",
    subject: "Alex",
    facts: [
      "Met Alex",
      "Felt nervous before meeting",
      "Kept talking for two hours",
      "Felt lighter afterward",
      "Met Alex again a week later",
    ],
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
    returning: true,
    visitNumber: 2,
    movieMode: true,
  },
  milo: {
    prompt: "Create Milo's current experience from the supplied character reality.",
    subject: "Milo",
    facts: [
      "Milo loves walks",
      "Milo loves bacon",
      "Milo likes small dogs",
    ],
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
    returning: false,
    visitNumber: 1,
    movieMode: true,
  },
  housekeeping: {
    prompt: "Create the post-service customer experience for a housekeeping company.",
    subject: "housekeeping service",
    facts: [
      "Arrived at 9:04 AM",
      "Cleaned the kitchen",
      "Cleaned two bathrooms",
      "Finished at 11:47 AM",
    ],
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
    returning: false,
    visitNumber: 1,
    movieMode: true,
  },
};

const requested = String(process.env.QRE_AUTHOR_CASE ?? "relationship").trim().toLowerCase();
assert.ok(requested in CASES, `Unknown QRE_AUTHOR_CASE: ${requested}`);
const name = requested as CaseName;
const input = CASES[name];

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const result = await authorBrainCanonical(input);

console.log(`\n=== QRE EXPERIENTIAL COMPRESSION / ${name.toUpperCase()} ===`);
console.log("\nINPUT");
for (const fact of input.facts) console.log(`- ${fact}`);

console.log("\nWHAT QRE SELECTED");
console.log("MOVIE:", result.movie?.id ?? "none");
console.log("ANGLE:", result.brief.angle);
console.log("PREMISE:", result.sequence.premise);
console.log("MODEL:", result.diagnostics.model);
console.log("MODEL CALLS:", result.diagnostics.modelCalls);
console.log("CANDIDATES:", result.diagnostics.candidateSequences);

console.log("\nFINAL CUTS");
result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${clean(scene.text)}`));

console.log("\nPROVENANCE");
for (const cut of result.sequence.cuts) {
  console.log(`[${cut.order}] ${cut.sourceIds.join(", ") || "NONE"} :: ${clean(cut.informationGain)}`);
}

console.log("\nQUALITY");
console.log(JSON.stringify(result.diagnostics.realizedFilmJudge ?? null, null, 2));

assert.ok(result.movie, "No Movie selected");
assert.ok(result.scenes.length >= 2, "No experiential sequence produced");
assert.equal(result.sequence.cuts.length, result.scenes.length, "SequencePlay diverged from visible cuts");

const visible = result.scenes.map((scene) => clean(scene.text)).filter(Boolean);
const source = new Set(input.facts.map((fact) => clean(fact).toLowerCase()));
const exactSourceCuts = visible.filter((line) => source.has(line.toLowerCase())).length;
assert.ok(exactSourceCuts < visible.length, "Visible sequence is only source replay");

assert.doesNotMatch(
  visible.join(" "),
  /\b(?:cognition|planner|candidate|trajectory|viewer state|semantic turn|compiler|realizer|provenance|evidenceEventIds|Mouth|Author)\b/i,
  "Internal architecture leaked into viewer-facing language",
);

for (const cut of result.sequence.cuts) {
  assert.ok(cut.sourceIds.length > 0, `Cut ${cut.order} has no provenance`);
  assert.ok(
    cut.sourceIds.every((id) => result.world.events.some((event) => event.id === id)),
    `Cut ${cut.order} contains unknown provenance`,
  );
}

console.log("\nHUMAN-EYE BAR");
console.log("- Does meaning increase across the sequence?");
console.log("- Does language compress rather than summarize?");
console.log("- Does each cut change what can be constructed?");
console.log("- Is the strongest realization earned rather than manufactured?");
console.log("- Does the sequence stop before explaining itself?");
console.log("- Did reality remain fixed while expression stayed free?");
console.log("\nQRE EXPERIENTIAL COMPRESSION PROBE: COMPLETE");
