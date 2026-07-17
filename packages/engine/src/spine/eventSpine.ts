import { trackEvent } from "../analytics/trackEvent.js";
import type { EngineEventType } from "@qre/contracts";
import { db } from "@qre/db";

type SpineEvent = {
  type: EngineEventType;
  assetId: string;
  sessionId?: string;
  flowId?: string;
  stepIndex?: number;
  userId?: string;
  meta?: any;
};

const ANALYTICS_MAP: Partial<Record<EngineEventType, string | null>> = {
  SCAN_START: "SCAN",
  FLOW_TRIGGERED: "FLOW_START",
  FLOW_STEP: "FLOW_STEP",
  FLOW_COMPLETE: "FLOW_COMPLETE",
  ERROR: "ERROR",
  GEO_MARK: null,
  
};

export async function emitSpineEvent(event: SpineEvent) {
  try {
    const analyticsType = ANALYTICS_MAP[event.type];

    if (analyticsType) {
      await trackEvent({
        assetId: event.assetId,
        sessionId: event.sessionId,
        flowId: event.flowId,
        stepIndex: event.stepIndex,
        type: analyticsType as any,
        meta: event.meta ?? {},
      });
    }
  } catch (e) {
    console.error("[SPINE][analytics]", e);
  }

  // memory removed (you said you deleted it)
  // emit handlers only
}