import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { buildExperienceContextArtifacts } from "../../experience/contextArtifacts.js";

const probes = [
  {
    name: "wedding geo memory",
    prompt: "Jane and Joe married at Long Beach Pier Jan 1, 1999. Their bridesmaid was sad 100000 miles away in Long Beach.",
    mustContain: ["Long Beach", "Jan 1, 1999", "100000 miles"],
  },
  {
    name: "rave journey",
    prompt: "We went to the Insomniac rave Friday July 1, dropped a pin, and traveled 188 miles from here to the rave in Japan.",
    mustContain: ["Japan", "188 miles"],
  },
  {
    name: "service location",
    prompt: "The housekeeper dropped a pin at the client's home and recorded the time after cleaning the kitchen and living room.",
    mustContain: ["client", "home"],
  },
  {
    name: "future travel",
    prompt: "Remember all the places this couple has traveled and the places they want to travel to next, then keep the destinations as a do-list.",
    mustContain: ["destinations", "future_destination"],
  },
];

for (const probe of probes) {
  const compiled = compileCognitiveExperience(probe.prompt);
  const { geoStory, memorySnapshot } = buildExperienceContextArtifacts(probe.prompt, compiled);
  const planGeo = compiled.cognition.plan.geographicModel.join(" ").toLowerCase();
  const artifactText = [
    geoStory.summary,
    ...geoStory.scenes.map((scene) => `${scene.title} ${scene.description} ${JSON.stringify(scene.meta ?? {})}`),
    memorySnapshot.summary,
    ...memorySnapshot.highlights,
  ].join(" ").toLowerCase();

  for (const anchor of probe.mustContain) {
    const normalized = anchor.toLowerCase();
    assert.ok(
      planGeo.includes(normalized) || artifactText.includes(normalized),
      `${probe.name}: geo evidence '${anchor}' did not survive cognition/context artifacts`,
    );
  }

  assert.ok(compiled.cognition.geographicOpportunities.length > 0, `${probe.name}: no geographic opportunities`);
  assert.ok(geoStory.scenes.length > 0, `${probe.name}: no geo scenes`);
  assert.ok(memorySnapshot.geoSceneIds?.length === geoStory.scenes.length, `${probe.name}: memory/geo linkage drift`);

  console.log(`\n=== ${probe.name} ===`);
  console.log(compiled.story.beats.map((beat) => `${beat.kind}: ${beat.text}`).join("\n"));
  console.log("GEO:", geoStory.scenes.map((scene) => `${scene.type}: ${scene.title} — ${scene.description}`).join(" | "));
  console.log("MEMORY:", memorySnapshot.highlights.join(" | "));
}

console.log("✓ Geo cognition + rendered story acceptance passed.");
