/**
 * QRE AUTHOR MIND CONTROL PLANE
 *
 * One typed, compact control surface over the existing Author capabilities.
 * This module does not replace Cognition, Movie, World Simulation, Memory,
 * Viewer State, Lens, Mouth, Truth Gate, or the realization boundary.
 * It makes their already-computed signals legible to one canonical decision.
 *
 * Authority:
 *   supplied RealityGraph and approved downstream state only.
 *
 * Hard rule:
 *   capability selection is allowed to change strategy and presentation,
 *   never source reality.
 */
import type {
  AuthorExperienceState,
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";

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

export type AuthorCapabilityDescriptor = {
  id: AuthorCapabilityId;
  authority: "truth" | "meaning" | "structure" | "realization" | "validation";
  contribution: string;
  trigger: string;
  priority: number;
};

export type AuthorMindCapability = AuthorCapabilityDescriptor & {
  available: boolean;
  relevance: number;
  evidence: string[];
  selected: boolean;
};

export type AuthorExperienceFrontier = {
  unresolvedRelations: Array<{
    kind: string;
    fromEventId: string;
    toEventId: string;
    strength: number;
  }>;
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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const clamp = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const DESCRIPTORS: AuthorCapabilityDescriptor[] = [
  {
    id: "reality_graph",
    authority: "truth",
    contribution: "canonical supplied evidence, entities, structure, continuity and relationships",
    trigger: "always",
    priority: 100,
  },
  {
    id: "relationship_search",
    authority: "meaning",
    contribution: "earned relationships between supplied events",
    trigger: "two or more materially related supplied events",
    priority: 99,
  },
  {
    id: "creative_interpretation",
    authority: "meaning",
    contribution: "metamorphic changes in how supplied details can be perceived together",
    trigger: "an earned relationship has a non-trivial semantic move",
    priority: 98,
  },
  {
    id: "story_thesis",
    authority: "meaning",
    contribution: "one semantic turn with before, carrier and after evidence",
    trigger: "the selected movie has a grounded semantic relation",
    priority: 97,
  },
  {
    id: "world_simulation",
    authority: "meaning",
    contribution: "viewer-facing uncertainty, questions, prediction errors and open possibilities",
    trigger: "the world model exposes unresolved viewer state",
    priority: 96,
  },
  {
    id: "viewer_state",
    authority: "structure",
    contribution: "attention, uncertainty, information seeking, momentum and next-cut pressure",
    trigger: "a viewer state exists or can be inferred from the selected movie",
    priority: 95,
  },
  {
    id: "memory",
    authority: "meaning",
    contribution: "continuity, reentry, established callbacks and prior experience state",
    trigger: "prior experience or memory material exists",
    priority: 94,
  },
  {
    id: "movie_search",
    authority: "structure",
    contribution: "candidate experiences that cover the strongest legitimate relationships",
    trigger: "movie discovery is enabled",
    priority: 93,
  },
  {
    id: "movie_differentiation",
    authority: "structure",
    contribution: "avoid repeated movie shapes while preserving evidence",
    trigger: "multiple candidates exist",
    priority: 92,
  },
  {
    id: "living_sequence",
    authority: "meaning",
    contribution: "turn stable supplied preferences and continuity into playable experience",
    trigger: "preference, continuity or compressed supplied material is present",
    priority: 91,
  },
  {
    id: "lens",
    authority: "realization",
    contribution: "amplify supported perspective after discovery",
    trigger: "explicit or automatic lens exists",
    priority: 90,
  },
  {
    id: "mouth",
    authority: "realization",
    contribution: "generate final language candidates from approved semantic material",
    trigger: "composition produces realizable beats",
    priority: 89,
  },
  {
    id: "truth_gate",
    authority: "validation",
    contribution: "prevent unsupported concrete reality from becoming authored truth",
    trigger: "every authored realization",
    priority: 100,
  },
  {
    id: "realization_boundary",
    authority: "validation",
    contribution: "reject invented concrete events, actors, objects, chronology, reactions and outcomes",
    trigger: "every selected realization",
    priority: 100,
  },
];

function descriptor(id: AuthorCapabilityId): AuthorCapabilityDescriptor {
  return DESCRIPTORS.find((item) => item.id === id)!;
}

function relationScore(graph: RealityGraph): number {
  if (!graph.relations.length) return 0;
  const strong = graph.relations.filter((relation) => relation.strength >= 0.65).length;
  return clamp(strong / Math.max(1, graph.relations.length * 0.5));
}

function semanticSignals(movie: LatentMovieCandidate | undefined): {
  mechanisms: string[];
  relationKinds: string[];
  evidenceEventIds: string[];
  confidence: number;
} {
  const semantic = movie?.storyThesis?.semanticRealization;
  const thesis = movie?.storyThesis;
  return {
    mechanisms: unique([
      semantic?.mechanism ?? "",
      semantic?.realizationMove ?? "",
      semantic?.creativeOpportunity ?? "",
    ]),
    relationKinds: unique([
      thesis?.relationKind ?? "",
      semantic?.relation?.kind ?? "",
      ...(movie?.supportingRelationKinds ?? []),
    ]),
    evidenceEventIds: unique([
      ...(semantic?.evidenceEventIds ?? []),
      ...(thesis?.carrierEventIds ?? []),
      ...(thesis?.beforeEventIds ?? []),
      ...(thesis?.afterEventIds ?? []),
    ]),
    confidence: clamp(Number(semantic?.confidence ?? thesis?.counterfactualDependency ?? 0)),
  };
}

function capabilityRelevance(
  id: AuthorCapabilityId,
  graph: RealityGraph,
  movie: LatentMovieCandidate | undefined,
  experienceState: AuthorExperienceState | undefined,
  priorScenes: readonly string[],
  selectedLens: string,
): { relevance: number; available: boolean; evidence: string[] } {
  const semantic = semanticSignals(movie);
  const relations = relationScore(graph);
  const world = experienceState?.worldSimulation;
  const viewer = experienceState?.viewerState;
  const memory = experienceState?.memoryHooks?.length ?? 0;

  switch (id) {
    case "reality_graph":
      return { relevance: 1, available: graph.events.length > 0, evidence: [`${graph.events.length} events`, `${graph.relations.length} relations`] };
    case "relationship_search":
      return { relevance: relations, available: graph.relations.length > 0, evidence: unique(graph.relations.slice(0, 5).map((r) => `${r.kind}:${r.from}->${r.to}`)) };
    case "creative_interpretation":
      return { relevance: clamp(semantic.confidence * 0.8 + relations * 0.2), available: Boolean(movie?.storyThesis?.semanticRealization), evidence: semantic.mechanisms };
    case "story_thesis":
      return { relevance: clamp(semantic.confidence), available: Boolean(movie?.storyThesis?.semanticTurn), evidence: unique([movie?.storyThesis?.semanticTurn ?? "", movie?.storyThesis?.relationKind ?? ""]) };
    case "world_simulation":
      return { relevance: clamp(world ? 0.55 + world.viewer.predictionErrors.length * 0.12 + world.questions.length * 0.05 : 0), available: Boolean(world), evidence: unique(world?.questions.slice(0, 4).map((q) => q.text) ?? []) };
    case "viewer_state":
      return { relevance: clamp(viewer ? 0.65 + Number(viewer.score ?? 0) * 0.35 : 0.2), available: Boolean(viewer), evidence: unique([viewer ? `viewer score ${viewer.score ?? 0}` : "viewer state unavailable"]) };
    case "memory":
      return { relevance: clamp((priorScenes.length > 0 ? 0.5 : 0) + (memory > 0 ? 0.4 : 0) + (experienceState ? 0.1 : 0)), available: priorScenes.length > 0 || memory > 0 || Boolean(experienceState), evidence: unique([...(priorScenes.slice(0, 3)), ...(experienceState?.memoryHooks?.slice(0, 3) ?? [])]) };
    case "movie_search":
      return { relevance: clamp(movie ? 0.85 : 0), available: Boolean(movie), evidence: unique([movie?.id ?? "", ...(movie?.supportingRelationKinds ?? [])]) };
    case "movie_differentiation":
      return { relevance: clamp((movie ? 0.7 : 0) + (experienceState ? 0.2 : 0)), available: Boolean(movie), evidence: unique([`candidate pool ${movie ? "active" : "empty"}`]) };
    case "living_sequence":
      return { relevance: clamp((semantic.relationKinds.includes("preference") ? 1 : 0.35) + (graph.recurringSignals.length ? 0.25 : 0)), available: graph.events.length > 0, evidence: unique([...graph.recurringSignals.slice(0, 4), ...semantic.relationKinds.filter((k) => k === "preference")]) };
    case "lens":
      return { relevance: clamp(selectedLens && selectedLens !== "NONE" ? 0.9 : 0.35), available: Boolean(selectedLens), evidence: [selectedLens || "NONE"] };
    case "mouth":
      return { relevance: clamp(movie ? 0.9 : 0.5), available: Boolean(movie), evidence: [movie ? "realizable movie selected" : "direct grounded mode"] };
    case "truth_gate":
      return { relevance: 1, available: true, evidence: ["hard validation"] };
    case "realization_boundary":
      return { relevance: 1, available: true, evidence: ["hard validation"] };
  }
}

function frontierFor(
  graph: RealityGraph,
  movie: LatentMovieCandidate | undefined,
  experienceState: AuthorExperienceState | undefined,
): AuthorExperienceFrontier {
  const world = experienceState?.worldSimulation;
  const semantic = movie?.storyThesis?.semanticRealization;
  const unresolvedRelations = graph.relations
    .filter((relation) =>
      ["converges", "contrasts", "recontextualizes", "repeats", "changes", "causes"].includes(relation.kind),
    )
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8)
    .map((relation) => ({
      kind: relation.kind,
      fromEventId: relation.from,
      toEventId: relation.to,
      strength: clamp(relation.strength),
    }));

  const openQuestions = unique([
    ...(world?.questions.slice(0, 6).map((question) => question.text) ?? []),
    ...(semantic?.viewerShift ? [semantic.viewerShift] : []),
    ...(movie?.storyThesis?.observerExperience?.curiosity ? [movie.storyThesis.observerExperience.curiosity] : []),
  ]).slice(0, 8);

  const unresolvedTensions = unique([
    ...graph.unresolvedTensions,
    ...(graph.patterns ?? []).filter((pattern) => pattern.kind === "tension" || pattern.kind === "anomaly").map((pattern) => pattern.label),
  ]).slice(0, 8);

  const durableThreads = unique([
    ...(experienceState?.memoryHooks ?? []),
    ...(world?.durableThreads.slice(0, 6).map((thread) => thread.text) ?? []),
  ]).slice(0, 8);

  const primaryRelation = unresolvedRelations[0];
  const nextCutObjective =
    semantic?.after
      ? `Land the supplied endpoint after the viewer has enough earlier evidence to reinterpret it: ${semantic.after}`
      : primaryRelation
        ? `Let the supplied ${primaryRelation.kind} relationship become newly meaningful without explaining it.`
        : openQuestions[0] || "Expose the most specific supplied clue that can change the viewer's reading.";

  return {
    unresolvedRelations,
    openQuestions,
    unresolvedTensions,
    durableThreads,
    nextCutObjective,
    noveltyPressure: clamp(0.45 + (experienceState ? 0.2 : 0) + (world?.viewer.predictionErrors.length ?? 0) * 0.08),
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
  const graph = input.graph;
  const movie = input.selectedMovie;
  const priorScenes = input.priorScenes ?? [];
  const candidates = input.movieCandidates ?? [];

  const capabilities = DESCRIPTORS.map((item) => {
    const evaluation = capabilityRelevance(
      item.id,
      graph,
      movie,
      input.experienceState,
      priorScenes,
      clean(input.selectedLens) || "NONE",
    );
    return {
      ...item,
      ...evaluation,
      relevance: clamp(evaluation.relevance),
      selected: false,
    };
  });

  const ranked = [...capabilities]
    .filter((item) => item.available)
    .sort((a, b) => b.relevance - a.relevance || b.priority - a.priority);

  const semantic = semanticSignals(movie);
  const selected = unique([
    "reality_graph",
    ...ranked.slice(0, 6).map((item) => item.id),
    "truth_gate",
    "realization_boundary",
    ...(movie ? ["mouth"] : []),
  ] as AuthorCapabilityId[]).slice(0, 10);

  const primary =
    (semantic.confidence >= 0.65 && semantic.mechanisms[0]
      ? (semantic.mechanisms[0].toLowerCase() === "consequence" ? "story_thesis" : "creative_interpretation")
      : undefined) ??
    (ranked[0]?.id || "reality_graph");

  const secondary = selected
    .filter((id) => id !== primary)
    .slice(0, 5);

  const frontier = frontierFor(
    graph,
    movie,
    input.experienceState,
  );

  const sourceEventIds = unique([
    ...(movie?.trajectory.flatMap((step) => step.eventIds) ?? []),
    ...(movie?.storyThesis?.semanticRealization?.evidenceEventIds ?? []),
  ]).filter((id) => graph.events.some((event) => event.id === id));

  const decision: AuthorMindDecision = {
    primaryCapability: primary as AuthorCapabilityId,
    secondaryCapabilities: secondary,
    primaryMechanism: semantic.mechanisms[0] || movie?.storyThesis?.relationKind || "direct_grounded",
    relationKinds: semantic.relationKinds.slice(0, 8),
    evidenceEventIds: sourceEventIds.slice(0, 16),
    reason:
      semantic.relationKinds.length
        ? `Use the strongest supplied relationship first; preserve unresolved viewer discovery around ${semantic.relationKinds.slice(0, 4).join(", ")}.`
        : "No sufficiently specific semantic relationship is available; prefer the strongest supplied clue without manufacturing one.",
  };

  for (const capability of capabilities) {
    capability.selected = selected.includes(capability.id);
  }

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
      eventCount: graph.events.length,
      relationCount: graph.relations.length,
      candidateCount: candidates.length,
      activeMemory: Boolean(input.experienceState || priorScenes.length),
    },
    observability: {
      sourceEventIds,
      worldReferenceCount: input.experienceState?.worldSimulation?.refs.length ?? 0,
      worldRelationCount: input.experienceState?.worldSimulation?.relations.length ?? 0,
      viewerPredictionErrorCount: input.experienceState?.worldSimulation?.viewer.predictionErrors.length ?? 0,
      generatedAt: "cognition",
    },
  };
}

export function buildSelectiveAuthorContext(mind: AuthorMindState): {
  decision: AuthorMindDecision;
  frontier: AuthorExperienceFrontier;
  selectedCapabilities: Array<Pick<AuthorMindCapability, "id" | "contribution" | "evidence" | "relevance">>;
} {
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
  if (!mind.selectedCapabilityIds.length) throw new Error("AUTHOR_MIND_NO_CAPABILITIES");
  if (!mind.selectedCapabilityIds.includes("reality_graph")) throw new Error("AUTHOR_MIND_REALITY_MISSING");
  if (!mind.selectedCapabilityIds.includes("truth_gate")) throw new Error("AUTHOR_MIND_TRUTH_GATE_MISSING");
  if (!mind.selectedCapabilityIds.includes("realization_boundary")) throw new Error("AUTHOR_MIND_BOUNDARY_MISSING");
  if (mind.decision.evidenceEventIds.some((id) => !mind.observability.sourceEventIds.includes(id))) {
    throw new Error("AUTHOR_MIND_FOREIGN_EVIDENCE");
  }
  if (mind.context.eventCount < 0 || mind.context.relationCount < 0 || mind.context.candidateCount < 0) {
    throw new Error("AUTHOR_MIND_INVALID_COUNTS");
  }
}
