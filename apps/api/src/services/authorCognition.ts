import type { LatentMovieCandidate, RealityGraph, RealityRelation } from "@qre/contracts";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph?: RealityGraph;
  memoryContext?: string[];
  priorScenes?: string[];
  priorStrategies?: string[];
  round?: number;
  movieMode?: boolean;
};

export type AttentionCandidate = {
  strategy: string;
  reason: string;
  score: number;
};

export type CharacterFrameCandidate = {
  frame: string;
  reason: string;
  confidence: number;
};

export type CharacterRead = {
  coreTraits: string[];
  contradictions: string[];
  statusPosture: string;
  emotionalPosture: string;
  objectRelationships: string[];
  creativeFrames: CharacterFrameCandidate[];
  allowedMoves: string[];
  avoidedMoves: string[];
};

export type AuthorCognitivePlan = {
  round: number;
  mode: "grounded" | "concept" | "living_memory" | "service" | "voice_first";
  subjectIdentity: string;
  permanentTruths: string[];
  currentEvidence: string[];
  contradictions: string[];
  characterRead: CharacterRead;
  attentionCandidates: AttentionCandidate[];
  latentMovieCandidates: LatentMovieCandidate[];
  chosenAttentionStrategy: string;
  operatorMix: string[];
  callbackTargets: string[];
  antiRepetitionRules: string[];
  sceneRules: string[];
  authorBrief: string[];
  realityGraph?: RealityGraph;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const uniq = (values: readonly unknown[], limit = 24): string[] =>
  [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));

function modeFor(input: AuthorCognitionInput): AuthorCognitivePlan["mode"] {
  const text = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  const evidence = input.facts.length + input.sourceMoments.length + (input.memoryContext?.length ?? 0);
  if (/memory|returning|chapter|again|previous visit/.test(text) || (input.round ?? 1) > 1) return evidence ? "living_memory" : "concept";
  if (evidence) return /service|receipt|visit|appointment|cleaning|groom|repair|barber|salon|mechanic/.test(text) ? "service" : "grounded";
  return "concept";
}

function relationStrengthToEndpoint(graph: RealityGraph, eventId: string, endpointId: string): number {
  return metric(
    graph.relations
      .filter((r) => (r.from === eventId && r.to === endpointId) || (r.to === eventId && r.from === endpointId))
      .reduce((sum, r) => sum + r.strength, 0),
  );
}

function incidentStrength(graph: RealityGraph, eventId: string): number {
  return metric(graph.relations.filter((r) => r.from === eventId || r.to === eventId).reduce((sum, r) => sum + r.strength, 0));
}

function eventSpecificity(label: string): number {
  const words = new Set(label.toLowerCase().split(/[^a-z0-9'-]+/i).filter((x) => x.length > 2));
  return metric(Math.min(words.size, 8) / 8);
}

function chooseEndpoint(graph?: RealityGraph): string {
  return graph?.events[graph.events.length - 1]?.id ?? "";
}

function relationBetween(graph: RealityGraph, a: string, b: string): RealityRelation | undefined {
  return graph.relations
    .filter((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a))
    .sort((x, y) => y.strength - x.strength)[0];
}

function repairMovieTrajectory(candidate: LatentMovieCandidate, graph: RealityGraph): LatentMovieCandidate {
  const endpointId = chooseEndpoint(graph);
  if (!endpointId || !graph.events.length) return candidate;

  const endpoint = graph.events.find((e) => e.id === endpointId);
  const nonEndpoint = graph.events.filter((e) => e.id !== endpointId);
  if (!endpoint || !nonEndpoint.length) return candidate;

  const ranked = [...nonEndpoint].sort((a, b) => {
    const aScore = relationStrengthToEndpoint(graph, a.id, endpointId) * 0.55 + incidentStrength(graph, a.id) * 0.3 + eventSpecificity(a.label) * 0.15;
    const bScore = relationStrengthToEndpoint(graph, b.id, endpointId) * 0.55 + incidentStrength(graph, b.id) * 0.3 + eventSpecificity(b.label) * 0.15;
    return bScore - aScore;
  });

  const existing = new Set(candidate.trajectory.flatMap((step) => step.eventIds));
  const opening = graph.events.find((e) => existing.has(e.id)) ?? ranked[0];
  const carriers = ranked.filter((e) => e.id !== opening.id).slice(0, 2);

  const steps = [
    {
      order: 1,
      operation: "establish" as const,
      eventIds: [opening.id],
      viewerChange: `Establish supplied evidence: ${opening.label}.`,
      nextQuestion: "What does this detail make worth noticing next?",
    },
  ];

  for (const carrier of carriers) {
    const relation = relationBetween(graph, carrier.id, endpointId) ?? relationBetween(graph, opening.id, carrier.id);
    if (!relation) continue;
    steps.push({
      order: steps.length + 1,
      operation: relation.kind === "repeats" ? "recur" as const : relation.kind === "contrasts" ? "contrast" as const : "reframe" as const,
      eventIds: [carrier.id, relation.to === endpointId || relation.from === endpointId ? endpointId : opening.id],
      viewerChange: `The supplied relationship changes the reading: ${relation.kind} involving ${carrier.label}.`,
      nextQuestion: "What becomes different about the ending because of this?",
    });
  }

  steps.push({
    order: steps.length + 1,
    operation: "payoff" as const,
    eventIds: [endpointId],
    viewerChange: `Land the supplied endpoint: ${endpoint.label}.`,
    nextQuestion: "What is now true at the supplied ending?",
  });

  const trajectory = steps.slice(0, 6);
  const thesis = candidate.storyThesis ?? {
    initialReading: candidate.hypothesis?.[0] ?? candidate.lens,
    semanticTurn: trajectory.slice(1, -1).map((s) => s.viewerChange).join(" ") || "A supplied relationship changes the reading.",
    carrierEventIds: trajectory.slice(1, -1).flatMap((s) => s.eventIds),
    sealingEventIds: [endpointId],
    payoffDependency: endpoint.label,
    counterfactualDependency: metric(trajectory.length >= 3 ? 0.8 : 0.4),
  };

  return {
    ...candidate,
    anchorEventIds: uniq([opening.id, ...carriers.map((e) => e.id), endpointId], 6),
    trajectory,
    payoff: endpoint.label,
    unresolvedQuestion: "What did the preceding evidence make inevitable about the supplied ending?",
    evidence: uniq([...candidate.evidence, opening.label, ...carriers.map((e) => e.label), endpoint.label], 12),
    hypothesis: uniq([...candidate.hypothesis, thesis.initialReading, thesis.semanticTurn], 6),
    storyThesis: thesis,
    specificity: Math.max(candidate.specificity, eventSpecificity(opening.label)),
    consequencePotential: Math.max(candidate.consequencePotential, metric(trajectory.length / 6)),
    callbackPotential: Math.max(candidate.callbackPotential, inputlessCallbackScore(graph)),
    compressionPotential: Math.max(candidate.compressionPotential, metric(1 - Math.max(0, trajectory.length - 4) * 0.12)),
    score: metric(candidate.score * 0.55 + metric(trajectory.length / 6) * 0.2 + metric(candidate.truthRisk <= 0.25 ? 1 : 0.6) * 0.15 + metric(candidate.specificity) * 0.1),
  };
}

function inputlessCallbackScore(graph: RealityGraph): number {
  return graph.recurringSignals.length ? metric(Math.min(graph.recurringSignals.length, 4) / 4) : 0;
}

function chooseMovies(input: AuthorCognitionInput, raw: LatentMovieCandidate[]): LatentMovieCandidate[] {
  if (input.movieMode === false) return [];
  if (!input.realityGraph || !raw.length) return [];
  const repaired = raw.map((candidate) => repairMovieTrajectory(candidate, input.realityGraph!));
  const endpointId = chooseEndpoint(input.realityGraph);
  return repaired
    .filter((candidate) => candidate.truthRisk <= 0.45)
    .filter((candidate) => candidate.trajectory.some((step) => step.operation === "payoff" && step.eventIds.includes(endpointId)))
    .sort((a, b) => {
      const aScore = a.score + a.consequencePotential * 0.25 + a.specificity * 0.15 - a.truthRisk * 0.4;
      const bScore = b.score + b.consequencePotential * 0.25 + b.specificity * 0.15 - b.truthRisk * 0.4;
      return bScore - aScore;
    })
    .slice(0, 6);
}

function traits(input: AuthorCognitionInput): string[] {
  const all = [...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? [])];
  return uniq(all.filter((v) => /\b(?:nervous|scared|fierce|sweet|gentle|wild|goofy|stubborn|proud|confident|quiet|loud|funny|mischievous|tired|calm|excited|happy|angry|afraid)\b/i.test(v)), 8);
}

function contradictions(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;
  const result = uniq([
    ...(graph?.unresolvedTensions ?? []),
    ...(graph?.relations.filter((r) => r.kind === "contrasts" || r.kind === "changes" || r.kind === "recontextualizes").slice(0, 6).map((r) => `supplied relationship: ${r.kind}`) ?? []),
  ], 10);
  return result.length ? result : [];
}

function objectRelationships(input: AuthorCognitionInput): string[] {
  return uniq(
    input.realityGraph?.events
      .filter((e) => e.entities.length > 1 || e.object || /object|bow|tag|keychain|kitchen|bathroom|door|house|car|room/i.test(e.label))
      .map((e) => e.label) ?? [],
    10,
  );
}

function frames(input: AuthorCognitionInput, movie: LatentMovieCandidate | undefined): CharacterFrameCandidate[] {
  const explicit = clean(input.lens);
  if (explicit && explicit.toLowerCase() !== "let qre decide") {
    return [{ frame: explicit, reason: "explicit user perspective", confidence: 0.95 }];
  }
  const relationKinds = new Set(input.realityGraph?.relations.map((r) => r.kind) ?? []);
  const out: CharacterFrameCandidate[] = [];
  if (relationKinds.has("contrasts")) out.push({ frame: "contrast", reason: "the supplied world contains a material contrast", confidence: 0.9 });
  if (relationKinds.has("recontextualizes")) out.push({ frame: "recontextualization", reason: "one supplied detail changes another detail's meaning", confidence: 0.9 });
  if (relationKinds.has("repeats") || input.returning || (input.round ?? 1) > 1) out.push({ frame: "callback", reason: "the world contains continuity material", confidence: 0.88 });
  if (movie?.storyThesis?.semanticTurn) out.push({ frame: "character consequence", reason: "the selected movie has a semantic turn", confidence: 0.86 });
  return out.length ? out : [{ frame: "NONE", reason: "the natural supplied reality is the strongest lens", confidence: 1 }];
}

function attentionCandidates(graph: RealityGraph | undefined, movieCandidates: LatentMovieCandidate[]): AttentionCandidate[] {
  const relationKinds = graph?.relations.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + r.strength;
    return acc;
  }, {}) ?? {};
  const candidates = [
    { strategy: "movie_discovery", reason: "find the strongest grounded interpretation in the supplied relationships", score: movieCandidates.length ? 90 : 55 },
    { strategy: "recontextualization", reason: "change what an earlier detail means without changing the fact", score: metric((relationKinds.recontextualizes ?? 0) / 2) * 100 },
    { strategy: "contrast", reason: "use a supplied contradiction or contrast as the pressure point", score: metric((relationKinds.contrasts ?? 0) / 2) * 100 },
    { strategy: "consequence", reason: "carry an earlier condition into a supplied outcome", score: metric(((relationKinds.changes ?? 0) + (relationKinds.after ?? 0)) / 2) * 100 },
    { strategy: "callback", reason: "reuse recurring material with changed meaning", score: graph?.recurringSignals.length ? 82 : 28 },
  ];
  return candidates.sort((a, b) => b.score - a.score).slice(0, 6);
}

export function buildAuthorCognitivePlan(input: AuthorCognitionInput): AuthorCognitivePlan {
  const round = Math.max(1, input.round ?? 1);
  const mode = modeFor(input);
  const graph = input.realityGraph;
  const permanentTruths = uniq([...(input.facts ?? []), ...(input.memoryContext ?? [])], 30);
  const currentEvidence = uniq([...(input.sourceMoments ?? []), ...(graph?.events.map((e) => e.label) ?? [])], 30);
  const contradictionList = contradictions(input);
  const rawMovies = graph
    ? searchLatentMovieCandidates({ graph, subject: input.subject, lens: input.lens, limit: 8 })
    : [];
  const latentMovieCandidates = chooseMovies(input, rawMovies);
  if (graph) graph.latentMovieCandidates = latentMovieCandidates;
  const movie = latentMovieCandidates[0];
  const creativeFrames = frames(input, movie);
  const characterRead: CharacterRead = {
    coreTraits: traits(input),
    contradictions: contradictionList,
    statusPosture: contradictionList[0] ?? "defined by supplied evidence",
    emotionalPosture: contradictionList[0] ? `emotion sits inside ${contradictionList[0]}` : "emotion is inferred from supplied evidence",
    objectRelationships: objectRelationships(input),
    creativeFrames,
    allowedMoves: ["contrast", "status language", "double meaning", "personification", "understatement", "callback", "recontextualization", "implication"],
    avoidedMoves: ["invented concrete events", "invented dialogue", "invented people", "invented locations", "invented objects", "invented outcomes", "generic emotional summary"],
  };
  const attention = attentionCandidates(graph, latentMovieCandidates);
  const chosenAttentionStrategy = attention[0]?.strategy ?? "movie_discovery";
  const callbackTargets = uniq([...(graph?.recurringSignals ?? []), ...(input.memoryContext ?? []), ...(input.priorScenes ?? [])], round > 1 ? 14 : 8);

  return {
    round,
    mode,
    subjectIdentity: clean(input.subject),
    permanentTruths,
    currentEvidence,
    contradictions: contradictionList,
    characterRead,
    attentionCandidates: attention,
    latentMovieCandidates,
    chosenAttentionStrategy,
    operatorMix: movie
      ? movie.trajectory.map((step) => step.operation).slice(0, 8)
      : ["observe", "interpret", "payoff"],
    callbackTargets,
    antiRepetitionRules: [
      "Do not replay an earlier chapter unless recurrence changes meaning.",
      "Do not turn every source item into its own cut.",
      "Prefer graph relationships over isolated source-word repetition.",
      "The endpoint belongs to reality and must remain the endpoint.",
    ],
    sceneRules: [
      "A beat is one perceivable change in the viewer's mental model.",
      "Later beats inherit earlier material and change its meaning or pressure.",
      "Viewer text is realization, not Beat Graph metadata.",
      "No invented people, objects, locations, actions, dialogue, reactions, chronology, or outcomes.",
      "Finish when the supplied payoff becomes inevitable.",
    ],
    authorBrief: [
      `Selected movie: ${movie?.hypothesis?.[0] ?? movie?.payoff ?? "none"}.`,
      `Movie trajectory length: ${movie?.trajectory.length ?? 0}.`,
      `Reality graph: ${graph?.events.length ?? 0} events / ${graph?.relations.length ?? 0} relations.`,
      `Persistent context: ${input.memoryContext?.length ?? 0} supplied memory items.`,
    ],
    realityGraph: graph,
  };
}
