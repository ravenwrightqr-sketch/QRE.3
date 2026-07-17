import { db } from "@qre/db";

export async function getPresenceReplay(assetId: string) {
  const points = await db.geoProof.findMany({
    where: { assetId },
    orderBy: { createdAt: "asc" },
  });

  const sessions: Record<string, any[]> = {};

  for (const p of points) {
    const sid = p.sessionId ?? "anonymous";

    if (!sessions[sid]) sessions[sid] = [];

    sessions[sid].push({
      lat: p.lat,
      lng: p.lng,
      time: p.createdAt,
    });
  }

  return {
    sessions,
    totalSessions: Object.keys(sessions).length,
  };
}