import assert from "node:assert/strict";
import { buildRealityModel, scoreRealityCoverage } from "../semantic/realityModel.js";

const cases = [
  {
    name: "Rave memory",
    prompt: "Make a wild rave memory about the warehouse, the bass, the lights, and the moment the whole crowd started dancing together.",
    realization: "The warehouse filled with bass and lights until the whole crowd started dancing together.",
    expected: ["warehouse", "bass", "lights", "crowd", "dancing together"],
  },
  {
    name: "Birthday",
    prompt: "Make a funny birthday story from everyone arriving, the cake coming out, the surprise, the laughter, and the end of the night.",
    realization: "Everyone arrived, the cake came out, the surprise landed, laughter took over, and the night finally ended.",
    expected: ["everyone arriving", "cake coming out", "surprise", "laughter", "end of the night"],
  },
  {
    name: "Coco grooming",
    prompt: "Make a funny dog groomer story about Coco to send to the client. Show Coco arriving, getting groomed, looking great, and being ready to go home.",
    realization: "Coco arrived, got groomed, looked great, and was ready to go home.",
    expected: ["Coco arriving", "getting groomed", "looking great", "ready to go home"],
  },
];

for (const test of cases) {
  const model = buildRealityModel(test.prompt);

  assert.equal(model.invariants.preserveObservedEvidence, true, `${test.name}: conservation invariant missing`);
  assert.ok(model.sequence.length >= 2, `${test.name}: reality collapsed into a single beat`);
  assert.ok(model.conservedAtomIds.length === model.sequence.length, `${test.name}: not every reality beat was conserved`);

  const coverage = scoreRealityCoverage(model, test.realization);
  assert.ok(coverage >= 0.8, `${test.name}: reality coverage ${(coverage * 100).toFixed(0)}%`);

  for (const expected of test.expected) {
    assert.ok(
      test.realization.toLowerCase().includes(expected.toLowerCase().replace("arriving", "arrived").replace("getting", "got").replace("looking", "looked")),
      `${test.name}: candidate lost concrete evidence: ${expected}`,
    );
  }

  console.log(`✓ ${test.name}: reality conserved at ${(coverage * 100).toFixed(0)}%`);
}

console.log("\n✓ JEKYLL REALITY MODEL ACCEPTANCE PASSED");
