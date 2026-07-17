import { db } from "@qre/db";
import { aiInsightsEngine } from "../ai/aiInsightsEngine.js";
import type { AnalyticsEventType } from "@qre/contracts";

type NormalizedAnalyticsEvent = {
  assetId: string;
  timestamp: Date;
  sessionId: string | null;
  type: AnalyticsEventType;
};

export async function getScanInsights(assetId: string) {
  const events = await db.analyticsEvent.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const normalized: NormalizedAnalyticsEvent[] = events.map((e: any) => ({
    assetId: e.assetId,
    timestamp: e.createdAt,
    sessionId: e.sessionId,
    type: e.type as AnalyticsEventType,
  }));

  return aiInsightsEngine(normalized);
}