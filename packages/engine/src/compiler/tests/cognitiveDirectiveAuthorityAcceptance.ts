import assert from "node:assert/strict";

import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const cases = [
  {
    name: "dog grooming",
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    required: ["Max", "poodle"],
  },
  {
    name: "luxury spa",
    prompt: "Create an absurd luxury spa experience for a billionaire.",
    required: ["luxury", "spa", "billionaire"],
  },
  {
    name: "haunted house",
    prompt: "Make a genuinely terrifying haunted-house experience.",
    required: ["terrifying", "haunted"],
  },
  {
    name: "tattoo loyalty",
    prompt: "Build a tattoo-shop loyalty experience that remembers every visit.",
    required: ["tattoo", "loyalty"],
  },
  {
    name: "birthday memory",
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    required: ["birthday", "family"],
  },
];

for (const testCase of cases) {
  const compiled = compileCognitiveExperience(testCase.prompt);
  const directives = compiled.cognition.plan.realization?.directives ?? [];

  assert.ok(directives.length > 0, `${testCase.name}: no cognitive directives`);
  assert.equal(
    directives.length,
    compiled.story.beats.length,
    `${testCase.name}: directive/beat count drift`,
  );

  for (const beat of compiled.story.beats) {
    assert.ok(beat.directive, `${testCase.name}: ${beat.kind} lost its directive`);
    assert.equal(
      beat.directive?.kind,
      beat.kind,
      `${testCase.name}: directive kind drifted on ${beat.kind}`,
    );
    assert.ok(
      beat.directive?.action,
      `${testCase.name}: ${beat.kind} has no semantic action`,
    );
    assert.ok(
      beat.directive?.stateBefore,
      `${testCase.name}: ${beat.kind} has no stateBefore`,
    );
    assert.ok(
      beat.directive?.stateAfter,
      `${testCase.name}: ${beat.kind} has no stateAfter`,
    );
  }

  const output = compiled.story.beats
    .map((beat) => beat.text)
    .join(" ")
    .toLowerCase();

  for (const evidence of testCase.required) {
    assert.ok(
      output.includes(evidence.toLowerCase()),
      `${testCase.name}: final story lost concrete evidence "${evidence}"`,
    );
  }

  const transformationBeat = compiled.story.beats.find(
    (beat) => beat.kind === "transformation",
  );

  if (transformationBeat) {
    assert.ok(
      transformationBeat.directive?.stateBefore,
      `${testCase.name}: transformation lacks stateBefore`,
    );
    assert.ok(
      transformationBeat.directive?.stateAfter,
      `${testCase.name}: transformation lacks stateAfter`,
    );
  }

  console.log(`✓ ${testCase.name}: directive authority + evidence conservation`);
}

console.log("✓ cognitive directive authority acceptance passed");
