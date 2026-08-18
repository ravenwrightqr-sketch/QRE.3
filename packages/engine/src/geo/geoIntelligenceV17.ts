import type {
  GeoEvidenceSourceV17,
  GeoObservationV17,
  GeoPermissionV17,
  GeoQualityV17,
  GeoSegmentV17,
  GeoSpatialIntelligenceV17,
  GeoVisibilityV17,
} from "@qre/contracts";

const EARTH_RADIUS_METERS = 6_371_008.8;
const EPSILON = 1e-9;

export type GeoObservationInputV17 = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  altitudeMeters?: number | null;
  altitudeAccuracyMeters?: number | null;
  headingDegrees?: number | null;
  speedMps?: number | null;
  capturedAt: string | Date;
  timezone?: string | null;
  source?: GeoEvidenceSourceV17;
  permission?: GeoPermissionV17;
  confidence?: number | null;
  visibility?: GeoObservationV17["visibility"];
  outputVisibility?: GeoVisibilityV17;
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

export type GeoIntelligenceOptionsV17 = {
  repeatRadiusMeters?: number;
  maxRepeatRadiusMeters?: number;
  stationaryDistanceMeters?: number;
  rapidJumpSpeedMps?: number;
  teleportSpeedMps?: number;
  minimumAccuracyConfidence?: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidCoordinateV17(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function haversineDistanceMetersV17(
  a: Pick<GeoObservationInputV17, "latitude" | "longitude">,
  b: Pick<GeoObservationInputV17, "latitude" | "longitude">,
): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function initialBearingDegreesV17(
  a: Pick<GeoObservationInputV17, "latitude" | "longitude">,
  b: Pick<GeoObservationInputV17, "latitude" | "longitude">,
): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  return angle >= 0 ? angle : angle + 360;
}

function qualityForAccuracy(accuracyMeters: number | null): GeoQualityV17 {
  if (accuracyMeters === null) return "usable";
  if (accuracyMeters <= 10) return "excellent";
  if (accuracyMeters <= 50) return "good";
  if (accuracyMeters <= 200) return "usable";
  return "poor";
}

function confidenceForObservation(
  accuracyMeters: number | null,
  supplied: number | null | undefined,
  minimumAccuracyConfidence: number,
): number {
  const accuracyConfidence = accuracyMeters === null
    ? minimumAccuracyConfidence
    : clamp01(1 / Math.max(1, accuracyMeters / 10));
  return Number(clamp01(accuracyConfidence * 0.7 + (supplied ?? 1) * 0.3).toFixed(3));
}

function normalizeTimestamp(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid geo capture timestamp.");
  return date.toISOString();
}

export function normalizeGeoObservationV17(
  input: GeoObservationInputV17,
  options: GeoIntelligenceOptionsV17 = {},
): GeoObservationV17 {
  if (!isValidCoordinateV17(input.latitude, input.longitude)) throw new Error("Invalid geographic coordinates.");

  const accuracy = finite(input.accuracyMeters) && input.accuracyMeters! >= 0 ? input.accuracyMeters! : null;
  const speed = finite(input.speedMps) && input.speedMps! >= 0 ? input.speedMps! : null;
  const heading = finite(input.headingDegrees) ? ((input.headingDegrees! % 360) + 360) % 360 : null;

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    accuracyMeters: accuracy,
    altitudeMeters: finite(input.altitudeMeters) ? input.altitudeMeters : null,
    altitudeAccuracyMeters: finite(input.altitudeAccuracyMeters) ? input.altitudeAccuracyMeters : null,
    headingDegrees: heading,
    speedMps: speed,
    capturedAt: normalizeTimestamp(input.capturedAt),
    timezone: input.timezone ?? null,
    source: input.source ?? "runtime",
    permission: input.permission ?? "not_applicable",
    confidence: confidenceForObservation(accuracy, input.confidence, options.minimumAccuracyConfidence ?? 0.35),
    quality: qualityForAccuracy(accuracy),
    visibility: input.visibility ?? "private",
    outputVisibility: input.outputVisibility ?? "precise",
    placeName: input.placeName ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    region: input.region ?? null,
    country: input.country ?? null,
    entityIds: [...new Set(input.entityIds ?? [])],
    sessionId: input.sessionId ?? null,
    sourceRef: input.sourceRef ?? null,
    metadata: input.metadata,
  };
}

function effectiveRadius(a: GeoObservationV17, b: GeoObservationV17, configured: number): number {
  const accuracyA = a.accuracyMeters ?? configured;
  const accuracyB = b.accuracyMeters ?? configured;
  return Math.min(Math.max(configured, accuracyA, accuracyB), 500);
}

function secondsBetween(a: string, b: string): number {
  return Math.max(0, (Date.parse(b) - Date.parse(a)) / 1000);
}

function ordered(points: GeoObservationV17[]): GeoObservationV17[] {
  return points.slice().sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

function buildSegments(points: GeoObservationV17[], options: GeoIntelligenceOptionsV17): GeoSegmentV17[] {
  const segments: GeoSegmentV17[] = [];
  const stationaryDistance = options.stationaryDistanceMeters ?? 25;
  const rapidJump = options.rapidJumpSpeedMps ?? 55;
  const teleport = options.teleportSpeedMps ?? 120;

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const distance = haversineDistanceMetersV17(previous, current);
    const elapsed = secondsBetween(previous.capturedAt, current.capturedAt);
    const averageSpeed = elapsed > EPSILON ? distance / elapsed : null;
    const bearing = distance > stationaryDistance ? initialBearingDegreesV17(previous, current) : null;
    const confidence = Number(clamp01(Math.min(previous.confidence, current.confidence) * (elapsed > 0 ? 1 : 0.6)).toFixed(3));

    let relation: GeoSegmentV17["relation"] = "moved";
    if (distance <= stationaryDistance) relation = "stationary";
    else if ((averageSpeed ?? 0) >= teleport) relation = "teleport_suspect";
    else if ((averageSpeed ?? 0) >= rapidJump) relation = "rapid_jump";

    segments.push({
      id: `geo-segment-${i}`,
      originPointIndex: i - 1,
      destinationPointIndex: i,
      distanceMeters: Number(distance.toFixed(2)),
      elapsedSeconds: Number(elapsed.toFixed(2)),
      averageSpeedMps: averageSpeed === null ? null : Number(averageSpeed.toFixed(3)),
      bearingDegrees: bearing === null ? null : Number(bearing.toFixed(2)),
      confidence,
      relation,
    });
  }
  return segments;
}

function buildRepeats(points: GeoObservationV17[], options: GeoIntelligenceOptionsV17): GeoSpatialIntelligenceV17["repeatedSpots"] {
  const baseRadius = options.repeatRadiusMeters ?? 75;
  const maxRadius = options.maxRepeatRadiusMeters ?? 250;
  const clusters: Array<{ indices: number[]; centroidLat: number; centroidLng: number }> = [];

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    let selected: (typeof clusters)[number] | undefined;

    for (const cluster of clusters) {
      const representative = points[cluster.indices[0]];
      const radius = Math.min(effectiveRadius(point, representative, baseRadius), maxRadius);
      if (haversineDistanceMetersV17(point, representative) <= radius) {
        selected = cluster;
        break;
      }
    }

    if (!selected) {
      clusters.push({ indices: [i], centroidLat: point.latitude, centroidLng: point.longitude });
      continue;
    }

    selected.indices.push(i);
    const count = selected.indices.length;
    selected.centroidLat += (point.latitude - selected.centroidLat) / count;
    selected.centroidLng += (point.longitude - selected.centroidLng) / count;
  }

  return clusters.filter((cluster) => cluster.indices.length >= 2).map((cluster, index) => {
    const first = points[cluster.indices[0]];
    const last = points[cluster.indices[cluster.indices.length - 1]];
    const radius = Math.min(maxRadius, Math.max(baseRadius, ...cluster.indices.map((pointIndex) => haversineDistanceMetersV17(points[pointIndex], { latitude: cluster.centroidLat, longitude: cluster.centroidLng }))));
    return {
      id: `geo-repeat-${index + 1}`,
      pointIndices: cluster.indices,
      latitude: Number(cluster.centroidLat.toFixed(7)),
      longitude: Number(cluster.centroidLng.toFixed(7)),
      radiusMeters: Number(radius.toFixed(2)),
      occurrences: cluster.indices.length,
      firstObservedAt: first.capturedAt,
      lastObservedAt: last.capturedAt,
      confidence: Number(clamp01(cluster.indices.reduce((sum, pointIndex) => sum + points[pointIndex].confidence, 0) / cluster.indices.length).toFixed(3)),
      placeName: first.placeName ?? null,
    };
  });
}

function buildRelations(
  points: GeoObservationV17[],
  segments: GeoSegmentV17[],
  repeats: GeoSpatialIntelligenceV17["repeatedSpots"],
): GeoSpatialIntelligenceV17["relations"] {
  const relations: GeoSpatialIntelligenceV17["relations"] = [];

  for (const repeat of repeats) {
    for (let i = 1; i < repeat.pointIndices.length; i += 1) {
      const fromIndex = repeat.pointIndices[i - 1];
      const toIndex = repeat.pointIndices[i];
      relations.push({
        id: `geo-relation-repeat-${fromIndex}-${toIndex}`,
        fromPointIndex: fromIndex,
        toPointIndex: toIndex,
        kind: "returned",
        distanceMeters: Number(haversineDistanceMetersV17(points[fromIndex], points[toIndex]).toFixed(2)),
        confidence: repeat.confidence,
        derived: true,
      });
    }
  }

  for (const segment of segments) {
    const kind = segment.relation === "teleport_suspect"
      ? "teleport_suspect"
      : segment.relation === "rapid_jump"
        ? "rapid_jump"
        : segment.relation === "stationary"
          ? "same_place"
          : "moved";
    relations.push({
      id: `geo-relation-${segment.id}`,
      fromPointIndex: segment.originPointIndex,
      toPointIndex: segment.destinationPointIndex,
      kind,
      distanceMeters: segment.distanceMeters,
      confidence: segment.confidence,
      derived: true,
    });
  }
  return relations;
}

export function buildGeoSpatialIntelligenceV17(
  rawPoints: readonly GeoObservationInputV17[],
  options: GeoIntelligenceOptionsV17 = {},
): GeoSpatialIntelligenceV17 {
  const points = ordered(rawPoints.map((point) => normalizeGeoObservationV17(point, options)));
  if (!points.length) {
    return { points: [], segments: [], repeatedSpots: [], relations: [], totalDistanceMeters: 0, locationCount: 0, quality: "usable" };
  }

  const segments = buildSegments(points, options);
  const repeatedSpots = buildRepeats(points, options);
  const relations = buildRelations(points, segments, repeatedSpots);
  const totalDistanceMeters = segments.reduce((sum, segment) => sum + segment.distanceMeters, 0);
  const qualityRank: Record<GeoQualityV17, number> = { excellent: 5, good: 4, usable: 3, poor: 2, invalid: 1 };
  const quality = points.reduce<GeoQualityV17>((worst, point) => qualityRank[point.quality] < qualityRank[worst] ? point.quality : worst, "excellent");

  return {
    points,
    segments,
    repeatedSpots,
    relations,
    totalDistanceMeters: Number(totalDistanceMeters.toFixed(2)),
    firstCapturedAt: points[0].capturedAt,
    lastCapturedAt: points[points.length - 1].capturedAt,
    locationCount: repeatedSpots.length + points.filter((point, index) => index === 0 || haversineDistanceMetersV17(points[index - 1], point) > (options.stationaryDistanceMeters ?? 25)).length,
    quality,
  };
}

export function redactGeoObservationV17(
  point: GeoObservationV17,
  visibility: GeoVisibilityV17,
): Pick<GeoObservationV17, "latitude" | "longitude" | "city" | "region" | "country" | "placeName" | "capturedAt"> {
  if (visibility === "exact") {
    return { latitude: point.latitude, longitude: point.longitude, city: point.city, region: point.region, country: point.country, placeName: point.placeName, capturedAt: point.capturedAt };
  }

  const digits = visibility === "precise" ? 3 : visibility === "neighborhood" ? 2 : visibility === "city" ? 1 : visibility === "region" ? 0 : -1;
  if (digits < 0) {
    return { latitude: 0, longitude: 0, city: null, region: null, country: point.country, placeName: null, capturedAt: point.capturedAt };
  }

  const factor = 10 ** digits;
  return {
    latitude: Number((Math.round(point.latitude * factor) / factor).toFixed(Math.max(0, digits))),
    longitude: Number((Math.round(point.longitude * factor) / factor).toFixed(Math.max(0, digits))),
    city: visibility === "city" || visibility === "region" || visibility === "country" ? point.city : null,
    region: visibility === "region" || visibility === "country" ? point.region : null,
    country: point.country,
    placeName: visibility === "city" ? point.placeName : null,
    capturedAt: point.capturedAt,
  };
}
