import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { buildExperienceContextArtifacts } from "../../experience/contextArtifacts.js";

const prompts = [
  "Preserve our wedding night as a living memory everyone can revisit.",
  "Make a rave experience that feels like the night is still alive.",
  "Turn a house cleaning into a memorable experience for the client.",
  "Build a business experience that gives customers a reason to return.",
  "Create a memory of the trip through the places we visited.",
  "Make this strange object feel important and worth exploring.",
];

for (const prompt of prompts) {
  const compiled = compileCognitiveExperience(prompt);
  const { geoStory, memorySnapshot } = buildExperienceContextArtifacts(prompt, compiled);

  assert.ok(memorySnapshot, `memory snapshot missing: ${prompt}`);
  assert.ok(memorySnapshot.summary.length > 0, `memory summary empty: ${prompt}`);
  assert.ok(memorySnapshot.type, `memory type missing: ${prompt}`);
  assert.ok(geoStory, `geo story missing: ${prompt}`);
  assert.ok(geoStory.mode, `geo mode missing: ${prompt}`);
  assert.ok(Array.isArray(geoStory.scenes), `geo scenes missing: ${prompt}`);
  assert.ok(memorySnapshot.geoSceneIds?.length === geoStory.scenes.length, `memory/geo linkage mismatch: ${prompt}`);
}

console.log(`context artifact acceptance passed for ${prompts.length} universal prompts`);
