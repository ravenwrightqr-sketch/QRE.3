/*
STATUS: CANONICAL
ROLE: End-to-end acceptance for the single Universal Author.
INPUT: Radical domain-neutral reality fixtures and conceptual prompts.
OUTPUT: Proof that the real Author can create grounded, non-repetitive experiences and preserve provenance.
AUTHORITY: Runtime Author result; assertions inspect actual scenes, not synthetic candidates.
MUST NOT: Assert exact prose, fabricate fixtures, or test an obsolete Author path.
UPSTREAM: Canonical Author.
DOWNSTREAM: CI/local model benchmark.
REPLACEMENT: Replaces all fragmented Author/Mouth/Satanico/Return acceptance fixtures.
*/
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

type Case = { name: string; prompt: string; subject?: string; facts: string[]; lens?: string; returning?: boolean; required?: RegExp[]; forbidden?: RegExp[] };

const cases: Case[] = [
  { name: "COCO GROOMER", subject: "Coco", facts: ["Coco arrived at the groomer", "bath happened", "blue bow", "Coco stole the blue bow", "pickup happened"], prompt: "Coco · groomer · 9 AM · bath · blue bow · stole it. Make it funny.", required: [/Coco|bow|bath|groomer/i], forbidden: [/a lawyer arrived|the lawyer spoke|the groomer hired/i] },
  { name: "COCO SPARSE", subject: "Coco", facts: ["Coco is a poodle", "Coco loves walks", "Coco loves summer", "Coco rolls in grass", "Coco likes small dogs", "Coco likes bacon", "Coco likes apples"], prompt: "Coco / poodle / walks / summer / grass / small dogs / bacon / apples", required: [/Coco|bacon|walk|summer|grass|small dog|apple/i] },
  { name: "MARIA SERVICE", subject: "Maria", facts: ["Maria cleaned the kitchen", "Maria cleaned two bathrooms", "Maria cleaned the living room", "the living room surrendered"], prompt: "Maria · client house · 9:04 AM · kitchen + bathrooms · living room surrendered", lens: "FUNNY", required: [/kitchen|bathroom|living room|Maria/i] },
  { name: "ALEX SAM RETURN", subject: "Alex + Sam", facts: ["Alex and Sam had their first date at Little Italy", "7 PM", "they went back two weeks later", "same restaurant", "they stayed until closing"], prompt: "Alex + Sam · Little Italy · 7 PM · first date · returned two weeks later · stayed until closing", returning: true, required: [/Little Italy|7 PM|closing|back|return|again/i] },
  { name: "WATCH", subject: "Grandfather's watch", facts: ["the watch stayed in a drawer for 40 years", "we found it", "we cleaned it", "we gave it to my sister"], prompt: "Grandfather's watch / drawer / 40 years / found it / cleaned it / gave it to sister", required: [/watch|40|drawer|sister/i] },
  { name: "WEDDING", subject: "Wedding", facts: ["vows happened Saturday at 5:30 PM", "Dad cried", "last dance happened"], prompt: "Wedding · Saturday · 5:30 PM · vows · dad cried · last dance", required: [/wedding|dad|dance|vows/i] },
  { name: "RAVE", subject: "Riverside Theater", facts: ["Riverside Theater on Friday at 8 PM", "the crowd was restless", "the first song hit"], prompt: "Riverside Theater · Friday · 8 PM · restless crowd · first song hit", lens: "WILD", required: [/Riverside|Friday|8 PM|crowd|song/i] },
  { name: "CONCEPT", prompt: "Make something beautiful about starting over.", facts: [], required: [/starting|again|begin|new|over/i] },
];

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function words(value: string): string[] { return clean(value).split(/\s+/).filter(Boolean); }

for (const testCase of cases) {
  const result = await authorBrainCanonical({ prompt: testCase.prompt, subject: testCase.subject, lens: testCase.lens, facts: testCase.facts, sourceMoments: [], memoryContext: [], trajectory: [], creativeLearningContext: [], returning: testCase.returning });
  const output = result.scenes.map((scene) => clean(scene.text)).filter(Boolean);
  const outputText = output.join(" ");
  console.log(`\n=== ${testCase.name} ===`);
  console.log(`MODEL: ${result.diagnostics.model}`);
  console.log(`CALLS: ${result.diagnostics.modelCalls}`);
  console.log(`MOVIE: ${result.movie?.id ?? "none"}`);
  output.forEach((line, index) => console.log(`[${index + 1}] ${line}`));
  assert.equal(result.diagnostics.qualityStatus, "ACCEPTED", "Author rejected a valid universal case");
  assert.equal(result.diagnostics.renderable, true, "Author result is not renderable");
  assert.equal(result.diagnostics.complete, true, "Author result is incomplete");
  assert.ok(output.length >= 1 && output.length <= 12, `scene count out of bounds: ${output.length}`);
  assert.equal(result.sequence.cuts.length, output.length, "sequence/scenes diverged");
  for (const cut of result.sequence.cuts) assert.ok(cut.sourceIds.every((id) => result.world.events.some((event) => event.id === id)), `unknown provenance id on cut ${cut.order}`);
  if (testCase.required) for (const pattern of testCase.required) assert.match(outputText, pattern, `${testCase.name}: missing grounded signal ${pattern}`);
  if (testCase.forbidden) for (const pattern of testCase.forbidden) assert.doesNotMatch(outputText, pattern, `${testCase.name}: invented concrete claim ${pattern}`);
  assert.doesNotMatch(outputText, /\b(?:cognition|planner|candidate|trajectory|viewer state|evidenceEventIds|semantic turn|future thread|Mouth|Author)\b/i, `${testCase.name}: compiler leakage`);
  if (output.length >= 3) {
    const starts = output.map((line) => words(line).slice(0, 3).join(" ").toLowerCase());
    assert.ok(new Set(starts).size >= Math.max(2, starts.length - 1), `${testCase.name}: repetitive sentence openings`);
  }
}
console.log("\nUNIVERSAL AUTHOR ACCEPTANCE: COMPLETE");
