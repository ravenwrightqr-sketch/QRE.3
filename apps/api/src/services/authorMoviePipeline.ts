import { buildCognitiveState } from "@qre/engine";
import type { AuthorBrainTruth, AuthorResult, CognitiveState, IdentityState, MemoryContext, MovieBeatPlan } from "@qre/contracts";
import { authorBrainUniversal } from "./authorBrainUniversal.js";
import { resolveLearnedCreativeLens } from "./authorCreativeLearningPressure.js";
import { buildMovieBeatPlan } from "./authorMovieBeatPlan.js";
import {
  classifyAuthorCreativeSafety,
  isProtectedCreativeContext as isSemanticProtectedContext,
} from "./authorCreativeSafetyContext.js";

const INTERNAL_SOURCE_LABEL = /^(?:INTENT|DOMAIN|SUBJECT|TYPE|GOAL|OUTPUT|TONE|CURRENT FACTS|KNOWN ASSET FACTS|REAL FACTS|FIELDS|AUTHORING|COGNITIVE|LEARNING SIGNALS|PROVENANCE|DIAGNOSTICS)\s*:/i;
const INTERNAL_SOURCE_META = /\b(?:intent\s*:|domain\s*:|subject\s*:|goal\s*:|output\s*:|tone\s*:|current facts\s*:|known asset facts\s*:|fields\s*:|second meaning|gave the moment its shape|made the larger moment stay|next beat was|this was the hinge|according to qre|cognitive|provenance)\b/i;

function cleanSourceValue(value: unknown): string[] {
  return String(value ?? "")
    .split(/\s*\|\s*|\r?\n+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 3)
    .filter((item) => !INTERNAL_SOURCE_LABEL.test(item))
    .filter((item) => !INTERNAL_SOURCE_META.test(item));
}

function sanitizeAuthorInput(input: AuthorBrainTruth): AuthorBrainTruth {
  const sanitizeList = (values?: readonly string[]) => [...new Set((values ?? []).flatMap(cleanSourceValue))].slice(0, 120);
  return {
    ...input,
    facts: sanitizeList(input.facts),
    sourceMoments: sanitizeList(input.sourceMoments),
    memoryContext: sanitizeList(input.memoryContext),
    presenceSummary: sanitizeList(input.presenceSummary),
    trajectory: sanitizeList(input.trajectory),
  };
}

function factSource(text: string, input: AuthorBrainTruth): "prompt" | "user" | "event" | "location" | "system" | "import" {
  const preserved = input.cognitiveContext?.provenanceFacts?.find(
    (fact) => fact.text.trim().toLowerCase() === text.trim().toLowerCase(),
  );
  switch (String(preserved?.provenance.source ?? "")) {
    case "prompt": return "prompt";
    case "runtime": return "system";
    case "memory": return "user";
    default: return "prompt";
  }
}

function semanticMemoryFromIdentity(input: AuthorBrainTruth, identity?: IdentityState | null): MemoryContext {
  const now = new Date().toISOString();
  const subjectName = String(identity?.subject?.value ?? input.subject ?? "the subject").trim();
  const subjectEntityId = `subject:${subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const facts = [
    ...(identity?.canonicalFacts ?? []),
    ...(identity?.traits ?? []),
    ...(identity?.preferences ?? []),
    ...(identity?.activities ?? []),
    ...(identity?.history ?? []),
  ];

  const memoryFacts = facts.map((fact, index) => ({
    id: `identity-fact-${index + 1}`,
    entityId: subjectEntityId,
    kind: fact.source === "event" ? "event" as const
      : identity?.preferences.includes(fact) ? "preference" as const
      : identity?.activities.includes(fact) ? "behavior" as const
      : identity?.traits.includes(fact) ? "attribute" as const
      : fact.source === "history" ? "history" as const
      : "attribute" as const,
    predicate: fact.source === "event" ? "experienced" : "known",
    value: fact.text,
    confidence: fact.confidence,
    source: fact.source === "prompt" ? "prompt" as const
      : fact.source === "event" ? "event" as const
      : fact.source === "location" ? "location" as const
      : fact.source === "presence" ? "scan" as const
      : "user" as const,
    sourceRef: fact.provenance?.source ?? undefined,
    status: fact.status === "superseded" ? "superseded" as const : "active" as const,
    observedAt: fact.observedAt ?? identity?.generatedAt ?? now,
    visibility: "shared" as const,
  }));

  const recentEvents = (identity?.recentEvents ?? []).map((summary, index) => ({
    id: `identity-event-${index + 1}`,
    type: "recent_identity_event",
    summary,
    occurredAt: identity?.generatedAt ?? now,
    source: "event" as const,
    confidence: identity?.confidence ?? 0.8,
    entityIds: [subjectEntityId],
  }));

  const requestFacts = input.facts.flatMap(cleanSourceValue).map((value, index) => ({
    id: `request-fact-${index + 1}`,
    entityId: subjectEntityId,
    kind: "context" as const,
    predicate: "supplied",
    value,
    confidence: 1,
    source: factSource(value, input),
    sourceRef: "current-experience-request",
    status: "active" as const,
    observedAt: now,
    visibility: "shared" as const,
  }));

  const requestEvents = input.sourceMoments.flatMap(cleanSourceValue).map((summary, index) => ({
    id: `request-event-${index + 1}`,
    type: "current_experience_event",
    summary,
    occurredAt: now,
    source: "event" as const,
    confidence: 1,
    entityIds: [subjectEntityId],
  }));

  return {
    assetId: identity?.identityId ?? "unknown",
    generatedAt: now,
    entities: [{
      id: subjectEntityId,
      kind: identity?.kind === "pet" ? "animal" as const : identity?.kind === "person" ? "person" as const : "other" as const,
      name: subjectName,
      canonicalKey: subjectName.toLowerCase(),
      confidence: identity?.confidence ?? 0.8,
      visibility: "shared" as const,
      createdAt: now,
      updatedAt: now,
    }],
    facts: [...memoryFacts, ...requestFacts],
    relations: [],
    events: [...recentEvents, ...requestEvents],
  };
}

function ensureCognitiveState(input: AuthorBrainTruth): CognitiveState | null {
  if (input.cognitiveContext?.cognitiveState) return input.cognitiveContext.cognitiveState;
  const identity = input.cognitiveContext?.identityState;
  if (!identity) return null;
  return buildCognitiveState({
    prompt: input.prompt,
    subjectTruth: {
      name: String(identity.subject.value ?? input.subject ?? "").trim() || undefined,
      kind: identity.kind === "pet" ? "animal" : identity.kind === "person" ? "person" : "unknown",
      identityFacts: identity.canonicalFacts.map((fact) => fact.text),
      provenance: "memory",
    },
    memoryContext: semanticMemoryFromIdentity(input, identity),
    experienceGoal: input.cognitiveContext?.domain?.mode ?? "experience",
    presentation: "cinematic",
  });
}

function overlapText(a: string, b: string): number {
  const left = new Set(cleanSourceValue(a).join(" ").toLowerCase().split(/[^a-z0-9'-]+/).filter((word) => word.length > 2));
  const right = new Set(cleanSourceValue(b).join(" ").toLowerCase().split(/[^a-z0-9'-]+/).filter((word) => word.length > 2));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

function projectCognitiveState(input: AuthorBrainTruth, state: CognitiveState): AuthorBrainTruth {
  const currentEvents = state.events.filter((event) => state.currentEventIds.includes(event.id));
  const selectedEvents = currentEvents.map((event) => event.summary);
  const selectedFacts = state.facts
    .filter((fact) => state.relevantFactIds.includes(fact.id))
    .map((fact) => `${fact.predicate}: ${fact.value}`)
    .filter((fact) => !currentEvents.some((event) => overlapText(fact, event.summary) >= 0.75));
  const fallbackFacts = input.facts
    .flatMap(cleanSourceValue)
    .filter((fact) => !selectedEvents.some((event) => overlapText(fact, event) >= 0.75));

  return {
    ...input,
    facts: selectedFacts.length ? selectedFacts : fallbackFacts,
    sourceMoments: selectedEvents.length ? selectedEvents : input.sourceMoments,
    memoryContext: state.patterns.map((pattern) => `[pattern] ${pattern.statement]`).slice(0, 64),
  };
}

export async function authorMoviePipeline(input: AuthorBrainTruth & {
  cta?: { text: string; sourceIds?: string[] };
  presentationMode?: "auto" | "manual";
}): Promise<{ authored: AuthorResult; movieBeatPlan: MovieBeatPlan }> {
  const sanitizedInput = sanitizeAuthorInput(input);
  const cognitiveState = ensureCognitiveState(sanitizedInput);
  const semanticInput = cognitiveState ? projectCognitiveState(sanitizedInput, cognitiveState) : sanitizedInput;
  const explicitLens = String(semanticInput.lens ?? "").trim().toLowerCase();
  const safety = classifyAuthorCreativeSafety({
    cognitivePlan: semanticInput.cognitivePlan,
    premise: semanticInput.cognitivePlan?.premise,
    backstopText: [
      semanticInput.prompt,
      semanticInput.subject,
      semanticInput.place ?? "",
      ...(semanticInput.facts ?? []),
      ...(semanticInput.sourceMoments ?? []),
      ...(semanticInput.memoryContext ?? []),
      ...(semanticInput.trajectory ?? []),
      ...(semanticInput.presenceSummary ?? []),
    ],
  });
  const cognitiveContext = {
    ...(semanticInput.cognitiveContext ?? {}),
    cognitiveState,
    creativeSafety: safety,
  };
  const protectedContext = isSemanticProtectedContext(cognitiveContext);

  const learnedLens = protectedContext || (explicitLens && explicitLens !== "neutral")
    ? undefined
    : resolveLearnedCreativeLens(cognitiveContext);

  const authorInput: AuthorBrainTruth = protectedContext
    ? { ...semanticInput, lens: "neutral", cognitiveContext }
    : learnedLens
      ? { ...semanticInput, lens: learnedLens, cognitiveContext }
      : { ...semanticInput, cognitiveContext };

  const authored = await authorBrainUniversal(authorInput);
  const movieBeatPlan = buildMovieBeatPlan({
    textBeats: authored.scenes
      .filter((scene) => scene.kind !== "photo" && Boolean(scene.text.trim()))
      .map((scene, index) => ({
        id: `author-text-${index + 1}`,
        text: scene.text,
        sourceIds: [],
        attentionRole: scene.kind ?? "movement",
        durationHintMs: 1400,
      })),
    media: semanticInput.cognitiveContext?.media ?? [],
    textBeatTarget: semanticInput.cognitiveContext?.textBeatTarget ?? 5,
    mode: input.presentationMode ?? "auto",
    cta: input.cta,
  });

  return { authored, movieBeatPlan };
}
