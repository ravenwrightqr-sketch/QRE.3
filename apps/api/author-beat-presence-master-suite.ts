/// <reference types="node" />

import { authorMicroBeats } from "./src/services/microBeatMouth.js";
import type { ExperiencePresenceContext } from "@qre/contracts";

type Case = {
  name: string;
  prompt: string;
  subject?: string;
  place?: string;
  lens?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  round?: number;
  presence?: ExperiencePresenceContext;
  mustCallback?: boolean;
};

function assertRuntime(): void {
  if (process.env.QRE_AI_ENABLED !== "true") {
    throw new Error("AUTHOR BEAT MASTER NOT RUN: QRE_AI_ENABLED is not true.");
  }
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const cases: Case[] = [
  {
    name: "COCO-ROUND-1",
    prompt: "Make a living memory story for Coco's dog tag.",
    subject: "Coco",
    facts: ["Coco", "poodle", "sweet", "scared at first", "happy after", "hates bows", "loves treats"],
    sourceMoments: ["grooming visit", "pink bow"],
    lens: "funny, slightly fierce, character-first",
    round: 1,
  },
  {
    name: "COCO-ROUND-2",
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.",
    subject: "Coco",
    facts: ["Coco", "poodle", "hates bows", "loves treats", "scared at first", "happy after"],
    sourceMoments: ["today Coco tolerated the bath faster", "pink bow was offered again", "Coco walked out proud"],
    memoryContext: ["Coco hates bows", "Coco has been groomed before"],
    lens: "recurring character comedy",
    round: 2,
    mustCallback: true,
    presence: {
      currentSession: { sessionId: "coco-2", assetId: "coco-tag", status: "ENTERED", visitNumber: 2, isReturning: true, enteredAt: "2026-08-14T17:00:00.000Z" },
      sessions: [{ sessionId: "coco-2", assetId: "coco-tag", status: "ENTERED", visitNumber: 2, isReturning: true, enteredAt: "2026-08-14T17:00:00.000Z" }],
      places: ["Riverside Grooming Studio"],
      visitNumber: 2,
      isReturning: true,
      firstSeenAt: "2026-08-01T17:00:00.000Z",
      lastSeenAt: "2026-08-14T17:00:00.000Z",
      summary: ["returning presence: visit 2", "known places: Riverside Grooming Studio"],
    },
  },
  {
    name: "MARIA-SERVICE",
    prompt: "Make a short new-world receipt for Maria's cleaning visit.",
    subject: "Maria",
    facts: ["Maria arrived at 9:04 AM", "bathrooms", "kitchen", "laundry", "finished at 11:47 AM"],
    sourceMoments: ["bathrooms defeated", "kitchen conquered", "laundry spun"],
    lens: "dry comedy, service verdict",
    round: 1,
  },
  {
    name: "BOBO",
    prompt: "Make Bobo's first grooming experience feel like the start of his world.",
    subject: "Bobo",
    facts: ["Bobo", "bulldog", "runs in", "kisses everyone", "scared in water", "happy after", "loves balls"],
    sourceMoments: ["first grooming visit"],
    lens: "high-energy character comedy",
    round: 1,
  },
  {
    name: "HORROR-CALM",
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation"],
    sourceMoments: [],
    lens: "calm dark humor, spatial contradiction",
    round: 1,
  },
  {
    name: "RAVE-PRESENCE",
    prompt: "Make this rave attendance feel like a living memory.",
    subject: "rave night",
    place: "Los Angeles",
    facts: ["rave", "music", "friends", "late night"],
    sourceMoments: ["walked into the event", "stayed through the night"],
    lens: "electric, social, unforgettable without cliché",
    round: 1,
    presence: {
      currentSession: { sessionId: "rave-1", assetId: "rave-ticket", status: "ENTERED", visitNumber: 1, isReturning: false, enteredAt: "2026-08-14T23:47:00.000Z" },
      sessions: [{ sessionId: "rave-1", assetId: "rave-ticket", status: "ENTERED", visitNumber: 1, isReturning: false, enteredAt: "2026-08-14T23:47:00.000Z" }],
      points: [{ sessionId: "rave-1", timestamp: "2026-08-14T23:47:00.000Z", lat: 34.05, lng: -118.25, accuracy: 8, label: "Los Angeles Event Venue", city: "Los Angeles", region: "CA", country: "US" }],
      places: ["Los Angeles Event Venue"],
      visitNumber: 1,
      isReturning: false,
      firstSeenAt: "2026-08-14T23:47:00.000Z",
      lastSeenAt: "2026-08-14T23:47:00.000Z",
      summary: ["presence points recorded: 1", "first known presence", "known places: Los Angeles Event Venue"],
    },
  },
];

assertRuntime();
let failures = 0;

for (const test of cases) {
  console.log("\n" + "=".repeat(100));
  console.log(test.name);
  console.log("PROMPT:", test.prompt);
  console.time(test.name);

  try {
    const beats = await authorMicroBeats({
      prompt: test.prompt,
      subject: test.subject,
      place: test.place,
      lens: test.lens,
      facts: test.facts,
      sourceMoments: test.sourceMoments,
      memoryContext: test.memoryContext,
      creativeLearningContext: [
        "JOLT → JOLT → JOLT → PAYOFF.",
        "2–4 words preferred per beat.",
        "Hard ceiling: 7 words.",
        "One thought per beat.",
        "Never use paragraph prose.",
        "Never chain beats with pipes or semicolons.",
        "Do not invent concrete events in grounded/service/living-memory contexts.",
      ],
      trajectory: ["jolt", "jolt", "jolt", "payoff"],
      presence: test.presence,
      round: test.round,
    });

    console.timeEnd(test.name);
    console.log("BEATS:", beats.length);

    if (beats.length < 4 || beats.length > 6) {
      failures += 1;
      console.error("FAIL: expected 4–6 beats.");
    }

    for (const [index, beat] of beats.entries()) {
      const count = wordCount(beat.text);
      console.log(`[${index + 1}] ${beat.kind} · ${beat.text} (${count}w${beat.callback ? ", callback" : ""})`);

      if (count > 7) {
        failures += 1;
        console.error(`FAIL: beat ${index + 1} exceeds 7-word ceiling.`);
      }
      if (/[|;]/.test(beat.text)) {
        failures += 1;
        console.error(`FAIL: beat ${index + 1} chains multiple thoughts.`);
      }
      if (/\b(?:qre|ai|prompt|compiler|cognition|metadata|model|instruction)\b/i.test(beat.text)) {
        failures += 1;
        console.error(`FAIL: beat ${index + 1} leaks authoring/meta language.`);
      }
    }

    if (beats.at(-1)?.kind !== "payoff") {
      failures += 1;
      console.error("FAIL: final beat is not payoff.");
    }

    if (test.mustCallback && !beats.some((beat) => beat.callback)) {
      failures += 1;
      console.error("FAIL: returning chapter did not mark a callback beat.");
    }

    if (test.presence?.isReturning && !beats.some((beat) => beat.callback)) {
      failures += 1;
      console.error("FAIL: Presence returning state did not influence callback behavior.");
    }
  } catch (error) {
    console.timeEnd(test.name);
    failures += 1;
    console.error("AUTHOR BEAT ERROR:", error instanceof Error ? error.message : error);
  }
}

console.log("\n" + "=".repeat(100));
console.log("AUTHOR BEAT + PRESENCE MASTER SUITE COMPLETE");
console.log("FAILURES:", failures);

if (failures > 0) process.exitCode = 1;
