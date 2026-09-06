/*
 * QRE AUTHOR READOUT ACCEPTANCE
 *
 * Readout is a deterministic factual projection. It must not call an LLM.
 * The creative Author is tested separately downstream.
 */
import assert from "node:assert/strict";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorReadout } from "./src/services/authorReadout.js";

function subjectParts(subject: string): string[] {
  return subject.split(/[+&,/]|\band\b/i).map((value) => value.trim()).filter(Boolean);
}

const cases = [
  {
    name: "CAT WATCHES HOUSEKEEPER",
    subject: "Maria",
    facts: ["Maria cleaned the kitchen", "Maria felt watched", "Maria cleaned one bathroom", "a cat appeared", "Maria knew the cat was watching her"],
    expected: ["cleaned the kitchen", "felt watched", "cleaned one bathroom", "a cat appeared", "knew the cat was watching her"],
  },
  {
    name: "RESTAURANT STRANGE BUT ROMANTIC",
    subject: "Alex + Sam",
    facts: ["the restaurant was closed", "the lights were off", "chairs were on the ceiling", "Alex and Sam were together"],
    expected: ["the restaurant was closed", "the lights were off", "chairs were on the ceiling", "together"],
  },
  {
    name: "PAUL MEMORY",
    subject: "Paul",
    facts: ["Paul loved old records", "Paul kept every birthday card", "Paul played the same song every Sunday", "Paul is gone"],
    expected: ["loved old records", "kept every birthday card", "played the same song every Sunday", "gone"],
  },
];

for (const testCase of cases) {
  const graph = buildAuthorRealityGraph({ prompt: testCase.facts.join(". "), subject: testCase.subject, facts: testCase.facts, sourceMoments: [], memoryContext: [], trajectory: [] });
  const readout = buildAuthorReadout({ graph, subject: testCase.subject });
  const parts = subjectParts(testCase.subject).map((part) => part.toLowerCase());

  console.log("\n=== " + testCase.name + " ===");
  console.log("SUBJECT:", readout.subject);
  console.log("READOUT:");
  console.log(readout.text);

  assert.equal(readout.eventIds.length, graph.events.length, "Readout must preserve event identity");
  assert.equal(readout.lines.length, graph.events.length, "Readout must project every supplied event");
  assert.deepEqual(readout.lines.map((line) => line.replace(/^\d[^—]*—\s*/, "")), testCase.expected, "Readout should use natural subject-sparse event beats");
  assert.doesNotMatch(readout.text, /\b(?:mission|boss|speedrun|movie|story|plot|journey|audience|viewer|interesting|meaningful|romantic|beautiful|magical)\b/i, "Readout leaked creative interpretation");
  assert.ok(readout.lines.every((line) => !/^\s*(?:movie|story|plot|mission|frame|lens)\s*:/i.test(line)), "Readout contains creative metadata");
  assert.ok(readout.lines.every((line) => !parts.some((part) => line.toLowerCase().startsWith(part + " ") || line.toLowerCase() === part)), "Readout repeats the subject inside event lines");
}

console.log("\nAUTHOR READOUT ACCEPTANCE: COMPLETE");
