import { apiPost } from "./api";
import type { Experience } from "@qre/contracts";

export type GeoAnchorRole = "physical_site" | "experience_place" | "event_venue" | "memory_place" | "reference_place";

export type GeoAnchor = {
  latitude: number;
  longitude: number;
  label?: string;
  city?: string;
  region?: string;
  country?: string;
  role: GeoAnchorRole;
  source?: string;
  time?: string;
};

type ExperienceIntent = { prompt: string; assetId?: string; geo?: GeoAnchor };

export async function compileExperience(intent: ExperienceIntent): Promise<Experience> {
  const result = await apiPost("/experience/compile", {
    prompt: intent.prompt,
    ...(intent.assetId ? { assetId: intent.assetId } : {}),
    ...(intent.geo ? { geo: intent.geo } : {}),
  });
  if (!result?.experience) throw new Error("Invalid compiler response");
  return result.experience as Experience;
}
