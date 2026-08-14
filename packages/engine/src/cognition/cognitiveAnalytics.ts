import type { CognitiveAnalyticsSignal } from "@qre/contracts";

const text = (value: unknown) => typeof value === "string" ? value : "";

/**
 * Analytics is observational input, never factual story evidence.
 * It affects taste, friction, novelty and emphasis for future compilations.
 */
export function summarizeCognitiveAnalytics(events: readonly unknown[]): CognitiveAnalyticsSignal {
  let scans = 0;
  let completions = 0;
  let abandons = 0;
  let replays = 0;
  let ctaClicks = 0;
  let errors = 0;
  const accepted: string[] = [];
  const rejected: string[] = [];
  const preferences: string[] = [];

  for (const raw of events) {
    const event = raw as { type?: unknown; meta?: unknown };
    const type = text(event.type).toUpperCase();
    const meta = event.meta && typeof event.meta === "object" ? event.meta as Record<string, unknown> : {};
    if (type === "SCAN") scans += 1;
    if (type === "FLOW_COMPLETE" || type === "SESSION_END") completions += 1;
    if (type === "FLOW_ABANDON") abandons += 1;
    if (type === "REPLAY") replays += 1;
    if (type === "CTA_CLICK") ctaClicks += 1;
    if (type === "ERROR") errors += 1;

    const acceptedValue = text(meta.acceptedCreative ?? meta.accepted);
    const rejectedValue = text(meta.rejectedCreative ?? meta.rejected);
    const preference = text(meta.preference ?? meta.creativePreference);
    if (acceptedValue) accepted.push(acceptedValue);
    if (rejectedValue) rejected.push(rejectedValue);
    if (preference) preferences.push(preference);
  }

  const engagement = scans > 0
    ? Math.min(1, completions / scans + replays / Math.max(1, scans) * 0.2 + ctaClicks / Math.max(1, scans) * 0.1)
    : 0;
  const friction = scans > 0
    ? Math.min(1, abandons / scans + errors / Math.max(1, scans) * 0.5)
    : 0;

  return {
    scans,
    completions,
    abandons,
    replays,
    ctaClicks,
    errors,
    engagement,
    friction,
    accepted: [...new Set(accepted)].slice(-50),
    rejected: [...new Set(rejected)].slice(-50),
    preferences: [...new Set(preferences)].slice(-50),
  };
}
