/**
 * =====================================================
 * QRE RUNTIME PROJECTION BOUNDARY
 * =====================================================
 *
 * Runtime projection is intentionally split into independent artifacts:
 *
 *   runtime state → GeoStory
 *   runtime state → MemorySnapshot
 *
 * Geo and memory do NOT depend on each other for orchestration.
 * Callers may use either projection independently and may add new
 * runtime artifacts without rebuilding this layer.
 *
 * NO DATABASE
 * NO PRISMA
 * NO PERSISTENCE
 * NO API RESPONSE LOGIC
 *
 * =====================================================
 */

import {
  buildGeoStory,
  type GeoPoint,
} from "../geo/geoStoryCompiler.js";

import {
  buildMemorySnapshot,
} from "../geo/buildMemorySnapshot.js";

import type {
  CinematicScene,
  ExperienceMoment,
  GeoStory,
  MemorySnapshot,
} from "@qre/contracts";

export type GeoProjectionInput = {
  assetId: string;
  geoPoints: GeoPoint[];
};

export type MemoryProjectionInput = {
  assetId: string;
  moments: ExperienceMoment[];
  geoStory?: GeoStory | null;
  cinematicScenes: CinematicScene[];
};

/**
 * Build only the geographic artifact.
 *
 * GeoStory is contextual evidence. It is not memory and does not imply
 * persistence or ownership.
 */
export function projectGeoStory(
  input: GeoProjectionInput,
): GeoStory {
  return buildGeoStory(input.assetId, input.geoPoints);
}

/**
 * Build only the memory artifact.
 *
 * The caller decides whether creation is permitted. This function itself
 * never performs persistence.
 */
export function projectMemorySnapshot(
  input: MemoryProjectionInput,
): MemorySnapshot {
  return buildMemorySnapshot({
    assetId: input.assetId,
    moments: input.moments,
    geoStory: input.geoStory ?? null,
    cinematicScenes: input.cinematicScenes,
  });
}

/**
 * Backward-compatible composition helper.
 *
 * New code should call projectGeoStory() and projectMemorySnapshot()
 * independently so the two artifacts remain replaceable.
 */
export type RuntimeProjectionInput = {
  assetId: string;
  geoPoints: GeoPoint[];
  moments: ExperienceMoment[];
  cinematicScenes: CinematicScene[];
  createMemory: boolean;
};

export type RuntimeProjection = {
  geoStory: GeoStory;
  memorySnapshot: MemorySnapshot | null;
};

export function projectRuntime(
  input: RuntimeProjectionInput,
): RuntimeProjection {
  const geoStory = projectGeoStory({
    assetId: input.assetId,
    geoPoints: input.geoPoints,
  });

  const memorySnapshot = input.createMemory
    ? projectMemorySnapshot({
        assetId: input.assetId,
        moments: input.moments,
        geoStory,
        cinematicScenes: input.cinematicScenes,
      })
    : null;

  return { geoStory, memorySnapshot };
}
