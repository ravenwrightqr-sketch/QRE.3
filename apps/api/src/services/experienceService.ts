import { buildPresenceContext, compileCognitiveExperience, summarizeCognitiveAnalytics } from "@qre/engine";
import type {
  AuthorBrainTruth,
  CognitiveAuthorMedia,
  ExperienceBeat,
  ExperiencePresenceContext,
  IdentityState,
  MemoryContext,
} from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import { memoryContextToCognitiveSummary } from "./memoryProjection.js";
import { buildAuthorIdentityState } from "./authorIdentityState.js";
import { buildCognitiveAuthorContext } from "./authorCognitiveContext.js";
import { authorMoviePipeline } from "./authorMoviePipeline.js";
import { persistAuthorLearning } from "./authorLearningLoop.js";
import { loadAuthorMediaContext } from "./authorMediaSource.js";
import { buildAuthorProvenanceFacts } from "./authorProvenanceSource.js";

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
  learning?: { analyticsType: "AUTHOR_INPUT_ACCEPTED"; observedAt: string } | null;
  geo?: GeoAnchorInput | null;
  presence?: ExperiencePresenceContext | null;
  identityState?: IdentityState | null;
  warnings?: string[];
  [key: string]: unknown;
};

function applyAuthorBeats(compiled: any, beats: ExperienceBeat[]): any {
  if (!beats.length) return compiled;

  const templateScenes = Array.isArray(compiled.cinematicScenes)
    ? compiled.cinematicScenes
    : [];
  const templateMoments = Array.isArray(compiled.moments)
    ? compiled.moments
    : [];
  const baseScene = templateScenes[0] ?? {
    id: "author-scene-1",
    type: "action",
    duration: 1200,
    transition: "fade",
    visual: { theme: "cinematic", animation: "parallax" },
    meta: {},
  };

  const cinematicScenes = beats.map((beat, index) => {
    const template = templateScenes[index] ?? baseScene;
    const baseMoment = templateMoments[index] ?? template.moment ?? {
      type: "message",
      order: index,
      meta: {},
    };
    const duration = beat.durationHintMs ?? template.duration ?? 1200;

    if (beat.kind === "photo" && beat.media) {
      return {
        ...template,
        id: `author-scene-${index + 1}`,
        order: index,
        duration,
        type: "action",
        transition: index === 0 ? "none" : "fade",
        moment: {
          ...baseMoment,
          type: "media",
          order: index,
          text: "",
          title: undefined,
          description: undefined,
          media: beat.media,
          meta: {
            ...(baseMoment.meta ?? {}),
            authoredBy: "qre-author-brain",
            beatId: beat.id,
            beatKind: "photo",
            attentionRole: beat.attentionRole ?? "photo",
            callback: beat.callback ?? false,
            sceneRule: "silent_photo_beat",
          },
        },
        meta: {
          ...(template.meta ?? {}),
          authoredBy: "qre-author-brain",
          beatId: beat.id,
          beatKind: "photo",
          callback: beat.callback ?? false,
          sceneRule: "silent_photo_beat",
        },
      };
    }

    return {
      ...template,
      id: `author-scene-${index + 1}`,
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
        media: undefined,
        meta: {
          ...(baseMoment.meta ?? {}),
          authoredBy: "qre-author-brain",
          beatId: beat.id,
          beatKind: beat.kind,
          attentionRole: beat.attentionRole ?? null,
          callback: beat.callback ?? false,
          sceneRule: "one_short_thought_per_beat",
        },
      },
      meta: {
        ...(template.meta ?? {}),
        authoredBy: "qre-author-brain",
        beatId: beat.id,
        beatKind: beat.kind,
        callback: beat.callback ?? false,
        sceneRule: "one_short_thought_per_beat",
      },
    };
  });

  return {
    ...compiled,
    beats,
    moments: cinematicScenes.map((scene) => scene.moment),
    cinematicScenes,
    momentCount: cinematicScenes.length,
    estimatedDuration: cinematicScenes.reduce(
      (sum, scene) => sum + Number(scene.duration || 1200),
      0,
    ),
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
  mediaLoader?: (assetId: string, subject?: string) => Promise<CognitiveAuthorMedia[]>;
}): Promise<CompiledExperienceResult> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Experience prompt required");

  const warnings: string[] = [];
  let memoryContext: MemoryContext | undefined;
  let identityState: IdentityState | null = null;

  if (input.assetId) {
    try {
      identityState = await buildAuthorIdentityState({
        assetId: input.assetId,
        userId: input.userId,
        subject: undefined,
        location: input.geoAnchor
          ? {
              label: input.geoAnchor.label,
              city: input.geoAnchor.city,
              region: input.geoAnchor.region,
              country: input.geoAnchor.country,
              latitude: input.geoAnchor.latitude,
              longitude: input.geoAnchor.longitude,
              role: input.geoAnchor.role,
              source: input.geoAnchor.source,
              observedAt: input.geoAnchor.time,
            }
          : undefined,
        memoryRepository: input.memoryRepository,
      });
    } catch (error) {
      console.warn("[QRE][AUTHORING] Identity state unavailable; continuing with existing context paths.", error);
      warnings.push("identity_state_unavailable");
    }
  }

  if (input.assetId && input.memoryRepository) {
    try {
      memoryContext = await input.memoryRepository.loadContext({
        assetId: input.assetId,
        userId: input.userId,
      });
    } catch (error) {
      console.warn("[QRE][AUTHORING] Memory context unavailable; continuing with prompt-only cognition.", error);
      warnings.push("memory_context_unavailable");
    }
  }

  const identityFacts = identityState?.canonicalFacts.map((fact) => fact.text) ?? [];
  const memorySummary = memoryContext
    ? memoryContextToCognitiveSummary(memoryContext)
    : identityState?.canonicalFacts.slice(0, 32).map((fact) => fact.text) ?? [];

  let analyticsEvents = input.analyticsEvents ?? [];
  if (input.assetId && analyticsEvents.length === 0) {
    try {
      const analyticsRepository = createAnalyticsRepository();
      analyticsEvents = await analyticsRepository.findEvents({
        assetId: input.assetId,
        limit: 200,
      });
    } catch (error) {
      console.warn("[QRE][AUTHORING] Analytics context unavailable; continuing without historical analytics.", error);
      analyticsEvents = [];
      warnings.push("analytics_context_unavailable");
    }
  }

  let presence: ExperiencePresenceContext | null = null;
  if (input.assetId) {
    try {
      presence = await buildPresenceContext(
        input.assetId,
        createPresenceRepository(),
        input.sessionId,
      );
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
    memorySummary: [
      ...memorySummary,
      ...identityFacts,
      ...(identityState?.recentEvents ?? []),
      ...(identityState?.recurringPatterns ?? []),
      ...presenceSummary,
    ].slice(0, 120),
    presence: presence ?? undefined,
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
          description:
            role === "physical_site"
              ? "Persistent physical site for this QRE asset."
              : undefined,
        }
      : undefined,
  });

  const subject = String(
    identityState?.subject.value ?? compiled?.observation?.subject ?? compiled?.movie?.subject ?? "",
  ).trim();

  const facts = [
    ...identityFacts,
    ...(identityState?.traits.map((fact) => fact.text) ?? []),
    ...(identityState?.preferences.map((fact) => fact.text) ?? []),
    ...(identityState?.activities.map((fact) => fact.text) ?? []),
    ...(identityState?.goals.map((goal) => goal.text) ?? []),
    ...(identityState?.intentions.map((intent) => intent.text) ?? []),
    ...(identityState?.recentEvents ?? []),
    ...(identityState?.recurringPatterns ?? []),
    ...(Array.isArray(compiled?.observation?.entities?.people)
      ? compiled.observation.entities.people
      : []),
    ...(Array.isArray(compiled?.observation?.entities?.places)
      ? compiled.observation.entities.places
      : []),
    ...(Array.isArray(compiled?.observation?.entities?.events)
      ? compiled.observation.entities.events
      : []),
    ...(Array.isArray(compiled?.observation?.entities?.objects)
      ? compiled.observation.entities.objects
      : []),
    ...(Array.isArray(compiled?.observation?.temporal)
      ? compiled.observation.temporal
      : []),
    ...(Array.isArray(compiled?.facts) ? compiled.facts : []),
    ...(presence?.places?.slice(0, 12) ?? []),
    presence?.visitNumber ? `visit ${presence.visitNumber}` : "",
    presence?.isReturning ? "returning visit" : "first known visit",
  ]
    .map(String)
    .filter(Boolean);

  const sourceMoments = [
    ...(identityState?.recentEvents ?? []),
    ...(identityState?.canonicalFacts.slice(0, 20).map((fact) => fact.text) ?? []),
    ...(Array.isArray(compiled?.moments)
      ? compiled.moments
          .map((moment: any) =>
            String(moment?.text ?? moment?.description ?? "").trim(),
          )
          .filter(Boolean)
      : []),
    ...memorySummary,
    ...presenceSummary,
  ].slice(0, 48);

  const learnedContext = [
    ...(identityState?.creativeLearning.accepted ?? []),
    ...(identityState?.creativeLearning.rejected ?? []),
    ...(identityState?.creativeLearning.preferences ?? []),
    ...(identityState?.creativeLearning.avoidedPatterns ?? []),
    ...(identityState?.behavioralLearning.accepted ?? []),
    ...(identityState?.behavioralLearning.rejected ?? []),
  ];

  let media: CognitiveAuthorMedia[] = [];
  if (input.assetId) {
    try {
      media = await (input.mediaLoader ?? loadAuthorMediaContext)(input.assetId, subject);
    } catch (error) {
      console.warn("[QRE][AUTHORING] Media context unavailable; continuing without media.", error);
      warnings.push("media_context_unavailable");
    }
  }

  const cognitiveContext = buildCognitiveAuthorContext({
    identityState,
    geo: geo
      ? {
          label: geo.label,
          city: geo.city,
          region: geo.region,
          country: geo.country,
          latitude: geo.latitude,
          longitude: geo.longitude,
          role,
          source: geo.source,
          time: geo.time,
        }
      : null,
    presence,
    analytics,
    creativeLearning: identityState?.creativeLearning ?? null,
    provenanceFacts: buildAuthorProvenanceFacts(identityState, subject),
    media,
    authorizedCreativeInstructions: [],
    textBeatTarget: 5,
  });

  const authorInput: AuthorBrainTruth = {
    prompt,
    subject,
    place: String(geo?.label ?? presence?.places?.[0] ?? identityState?.locations?.[0]?.label ?? ""),
    lens: String(
      compiled?.cognition?.selectedHypothesis?.kind ??
        compiled?.blueprint?.tone?.[0] ??
        "neutral",
    ),
    cognitiveContext,
    facts,
    sourceMoments,
    memoryContext: [
      ...memorySummary,
      ...(identityState?.recentEvents ?? []),
      ...(identityState?.recurringPatterns ?? []),
    ],
    creativeLearningContext: [
      ...learnedContext,
      ...(Array.isArray(compiled.learningSignals)
        ? compiled.learningSignals.slice(0, 20)
        : []),
      ...presenceSummary,
    ],
    trajectory: Array.isArray(compiled?.cognition?.plan?.storyStructure)
      ? compiled.cognition.plan.storyStructure
      : [],
    returning: presence?.isReturning ?? false,
    visitNumber: presence?.visitNumber,
    presenceSummary,
  };

  try {
    const { authored, movieBeatPlan } = await authorMoviePipeline(authorInput);
    const qualityStatus = String(
      authored.diagnostics?.qualityStatus ??
        (authored.scenes.length ? "ACCEPTED" : "REJECTED_MODEL_OUTPUT"),
    );

    if (movieBeatPlan.beats.length > 0 && qualityStatus === "ACCEPTED") {
      const beats: ExperienceBeat[] = movieBeatPlan.beats.map((planned, index) => ({
        id: planned.id,
        text: planned.kind === "photo" ? "" : String(planned.text ?? ""),
        kind: planned.kind === "photo" ? "photo" : planned.kind === "cta" ? "afterglow" : "jolt",
        order: index + 1,
        attentionRole: planned.attentionRole ?? planned.kind,
        callback: planned.kind === "cta",
        durationHintMs: planned.durationHintMs ?? (planned.kind === "photo" ? 1700 : 1400),
        media: planned.media,
        meta: {
          qualityStatus,
          model: authored.diagnostics?.model ?? null,
          selectedScore: authored.diagnostics?.selectedScore ?? null,
          identityStateConfidence: identityState?.confidence ?? null,
          identityKind: identityState?.kind ?? null,
          identityContext: identityState?.activeContext ?? null,
          planner: "movie-beat-plan",
          plannerKind: planned.kind,
          sourceIds: planned.sourceIds,
          reason: planned.reason,
          silent: planned.silent ?? planned.kind === "photo",
        },
      }));

      compiled = applyAuthorBeats(compiled, beats);
    } else {
      warnings.push("author_quality_rejected");
    }
  } catch (error) {
    console.warn("[QRE][AUTHORING] Author Movie Pipeline unavailable; preserving deterministic compiled experience.", error);
    warnings.push("author_movie_pipeline_unavailable");
  }

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
      presence: presence ?? null,
      identityState: identityState
        ? {
            identityId: identityState.identityId,
            kind: identityState.kind,
            subject: identityState.subject.value,
            currentState: identityState.currentState,
            activeContext: identityState.activeContext,
            recurringPatterns: identityState.recurringPatterns,
            sourceMemoryCount: identityState.sourceMemoryCount,
            sourceEventCount: identityState.sourceEventCount,
            confidence: identityState.confidence,
          }
        : null,
      cognitiveAuthorContext: cognitiveContext,
      cinematicAuthor: {
        authoringAtom: "experience_beat",
        sceneRule: "one_short_thought_per_beat",
        presentation: "adaptive_line_rhythm",
        hardPunctuationRule: "no_comma_or_semicolon_scene_cuts",
        playerOwnsExactPresentation: true,
        photoBeatRule: "silent_photo_beat",
      },
    },
  };

  const result: CompiledExperienceResult = {
    ...compiled,
    blueprint: enrichedBlueprint,
    geo: geo ?? null,
    presence,
    identityState,
    warnings,
  };

  if (input.assetId && input.memoryRepository) {
    try {
      const learningResult = await persistAuthorLearning(
        {
          assetId: input.assetId,
          userId: input.userId,
          sessionId: input.sessionId,
          prompt,
          source: "prompt",
          world: compiled.world,
        },
        {
          memoryRepository: input.memoryRepository,
          analyticsRepository: createAnalyticsRepository(),
        },
      );

      return {
        ...result,
        memory: learningResult.memory,
        learning: {
          analyticsType: learningResult.analyticsType,
          observedAt: learningResult.observedAt,
        },
      };
    } catch (error) {
      console.warn("[QRE][AUTHORING] Learning persistence failed after compile; preserving generated experience.", error);
      warnings.push("learning_persistence_failed");
      return { ...result, warnings };
    }
  }

  return result;
}
