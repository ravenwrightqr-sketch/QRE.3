import { db } from "@qre/db";

import { emitSpineEvent } from "../spine/eventSpine.js";
import { resolveGeoLabel } from "../geo/resolveGeoLabel.js";
import { buildGeoMemoryAnalytics } from "../analytics/geoMemoryAnalytics.js";

type CheckInInput = {
  assetId: string;
  sessionId: string;
  userId?: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
};

export async function checkIn(input: CheckInInput) {
  const now = new Date();

  /**
   * 1. SESSION UPSERT
   */
  const session = await db.presenceSession.upsert({
    where: { id: input.sessionId },
    create: {
      id: input.sessionId,
      assetId: input.assetId,
      userId: input.userId ?? null,
      status: "ENTERED",
      enteredAt: now,
      geoLat: input.geo?.lat ?? null,
      geoLng: input.geo?.lng ?? null,
      accuracy: input.geo?.accuracy ?? null,
    },
    update: {
      status: "INSIDE",
    },
  });

  /**
   * 2. GEO ENRICHMENT
   */
  let geoLabel: Awaited<ReturnType<typeof resolveGeoLabel>> | null = null;

  if (input.geo) {
    geoLabel = await resolveGeoLabel(input.geo.lat, input.geo.lng);
  }

  /**
   * 3. GEO PROOF STORAGE
   */
  if (input.geo) {
    await db.geoProof.create({
      data: {
        assetId: input.assetId,
        sessionId: input.sessionId,
        userId: input.userId ?? null,

        lat: input.geo.lat,
        lng: input.geo.lng,
        accuracy: input.geo.accuracy ?? null,

        source: "checkin",

        label: geoLabel?.label ?? null,
        city: geoLabel?.city ?? null,
        region: geoLabel?.region ?? null,
        country: geoLabel?.country ?? null,
      } as any,
    });
  }

  /**
   * 4. EVENT SPINE
   */
  await emitSpineEvent({
    type: "CHECK_IN",
    assetId: input.assetId,
    sessionId: input.sessionId,
   userId: input.userId ?? undefined,
    meta: {
      geo: input.geo,
      geoLabel,
    },
  });

  /**
   * 5. GEO MEMORY ANALYTICS (NON-BLOCKING FUTURE LAYER)
   */
  try {
    await buildGeoMemoryAnalytics(input.assetId, input.sessionId);
  } catch (err) {
    console.warn("[GEO MEMORY ANALYTICS FAILED]", err);
  }

  return session;
}