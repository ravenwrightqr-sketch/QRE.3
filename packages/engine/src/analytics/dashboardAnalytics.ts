import { db } from "@qre/db";

/**
 * =========================
 * LIVE DASHBOARD METRICS
 * =========================
 */
export async function getAssetLiveMetrics(assetId: string) {
  const [scans, errors, flows, completions] = await Promise.all([
    db.analyticsEvent.count({
      where: { assetId, type: "SCAN" },
    }),

    db.analyticsEvent.count({
      where: { assetId, type: "ERROR" },
    }),

    db.analyticsEvent.count({
      where: { assetId, type: "FLOW_START" },
    }),

    db.analyticsEvent.count({
      where: { assetId, type: "FLOW_COMPLETE" },
    }),
  ]);

  return {
    scans,
    errors,
    flows,
    completions,
    conversionRate: scans > 0 ? completions / scans : 0,
  };
}