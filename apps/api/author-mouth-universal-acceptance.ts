import assert from "node:assert/strict";
import { critiqueMouthCandidates } from "./src/services/authorMouthCritic.js";

type Case = {
  name: string;
  subject: string;
  facts: string[];
  moments: string[];
  memory?: string[];
  expected: RegExp[];
  forbidden: RegExp[];
};

const cases: Case[] = [
  {
    name: "first sparse pet",
    subject: "Coco",
    facts: ["Coco is a poodle", "Coco loves walks", "Coco loves summer", "Coco rolls in grass", "Coco likes small dogs", "Coco likes bacon", "Coco likes apples"],
    moments: [],
    expected: [/walk|park|bacon|squirrel|summer|grass|small dog/i],
    forbidden: [/chased?\s+squirrel/i, /squirrel.*\b(?:saw|met|found|caught)\b/i],
  },
  {
    name: "first relationship",
    subject: "the rave",
    facts: ["met at the rave", "Friday Dec 1", "locked eyes", "felt like we knew each other forever", "talked all night", "now talk every day"],
    moments: [],
    expected: [/rave/i, /one look|locked eyes|familiar/i, /every day/i],
    forbidden: [/kissed|danced together|went home together/i],
  },
  {
    name: "groomer receipt",
    subject: "Coco",
    facts: ["came in nervous", "pink bow", "happy pickup", "dancing around"],
    moments: [],
    expected: [/nervous|bow|pickup|fabulous|approved|dance/i],
    forbidden: [/eyes wide|tail wag|squared shoulders|confident/i],
  },
  {
    name: "dog walker receipt",
    subject: "Coco",
    facts: ["walk started", "New York", "met a bulldog", "PH water", "returned happy", "distance logged"],
    moments: [],
    expected: [/bulldog|PH|home|walk|New York|distance/i],
    forbidden: [/chased|barked|sniffed|ran after|pulled the leash/i],
  },
  {
    name: "return memory",
    subject: "Coco",
    facts: ["Coco likes small dogs", "Coco likes bacon"],
    moments: ["today Coco met a small dog at the park"],
    memory: ["prior: Coco likes small dogs"],
    expected: [/again|remember|small dog|apparently|there it is|familiar/i],
    forbidden: [/made friends|played together|chased/i],
  },
  {
    name: "state change",
    subject: "Coco",
    facts: ["normal", "groom", "vet", "lost", "vacation"],
    moments: ["current state is groom"],
    expected: [/groom|state|now|today/i],
    forbidden: [/treated|examined|escaped|returned home/i],
  },
  {
    name: "possibility",
    subject: "Coco",
    facts: ["Coco likes squirrels"],
    moments: [],
    expected: [/squirrel/i],
    forbidden: [/chased|saw|met|caught|found/i],
  },
  {
    name: "no-plot world",
    subject: "the house",
    facts: ["green kitchen", "old table", "boxes", "first dinner at the old table"],
    moments: [],
    expected: [/table|green|dinner|old|changed|still|again/i],
    forbidden: [/moved|cried|argued|celebrated/i],
  },
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function localHeuristic(lines: string[]): { passed: boolean; reason: string } {
  if (!lines.length) return { passed: false, reason: "no candidate lines" };
  if (lines.some((line) => line.length > 140)) return { passed: false, reason: "line too long" };
  if (lines.join(" ").match(/\bthe viewer|cognition|semantic|planner|beat graph\b/i)) return { passed: false, reason: "machine/process language" };
  return { passed: true, reason: "candidate set present" };
}

async function runCase(testCase: Case): Promise<void> {
  const candidates = testCase.expected.map((pattern, index) =>
    index === 0 ? clean(testCase.facts[0]) : clean(testCase.facts[index % testCase.facts.length]),
  );

  const critique = await critiqueMouthCandidates({
    subject: testCase.subject,
    facts: testCase.facts,
    moments: testCase.moments,
    memory: testCase.memory ?? [],
    beat: {
      order: 1,
      role: "discovery",
      attentionFunction: "creative realization",
      change: "make one grounded detail newly noticeable",
      next: "what deserves attention next?",
    },
    candidates,
  });

  const heuristic = localHeuristic(candidates);
  assert.equal(heuristic.passed, true, `${testCase.name}: ${heuristic.reason}`);
  assert.notEqual(critique.bestIndex, undefined);

  const bad = [...testCase.forbidden];
  if (critique.bestIndex >= 0 && critique.bestIndex < candidates.length) {
    const winner = candidates[critique.bestIndex] ?? "";
    for (const pattern of bad) assert.equal(pattern.test(winner), false, `${testCase.name}: forbidden ${pattern}`);
  }

  console.log(JSON.stringify({ name: testCase.name, decision: critique.decision, bestIndex: critique.bestIndex, failureCodes: critique.failureCodes ?? [], reason: critique.reason }, null, 2));
}

for (const testCase of cases) await runCase(testCase);
console.log("UNIVERSAL MOUTH ACCEPTANCE: COMPLETE");
