import { strict as assert } from "node:assert";

import { deriveGeoCognition } from "../../cognition/geoCognition.js";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { buildExperienceContextArtifacts } from "../../experience/contextArtifacts.js";
import { buildGeoStory } from "../../geo/geoStoryCompiler.js";

/**
 * UNIVERSAL GEO / COGNITIVE ACCEPTANCE
 *
 * Geo is a substrate, not a vertical.
 *
 * The prompt may describe a service, wedding, journey, business, object, or
 * anything else. QRE must preserve place/route/time meaning when present,
 * produce a semantic context when physical coordinates are absent, and use
 * real coordinates only when runtime context supplies them.
 */

const prompts = [
  {
    name: "service receipt",
    prompt: "Make a dog groomer story receipt about Coco to send to the client.",
    expectSemanticArtifact: true,
  },
  {
    name: "living wedding",
    prompt:
      "Make a wedding story with everyone involved, live locations, and a story that can continue. The ceremony is at The Glasshouse in Austin and the reception is at River Hall.",
    expectPlaces: ["The Glasshouse", "Austin", "River Hall"],
    expectIntentions: ["place_memory", "geographic_story"],
    expectSemanticArtifact: true,
  },
  {
    name: "arbitrary journey",
    prompt:
      "Create a journey from Cedar Hollow to Moonridge, 120 miles, Friday at 6pm, and keep future destinations open.",
    expectPlaces: ["Cedar Hollow", "Moonridge"],
    expectIntentions: ["route_memory", "travel_distance", "temporal_anchor", "future_destination"],
    expectSemanticArtifact: true,
  },
  {
    name: "arbitrary object",
    prompt:
      "Turn my old red bicycle into a funny interactive story that people can keep adding to.",
    expectSemanticArtifact: true,
  },
];

for (const probe of prompts) {
  const geo = deriveGeoCognition(probe.prompt);

  for (const place of probe.expectPlaces ?? []) {
    assert.ok(
      geo.places.some((candidate) => candidate.toLowerCase().includes(place.toLowerCase())),
      `${probe.name}: expected place evidence for ${place}; got ${geo.places.join(", ")}`,
    );
  }

  for (const intention of probe.expectIntentions ?? []) {
    assert.ok(
      geo.intentions.includes(intention),
      `${probe.name}: expected geo intention ${intention}; got ${geo.intentions.join(", ")}`,
    );
  }

  const compiled = compileCognitiveExperience(probe.prompt);
  const artifacts = buildExperienceContextArtifacts(probe.prompt, compiled);

  assert.ok(artifacts.geoStory, `${probe.name}: geo story missing`);
  assert.ok(artifacts.memorySnapshot, `${probe.name}: memory snapshot missing`);
  assert.ok(artifacts.geoStory.scenes.length > 0, `${probe.name}: semantic geo anchor missing`);

  if (probe.expectSemanticArtifact) {
    assert.equal(
      artifacts.geoStory.mode,
      "semantic",
      `${probe.name}: prompt-only geo must remain semantic; got ${artifacts.geoStory.mode}`,
    );

    for (const scene of artifacts.geoStory.scenes) {
      assert.equal(
        scene.evidenceMode,
        "semantic",
        `${probe.name}: prompt-only scene incorrectly claims physical evidence`,
      );
      assert.equal(
        scene.location,
        undefined,
        `${probe.name}: prompt-only geo fabricated physical coordinates`,
      );
    }
  }

  const storyText = compiled.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

  if (probe.name === "service receipt") {
    assert.match(storyText, /\bcoco\b/, "service receipt: concrete subject Coco was lost before realization");
  }

  console.log(`✓ ${probe.name}: cognition → semantic geo → memory artifact`);
}

const physicalPoint = {
  lat: 33.9533,
  lng: -117.3962,
  createdAt: new Date("2026-08-11T20:00:00.000Z"),
  label: "Client location",
  city: "Riverside",
  region: "CA",
  country: "US",
};

const physicalCompiled = compileCognitiveExperience(
  "Make a dog groomer story receipt about Coco to send to the client.",
);
const physicalArtifacts = buildExperienceContextArtifacts(
  "Make a dog groomer story receipt about Coco to send to the client.",
  physicalCompiled,
  { assetId: "geo-test", sessionId: "session-1", physicalPoint },
);

assert.equal(physicalArtifacts.geoStory.mode, "physical");
assert.ok(
  physicalArtifacts.geoStory.scenes.some(
    (scene) => scene.location?.lat === physicalPoint.lat && scene.location?.lng === physicalPoint.lng,
  ),
  "runtime location was not propagated into physical geo story",
);

const continued = buildGeoStory(
  "geo-test",
  [
    physicalPoint,
    {
      ...physicalPoint,
      lat: 34.0522,
      lng: -118.2437,
      createdAt: new Date("2026-08-11T21:00:00.000Z"),
      label: "Second client location",
      city: "Los Angeles",
    },
  ],
  { sessionId: "session-1", title: "Coco's Grooming Receipt" },
);

assert.equal(continued.mode, "physical");
assert.ok(continued.scenes.length >= 4, "continued physical journey did not accumulate locations");
assert.deepEqual(continued.placeTags, ["Client location", "Second client location"]);

console.log("✓ physical geo accepts real runtime coordinates and accumulates continuation");
console.log("✓ Universal Geo/Cognition acceptance passed.");
