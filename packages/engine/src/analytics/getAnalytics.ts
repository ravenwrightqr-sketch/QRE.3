import { db } from "@qre/db";

export async function getRecentActivity(assetId: string, limit = 20) {
  return db.analyticsEvent.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getFunnel(assetId: string) {
  const events = await db.analyticsEvent.groupBy({
    by: ["type"],
    where: { assetId },
    _count: true,
  });

  const map = Object.fromEntries(
    events.map((e: any) => [e.type, e._count])
  );

  return {
    scan: map.SCAN ?? 0,
    flowStart: map.FLOW_START ?? 0,
    flowStep: map.FLOW_STEP ?? 0,
    flowComplete: map.FLOW_COMPLETE ?? 0,
    errors: map.ERROR ?? 0,
  };
}