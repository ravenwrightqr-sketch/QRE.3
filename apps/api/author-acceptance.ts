/*
 * QRE CANONICAL AUTHOR ACCEPTANCE
 *
 * This is the primary end-to-end Author test.
 *
 * The only production path under test is:
 *
 * RealityGraph
 *   -> Cognition
 *   -> selected lens
 *   -> Creative Spine
 *   -> Creative Realizer
 *   -> SequencePlay
 *   -> visible scenes
 *
 * Reality remains grounded.
 * Lens changes treatment, never facts.
 * SequencePlay is the delivery structure.
 */

import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";
import type { AuthorDomainContext } from "@qre/contracts";

type Case = {
  name: string;
  subject?: string;
  prompt: string;
  facts: string[];
  lens?: string;
  returning?: boolean;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  minCuts: number;
  required?: RegExp[];
  forbidden?: RegExp[];
};

const cases: Case[] = [
  {
    name: "COCO DOG TAG",
    subject: "Coco",
    prompt:
      "Make something people would actually want to watch about Coco. Find the funny or surprising relationship hiding inside the simple facts. Do not explain the facts.",
    facts: [
      "Coco is a poodle",
      "Coco loves walks",
      "Coco loves summer",
      "Coco rolls in grass",
      "Coco likes small dogs",
      "Coco likes bacon",
      "Coco likes apples",
    ],
    domainContext: {
      category: "pet",
      subjectKind: "dog",
      audience: ["friends", "family", "people meeting Coco"],
      objective: "Make Coco instantly memorable.",
      desiredAction: "Keep scanning and connect the details.",
      creativePreferences: ["short", "fun", "unexpected", "connect the dots", "do not explain the joke"],
    },
    minCuts: 3,
    required: [/Coco|bacon|walk|summer|grass|small dog|apple/i],
    forbidden: [
      /groomer|bath|bow|lawyer|owner|client|stole|snatched|grabbed|entered/i,
    ],
  },
  {
    name: "MARIA HOUSE RESET",
    subject: "Maria",
    prompt:
      "Turn Maria's house reset into short watchable media. Find the strongest progression hiding inside the ordinary work. Do not invent employees, dialogue, conflict, or a literal mission.",
    facts: [
      "Maria cleaned the kitchen",
      "Maria cleaned two bathrooms",
      "Maria started at 9:04 AM",
      "Maria finished at 11:47 AM",
    ],
    domainContext: {
      category: "home service",
      businessType: "housekeeping",
      businessName: "Maria Home Reset",
      serviceType: "house reset",
      serviceName: "house reset",
      subjectKind: "home",
      audience: ["homeowner"],
      objective: "Make ordinary housekeeping unexpectedly satisfying to watch.",
      desiredAction: "Leave the homeowner feeling the transformation.",
      creativePreferences: ["surprising", "rhythmic", "memorable", "not a work log"],
    },
    minCuts: 3,
    required: [/Maria|kitchen|bathroom|9:04|11:47/i],
    forbidden: [
      /customer screamed|client watched|owner watched|enemy|weapon|police|explosion/i,
    ],
  },
  {
    name: "RESTAURANT ROMANCE",
    subject: "Alex + Sam",
    lens: "romance",
    prompt:
      "Make a short experience about Alex and Sam. The restaurant was closed, the lights were off, chairs were on the ceiling, and they were together. Find the relationship hidden in those facts without inventing why they happened.",
    facts: [
      "the restaurant was closed",
      "the lights were off",
      "chairs were on the ceiling",
      "Alex and Sam were together",
    ],
    domainContext: {
      category: "restaurant",
      businessType: "restaurant",
      businessName: "Luigi's",
      serviceType: "dining",
      serviceName: "restaurant experience",
      subjectKind: "place",
      audience: ["Alex", "Sam"],
      objective: "Make the strange setting and the relationship feel memorable.",
      desiredAction: "Let the scanner connect the strange details.",
      creativePreferences: ["romantic", "surprising", "subtle", "connect the dots"],
    },
    minCuts: 3,
    required: [/closed|lights|chairs|Alex|Sam/i],
    forbidden: [
      /the waiter arrived|they ordered|the waiter spoke|the restaurant opened|they kissed/i,
    ],
  },
  {
    name: "MOVING DAY",
    subject: "The move",
    prompt:
      "Moving day. Let QRE decide the most fitting frame. Make the ordinary logistics feel like something worth watching, but never invent a literal spy, heist, weapon, enemy, or explosion.",
    facts: [
      "the kitchen was packed",
      "the bedroom was emptied",
      "three boxes remained",
      "the new address was confirmed",
    ],
    domainContext: {
      category: "moving",
      businessType: "moving service",
      serviceType: "move",
      serviceName: "moving day",
      subjectKind: "move",
      audience: ["person moving"],
      objective: "Make ordinary moving logistics feel unexpectedly watchable.",
      desiredAction: "Keep following the sequence and connect the details.",
      creativePreferences: ["surprising", "rhythmic", "memorable", "not a checklist"],
    },
    minCuts: 3,
    required: [/kitchen|bedroom|boxes|address/i],
    forbidden: [
      /gun|shot|agent arrived|enemy|explosion|police|literal mission/i,
    ],
  },
  {
    name: "PAUL MEMORY",
    subject: "Paul",
    returning: true,
    prompt:
      "Create a living memory from what is true about Paul. Find the relationship between repetition and absence. Make the experience worth returning to later. Do not write a eulogy or explain the meaning.",
    facts: [
      "Paul loved old records",
      "Paul kept every birthday card",
      "Paul played the same song every Sunday",
      "Paul is gone",
    ],
    domainContext: {
      category: "memory",
      subjectKind: "person",
      audience: ["someone who knew Paul"],
      objective: "Make the memory feel alive enough to return to.",
      desiredAction: "Let the person recognize something familiar without explaining it.",
      creativePreferences: ["subtle", "recognition", "recurrence", "changed meaning"],
    },
    memoryContext: [
      "Paul loved old records",
      "Paul kept every birthday card",
      "Paul played the same song every Sunday",
      "Paul is gone",
    ],
    minCuts: 3,
    required: [/Paul|records|cards|Sunday|song/i],
    forbidden: [
      /quest|mission|boss|game|achievement|XP|the funeral director|the priest said|the doctor said/i,
    ],
  },
  {
    name: "RECURRING BLUE BOW",
    subject: "Coco",
    returning: true,
    prompt:
      "Coco / blue bow / first grooming visit / kept afterward / blue bow again later. Let the scanner connect the earlier and later moment.",
    facts: [
      "Coco wore a blue bow at her first grooming visit",
      "the blue bow was kept afterward",
      "Coco wore the blue bow again at a later visit",
    ],
    memoryContext: [
      "Coco wore a blue bow at her first grooming visit",
      "the blue bow was kept afterward",
      "Coco wore the blue bow again at a later visit",
    ],
    domainContext: {
      category: "memory",
      subjectKind: "dog",
      audience: ["someone who already knows Coco"],
      objective: "Make the recurring blue bow feel recognized, not merely repeated.",
      desiredAction: "Let the scanner connect the earlier and later moment.",
      creativePreferences: ["callback", "recognition", "subtle payoff", "do not explain the callback"],
    },
    minCuts: 3,
    required: [/Coco|blue bow|bow/i],
    forbidden: [
      /owner watched|groomer said|the bow spoke|the bow moved|the bow decided/i,
    ],
  },  {
    name: "HOUSE MEMORY",
    subject: "The house",
    prompt:
      "Make a short memory of the house that could be worth replaying years later. Find the meaning carried by the ordinary details instead of simply listing them.",
    facts: [
      "we moved into the house in 2018",
      "Sunday dinners happened in the kitchen",
      "the children grew up upstairs",
      "we left the house in 2026",
    ],
    minCuts: 3,
    required: [/house|2018|Sunday|kitchen|upstairs|2026/i],
    forbidden: [
      /quest|mission|boss|game|achievement|XP|the realtor said|the neighbor waved/i,
    ],
  },
];

const INTERNAL_LANGUAGE =
  /\b(?:cognition|planner|candidate|trajectory|evidenceEventIds|semantic turn|future thread|creative opportunity|viewer state|compiler|realizer|SequencePlay|Mouth|Author)\b/i;

const EXPLANATION_LANGUAGE =
  /\b(?:this means|which means|the point is|the meaning is|in other words|this shows|which shows|because this)\b/i;

const GENERIC_LINE =
  /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|worth noticing|it was meaningful|it was special)\.?$/i;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function wordCount(value: string): number {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function weakAbstractLine(value: string): boolean {
  const text = clean(value);
  return /^(?:the\s+)?(?:pattern|sequence|preference|habit|repetition|control|invitation|lure|loop|known|the\s+loop|the\s+invitation|the\s+preference|the\s+pattern)\.?$/i.test(text);
}

function assertGrounded(
  testCase: Case,
  outputText: string,
): void {
  for (const pattern of testCase.required ?? []) {
    assert.match(
      outputText,
      pattern,
      `${testCase.name}: required grounded signal missing: ${pattern}`,
    );
  }

  for (const pattern of testCase.forbidden ?? []) {
    assert.doesNotMatch(
      outputText,
      pattern,
      `${testCase.name}: forbidden invention/template detected: ${pattern}`,
    );
  }
}

for (const testCase of cases) {
  const result = await authorBrainCanonical({
    prompt: testCase.prompt,
    subject: testCase.subject,
    lens: testCase.lens,
    facts: testCase.facts,
    sourceMoments: [],
    trajectory: [],
    creativeLearningContext: [],
    returning: testCase.returning,
    domainContext: testCase.domainContext,
    memoryContext: testCase.memoryContext ?? [],
  });

  const scenes = result.scenes
    .map((scene) => clean(scene.text))
    .filter(Boolean);

  const outputText = scenes.join(" ");

  console.log(`\n=== ${testCase.name} ===`);
  console.log(`MODEL: ${result.diagnostics.model}`);
  console.log(`CALLS: ${result.diagnostics.modelCalls}`);
  console.log(`ANGLE: ${result.brief.angle}`);
  console.log(`SCENES: ${scenes.length}`);

  scenes.forEach((line, index) => {
    console.log(`[${index + 1}] ${line}`);
  });

  assert.equal(
    result.diagnostics.qualityStatus,
    "ACCEPTED",
    `${testCase.name}: Author quality status rejected`,
  );

  assert.equal(
    result.diagnostics.renderable,
    true,
    `${testCase.name}: result is not renderable`,
  );

  assert.equal(
    result.diagnostics.complete,
    true,
    `${testCase.name}: result is incomplete`,
  );

  assert.ok(
    scenes.length >= testCase.minCuts,
    `${testCase.name}: only ${scenes.length} scenes; expected at least ${testCase.minCuts}`,
  );

  assert.equal(
    result.sequence.cuts.length,
    scenes.length,
    `${testCase.name}: SequencePlay cuts diverged from visible scenes`,
  );

  assert.ok(
    result.sequence.cuts.length > 0,
    `${testCase.name}: empty SequencePlay`,
  );

  for (const cut of result.sequence.cuts) {
    assert.ok(
      cut.sourceIds.length || result.world.events.length === 0,
      `${testCase.name}: cut ${cut.order} lost provenance`,
    );

    assert.ok(
      cut.sourceIds.every((sourceId) =>
        result.world.events.some((event) => event.id === sourceId),
      ),
      `${testCase.name}: cut ${cut.order} references unknown reality`,
    );
  }

  assertGrounded(testCase, outputText);

  assert.doesNotMatch(
    outputText,
    INTERNAL_LANGUAGE,
    `${testCase.name}: internal compiler language leaked into visible output`,
  );

  assert.doesNotMatch(
    outputText,
    EXPLANATION_LANGUAGE,
    `${testCase.name}: explanatory prose leaked into visible output`,
  );

  for (const scene of scenes) {
    assert.doesNotMatch(
      scene,
      GENERIC_LINE,
      `${testCase.name}: generic filler line`,
    );

    assert.equal(
      weakAbstractLine(scene),
      false,
      `${testCase.name}: abstract unlabeled beat escaped grounding`,
    );

    assert.ok(
      wordCount(scene) <= 24,
      `${testCase.name}: scene became prose (${wordCount(scene)} words)`,
    );
  }

  if (scenes.length >= 3) {
    const openings = scenes.map((scene) =>
      scene
        .split(/\s+/)
        .slice(0, 3)
        .join(" ")
        .toLowerCase(),
    );

    assert.ok(
      new Set(openings).size >= Math.max(2, openings.length - 1),
      `${testCase.name}: repetitive scene openings`,
    );
  }

  assert.notEqual(
    result.diagnostics.model,
    "fallback",
    `${testCase.name}: fallback model path was used`,
  );
}

async function runLens(
  lens: string,
): Promise<{
  text: string;
  sourceIds: string[];
  angle: string;
}> {
  const facts = [
    "the restaurant was closed",
    "the lights were off",
    "chairs were on the ceiling",
    "Alex and Sam were together",
  ];

  const result = await authorBrainCanonical({
    prompt:
      "Make a short experience from these exact facts. Change the feeling with the lens, never the reality.",
    subject: "Alex + Sam",
    lens,
    facts,
    sourceMoments: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  assert.equal(result.diagnostics.renderable, true, `${lens}: not renderable`);
  assert.equal(result.diagnostics.complete, true, `${lens}: incomplete`);
  assert.ok(result.sequence.cuts.length > 0, `${lens}: empty SequencePlay`);

  return {
    text: result.scenes.map((scene) => clean(scene.text)).join(" "),
    sourceIds: result.sequence.cuts.flatMap((cut) => cut.sourceIds).sort(),
    angle: clean(result.brief.angle),
  };
}

const comedy = await runLens("comedy");
const romance = await runLens("romance");
const horror = await runLens("horror");

assert.equal(
  comedy.sourceIds.join("|"),
  romance.sourceIds.join("|"),
  "same reality/lens test: comedy and romance changed provenance",
);

assert.equal(
  comedy.sourceIds.join("|"),
  horror.sourceIds.join("|"),
  "same reality/lens test: comedy and horror changed provenance",
);

assert.ok(
  new Set([comedy.text, romance.text, horror.text]).size >= 2,
  "same reality/lens test: different lenses collapsed into identical visible media",
);

console.log("\n=== LENS DIVERGENCE ===");
console.log(`COMEDY: ${comedy.text}`);
console.log(`ROMANCE: ${romance.text}`);
console.log(`HORROR: ${horror.text}`);
console.log(`COMEDY ANGLE: ${comedy.angle}`);
console.log(`ROMANCE ANGLE: ${romance.angle}`);
console.log(`HORROR ANGLE: ${horror.angle}`);
console.log("PROVENANCE: SAME");
console.log("VISIBLE TREATMENT: DIVERGENT");

console.log("\nCANONICAL AUTHOR ACCEPTANCE: PASS");