import type {
  MemoryContext,
  MemoryGeoContextV16,
  MemoryGeoPointV16,
  MemoryGeoPointInputV16,
  MemorySpatialRepeatV16,
  MemorySpatialTrailV16,
  MemorySpatialV16,
} from "@qre/contracts";
import { compileUniversalMemoryV15, type UniversalMemoryV15 } from "./universalMemoryV15.js";
import type { MemoryScopeV12 } from "./universalMemoryV12.js";
import type { LatentMovieV5 } from "./latentMovieExtractorV5.js";

const EARTH_RADIUS_METERS = 6_371_000;
const REPEAT_RADIUS_METERS = 25;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const key = (value: string) => normalize(value).replace(/\s+/g, "-");
const unique = <T>(values: T[]) => [...new Set(values)];

function validCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
}

function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, h)));
}

function pointConfidence(input: MemoryGeoPointInputV16): number {
  const supplied = input.confidence ?? 1;
  const accuracy = input.accuracyMeters;
  const accuracyConfidence = accuracy === undefined
    ? 0.9
    : accuracy <= 5 ? 1
      : accuracy <= 15 ? 0.95
        : accuracy <= 50 ? 0.82
          : accuracy <= 150 ? 0.65
            : 0.45;
  return Math.max(0, Math.min(1, supplied * accuracyConfidence));
}

function subjectEntityIds(memory: UniversalMemoryV15, movie: LatentMovieV5): string[] {
  const subject = normalize(movie.subject);
  const participants = new Set(movie.facts.flatMap((fact) => fact.actors.map(normalize)));
  const ids = memory.entities
    .filter((entity) => normalize(entity.name) === subject || participants.has(normalize(entity.name)))
    .map((entity) => entity.id);

  if (ids.length) return unique(ids);
  const latest = memory.events.at(-1)?.entityIds ?? [];
  return unique(latest);
}

function buildPoints(
  memory: UniversalMemoryV15,
  movie: LatentMovieV5,
  geo: MemoryGeoContextV16 | undefined,
): MemoryGeoPointV16[] {
  if (!geo?.points?.length) return [];
  const entityIds = subjectEntityIds(memory, movie);
  const events = memory.events;
  const points: MemoryGeoPointV16[] = [];

  for (const [index, input] of geo.points.entries()) {
    if (!validCoordinate(input.latitude, input.longitude)) continue;
    const event = events[Math.min(index, Math.max(0, events.length - 1))];
    points.push({
      ...input,
      id: `memory-geo-v16-${index + 1}-${input.capturedAt}`.replace(/[^a-zA-Z0-9_-]/g, "-"),
      eventId: event?.id ?? `memory-geo-event-v16-${index + 1}`,
      entityIds,
      source: input.source ?? "runtime",
      confidence: pointConfidence(input),
      visibility: input.visibility ?? "private",
      timezone: input.timezone ?? geo.timezone,
    });
  }

  return points.sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

function mergePoints(previous: MemorySpatialV16 | undefined, incoming: MemoryGeoPointV16[]): MemoryGeoPointV16[] {
  const bySignature = new Map<string, MemoryGeoPointV16>();
  for (const point of [...(previous?.points ?? []), ...incoming]) {
    const signature = `${point.eventId}|${point.latitude.toFixed(7)}|${point.longitude.toFixed(7)}|${point.capturedAt}`;
    bySignature.set(signature, point);
  }
  return [...bySignature.values()].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

function buildTrails(points: MemoryGeoPointV16[], previous?: MemorySpatialV16): MemorySpatialTrailV16[] {
  const trails: MemorySpatialTrailV16[] = [...(previous?.trails ?? [])];
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    const distanceMeters = haversineMeters(from, to);
    if (!Number.isFinite(distanceMeters) || distanceMeters < 1) continue;
    const entityIds = unique([...from.entityIds, ...to.entityIds]);
    const id = `memory-trail-v16-${from.id}-${to.id}`;
    if (trails.some((trail) => trail.id === id)) continue;
    trails.push({
      id,
      entityIds,
      pointIds: [from.id, to.id],
      originPointId: from.id,
      destinationPointId: to.id,
      startedAt: from.capturedAt,
      endedAt: to.capturedAt,
      distanceMeters,
      pointCount: 2,
      confidence: Math.min(from.confidence, to.confidence),
      visibility: from.visibility === "private" || to.visibility === "private" ? "private" : "shared",
    });
  }
  return trails;
}

function buildRepeatedSpots(points: MemoryGeoPointV16[]): MemorySpatialRepeatV16[] {
  const clusters: MemoryGeoPointV16[][] = [];
  for (const point of points) {
    const cluster = clusters.find((candidate) => haversineMeters(candidate[0], point) <= REPEAT_RADIUS_METERS);
    if (cluster) cluster.push(point);
    else clusters.push([point]);
  }

  return clusters
    .filter((cluster) => cluster.length >= 2)
    .map((cluster, index) => {
      const latitude = cluster.reduce((sum, point) => sum + point.latitude, 0) / cluster.length;
      const longitude = cluster.reduce((sum, point) => sum + point.longitude, 0) / cluster.length;
      const first = cluster[0];
      const last = cluster[cluster.length - 1];
      return {
        id: `memory-repeat-v16-${index + 1}-${key(first.id)}`,
        entityIds: unique(cluster.flatMap((point) => point.entityIds)),
        pointIds: cluster.map((point) => point.id),
        latitude,
        longitude,
        radiusMeters: Math.max(REPEAT_RADIUS_METERS, ...cluster.map((point) => point.accuracyMeters ?? 0)),
        occurrences: cluster.length,
        firstObservedAt: first.capturedAt,
        lastObservedAt: last.capturedAt,
        confidence: Math.min(0.99, cluster.reduce((sum, point) => sum + point.confidence, 0) / cluster.length),
        visibility: cluster.every((point) => point.visibility === "private") ? "private" : "shared",
        ...(cluster.find((point) => point.placeName)?.placeName ? { placeName: cluster.find((point) => point.placeName)?.placeName } : {}),
      };
    });
}

export type UniversalMemoryV16 = UniversalMemoryV15 & {
  spatial: MemorySpatialV16;
};

export function compileUniversalMemoryV16(
  scope: MemoryScopeV12,
  prompt: string,
  movie: LatentMovieV5,
  previous?: MemoryContext,
  geo?: MemoryGeoContextV16,
  previousSpatial?: MemorySpatialV16,
): UniversalMemoryV16 {
  const memory = compileUniversalMemoryV15(scope, prompt, movie, previous);
  const incoming = buildPoints(memory, movie, geo);
  const points = mergePoints(previousSpatial, incoming);
  const trails = buildTrails(points, previousSpatial);

  return {
    ...memory,
    spatial: {
      points,
      trails,
      repeatedSpots: buildRepeatedSpots(points),
    },
  };
}

export function memorySpatialSignalsV16(memory: UniversalMemoryV16, subjectId: string): string[] {
  const points = memory.spatial.points.filter((point) => point.entityIds.includes(subjectId));
  const trails = memory.spatial.trails.filter((trail) => trail.entityIds.includes(subjectId));
  const repeats = memory.spatial.repeatedSpots.filter((spot) => spot.entityIds.includes(subjectId));

  return unique([
    ...points.map((point) => `point:${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`),
    ...points.filter((point) => point.placeName).map((point) => `place:${point.placeName}`),
    ...trails.map((trail) => `travel:${Math.round(trail.distanceMeters)}m`),
    ...repeats.map((spot) => `same-spot:${spot.latitude.toFixed(6)},${spot.longitude.toFixed(6)}:${spot.occurrences}`),
  ]).slice(-96);
}
