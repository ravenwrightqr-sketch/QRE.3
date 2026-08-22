import { checkIn } from "../presence/checkIn.js";

import type {
  PresenceRepository,
  GeoMemoryRepository,
} from "../repositories/index.js";

import type { FlowStep } from "@qre/contracts";

export async function runLocationStep(
  step: FlowStep,
  context: {
    assetId: string;
    sessionId: string;
    userId?: string;
    geo?: {
      lat: number;
      lng: number;
      accuracy?: number;
      altitude?: number | null;
      altitudeAccuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
      capturedAt?: string | Date;
      sourceRef?: string | null;
      entityIds?: string[];
    };
    presenceRepository: PresenceRepository;
    geoMemoryRepository?: GeoMemoryRepository;
  },
) {
  const payload = step.payload as Record<string, unknown>;

  if (payload.geoMemory !== true) return { skipped: true };

  await checkIn(
    {
      assetId: context.assetId,
      sessionId: context.sessionId,
      userId: context.userId,
      geo: context.geo,
    },
    context.presenceRepository,
    context.geoMemoryRepository,
  );

  return {
    type: "location",
    captured: Boolean(context.geo),
    timeline: true,
    snapshot: true,
    evidence: Boolean(context.geo),
  };
}
