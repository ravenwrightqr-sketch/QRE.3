import { buildPresenceContext, compileCognitiveExperience, summarizeCognitiveAnalytics } from "@qre/engine";
import type { ExperienceBeat, ExperiencePresenceContext, MemoryContext } from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "./memoryProjection.js";
import { authorMicroBeats } from "./microBeatMouth.js";
import { resolveSubjectTruth } from "./authorTruth.js";

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
  beats?: ExperienceBeat[];
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
  presence?: ExperiencePresenceContext | null;
  movieMode?: boolean;
  warnings?: string[];
  [key: string]: unknown;
};

function applyMicroBeats(compiled: any, beats: ExperienceBeat[]): any {
  if (!beats.length) return compiled;

  const templateScenes = Array.isArray(compiled.cinematicScenes) ? compiled.cinematicScenes : [];
  const templateMoments = Array.isArray(compiled.moments) ? compiled.moments : [];
  const baseScene = templateScenes[0] ?? {
    id: "micro-beat-scene-1",
    type: "action",
    duration: 1200,
    transition: "fade",
    visual: { theme: "cinematic", animation: "parallax" },
    meta: {},
  };

  const cinematicScenes = beats.map((beat, index) => {
    const template = templateScenes[index] ?? baseScene;
    const baseMoment = templateMoments[index] ?? template.moment ?? { type: "message", order: index, meta: {} };
    const duration = beat.durationHintMs ?? template.duration ?? 1200;
    return {
      ...template,
      id: `micro-beat-scene-${index + 1}`,
      order: index,
      duration,
      type: index === 0 ? "intro" : index === beats.length - 1 ? "emotion" : "action",
      transition: index === 0 ? "none" : index === beats.length - 1 ? "cinematic" : "fade",
      moment: {
        ...baseMoment,
        type: "message",
        order: index,
        text: beat.text,
        title: undefined,
        description: undefined,
        meta: {
          ...(baseMoment.meta ?? {}),
          authoredBy: "qre-universal-author",
          beatId: beat.id,
          beatKind: beat.kind,
          attentionRole: beat.attentionRole ?? null,
          operator: beat.operator ?? null,
          callback: beat.callback ?? false,
          sceneRule: "one_micro_thought_per_beat",
          creativeAngle: beat.meta?.creativeAngle ?? null,
          creativeEngine: beat.meta?.creativeEngine ?? null,
        },
      },
      meta: {
        ...(template.meta ?? {}),
        authoredBy: "qre-universal-author",
        beatId: beat.id,
        beatKind: beat.kind,
        callback: beat.callback ?? false,
        sceneRule: "one_micro_thought_per_beat",
        creativeAngle: beat.meta?.creativeAngle ?? null,
        creativeEngine: beat.meta?.creativeEngine ?? null,
      },
    };
  });

  return {
    ...compiled,
    beats,
    moments: cinematicScenes.map((scene) => scene.moment),
    cinematicScenes,
    momentCount: cinematicScenes.length,
    estimatedDuration: cinematicScenes.reduce((sum, scene) => sum + Number(scene.duration || 1200), 0),
  };
}

export async function compileExperience(input: {
  prompt: string;
  assetId?: string;
  userId?: string;
  sessionId?: string;
  memoryRepository?: MemoryRepository;
  analyticsEvents?: unknown[];
  geoAnchor?: GeoAnchorInput;
  movieMode?: boolean;
}): Promise<CompiledExperienceResult> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Experience prompt required");

  const movieMode = input.movieMode !== false;
  const warnings: string[] = [];
  let memoryContext: MemoryContext | undefined;
  if (input.assetId && input.memoryRepository) {
    try {
      memoryContext = await input.memoryRepository.loadContext({ assetId: input.assetId, userId: input.userId });
    } catch (error) {
      console.warn("[QRE][AUTHORING] Memory context unavailable; continuing with prompt-only cognition.", error);
      warnings.push("memory_context_unavailable");
    }
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

  let presence: ExperiencePresenceContext | null = null;
  if (input.assetId) {
    try {
      presence = await buildPresenceContext(input.assetId, createPresenceRepository(), input.sessionId);
    } catch (error) {
      console.warn("[QRE][AUTHORING] Presence context unavailable; continuing without presence history.", error);
      warnings.push("presence_context_unavailable");
    }
  }

  const analytics = summarizeCognitiveAnalytics(analyticsEvents);
  const geo = input.geoAnchor;
  const role = geo?.role ?? "experience_place";
  const presenceSummary = presence?.summary ?? [];

  let compiled: any = compileCognitiveExperience(prompt, {
    memorySummary: [...memorySummary, ...presenceSummary],
    presence: presence ?? undefined,
    analytics,
    location: geo ? {
      label: geo.label,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
      role,
      source: geo.source,
    } : undefined,
    event: geo ? {
      venue: geo.label,
      date: geo.time,
      description: role === "physical_site" ? "Persistent physical site for this QRE asset." : undefined,
    } : undefined,
  });

  const subject = String(compiled?.observation?.subject ?? compiled?.movie?.subject ?? "").trim();
  const subjectTruth = resolveSubjectTruth(subject, prompt, memoryContext);

  if (movieMode) {
    try {
      const beats = await authorMicroBeats({
        prompt,
        lens: String(compiled?.cognition?.selectedHypothesis?.kind ?? compiled?.blueprint?.tone?.[0] ?? "neutral"),
        subject,
        place: String(geo?.label ?? presence?.places?.[0] ?? ""),
        subjectTruth,
        cognitivePlan: compiled?.plan,
        movieMode,
        facts: [
          ...(Array.isArray(compiled?.observation?.entities?.people) ? compiled.observation.entities.people : []),
          ...(Array.isArray(compiled?.observation?.entities?.places) ? compiled.observation.entities.places : []),
          ...(Array.isArray(compiled?.observation?.entities?.events) ? compiled.observation.entities.events : []),
          ...(Array.isArray(compiled?.observation?.entities?.objects) ? compiled.observation.entities.objects : []),
          ...(Array.isArray(compiled?.observation?.temporal) ? compiled.observation.temporal : []),
          ...presence?.places?.slice(0, 12) ?? [],
          presence?.visitNumber ? `visit ${presence.visitNumber}` : "",
          presence?.isReturning ? "returning visit" : "first known visit",
        ].filter(Boolean),
        sourceMoments: [
          ...(Array.isArray(compiled.moments) ? compiled.moments.map((moment: any) => String(moment?.text ?? moment?.description ?? "").trim()).filter(Boolean) : []),
          ...memorySummary,
          ...presenceSummary,
        ].slice(0, 32),
        memoryContext: [...memorySummary, ...presenceSummary],
        creativeLearningContext: Array.isArray(compiled.learningSignals) ? [...compiled.learningSignals.slice(0, 20), ...presenceSummary] : presenceSummary,
        trajectory: Array.isArray(compiled?.cognition?.plan?.storyStructure) ? compiled.cognition.plan.storyStructure : [],
        returning: presence?.isReturning ?? false,
        visitNumber: presence?.visitNumber,
        presenceSummary,
        presence: presence ?? undefined,
        round: presence?.visitNumber ?? 1,
      });

      if (beats.length >= 2) compiled = applyMicroBeats(compiled, beats);
      else warnings.push("micro_beat_mouth_fallback");
    } catch (error) {
      console.warn("[QRE][AUTHORING] Universal micro-beat mouth unavailable; preserving deterministic sequence.", error);
      warnings.push("micro_beat_mouth_unavailable");
    }
  }

  const enrichedBlueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    metadata: {
      ...((compiled.blueprint as any)?.metadata ?? {}),
      geoAnchor: geo ? {
        role,
        label: geo.label ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        source: geo.source ?? "dashboard",
        time: geo.time ?? null,
      } : null,
      presence: presence ?? null,
      cinematicAuthor: {
        authoringAtom: "experience_beat",
        sceneRule: "one_micro_thought_per_beat",
        presentation: "adaptive_line_rhythm",
        hardPunctuationRule: "no_comma_or_semicolon_scene_cuts",
        playerOwnsExactPresentation: true,
        movieMode,
      },
    },
  };

  const result: CompiledExperienceResult = {
    ...compiled,
    blueprint: enrichedBlueprint,
    geo: geo ?? null,
    presence,
    movieMode,
    warnings,
  };

  if (input.assetId && input.memoryRepository) {
    try {
      const batch = buildExperienceMemoryBatch({ assetId: input.assetId, userId: input.userId, world: compiled.world, source: "prompt" });
      await input.memoryRepository.writeBatch(batch);
      return {
        ...result,
        memory: {
          entities: batch.entities.length,
          facts: batch.facts.length,
          relations: batch.relations.length,
          events: batch.events.length,
        },
      };
    } catch (error) {
      console.warn("[QRE][AUTHORING] Memory projection failed after compile; preserving generated experience.", error);
      warnings.push("memory_projection_failed");
      return { ...result, warnings };
    }
  }

  return result;
}
