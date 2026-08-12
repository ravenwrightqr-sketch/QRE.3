import type { GeoStory, MemorySnapshot } from "@qre/contracts";
import { deriveGeoCognition } from "../cognition/geoCognition.js";
import { buildGeoStory, type GeoPoint, type SemanticGeoPlace } from "../geo/geoStoryCompiler.js";
import { buildMemorySnapshot } from "../geo/buildMemorySnapshot.js";
import type { CognitiveCompiledExperience } from "./cognitiveExperienceCompiler.js";

export type ExperienceContextArtifacts = {
  geoStory: GeoStory;
  memorySnapshot: MemorySnapshot;
};

function semanticPlaces(prompt: string, compiled: CognitiveCompiledExperience): SemanticGeoPlace[] {
  const entities = compiled.cognition.entities;
  const geo = deriveGeoCognition(prompt);
  const places: SemanticGeoPlace[] = [];

  for (const label of entities.places ?? []) {
    places.push({
      label,
      kind: "place",
      evidence: [`named place preserved from cognition: ${label}`],
      intensity: 0.82,
    });
  }

  for (const place of geo.places) {
    if (!places.some((item) => item.label.toLowerCase() === place.toLowerCase())) {
      places.push({
        label: place,
        kind: "prompt_place",
        evidence: [`named place preserved from prompt: ${place}`],
        intensity: 0.84,
      });
    }
  }

  for (const route of geo.routes) {
    places.push({
      label: route,
      kind: "route",
      evidence: [`route preserved from prompt: ${route}`],
      intensity: 0.9,
      meta: { route, people: geo.people },
    });
  }

  for (const distance of geo.distances) {
    places.push({
      label: distance,
      kind: "distance",
      evidence: [`distance preserved from prompt: ${distance}`],
      intensity: 0.76,
      meta: { distance, routes: geo.routes },
    });
  }

  for (const destination of geo.destinations) {
    places.push({
      label: destination,
      kind: "future_destination",
      evidence: [`future destination preserved from prompt: ${destination}`],
      intensity: 0.88,
      meta: { destination, intention: "future_destination" },
    });
  }

  if (places.length) return places;

  const anchor =
    compiled.situation.setting[0] ??
    compiled.observation.activity ??
    compiled.observation.subject ??
    "experience";

  return [{
    label: anchor,
    kind: "experience_anchor",
    evidence: [compiled.observation.prompt],
    intensity: 0.35,
    meta: {
      people: geo.people,
      dates: geo.dates,
      times: geo.times,
      intentions: geo.intentions,
    },
  }];
}

/**
 * Universal context artifact boundary.
 * Every prompt gets a geo narrative and memory snapshot. Physical coordinates
 * are used only when actually supplied; otherwise geo remains explicitly
 * semantic rather than inventing a location.
 */
export function buildExperienceContextArtifacts(
  prompt: string,
  compiled: CognitiveCompiledExperience,
  input: {
    assetId?: string;
    sessionId?: string;
    physicalPoint?: GeoPoint;
  } = {},
): ExperienceContextArtifacts {
  const entities = compiled.cognition.entities;
  const entityValues = [
    ...(entities.people ?? []),
    ...(entities.places ?? []),
    ...(entities.events ?? []),
    ...(entities.products ?? []),
    ...(entities.organizations ?? []),
  ];
  const themes = [
    ...compiled.cognition.emotionalIntent,
    ...compiled.cognition.affordances,
    ...compiled.cognition.plan.futureEvolution,
    ...compiled.cognition.plan.geographicModel,
  ];

  const physicalPoints = input.physicalPoint ? [input.physicalPoint] : [];
  const semantic = semanticPlaces(prompt, compiled);
  const geo = deriveGeoCognition(prompt);

  const geoStory = buildGeoStory(input.assetId ?? "preview", physicalPoints, {
    sessionId: input.sessionId,
    semanticPlaces: semantic,
    title: compiled.title,
    summary: geo.places.length || geo.routes.length || geo.distances.length || geo.destinations.length
      ? `Geographic story anchored by ${[...geo.places, ...geo.routes, ...geo.distances, ...geo.destinations].slice(0, 5).join(", ")}.`
      : `Place and event context for ${compiled.title}.`,
  });

  const memorySnapshot = buildMemorySnapshot({
    assetId: input.assetId,
    sessionId: input.sessionId,
    prompt,
    moments: compiled.moments,
    geoStory,
    cinematicScenes: compiled.cinematicScenes,
    entities: entityValues,
    themes,
    source: "prompt",
    observedAt: input.physicalPoint?.createdAt?.toISOString(),
  });

  return { geoStory, memorySnapshot };
}
