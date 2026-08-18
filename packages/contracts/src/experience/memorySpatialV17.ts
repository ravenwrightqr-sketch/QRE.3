/**
 * QRE V17 ENTERPRISE SPATIAL EVIDENCE CONTRACT
 *
 * Coordinates are evidence. Derived geography is explicitly marked as derived.
 * Raw precision, capture quality, provenance, and visibility remain attached so
 * cognition can use location without turning inference into fact.
 */
import type { MemoryVisibility } from "./memoryContext.js";

export type GeoEvidenceSourceV17 =
  | "runtime"
  | "scan"
  | "location"
  | "import"
  | "user_pin"
  | "system";

export type GeoPermissionV17 =
  | "granted"
  | "denied"
  | "prompt"
  | "unknown"
  | "not_applicable";

export type GeoQualityV17 =
  | "excellent"
  | "good"
  | "usable"
  | "poor"
  | "invalid";

export type GeoVisibilityV17 =
  | "exact"
  | "precise"
  | "neighborhood"
  | "city"
  | "region"
  | "country";

export type GeoObservationV17 = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  altitudeMeters?: number | null;
  altitudeAccuracyMeters?: number | null;
  headingDegrees?: number | null;
  speedMps?: number | null;
  capturedAt: string;
  timezone?: string | null;
  source: GeoEvidenceSourceV17;
  permission: GeoPermissionV17;
  confidence: number;
  quality: GeoQualityV17;
  visibility: MemoryVisibility;
  outputVisibility: GeoVisibilityV17;
  placeName?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  entityIds?: string[];
  sessionId?: string | null;
  sourceRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type GeoSegmentV17 = {
  id: string;
  originPointIndex: number;
  destinationPointIndex: number;
  distanceMeters: number;
  elapsedSeconds: number;
  averageSpeedMps: number | null;
  bearingDegrees: number | null;
  confidence: number;
  relation:
    | "stationary"
    | "moved"
    | "returned"
    | "rapid_jump"
    | "teleport_suspect";
};

export type GeoRepeatV17 = {
  id: string;
  pointIndices: number[];
  latitude: number;
  longitude: number;
  radiusMeters: number;
  occurrences: number;
  firstObservedAt: string;
  lastObservedAt: string;
  confidence: number;
  placeName?: string | null;
};

export type GeoRelationV17 = {
  id: string;
  fromPointIndex: number;
  toPointIndex: number;
  kind:
    | "same_place"
    | "nearby"
    | "arrived"
    | "departed"
    | "returned"
    | "moved"
    | "rapid_jump"
    | "teleport_suspect";
  distanceMeters: number;
  confidence: number;
  derived: true;
};

export type GeoSpatialIntelligenceV17 = {
  points: GeoObservationV17[];
  segments: GeoSegmentV17[];
  repeatedSpots: GeoRepeatV17[];
  relations: GeoRelationV17[];
  totalDistanceMeters: number;
  firstCapturedAt?: string;
  lastCapturedAt?: string;
  locationCount: number;
  quality: GeoQualityV17;
};
