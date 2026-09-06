import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";

/**
 * QRE AUTHOR SUPERINTELLIGENCE LAB
 *
 * This is a showcase + adversarial benchmark, not a second author.
 * Every case uses the same canonical path:
 * Reality → Readout → Cognition → independent Judge → Movie → Mouth → Sequence.
 *
 * The lab deliberately crosses unrelated worlds. A healthy Author should not
 * collapse them into the same story shape, subject opening, or emotional filler.
 */

type Case = {
  name: string;
  subject: string;
  prompt: string;
  facts: string[];
  lens?: string;
  returning?: boolean;
  memoryContext?: string[];
};

const cases: Case[] = [
  {
    name: "COCO / GROOMING",
    subject: "Coco",
    prompt: "Make a tiny replayable film from what actually happened. Let the details carry the feeling; do not explain.",
    facts: [
      "Coco came in for grooming",
      "Coco hates the dryer",
      "Coco stole an apple from the counter",
      "Coco wore a blue bow home",
    ],
  },
  {
    name: "MARIA / HOUSE RESET",
    subject: "Maria",
    prompt: "Make the house reset watchable. Do not turn every room into a checklist beat.",
    facts: [
      "Maria started cleaning at 9:04 AM",
      "Maria cleaned the kitchen",
      "Maria cleaned bathroom one",
      "Maria cleaned bathroom two",
      "Maria finished at 11:47 AM",
    ],
  },
  {
    name: "RESTAURANT / SERVICE",
    subject: "the restaurant",
    prompt: "Find the most interesting progression in this shift and make it feel lived, not like an operations recap.",
    facts: [
      "The restaurant opened at 5 PM",
      "The first table ordered oysters",
      "The fryer stopped working",
      "The fryer returned before dessert service",
      "Dessert service became the busiest part of the night",
    ],
  },
  {
    name: "PAUL / RADIOS",
    subject: "Paul",
    prompt: "Make a compact film about the supplied radio details. Find the strongest relationship without inventing biography.",
    facts: [
      "Paul restores old radios",
      "Paul repaired 17 radios this year",
      "The first radio belonged to his grandfather",
      "Paul keeps that radio on his desk",
    ],
  },
  {
    name: "OLD GAS STATION / RECONTEXT",
    subject: "the old gas station",
    prompt: "Use the supplied place transformation. Do not invent what the old station was like beyond the facts.",
    facts: [
      "The gas station was closed for twenty years",
      "A coffee shop opened inside",
      "The original gas station sign still hangs above the door",
    ],
  },
  {
    name: "RAVE / INTERRUPTION",
    subject: "the event",
    prompt: "Make the interruption itself matter. Avoid a generic event recap.",
    facts: [
      "Doors opened at 9 PM",
      "The bass system failed at 11:20 PM",
      "The crowd waited",
      "The bass system returned",
      "The DJ restarted exactly where the track had stopped",
    ],
  },
  {
    name: "TOOLBOX / GENERATIONS",
    subject: "the red toolbox",
    prompt: "Make the object feel like an object that has accumulated use, not a generic memory speech.",
    facts: [
      "The red toolbox was bought in 1998",
      "The toolbox was used by the user's father",
      "The toolbox is now used by the user",
      "The handle has been replaced twice",
    ],
  },
  {
    name: "DOG GROOMER / GROWTH",
    subject: "the dog groomer",
    prompt: "Make the business growth visible through concrete details. The business distributes the film; it is not the automatic protagonist.",
    facts: [
      "The dog groomer started with one table",
      "There are now three tables",
      "The same old metal scissors are still used from opening day",
    ],
  },
  {
    name: "TRAVEL / RETURN",
    subject: "the overlook",
    prompt: "This is a return visit. Find what is newly meaningful without replaying the first visit.",
    returning: true,
    memoryContext: [
      "The overlook was visited once before at sunset",
      "The old bench was already there",
    ],
    facts: [
      "The overlook was reached in fog this time",
      "The old bench was still there",
      "A new trail marker stood beside the bench",
      "The fog lifted after the bench was passed",
    ],
  },
];

const INTERNAL = /\b(?:cognition|planner|candidate|trajectory|viewer|audience|compiler|realizer|provenance|semantic turn|latent movie|creative opportunity|evidence id)\b/i;
const EXPLANATION = /\b(?:this means|which means|the point is|the meaning is|in other words|this shows|which shows|because this)\b/i;
const SUBJECT_LEAD = (text: string, subject: string): boolean => {
  const escaped = subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?:\\b|:)`, "i").test(text.trim());
};

function words(text: string): number {
  return (text.match(/\b[\w’'-]+\b/g) ?? []).length;
}

function fail(message: string): never {
  throw new Error(`SUPERINTELLIGENCE LAB FAILED: ${message}`);
}

const rendered: string[] = [];

for (const test of cases) {
  const result = await authorBrainCanonical({
    prompt: test.prompt,
    subject: test.subject,
    facts: test.facts,
    sourceMoments: test.facts,
    memoryContext: test.memoryContext ?? [],
    creativeLearningContext: [],
    returning: test.returning,
    lens: test.lens,
  });

  if (!result.movie) fail(`${test.name}: no Movie selected`);
  if (!result.diagnostics.complete || !result.diagnostics.renderable) fail(`${test.name}: not renderable`);
  if (!result.sequence.cuts.length) fail(`${test.name}: empty sequence`);
  if (result.sequence.cuts.some((cut) => cut.sourceIds.length === 0)) fail(`${test.name}: provenance lost`);

  const texts = result.scenes.map((scene) => scene.text);
  if (texts.some((text) => INTERNAL.test(text) || EXPLANATION.test(text))) {
    fail(`${test.name}: internal/explanatory language leaked into visible creation`);
  }
  if (texts.some((text) => words(text) > 24)) fail(`${test.name}: Mouth cut exceeded 24 words`);
  if (texts.length >= 2 && texts.every((text) => SUBJECT_LEAD(text, test.subject))) {
    fail(`${test.name}: subject-led author template collapse`);
  }

  rendered.push(texts.join(" "));

  console.log(`\n================ ${test.name} ================`);
  console.log("READOUT");
  console.log(result.readout.text);
  console.log("\nWHAT QRE PICKED");
  console.log(`Movie: ${result.movie.id}`);
  console.log(`Lens: ${result.movie.lens}`);
  console.log(`Candidates: ${result.diagnostics.candidateSequences}`);
  console.log(`Accepted candidates: ${result.diagnostics.acceptedCandidates}`);
  console.log(`Decision score: ${result.diagnostics.selectedScore}`);
  console.log(`Semantic gate: ${result.diagnostics.semanticGate?.accepted ? "PASS" : "FAIL"}`);
  console.log(`Judge: ${result.diagnostics.experienceJudge?.accepted ? "PASS" : "FAIL"}`);
  console.log(`Model: ${result.diagnostics.model}`);
  console.log("\nREJECTED / ATTACKED");
  console.log(JSON.stringify(result.diagnostics.rejectedCandidates.slice(0, 6), null, 2));
  console.log("\nMOVIE THESIS");
  console.log(result.movie.hypothesis.join("\n"));
  console.log("\nFINAL FILM");
  texts.forEach((text, index) => console.log(`${index + 1}. ${text}`));
  console.log("\nPROVENANCE");
  result.sequence.cuts.forEach((cut) => console.log(`${cut.order}: ${cut.sourceIds.join(", ")}`));
}

const normalized = rendered.map((text) => text.toLowerCase().replace(/\W+/g, " ").trim());
const uniqueOutputs = new Set(normalized).size;
if (uniqueOutputs < Math.ceil(cases.length * 0.8)) fail(`cross-world collapse: ${uniqueOutputs}/${cases.length}`);

console.log("\n============================================================");
console.log(`SUPERINTELLIGENCE LAB: PASS (${cases.length} worlds, ${uniqueOutputs} materially unique outputs)`);
console.log("REALITY → READOUT → UNDERSTAND → NOTICE → COMPETE → ATTACK → JUDGE → MOVIE → MOUTH → EXPERIENCE");
