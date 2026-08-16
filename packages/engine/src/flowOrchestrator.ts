import { trackEvent } from "./analytics/trackEvent.js";
import type {
  AnalyticsRepository,
  PresenceRepository,
  GeoMemoryRepository,
} from "./repositories/index.js";
import { checkIn } from "./presence/checkIn.js";
import type { ExperienceMoment } from "@qre/contracts";

export type FlowRuntimeGeo = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export async function runFlowActions(
  moments: ExperienceMoment[],
  sessionId: string,
  assetId: string,
  geo?: FlowRuntimeGeo,
  userId?: string,
  analyticsRepository?: AnalyticsRepository,
  presenceRepository?: PresenceRepository,
  geoMemoryRepository?: GeoMemoryRepository,
) {
  const sorted = [...moments].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sorted.length; i += 1) {
    const moment = sorted[i];

    if (analyticsRepository) {
      await trackEvent(analyticsRepository, {
        assetId,
        sessionId,
        stepIndex: i,
        type: "FLOW_STEP",
        meta: { momentType: moment.type },
      });
    }

    if (moment.type === "location") {
      const meta = moment.meta ?? {};
      if (meta.geoMemory === true && geo && presenceRepository) {
        await checkIn(
          { assetId, sessionId, userId, geo },
          presenceRepository,
          geoMemoryRepository,
        );
      }
    }

    const duration = typeof moment.meta?.duration === "number" ? moment.meta.duration : 0;
    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration));
    }
  }

  if (analyticsRepository) {
    await trackEvent(analyticsRepository, {
      assetId,
      sessionId,
      type: "FLOW_COMPLETE",
      meta: { steps: sorted.length },
    });
  }
}
