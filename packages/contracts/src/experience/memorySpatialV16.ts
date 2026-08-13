/**
 * V16 UNIVERSAL SPATIAL MEMORY CONTRACT
 *
 * Physical location is an event property, not an identity property.
 * A person, couple, pet, object, vehicle, home, business, product, or event
 * can therefore accumulate a real-world trail without becoming "located" at
 * one permanent place.
 *
 * Coordinates are only populated when runtime/scan/location evidence supplies
 * them. Semantic places remain valid without GPS.
 */
import type { MemoryVisibility } from "./memoryContext.js";

export type MemoryGeoSourceV16 = "runtime" | "scan" | "location" | "import";

export type MemoryGeoPointV16 = {
  id: string;
  eventId: string;
  entityIds: string[];
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number;
  headingDegrees?: number;
  speedMps?: number;
  capturedAt: string;
  timezone?: string;
  placeName?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  source: MemoryGeoSourceV16;
  confidence: number;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemorySpatialTrailV16 = {
  id: string;
  entityIds: string[];
  pointIds: string[];
  originPointId: string;
  destinationPointId: string;
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  pointCount: number;
  confidence: number;
  visibility: MemoryVisibility;
  metadata?: Record<string, unknown>;
};

export type MemorySpatialRepeatV16 = {
  id: string;
  entityIds: string[];
  pointIds: string[];
  latitude: number;
  longitude: number;
  radiusMeters: number;
  occurrences: number;
  firstObservedAt: string;
  lastObservedAt: string;
  confidence: number;
  visibility: MemoryVisibility;
  placeName?: string;
};

export type MemorySpatialV16 = {
  points: MemoryGeoPointV16[];
  trails: MemorySpatialTrailV16[];
  repeatedSpots: MemorySpatialRepeatV16[];
};
