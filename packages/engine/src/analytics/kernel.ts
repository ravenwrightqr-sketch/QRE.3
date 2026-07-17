import { AnalyticsEventType } from "@qre/contracts";
import type { AnalyticsEvent } from "@prisma/client";

/**
 * =========================
 * ANALYTICS KERNEL (SOURCE OF TRUTH)
 * =========================
 */

export function computeFunnel(events: AnalyticsEvent[]) {
  const funnel = {
    scans: 0,
    sessions: 0,
    flowStarts: 0,
    flowCompletes: 0,
    errors: 0,
    payments: 0,
  };

  for (const e of events) {
    switch (e.type as AnalyticsEventType) {
      case "SCAN":
        funnel.scans++;
        break;

      case "SESSION_START":
        funnel.sessions++;
        break;

      case "FLOW_START":
        funnel.flowStarts++;
        break;

      case "FLOW_COMPLETE":
        funnel.flowCompletes++;
        break;

      case "ERROR":
        funnel.errors++;
        break;

      case "PAYMENT_COMPLETED":
        funnel.payments++;
        break;
    }
  }

  return funnel;
}

export function computeConversionRate(funnel: ReturnType<typeof computeFunnel>) {
  if (funnel.scans === 0) return 0;
  return funnel.flowCompletes / funnel.scans;
}

export function computeBasicMetrics(events: AnalyticsEvent[]) {
  const funnel = computeFunnel(events);

  return {
    funnel,
    conversionRate: computeConversionRate(funnel),
    totalEvents: events.length,
  };
}

export function getRecentActivity(events: AnalyticsEvent[], limit = 20) {
  return events
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}