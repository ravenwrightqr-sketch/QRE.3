/*
 * QRE CANONICAL COGNITION
 *
 * Cognition discovers the strongest grounded meaning inside supplied reality.
 * It does not write customer-facing language and it does not force reality
 * into a fixed story template.
 *
 * Reality is factual authority.
 * Frame is a perspective constraint.
 * Movie is a semantic hypothesis.
 * Mouth is the only layer allowed to write customer-facing language.
 */
import type {
  AuthorDomainContext,
  CreativeFrameSelection,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { buildAuthorCognitionIntelligence } from "./authorCognitionIntelligence.js";

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
  frame: CreativeFrameSelection;
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
const metric = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, Number(number.toFixed(3)))) : fallback;
};
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const OPERATIONS = new Set<LatentMovieTrajectoryStep["operation"]>([
  "establish", "contrast", "recur", "reframe", "escalate", "converge", "reveal", "consequence", "payoff",
]);
const FRAME_STOP = new Set(["the", "and", "for", "with", "from", "into", "this", "that", "make", "something", "about"]);
const LEADING_EMOTIONAL_QUESTION = /\b(?:feelings?|contentment|happiness?|anxiety|anxious|sadness|joy|what\s+does\s+this\s+reveal\s+about|what\s+does\s+this\s+say\s+about)\b/i;
const AUTO_FRAMES = new Set([
  "comedy", "funny", "noir", "romance", "romantic", "horror", "heist", "game", "fierce", "courtroom", "military",
  "documentary", "deadpan", "tender", "surreal", "wild", "spy", "mission", "speedrun", "tournament", "investigation",
  "backstage", "transformation", "race", "restoration", "expedition", "quest", "countdown", "archive",
]);

function parseObject(text: string): Record<string, unknown> | undefined {
  const cleaned = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
}

function graphEventIds(graph: RealityGraph): Set<string> {
  return new Set(graph.events.map((event) => event.id));
}

function validEventIds(value: unknown, graph: RealityGraph): string[] {
  const valid = graphEventIds(graph);
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map(clean)
    : typeof value === "string"
      ? [clean(value)]
      : [];
  return unique(raw.filter((id) => valid.has(id))).slice(0, 12);
}

function normalizeIds(row: Record<string, unknown>, graph: RealityGraph): string[] {
  return validEventIds(row.eventIds ?? row.eventId ?? row.sourceEventIds, graph);
}

function normalizeTrajectory(value: unknown, graph: RealityGraph): LatentMovieTrajectoryStep[] | undefined {
  if (!Array.isArray(value)) return [];
  const normalized: LatentMovieTrajectoryStep[] = [];
  for (const item of value.slice(0, 12)) {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const operation = clean(row.operation).toLowerCase() as LatentMovieTrajectoryStep["operation"];
    if (!OPERATIONS.has(operation)) return undefined;
    const eventIds = normalizeIds(row, graph);
    const viewerChange = clean(row.viewerChange) || clean(row.attentionMove) || "another supplied detail becomes newly meaningful";
    const nextQuestion = clean(row.nextQuestion) || clean(row.nextPromise) || "What does this make noticeable next?";
    normalized.push({
      order: normalized.length + 1,
      operation,
      eventIds,
      viewerChange,
      nextQuestion,
    } satisfies LatentMovieTrajectoryStep);
  }
  return normalized.filter((step) => graph.events.length === 0 || step.eventIds.length > 0);
}

function eventLabels(graph: RealityGraph, ids: readonly string[]): string[] {
  const byId = new Map(graph.events.map((event) => [event.id, event.label]));
  return unique(ids.map((id) => byId.get(id)).filter((value): value is string => Boolean(value))).slice(0, 12);
}

function normalizeFrameToken(value: string): string {
  const parts = clean(value).toLowerCase().split(/\s*(?:\+|>|\/|,|\band\b)\s*/i).map(clean).filter(Boolean);
  return parts.map((part) => part.replace(/[^a-z0-9_-]/g, "")).filter(Boolean).filter((part) => AUTO_FRAMES.has(part)).slice(0, 2).join(" + ");
}

function frameSelection(parsed: Record<string, unknown> | undefined, explicitLens: string, graph: RealityGraph): CreativeFrameSelection {
  const raw = parsed?.frame && typeof parsed.frame === "object" ? parsed.frame as Record<string, unknown> : {};
  const isExplicit = Boolean(explicitLens) && explicitLens.toLowerCase() !== "let qre decide";
  const requested = clean(parsed?.selectedLens || raw.frame || explicitLens);
  const selected = isExplicit ? requested : normalizeFrameToken(requested);
  const evidenceEventIds = validEventIds(raw.evidenceEventIds ?? parsed?.frameEvidenceEventIds, graph);
  const modelChoseFrame = Boolean(selected) && evidenceEventIds.length > 0 && selected.toLowerCase() !== "none";
  const mode = isExplicit ? "frame" : modelChoseFrame ? "frame" : "none";
  const frame = mode === "none" ? "NONE" : selected || "NONE";
  return {
    mode,
    frame,
    confidence: metric(raw.confidence ?? parsed?.frameConfidence, isExplicit ? 1 : 0.5),
    coreTension: clean(raw.coreTension ?? parsed?.coreTension),
    creativeGain: clean(raw.creativeGain ?? parsed?.creativeGain),
    templateRisk: clean(raw.templateRisk ?? parsed?.templateRisk),
    evidenceEventIds,
  };
}

function candidateScore(candidate: LatentMovieCandidate, returning: boolean, frame: CreativeFrameSelection): number {
  const relation = Math.min(1, candidate.supportingRelationKinds.length / 3) * 0.11;
  const continuity = returning ? candidate.callbackPotential * 0.14 : candidate.novelty * 0.09;
  const operationKinds = unique(candidate.trajectory.map((step) => step.operation));
  const movement = candidate.trajectory.length > 1 ? Math.min(1, Math.max(0, operationKinds.length - 1) / 4) * 0.12 : 0.04;
  const semanticDensity = Math.min(1, candidate.informationValue * 0.55 + candidate.attentionPotential * 0.45) * 0.12;
  const frameBonus = frame.mode === "frame" && frame.confidence >= 0.65 ? 0.04 : 0;
  return metric(
    candidate.attentionPotential * 0.17 +
    candidate.novelty * 0.14 +
    candidate.specificity * 0.11 +
    candidate.distinctiveness * 0.11 +
    candidate.consequencePotential * 0.1 +
    candidate.callbackPotential * 0.08 +
    candidate.compressionPotential * 0.04 +
    (1 - candidate.truthRisk) * 0.06 +
    relation + continuity + movement + semanticDensity + frameBonus - candidate.repetitionRisk * 0.08,
  );
}

function normalizeCandidate(raw: unknown, index: number, graph: RealityGraph, defaultLens: string, returning: boolean): LatentMovieCandidate | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const trajectory = normalizeTrajectory(row.trajectory, graph);
  if (!trajectory) return undefined;
  const trajectoryIds = trajectory.flatMap((step) => step.eventIds);
  const evidenceIds = validEventIds(row.evidenceEventIds ?? row.evidenceIds ?? trajectoryIds, graph);
  if (graph.events.length > 0 && (!trajectory.length || !evidenceIds.length)) return undefined;
  const id = clean(row.id ?? row.movieId) || `movie-${index + 1}`;
  const lens = clean(row.lens ?? row.frame) || defaultLens;
  const evidence = Array.isArray(row.evidence)
    ? row.evidence.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean).slice(0, 12)
    : eventLabels(graph, evidenceIds);
  const hypothesis = Array.isArray(row.hypothesis)
    ? row.hypothesis.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean).slice(0, 8)
    : [clean(row.thesis ?? row.initialReading) || "Find the strongest meaningful progression inside supplied reality."];
  const candidate: LatentMovieCandidate = {
    id,
    lens,
    anchorEventIds: validEventIds(row.anchorEventIds ?? row.evidenceEventIds ?? trajectoryIds, graph).slice(0, 2),
    supportingRelationKinds: Array.isArray(row.supportingRelationKinds)
      ? unique(row.supportingRelationKinds.filter((item): item is string => typeof item === "string").map(clean)).slice(0, 8)
      : [],
    trajectory,
    payoff: clean(row.payoff ?? row.finalMeaning ?? row.sealingMeaning) || evidence[evidence.length - 1] || "supplied reality",
    unresolvedQuestion: clean(row.unresolvedQuestion ?? row.nextQuestion) || "What deserves attention next?",
    evidence,
    hypothesis,
    truthRisk: metric(row.truthRisk),
    novelty: metric(row.novelty, 0.55),
    specificity: metric(row.specificity, 0.7),
    informationValue: metric(row.informationValue, Math.min(1, evidenceIds.length / 5)),
    uncertainty: metric(row.uncertainty, 0.35),
    attentionPotential: metric(row.attentionPotential, 0.55),
    consequencePotential: metric(row.consequencePotential, 0.4),
    callbackPotential: metric(row.callbackPotential, returning ? 0.75 : 0.2),
    compressionPotential: metric(row.compressionPotential, 0.7),
    repetitionRisk: metric(row.repetitionRisk, 0.1),
    distinctiveness: metric(row.distinctiveness, 0.6),
    score: 0,
  };
  candidate.score = candidateScore(candidate, returning, {
    mode: lens && lens !== "LET QRE DECIDE" ? "frame" : "none",
    frame: lens || "NONE",
    confidence: 0.5,
    coreTension: "",
    creativeGain: "",
    templateRisk: "",
    evidenceEventIds: candidate.anchorEventIds,
  });
  return candidate;
}

function fallbackMovie(graph: RealityGraph, lens: string, returning: boolean): LatentMovieCandidate | undefined {
  if (!graph.events.length) {
    return {
      id: "movie-conceptual",
      lens,
      anchorEventIds: [],
      supportingRelationKinds: [],
      trajectory: [],
      payoff: "Make the supplied idea newly visible.",
      unresolvedQuestion: "What becomes possible here?",
      evidence: [],
      hypothesis: ["Conceptual realization without invented events."],
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
      score: 0.7,
    };
  }

  const relations = graph.relations.slice().sort((a, b) => b.strength - a.strength).slice(0, 3);
  const strongest = relations[0];
  const ids = strongest
    ? unique([strongest.from, strongest.to]).slice(0, 2)
    : [graph.events.slice().sort((a, b) => Number(Boolean(b.salient)) - Number(Boolean(a.salient)))[0]!.id];

  const relationKind = strongest?.kind;
  const operation: LatentMovieTrajectoryStep["operation"] =
    relationKind === "changes" ? "reframe" :
    relationKind === "contrasts" ? "contrast" :
    relationKind === "repeats" ? "recur" :
    relationKind === "causes" ? "consequence" :
    relationKind === "recontextualizes" ? "reframe" :
    relationKind === "converges" ? "converge" : "reveal";

  const trajectory: LatentMovieTrajectoryStep[] = strongest
    ? [
      { order: 1, operation: "establish", eventIds: [strongest.from], viewerChange: "the first supplied detail becomes the reference point", nextQuestion: "What changes this reading?" },
      { order: 2, operation, eventIds: [strongest.to], viewerChange: "a second supplied detail changes or completes the reading", nextQuestion: "What lands now?" },
    ]
    : [{ order: 1, operation: returning ? "recur" : "establish", eventIds: ids, viewerChange: "one distinctive supplied detail earns focused attention", nextQuestion: "What else becomes meaningful around it?" }];

  const candidate: LatentMovieCandidate = {
    id: returning ? "movie-return-fallback" : "movie-grounded-fallback",
    lens,
    anchorEventIds: ids,
    supportingRelationKinds: unique(relations.map((item) => item.kind)),
    trajectory,
    payoff: strongest ? (graph.events.find((item) => item.id === strongest.to)?.label ?? "supplied reality") : (graph.events.find((item) => item.id === ids[0])?.label ?? "supplied reality"),
    unresolvedQuestion: returning ? "What is different this time?" : strongest ? "What changes when these supplied details meet?" : "What deserves another look?",
    evidence: eventLabels(graph, ids),
    hypothesis: [returning ? "Return to established material with a changed reading." : strongest ? "A grounded relationship makes these details more meaningful together." : "A distinctive supplied detail can carry the experience without invented plot."],
    truthRisk: 0,
    novelty: returning ? 0.72 : strongest ? 0.63 : 0.66,
    specificity: 0.86,
    informationValue: strongest ? 0.8 : 0.65,
    uncertainty: 0.28,
    attentionPotential: strongest?.strength ?? 0.62,
    consequencePotential: strongest && ["causes", "changes"].includes(strongest.kind) ? 0.82 : 0.4,
    callbackPotential: returning || strongest && ["repeats", "recontextualizes"].includes(strongest.kind) ? 0.84 : 0.18,
    compressionPotential: 0.8,
    repetitionRisk: 0.05,
    distinctiveness: 0.72,
    score: 0,
  };
  candidate.score = candidateScore(candidate, returning, {
    mode: lens && lens !== "LET QRE DECIDE" ? "frame" : "none",
    frame: lens || "NONE",
    confidence: 0.5,
    coreTension: "",
    creativeGain: "",
    templateRisk: "",
    evidenceEventIds: ids,
  });
  return candidate;
}

function adaptiveQuestions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const text = clean(input.prompt).toLowerCase();
  const questions: AuthorAdaptiveQuestion[] = [];
  if (!input.subject && !input.realityGraph.events.some((event) => event.entities.some((entity) => text.includes(entity.toLowerCase())))) {
    questions.push({ kind: "who", question: "Who or what is this about?", reason: "The star is not explicit in supplied reality." });
  }
  if (!input.place && !input.realityGraph.events.some((event) => event.place)) {
    questions.push({ kind: "where", question: "Where did it happen?", reason: "Place may add meaningful continuity." });
  }
  if (!input.realityGraph.events.some((event) => event.time) && !/\b(?:today|yesterday|tomorrow|morning|afternoon|evening|night|\d{1,2}:\d{2}|\d{4})\b/i.test(text)) {
    questions.push({ kind: "when", question: "When did it happen?", reason: "Time may resolve recurrence or continuity." });
  }
  if (!input.facts.length && !input.sourceMoments.length && input.realityGraph.events.length === 0 && !/\b(?:create|make|turn|something|starting over|beautiful)\b/i.test(text)) {
    questions.push({ kind: "event", question: "What happened?", reason: "There is not enough supplied reality to ground a concrete experience." });
  }
  return questions.slice(0, 3);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const explicitLens = clean(input.lens);
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const intelligence = buildAuthorCognitionIntelligence(input.realityGraph, returning);
  const context = {
    prompt: clean(input.prompt),
    subject: clean(input.subject) || "unknown",
    place: clean(input.place) || "unknown",
    explicitLens: explicitLens || "LET QRE DECIDE",
    returning,
    visitNumber: input.visitNumber ?? 1,
    memory: (input.memoryContext ?? []).slice(0, 60),
    trajectory: (input.trajectory ?? []).slice(0, 40),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 60),
    intelligence,
    domainContext: input.domainContext ?? {},
    reality: {
      evidence: input.realityGraph.evidence,
      events: input.realityGraph.events,
      relations: input.realityGraph.relations,
      eventStructure: input.realityGraph.eventStructure,
      continuity: input.realityGraph.entityContinuity,
      patterns: input.realityGraph.patterns,
      tensions: input.realityGraph.unresolvedTensions,
      recurringSignals: input.realityGraph.recurringSignals,
      sensorySignals: input.realityGraph.sensorySignals,
    },
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
            "You are QRE COGNITION. You discover the latent experience inside supplied reality.",
            "You are NOT the writer. Never write customer-facing scenes, dialogue, cinematography, or invented actions.",
            "REALITY IS IMMUTABLE: use only events, entities, places, times, states, relationships, memories and details actually supplied in the graph/context.",
            "STAR RULE: the explicit subject is the star unless supplied reality clearly establishes another primary subject. A venue, service, receipt, object or place is the arena/context around that star.",
            "USE THE INTELLIGENCE BRIEF: it is deterministic pre-analysis of evidence, semantic signals and composition constraints. Treat it as guidance derived from reality, never as extra facts.",
            "FIRST FIND WHAT IS INTERESTING: inspect relationships, state change, recurrence, contrast, consequence, convergence, recontextualization, unusual pairings, persistence, before/after, and distinctive event-level details.",
            "DO NOT ASSUME EVERY EVENT DESERVES A BEAT. A fact may be important evidence and still deserve zero authored language.",
            "SEMANTIC QUALITY IS THE GOAL: do not equate compactness with quality. A rich reality may deserve a long sequence; sparse reality may deserve a short observation. The length must follow meaningful movement, not a fixed budget.",
            "NO CAPTION REEL: never make one generic sentence per event merely to cover the source list. Combine events when their relationship creates meaning. Omit events from story language when they contribute no useful viewer-state change, while keeping them in evidence/provenance.",
            "NO RECEIPT REEL: timestamps, GPS, place metadata, photos and other media/context are not automatic story beats. They remain available as additive experience material and may be arranged around or attached to the story later.",
            "NO PSYCHOLOGICAL FILL-IN: never infer happiness, anxiety, contentment, motive, personality, identity, emotional journey or intent from a routine, preference or coincidence unless explicitly supported.",
            "THESIS RULE: a hypothesis should connect supplied facts or express a grounded observation. Prefer a structural relationship over a diagnosis of the subject.",
            "RETURN RULE: when returning, use memory to create a new reading, changed status, callback, continuation or contrast. Do not simply repeat the previous movie.",
            "LENS RULE: when LET QRE DECIDE is active, only use an established QRE frame when it is grounded and creates genuine creative gain. Never invent a private genre such as 'microscopic' or 'temporal'. If no established frame earns selection, use NONE.",
            "KNOWN QRE FRAMES may include comedy, funny, noir, romance, romantic, horror, heist, game, fierce, courtroom, military, documentary, deadpan, tender, surreal, wild, spy, mission, speedrun, tournament, investigation, backstage, transformation, race, restoration, expedition, quest, countdown, archive. These are treatments, not facts or templates.",
            "MOVIE RULE: the Movie is semantic progression. It answers why the viewer should encounter this next, not simply what physical event happened next.",
            "USE ONLY THESE TRAJECTORY OPERATIONS: establish, contrast, recur, reframe, escalate, converge, reveal, consequence, payoff.",
            "A good sequence changes the viewer's understanding, expectation, attention or emotional interpretation. Do not force hook/develop/turn/payoff when the material does not support it.",
            "When the strongest material is an observation rather than a relationship, use a one-step observation. When there is a real relation, use the relation to produce a two-or-more-step semantic progression.",
            "For every concrete trajectory step, cite existing event IDs. Never invent IDs. Conceptual prompts may have zero event IDs.",
            "ADAPTIVE QUESTIONS: ask only for missing concrete reality that would materially improve the experience: who/what, where, when, what happened, or a concrete distinctive detail. Never ask leading emotional or interpretive questions.",
            "Return JSON only in this shape: {selectedLens, frame:{mode:'frame'|'none',frame,confidence,coreTension,creativeGain,templateRisk,evidenceEventIds:[]}, interpretations:[{id,thesis,creativeOpportunity,rationale,evidenceEventIds,confidence}], movies:[{movieId,lens,evidenceEventIds,anchorEventIds,supportingRelationKinds,trajectory:[{operation,eventIds,viewerChange,nextQuestion}],payoff,unresolvedQuestion,hypothesis,truthRisk,novelty,specificity,informationValue,uncertainty,attentionPotential,consequencePotential,callbackPotential,compressionPotential,repetitionRisk,distinctiveness}], selectedMovieId, adaptiveQuestions:[{kind,question,reason}], attentionStrategy, reasoningSummary}.",
            "Keep reasoningSummary diagnostic and compact. It is never customer-facing.",
          ].join("\n"),
        },
        { role: "user", content: JSON.stringify(context) },
      ], "json", { numPredict: 3000, temperature: 0.82 });
      model = result.model;
      modelCalls = 1;
      parsed = parseObject(result.text);
    } catch {
      parsed = undefined;
    }
  }

  const frame = frameSelection(parsed, explicitLens, input.realityGraph);
  const selectedLens = frame.mode === "none" ? "NONE" : frame.frame;
  const rawInterpretations = Array.isArray(parsed?.interpretations) ? parsed.interpretations : [];
  const interpretations: AuthorCreativeInterpretation[] = rawInterpretations.slice(0, 8).map((item, index) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: clean(row.id) || `interpretation-${index + 1}`,
      thesis: clean(row.thesis) || "Find a stronger reading inside supplied reality.",
      creativeOpportunity: clean(row.creativeOpportunity) || "recognition",
      rationale: clean(row.rationale) || "supported by supplied evidence",
      evidenceEventIds: validEventIds(row.evidenceEventIds, input.realityGraph),
      confidence: metric(row.confidence, 0.5),
    };
  });

  const rawMovies = Array.isArray(parsed?.movies) ? parsed.movies : [];
  const candidates = rawMovies
    .map((item, index) => normalizeCandidate(item, index, input.realityGraph, selectedLens, returning))
    .filter((candidate): candidate is LatentMovieCandidate => Boolean(candidate))
    .slice(0, 10);
  const fallback = fallbackMovie(input.realityGraph, selectedLens, returning);
  const allCandidates = candidates.length ? candidates : fallback ? [fallback] : [];
  for (const candidate of allCandidates) {
    candidate.score = candidateScore(candidate, returning, frame);
    if (!candidate.lens) candidate.lens = selectedLens;
  }

  const requestedMovieId = clean(parsed?.selectedMovieId) || clean((parsed?.selectedMovie as Record<string, unknown> | undefined)?.movieId);
  const selectedMovie = allCandidates.find((candidate) => candidate.id === requestedMovieId) ?? [...allCandidates].sort((a, b) => b.score - a.score)[0];
  const adaptiveRaw = Array.isArray(parsed?.adaptiveQuestions) ? parsed.adaptiveQuestions : [];
  const modelQuestions: AuthorAdaptiveQuestion[] = adaptiveRaw.slice(0, 4).map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const kind = clean(row.kind) as AuthorAdaptiveQuestion["kind"];
    return { kind, question: clean(row.question), reason: clean(row.reason) };
  }).filter((item) => item.question && ["who", "where", "when", "event", "detail"].includes(item.kind) && !LEADING_EMOTIONAL_QUESTION.test(item.question));
  const localQuestions = adaptiveQuestions(input);
  const dedupQuestions = unique([...modelQuestions, ...localQuestions].map((question) => JSON.stringify(question))).map((value) => JSON.parse(value) as AuthorAdaptiveQuestion).slice(0, 4);

  return {
    selectedLens,
    frame,
    interpretations: interpretations.length
      ? interpretations
      : [{ id: "interpretation-fallback", thesis: selectedMovie?.hypothesis[0] ?? "Find the strongest grounded reading.", creativeOpportunity: frame.mode === "none" ? "natural structure" : "framing", rationale: frame.mode === "none" ? "The supplied material is stronger without a mechanic." : "The selected frame changes attention without changing reality.", evidenceEventIds: selectedMovie?.anchorEventIds ?? [], confidence: selectedMovie ? 0.6 : 0.2 }],
    latentMovieCandidates: allCandidates,
    selectedMovie,
    adaptiveQuestions: dedupQuestions,
    attentionStrategy: clean(parsed?.attentionStrategy) || (selectedMovie?.supportingRelationKinds[0] ? `notice ${selectedMovie.supportingRelationKinds[0]}` : "follow the strongest supplied relationship"),
    reasoningSummary: Array.isArray(parsed?.reasoningSummary)
      ? parsed.reasoningSummary.filter((item): item is string => typeof item === "string").map(clean).filter(Boolean).slice(0, 12)
      : [
        ...intelligence.semanticSignals.slice(0, 4),
        ...intelligence.compositionRules.slice(0, 3),
      ],
    model,
    modelCalls,
  };
}