/**
 * QRE AUTHOR MIND CONTROL PLANE
 * One typed control surface over existing Author intelligence.
 * It selects and compresses existing signals; it never creates reality.
 */
import type { AuthorExperienceState, LatentMovieCandidate, RealityGraph } from "@qre/contracts";

export type AuthorCapabilityId =
  | "reality_graph"
  | "relationship_search"
  | "creative_interpretation"
  | "story_thesis"
  | "world_simulation"
  | "viewer_state"
  | "memory"
  | "movie_search"
  | "movie_differentiation"
  | "living_sequence"
  | "lens"
  | "mouth"
  | "truth_gate"
  | "realization_boundary";

export type AuthorMindCapability = {
  id: AuthorCapabilityId;
  authority: "truth" | "meaning" | "structure" | "realization" | "validation";
  contribution: string;
  relevance: number;
  available: boolean;
  selected: boolean;
  evidence: string[];
};

export type AuthorExperienceFrontier = {
  unresolvedRelations: Array<{ kind: string; fromEventId: string; toEventId: string; strength: number }>;
  openQuestions: string[];
  unresolvedTensions: string[];
  durableThreads: string[];
  nextCutObjective: string;
  noveltyPressure: number;
  uncertainty: number;
  continuationPotential: number;
};

export type AuthorMindDecision = {
  primaryCapability: AuthorCapabilityId;
  secondaryCapabilities: AuthorCapabilityId[];
  primaryMechanism: string;
  relationKinds: string[];
  evidenceEventIds: string[];
  reason: string;
};

export type AuthorMindState = {
  version: 1;
  capabilities: AuthorMindCapability[];
  selectedCapabilityIds: AuthorCapabilityId[];
  decision: AuthorMindDecision;
  frontier: AuthorExperienceFrontier;
  context: {
    subject: string;
    lens: string;
    round: number;
    eventCount: number;
    relationCount: number;
    candidateCount: number;
    activeMemory: boolean;
  };
  observability: {
    sourceEventIds: string[];
    worldReferenceCount: number;
    worldRelationCount: number;
    viewerPredictionErrorCount: number;
    generatedAt: "cognition";
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const DESCRIPTORS: Array<Pick<AuthorMindCapability, "id" | "authority" | "contribution">> = [
  ["reality_graph", "truth", "canonical supplied evidence, structure, continuity and relationships"],
  ["relationship_search", "meaning", "earned relationships between supplied events"],
  ["creative_interpretation", "meaning", "metamorphic changes in how supplied details can be perceived together"],
  ["story_thesis", "meaning", "one grounded semantic turn with before, carrier and after evidence"],
  ["world_simulation", "meaning", "viewer uncertainty, questions, prediction errors and open possibilities"],
  ["viewer_state", "structure", "attention, uncertainty, information seeking, momentum and next-cut pressure"],
  ["memory", "meaning", "continuity, reentry, established callbacks and prior experience state"],
  ["movie_search", "structure", "candidate experiences covering the strongest legitimate relationships"],
  ["movie_differentiation", "structure", "avoid repeated experience shapes while preserving evidence"],
  ["living_sequence", "meaning", "turn stable supplied continuity and preferences into playable experience"],
  ["lens", "realization", "amplify supported perspective after discovery"],
  ["mouth", "realization", "realize approved semantic material as language"],
  ["truth_gate", "validation", "prevent unsupported concrete reality from becoming authored truth"],
  ["realization_boundary", "validation", "reject invented concrete events, actors, objects, chronology, reactions and outcomes"],
].map(([id, authority, contribution]) => ({ id, authority, contribution }));

function semantic(movie: LatentMovieCandidate | undefined) {
  const thesis = movie?.storyThesis;
  const realization = thesis?.semanticRealization;
  return {
    mechanisms: unique([realization?.mechanism ?? "", realization?.realizationMove ?? "", realization?.creativeOpportunity ?? ""]),
    relationKinds: unique([thesis?.relationKind ?? "", realization?.relation?.kind ?? "", ...(movie?.supportingRelationKinds ?? [])]),
    evidenceEventIds: unique([...(realization?.evidenceEventIds ?? []), ...(thesis?.beforeEventIds ?? []), ...(thesis?.carrierEventIds ?? []), ...(thesis?.afterEventIds ?? [])]),
    confidence: clamp(Number(realization?.confidence ?? thesis?.counterfactualDependency ?? 0)),
  };
}

function relevance(
  id: AuthorCapabilityId,
  graph: RealityGraph,
  movie: LatentMovieCandidate | undefined,
  state: AuthorExperienceState | undefined,
  priorScenes: readonly string[],
  lens: string,
): { relevance: number; available: boolean; evidence: string[] } {
  const s = semantic(movie);
  const strongRelations = graph.relations.filter((item) => item.strength >= 0.65).length;
  const relationSignal = clamp(strongRelations / Math.max(1, graph.relations.length * 0.5));
  const world = state?.worldSimulation;

  switch (id) {
    case "reality_graph": return { relevance: 1, available: graph.events.length > 0, evidence: [`events=${graph.events.length}`, `relations=${graph.relations.length}`] };
    case "relationship_search": return { relevance: relationSignal, available: graph.relations.length > 0, evidence: unique(graph.relations.slice(0, 5).map((r) => `${r.kind}:${r.from}->${r.to}`)) };
    case "creative_interpretation": return { relevance: clamp(s.confidence * 0.8 + relationSignal * 0.2), available: Boolean(movie?.storyThesis?.semanticRealization), evidence: s.mechanisms };
    case "story_thesis": return { relevance: s.confidence, available: Boolean(movie?.storyThesis?.semanticTurn), evidence: unique([movie?.storyThesis?.semanticTurn ?? "", movie?.storyThesis?.relationKind ?? ""]) };
    case "world_simulation": return { relevance: clamp(world ? 0.55 + world.viewer.predictionErrors.length * 0.12 + world.questions.length * 0.05 : 0), available: Boolean(world), evidence: unique(world?.questions.slice(0, 4).map((q) => q.text) ?? []) };
    case "viewer_state": return { relevance: clamp(state ? 0.65 + state.attentionPotential * 0.2 + state.endpointPressure * 0.15 : 0.2), available: Boolean(state), evidence: state ? [`attention=${state.attentionPotential}`, `endpoint=${state.endpointPressure}`, `continuation=${state.continuationValue}`] : [] };
    case "memory": return { relevance: clamp((priorScenes.length ? 0.5 : 0) + (state?.memoryHooks.length ? 0.4 : 0) + (state ? 0.1 : 0)), available: Boolean(priorScenes.length || state?.memoryHooks.length || state), evidence: unique([...priorScenes.slice(0, 3), ...(state?.memoryHooks.slice(0, 3) ?? [])]) };
    case "movie_search": return { relevance: movie ? 0.85 : 0, available: Boolean(movie), evidence: movie ? [movie.id] : [] };
    case "movie_differentiation": return { relevance: clamp((movie ? 0.7 : 0) + (state ? 0.2 : 0)), available: Boolean(movie), evidence: movie ? [movie.id] : [] };
    case "living_sequence": return { relevance: clamp((s.relationKinds.includes("preference") ? 1 : 0.35) + (graph.recurringSignals.length ? 0.25 : 0)), available: graph.events.length > 0, evidence: unique([...graph.recurringSignals.slice(0, 4), ...(s.relationKinds.includes("preference") ? ["preference"] : [])]) };
    case "lens": return { relevance: lens && lens !== "NONE" ? 0.9 : 0.35, available: Boolean(lens), evidence: [lens || "NONE"] };
    case "mouth": return { relevance: movie ? 0.9 : 0.5, available: Boolean(movie), evidence: [movie ? "movie-selected" : "direct-grounded"] };
    case "truth_gate": return { relevance: 1, available: true, evidence: ["hard-validation"] };
    case "realization_boundary": return { relevance: 1, available: true, evidence: ["hard-validation"] };
  }
}

function frontierFor(graph: RealityGraph, movie: LatentMovieCandidate | undefined, state: AuthorExperienceState | undefined): AuthorExperienceFrontier {
  const semanticRealization = movie?.storyThesis?.semanticRealization;
  const world = state?.worldSimulation;
  const unresolvedRelations = graph.relations
    .filter((relation) => ["converges", "contrasts", "recontextualizes", "repeats", "changes", "causes"].includes(relation.kind))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8)
    .map((relation) => ({ kind: relation.kind, fromEventId: relation.from, toEventId: relation.to, strength: clamp(relation.strength) }));
  const openQuestions = unique([
    ...(state?.unresolvedQuestions ?? []),
    ...(world?.questions.slice(0, 5).map((question) => question.text) ?? []),
    ...(movie?.storyThesis?.observerExperience?.curiosity ? [movie.storyThesis.observerExperience.curiosity] : []),
  ]).slice(0, 8);
  const unresolvedTensions = unique([
    ...graph.unresolvedTensions,
    ...(graph.patterns ?? []).filter((pattern) => pattern.kind === "tension" || pattern.kind === "anomaly").map((pattern) => pattern.label),
  ]).slice(0, 8);
  const durableThreads = unique([
    ...(state?.memoryHooks ?? []),
    ...(world?.durableThreads.slice(0, 6).map((thread) => thread.text) ?? []),
  ]).slice(0, 8);
  const primary = unresolvedRelations[0];
  return {
    unresolvedRelations,
    openQuestions,
    unresolvedTensions,
    durableThreads,
    nextCutObjective: semanticRealization?.after
      ? `Let the supplied endpoint acquire its earned second reading: ${semanticRealization.after}`
      : primary
        ? `Reveal the supplied ${primary.kind} relationship without explaining it.`
        : openQuestions[0] || "Expose the most specific supplied clue capable of changing the reading.",
    noveltyPressure: clamp(0.45 + (state ? 0.2 : 0) + (world?.viewer.predictionErrors.length ?? 0) * 0.08),
    uncertainty: clamp(world ? 0.35 + world.viewer.predictionErrors.length * 0.1 : 0.55),
    continuationPotential: clamp((durableThreads.length ? 0.35 : 0) + (openQuestions.length ? 0.35 : 0) + (unresolvedRelations.length ? 0.3 : 0)),
  };
}

export function buildAuthorMindState(input: {
  graph: RealityGraph;
  subject?: string;
  selectedLens: string;
  round?: number;
  priorScenes?: readonly string[];
  movieCandidates?: readonly LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  experienceState?: AuthorExperienceState;
}): AuthorMindState {
  const capabilities = DESCRIPTORS.map((descriptor) => {
    const evaluated = relevance(descriptor.id, input.graph, input.selectedMovie, input.experienceState, input.priorScenes ?? [], clean(input.selectedLens) || "NONE");
    return { ...descriptor, relevance: clamp(evaluated.relevance), available: evaluated.available, selected: false, evidence: evaluated.evidence };
  });
  const ranked = [...capabilities].filter((capability) => capability.available).sort((a, b) => b.relevance - a.relevance || (b.id === "truth_gate" ? 1 : 0) - (a.id === "truth_gate" ? 1 : 0));
  const semanticState = semantic(input.selectedMovie);
  const selected = unique([
    "reality_graph",
    ...ranked.slice(0, 7).map((item) => item.id),
    "truth_gate",
    "realization_boundary",
    ...(input.selectedMovie ? ["mouth"] : []),
  ] as AuthorCapabilityId[]).slice(0, 11);
  const primary: AuthorCapabilityId = semanticState.confidence >= 0.65
    ? semanticState.relationKinds.includes("consequence") ? "story_thesis" : "creative_interpretation"
    : ranked[0]?.id ?? "reality_graph";
  for (const capability of capabilities) capability.selected = selected.includes(capability.id);

  const frontier = frontierFor(input.graph, input.selectedMovie, input.experienceState);
  const evidenceEventIds = unique([
    ...semanticState.evidenceEventIds,
    ...(input.selectedMovie?.trajectory.flatMap((step) => step.eventIds) ?? []),
  ]).filter((id) => input.graph.events.some((event) => event.id === id)).slice(0, 16);
  const secondaryCapabilities = selected.filter((id) => id !== primary).slice(0, 6);
  const decision: AuthorMindDecision = {
    primaryCapability: primary,
    secondaryCapabilities,
    primaryMechanism: semanticState.mechanisms[0] || semanticState.relationKinds[0] || "direct_grounded",
    relationKinds: semanticState.relationKinds.slice(0, 8),
    evidenceEventIds,
    reason: semanticState.relationKinds.length
      ? `Lead with the strongest supplied relationship while preserving unresolved viewer discovery.`
      : `No sufficiently specific semantic relationship is available; use the strongest supplied clue without manufacturing one.`,
  };

  return {
    version: 1,
    capabilities,
    selectedCapabilityIds: selected,
    decision,
    frontier,
    context: {
      subject: clean(input.subject),
      lens: clean(input.selectedLens) || "NONE",
      round: Math.max(1, Number(input.round ?? 1)),
      eventCount: input.graph.events.length,
      relationCount: input.graph.relations.length,
      candidateCount: input.movieCandidates?.length ?? 0,
      activeMemory: Boolean(input.experienceState || input.priorScenes?.length),
    },
    observability: {
      sourceEventIds: evidenceEventIds,
      worldReferenceCount: input.experienceState?.worldSimulation?.refs.length ?? 0,
      worldRelationCount: input.experienceState?.worldSimulation?.relations.length ?? 0,
      viewerPredictionErrorCount: input.experienceState?.worldSimulation?.viewer.predictionErrors.length ?? 0,
      generatedAt: "cognition",
    },
  };
}

export function buildSelectiveAuthorContext(mind: AuthorMindState) {
  return {
    decision: mind.decision,
    frontier: mind.frontier,
    selectedCapabilities: mind.capabilities
      .filter((capability) => capability.selected)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8)
      .map(({ id, contribution, evidence, relevance }) => ({ id, contribution, evidence: evidence.slice(0, 4), relevance })),
  };
}

export function assertAuthorMindState(mind: AuthorMindState): void {
  if (mind.version !== 1) throw new Error("AUTHOR_MIND_INVALID_VERSION");
  if (!mind.selectedCapabilityIds.includes("reality_graph")) throw new Error("AUTHOR_MIND_REALITY_MISSING");
  if (!mind.selectedCapabilityIds.includes("truth_gate")) throw new Error("AUTHOR_MIND_TRUTH_GATE_MISSING");
  if (!mind.selectedCapabilityIds.includes("realization_boundary")) throw new Error("AUTHOR_MIND_BOUNDARY_MISSING");
  if (mind.decision.evidenceEventIds.some((id) => !mind.observability.sourceEventIds.includes(id))) throw new Error("AUTHOR_MIND_FOREIGN_EVIDENCE");
}
