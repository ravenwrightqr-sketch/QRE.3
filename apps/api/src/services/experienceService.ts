import { buildPresenceContext, compileCognitiveExperience, summarizeCognitiveAnalytics } from "@qre/engine";
import type { MemoryContext } from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "./memoryProjection.js";
import { authorCinematicSequence } from "./cinematicAuthor.js";

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
  memory?: { entities: number; facts: number; relations: number; events: number } | null;
  geo?: GeoAnchorInput | null;
  presence?: unknown;
  warnings?: string[];
  [key: string]: unknown;
};

function applyCinematicAuthor(
  compiled: any,
  authoredScenes: Array<{ text: string; kind?: string; durationHintMs?: number; transitionHint?: string; audioMood?: string; visualHint?: string }>,
): any {
  if (!authoredScenes.length) return compiled;

  const templateScenes = Array.isArray(compiled.cinematicScenes) ? compiled.cinematicScenes : [];
  const templateMoments = Array.isArray(compiled.moments) ? compiled.moments : [];
  const baseScene = templateScenes[0] ?? {
    id: "cinematic-authored-1",
    type: "action",
    duration: 3000,
    transition: "fade",
    visual: { theme: "cinematic", animation: "parallax" },
    meta: {},
  };

  const cinematicScenes = authoredScenes.map((authored, index) => {
    const template = templateScenes[index] ?? baseScene;
    const baseMoment = templateMoments[index] ?? template.moment ?? { type: "message", order: index, meta: {} };
    const duration = authored.durationHintMs ?? template.duration ?? 3000;
    const transition = authored.transitionHint || (index === 0 ? "none" : index === authoredScenes.length - 1 ? "cinematic" : "fade");
    return {
      ...template,
      id: `authored-cinematic-${index + 1}`,
      order: index,
      duration,
      type: index === 0 ? "intro" : index === authoredScenes.length - 1 ? "emotion" : "action",
      transition,
      moment: {
        ...baseMoment,
        type: "message",
        order: index,
        text: authored.text.trim(),
        title: undefined,
        description: undefined,
        meta: {
          ...(baseMoment.meta ?? {}),
          authoredBy: "qre-cinematic-author",
          sequenceKind: authored.kind ?? "movement",
          sceneRule: "one_short_thought_per_scene",
          audioMood: authored.audioMood ?? null,
          visualHint: authored.visualHint ?? null,
        },
      },
      meta: {
        ...(template.meta ?? {}),
        authoredBy: "qre-cinematic-author",
        sequenceKind: authored.kind ?? "movement",
        sceneRule: "one_short_thought_per_scene",
        audioMood: authored.audioMood ?? null,
        visualHint: authored.visualHint ?? null,
      },
    };
  });

  return {
    ...compiled,
    moments: cinematicScenes.map((scene) => scene.moment),
    cinematicScenes,
    momentCount: cinematicScenes.length,
    estimatedDuration: cinematicScenes.reduce((sum, scene) => sum + Number(scene.duration || 3000), 0),
  };
}

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

  const warnings: string[] = [];
  let memoryContext: MemoryContext | undefined;
  if (input.assetId && input.memoryRepository) {
    try { memoryContext = await input.memoryRepository.loadContext({ assetId: input.assetId, userId: input.userId }); }
    catch (error) { console.warn("[QRE][AUTHORING] Memory context unavailable; continuing with prompt-only cognition.", error); warnings.push("memory_context_unavailable"); }
  }

  const memorySummary = memoryContext ? memoryContextToCognitiveSummary(memoryContext) : [];
  let analyticsEvents = input.analyticsEvents ?? [];
  if (input.assetId && analyticsEvents.length === 0) {
    try {
      const analyticsRepository = createAnalyticsRepository();
      analyticsEvents = await analyticsRepository.findEvents({ assetId: input.assetId, limit: 200 });
    } catch (error) {
      console.warn("[QRE][AUTHORING] Analytics context unavailable; continuing without historical analytics.", error);
      analyticsEvents = [];
      warnings.push("analytics_context_unavailable");
    }
  }

  let presenceContext: Awaited<ReturnType<typeof buildPresenceContext>> | undefined;
  if (input.assetId) {
    try {
      presenceContext = await buildPresenceContext(input.assetId, createPresenceRepository());
    } catch (error) {
      console.warn("[QRE][AUTHORING] Presence context unavailable; continuing without presence history.", error);
      warnings.push("presence_context_unavailable");
    }
  }

  const analytics = summarizeCognitiveAnalytics(analyticsEvents);
  const geo = input.geoAnchor;
  const role = geo?.role ?? "experience_place";
  const presenceSummary = presenceContext?.summary ?? [];
  let compiled: any = compileCognitiveExperience(prompt, {
    memorySummary: [...memorySummary, ...presenceSummary],
    presence: presenceContext,
    analytics,
    location: geo ? { label: geo.label, city: geo.city, region: geo.region, country: geo.country, latitude: geo.latitude, longitude: geo.longitude, role, source: geo.source } : undefined,
    event: geo ? { venue: geo.label, date: geo.time, description: role === "physical_site" ? "Persistent physical site for this QRE asset." : undefined } : undefined,
  });

  try {
    const authored = await authorCinematicSequence({
      prompt,
      lens: String(compiled?.cognition?.selectedHypothesis?.kind ?? compiled?.blueprint?.tone?.[0] ?? "neutral"),
      subject: String(compiled?.observation?.subject ?? compiled?.movie?.subject ?? ""),
      place: String(geo?.label ?? presenceContext?.places?.[0] ?? ""),
      sourceMoments: [
        ...(Array.isArray(compiled.moments) ? compiled.moments.map((moment: any) => String(moment?.text ?? moment?.description ?? "").trim()).filter(Boolean) : []),
        ...(memorySummary as string[]),
        ...presenceSummary,
      ].slice(0, 32),
      facts: [
        ...(Array.isArray(compiled?.observation?.entities?.people) ? compiled.observation.entities.people : []),
        ...(Array.isArray(compiled?.observation?.entities?.places) ? compiled.observation.entities.places : []),
        ...(Array.isArray(compiled?.observation?.entities?.events) ? compiled.observation.entities.events : []),
        ...(Array.isArray(compiled?.observation?.entities?.objects) ? compiled.observation.entities.objects : []),
        ...(Array.isArray(compiled?.observation?.temporal) ? compiled.observation.temporal : []),
        ...presenceContext?.places?.slice(0, 12) ?? [],
        presenceContext?.visitNumber ? `visit ${presenceContext.visitNumber}` : "",
        presenceContext?.isReturning ? "returning visit" : "first known visit",
      ].filter(Boolean),
      memoryContext: [...memorySummary, ...presenceSummary],
      creativeLearningContext: Array.isArray(compiled.learningSignals) ? [...compiled.learningSignals.slice(0, 20), ...presenceSummary] : presenceSummary,
      trajectory: Array.isArray(compiled?.cognition?.plan?.storyStructure) ? compiled.cognition.plan.storyStructure : [],
    });

    if (authored.length >= 3) compiled = applyCinematicAuthor(compiled, authored);
    else warnings.push("cinematic_author_fallback");
  } catch (error) {
    console.warn("[QRE][AUTHORING] Cinematic author unavailable; preserving deterministic sequence.", error);
    warnings.push("cinematic_author_unavailable");
  }

  const enrichedBlueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    metadata: {
      ...((compiled.blueprint as any)?.metadata ?? {}),
      geoAnchor: geo ? { role, label: geo.label ?? null, latitude: geo.latitude ?? null, longitude: geo.longitude ?? null, source: geo.source ?? "dashboard", time: geo.time ?? null } : null,
      presence: presenceContext ?? null,
      cinematicAuthor: {
        sceneRule: "one_short_thought_per_scene",
        sequenceAppendsAllowed: true,
        playerOwnsExactPresentation: true,
      },
    },
  };

  const result: CompiledExperienceResult = { ...compiled, blueprint: enrichedBlueprint, geo: geo ?? null, presence: presenceContext ?? null, warnings };

  if (input.assetId && input.memoryRepository) {
    try {
      const batch = buildExperienceMemoryBatch({ assetId: input.assetId, userId: input.userId, world: compiled.world, source: "prompt" });
      await input.memoryRepository.writeBatch(batch);
      return { ...result, memory: { entities: batch.entities.length, facts: batch.facts.length, relations: batch.relations.length, events: batch.events.length } };
    } catch (error) {
      console.warn("[QRE][AUTHORING] Memory projection failed after compile; preserving generated experience.", error);
      warnings.push("memory_projection_failed");
      return { ...result, warnings };
    }
  }

  return result;
}
