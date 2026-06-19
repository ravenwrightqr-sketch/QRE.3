import { db } from "@qre/db";

export async function getAssetAnalytics(assetId: string) {
  const scans = await db.scanEvent.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" }
  });

  return {
    totalScans: scans.length,
    recent: scans.slice(0, 20),
flowEvents: scans.filter(s => s.sessionId != null)
  };
}