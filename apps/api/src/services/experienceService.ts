import { compileCognitiveExperience, summarizeCognitiveAnalytics } from "@qre/engine";
import type { MemoryContext } from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import {
  buildExperienceMemoryBatch,
  memoryContextToCognitiveSummary,
} from "./memoryProjection.js";

export type GeoAnchorInput = {
  label?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  role?: "physical_site" | "experience_place" | "event_venue" | "memory_place" | "reference_place";
  source?: string;
  time?: string;
};

export type CompiledExperienceResult = {
  title: string;
  blueprint: any;
  flowSteps: any[];
  moments: any[];
  cinematicScenes: any[];
  estimatedDuration: number;
  momentCount: number;
  plan: unknown;
  world?: unknown;
  adaptiveQuestions?: string[];
  discoveries?: string[];
  learningSignals?: string[];
  cognition?: unknown;
  memory?: { entities: number; facts: number; relations: number; events: number };
  geo?: GeoAnchorInput | null;
  [key: string]: unknown;
};

export async function compileExperience(input: {
  prompt: string;
  assetId?: string;
  userId?: string;
  memoryRepository?: MemoryRepository;
  analyticsEvents?: unknown[];
  geoAnchor?: GeoAnchorInput;
}): Promise<CompiledExperienceResult> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Experience prompt required");

  let memoryContext: MemoryContext | undefined;
  if (input.assetId && input.memoryRepository) {
    memoryContext = await input.memoryRepository.loadContext({ assetId: input.assetId, userId: input.userId });
  }

  const memorySummary = memoryContext ? memoryContextToCognitiveSummary(memoryContext) : [];
  let analyticsEvents = input.analyticsEvents ?? [];
  if (input.assetId && analyticsEvents.length === 0) {
    const analyticsRepository = createAnalyticsRepository();
    analyticsEvents = await analyticsRepository.findEvents({ assetId: input.assetId, limit: 200 });
  }

  const analytics = summarizeCognitiveAnalytics(analyticsEvents);
  const geo = input.geoAnchor;
  const role = geo?.role ?? "experience_place";
  const compiled = compileCognitiveExperience(prompt, {
    memorySummary,
    analytics,
    location: geo
      ? {
          label: geo.label,
          city: geo.city,
          region: geo.region,
          country: geo.country,
          latitude: geo.latitude,
          longitude: geo.longitude,
          role,
          source: geo.source,
        }
      : undefined,
    event: geo
      ? {
          venue: geo.label,
          date: geo.time,
          description: role === "physical_site" ? "Persistent physical site for this QRE asset." : undefined,
        }
      : undefined,
  });

  const enrichedBlueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    metadata: {
      ...((compiled.blueprint as any)?.metadata ?? {}),
      geoAnchor: geo
        ? {
            role,
            label: geo.label ?? null,
            latitude: geo.latitude ?? null,
            longitude: geo.longitude ?? null,
            source: geo.source ?? "dashboard",
            time: geo.time ?? null,
          }
        : null,
    },
  };

  const result = { ...compiled, blueprint: enrichedBlueprint, geo: geo ?? null };

  if (input.assetId && input.memoryRepository) {
    const batch = buildExperienceMemoryBatch({
      assetId: input.assetId,
      userId: input.userId,
      world: compiled.world,
      source: "prompt",
    });

    await input.memoryRepository.writeBatch(batch);
    return {
      ...result,
      memory: { entities: batch.entities.length, facts: batch.facts.length, relations: batch.relations.length, events: batch.events.length },
    };
  }

  return result;
}
