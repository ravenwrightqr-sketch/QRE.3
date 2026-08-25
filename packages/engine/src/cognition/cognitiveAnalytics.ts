import type { CognitiveAnalyticsSignal } from "@qre/contracts";

const text = (value: unknown) => typeof value === "string" ? value : "";
const list = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const unique = (values: readonly string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

/**
 * Analytics is observational input, never factual story evidence.
 * It affects taste, friction, novelty and emphasis for future compilations.
 *
 * Creative-learning events are normalized here so the existing cognitive
 * pipeline becomes the single bridge from observed preference -> future Author.
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
    // SESSION_END is not completion: it can represent abandonment or a
    // naturally terminated session without the experience actually completing.
    if (type === "FLOW_COMPLETE") completions += 1;
    if (type === "FLOW_ABANDON") abandons += 1;
    if (type === "REPLAY" || type === "EXPERIENCE_REPLAY" || type === "MEDIA_REPLAY") replays += 1;
    if (type === "CTA_CLICK") ctaClicks += 1;
    if (type === "ERROR") errors += 1;

    const acceptedValue = text(meta.acceptedCreative ?? meta.accepted);
    const rejectedValue = text(meta.rejectedCreative ?? meta.rejected);
    const preference = text(meta.preference ?? meta.creativePreference);
    if (acceptedValue) accepted.push(acceptedValue);
    if (rejectedValue) rejected.push(rejectedValue);
    if (preference) preferences.push(preference);

    const feedback = text(meta.feedback);
    const trajectory = text(meta.trajectory);
    const styleTags = list(meta.styleTags);
    const draft = text(meta.draft);

    if (type === "AI_CREATIVE_ACCEPTED" || type === "AI_VARIATION_SELECTED") {
      if (feedback) accepted.push(`feedback:${feedback}`);
      if (trajectory) accepted.push(`trajectory:${trajectory}`);
      for (const tag of styleTags) accepted.push(`style:${tag}`);
      if (draft) accepted.push(`draft:${draft.slice(0, 180)}`);
    }

    if (type === "AI_CREATIVE_REJECTED") {
      if (feedback) rejected.push(`feedback:${feedback}`);
      if (trajectory) rejected.push(`trajectory:${trajectory}`);
      for (const tag of styleTags) rejected.push(`style:${tag}`);
      if (draft) rejected.push(`draft:${draft.slice(0, 180)}`);
    }
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
    accepted: unique(accepted).slice(-50),
    rejected: unique(rejected).slice(-50),
    preferences: unique(preferences).slice(-50),
  };
}
