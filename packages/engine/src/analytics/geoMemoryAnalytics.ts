import { db } from "@qre/db";

/**
 * ============================================================
 * GEO MEMORY ANALYTICS
 * ============================================================
 *
 * Reads geo history and stores long-term analytics
 * for dashboards, AI, rewards and engagement.
 *
 * NOT the cinematic Memory Snapshot.
 * ============================================================
 */

export async function buildGeoMemoryAnalytics(
  assetId: string,
  sessionId?: string
) {
  const geoEvents = await db.geoProof.findMany({
    where: { assetId },
    orderBy: {
      createdAt: "asc",
    },
  });

  const totalPoints = geoEvents.length;

  const uniqueCities = new Set(
    geoEvents
      .map((g: any) => g.city)
      .filter(Boolean)
  );

  const dominantRegion = mostCommon(
    geoEvents.map((g: any) => g.region)
  );

  const confidence =
    totalPoints === 0
      ? 0
      : Math.min(totalPoints / 10, 1);

  const rewardScore = totalPoints * 1.2;

  const signalStrength =
    totalPoints > 10
      ? "high"
      : totalPoints > 3
      ? "medium"
      : "low";

  const lastPoint = geoEvents.at(-1);

  const snapshot = await db.memorySnapshot.create({
    data: {
      assetId,

      sessionId: sessionId ?? null,

      scanWeight: totalPoints,

      flowEngagementWeight: 0,

      completionWeight: 0,

      ctaClickWeight: 0,

      rewardScore,

      confidence,

      dominantLayer: "geo_analytics",

      dropOffPoints: {
        totalPoints,
        uniquePlaces: uniqueCities.size,
        dominantRegion,
        signalStrength,

        lastLocation: lastPoint
          ? {
              lat: lastPoint.lat,
              lng: lastPoint.lng,
              city: lastPoint.city,
              region: lastPoint.region,
            }
          : null,
      },
    },
  });

  return snapshot;
}

/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

function mostCommon(values: (string | null | undefined)[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let winner: string | null = null;
  let highest = 0;

  for (const [key, value] of counts.entries()) {
    if (value > highest) {
      highest = value;
      winner = key;
    }
  }

  return winner;
}