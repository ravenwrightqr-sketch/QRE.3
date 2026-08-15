/// <reference types="node" />

import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { buildPresenceContext } from "@qre/engine";
import type { PresenceRepository } from "@qre/engine";

type Case = {
  name: string;
  prompt: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  lens: string;
  round: number;
  presence?: {
    assetId: string;
    currentSessionId: string;
  };
};

const fakePresence: PresenceRepository = {
  async upsertSession() { return {}; },
  async createGeoProof() {},
  async checkOut() { return {}; },
  async getPresenceMap() { return []; },
  async getPresenceReplay() {
    return [
      { sessionId: "visit-1", createdAt: new Date("2026-08-10T01:00:00Z"), lat: 33.98, lng: -118.45 },
      { sessionId: "visit-2", createdAt: new Date("2026-08-14T01:00:00Z"), lat: 33.98, lng: -118.45 },
    ];
  },
  async getPresenceTimeline() {
    return [
      { sessionId: "visit-1", createdAt: new Date("2026-08-10T01:00:00Z"), lat: 33.98, lng: -118.45, accuracy: 8, label: "Belmont Shore", city: "Long Beach", region: "CA", country: "US" },
      { sessionId: "visit-2", createdAt: new Date("2026-08-14T01:00:00Z"), lat: 33.98, lng: -118.45, accuracy: 6, label: "Belmont Shore", city: "Long Beach", region: "CA", country: "US" },
    ];
  },
};

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function beatFailures(text: string): string[] {
  const failures: string[] = [];
  const count = words(text);
  if (count > 7) failures.push(`too-long:${count}`);
  if (/\|/.test(text)) failures.push("chained-pipes");
  if (/\b(afterglow|revelation|status inversion|micro-reveal|zoom into|scene|operator|callback)\b/i.test(text)) failures.push("meta-author-language");
  if (/[;]{1}/.test(text)) failures.push("semicolon-chaining");
  return failures;
}

const cases: Case[] = [
  {
    name: "COCO-ROUND-2",
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.",
    subject: "Coco",
    facts: ["Coco", "poodle", "sweet", "scared at first", "happy after", "hates bows", "loves treats"],
    sourceMoments: ["today Coco tolerated the bath faster", "pink bow was offered again", "Coco walked out proud"],
    lens: "recurring character comedy; callback first; tiny jolts; no pet-commercial prose",
    round: 2,
    presence: { assetId: "coco-tag", currentSessionId: "visit-2" },
  },
  {
    name: "BOBO-ROUND-1",
    prompt: "Make Bobo's first grooming experience feel like the start of his world.",
    subject: "Bobo",
    facts: ["Bobo", "bulldog", "runs in", "kisses everyone", "scared in water", "happy after", "loves balls"],
    sourceMoments: ["first grooming visit"],
    lens: "high-energy character comedy; fearless entrance versus water fear; 2-4 word jolts",
    round: 1,
  },
  {
    name: "SERVICE-RECEIPT",
    prompt: "Make a short new-world receipt for today's service client.",
    facts: ["completed service", "client identity exists", "one memorable detail from today", "today 9:04 AM"],
    sourceMoments: ["today's appointment", "service completed"],
    lens: "receipt grammar: time, verdicts, final verdict; never corporate copy",
    round: 1,
  },
  {
    name: "RAVE-TICKET",
    prompt: "Turn this rave check-in into a living memory chapter.",
    subject: "rave ticket",
    place: "Los Angeles",
    facts: ["physical event ticket", "rave", "Los Angeles", "friends", "night", "music"],
    sourceMoments: ["checked in tonight", "returned to the same event series"],
    lens: "presence-driven nightlife memory; tiny jolts; return should feel different",
    round: 2,
    presence: { assetId: "rave-ticket-001", currentSessionId: "visit-2" },
  },
];

if (process.env.QRE_AI_ENABLED !== "true") {
  throw new Error("BEAT/PRESENCE SUITE NOT RUN: QRE_AI_ENABLED is not true.");
}

let failures = 0;

for (const test of cases) {
  console.log("\n" + "=".repeat(100));
  console.log(test.name);
  console.log("PROMPT:", test.prompt);

  try {
    const presence = test.presence
      ? await buildPresenceContext(test.presence.assetId, fakePresence, test.presence.currentSessionId)
      : undefined;

    if (presence) {
      console.log("PRESENCE:", {
        visitNumber: presence.visitNumber,
        isReturning: presence.isReturning,
        currentSession: presence.currentSession?.sessionId,
        places: presence.places,
        firstSeenAt: presence.firstSeenAt,
        lastSeenAt: presence.lastSeenAt,
        latest: presence.points?.at(-1),
      });
    }

    const cognition = buildAuthorCognitivePlan({
      prompt: test.prompt,
      subject: test.subject,
      place: test.place,
      lens: test.lens,
      facts: test.facts,
      sourceMoments: test.sourceMoments,
      memoryContext: presence?.summary ?? [],
      round: test.round,
    });

    const learning = [
      ...(test.presence ? ["Presence is authoritative context. Use returning-visit state as continuity, not exposition."] : []),
      ...(presence?.summary ?? []),
      "AUTHORING UNIT = MICRO-BEAT, NOT PARAGRAPH.",
      "DEFAULT = JOLT → JOLT → JOLT → PAYOFF.",
      "2–4 words is ideal per beat.",
      "5–7 words is allowed only when needed.",
      "Never chain multiple thoughts with pipes, semicolons, or comma-heavy prose.",
      "One beat = one perceptible change.",
      "Image carries description; text carries attention, attitude, timing, contradiction, callback, or meaning.",
      "Round 2 must use history rather than restarting the subject.",
    ];

    const result = await authorCinematicSequence({
      prompt: test.prompt,
      lens: test.lens,
      subject: test.subject ?? "",
      place: test.place ?? "",
      facts: [...test.facts, ...(presence?.summary ?? [])],
      sourceMoments: test.sourceMoments,
      memoryContext: [...(presence?.summary ?? []), `visit=${presence?.visitNumber ?? 1}`, `returning=${presence?.isReturning ?? false}`],
      creativeLearningContext: [...learning, ...cognition.authorBrief, ...cognition.antiRepetitionRules, ...cognition.sceneRules],
      trajectory: [cognition.chosenAttentionStrategy, ...cognition.operatorMix, ...cognition.callbackTargets],
    });

    console.log("ATTENTION:", cognition.chosenAttentionStrategy);
    console.log("RHYTHM:", cognition.sceneRules.find((rule) => rule.includes("JOLT")) ?? "JOLT → JOLT → JOLT → PAYOFF");
    console.log("OUTPUT:", result.length, "beats/scenes");

    const allProblems = result.flatMap((scene, index) => beatFailures(scene.text).map((problem) => `#${index + 1}:${problem}`));
    if (result.length < 4 || result.length > 6) allProblems.push(`count:${result.length}`);
    if (!result.some((scene) => /payoff|victory|done|ready|again|next time|leaves?|returns?/i.test(`${scene.kind ?? ""} ${scene.text}`))) allProblems.push("missing-payoff-signal");
    if (test.round > 1 && !result.some((scene) => /again|return|back|remember|known|last|before/i.test(scene.text))) allProblems.push("missing-round-callback");

    for (const [index, scene] of result.entries()) {
      console.log(`[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text} (${words(scene.text)}w)`);
    }

    if (allProblems.length) {
      failures += 1;
      console.error("FAIL:", allProblems.join(" | "));
    } else {
      console.log("PASS: beat grammar + presence continuity");
    }
  } catch (error) {
    failures += 1;
    console.error("ERROR:", error instanceof Error ? error.message : error);
  }
}

console.log("\n" + "=".repeat(100));
console.log("BEAT + PRESENCE ACCEPTANCE SUITE COMPLETE");
console.log("FAILURES:", failures);
if (failures > 0) process.exitCode = 1;
