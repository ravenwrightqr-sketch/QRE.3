import type {
  AuthorBrainTruth,
  AuthorDomainContext,
  ExperienceBeat,
  ExperiencePresenceContext,
  MemoryContext,
} from "@qre/contracts";
import type { MemoryRepository } from "../repositories/memoryRepository.js";
import { authorBrainCanonical } from "./authorBrainCanonical.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "./memoryProjection.js";
import { experienceStateToMemoryBatch, extractExperienceStates } from "./experienceMemory.js";
import { buildExperienceState } from "./experienceState.js";
import { getCreativeLearningContext, learningContextLines } from "./creativeLearning.js";
import { buildPresenceContext } from "@qre/engine";
import { createPresenceRepository } from "../repositories/presenceRepository.js";

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
  blueprint: Record<string, unknown>;
  flowSteps: Array<Record<string, unknown>>;
  moments: Array<Record<string, unknown>>;
  cinematicScenes: Array<Record<string, unknown>>;
  beats: ExperienceBeat[];
  estimatedDuration: number;
  momentCount: number;
  plan: unknown;
  world: Record<string, unknown>;
  discoveries: string[];
  learningSignals: string[];
  cognition: unknown;
  authorExperienceState: unknown;
  authorDiagnostics: unknown;
  author: Awaited<ReturnType<typeof authorBrainCanonical>>;
  memory: { entities: number; facts: number; relations: number; events: number } | null;
  geo: GeoAnchorInput | null;
  geoStory: unknown;
  memorySnapshot: unknown;
  presence: ExperiencePresenceContext | null;
  warnings: string[];
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const uniq = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

function strings(value: unknown): string[] {
  if (typeof value === "string") return value.split(/[,|]/).map(clean).filter(Boolean);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean)
    : [];
}

function domain(asset: Record<string, unknown> | undefined): AuthorDomainContext | undefined {
  if (!asset) return undefined;
  const data = asRecord(asset.templateData);
  const account = asRecord(asset.account);
  const context: AuthorDomainContext = {
    category: clean(asset.category ?? data?.category),
    businessType: clean(data?.businessType ?? account?.type),
    businessName: clean(data?.businessName ?? account?.name ?? asset.displayName),
    businessDescription: clean(data?.businessDescription ?? data?.description),
    serviceType: clean(data?.serviceType ?? data?.service_type),
    serviceName: clean(data?.serviceName ?? data?.service ?? data?.offering),
    subjectKind: clean(data?.subjectKind ?? data?.subject_kind),
    knownCapabilities: uniq([
      ...strings(data?.services),
      ...strings(data?.capabilities),
      ...strings(data?.offerings),
    ]).slice(0, 24),
    contextualSignals: uniq([
      ...strings(data?.contextualSignals),
      ...strings(data?.signals),
    ]).slice(0, 24),
    creatorRole: clean(data?.creatorRole ?? data?.role),
    audience: strings(data?.audience ?? data?.targetAudience),
    objective: clean(data?.objective ?? data?.goal ?? data?.purpose),
    desiredAction: clean(data?.desiredAction ?? data?.cta),
    creativePreferences: strings(data?.creativePreferences ?? data?.creativeTaste),
  };
  return Object.values(context).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))
    ? context
    : undefined;
}

function beats(texts: string[][]): ExperienceBeat[] {
  return texts.map(([text, ...ids], index) => ({
    id: `author-beat-${index + 1}`,
    text,
    kind: index === 0 ? "jolt" : index === texts.length - 1 ? "payoff" : "reveal",
    order: index + 1,
    callback: index > 1 && ids.length > 1,
    meta: { sourceIds: ids, authoredBy: "qre-author" },
  }));
}

export async function compileExperience(input: {
  prompt: string;
  subject?: string;
  facts?: string[];
  sourceMoments?: string[];
  assetId?: string;
  userId?: string;
  sessionId?: string;
  operationId?: string;
  memoryRepository?: MemoryRepository;
  geo?: GeoAnchorInput;
  geoAnchor?: GeoAnchorInput;
  movieMode?: boolean;
  lens?: string;
}): Promise<CompiledExperienceResult> {
  const warnings: string[] = [];
  const prompt = clean(input.prompt);
  if (!prompt) throw new Error("Experience prompt required");

  const geo = input.geo ?? input.geoAnchor;
  let memoryContext: MemoryContext | undefined;
  let presence: ExperiencePresenceContext | null = null;
  let domainContext: AuthorDomainContext | undefined;

  if (input.assetId && input.memoryRepository) {
    try {
      memoryContext = await input.memoryRepository.loadContext({ assetId: input.assetId, userId: input.userId });
    } catch {
      warnings.push("memory_context_unavailable");
    }
  }

  if (input.assetId) {
    try {
      presence = await buildPresenceContext(input.assetId, createPresenceRepository(), input.sessionId);
    } catch {
      warnings.push("presence_context_unavailable");
    }
  }

  if (input.assetId) {
    try {
      const { db } = await import("@qre/db");
      const asset = await db.asset.findUnique({
        where: { id: input.assetId },
        select: {
          displayName: true,
          category: true,
          templateData: true,
          account: { select: { name: true, type: true } },
        },
      });
      domainContext = domain(asset as unknown as Record<string, unknown>);
    } catch {
      warnings.push("domain_context_unavailable");
    }
  }

  let learningLines: string[] = [];
  if (input.assetId) {
    try {
      learningLines = learningContextLines(
        await getCreativeLearningContext({ assetId: input.assetId, userId: input.userId, limit: 80 }),
      );
    } catch {
      warnings.push("learning_context_unavailable");
    }
  }

  const memorySummary = memoryContext ? memoryContextToCognitiveSummary(memoryContext) : [];
  const truth: AuthorBrainTruth = {
    prompt,
    subject: clean(input.subject) || undefined,
    place: clean(geo?.label) || undefined,
    lens: clean(input.lens) || undefined,
    returning: presence?.isReturning,
    visitNumber: presence?.visitNumber,
    facts: uniq(input.facts ?? []).slice(0, 100),
    sourceMoments: uniq(input.sourceMoments ?? []).slice(0, 100),
    memoryContext: memorySummary.slice(0, 120),
    trajectory: uniq(presence?.summary ?? []).slice(0, 40),
    creativeLearningContext: learningLines.slice(0, 100),
    domainContext,
  };

  const authored = await authorBrainCanonical(truth);
  const selectedCandidate = authored.cognition.candidates.find(
    (candidate) => candidate.id === authored.selectedCandidateId,
  );
  if (!selectedCandidate) throw new Error("Canonical Author selected candidate is missing from cognition result");

  let state: CompiledExperienceResult["authorExperienceState"] = undefined;
  let memoryCounts: CompiledExperienceResult["memory"] = null;

  if (input.assetId && input.memoryRepository) {
    try {
      const graphBatch = buildExperienceMemoryBatch({
        operationId: input.operationId ?? input.sessionId ?? `author:${input.assetId}:${prompt}`,
        assetId: input.assetId,
        userId: input.userId,
        graph: authored.reality,
        sessionId: input.sessionId,
        source: "prompt",
      });
      await input.memoryRepository.writeBatch(graphBatch);

      const previous = memoryContext ? extractExperienceStates(memoryContext) : [];
      state = buildExperienceState({
        graph: authored.reality,
        candidate: selectedCandidate,
        lens: authored.proposition.pattern,
        memoryContext: [
          ...learningLines,
          ...authored.memoryDelta.carryThreads,
          ...authored.memoryDelta.relationIds.map((id) => `relation:${id}`),
          ...authored.memoryDelta.unresolvedQuestions.map((question) => `unresolved:${question}`),
          ...authored.learningDelta.signals,
        ],
        priorExperienceStates: previous,
        round: presence?.visitNumber ?? 1,
      });

      const stateBatch = experienceStateToMemoryBatch({
        operationId: `${input.operationId ?? input.sessionId ?? `author:${input.assetId}:${prompt}`}:state`,
        assetId: input.assetId,
        userId: input.userId,
        state,
        sourceRef: `qre-author:${authored.selectedCandidateId}`,
      });
      await input.memoryRepository.writeBatch(stateBatch);

      memoryCounts = {
        entities: graphBatch.entities.length + stateBatch.entities.length,
        facts: graphBatch.facts.length + stateBatch.facts.length,
        relations: graphBatch.relations.length + stateBatch.relations.length,
        events: graphBatch.events.length + stateBatch.events.length,
      };
    } catch {
      warnings.push("memory_persistence_failed");
    }
  }

  const moments = authored.sequence.cuts.map((cut, index) => ({
    type: "message",
    editable: false,
    demo: false,
    order: index,
    payload: { text: cut.informationGain, sourceIds: cut.sourceIds, role: cut.role },
  }));
  const presentation = authored.sequence.cuts.map((cut, index) => ({
    id: `scene-${index + 1}`,
    order: index,
    type: "message",
    duration: 1800,
    moment: { type: "message", payload: { text: cut.informationGain, sourceIds: cut.sourceIds } },
  }));
  const experienceBeats = beats(authored.sequence.cuts.map((cut) => [cut.informationGain, ...cut.sourceIds]));
  const learningSignals = uniq([
    ...learningLines,
    ...authored.learningDelta.signals,
  ]).slice(0, 60);

  return {
    title: authored.proposition.text,
    blueprint: {
      premise: authored.proposition.text,
      pattern: authored.proposition.pattern,
      sourceEventIds: authored.proposition.sourceEventIds,
      sequenceId: authored.selectedCandidateId,
      treatment: authored.proposition.treatment.id,
      relationIds: authored.proposition.relationIds,
      continuation: authored.continuationState,
    },
    flowSteps: authored.sequence.cuts.map((cut, index) => ({
      order: index + 1,
      role: cut.role,
      sourceIds: cut.sourceIds,
      nextPromise: cut.nextPromise,
    })),
    moments,
    cinematicScenes: presentation,
    beats: experienceBeats,
    estimatedDuration: presentation.reduce((total, item) => total + item.duration, 0),
    momentCount: moments.length,
    plan: authored.cognition,
    world: {
      subject: authored.sequence.subject,
      proposition: authored.proposition.text,
      returning: presence?.isReturning ?? false,
      visitNumber: presence?.visitNumber ?? 1,
      treatment: authored.proposition.treatment.id,
    },
    discoveries: authored.cognition.candidates.flatMap((candidate) => candidate.evidence).slice(0, 20),
    learningSignals,
    cognition: authored.cognition,
    authorExperienceState: state,
    authorDiagnostics: authored.judgment,
    author: authored,
    memory: memoryCounts,
    geo: geo ?? null,
    geoStory: geo ?? null,
    memorySnapshot: memoryContext
      ? {
          entities: memoryContext.entities.length,
          facts: memoryContext.facts.length,
          relations: memoryContext.relations.length,
          events: memoryContext.events.length,
        }
      : null,
    presence,
    warnings,
  };
}
