import { nanoid } from "nanoid";

import type { ServiceReceipt } from "@qre/contracts";
import { evolveServiceReceipt } from "./cognition/serviceMemoryState.js";

function textOf(moment: any): string {
  const value = moment?.text ?? moment?.description ?? moment?.title ?? moment?.meta?.text ?? moment?.type;
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : String(value ?? "");
}

function labelOf(moment: any): string | undefined {
  const payload = moment?.payload;
  const value = payload?.label ?? payload?.action ?? payload?.service ?? payload?.name;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function buildServiceReceipt(
  input: {
    asset: any;
    sessionId: string;
    moments: any[];
  },
): ServiceReceipt {
  const id = nanoid(12);
  const locationMoment = input.moments.find((m) => m.type === "location" || m.type === "arrival");
  const completionMoment = input.moments.find((m) => m.meta?.event === "SERVICE_COMPLETE");
  const labels = [...new Set(input.moments.map(labelOf).filter((value): value is string => Boolean(value)))];
  const narrative = input.moments
    .filter((moment) => Array.isArray(moment.payload?.creativeDetails) && moment.payload.creativeDetails.length > 0)
    .map(textOf)
    .filter(Boolean)
    .slice(0, 3);
  const total = input.moments.find((moment) => typeof moment.payload?.total === "number")?.payload?.total;

  const receipt: ServiceReceipt = {
    id,
    assetId: input.asset.id,
    sessionId: input.sessionId,
    type: "service",
    title: `${input.asset.slug} Service Receipt`,
    summary: completionMoment ? textOf(completionMoment) : `Completed ${input.moments.length} service steps.`,
    completedAt: new Date().toISOString(),
    location: locationMoment?.meta
      ? {
          lat: typeof locationMoment.meta.lat === "number" ? locationMoment.meta.lat : undefined,
          lng: typeof locationMoment.meta.lng === "number" ? locationMoment.meta.lng : undefined,
          label: typeof locationMoment.meta.label === "string" ? locationMoment.meta.label : undefined,
        }
      : undefined,
    lineItems: labels.map((label) => ({ label })),
    total: typeof total === "number" ? total : undefined,
    metadata: {
      steps: input.moments.length,
      shareUrl: `/receipt/${id}`,
      narrativeHighlights: narrative,
    },
  };

  return evolveServiceReceipt(receipt, input.moments);
}
