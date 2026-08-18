import type {
  GeoMemoryRepository,
} from "../repositories/index.js";
import { buildGeoSpatialIntelligenceV17 } from "./geoIntelligenceV17.js";

export type GeoMemory = {
  assetId: string;
  sessionId: string | null;
  label: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  visits: number;
  firstSeen: Date;
  lastSeen: Date;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  confidence: number;
};

export async function getGeoMemory(
  assetId: string,
  repo: GeoMemoryRepository,
): Promise<GeoMemory[]> {
  const sourcePoints = await repo.findGeoProof(assetId);
  if (!sourcePoints.length) return [];

  const spatial = buildGeoSpatialIntelligenceV17(
    sourcePoints.map((point) => ({
      latitude: point.lat,
      longitude: point.lng,
      accuracyMeters: point.accuracy,
      capturedAt: point.createdAt,
      source: "scan" as const,
      permission: "not_applicable" as const,
      confidence: 1,
      visibility: "private" as const,
      outputVisibility: "precise" as const,
      placeName: point.label,
      city: point.city,
      region: point.region,
      country: point.country,
      sessionId: point.sessionId,
    })),
  );

  const consumed = new Set<number>();
  const memories: GeoMemory[] = [];

  for (const repeat of spatial.repeatedSpots) {
    for (const index of repeat.pointIndices) consumed.add(index);
    const representative = spatial.points[repeat.pointIndices[0]];
    memories.push({
      assetId,
      sessionId: representative.sessionId ?? null,
      label: repeat.placeName ?? representative.placeName ?? null,
      city: representative.city ?? null,
      region: representative.region ?? null,
      country: representative.country ?? null,
      visits: repeat.occurrences,
      firstSeen: new Date(repeat.firstObservedAt),
      lastSeen: new Date(repeat.lastObservedAt),
      latitude: repeat.latitude,
      longitude: repeat.longitude,
      radiusMeters: repeat.radiusMeters,
      confidence: repeat.confidence,
    });
  }

  spatial.points.forEach((point, index) => {
    if (consumed.has(index)) return;
    memories.push({
      assetId,
      sessionId: point.sessionId ?? null,
      label: point.placeName ?? null,
      city: point.city ?? null,
      region: point.region ?? null,
      country: point.country ?? null,
      visits: 1,
      firstSeen: new Date(point.capturedAt),
      lastSeen: new Date(point.capturedAt),
      latitude: point.latitude,
      longitude: point.longitude,
      radiusMeters: Math.min(250, point.accuracyMeters ?? 75),
      confidence: point.confidence,
    });
  });

  return memories.sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime());
}
