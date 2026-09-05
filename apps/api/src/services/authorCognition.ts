/*
STATUS: CANONICAL
ROLE: Universal cognitive understanding and the sole latent-movie authority.
INPUT: RealityGraph, prompt intent, persistent memory context, learned creative preferences, optional lens.
OUTPUT: Competing semantic interpretations, competing latent movies, one selected movie, adaptive reality questions.
AUTHORITY: RealityGraph is factual authority; Cognition owns interpretation and Movie selection.
MUST NOT: Write customer prose, persist memory, invent source events, create domain-specific story branches, or select a second movie elsewhere.
UPSTREAM: Canonical RealityGraph plus persistent world context and creative learning.
DOWNSTREAM: Canonical Creative Realizer, Sequence projection, memory projection.
REPLACEMENT: Replaces the previous Author cognition/movie/lens/state/differentiation stack.
*/
import type { AuthorDomainContext, LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph: RealityGraph;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  trajectory?: string[];
  creativeLearningContext?: string[];
  returning?: boolean;
  visitNumber?: number;
  movieMode?: boolean;
};

export type AuthorCreativeInterpretation = {
  id: string;
  thesis: string;
  creativeOpportunity: string;
  rationale: string;
  evidenceEventIds: string[];
  confidence: number;
};

export type AuthorAdaptiveQuestion = {
  kind: "who" | "where" | "when" | "event" | "detail";
  question: string;
  reason: string;
};

export type AuthorCognitionPlan = {
  selectedLens: string;
  interpretations: AuthorCreativeInterpretation[];
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  adaptiveQuestions: AuthorAdaptiveQuestion[];
  attentionStrategy: string;
  reasoningSummary: string[];
  model: string;
  modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, Number(number.toFixed(3)))) : 0;
};
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const VALID_OPERATIONS = new Set<LatentMovieTrajectoryStep["operation"]>(["establish", "contrast", "recur", "reframe", "escalate", "converge", "reveal", "consequence", "payoff"]);

function stripFence(text: string): string {
  return clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function parseObject<T>(text: string): T | undefined {
  try {
    const parsed = JSON.parse(stripFence(text));
    return parsed && typeof parsed === "object" ? parsed as T : undefined;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as T : undefined;
    } catch {
      return undefined;
    }
  }
}

function eventLookup(graph: RealityGraph): Map<string, string> {
  return new Map(graph.events.map((event) => [event.id, event.label]));
}

function validEventIds(value: unknown, graph: RealityGraph): string[] {
  const ids = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map(clean) : [];
  const valid = new Set(graph.events.map((event) => event.id));
  return unique(ids.filter((id) => valid.has(id))).slice(0, 12);
}

function normalizeTrajectory(value: unknown, graph: RealityGraph): LatentMovieTrajectoryStep[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((step, index) => {
    const row = step && typeof step === "object" ? step as Record<string, unknown> : {};
    const ids = validEventIds(row.eventIds, graph);
    const operation = clean(row.operation) as LatentMovieTrajectoryStep["operation"];
    return {
      order: index + 1,
      operation: VALID_OPERATIONS.has(operation) ? operation : index === 0 ? "establish" : "reveal",
      eventIds: ids,
      viewerChange: clean(row.viewerChange) || "new supplied detail becomes noticeable",
      nextQuestion: clean(row.nextQuestion) || "What deserves attention next?",
    };
  }).filter((step) => graph.events.length === 0 || step.eventIds.length > 0);
}

function candidateScore(candidate: LatentMovieCandidate, returning: boolean): number {
  const relationBonus = Math.min(1, candidate.supportingRelationKinds.length / 3) * 0.12;
  const continuityBonus = returning ? candidate.callbackPotential * 0.15 : candidate.novelty * 0.08;
  return metric(
    candidate.novelty * 0.15 +
    candidate.specificity * 0.15 +
    candidate.attentionPotential * 0.2 +
    candidate.consequencePotential * 0.12 +
    candidate.callbackPotential * 0.12 +
    candidate.compressionPotential * 0.08 +
    candidate.distinctiveness * 0.1 +
    (1 - candidate.truthRisk) * 0.08 +
    relationBonus +
    continuityBonus,
  );
}

function normalizeCandidate(raw: unknown, index: number, graph: RealityGraph, lens: string): LatentMovieCandidate | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const trajectory = normalizeTrajectory(row.trajectory, graph);
  const evidence = validEventIds(row.evidenceEventIds, graph);
  const anchors = validEventIds(row.evidenceEventIds ?? row.anchorEventIds, graph).slice(0, 2);
  if (graph.events.length > 0 && (!trajectory.length || !evidence.length)) return undefined;
  const candidate: LatentMovieCandidate = {
    id: clean(row.id) || `movie-${index + 1}`,
    lens: clean(row.lens) || lens,
    anchorEventIds: anchors,
    supportingRelationKinds: Array.isArray(row.supportingRelationKinds) ? unique(row.supportingRelationKinds.filter((item): item is string => typeof item === "string").map(clean)).slice(0, 8) : [],
    trajectory,
    payoff: clean(row.payoff) || clean(row.thesis) || "supplied reality",
    unresolvedQuestion: clean(row.unresolvedQuestion) || "What is becoming more meaningful?",
    evidence: Array.isArray(row.evidence) ? row.evidence.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean).slice(0, 12) : evidence.map((id) => eventLookup(graph).get(id) ?? id),
    hypothesis: Array.isArray(row.hypothesis) ? row.hypothesis.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean).slice(0, 8) : [clean(row.thesis) || "Find the strongest attention-bearing interpretation in supplied reality."],
    truthRisk: metric(row.truthRisk),
    novelty: metric(row.novelty),
    specificity: metric(row.specificity),
    informationValue: metric(row.informationValue),
    uncertainty: metric(row.uncertainty),
    attentionPotential: metric(row.attentionPotential),
    consequencePotential: metric(row.consequencePotential),
    callbackPotential: metric(row.callbackPotential),
    compressionPotential: metric(row.compressionPotential),
    repetitionRisk: metric(row.repetitionRisk),
    distinctiveness: metric(row.distinctiveness),
    score: 0,
  };
  candidate.score = candidateScore(candidate, Boolean(false));
  return candidate;
}

function fallbackMovie(graph: RealityGraph, lens: string, returning: boolean): LatentMovieCandidate | undefined {
  if (!graph.events.length) return {
    id: "movie-conceptual",
    lens,
    anchorEventIds: [],
    supportingRelationKinds: [],
    trajectory: [],
    payoff: "Make the supplied idea feel newly visible.",
    unresolvedQuestion: "What does starting over, or the supplied concept, make possible?",
    evidence: [],
    hypothesis: ["Conceptual prompt: perform the requested idea without pretending it is a factual event."],
    truthRisk: 0,
    novelty: 0.9,
    specificity: 0.4,
    informationValue: 0.5,
    uncertainty: 0.3,
    attentionPotential: 0.72,
    consequencePotential: 0.45,
    callbackPotential: 0,
    compressionPotential: 0.8,
    repetitionRisk: 0,
    distinctiveness: 0.75,
    score: 0.75,
  };
  const relations = graph.relations.filter((relation) => relation.strength >= 0.62).slice(0, 4);
  const ids = relations.length ? unique(relations.flatMap((relation) => [relation.from, relation.to])).slice(0, 6) : graph.events.slice(0, Math.min(4, graph.events.length)).map((event) => event.id);
  const trajectory = ids.map((id, index) => ({ order: index + 1, operation: (index === ids.length - 1 ? "payoff" : index === 0 ? "establish" : relations[Math.min(index - 1, relations.length - 1)]?.kind === "contrasts" ? "contrast" : relations[Math.min(index - 1, relations.length - 1)]?.kind === "recontextualizes" ? "reframe" : returning ? "recur" : "reveal") as LatentMovieTrajectoryStep["operation"], eventIds: [id], viewerChange: graph.events.find((event) => event.id === id)?.label ?? "new supplied detail", nextQuestion: index === ids.length - 1 ? "What lands now?" : "What changes the reading next?" }));
  const candidate: LatentMovieCandidate = {
    id: returning ? "movie-return-fallback" : "movie-grounded-fallback",
    lens,
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: unique(relations.map((relation) => relation.kind)),
    trajectory,
    payoff: graph.events.find((event) => event.id === ids.at(-1))?.label ?? "supplied reality",
    unresolvedQuestion: returning ? "What is different this time?" : "What is becoming noticeable?",
    evidence: ids.map((id) => graph.events.find((event) => event.id === id)?.label ?? id),
    hypothesis: [returning ? "A new visit should change the reading of remembered material." : "Find the strongest connected pattern without inventing a plot."],
    truthRisk: 0,
    novelty: returning ? 0.68 : 0.55,
    specificity: 0.82,
    informationValue: Math.min(1, ids.length / 5),
    uncertainty: 0.35,
    attentionPotential: relations[0]?.strength ?? 0.55,
    consequencePotential: relations.some((relation) => relation.kind === "causes" || relation.kind === "changes") ? 0.75 : 0.4,
    callbackPotential: returning || relations.some((relation) => relation.kind === "repeats" || relation.kind === "recontextualizes") ? 0.82 : 0.18,
    compressionPotential: 0.74,
    repetitionRisk: 0.12,
    distinctiveness: 0.62,
    score: 0,
  };
  candidate.score = candidateScore(candidate, returning);
  return candidate;
}

function adaptiveQuestions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const text = clean(input.prompt).toLowerCase();
  const questions: AuthorAdaptiveQuestion[] = [];
  if (!input.subject && !input.realityGraph.events.some((event) => event.entities.some((entity) => text.includes(entity.toLowerCase())))) questions.push({ kind: "who", question: "Who or what is this about?", reason: "A subject cannot be resolved from supplied reality or memory." });
  if (!input.place && !input.realityGraph.events.some((event) => event.place)) questions.push({ kind: "where", question: "Where did it happen?", reason: "Place is missing and could materially enrich continuity." });
  if (!input.realityGraph.events.some((event) => event.time) && !/\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|\d{1,2}:\d{2}|\d{4})\b/i.test(text)) questions.push({ kind: "when", question: "When did it happen?", reason: "Time is missing and may resolve continuity or recurrence." });
  if (!input.facts.length && !input.sourceMoments.length && input.realityGraph.events.length === 0 && !/\b(?:create|make|turn|something|starting over|beautiful)\b/i.test(text)) questions.push({ kind: "event", question: "What happened?", reason: "There is not enough source reality to ground the experience." });
  return questions.slice(0, 3);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const explicitLens = clean(input.lens);
  const lens = explicitLens && explicitLens.toLowerCase() !== "let qre decide" ? explicitLens : "LET QRE DECIDE";
  const graphPayload = {
    evidence: input.realityGraph.evidence,
    events: input.realityGraph.events,
    relations: input.realityGraph.relations,
    eventStructure: input.realityGraph.eventStructure,
    continuity: input.realityGraph.entityContinuity,
    patterns: input.realityGraph.patterns,
    tensions: input.realityGraph.unresolvedTensions,
    recurringSignals: input.realityGraph.recurringSignals,
    sensorySignals: input.realityGraph.sensorySignals,
  };
  const context = {
    prompt: clean(input.prompt),
    subject: clean(input.subject) || "unknown",
    place: clean(input.place) || "unknown",
    explicitLens: lens,
    returning: Boolean(input.returning || (input.visitNumber ?? 1) > 1),
    visitNumber: input.visitNumber ?? 1,
    memory: (input.memoryContext ?? []).slice(0, 60),
    trajectory: (input.trajectory ?? []).slice(0, 40),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 60),
    domainContext: input.domainContext ?? {},
    reality: graphPayload,
  };
  let model = "fallback";
  let modelCalls = 0;
  let parsed: Record<string, unknown> | undefined;
  if (input.movieMode !== false) {
    try {
      const result = await localModelGenerate([
        {
          role: "system",
          content: [
            "You are QRE's universal cognition engine and the sole Movie authority.",
            "You do not write customer-facing prose.",
            "You reason over arbitrary human reality: entities, events, states, relations, places, times, evidence, memory, change, recurrence and uncertainty.",
            "SOURCE REALITY IS ABSOLUTE. Never invent an event, person, place, time, action, relationship or outcome.",
            "Derived interpretation may be bold. Hypothesized creative opportunity may be imaginative. Label it as interpretation; do not present it as factual occurrence.",
            "Search aggressively for the strongest unexpected relationship, contrast, callback, status turn, consequence, emotional movement or memorable detail. Do not force a turn when reality does not support one.",
            "A Movie is a structured hypothesis, not prose. Produce multiple competing interpretations and multiple competing movies, then select exactly one.",
            "Sparse reality is valid. It may yield an observation movie, preference constellation, possibility, or conceptual experience rather than a plot.",
            "Return JSON only with keys: selectedLens, attentionStrategy, interpretations, movies, selectedMovieId, adaptiveQuestions, reasoningSummary.",
            "Each concrete movie trajectory step must cite one or more existing event IDs. Never invent event IDs. A conceptual movie may have zero event IDs only when the graph is empty.",
            "Scene count is not fixed; trajectory length must naturally range from 0 to 12.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(context) },
      ], "json", { numPredict: 5000, temperature: 0.82 });
      model = result.model;
      modelCalls += 1;
      parsed = parseObject<Record<string, unknown>>(result.text);
    } catch {
      parsed = undefined;
    }
  }

  const interpretations = (Array.isArray(parsed?.interpretations) ? parsed?.interpretations : []).slice(0, 8).map((item, index) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: clean(row.id) || `interpretation-${index + 1}`,
      thesis: clean(row.thesis) || "Find a stronger reading inside supplied reality.",
      creativeOpportunity: clean(row.creativeOpportunity) || "compression",
      rationale: clean(row.rationale) || "supported by supplied evidence",
      evidenceEventIds: validEventIds(row.evidenceEventIds, input.realityGraph),
      confidence: metric(row.confidence),
    } satisfies AuthorCreativeInterpretation;
  });

  const rawMovies = Array.isArray(parsed?.movies) ? parsed?.movies : [];
  const candidates = rawMovies.map((item, index) => normalizeCandidate(item, index, input.realityGraph, clean(parsed?.selectedLens) || lens)).filter((candidate): candidate is LatentMovieCandidate => Boolean(candidate)).slice(0, 10);
  const fallback = fallbackMovie(input.realityGraph, clean(parsed?.selectedLens) || lens, Boolean(input.returning || (input.visitNumber ?? 1) > 1));
  const allCandidates = candidates.length ? candidates : fallback ? [fallback] : [];
  for (const candidate of allCandidates) candidate.score = candidateScore(candidate, Boolean(input.returning || (input.visitNumber ?? 1) > 1));
  const selectedId = clean(parsed?.selectedMovieId);
  const selectedMovie = allCandidates.find((candidate) => candidate.id === selectedId) ?? [...allCandidates].sort((a, b) => b.score - a.score)[0];
  const adaptive = (Array.isArray(parsed?.adaptiveQuestions) ? parsed?.adaptiveQuestions : []).slice(0, 4).map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { kind: clean(row.kind) as AuthorAdaptiveQuestion["kind"], question: clean(row.question), reason: clean(row.reason) };
  }).filter((item) => item.question && ["who", "where", "when", "event", "detail"].includes(item.kind));
  const dedupQuestions = unique([...adaptive, ...adaptiveQuestions(input).filter((question) => !adaptive.some((existing) => existing.question.toLowerCase() === question.question.toLowerCase()))]).slice(0, 4);
  const selectedLens = clean(parsed?.selectedLens) || (explicitLens && explicitLens.toLowerCase() !== "let qre decide" ? explicitLens : "LET QRE DECIDE");
  return {
    selectedLens,
    interpretations: interpretations.length ? interpretations : [{ id: "interpretation-fallback", thesis: selectedMovie?.hypothesis[0] ?? "Find the strongest attention-bearing interpretation.", creativeOpportunity: "recognition", rationale: "fallback from grounded world structure", evidenceEventIds: selectedMovie?.anchorEventIds ?? [], confidence: selectedMovie ? 0.55 : 0.2 }],
    latentMovieCandidates: allCandidates,
    selectedMovie,
    adaptiveQuestions: dedupQuestions,
    attentionStrategy: clean(parsed?.attentionStrategy) || (selectedMovie?.supportingRelationKinds[0] ? `follow ${selectedMovie.supportingRelationKinds[0]}` : "find the strongest noticeable change"),
    reasoningSummary: Array.isArray(parsed?.reasoningSummary) ? parsed.reasoningSummary.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean).slice(0, 12) : ["Source reality remains separate from creative interpretation.", "Movie selection is owned here and consumed downstream."],
    model,
    modelCalls,
  };
}
