/*
 * QRE CANONICAL COGNITION
 *
 * Cognition finds what is interesting in supplied reality, optionally selects
 * a creative frame, and selects one latent Movie. It never writes scenes.
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

function normalizeTrajectory(value: unknown, graph: RealityGraph): LatentMovieTrajectoryStep[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item, index) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const eventIds = normalizeIds(row, graph);
    const operation = clean(row.operation).toLowerCase() as LatentMovieTrajectoryStep["operation"];
    const viewerChange = clean(row.viewerChange) || clean(row.attentionMove) || "another supplied detail becomes newly meaningful";
    const nextQuestion = clean(row.nextQuestion) || clean(row.nextPromise) || "What does this make noticeable next?";
    return {
      order: index + 1,
      operation: OPERATIONS.has(operation) ? operation : index === 0 ? "establish" : index === 1 ? "reveal" : "reframe",
      eventIds,
      viewerChange,
      nextQuestion,
    } satisfies LatentMovieTrajectoryStep;
  }).filter((step) => graph.events.length === 0 || step.eventIds.length > 0);
}

function eventLabels(graph: RealityGraph, ids: readonly string[]): string[] {
  const byId = new Map(graph.events.map((event) => [event.id, event.label]));
  return unique(ids.map((id) => byId.get(id)).filter((value): value is string => Boolean(value))).slice(0, 12);
}

function frameSelection(parsed: Record<string, unknown> | undefined, explicitLens: string, graph: RealityGraph): CreativeFrameSelection {
  const raw = parsed?.frame && typeof parsed.frame === "object" ? parsed.frame as Record<string, unknown> : {};
  const selected = clean(parsed?.selectedLens || raw.frame || explicitLens);
  const isExplicit = Boolean(explicitLens) && explicitLens.toLowerCase() !== "let qre decide";
  const mode = isExplicit || (selected && !/^none$/i.test(selected)) ? "frame" : "none";
  const frame = selected || "NONE";
  const evidenceEventIds = validEventIds(raw.evidenceEventIds ?? parsed?.frameEvidenceEventIds, graph);
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
  const relation = Math.min(1, candidate.supportingRelationKinds.length / 3) * 0.1;
  const continuity = returning ? candidate.callbackPotential * 0.15 : candidate.novelty * 0.1;
  const frameBonus = frame.mode === "frame" && frame.confidence >= 0.65 ? 0.06 : 0;
  return metric(
    candidate.attentionPotential * 0.2 +
    candidate.novelty * 0.16 +
    candidate.specificity * 0.12 +
    candidate.distinctiveness * 0.12 +
    candidate.consequencePotential * 0.1 +
    candidate.callbackPotential * 0.1 +
    candidate.compressionPotential * 0.08 +
    (1 - candidate.truthRisk) * 0.07 +
    relation + continuity + frameBonus,
  );
}

function normalizeCandidate(raw: unknown, index: number, graph: RealityGraph, defaultLens: string, returning: boolean): LatentMovieCandidate | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const trajectory = normalizeTrajectory(row.trajectory, graph);
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
  const relations = graph.relations.slice().sort((a, b) => b.strength - a.strength).slice(0, 4);
  const ids = relations.length
    ? unique(relations.flatMap((relation) => [relation.from, relation.to])).slice(0, 6)
    : graph.events.slice(0, Math.min(5, graph.events.length)).map((event) => event.id);
  const trajectory = ids.map((id, index) => ({
    order: index + 1,
    operation: (index === 0 ? "establish" : index === ids.length - 1 ? "payoff" : relations[index - 1]?.kind === "recontextualizes" ? "reframe" : returning ? "recur" : "reveal") as LatentMovieTrajectoryStep["operation"],
    eventIds: [id],
    viewerChange: graph.events.find((event) => event.id === id)?.label ?? "new supplied detail",
    nextQuestion: index === ids.length - 1 ? "What lands now?" : "What changes the reading next?",
  }));
  const candidate: LatentMovieCandidate = {
    id: returning ? "movie-return-fallback" : "movie-grounded-fallback",
    lens,
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: unique(relations.map((relation) => relation.kind)),
    trajectory,
    payoff: graph.events.find((event) => event.id === ids.at(-1))?.label ?? "supplied reality",
    unresolvedQuestion: returning ? "What is different this time?" : "What is becoming noticeable?",
    evidence: eventLabels(graph, ids),
    hypothesis: [returning ? "Return to established material with a changed reading." : "Find the strongest connected meaning without inventing a plot."],
    truthRisk: 0,
    novelty: returning ? 0.68 : 0.58,
    specificity: 0.82,
    informationValue: Math.min(1, ids.length / 5),
    uncertainty: 0.35,
    attentionPotential: relations[0]?.strength ?? 0.55,
    consequencePotential: relations.some((relation) => ["causes", "changes"].includes(relation.kind)) ? 0.75 : 0.4,
    callbackPotential: returning || relations.some((relation) => ["repeats", "recontextualizes"].includes(relation.kind)) ? 0.82 : 0.18,
    compressionPotential: 0.74,
    repetitionRisk: 0.12,
    distinctiveness: 0.62,
    score: 0,
  };
  candidate.score = candidateScore(candidate, returning, {
    mode: lens && lens !== "LET QRE DECIDE" ? "frame" : "none",
    frame: lens || "NONE",
    confidence: 0.5,
    coreTension: "",
    creativeGain: "",
    templateRisk: "",
    evidenceEventIds: ids.slice(0, 2),
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
            "You are QRE COGNITION. You discover latent meaning from supplied reality.",
            "You are NOT the writer. Do not write customer-facing scenes, dialogue, cinematography, or invented actions.",
            "REALITY IS IMMUTABLE: use only events, entities, places, times, states, relationships, memories and details actually supplied in the input graph/context.",
            "STAR RULE: the explicit subject is the star unless the supplied reality clearly establishes another primary subject. The receipt, house, venue, service, object or place is the arena/context around that star.",
            "FIRST FIND WHAT IS INTERESTING: look for salient relationships, contrasts, state changes, repetitions, callbacks, surprising pairings, status shifts, consequences and emotional movement already supported by the evidence.",
            "THEN SEARCH FOR A FRAME. A frame is a lens, not a story. It changes where you look and the attitude available to the Mouth. It does not dictate events or a stock sequence.",
            "Possible frames include romance, horror, funny, spy, mission, speedrun, tournament, courtroom, heist, investigation, backstage, transformation, race, restoration, expedition, quest, countdown, archive, etc. NONE is often better.",
            "SELECT FRAME ONLY IF IT CREATES CREATIVE GAIN. For NONE, say what natural structure is stronger without a frame.",
            "THEN DISCOVER THE MOVIE. The Movie is a semantic progression, not prose. It says what becomes meaningful next, not what physically happens next.",
            "DO NOT use sceneDescription, description, dialogue, camera directions, or imagined actions. Do not write the story.",
            "For every concrete trajectory step, cite existing event IDs. Never invent event IDs. A conceptual prompt with an empty graph may have zero event IDs.",
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
  }).filter((item) => item.question && ["who", "where", "when", "event", "detail"].includes(item.kind));
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
      : ["Frame selection precedes semantic Movie selection.", "Cognition emits structure, not customer-facing prose.", "Reality remains the factual authority."],
    model,
    modelCalls,
  };
}
