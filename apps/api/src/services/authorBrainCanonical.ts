/* QRE UNIVERSAL AUTHOR · CANONICAL
 *
 * Orchestration only: RealityGraph -> Cognition -> Movie -> Lens -> Mouth.
 * No vertical brain. No raw-source fallback. Failed realization stays failed.
 */
import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  LatentMovieCandidate,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { buildMouthCandidateMessages, parseMouthCandidateBatch, scoreMouthCandidate, type MouthCandidateBeat } from "./authorMouthCandidateSearchCanonical.js";
import { groundAuthorBeat } from "./authorBeatTruthGate.js";
import { mouthCraftSystem, mouthQualityPenalty } from "./authorMouthCraft.js";
import { critiqueMouthCandidates } from "./authorMouthCritic.js";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly unknown[] = []): string[] => [...new Set(values.map(clean).filter(Boolean))];
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

function rankMovie(movie: LatentMovieCandidate): number {
  return metric(
    movie.score * 0.28 +
      movie.informationValue * 0.18 +
      movie.attentionPotential * 0.14 +
      movie.consequencePotential * 0.1 +
      movie.callbackPotential * 0.08 +
      movie.compressionPotential * 0.08 +
      movie.distinctiveness * 0.08 +
      (1 - movie.truthRisk) * 0.04 +
      (1 - movie.repetitionRisk) * 0.02 +
      (movie.viewerStateDynamics?.score ?? 0) * 0.08,
  );
}

function selectMovie(cognition: ReturnType<typeof buildAuthorCognitivePlan>): LatentMovieCandidate | undefined {
  return [...(cognition.latentMovieCandidates ?? [])]
    .filter((candidate) => candidate && candidate.trajectory.length > 0)
    .sort((a, b) => rankMovie(b) - rankMovie(a))[0] ?? cognition.selectedMovie;
}

function attentionMove(operation: string): MouthCandidateBeat["viewerState"] ["attentionMove"] {
  switch (operation) {
    case "establish": return "orient";
    case "contrast": return "interrupt";
    case "reframe": return "recontextualize";
    case "escalate": return "escalate";
    case "consequence": return "tighten";
    case "payoff": return "land";
    default: return "tighten";
  }
}

function role(index: number, total: number): string {
  if (index === 0) return "establishing";
  if (index === total - 1) return "payoff";
  return "reveal";
}

function buildBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  const total = movie.trajectory.length;
  return movie.trajectory.map((step, index) => ({
    order: index + 1,
    role: role(index, total),
    attentionFunction: clean([step.viewerChange, movie.storyThesis?.semanticTurn, movie.storyThesis?.observerExperience?.objective].filter(Boolean).join(" ")),
    eventIds: unique(step.eventIds),
    change: clean(step.viewerChange),
    next: clean(step.nextQuestion),
    frontier: clean(step.nextQuestion),
    paysOff: index === total - 1 ? [movie.payoff] : [],
    relationKinds: unique(movie.supportingRelationKinds),
    semanticRealization: movie.storyThesis?.semanticRealization,
    observerExperience: movie.storyThesis?.observerExperience,
    viewerState: {
      beforeState: index === 0 ? "" : "previous cut is known",
      afterState: clean(step.viewerChange),
      attentionMove: attentionMove(step.operation),
      curiosityPressure: metric(movie.attentionPotential),
      contrast: metric(movie.viewerStateDynamics?.contrast ?? 0),
      interruption: metric(movie.viewerStateDynamics?.interruption ?? 0),
      accumulation: metric(movie.viewerStateDynamics?.accumulation ?? 0),
      tempo: metric(movie.viewerStateDynamics?.tempo ?? 0.5),
      payoffPressure: metric(movie.viewerStateDynamics?.payoff ?? 0),
      stateShift: metric(movie.viewerStateDynamics?.stateShift ?? 0),
      predictionError: metric(movie.viewerStateDynamics?.predictionError ?? 0),
      evidenceEventIds: unique(step.eventIds),
    },
  }));
}

export type CanonicalAuthorResult = {
  scenes: AuthorScene[];
  sequence: SequencePlay;
  movie?: LatentMovieCandidate;
  realizationMode: "collection" | "state" | "sequence-film";
  brief: AuthorCreativeBrief;
  diagnostics: {
    model: string;
    modelCalls: number;
    candidateSequences: number;
    acceptedCandidates: number;
    qualityStatus: "ACCEPTED" | "REJECTED";
    renderable: boolean;
    complete: boolean;
    selectedScore: number;
    rejectedCandidates: unknown[];
  };
};

function rejected(input: AuthorBrainTruth, reason: string, lens: string, movie?: LatentMovieCandidate, modelCalls = 0): CanonicalAuthorResult {
  const subject = clean(input.subject) || "the subject";
  return {
    scenes: [],
    sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
    movie,
    realizationMode: movie?.trajectory.length ? "sequence-film" : "collection",
    brief: {
      angle: lens,
      engine: "RealityGraph → Cognition → Movie Search → Lens → Truth Gate → Mouth",
      question: "What supplied detail deserves attention next?",
      strongestImage: "",
      tension: "grounded reality only",
      payoff: "",
      callback: "none",
      rhythm: ["short", "standard", "hit"],
      avoid: ["invented reality", "raw source fallback", "planner prose", "fact repetition"],
    },
    diagnostics: {
      model: process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown",
      modelCalls,
      candidateSequences: 0,
      acceptedCandidates: 0,
      qualityStatus: "REJECTED",
      renderable: false,
      complete: false,
      selectedScore: 0,
      rejectedCandidates: [{ reason }],
    },
  };
}

function makeSequence(selected: Array<{ beat: MouthCandidateBeat; text: string; score: number }>, subject: string, movie: LatentMovieCandidate): SequencePlay {
  const cuts: SequenceCut[] = selected.map((item, index) => {
    const prior = selected.slice(0, index).map((entry) => entry.text);
    const viewerBefore: ViewerState = { known: prior, recentChange: index > 0 ? selected[index - 1]?.text : undefined };
    const viewerAfter: ViewerState = { known: [...prior, item.text], recentChange: item.text };
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: (item.beat.role ?? "reveal") as ViewerAttentionRole,
      sourceIds: unique(item.beat.eventIds),
      informationGain: item.text,
      attentionDelta: clean(item.beat.next),
      viewerBefore,
      viewerAfter,
      necessity: { necessary: true, reason: clean(item.beat.change) || "advances the approved semantic movement" },
      nextPromise: clean(item.beat.next),
      payoffConnection: index === selected.length - 1 ? clean(movie.payoff) : undefined,
      confidence: metric(item.score),
    };
  });
  return {
    subject,
    premise: cuts[0]?.informationGain ?? "",
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: [],
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuation: cuts.length ? "The world is ready for another supplied event." : undefined,
  };
}

function craftMessages(input: { subject: string; lens: string; envelope: ReturnType<typeof buildAuthorRealityEnvelope>; beats: MouthCandidateBeat[]; priorCuts: string[] }) {
  const world = [input.envelope.subject, ...input.envelope.suppliedPhrases, ...input.envelope.suppliedEntities, ...input.envelope.suppliedActions, ...input.envelope.suppliedStates, ...input.envelope.events.map((event) => event.label)].map(clean).filter(Boolean);
  const payload = {
    subject: input.subject,
    lens: input.lens,
    suppliedReality: world,
    priorCuts: input.priorCuts,
    approvedBeats: input.beats,
  };
  return [
    { role: "system" as const, content: mouthCraftSystem("bold language, conservative facts") },
    { role: "user" as const, content: JSON.stringify(payload) },
  ];
}

function candidateFor(index: number, beats: MouthCandidateBeat[], parsed: ReturnType<typeof parseMouthCandidateBatch>, envelope: ReturnType<typeof buildAuthorRealityEnvelope>): string[] {
  const variants = parsed?.variantsByBeat.find((item) => item.order === beats[index]?.order)?.variants ?? [];
  return variants.map(clean).filter(Boolean);
}

export async function authorBrainCanonical(input: AuthorBrainTruth): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const facts = unique(input.facts);
  const sourceMoments = unique(input.sourceMoments);
  const graph = input.realityGraph ?? buildAuthorRealityGraph({ prompt: clean(input.prompt), subject, place: clean(input.place), facts, sourceMoments, memoryContext: input.memoryContext ?? [], trajectory: input.trajectory ?? [] });
  const cognition = buildAuthorCognitivePlan({ prompt: clean(input.prompt), lens: clean(input.lens), subject, place: clean(input.place), facts, sourceMoments, realityGraph: graph, domainContext: input.domainContext, memoryContext: input.memoryContext ?? [], priorScenes: input.trajectory ?? [], priorStrategies: input.creativeLearningContext ?? [], round: input.visitNumber ?? 1, movieMode: input.movieMode });
  const lens = clean(input.lens) || clean(cognition.selectedFrame) || "NONE";
  const movie = selectMovie(cognition);
  if (!movie?.trajectory.length) return rejected(input, "no latent experience candidate selected", lens);

  const envelope = buildAuthorRealityEnvelope({ graph, subject });
  const beats = buildBeats(movie);
  const gatedBeats: MouthCandidateBeat[] = [];
  for (const beat of beats) {
    let grounded;
    try {
      grounded = await groundAuthorBeat({ subject, facts, moments: sourceMoments, memory: input.memoryContext ?? [], beat: { order: beat.order, role: beat.role ?? "discovery", gainKind: "discovery", change: beat.change, frontier: beat.frontier, nextNeed: beat.next, necessity: beat.attentionFunction } });
    } catch {
      return rejected(input, `truth gate unavailable for beat ${beat.order}`, lens, movie);
    }
    if (!grounded.approvedEvidence.length) return rejected(input, `beat ${beat.order} has no approved evidence`, lens, movie);
    gatedBeats.push({ ...beat, creativeMove: grounded.creativeOpportunity, forbiddenMoves: grounded.forbiddenClaims, obligations: grounded.approvedEvidence });
  }

  let modelCalls = 1;
  let parsed: ReturnType<typeof parseMouthCandidateBatch> | undefined;
  try {
    const result = await localModelGenerate(craftMessages({ subject, lens, envelope, beats: gatedBeats, priorCuts: input.trajectory ?? [] }), "json", { numPredict: 1024, temperature: 0.72 });
    modelCalls += 1;
    parsed = parseMouthCandidateBatch(result.text);
  } catch {
    return rejected(input, "Mouth Craft unavailable", lens, movie, modelCalls);
  }
  if (!parsed) return rejected(input, "Mouth returned an invalid candidate batch", lens, movie, modelCalls);

  const selected: Array<{ beat: MouthCandidateBeat; text: string; score: number }> = [];
  for (const beat of gatedBeats) {
    const variants = candidateFor(beat.order - 1, gatedBeats, parsed, envelope);
    if (!variants.length) return rejected(input, `Mouth produced no candidates for beat ${beat.order}`, lens, movie, modelCalls);

    const scored = variants.map((text) => ({ text, candidate: scoreMouthCandidate({ text, beat, envelope, priorTexts: selected.map((entry) => entry.text) }) }))
      .filter((item) => mouthQualityPenalty(item.text) < 0.7)
      .sort((a, b) => b.candidate.score - a.candidate.score);
    if (!scored.length) return rejected(input, `all Mouth candidates failed local quality checks for beat ${beat.order}`, lens, movie, modelCalls);

    const critic = await critiqueMouthCandidates({ prompt: input.prompt, lens, subject, facts, moments: sourceMoments, memory: input.memoryContext ?? [], moviePremise: movie.payoff, beat, candidates: scored.map((item) => item.text) });
    modelCalls += 1;
    if (critic.decision !== "accept" || critic.bestIndex < 0 || critic.bestIndex >= scored.length) {
      return rejected(input, `Mouth Critic rejected beat ${beat.order}: ${critic.reason}`, lens, movie, modelCalls);
    }
    const chosen = scored[critic.bestIndex];
    selected.push({ beat, text: chosen.text, score: chosen.candidate.score });
  }

  if (!selected.length) return rejected(input, "no accepted Mouth realization", lens, movie, modelCalls);
  const sequence = makeSequence(selected, subject, movie);
  const scenes: AuthorScene[] = selected.map((entry, index) => ({ text: entry.text, kind: index === 0 ? "hook" : index === selected.length - 1 ? "payoff" : "discovery" }));
  const selectedScore = metric(selected.reduce((sum, item) => sum + item.score, 0) / selected.length);
  return {
    scenes,
    sequence,
    movie,
    realizationMode: "sequence-film",
    brief: {
      angle: lens,
      engine: "RealityGraph → Cognition → Movie Search → Lens → Truth Gate → Mouth → Critic",
      question: clean(movie.unresolvedQuestion) || "What changes the observer's understanding next?",
      strongestImage: clean(movie.evidence[0]) || clean(selected[0]?.text),
      tension: clean(movie.storyThesis?.semanticTurn) || clean(movie.trajectory[0]?.viewerChange),
      payoff: clean(movie.payoff),
      callback: clean(movie.storyThesis?.payoffDependency) || "none",
      rhythm: selected.map((_, index) => index === selected.length - 1 ? "hit" : index === 0 ? "short" : "standard"),
      avoid: ["invented reality", "fact repetition", "generic summary", "planner prose"],
    },
    diagnostics: { model: process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown", modelCalls, candidateSequences: cognition.latentMovieCandidates?.length ?? 0, acceptedCandidates: selected.length, qualityStatus: "ACCEPTED", renderable: true, complete: selected.length === beats.length, selectedScore, rejectedCandidates: [] },
  };
}
