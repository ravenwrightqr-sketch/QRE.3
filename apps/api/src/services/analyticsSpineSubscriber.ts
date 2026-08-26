import {
  mapEngineEventToAnalytics,
  subscribeSpine,
} from "@qre/engine";

import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";

const analyticsRepository = createAnalyticsRepository();

const PRESENCE_EVENTS = new Set([
  "CHECK_IN",
  "CHECK_OUT",
  "PRESENCE_JOIN",
  "PRESENCE_LEAVE",
]);

let started = false;

export function startAnalyticsSpineSubscriber(): () => void {
  if (started) {
    return () => {};
  }

  started = true;

  const unsubscribe = subscribeSpine(async (event) => {
    const type = mapEngineEventToAnalytics(event.type);
    const isPresenceEvent = PRESENCE_EVENTS.has(event.type);

    await analyticsRepository.trackEvent({
      assetId: event.assetId,

      // AnalyticsEvent.sessionId must reference ScanSession.
      // Presence events carry PresenceSession IDs instead.
      sessionId: isPresenceEvent
        ? null
        : event.sessionId ?? null,

      flowId: event.flowId ?? null,
      stepIndex: event.stepIndex ?? null,

      type,

      meta: {
        ...(event.meta ?? {}),
        source: "engine_spine",
        engineEventType: event.type,
        userId: event.userId ?? null,

        ...(isPresenceEvent
          ? {
              presenceSessionId: event.sessionId ?? null,
            }
          : {}),
      },
    });
  });

  return () => {
    unsubscribe();
    started = false;
  };
}