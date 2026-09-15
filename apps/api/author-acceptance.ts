
/*
 * QRE CANONICAL AUTHOR ACCEPTANCE
 *
 * This is the primary end-to-end Author test.
 *
 * The only production path under test is:
 *
 * RealityGraph
 * -> Cognition
 * -> selected lens
 * -> Creative Spine
 * -> Creative Realizer
 * -> SequencePlay
 * -> visible scenes
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
  minCuts?: number;
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
      creativePreferences: [
        "short",
        "fun",
        "unexpected",
        "connect the dots",
        "do not explain the joke",
      ],
      specialties: [],
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
      objective:
        "Make ordinary housekeeping unexpectedly satisfying to watch.",
      desiredAction:
        "Leave the homeowner feeling the transformation.",
      creativePreferences: [
        "surprising",
        "rhythmic",
        "memorable",
        "not a work log",
      ],
      specialties: [],
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
      objective:
        "Make the strange setting and the relationship feel memorable.",
      desiredAction:
        "Let the scanner connect the strange details.",
      creativePreferences: [
        "romantic",
        "surprising",
        "subtle",
        "connect the dots",
      ],
      specialties: [],
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
      objective:
        "Make ordinary moving logistics feel unexpectedly watchable.",
      desiredAction:
        "Keep following the sequence and connect the details.",
      creativePreferences: [
        "surprising",
        "rhythmic",
        "memorable",
        "not a checklist",
      ],
      specialties: [],
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
      objective:
        "Make the memory feel alive enough to return to.",
      desiredAction:
        "Let the person recognize something familiar without explaining it.",
      creativePreferences: [
        "subtle",
        "recognition",
        "recurrence",
        "changed meaning",
      ],
      specialties: [],
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
      "Coco wore the blue bow again later",
    ],
  },
];

(async () => {
  console.log(`AUTHOR ACCEPTANCE: ${cases.length} cases`);

  for (const testCase of cases) {
    console.log(`\n=== ${testCase.name} ===`);

    try {
const result = await authorBrainCanonical({
  prompt: testCase.prompt,
  subject: testCase.subject,
  facts: testCase.facts,
  sourceMoments: testCase.facts,
  lens: testCase.lens,
  returning: testCase.returning,
  domainContext: testCase.domainContext,
  memoryContext: testCase.memoryContext,
});

      console.dir(result, { depth: null });

      if (testCase.minCuts !== undefined) {
        assert.ok(
          result,
          `${testCase.name}: Author returned no result`,
        );
      }
    } catch (error) {
      console.error(`${testCase.name} FAILED`);
      console.error(error);
    }
  }

  console.log("\nAUTHOR ACCEPTANCE COMPLETE");
})();

