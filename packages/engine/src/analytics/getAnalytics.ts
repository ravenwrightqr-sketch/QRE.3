import { db } from "@qre/db";

export type Tier = "BASIC" | "PRO" | "BUSINESS";

export type AnalyticsInput = {
  assetId: string;
  sessionId?: string;
  tier: Tier;
};

export async function getAnalytics(input: AnalyticsInput) {
  const { assetId, sessionId, tier } = input;

  const baseEvents = await db.analyticsEvent.findMany({
    where: {
      assetId,
      ...(sessionId ? { sessionId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  // BASIC
  if (tier === "BASIC") {
    const sessionsCount = await db.scanSession.count({
      where: { assetId },
    });

    return {
      totalScans: sessionsCount,
     lastScan: baseEvents.length
  ? baseEvents[baseEvents.length - 1].createdAt
  : null,
      eventCount: baseEvents.length,
    };
  }

  // PRO
  if (tier === "PRO") {
    const sessions = await db.scanSession.findMany({
      where: { assetId },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return {
      totalScans: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        stepIndex: s.stepIndex,
        status: s.status,
        startedAt: s.startedAt,
      })),
      dropOffMap: sessions.reduce<Record<number, number>>((acc, s) => {
        const key = s.stepIndex ?? 0;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  // BUSINESS
  return {
    events: baseEvents,
    sessions: await db.scanSession.findMany({
      where: { assetId },
      include: { events: true },
    }),
    funnel: {
      scans: await db.scanSession.count({ where: { assetId } }),
      completedFlows: await db.analyticsEvent.count({
        where: { assetId, type: "flow_end" },
      }),
      paymentsTriggered: await db.analyticsEvent.count({
        where: { assetId, type: "payment" },
      }),
    },
  };
}