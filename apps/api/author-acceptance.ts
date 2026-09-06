/*
 * QRE UNIVERSAL AUTHOR ACCEPTANCE
 *
 * This suite tests behavior, not exact prose.
 * Reality must remain grounded; the frame may radically change attitude;
 * the Movie must discover a progression; the Mouth must deliver short felt cuts.
 * Service media is client-centered: the business distributes; the client/subject is the star.
 * Living memory is replay media: preserve what happened, make it worth feeling again.
 */
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";
import type { AuthorDomainContext } from "@qre/contracts";

type Case = {
  name: string;
  prompt: string;
  subject?: string;
  facts: string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
  returning?: boolean;
  required?: RegExp[];
  forbidden?: RegExp[];
  frame?: RegExp;
  minCreativeCuts?: number;
};

const cases: Case[] = [
  {
    name: "COCO SPARSE STAR",
    subject: "Coco",
    facts: [
      "Coco is a poodle",
      "Coco loves walks",
      "Coco loves summer",
      "Coco rolls in grass",
      "Coco likes small dogs",
      "Coco likes bacon",
      "Coco likes apples",
    ],
    prompt: "Coco / poodle / walks / summer / grass / small dogs / bacon / apples",
    required: [/Coco|bacon|walk|summer|grass|small dog|apple/i],
    forbidden: [/groomer|bath|bow|lawyer|owner|client|stole|snatched|grabbed|entered/i],
    minCreativeCuts: 2,
  },
  {
    name: "COCO GROOMING FRAME",
    subject: "Coco",
    facts: [
      "Coco arrived at the groomer",
      "bath happened",
      "blue bow",
      "pickup happened",
    ],
    domainContext: {
      category: "pet care",
      businessType: "dog grooming",
      businessName: "Elm St Grooming",
      businessDescription: "A dog grooming business that turns ordinary appointments into polished take-home moments.",
      serviceType: "grooming",
      serviceName: "dog grooming",
      subjectKind: "dog",
      knownCapabilities: ["bath", "grooming", "pickup", "blue bows"],
      contextualSignals: ["before and after", "freshly groomed", "polished", "pampered dogs"],
    },
    prompt: "Coco grooming visit. Make the supplied facts feel like something bigger without inventing what happened.",
    required: [/Coco|bow|bath|groomer|pickup/i],
    forbidden: [/lawyer arrived|the lawyer spoke|the groomer hired|the groomer cooed|the phone camera|the owner shrugged|client watched|client saw|owner watched|groomer watched|Coco stole|Coco snatched|Coco grabbed/i],
    minCreativeCuts: 2,
  },
  {
    name: "MARIA HOUSE RESET",
    subject: "Maria",
    facts: [
      "Maria cleaned two bathrooms",
      "Maria cleaned the kitchen",
      "Maria's location was recorded at 9:04 AM",
      "the cleaning was complete at 11:47 AM",
    ],
    prompt: "Maria / house reset / 9:04 AM / kitchen / two bathrooms / 11:47 AM",
    frame: /mission|speedrun|operation|round|takeover|restoration|boss/i,
    required: [/kitchen|bathroom|Maria|11:47|9:04/i],
    forbidden: [/customer screamed|client watched|owner watched|Maria fought|enemy attacked|weapon|police/i],
    minCreativeCuts: 3,
  },
  {
    name: "CAR WASH CLIENT MEDIA",
    subject: "Jordan's car",
    facts: [
      "Jordan's car arrived dirty",
      "the wash was completed",
      "the car left clean",
    ],
    domainContext: {
      category: "automotive service",
      businessType: "car wash",
      businessName: "QRE Auto Wash",
      businessDescription: "A car wash focused on visible before-and-after transformations.",
      serviceType: "wash",
      serviceName: "car wash",
      subjectKind: "vehicle",
      knownCapabilities: ["wash", "rinse", "clean", "before and after"],
      contextualSignals: ["shine", "transformation", "clean finish"],
    },
    prompt: "Service receipt. The business wants something Jordan will watch and share because the car's transformation is fun to experience.",
    required: [/Jordan|car|wash|clean|dirty/i],
    forbidden: [/customer watched|client watched|manager smiled|employee cheered|owner arrived|the attendant said/i],
    minCreativeCuts: 2,
  },
  {
    name: "HOUSE MEMORY",
    subject: "The house",
    facts: [
      "we moved into the house in 2018",
      "Sunday dinners happened in the kitchen",
      "the children grew up upstairs",
      "we left the house in 2026",
    ],
    prompt: "A house memory. Make the house and what happened there feel worth revisiting later.",
    required: [/house|2018|Sunday|kitchen|upstairs|2026/i],
    forbidden: [/quest|mission|boss|game|achievement|XP|the realtor said|the neighbor waved/i],
    minCreativeCuts: 3,
  },
  {
    name: "PAUL LIVING MEMORY",
    subject: "Paul",
    facts: [
      "Paul loved old records",
      "Paul kept every birthday card",
      "Paul played the same song every Sunday",
      "Paul is gone",
    ],
    prompt: "Paul is gone. Create a living memory from what remains true about him. The experience should be something someone could return to and feel later.",
    required: [/Paul|records|cards|Sunday|song/i],
    forbidden: [/quest|mission|boss|game|achievement|XP|the funeral director|the priest said|the doctor said/i],
    minCreativeCuts: 3,
  },
  {
    name: "RESTAURANT ROMANCE",
    subject: "Alex + Sam",
    facts: [
      "the restaurant was closed",
      "the lights were off",
      "chairs were on the ceiling",
      "Alex and Sam were together",
    ],
    prompt: "Alex + Sam at Luigi's. Romance lens. The restaurant was closed, lights out, chairs on the ceiling, and somehow they were unaffected in their world.",
    lens: "ROMANCE",
    required: [/closed|lights|chairs|Alex|Sam/i],
    forbidden: [/the restaurant opened|the waiter arrived|they ordered|the waiter spoke|the waiter smiled/i],
    minCreativeCuts: 2,
  },
  {
    name: "MOVING SPY",
    subject: "The move",
    facts: [
      "the kitchen was packed",
      "the bedroom was emptied",
      "three boxes remained",
      "the new address was confirmed",
    ],
    prompt: "Moving day. Let QRE decide the most fitting frame.",
    frame: /spy|mission|extraction|operation|heist|logistics|countdown/i,
    required: [/kitchen|bedroom|boxes|address/i],
    forbidden: [/gun|shot|agent arrived|enemy|explosion|police/i],
    minCreativeCuts: 3,
  },
  {
    name: "WEDDING",
    subject: "Wedding",
    facts: [
      "vows happened Saturday at 5:30 PM",
      "Dad cried",
      "the last dance happened",
    ],
    prompt: "Wedding / Saturday / 5:30 PM / vows / Dad cried / last dance",
    required: [/wedding|dad|dance|vows|5:30|Saturday/i],
    forbidden: [/the minister said|guests shouted|the bride walked|the groom smiled/i],
    minCreativeCuts: 2,
  },
  {
    name: "RAVE",
    subject: "Riverside Theater",
    facts: [
      "Riverside Theater",
      "Friday at 8 PM",
      "the crowd was restless",
      "the first song hit",
    ],
    prompt: "Riverside Theater / Friday / 8 PM / restless crowd / first song hit",
    lens: "WILD",
    required: [/Riverside|Friday|8 PM|crowd|song/i],
    forbidden: [/the DJ said|someone punched|a fight broke out|police arrived/i],
    minCreativeCuts: 2,
  },
  {
    name: "RETURN",
    subject: "Alex + Sam",
    facts: [
      "Alex and Sam had their first date at Little Italy",
      "7 PM",
      "they returned two weeks later",
      "same restaurant",
      "they stayed until closing",
    ],
    prompt: "Alex + Sam / Little Italy / 7 PM / first date / returned two weeks later / same restaurant / stayed until closing",
    returning: true,
    required: [/Little Italy|7 PM|closing|return|again|Alex|Sam/i],
    forbidden: [/the waiter remembered|the waiter asked|they kissed|the band played/i],
    minCreativeCuts: 2,
  },
  {
    name: "MEMORIAL NONE",
    subject: "Her memory",
    facts: [
      "she loved old records",
      "she kept every birthday card",
      "she played the same song every Sunday",
    ],
    prompt: "She loved old records, kept every birthday card, and played the same song every Sunday.",
    required: [/records|cards|Sunday|song/i],
    forbidden: [/quest|mission|boss|game|achievement|XP/i],
    minCreativeCuts: 3,
  },
  {
    name: "CONCEPT",
    prompt: "Make something beautiful about starting over.",
    facts: [],
    required: [/starting|again|begin|new|over/i],
    minCreativeCuts: 1,
  },
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function words(value: string): string[] {
  return clean(value).split(/\s+/).filter(Boolean);
}

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
    returning: testCase.returning,
    domainContext: testCase.domainContext,
  });

  const output = result.scenes.map((scene) => clean(scene.text)).filter(Boolean);
  const outputText = output.join(" ");

  console.log(`\n=== ${testCase.name} ===`);
  console.log(`MODEL: ${result.diagnostics.model}`);
  console.log(`CALLS: ${result.diagnostics.modelCalls}`);
  console.log(`FRAME: ${result.brief.angle}`);
  console.log(`MOVIE: ${result.movie?.id ?? "none"}`);
  output.forEach((line, index) => console.log(`[${index + 1}] ${line}`));

  assert.equal(result.diagnostics.qualityStatus, "ACCEPTED", "Author rejected a valid universal case");
  assert.equal(result.diagnostics.renderable, true, "Author result is not renderable");
  assert.equal(result.diagnostics.complete, true, "Author result is incomplete");
  assert.ok(output.length >= 1 && output.length <= 12, `scene count out of bounds: ${output.length}`);
  assert.equal(result.sequence.cuts.length, output.length, "sequence/scenes diverged");
  assert.ok(result.movie, "No latent Movie selected");

  for (const cut of result.sequence.cuts) {
    assert.ok(cut.sourceIds.length || result.world.events.length === 0, `cut ${cut.order} has no provenance`);
    assert.ok(cut.sourceIds.every((id) => result.world.events.some((event) => event.id === id)), `unknown provenance id on cut ${cut.order}`);
  }

  if (testCase.required) {
    for (const pattern of testCase.required) assert.match(outputText, pattern, `${testCase.name}: missing grounded signal ${pattern}`);
  }
  if (testCase.forbidden) {
    for (const pattern of testCase.forbidden) assert.doesNotMatch(outputText, pattern, `${testCase.name}: forbidden invention/template ${pattern}`);
  }
  if (testCase.frame) assert.match(result.brief.angle, testCase.frame, `${testCase.name}: no suitable frame discovered`);
  if (testCase.minCreativeCuts) assert.ok(output.length >= testCase.minCreativeCuts, `${testCase.name}: insufficient discovered sequence`);

  assert.doesNotMatch(
    outputText,
    /\b(?:cognition|planner|candidate|trajectory|viewer state|evidenceEventIds|semantic turn|future thread|Mouth|Author)\b/i,
    `${testCase.name}: compiler leakage`,
  );

  if (output.length >= 3) {
    const starts = output.map((line) => words(line).slice(0, 3).join(" ").toLowerCase());
    assert.ok(new Set(starts).size >= Math.max(2, starts.length - 1), `${testCase.name}: repetitive sentence openings`);
  }
}

console.log("\nUNIVERSAL AUTHOR ACCEPTANCE: COMPLETE");
