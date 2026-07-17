import { db } from "@qre/db";

export async function getPresenceMap(assetId: string) {
  const points = await db.geoProof.findMany({
    where: {
      assetId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy,
    createdAt: p.createdAt,
    source: p.source,
  }));
}