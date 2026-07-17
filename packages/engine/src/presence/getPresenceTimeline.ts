import { db } from "@qre/db";

export async function getPresenceTimeline(assetId: string) {
  const points = await db.geoProof.findMany({
    where: { assetId },
    orderBy: { createdAt: "asc" },
  });

  return points.map((p) => ({
    sessionId: p.sessionId,
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy ?? null,
    timestamp: p.createdAt,
  }));
}