import type { AuthorDomainContext, CreativeFrameSelection, LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type AuthorCognitionInput = {
  prompt: string; lens?: string; subject?: string; place?: string; facts: string[]; sourceMoments: string[];
  realityGraph: RealityGraph; domainContext?: AuthorDomainContext; memoryContext?: string[]; trajectory?: string[];
  creativeLearningContext?: string[]; returning?: boolean; visitNumber?: number; movieMode?: boolean;
};
export type AuthorCreativeInterpretation = { id: string; thesis: string; creativeOpportunity: string; rationale: string; evidenceEventIds: string[]; confidence: number };
export type AuthorAdaptiveQuestion = { kind: "who"|"where"|"when"|"event"|"detail"; question: string; reason: string };
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

const clean = (v: unknown): string => String(v ?? "").replace(/\s+/g, " ").trim();
const clamp = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, Number(n.toFixed(3)))) : fallback;
};
const unique = <T>(xs: readonly T[]): T[] => [...new Set(xs)];
const OPS = new Set<LatentMovieTrajectoryStep["operation"]>(["establish","contrast","recur","reframe","escalate","converge","reveal","consequence","payoff"]);
const LENSES = new Set([
  "comedy","funny","fierce","negotiation","operation","investigation","refrain","transformation","noir","romance","romantic","horror","heist","game","courtroom","military","documentary","deadpan","tender","surreal","wild","spy","mission","speedrun","tournament","backstage","race","restoration","expedition","quest","countdown","archive","none","NONE",
]);
const BAD_THESIS = /\b(?:this means|which means|this shows|the point is|the meaning is|the viewer|the audience|the narrative|cognition|planner|candidate|trajectory|compiler|provenance|evidence id)\b/i;

function operationForRelation(kind: string): LatentMovieTrajectoryStep["operation"] | undefined {
  switch (kind) {
    case "contrasts": return "contrast";
    case "changes":
    case "causes": return "consequence";
    case "converges": return "converge";
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    case "involves": return "reframe";
    default: return undefined;
  }
}

function relationKindForMechanism(value: unknown): string {
  switch (clean(value).toLowerCase()) {
    case "contrast": return "contrasts";
    case "recurrence": return "repeats";
    case "transformation": return "changes";
    case "convergence": return "converges";
    case "identity":
    case "identity-echo": return "involves";
    case "recontextualization": return "recontextualizes";
    default: return "";
  }
}

function validIds(value: unknown, graph: RealityGraph): string[] {
  const known = new Set(graph.events.map((event) => event.id));
  if (!Array.isArray(value)) return [];
  return unique(value.filter((item): item is string => typeof item === "string")).map(clean).filter((id) => known.has(id));
}

function frameFor(input: AuthorCognitionInput): CreativeFrameSelection {
  const explicit = clean(input.lens);
  if (!explicit || explicit.toLowerCase() === "let qre decide") {
    return { mode: "none", frame: "NONE", confidence: 1, coreTension: "", creativeGain: "", templateRisk: "", evidenceEventIds: [] };
  }
  const normalized = explicit.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const frame = LENSES.has(normalized) ? normalized : explicit;
  return { mode: "frame", frame, confidence: 1, coreTension: "", creativeGain: "", templateRisk: "", evidenceEventIds: [] };
}

function candidateScore(candidate: LatentMovieCandidate, returning: boolean): number {
  const semanticTransitions = candidate.trajectory.filter((step) => step.eventIds.length >= 2).length;
  const eventSpan = new Set(candidate.trajectory.flatMap((step) => step.eventIds)).size;
  const movement = Math.min(1, semanticTransitions / 3);
  const span = Math.min(1, eventSpan / 6);
  const continuity = returning ? candidate.callbackPotential : candidate.novelty;
  return clamp(
    candidate.compressionPotential * 0.18 +
    candidate.attentionPotential * 0.14 +
    candidate.distinctiveness * 0.14 +
    candidate.novelty * 0.10 +
    candidate.specificity * 0.10 +
    candidate.consequencePotential * 0.10 +
    continuity * 0.08 +
    movement * 0.07 +
    span * 0.05 +
    (1 - candidate.truthRisk) * 0.04,
  );
}

function signature(candidate: LatentMovieCandidate): string {
  return `${candidate.trajectory.map((step) => step.operation).join(">")}|${candidate.trajectory.map((step) => step.eventIds.slice().sort().join("+")).join("|")}`;
}

function dedupe(candidates: LatentMovieCandidate[], limit = 10): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates.slice().sort((a, b) => b.score - a.score)) {
    const key = signature(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
    if (out.length >= limit) break;
  }
  return out;
}

function groundedObservationCandidates(graph: RealityGraph, subject: string, returning: boolean): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [];
  for (const relation of graph.relations.slice(0, 100)) {
    const from = graph.events.find((event) => event.id === relation.from);
    const to = graph.events.find((event) => event.id === relation.to);
    if (!from || !to) continue;
    const operation = operationForRelation(relation.kind) ?? "reveal";
    const trajectory: LatentMovieTrajectoryStep[] = [
      { order: 1, operation: "establish", eventIds: [from.id], viewerChange: from.label, nextQuestion: `What changes when ${to.label} enters?` },
      { order: 2, operation, eventIds: [from.id, to.id], viewerChange: `the relationship between these supplied details becomes visible`, nextQuestion: "What does that make newly noticeable?" },
    ];
    if (relation.kind === "changes" || relation.kind === "converges" || relation.kind === "recontextualizes") {
      trajectory.push({ order: 3, operation: "reveal", eventIds: [to.id], viewerChange: to.label, nextQuestion: "What remains after the changed reading?" });
    }
    trajectory.push({ order: trajectory.length + 1, operation: "payoff", eventIds: [to.id], viewerChange: returning ? "land the return" : "let the changed reading land", nextQuestion: returning ? "What will feel different next time?" : "What lingers?" });
    const candidate: LatentMovieCandidate = {
      id: `reality-movie-${from.id}-${to.id}-${relation.kind}`,
      lens: "NONE",
      anchorEventIds: [from.id, to.id],
      supportingRelationKinds: [relation.kind],
      trajectory,
      payoff: to.label,
      unresolvedQuestion: "What becomes newly noticeable?",
      evidence: [from.label, to.label],
      hypothesis: [`A supplied relationship between ${from.label} and ${to.label} can carry the experience without adding a new event.`],
      truthRisk: 0,
      novelty: clamp(0.55 + relation.strength * 0.4, 0.55),
      specificity: 0.95,
      informationValue: 0.82,
      uncertainty: 0.25,
      attentionPotential: clamp(0.58 + relation.strength * 0.36, 0.58),
      consequencePotential: relation.kind === "changes" || relation.kind === "converges" ? 0.85 : 0.62,
      callbackPotential: returning ? 0.78 : relation.kind === "repeats" ? 0.68 : 0.22,
      compressionPotential: 0.9,
      repetitionRisk: 0.03,
      distinctiveness: clamp(0.65 + relation.strength * 0.3, 0.65),
      score: 0,
    };
    candidate.score = candidateScore(candidate, returning);
    out.push(candidate);
  }
  return dedupe(out, 10);
}

function parse(text: string): Record<string, unknown> | undefined {
  const cleaned = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(cleaned);
    return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(cleaned.slice(start, end + 1));
      return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
}

function normalizeModelCandidates(raw: unknown, graph: RealityGraph, returning: boolean): LatentMovieCandidate[] {
  const object = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rows = Array.isArray(object.movies) ? object.movies : Array.isArray(object.candidates) ? object.candidates : [];
  return rows.slice(0, 8).flatMap((row, index) => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    const ids = validIds(value.anchorEventIds ?? value.evidenceEventIds ?? value.eventIds, graph);
    const rawTrajectory = Array.isArray(value.trajectory) ? value.trajectory : [];
    const trajectory: LatentMovieTrajectoryStep[] = rawTrajectory.flatMap((step, stepIndex) => {
      if (!step || typeof step !== "object") return [];
      const item = step as Record<string, unknown>;
      const operation = clean(item.operation).toLowerCase() as LatentMovieTrajectoryStep["operation"];
      const eventIds = validIds(item.eventIds ?? item.eventId, graph);
      if (!OPS.has(operation) || !eventIds.length) return [];
      return [{ order: stepIndex + 1, operation, eventIds, viewerChange: clean(item.viewerChange ?? item.attentionMove) || "the reading changes", nextQuestion: clean(item.nextQuestion ?? item.nextPromise) || "What changes next?" }];
    });
    if (trajectory.length < 1 || !ids.length) return [];
    const hypothesis = Array.isArray(value.hypothesis) ? value.hypothesis.filter((x): x is string => typeof x === "string").map(clean).filter(Boolean).slice(0, 5) : [];
    const thesis = clean(value.thesis);
    if ((!hypothesis.length && !thesis) || BAD_THESIS.test(hypothesis[0] ?? thesis)) return [];
    const candidate: LatentMovieCandidate = {
      id: clean(value.id ?? value.movieId) || `model-movie-${index + 1}`,
      lens: "NONE",
      anchorEventIds: ids.slice(0, 6),
      supportingRelationKinds: Array.isArray(value.supportingRelationKinds) ? unique(value.supportingRelationKinds.filter((x): x is string => typeof x === "string").map(clean)) : [],
      trajectory,
      payoff: clean(value.payoff ?? value.landing) || graph.events.find((event) => event.id === ids.at(-1))?.label || "",
      unresolvedQuestion: clean(value.unresolvedQuestion ?? value.nextQuestion) || "What becomes newly noticeable?",
      evidence: Array.isArray(value.evidence) ? value.evidence.filter((x): x is string => typeof x === "string").map(clean).filter(Boolean).slice(0, 24) : [],
      hypothesis: hypothesis.length ? hypothesis : [thesis],
      truthRisk: clamp(value.truthRisk),
      novelty: clamp(value.novelty, 0.7),
      specificity: clamp(value.specificity, 0.85),
      informationValue: clamp(value.informationValue, 0.75),
      uncertainty: clamp(value.uncertainty, 0.3),
      attentionPotential: clamp(value.attentionPotential, 0.7),
      consequencePotential: clamp(value.consequencePotential, 0.55),
      callbackPotential: clamp(value.callbackPotential, returning ? 0.75 : 0.2),
      compressionPotential: clamp(value.compressionPotential, 0.8),
      repetitionRisk: clamp(value.repetitionRisk, 0.08),
      distinctiveness: clamp(value.distinctiveness, 0.75),
      score: 0,
    };
    candidate.score = candidateScore(candidate, returning);
    return [candidate];
  });
}

function questions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const out: AuthorAdaptiveQuestion[] = [];
  if (!input.subject) out.push({ kind: "who", question: "Who or what is this about?", reason: "The focal subject is missing." });
  if (!input.place && !input.realityGraph.events.some((event) => event.place)) out.push({ kind: "where", question: "Where did this happen?", reason: "Place may add meaningful context." });
  if (!input.realityGraph.events.some((event) => event.time)) out.push({ kind: "when", question: "When did this happen?", reason: "Time may add continuity when it matters." });
  return out.slice(0, 3);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const subject = clean(input.subject) || "the subject";
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const frame = frameFor(input);
  let model = "deterministic";
  let modelCalls = 0;
  let parsed: Record<string, unknown> | undefined;

  if (input.movieMode !== false) {
    try {
      const reality = {
        subject,
        prompt: clean(input.prompt),
        facts: input.realityGraph.events.map((event) => ({ id: event.id, label: event.label, entities: event.entities, place: event.place, time: event.time })),
        relations: input.realityGraph.relations.map((relation) => ({ from: relation.from, to: relation.to, kind: relation.kind, strength: relation.strength })),
        patterns: input.realityGraph.patterns ?? [],
        tensions: input.realityGraph.unresolvedTensions ?? [],
        sensory: input.realityGraph.sensorySignals ?? [],
        returning,
        requestedLens: clean(input.lens) || "NONE",
        learning: (input.creativeLearningContext ?? []).slice(0, 12),
      };
      const system = [
        "You are the semantic discovery intelligence inside QRE.",
        "Do not write the film yet.",
        "Do not choose a genre unless the user explicitly supplied a lens.",
        "Your job is to discover several different movies that are genuinely hiding inside the supplied reality.",
        "A movie is a relationship, progression, contradiction, recurrence, transformation, convergence, recontextualization, accumulation, persistence, interruption, return, identity echo, or other meaningful structure supported by supplied events.",
        "RealityGraph is immutable source truth. Never add facts, events, people, actions, places, chronology, motives, emotions, capabilities, outcomes, sounds, sensory properties, or backstory.",
        "Do not turn a dog into a game, a business into a mission, or a cleaning job into an operation merely because those metaphors are available. First discover what is actually interesting in the evidence.",
        "Do not merely paraphrase events. Do not create one movie per fact.",
        "Search for the hidden relationship that makes a sequence want to continue.",
        "A strong possibility often contains an expectation that changes, a detail that gains meaning later, a repeated element that accumulates force, or two ordinary details whose combination becomes significant.",
        "Do not resolve the observer's inference. State the hypothesis internally and leave room for the Artist to express it indirectly.",
        "Return 3 to 6 materially different candidates. Each candidate must cite real event IDs.",
        "For each candidate provide a compact hypothesis, evidence, trajectory, unresolved question, payoff, and creative metrics.",
        "The trajectory is structural guidance, not customer-facing writing.",
        "Use only establish, contrast, recur, reframe, escalate, converge, reveal, consequence, payoff.",
        "Return JSON only with movies and interpretations. No screenplay. No customer-facing prose.",
      ].join("\n");
      const result = await localModelGenerate(
        [{ role: "system", content: system }, { role: "user", content: JSON.stringify(reality) }],
        "json",
        { numPredict: 3200, temperature: 0.92 },
      );
      parsed = parse(result.text);
      model = result.model;
      modelCalls = 1;
    } catch {
      model = "deterministic";
    }
  }

  const modelCandidates = normalizeModelCandidates(parsed, input.realityGraph, returning);
  const grounded = groundedObservationCandidates(input.realityGraph, subject, returning);
  const candidates = dedupe([...modelCandidates, ...grounded], 10);
  const selectedMovie = candidates[0];

  const rawInterpretations = Array.isArray(parsed?.interpretations) ? parsed!.interpretations as unknown[] : [];
  const interpretations: AuthorCreativeInterpretation[] = rawInterpretations.slice(0, 6).flatMap((row, index) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const thesis = clean(item.thesis ?? item.description ?? item.relationship);
    const evidenceEventIds = validIds(item.evidenceEventIds, input.realityGraph);
    if (!thesis || BAD_THESIS.test(thesis)) return [];
    return [{
      id: clean(item.id) || `interpretation-${index + 1}`,
      thesis,
      creativeOpportunity: clean(item.creativeOpportunity ?? item.opportunity) || "make the relationship visible without explaining it",
      rationale: clean(item.rationale) || "grounded in supplied reality",
      evidenceEventIds,
      confidence: clamp(item.confidence, 0.65),
    }];
  });

  const fallbackInterpretation = selectedMovie && !interpretations.length
    ? [{
        id: "interpretation-grounded",
        thesis: selectedMovie.hypothesis[0] ?? "",
        creativeOpportunity: "make the discovered relationship visible through sequence",
        rationale: "derived from supplied relationship structure",
        evidenceEventIds: selectedMovie.anchorEventIds,
        confidence: selectedMovie.score,
      }]
    : interpretations;

  const attentionStrategy = "Accumulate meaning. Let each cut alter what the observer expects from the next. Prefer exact language with few words over explanation.";
  const reasoningSummary = selectedMovie
    ? [
        "Search was grounded in supplied events and their relationships.",
        `Strongest current possibility: ${selectedMovie.hypothesis[0] ?? "grounded relationship"}.`,
        "Artist realization must preserve uncertainty until the observer has a chance to notice the meaning.",
      ]
    : [];

  return {
    selectedLens: frame.frame,
    frame,
    interpretations: fallbackInterpretation,
    latentMovieCandidates: candidates,
    selectedMovie,
    adaptiveQuestions: questions(input),
    attentionStrategy,
    reasoningSummary,
    model,
    modelCalls,
  };
}
