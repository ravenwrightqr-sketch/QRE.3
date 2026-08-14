import { nanoid } from "nanoid";
import type { ServiceReceipt } from "@qre/contracts";
import { evolveServiceReceipt } from "./cognition/serviceMemoryState.js";

function textOf(moment: any): string {
  const value = moment?.text ?? moment?.description ?? moment?.title ?? moment?.meta?.text ?? moment?.type;
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : String(value ?? "");
}

function labelOf(moment: any): string | undefined {
  const value = moment?.payload?.label ?? moment?.payload?.action ?? moment?.payload?.service ?? moment?.payload?.name;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function buildServiceReceipt(input: {
  asset: any;
  sessionId: string;
  moments: any[];
  analytics?: { scans?: number; completions?: number; engagement?: number; replayRate?: number };
}): ServiceReceipt {
  const id = nanoid(12);
  const locationMoment = input.moments.find((m) => m.type === "location" || m.type === "arrival");
  const narrative = input.moments.map(textOf).filter(Boolean).slice(0, 12);
  const highlights = input.moments
    .filter((moment) => Array.isArray(moment.payload?.creativeDetails) && moment.payload.creativeDetails.length)
    .flatMap((moment) => moment.payload.creativeDetails as string[])
    .slice(0, 12);
  const experience = input.asset.experience;
  const video = typeof experience?.blueprint === "object" && experience?.blueprint
    ? (experience.blueprint as Record<string, unknown>).video as Record<string, unknown> | undefined
    : undefined;

  const receipt: ServiceReceipt = {
    id,
    assetId: input.asset.id,
    sessionId: input.sessionId,
    kind: "service_experience",
    type: "service",
    title: experience?.title ?? `${input.asset.slug} Service Experience`,
    summary: narrative[0] ?? "A customer experience generated from the business-authored service prompt.",
    prompt: experience?.sourcePrompt ?? undefined,
    experienceId: experience?.id,
    audience: "customer",
    narrative,
    highlights,
    analytics: input.analytics,
    completedAt: new Date().toISOString(),
    video: video ? {
      url: typeof video.url === "string" ? video.url : undefined,
      mediaId: typeof video.mediaId === "string" ? video.mediaId : undefined,
      durationMs: typeof video.durationMs === "number" ? video.durationMs : undefined,
    } : undefined,
    location: locationMoment?.meta ? {
      lat: typeof locationMoment.meta.lat === "number" ? locationMoment.meta.lat : undefined,
      lng: typeof locationMoment.meta.lng === "number" ? locationMoment.meta.lng : undefined,
      label: typeof locationMoment.meta.label === "string" ? locationMoment.meta.label : undefined,
    } : undefined,
    metadata: {
      delivery: "cinematic-service-experience",
      shareUrl: `/receipt/${id}`,
      narrativeMoments: narrative.length,
      authoredPromptPresent: Boolean(experience?.sourcePrompt),
    },
  };

  return evolveServiceReceipt(receipt, input.moments);
}
