import { apiPost } from "./api";

export type CreativeSeed = {
  id: string;
  label: string;
  kind: string;
  options: string[];
  placeholder?: string;
  optional?: boolean;
};

export type CreativeSeedPlan = {
  mode: "memory" | "service_promo" | "business" | "event" | "personal" | "artifact" | "unknown";
  title: string;
  prompt: string;
  seeds: CreativeSeed[];
  skipLabel: string;
  continueLabel: string;
};

export async function getCreativeSeedPlan(prompt: string): Promise<CreativeSeedPlan> {
  const result = await apiPost("/api/ai/seeds", { prompt });
  if (!result?.plan) throw new Error(result?.error || "Creative seed plan unavailable.");
  return result.plan as CreativeSeedPlan;
}
