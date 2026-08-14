import { apiPost } from "./api";
import type { Experience } from "@qre/contracts";

type ExperienceIntent = { prompt: string; assetId?: string };

export async function compileExperience(intent: ExperienceIntent): Promise<Experience> {
  const result = await apiPost("/experience/compile", { prompt: intent.prompt, ...(intent.assetId ? { assetId: intent.assetId } : {}) });
  if (!result?.experience) throw new Error("Invalid compiler response");
  return result.experience as Experience;
}
