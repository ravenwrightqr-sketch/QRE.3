import { db } from "@qre/db";

/**
 * GEO MEMORY LAYER V1
 * Turns raw geoProof into "memory objects"
 */

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
};

/**
 * Build memory timeline from geo proofs
 */
export async function getGeoMemory(assetId: string): Promise<GeoMemory[]> {
  const points = await db.geoProof.findMany({
    where: { assetId },
    orderBy: { createdAt: "asc" },
  });

  const memoryMap = new Map<string, GeoMemory>();

  for (const p of points) {
    const key = `${p.lat.toFixed(3)}:${p.lng.toFixed(3)}`;

    const existing = memoryMap.get(key);

    if (!existing) {
      memoryMap.set(key, {
        assetId,
        sessionId: p.sessionId,
        label: null,
        city: null,
        region: null,
        country: null,

        visits: 1,
        firstSeen: p.createdAt,
        lastSeen: p.createdAt,
      });
    } else {
      existing.visits += 1;
      existing.lastSeen = p.createdAt;
    }
  }

  return Array.from(memoryMap.values());
}