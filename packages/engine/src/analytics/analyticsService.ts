import { aiInsightsEngine } from "../ai/aiInsightsEngine.js";
import type { AnalyticsEventType, ExperienceAnalytics } from "@qre/contracts";
import type { AnalyticsRepository } from "../repositories/index.js";

type NormalizedAnalyticsEvent = {
  assetId: string;
  timestamp: Date;
  sessionId: string | null;
  type: AnalyticsEventType;
};

export function buildExperienceAnalytics(
  events: Array<{
    assetId?: string;
    sessionId?: string | null;
    type?: string;
    createdAt?: Date | string;
  }>,
  input: { assetId?: string; sessionId?: string } = {},
): ExperienceAnalytics {
  const byType: Record<string, number> = {};
  const timestamps: number[] = [];

  for (const event of events) {
    const type = String(event.type ?? "UNKNOWN");
    byType[type] = (byType[type] ?? 0) + 1;
    if (event.createdAt) {
      const time = new Date(event.createdAt).getTime();
      if (Number.isFinite(time)) timestamps.push(time);
    }
  }

  const first = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : undefined;
  const last = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : undefined;
  const count = (type: string) => byType[type] ?? 0;

  return {
    eventCount: events.length,
    byType,
    assetId: input.assetId,
    sessionId: input.sessionId,
    firstEventAt: first,
    lastEventAt: last,
    geoMarks: count("GEO_MARK"),
    memoryUses: count("AI_MEMORY_USED") + count("MEMORY_APPLIED"),
    completions: count("FLOW_COMPLETE") + count("SESSION_END"),
    errors: count("ERROR"),
    meta: { generatedAt: new Date().toISOString() },
  };
}

export async function getScanInsights(assetId: string, repo: AnalyticsRepository) {
  const events = await repo.findEvents({ assetId, limit: 100 });
  const normalized: NormalizedAnalyticsEvent[] = events.map((event: any) => ({
    assetId: event.assetId,
    timestamp: event.createdAt,
    sessionId: event.sessionId,
    type: event.type as AnalyticsEventType,
  }));
  return aiInsightsEngine(normalized);
}

export async function getExperienceAnalytics(
  assetId: string,
  repo: AnalyticsRepository,
  sessionId?: string,
): Promise<ExperienceAnalytics> {
  const events = await repo.findEvents({ assetId, limit: 500 });
  return buildExperienceAnalytics(
    events as Array<{ assetId?: string; sessionId?: string | null; type?: string; createdAt?: Date | string }>,
    { assetId, sessionId },
  );
}
