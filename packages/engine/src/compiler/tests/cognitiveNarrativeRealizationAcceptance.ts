import assert from "node:assert/strict";

import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const cases = [
  {
    name: "adaptive scavenger hunt",
    prompt: "Build a romantic treasure hunt where each discovery changes the next clue.",
    required: ["romantic", "treasure", "hunt", "clue"],
  },
  {
    name: "grandmother watch",
    prompt: "Create a mysterious museum experience around the watch my grandmother gave me.",
    required: ["watch", "grandmother"],
  },
  {
    name: "outrageous nightclub",
    prompt: "Build a nightclub loyalty experience that becomes more outrageous every time someone returns.",
    required: ["nightclub", "loyalty", "outrageous"],
  },
  {
    name: "compound horror birthday",
    prompt: "Make a hilarious haunted-house birthday experience for Max the poodle where every visitor changes what happens next.",
    required: ["haunted", "birthday", "Max", "poodle"],
  },
];

const forbidden = [
  "make dog groomer story matter",
  "make luxury spa matter",
  "make haunted house matter",
  "make tattoo loyalty matter",
  "make birthday memory matter",
  "through memory",
  "scan →",
  "semantic directive",
  "compiler",
];

for (const testCase of cases) {
  const compiled = compileCognitiveExperience(testCase.prompt);
  const output = compiled.story.beats.map((beat) => beat.text).join(" ");
  const normalized = output.toLowerCase();

  assert.ok(compiled.story.beats.length > 0, `${testCase.name}: no story beats`);
  assert.ok(
    compiled.story.beats.every((beat) => beat.text.trim().length > 0),
    `${testCase.name}: empty narrative beat`,
  );

  for (const evidence of testCase.required) {
    assert.ok(
      normalized.includes(evidence.toLowerCase()),
      `${testCase.name}: narrative lost concrete evidence "${evidence}"`,
    );
  }

  for (const fragment of forbidden) {
    assert.ok(
      !normalized.includes(fragment.toLowerCase()),
      `${testCase.name}: compiler language leaked into narrative: "${fragment}"`,
    );
  }

  console.log(`✓ ${testCase.name}: semantic evidence realized as narrative language`);
}

console.log("✓ cognitive narrative realization acceptance passed");
