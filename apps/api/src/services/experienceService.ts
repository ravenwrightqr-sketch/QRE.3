/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: Production authoring adapter: canonical Author → durable experience/flow.
 * LAW: QRE may surprise us.
 * Guardrails protect truth, provenance, architecture, and safety; style is scored.
 */
import { buildPresenceContext } from "@qre/engine";
import { db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import type {
  AuthorBrainTruth,
  AuthorDomainContext,
  AuthorExperienceState,
  ExperienceBeat,
  ExperiencePresenceContext,
  MemoryContext,
} from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import {
  authorExperienceMemoryContext,
  authorExperienceStateToMemoryBatch,
  extractAuthorExperienceStates,
  mergeAuthorExperienceStates,
} from "./authorExperienceMemory.js";
import { adaptAuthorExperienceState } from "./authorAdaptiveTempo.js";
import { buildAuthorBehaviorProfile } from "./authorBehaviorProfile.js";
import { buildAuthorExperienceState } from "./authorExperienceState.js";
import { authorBrainCanonical } from "./authorBrainCanonical.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { resolveSubjectTruth } from "./authorTruth.js";
import { getCreativeLearningContext, learningContextLines } from "./creativeLearning.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "./memoryProjection.js";

export type GeoAnchorInput = {
  label?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  role?:
    | "physical_site"
    | "experience_place"
    | "event_venue"
    | "memory_place"
    | "reference_place";
  source?: string;
  time?: string;
};

export type CompiledExperienceResult = {
  title: string;
  blueprint: Record<string, unknown>;
  flowSteps: Array<Record<string, unknown>>;
  moments: Array<Record<string, unknown>>;
  cinematicScenes: Array<Record<string, unknown>>;
  beats?: ExperienceBeat[];
  estimatedDuration: number;
  momentCount: number;
  plan: unknown;
  world?: unknown;
  adaptiveQuestions?: string[];
  discoveries?: string[];
  learningSignals?: string[];
  cognition?: unknown;
  authorExperienceState?: unknown;
  authorDiagnostics?: unknown;
  memory?: { entities: number; facts: number; relations: number; events: number } | null;
  geo?: GeoAnchorInput | null;
  presence?: ExperiencePresenceContext | null;
  movieMode?: boolean;
  warnings?: string[];
  [key: string]: unknown;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") return value.split(/[,|]/).map(clean).filter(Boolean);
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map(clean).filter(Boolean)
    : [];
}

function buildAssetDomainContext(asset: any): AuthorDomainContext | undefined {
  if (!asset) return undefined;
  const data = asRecord(asset.templateData);
  const context: AuthorDomainContext = {
    category: clean(asset.category || data?.category),
    businessType: clean(data?.businessType || asset.account?.type),
    businessName: clean(data?.businessName || asset.account?.name || asset.displayName),
    businessDescription: clean(data?.businessDescription || data?.description),
    serviceType: clean(data?.serviceType || data?.service_type),
    serviceName: clean(data?.serviceName || data?.service || data?.offering),
    subjectKind: clean(data?.subjectKind || data?.subject_kind),
    knownCapabilities: unique([
      ...stringList(data?.services),
      ...stringList(data?.capabilities),
      ...stringList(data?.offerings),
      ...stringList(data?.serviceNames),
    ]).slice(0, 24),
    contextualSignals: unique([
      ...stringList(data?.contextualSignals),
      ...stringList(data?.signals),
    ]).slice(0, 24),
  };
  return Object.values(context).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value)) ? context : undefined;
}


function inferSubject(prompt: string, context?: MemoryContext): string {
  const normalizedPrompt = prompt.toLowerCase();
  const candidate = context?.entities
    .map((entity) => clean(entity.name))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .find((name) => normalizedPrompt.includes(name.toLowerCase()));
  return candidate ?? "the subject";
}

function experienceBeats(scenes: Array<{ text: string; kind?: string }>, sourceIds: string[][]): ExperienceBeat[] {
  return scenes.map((scene, index) => ({
    id: `canonical-beat-${index + 1}`,
    text: clean(scene.text),
    kind:
      index === scenes.length - 1
        ? "payoff"
        : index === 0
          ? "jolt"
          : scene.kind === "turn"
            ? "turn"
            : "reveal",
    order: index + 1,
    callback: false,
    meta: {
      authoredBy: "qre-author-canonical",
      sourceIds: sourceIds[index] ?? [],
      realizationPath: "authorBrainCanonical",
    },
  }));
}

function cinematicScenes(scenes: Array<{ text: string; kind?: string }>, sourceIds: string[][]): Array<Record<string, unknown>> {
  return scenes.map((scene, index) => ({
    id: `canonical-scene-${index + 1}`,
    type: index === 0 ? "intro" : index === scenes.length - 1 ? "emotion" : "action",
    duration: index === scenes.length - 1 ? 2200 : 1700,
    transition: index === 0 ? "none" : index === scenes.length - 1 ? "cinematic" : "fade",
    order: index,
    moment: {
      type: "message",
      editable: false,
      demo: false,
      order: index,
      payload: { text: clean(scene.text), sourceIds: sourceIds[index] ?? [] },
    },
    meta: {
      authoredBy: "qre-author-canonical",
      sourceIds: sourceIds[index] ?? [],
      sceneKind: scene.kind ?? "line",
      realizationPath: "authorBrainCanonical",
    },
  }));
}

function moments(scenes: Array<{ text: string; kind?: string }>, sourceIds: string[][]): Array<Record<string, unknown>> {
  return scenes.map((scene, index) => ({
    type: "message",
    editable: false,
    demo: false,
    order: index,
    payload: { text: clean(scene.text), sourceIds: sourceIds[index] ?? [], author: "qre-author-canonical" },
  }));
}
export async function compileExperience(input: {
  prompt: string;
  assetId?: string;
  userId?: string;
  sessionId?: string;
  operationId?: string;
  memoryRepository?: MemoryRepository;
  analyticsEvents?: unknown[];
  geoAnchor?: GeoAnchorInput;
  movieMode?: boolean;
  lens?: string;
}): Promise<CompiledExperienceResult> {
  const operationId =
  input.operationId ??
  input.sessionId ??
  `experience:${input.assetId ?? "unknown"}:${input.prompt}`;
  const prompt = clean(input.prompt);
  if (!prompt) throw new Error("Experience prompt required");
  const requestedMovieMode = input.movieMode !== false;
  const warnings: string[] = [];
 if (input.assetId && input.sessionId) {
  await db.scanSession.upsert({
    where: {
      id: input.sessionId,
    },
    update: {},
    create: {
      id: input.sessionId,
      assetId: input.assetId,
      userId: input.userId ?? null,
      status: "authoring",
    },
  });
}
  let domainContext: AuthorDomainContext | undefined;
  if (input.assetId) {
    try {
      const asset = await db.asset.findUnique({
        where: { id: input.assetId },
        select: {
          displayName: true,
          category: true,
          templateData: true,
          account: { select: { name: true, type: true } },
        },
      });
      domainContext = buildAssetDomainContext(asset);
    } catch (error) {
      console.warn("[QRE][AUTHORING] Domain context unavailable.", error);
      warnings.push("domain_context_unavailable");
    }
  }

  let memoryContext: MemoryContext | undefined;
  if (input.assetId && input.memoryRepository) {
    try {
      memoryContext = await input.memoryRepository.loadContext({ assetId: input.assetId, userId: input.userId });
      try {
  await createAnalyticsRepository().trackEvent({
    assetId: input.assetId,
    sessionId: input.sessionId ?? null,
    type: AnalyticsEventTypes.AI_MEMORY_USED,
    meta: {
      source: "author",
      userId: input.userId ?? null,
      entities: memoryContext.entities.length,
      facts: memoryContext.facts.length,
      relations: memoryContext.relations.length,
      events: memoryContext.events.length,
    },
  });
} catch (error) {
  console.warn(
    "[QRE][AUTHORING] AI_MEMORY_USED analytics failed.",
    error,
  );
  warnings.push("author_memory_analytics_failed");
}
    } catch (error) {
      console.warn("[QRE][AUTHORING] Memory context unavailable.", error);
      warnings.push("memory_context_unavailable");
    }
  }

  let presence: ExperiencePresenceContext | null = null;
  if (input.assetId) {
    try {
      presence = await buildPresenceContext(input.assetId, createPresenceRepository(), input.sessionId);
    } catch (error) {
      console.warn("[QRE][AUTHORING] Presence context unavailable.", error);
      warnings.push("presence_context_unavailable");
    }
  }

  const priorAuthorStates = memoryContext ? extractAuthorExperienceStates(memoryContext) : [];
  const mergedPriorAuthorState = mergeAuthorExperienceStates(priorAuthorStates);
  const persistedAuthorContext = memoryContext ? authorExperienceMemoryContext(memoryContext) : [];
  const memorySummary = memoryContext ? [...memoryContextToCognitiveSummary(memoryContext), ...persistedAuthorContext] : [];

  let learningContext;
  if (input.assetId) {
    try {
      learningContext = await getCreativeLearningContext({ assetId: input.assetId, userId: input.userId });
    } catch (error) {
      console.warn("[QRE][AUTHORING] Learning context unavailable.", error);
      learningContext = undefined;
      warnings.push("creative_learning_context_unavailable");
    }
  }

  const learningLines = learningContext ? learningContextLines(learningContext) : [];
  const learnedProfile = buildAuthorBehaviorProfile(learningLines);
  const subject = inferSubject(prompt, memoryContext);
  const place = clean(input.geoAnchor?.label) || clean(presence?.places?.[0]);
  const subjectTruth = resolveSubjectTruth(subject, prompt, memoryContext);
  const priorScenes = priorAuthorStates.flatMap((state) => state.chapter.semanticTurns);
  const sourceMoments = unique([prompt, ...(memoryContext?.events ?? []).map((event) => clean(event.summary))]).slice(0, 40);
  const facts = unique([...(memoryContext?.facts ?? []).filter((fact) => fact.status === "active" && fact.confidence >= 0.7).map((fact) => `${clean(fact.predicate)}: ${clean(fact.value)}`)]).slice(0, 80);
  const trajectory = unique([...priorScenes, ...(presence?.summary ?? [])]).slice(0, 40);
  const presenceSummary = unique(presence?.summary ?? []).slice(0, 24);

const authorInput: AuthorBrainTruth = {
  prompt,
  subject,
  place,
  subjectTruth,
  movieMode: requestedMovieMode,
  lens: clean(input.lens),
  domainContext,
  returning: presence?.isReturning ?? false,
  visitNumber: presence?.visitNumber,
  presenceSummary,
  facts,
  sourceMoments,
  memoryContext: memorySummary.slice(0, 80),
  trajectory,
  creativeLearningContext: learningLines.slice(0, 100),
  priorExperienceStates: priorAuthorStates,
};

  const canonical = await authorBrainCanonical(authorInput);
  if (input.assetId) {
  try {
    await createAnalyticsRepository().trackEvent({
      assetId: input.assetId,
      sessionId: input.sessionId ?? null,
      type: AnalyticsEventTypes.AI_CINEMATIC_DECISION,
      meta: {
        source: "author",
        userId: input.userId ?? null,
        lens: clean(input.lens),
        resolvedLens: clean(canonical.brief.angle),
        movieId: canonical.movie?.id ?? null,
        realizationMode: canonical.realizationMode,
        beatCount: canonical.sequence.cuts.length,
        selectedScore: canonical.diagnostics.selectedScore,
        qualityStatus: canonical.diagnostics.qualityStatus,
        renderable: canonical.diagnostics.renderable,
      },
    });
  } catch (error) {
    console.warn(
      "[QRE][AUTHORING] AI_CINEMATIC_DECISION analytics failed.",
      error,
    );
    warnings.push("author_decision_analytics_failed");
  }
}
  const sourceIds = canonical.sequence.cuts.map((cut) => [...cut.sourceIds]);
  const authoredScenes = canonical.scenes.map((scene) => ({ text: clean(scene.text), kind: scene.kind }));
  const beats = experienceBeats(authoredScenes, sourceIds);
  const renderedMoments = moments(authoredScenes, sourceIds);
  const renderedScenes = cinematicScenes(authoredScenes, sourceIds);

  const graph = buildAuthorRealityGraph({
    prompt,
    subject,
    place,
    facts,
    sourceMoments: [prompt, ...sourceMoments],
    memoryContext: memorySummary.slice(0, 80),
    trajectory,
  });

  let authorExperienceState: AuthorExperienceState | undefined = mergedPriorAuthorState;
  let memory: CompiledExperienceResult["memory"] = null;

  if (input.assetId && input.memoryRepository) {
    try {
      const batch = buildExperienceMemoryBatch({ operationId, assetId: input.assetId, userId: input.userId, graph, sessionId: input.sessionId, source: "prompt" });
      await input.memoryRepository.writeBatch(batch);
      memory = { entities: batch.entities.length, facts: batch.facts.length, relations: batch.relations.length, events: batch.events.length };
    } catch (error) {
      console.warn("[QRE][AUTHORING] Memory projection failed after authoring.", error);
      warnings.push("memory_projection_failed");
    }

    try {
      const nextState = buildAuthorExperienceState({
        graph,
        movie: canonical.movie,
        lens: canonical.brief.angle,
        priorScenes: authoredScenes.map((scene) => scene.text),
        memoryContext: [...memorySummary, ...presenceSummary],
        priorExperienceStates: priorAuthorStates,
        round: presence?.visitNumber ?? Math.max(1, priorAuthorStates.length + 1),
      });
      authorExperienceState = adaptAuthorExperienceState(nextState, learnedProfile);

      const stateBatch = authorExperienceStateToMemoryBatch({ operationId, assetId: input.assetId, userId: input.userId, state: authorExperienceState, sourceRef: "qre-author-canonical" });
      await input.memoryRepository.writeBatch(stateBatch);
      try {
  await createAnalyticsRepository().trackEvent({
    assetId: input.assetId,
    sessionId: input.sessionId ?? null,
    type: AnalyticsEventTypes.AI_MEMORY_LEARNED,
    meta: {
      source: "author",
      userId: input.userId ?? null,
      statePersisted: true,
      visitNumber: presence?.visitNumber ?? null,
      learningLines: learningLines.length,
      priorAuthorStates: priorAuthorStates.length,
    },
  });
} catch (error) {
  console.warn(
    "[QRE][AUTHORING] AI_MEMORY_LEARNED analytics failed.",
    error,
  );
  warnings.push("author_learning_analytics_failed");
}
    } catch (error) {
      console.warn("[QRE][AUTHORING] Author state persistence failed.", error);
      warnings.push("author_experience_state_persistence_failed");
    }
  }

  const title = clean(canonical.brief.strongestImage) || (subject !== "the subject" ? subject : "QRE Experience");
  const estimatedDuration = renderedScenes.reduce((sum, scene) => sum + Number(scene.duration ?? 0), 0);
  const authorDiagnostics = canonical.diagnostics;

  return {
    title,
    blueprint: {
      type: "experience",
      sourcePrompt: prompt,
      metadata: {
        authoring: {
          author: "qre-author-canonical",
          realizationPath: "authorBrainCanonical",
          lens: canonical.brief.angle,
          movieMode: requestedMovieMode,
          diagnostics: authorDiagnostics,
          learnedPreferenceLines: learningLines,
        },
        geoAnchor: input.geoAnchor
          ? { role: input.geoAnchor.role ?? "experience_place", label: input.geoAnchor.label ?? null, latitude: input.geoAnchor.latitude ?? null, longitude: input.geoAnchor.longitude ?? null, source: input.geoAnchor.source ?? "dashboard", time: input.geoAnchor.time ?? null }
          : null,
        presence: presence ?? null,
        authorExperienceState,
      },
    },
    flowSteps: renderedMoments.map((moment, index) => ({ order: index + 1, type: "message", payload: moment.payload })),
    moments: renderedMoments,
    cinematicScenes: renderedScenes,
    beats,
    estimatedDuration,
    momentCount: renderedMoments.length,
    plan: canonical.sequence,
    world: graph,
    adaptiveQuestions: canonical.sequence.cuts.map((cut) => clean(cut.nextPromise)).filter(Boolean),
    discoveries: canonical.sequence.cuts.map((cut) => clean(cut.informationGain)).filter(Boolean),
    learningSignals: learningLines,
    cognition: { brief: canonical.brief, diagnostics: authorDiagnostics },
    authorExperienceState,
    authorDiagnostics,
    memory,
    geo: input.geoAnchor ?? null,
    presence,
    movieMode: requestedMovieMode,
    warnings,
  };
}

