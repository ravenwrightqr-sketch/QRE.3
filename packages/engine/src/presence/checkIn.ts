import { emitSpineEvent } from "../spine/eventSpine.js";
import { resolveGeoLabel } from "../geo/resolveGeoLabel.js";
import { buildGeoMemoryAnalytics } from "../analytics/geoMemoryAnalytics.js";
import { normalizeGeoObservationV17, type GeoObservationInputV17 } from "../geo/geoIntelligenceV17.js";

import type {
  GeoMemoryRepository,
  PresenceRepository,
} from "../repositories/index.js";

type CheckInInput = {
  assetId: string;
  sessionId: string;
  userId?: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    capturedAt?: string | Date;
    sourceRef?: string | null;
    entityIds?: string[];
  };
};

export async function checkIn(
  input: CheckInInput,
  presenceRepo: PresenceRepository,
  geoRepo?: GeoMemoryRepository,
) {
  const now = new Date();

  const normalized = input.geo
    ? normalizeGeoObservationV17({
        latitude: input.geo.lat,
        longitude: input.geo.lng,
        accuracyMeters: input.geo.accuracy,
        altitudeMeters: input.geo.altitude,
        altitudeAccuracyMeters: input.geo.altitudeAccuracy,
        headingDegrees: input.geo.heading,
        speedMps: input.geo.speed,
        capturedAt: input.geo.capturedAt ?? now,
        source: "runtime",
        permission: "not_applicable",
        sourceRef: input.geo.sourceRef ?? null,
        entityIds: input.geo.entityIds ?? [],
        sessionId: input.sessionId,
        visibility: "private",
        outputVisibility: "precise",
      } satisfies GeoObservationInputV17)
    : null;

  const session = await presenceRepo.upsertSession({
    id: input.sessionId,
    assetId: input.assetId,
    userId: input.userId ?? null,
    status: "ENTERED",
    enteredAt: now,
    geoLat: normalized?.latitude ?? null,
    geoLng: normalized?.longitude ?? null,
    accuracy: normalized?.accuracyMeters ?? null,
  });

  let geoLabel: Awaited<ReturnType<typeof resolveGeoLabel>> | null = null;
  if (normalized) {
    geoLabel = await resolveGeoLabel(normalized.latitude, normalized.longitude);
  }

  if (normalized) {
    await presenceRepo.createGeoProof({
      assetId: input.assetId,
      sessionId: input.sessionId,
      userId: input.userId ?? null,
      lat: normalized.latitude,
      lng: normalized.longitude,
      accuracy: normalized.accuracyMeters,
      source: normalized.source,
      label: geoLabel?.label ?? null,
      city: geoLabel?.city ?? null,
      region: geoLabel?.region ?? null,
      country: geoLabel?.country ?? null,
    });
  }

  await emitSpineEvent({
    type: "CHECK_IN",
    assetId: input.assetId,
    sessionId: input.sessionId,
    userId: input.userId,
    meta: {
      geo: normalized,
      geoLabel,
    },
  });

  if (geoRepo) {
    try {
      await buildGeoMemoryAnalytics(input.assetId, geoRepo, input.sessionId);
    } catch (error) {
      console.warn("[GEO MEMORY ANALYTICS FAILED]", error);
    }
  }

  return session;
}
