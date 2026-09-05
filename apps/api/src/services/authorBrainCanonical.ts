/**
 * QRE UNIVERSAL AUTHOR · CANONICAL
 *
 * The Author is orchestration, not another intelligence layer.
 *
 * RealityGraph = reality authority.
 * Cognition = semantic/relationship authority.
 * Movie Search = latent experience structure.
 * Lens = selective pressure.
 * Mouth = language realization.
 * Memory = persistence.
 *
 * The Author never turns the request itself into reality evidence and never
 * creates vertical-specific authors.
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
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearchCanonical.js";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[] = []): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

function movieStrength(movie: LatentMovieCandidate): number {
  const dynamics = movie.viewerStateDynamics?.score ?? 0;
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
      dynamics * 0.08,
  );
}

function selectMovie(cognition: ReturnType<typeof buildAuthorCognitivePlan>): LatentMovieCandidate | undefined {
  const candidates = [...(cognition.latentMovieCandidates ?? [])].filter(
    (candidate) => candidate && candidate.trajectory.length > 0,
  );
  if (!candidates.length) return cognition.selectedMovie;
  return candidates
    .map((candidate) => ({ candidate, rank: movieStrength(candidate) }))
    .sort((a, b) => b.rank - a.rank)[0]?.candidate;
}

function attentionMoveForOperation(operation: string): "orient" | "interrupt" | "tighten" | "recontextualize" | "escalate" | "release" | "land" {
  switch (operation) {
    case "establish":
      return "orient";
    case "contrast":
      return "interrupt";
    case "reframe":
      return "recontextualize";
    case "escalate":
      return "escalate";
    case "consequence":
      return "tighten";
    case "payoff":
      return "land";
    default:
      return "tighten";
  }
}

function roleForBeat(index: number, total: number): string {
  if (index === 0) return "establishing";
  if (index === total - 1) return "payoff";
  return "reveal";
}

function buildBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  const total = movie.trajectory.length;
  return movie.trajectory.map((step, index) => ({
    order: index + 1,
    role: roleForBeat(index, total),
    attentionFunction: clean(
      [
        step.viewerChange,
        movie.storyThesis?.semanticTurn,
        movie.storyThesis?.observerExperience?.objective,
      ]
        .filter(Boolean)
        .join(" "),
    ),
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
      attentionMove: attentionMoveForOperation(step.operation),
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

function rejected(input: AuthorBrainTruth, reason: string, lens: string): CanonicalAuthorResult {
  const subject = clean(input.subject) || "the subject";
  return {
    scenes: [],
    sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
    realizationMode: "collection",
    brief: {
      angle: lens,
      engine: "supplied reality → Cognition → requested experience",
      question: "What supplied detail deserves attention next?",
      strongestImage: "",
      tension: "grounded reality only",
      payoff: "",
      callback: "none",
      rhythm: ["hit", "standard", "short", "hit"],
      avoid: ["invented reality", "restatement", "planner prose"],
    },
    diagnostics: {
      model: process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown",
      modelCalls: 0,
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

function makeSequence(
  selected: Array<{ beat: MouthCandidateBeat; text: string; score: number }>,
  subject: string,
  movie: LatentMovieCandidate,
): SequencePlay {
  const cuts: SequenceCut[] = selected.map((item, index) => {
    const known = selected.slice(0, index).map((entry) => entry.text);
    const viewerBefore: ViewerState = {
      known,
      recentChange: index > 0 ? selected[index - 1]?.text : undefined,
    };
    const viewerAfter: ViewerState = {
      known: [...known, item.text],
      recentChange: item.text,
    };
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: (item.beat.role ?? "reveal") as ViewerAttentionRole,
      sourceIds: unique(item.beat.eventIds),
      informationGain: item.text,
      attentionDelta: clean(item.beat.next),
      viewerBefore,
      viewerAfter,
      necessity: {
        necessary: true,
        reason: clean(item.beat.change) || "advances supplied reality",
      },
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
    continuation: cuts.length ? "The persistent world can accept another supplied event." : undefined,
  };
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

export async function authorBrainCanonical(input: AuthorBrainTruth): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const facts = unique(input.facts);
  const sourceMoments = unique(input.sourceMoments);
  const graph = input.realityGraph ?? buildAuthorRealityGraph({
    prompt: clean(input.prompt),
    subject,
    place: clean(input.place),
    facts,
    sourceMoments,
    memoryContext: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
  });

  const cognition = buildAuthorCognitivePlan({
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject,
    place: clean(input.place),
    facts,
    sourceMoments,
    realityGraph: graph,
    domainContext: input.domainContext,
    memoryContext: input.memoryContext ?? [],
    priorScenes: input.trajectory ?? [],
    priorStrategies: input.creativeLearningContext ?? [],
    round: input.visitNumber ?? 1,
    movieMode: input.movieMode,
  });

  const lens = clean(input.lens) || clean(cognition.selectedFrame) || "NONE";
  const movie = selectMovie(cognition);
  const realizationMode = movie?.trajectory.length ? ("sequence-film" as const) : ("collection" as const);

  if (!movie?.trajectory.length) {
    return rejected(input, "no latent experience candidate selected", lens);
  }

  const envelope = buildAuthorRealityEnvelope({ graph, subject });
  const beats = buildBeats(movie);
  const messages = buildMouthCandidateMessages({
    envelope,
    beats,
    lens,
    priorTexts: input.trajectory ?? [],
    domainContext: input.domainContext,
  });

  let modelCalls = 0;
  let raw: string | undefined;
  try {
    const result = await localModelGenerate(messages, "json", {
      numPredict: 1024,
      temperature: 0.72,
    });
    modelCalls = 1;
    raw = typeof result === "string" ? result : JSON.stringify(result);
  } catch {
    raw = undefined;
  }

  let parsed;
  try {
    parsed = raw ? parseMouthCandidateBatch(raw) : undefined;
  } catch {
    parsed = undefined;
  }

  const selected: Array<{ beat: MouthCandidateBeat; text: string; score: number }> = [];

  for (const beat of beats) {
    const variants = parsed?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    let bestText = "";
    let bestScore = -1;

    for (const text of variants) {
      const candidate = scoreMouthCandidate({
        text,
        beat,
        envelope,
        priorTexts: selected.map((entry) => entry.text),
      });
      if (candidate.score > bestScore) {
        bestScore = candidate.score;
        bestText = clean(text);
      }
    }

    if (!bestText) {
      const sourceEvent = graph.events.find((event) => unique(beat.eventIds).includes(event.id));
      bestText = clean(sourceEvent?.label);
      bestScore = bestText ? 0.2 : 0;
    }

    if (bestText) selected.push({ beat, text: bestText, score: bestScore });
  }

  if (!selected.length) {
    const fallback = rejected(input, "Mouth produced no realizable candidates", lens);
    return {
      ...fallback,
      movie,
      realizationMode,
      diagnostics: { ...fallback.diagnostics, modelCalls },
    };
  }

  const sequence = makeSequence(selected, subject, movie);
  const scenes: AuthorScene[] = selected.map((entry, index) => ({
    text: entry.text,
    kind: index === 0 ? "hook" : index === selected.length - 1 ? "payoff" : "discovery",
  }));
  const selectedScore = metric(
    selected.reduce((sum, item) => sum + item.score, 0) / Math.max(1, selected.length),
  );

  return {
    scenes,
    sequence,
    movie,
    realizationMode,
    brief: {
      angle: lens,
      engine: "reality graph → Cognition → latent interpretation → Movie Search → Sequence → Mouth",
      question: clean(movie.unresolvedQuestion) || "What changes the observer's understanding next?",
      strongestImage: clean(movie.evidence[0]) || clean(selected[0]?.text),
      tension: clean(movie.storyThesis?.semanticTurn) || clean(movie.trajectory[0]?.viewerChange),
      payoff: clean(movie.payoff),
      callback: clean(movie.storyThesis?.payoffDependency) || "none",
      rhythm: selected.map((_, index) => (index === selected.length - 1 ? "hit" : index === 0 ? "short" : "standard")),
      avoid: ["invented reality", "explicit conclusion", "fact repetition", "planner prose"],
    },
    diagnostics: {
      model: process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown",
      modelCalls,
      candidateSequences: cognition.latentMovieCandidates?.length ?? 0,
      acceptedCandidates: parsed ? selected.length : 0,
      qualityStatus: "ACCEPTED",
      renderable: true,
      complete: selected.length === beats.length,
      selectedScore,
      rejectedCandidates: parsed ? [] : [{ reason: "Mouth batch unavailable; used grounded source fallback" }],
    },
  };
}
