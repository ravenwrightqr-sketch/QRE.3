import { db } from "@qre/db";

type FunnelStep = {
  stepIndex: number;
  count: number;
};

export async function getDashboardMetrics(assetId: string) {
  const [scans, completions, errors, activity, stepBreakdown, revenueEvents] =
    await Promise.all([
      db.analyticsEvent.count({
        where: { assetId, type: "SCAN" },
      }),

      db.analyticsEvent.count({
        where: { assetId, type: "FLOW_COMPLETE" },
      }),

      db.analyticsEvent.count({
        where: { assetId, type: "ERROR" },
      }),

      db.analyticsEvent.findMany({
        where: { assetId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      db.analyticsEvent.groupBy({
        by: ["stepIndex"],
        where: {
          assetId,
          type: "FLOW_STEP",
        },
        _count: true,
        orderBy: {
          stepIndex: "asc",
        },
      }),

      db.analyticsEvent.findMany({
        where: {
          assetId,
          type: {
            in: ["PAYMENT_COMPLETED", "TIP_COMPLETED"],
          },
        },
      }),
    ]);

  /**
   * funnel conversion
   */
  const conversionRate = scans > 0 ? completions / scans : 0;

  /**
   * revenue sum (safe JSON meta fallback)
   */
  const revenue = revenueEvents.reduce((sum, e: any) => {
    return sum + (e.meta?.amount ?? 0);
  }, 0);

  /**
   * drop-off map
   */
  const funnel: FunnelStep[] = stepBreakdown.map((s) => ({
    stepIndex: s.stepIndex ?? 0,
    count: s._count,
  }));

  return {
    summary: {
      scans,
      completions,
      errors,
      conversionRate,
      revenue,
    },

    funnel,

    activity: activity.map((e) => ({
      type: e.type,
      stepIndex: e.stepIndex,
      createdAt: e.createdAt,
    })),

    meta: {
      generatedAt: new Date().toISOString(),
    },
  };
}