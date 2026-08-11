import type { GeoStory, MemorySnapshot } from "@qre/contracts";
import { buildGeoStory } from "../geo/geoStoryCompiler.js";
import { buildMemorySnapshot } from "../geo/buildMemorySnapshot.js";
import type { CognitiveCompiledExperience } from "./cognitiveExperienceCompiler.js";

export type ExperienceContextArtifacts = {
  geoStory: GeoStory;
  memorySnapshot: MemorySnapshot;
};

function semanticPlaces(compiled: CognitiveCompiledExperience) {
  const entities = compiled.cognition.entities;
  return [
    ...(entities.places ?? []).map((label) => ({ label, kind: "place", evidence: [label] })),
    ...(entities.events ?? []).map((label) => ({ label, kind: "event", evidence: [label] })),
  ];
}

/**
 * Universal context artifact boundary.
 *
 * Every prompt gets a geo narrative and memory snapshot. Physical coordinates
 * are used only when actually supplied; otherwise geo remains semantic rather
 * than inventing a location.
 */
export function buildExperienceContextArtifacts(
  prompt: string,
  compiled: CognitiveCompiledExperience,
  input: { assetId?: string; sessionId?: string } = {},
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
  ];

  const geoStory = buildGeoStory(input.assetId ?? "preview", [], {
    sessionId: input.sessionId,
    semanticPlaces: semanticPlaces(compiled),
    title: compiled.title,
    summary: `Place and event context for ${compiled.title}.`,
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
  });

  return { geoStory, memorySnapshot };
}
