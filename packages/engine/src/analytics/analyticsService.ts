import { aiInsightsEngine, type AnalyticsEvent } from "../ai/aiInsightsEngine.js";
import type { AnalyticsRepository } from "../repositories/index.js";

export async function getScanInsights(assetId: string, repo: AnalyticsRepository) {
  const events = await repo.findEvents({ assetId, limit: 500 });
  const normalized: AnalyticsEvent[] = events.map((event: any) => ({
    assetId: event.assetId,
    timestamp: event.createdAt,
    sessionId: event.sessionId,
    type: event.type,
    meta: event.meta ?? undefined,
  }));
  return aiInsightsEngine(normalized);
}
