import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";
import { looksLikeIdentityAssertion } from "@qre/contracts";

import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearch.js";
import { selectBestMouthSequence, type MouthCandidatePool } from "./authorMouthSequenceBeamSearch.js";
import { editAttentionSequence } from "./authorAttentionEditor.js";
import { evaluateSequenceArc } from "./authorSequenceArcGate.js";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function buildCognition(input: AuthorBrainTruth, graph: ReturnType<typeof buildAuthorRealityGraph>) {
  return buildAuthorCognitivePlan({
    prompt: clean(input.prompt),
    lens: input.lens,
    subject: input.subject,
    place: input.place,
    facts: unique(input.facts),
    sourceMoments: unique(input.sourceMoments),
    realityGraph: graph,
    memoryContext: unique(input.memoryContext ?? []),
    priorScenes: [],
    priorStrategies: [],
    round: input.visitNumber ?? 1,
    movieMode: input.movieMode,
  });
}

function orderedSourceMovie(
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  lens: string,
): LatentMovieCandidate | undefined {
  const events = graph.events.filter(
    (event) =>
      clean(event.label) &&
      !looksLikeIdentityAssertion(event.label),
  );
  if (events.length < 3) return undefined;

  const selected = events.slice(0, 8);
  const trajectory: LatentMovieTrajectoryStep[] = selected.map((event, index) => {
    const first = index === 0;
    const last = index === selected.length - 1;
    return {
      order: index + 1,
      operation: first ? "establish" : last ? "payoff" : "reveal",
      eventIds: [event.id],
      viewerChange: clean(event.label),
      nextQuestion: last
        ? "What is now true at the supplied ending?"
        : "What does the next supplied detail change?",
    };
  });

  const specificity = metric(
    selected.reduce(
      (sum, event) =>
        sum + metric(
          Math.min(
            1,
            event.label.split(/\s+/).filter(Boolean).length * 0.08 + event.entities.length * 0.04,
          ),
        ),
      0,
    ) / selected.length,
  );
  const depth = metric(selected.length / 6);

  return {
    id: "movie-supplied-sequence",
    lens: lens || "NONE",
    anchorEventIds: [selected[0]!.id, selected[selected.length - 1]!.id],
    supportingRelationKinds: [],
    trajectory,
    payoff: clean(selected[selected.length - 1]!.label),
    unresolvedQuestion: "What becomes newly meaningful next?",
    evidence: selected.map((event) => clean(event.label)),
    hypothesis: [
      "Preserve supplied order as presentation order only.",
      "Do not infer chronology from list order.",
      "Do not invent bridge events between supplied details.",
    ],
    truthRisk: 0.01,
    novelty: metric(0.5 + specificity * 0.2),
    specificity,
    informationValue: metric(0.5 + specificity * 0.3),
    uncertainty: metric(0.2 + depth * 0.25),
    attentionPotential: metric(0.45 + depth * 0.35),
    consequencePotential: metric(0.2 + depth * 0.3),
    callbackPotential: 0.12,
    compressionPotential: metric(0.5 + specificity * 0.2),
    repetitionRisk: 0.02,
    distinctiveness: 1,
    score: metric(0.5 + specificity * 0.2 + depth * 0.2),
  };
}

function chooseMovie(
  input: AuthorBrainTruth,
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  lens: string,
  cognition: ReturnType<typeof buildCognition>,
): LatentMovieCandidate | undefined {
  const preferred = cognition.latentMovieCandidates.find(
    (candidate) =>
      candidate.trajectory.length >= 3 &&
      candidate.trajectory.every((step) => step.eventIds.length > 0),
  );
  if (preferred) return preferred;

  const searched = searchUniversalMovieCandidates({
    graph,
    subject: clean(input.subject),
    lens,
    limit: 10,
  }).find(
    (candidate) =>
      candidate.trajectory.length >= 3 &&
      candidate.trajectory.every((step) => step.eventIds.length > 0),
  );
  if (searched) return searched;

  return orderedSourceMovie(graph, lens);
}

function roleFor(step: LatentMovieTrajectoryStep, first: boolean, last: boolean): ViewerAttentionRole {
  if (first) return "hook";
  if (last) return "payoff";
  if (step.operation === "contrast" || step.operation === "reframe") return "reframe";
  if (step.operation === "escalate" || step.operation === "consequence") return "escalation";
  if (step.operation === "recur") return "callback";
  return "discovery";
}

function gainFor(step: LatentMovieTrajectoryStep, first: boolean, last: boolean): NonNullable<SequenceCut["gainKind"]> {
  if (first) return "new_fact";
  if (last) return "payoff";
  if (step.operation === "contrast" || step.operation === "reframe") return "reframe";
  if (step.operation === "escalate") return "escalation";
  if (step.operation === "consequence") return "consequence";
  if (step.operation === "recur") return "callback";
  if (step.operation === "converge") return "discovery";
  return "new_fact";
}

function mouthBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  return movie.trajectory.map((step, index, all) => {
    const first = index === 0;
    const last = index === all.length - 1;
    return {
      order: step.order,
      role: roleFor(step, first, last),
      attentionFunction: first ? "hook" : last ? "payoff" : "reframe",
      creativeMove: "none",
      eventIds: [...step.eventIds],
      change: clean(step.viewerChange),
      next: clean(step.nextQuestion),
      frontier: clean(step.nextQuestion),
      obligations: [],
      forbiddenMoves: [],
      relationKinds: [],
      relationStrength: 0,
    };
  });
}

function sequenceFromCandidates(
  candidates: readonly { text: string; score: number }[],
  beats: readonly MouthCandidateBeat[],
  subject: string,
): SequencePlay {
  const cuts: SequenceCut[] = candidates.map((candidate, index) => {
    const beat = beats[index]!;
    const before: ViewerState = {
      known: index === 0 ? [] : [clean(candidates[index - 1]?.text ?? "")].filter(Boolean),
      expected: index === candidates.length - 1 ? undefined : "another supplied detail",
      recentChange: clean(candidates[index - 1]?.text ?? ""),
    };
    const after: ViewerState = {
      known: [...before.known, clean(candidate.text)].filter(Boolean),
      recentChange: clean(candidate.text),
    };
    const sourceIds = unique(beat.eventIds ?? []);
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: (beat.role ?? "discovery") as ViewerAttentionRole,
      gainKind: gainFor(
        {
          order: beat.order,
          operation: index === 0 ? "establish" : index === candidates.length - 1 ? "payoff" : "reveal",
          eventIds: sourceIds,
          viewerChange: beat.change ?? candidate.text,
          nextQuestion: beat.next ?? "",
        },
        index === 0,
        index === candidates.length - 1,
      ),
      sourceIds,
      informationGain: clean(candidate.text),
      attentionDelta: clean(beat.next),
      viewerBefore: before,
      viewerAfter: after,
      necessity: {
        necessary: true,
        reason: clean(beat.change) || "advances supplied reality",
      },
      nextPromise: clean(beat.next),
      confidence: metric(candidate.score),
    };
  });

  return {
    subject,
    premise: cuts[0]?.informationGain ?? "",
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: cuts.map((cut) => cut.informationGain),
    cuts,
    closingState: cuts.length ? { known: cuts.map((cut) => cut.informationGain) } : undefined,
    continuation: cuts.length ? "The memory can continue with another supplied detail." : undefined,
  };
}

export type CanonicalAuthorResult = {
  scenes: AuthorScene[];
  sequence: SequencePlay;
  movie?: LatentMovieCandidate;
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
  const graph = buildAuthorRealityGraph({
    prompt: clean(input.prompt),
    subject,
    place: clean(input.place),
    facts,
    sourceMoments,
    memoryContext: [],
    trajectory: [],
  });

  const cognition = buildCognition({ ...input, facts, sourceMoments }, graph);
  const lens = clean(input.lens) || clean(cognition.selectedFrame) || "NONE";
  const movie = input.movieMode === false ? undefined : chooseMovie(input, graph, lens, cognition);

  if (!movie || movie.trajectory.length < 3) {
    return {
      scenes: [],
      sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
      movie,
      brief: {
        angle: lens,
        engine: "source reality → grounded sequence → single Mouth realization",
        question: "What supplied detail should land next?",
        strongestImage: graph.events.find((event) => !looksLikeIdentityAssertion(event.label))?.label ?? "",
        tension: "novelty → contrast → consequence → payoff",
        payoff: movie?.payoff ?? "",
        callback: "none",
        rhythm: ["hit", "standard", "hit", "short"],
        avoid: ["fact parade", "invented events", "planner prose"],
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
        rejectedCandidates: [{ reason: "no-complete-grounded-movie" }],
      },
    };
  }

  const envelope = buildAuthorRealityEnvelope({ graph, subject });
  const beats = mouthBeats(movie);
  const messages = buildMouthCandidateMessages({ envelope, beats, lens });

  let modelCalls = 0;
  let modelName = process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown";
  let pools: MouthCandidatePool[] = [];

  try {
    const generated = await localModelGenerate(messages, "json", {
      numPredict: 1024,
      temperature: 0.7,
    });
    modelCalls += 1;
    modelName = generated.model || modelName;
    const parsed = parseMouthCandidateBatch(generated.text);
    if (parsed) {
      pools = beats.map((beat) => ({
        order: beat.order,
        candidates: (parsed.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [])
          .map((text) => scoreMouthCandidate({ text, beat, envelope }))
          .filter((candidate) => candidate.text.length > 0),
      }));
    }
  } catch {
    modelCalls += 1;
  }

  const usablePools =
    pools.length === beats.length && pools.every((pool) => pool.candidates.length > 0)
      ? pools
      : beats.map((beat) => ({
          order: beat.order,
          candidates: (() => {
            const source = beat.eventIds
              ?.map((id) => clean(envelope.events.find((event) => event.id === id)?.label))
              .filter(Boolean)[0];
            return source
              ? [scoreMouthCandidate({ text: source, beat, envelope })]
              : [];
          })(),
        }));

  const selected = selectBestMouthSequence(usablePools, {
    width: 12,
    candidatesPerBeat: 8,
  });

  const selectedCandidates = selected.candidates.map((candidate) => ({
    text: clean(candidate.text),
    score: candidate.score,
  }));
  const sequence = sequenceFromCandidates(selectedCandidates, beats, subject);

  const attention = editAttentionSequence({
    beats: selected.candidates.map((candidate, index) => ({
      order: index + 1,
      role: beats[index]?.role,
      gainKind: beats[index]
        ? gainFor(
            {
              order: beats[index]!.order,
              operation: index === 0 ? "establish" : index === selected.candidates.length - 1 ? "payoff" : "reveal",
              eventIds: [...(beats[index]!.eventIds ?? [])],
              viewerChange: beats[index]!.change ?? candidate.text,
              nextQuestion: beats[index]!.next ?? "",
            },
            index === 0,
            index === selected.candidates.length - 1,
          )
        : undefined,
      text: clean(candidate.text),
      sourceIds: [...(beats[index]?.eventIds ?? [])],
      attentionFunction: beats[index]?.attentionFunction,
      next: beats[index]?.next,
      frontier: beats[index]?.frontier,
    })),
    evidence: movie.evidence,
  });

  const arc = evaluateSequenceArc(
    selected.candidates.map((candidate, index) => ({
      order: index + 1,
      role: beats[index]?.role,
      attentionFunction: beats[index]?.attentionFunction,
      creativeMove: beats[index]?.creativeMove,
      text: clean(candidate.text),
      change: beats[index]?.change,
      next: beats[index]?.next,
      frontier: beats[index]?.frontier,
      setsUp: [],
      paysOff: index === selected.candidates.length - 1 ? [movie.payoff] : [],
    })),
  );

  const complete =
    selected.candidates.length >= 3 &&
    selected.candidates.length === beats.length &&
    selected.candidates.every((candidate) => clean(candidate.text).length > 0) &&
    beats.every((beat) => (beat.eventIds ?? []).length > 0) &&
    attention.accepted &&
    arc.accepted;

  const score = metric((selected.score ?? 0) * 0.6 + attention.sequenceScore * 0.2 + arc.sequenceScore * 0.2);

  return {
    scenes: selected.candidates.map((candidate, index) => ({
      text: clean(candidate.text),
      kind: index === 0 ? "hook" : index === selected.candidates.length - 1 ? "payoff" : "line",
    })),
    sequence,
    movie,
    brief: {
      angle: lens,
      engine: "source reality → deterministic movie/sequence → single Mouth realization → gates",
      question: movie.unresolvedQuestion,
      strongestImage: movie.evidence[0] ?? "",
      tension: "novelty → contrast → consequence → payoff",
      payoff: movie.payoff,
      callback: "none",
      rhythm: ["hit", "standard", "hit", "short"],
      avoid: ["fact parade", "invented events", "planner vocabulary", "summary prose"],
    },
    diagnostics: {
      model: modelName,
      modelCalls,
      candidateSequences: 1,
      acceptedCandidates: complete ? 1 : 0,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: score,
      rejectedCandidates: complete ? [] : [{ attention, arc }],
    },
  };
}
