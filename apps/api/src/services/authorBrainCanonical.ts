import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerMomentum,
} from "@qre/contracts";

import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
  type MouthCandidatePool,
} from "./authorMouthCandidateSearch.js";
import { selectBestMouthSequence } from "./authorMouthSequenceBeamSearch.js";
import { editAttentionSequence } from "./authorAttentionEditor.js";
import { evaluateSequenceArc } from "./authorSequenceArcGate.js";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function lensFrom(input: AuthorBrainTruth, graph: ReturnType<typeof buildAuthorRealityGraph>): string {
  const plan = buildAuthorCognitivePlan({
    prompt: input.prompt,
    lens: input.lens,
    subject: input.subject,
    place: input.place,
    facts: input.facts,
    sourceMoments: input.sourceMoments,
    realityGraph: graph,
    memoryContext: input.memoryContext,
    movieMode: input.movieMode,
  });
  return clean(plan.selectedFrame || input.lens || "NONE");
}

function orderedSourceMovie(
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  subject: string,
  lens: string,
): LatentMovieCandidate | undefined {
  const events = graph.events.filter((event) => clean(event.label));
  if (events.length < 3) return undefined;

  const limited = events.slice(0, 8);
  const trajectory: LatentMovieTrajectoryStep[] = limited.map((event, index) => {
    const first = index === 0;
    const last = index === limited.length - 1;
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
    limited.reduce((sum, event) => sum + Math.min(1, event.entities.length * 0.08 + event.label.split(/\s+/).length * 0.08), 0) /
      Math.max(1, limited.length),
  );
  const depth = metric(limited.length / 6);

  return {
    id: "movie-supplied-sequence",
    lens: lens || "NONE",
    anchorEventIds: [limited[0]!.id, limited[limited.length - 1]!.id],
    supportingRelationKinds: [],
    trajectory,
    payoff: clean(limited[limited.length - 1]!.label),
    unresolvedQuestion: "What becomes newly meaningful next?",
    evidence: limited.map((event) => clean(event.label)),
    hypothesis: [
      "This sequence preserves supplied order as presentation order only.",
      "The source order is not treated as inferred chronology.",
      "No bridge event is invented between supplied details.",
    ],
    truthRisk: 0.01,
    novelty: metric(0.48 + specificity * 0.2),
    specificity,
    informationValue: metric(0.5 + specificity * 0.3),
    uncertainty: metric(0.25 + depth * 0.2),
    attentionPotential: metric(0.45 + depth * 0.35),
    consequencePotential: metric(0.22 + depth * 0.3),
    callbackPotential: 0.12,
    compressionPotential: metric(0.52 + specificity * 0.18),
    repetitionRisk: 0.02,
    distinctiveness: 1,
    score: metric(0.5 + specificity * 0.2 + depth * 0.2),
  };
}

function chooseMovie(
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  subject: string,
  lens: string,
  input: AuthorBrainTruth,
): LatentMovieCandidate | undefined {
  const cognitive = buildAuthorCognitivePlan({
    prompt: input.prompt,
    lens: input.lens,
    subject,
    place: input.place,
    facts: input.facts,
    sourceMoments: input.sourceMoments,
    realityGraph: graph,
    memoryContext: input.memoryContext,
    priorScenes: [],
    priorStrategies: [],
    movieMode: input.movieMode,
  });

  const relational = cognitive.latentMovieCandidates.find(
    (candidate) => candidate.trajectory.length >= 3 && candidate.trajectory.every((step) => step.eventIds.length > 0),
  );
  if (relational) return relational;

  return orderedSourceMovie(graph, subject, lens);
}

function roleFor(operation: LatentMovieTrajectoryStep["operation"], first: boolean, last: boolean): ViewerAttentionRole {
  if (first) return "hook";
  if (last) return "payoff";
  if (operation === "contrast" || operation === "reframe") return "reframe";
  if (operation === "escalate" || operation === "consequence") return "escalation";
  if (operation === "recur") return "callback";
  return "discovery";
}

function gainFor(operation: LatentMovieTrajectoryStep["operation"], first: boolean, last: boolean): NonNullable<SequenceCut["gainKind"]> {
  if (first) return "new_fact";
  if (last) return "payoff";
  if (operation === "contrast" || operation === "reframe") return "reframe";
  if (operation === "escalate" || operation === "consequence") return "escalation";
  if (operation === "recur") return "callback";
  if (operation === "converge") return "discovery";
  return "new_fact";
}

function mouthBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  return movie.trajectory.map((step, index, all) => {
    const first = index === 0;
    const last = index === all.length - 1;
    return {
      order: step.order,
      role: roleFor(step.operation, first, last),
      gainKind: gainFor(step.operation, first, last),
      change: clean(step.viewerChange),
      next: clean(step.nextQuestion),
      frontier: clean(step.nextQuestion),
      necessity: first ? "establish the strongest supplied detail" : last ? "land the supplied endpoint" : "make the next supplied detail matter",
      eventIds: unique(step.eventIds),
      attentionFunction: first ? "hook" : last ? "payoff" : step.operation === "contrast" || step.operation === "reframe" ? "reframe" : step.operation === "escalate" ? "escalation" : "release",
      setsUp: [],
      paysOff: [],
      creativeMove: "none",
      nextBeatPullTarget: last ? 0.05 : 0.7,
    };
  });
}

function fallbackCandidates(
  beats: readonly MouthCandidateBeat[],
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): MouthCandidatePool[] {
  return beats.map((beat) => {
    const source = beat.eventIds
      ?.map((id) => clean(envelope.events.find((event) => event.id === id)?.label))
      .filter(Boolean) ?? [];
    const text = source[0] ?? "";
    return {
      order: beat.order,
      candidates: text
        ? [scoreMouthCandidate({ text, beat, envelope })]
        : [],
    };
  });
}

function makeSequence(
  selected: Awaited<ReturnType<typeof selectBestMouthSequence>>,
  beats: readonly MouthCandidateBeat[],
  subject: string,
): SequencePlay {
  const cuts: SequenceCut[] = selected.cuts.map((cut, index) => {
    const beat = beats[index];
    const before: ViewerMomentum = {
      known: selected.cuts.slice(0, index).map((item) => clean(item.informationGain)).filter(Boolean),
      expected: beat?.next,
      currentWant: beat?.next,
      subjectContinuity: {
        established: index > 0,
        subject,
        referenceMode: index === 0 ? "name" : "implicit",
        referenceCost: index === 0 ? 1 : 0,
        lastExplicitReference: index === 0 ? 1 : undefined,
      },
    };
    const after: ViewerMomentum = {
      ...before,
      known: [...before.known, clean(cut.text)].filter(Boolean),
      forwardPull: beat?.next,
    };
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: beat?.role ?? "discovery",
      gainKind: beat?.gainKind,
      sourceIds: unique(beat?.eventIds ?? []),
      informationGain: clean(cut.text),
      attentionDelta: clean(beat?.next),
      viewerBefore: before,
      viewerAfter: after,
      necessity: {
        necessary: true,
        reason: beat?.necessity ?? "advances supplied reality",
      },
      nextPromise: clean(beat?.next),
      confidence: metric(cut.score),
    };
  });

  return {
    subject,
    premise: selected.cuts[0]?.text ?? "",
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: cuts.map((cut) => cut.informationGain).filter(Boolean),
    openingMomentum: cuts[0]?.viewerAfter,
    cuts,
    closingMomentum: cuts[cuts.length - 1]?.viewerAfter,
    closingState: cuts.length ? "resolved" : "unresolved",
    continuity: true,
    continuation: cuts.length ? "The memory can continue with the next supplied detail." : undefined,
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
  const graph = buildAuthorRealityGraph({
    prompt: clean(input.prompt),
    subject,
    place: clean(input.place),
    facts: unique(input.facts),
    sourceMoments: unique(input.sourceMoments),
    memoryContext: unique(input.memoryContext ?? []),
    trajectory: [],
  });

  const lens = lensFrom(input, graph);
  const movie = input.movieMode === false ? undefined : chooseMovie(graph, subject, lens, input);

  if (!movie || movie.trajectory.length < 3) {
    return {
      scenes: [],
      sequence: {
        subject,
        premise: "",
        openingState: { known: [] },
        cuts: [],
      },
      movie,
      brief: {
        angle: lens,
        engine: "grounded source sequence → single Mouth realization",
        question: "What supplied detail should land next?",
        strongestImage: graph.events[0]?.label ?? "",
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
  let pools: MouthCandidatePool[] = [];
  let modelName = process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown";

  try {
    const generated = await localModelGenerate(messages, "json", {
      numPredict: 1024,
      temperature: 0.7,
    });
    modelCalls += 1;
    modelName = generated.model || modelName;

    const parsed = parseMouthCandidateBatch(generated.text);
    if (parsed) {
      pools = beats.map((beat) => {
        const variants = parsed.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
        return {
          order: beat.order,
          candidates: variants
            .map((text) => scoreMouthCandidate({ text, beat, envelope }))
            .filter((candidate) => candidate.text.length > 0),
        };
      });
    }
  } catch {
    modelCalls += 1;
  }

  const usablePools = pools.every((pool) => pool.candidates.length > 0) ? pools : fallbackCandidates(beats, envelope);
  const selected = selectBestMouthSequence(usablePools, { maxBeats: Math.min(6, beats.length) });
  const selectedTexts = selected.cuts.map((cut) => clean(cut.text));
  const sequence = makeSequence(selected, beats, subject);

  const attention = editAttentionSequence({
    beats: selected.cuts.map((cut, index) => ({
      order: index + 1,
      role: beats[index]?.role,
      gainKind: beats[index]?.gainKind,
      text: cut.text,
      sourceIds: beats[index]?.eventIds,
      attentionFunction: beats[index]?.attentionFunction,
      next: beats[index]?.next,
      frontier: beats[index]?.frontier,
      setsUp: [],
      paysOff: index === selected.cuts.length - 1 ? [movie.payoff] : [],
    })),
    evidence: movie.evidence,
  });

  const arc = evaluateSequenceArc(
    selected.cuts.map((cut, index) => ({
      order: index + 1,
      role: beats[index]?.role,
      attentionFunction: beats[index]?.attentionFunction,
      creativeMove: beats[index]?.creativeMove,
      text: cut.text,
      change: beats[index]?.change,
      next: beats[index]?.next,
      frontier: beats[index]?.frontier,
      setsUp: [],
      paysOff: index === selected.cuts.length - 1 ? [movie.payoff] : [],
    })),
  );

  const complete = selectedTexts.length >= 3 &&
    selectedTexts.every(Boolean) &&
    sequence.cuts.every((cut) => cut.sourceIds.length > 0) &&
    attention.accepted &&
    arc.accepted;

  const score = metric((selected.score ?? 0) * 0.55 + attention.sequenceScore * 0.25 + arc.sequenceScore * 0.2);
  const brief: AuthorCreativeBrief = {
    angle: lens,
    engine: "source reality → grounded sequence → single Mouth realization → deterministic gates",
    question: movie.unresolvedQuestion,
    strongestImage: movie.evidence[0] ?? "",
    tension: "novelty → contrast → consequence → payoff",
    payoff: movie.payoff,
    callback: "none",
    rhythm: ["hit", "standard", "hit", "short"],
    avoid: ["fact parade", "invented events", "planner vocabulary", "summary prose"],
  };

  return {
    scenes: selected.cuts.map((cut, index) => ({
      text: clean(cut.text),
      kind: index === 0 ? "hook" : index === selected.cuts.length - 1 ? "payoff" : "line",
    })),
    sequence,
    movie,
    brief,
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
