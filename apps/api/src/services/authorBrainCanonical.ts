/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * truth → reality graph → cognition → latent movie → beat discovery
 * → universal viewer momentum → Mouth → sequence validation
 *
 * One Author. One movie authority. One realization path.
 */
import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  MouthCandidatePool,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { deriveViewerStateCut } from "./authorMouthCandidateSearch.js";
import {
  classifyAuthorRealizationMode,
  type AuthorRealizationMode,
} from "./authorRealizationMode.js";
import {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
  type MouthCandidateBeat,
} from "./authorMouthCandidateSearchCanonical.js";
import { editAttentionSequence } from "./authorAttentionEditor.js";
import { evaluateSequenceArc } from "./authorSequenceArcGate.js";
import { localModelGenerate } from "./localModelRuntime.js";
import {
  isAuthorizedMouthCandidate,
  selectBestMouthSequence,
} from "./authorMouthSequenceBeamSearch.js";
import {
  buildSequenceTransition,
  initialMomentum,
} from "./authorSequenceIntelligence.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly unknown[] = []): string[] => [...new Set(values.map(clean).filter(Boolean))];

function looksLikeIdentityAssertion(text: string): boolean {
  return /^(?:\w+\s+)?(?:is|are|was|were)\s+(?:a|an|the)\b/i.test(clean(text).toLowerCase());
}

function lensFrom(input: AuthorBrainTruth, cognition: ReturnType<typeof buildAuthorCognitivePlan>): string {
  return clean(input.lens) || clean(cognition.selectedFrame) || "NONE";
}

function buildCognition(
  input: AuthorBrainTruth,
  graph: ReturnType<typeof buildAuthorRealityGraph>,
): ReturnType<typeof buildAuthorCognitivePlan> {
  return buildAuthorCognitivePlan({
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject: clean(input.subject),
    place: clean(input.place),
    facts: unique(input.facts),
    sourceMoments: unique(input.sourceMoments),
    realityGraph: graph,
    memoryContext: input.memoryContext ?? [],
    domainContext: input.domainContext,
    priorScenes: input.trajectory ?? [],
    priorStrategies: input.creativeLearningContext ?? [],
    movieMode: input.movieMode,
  });
}

function chooseMovie(input: AuthorBrainTruth, cognition: ReturnType<typeof buildAuthorCognitivePlan>): LatentMovieCandidate | undefined {
  return input.movieMode === false ? undefined : cognition.selectedMovie;
}

function realizationAuthorityForBeat(movie: LatentMovieCandidate, step: LatentMovieTrajectoryStep): string {
  const thesis = movie.storyThesis;
  if (!thesis) return "";
  const semanticTurn = clean(thesis.semanticTurn);
  const relationKind = clean(thesis.relationKind);
  const beforeMeaning = unique(thesis.beforeMeaning ?? []);
  const afterMeaning = unique(thesis.afterMeaning ?? []);
  const payoffDependency = clean(thesis.payoffDependency);
  const observerExperience = thesis.observerExperience;
  const thesisEventIds = unique([...(thesis.beforeEventIds ?? []), ...(thesis.afterEventIds ?? [])]);
  const touchesThesis = step.eventIds.some((id) => thesisEventIds.includes(id));

  if (!semanticTurn) {
    return [
      "CANONICAL SEMANTIC THESIS: none.",
      "This supplied sequence is presentation structure, not a graph-backed semantic turn.",
      "Realize the supplied material without inventing a relationship the graph does not establish.",
    ].join(" ");
  }

  const lines = [`CANONICAL SEMANTIC TURN: ${semanticTurn}`];
  if (relationKind) lines.push(`CANONICAL RELATION: ${relationKind}`);
  if (beforeMeaning.length) lines.push(`CANONICAL BEFORE: ${beforeMeaning.join(" | ")}`);
  if (afterMeaning.length) lines.push(`CANONICAL AFTER: ${afterMeaning.join(" | ")}`);
  if (payoffDependency) lines.push(`CANONICAL PAYOFF DEPENDENCY: ${payoffDependency}`);

  if (touchesThesis) {
    lines.push("CURRENT CUT PARTICIPATES IN THE APPROVED SEMANTIC TURN: realize the change in meaning rather than merely restating the source event.");
  } else if (step.operation === "payoff") {
    lines.push("CURRENT CUT IS THE APPROVED ENDPOINT: preserve the supplied endpoint and let earlier movement earn it.");
  } else {
    lines.push("CURRENT CUT IS SUPPORTING SEQUENCE MATERIAL: preserve the approved thesis as context without forcing this cut to perform the entire turn.");
    if (observerExperience) {
      lines.push(
        `OBSERVER EXPERIENCE OBJECTIVE: ${observerExperience.objective}`,
        `OBSERVER SURPRISE: ${observerExperience.surprise}`,
        `OBSERVER CURIOSITY: ${observerExperience.curiosity}`,
        `OBSERVER ATTENTION: ${observerExperience.attention.join(" -> ")}`,
        `OBSERVER LANDING: ${observerExperience.landing}`,
        "OBSERVER RULE: cause discovery; do not explain the meaning.",
        ...(observerExperience.explanationForbidden ? ["EXPLANATION FORBIDDEN: do not state the thesis, significance, relationship, lesson, or conclusion."] : []),
      );
    }
  }
  lines.push("This authority changes language realization only. It never authorizes a new concrete event.");
  return lines.join(" ");
}

function mouthBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  if (movie.id === "memory-material") {
    return unique(movie.trajectory.flatMap((step) => step.eventIds ?? [])).map((eventId, index) => ({
      order: index + 1,
      role: "material",
      attentionFunction: "Realize one supplied Living Memory detail or a grounded relationship among supplied details.",
      eventIds: [eventId],
      change: "Make this supplied material interesting without turning it into an invented occurrence.",
      next: "",
      frontier: "",
      paysOff: [],
      relationKinds: [],
      observerExperience: movie.storyThesis?.observerExperience,
    }));
  }

  return movie.trajectory.map((step, index) => {
    const canonicalAuthority = realizationAuthorityForBeat(movie, step);
    const baseAttention = clean(step.viewerChange);
    const change = canonicalAuthority && movie.storyThesis?.semanticTurn && step.eventIds.some(
      (id) => movie.storyThesis?.beforeEventIds?.includes(id) || movie.storyThesis?.afterEventIds?.includes(id),
    ) ? movie.storyThesis.semanticTurn : baseAttention;

    return {
      order: index + 1,
      role: index === 0 ? "establishing" : index === movie.trajectory.length - 1 ? "payoff" : "reveal",
      attentionFunction: [baseAttention, canonicalAuthority].filter(Boolean).join(" "),
      eventIds: unique(step.eventIds),
      change,
      next: clean(step.nextQuestion),
      frontier: clean(step.nextQuestion),
      paysOff: index === movie.trajectory.length - 1 ? [movie.payoff] : [],
      relationKinds: unique(movie.supportingRelationKinds),
      observerExperience: movie.storyThesis?.observerExperience,
    };
  });
}

function gainKindForBeat(beat: MouthCandidateBeat, index: number, total: number): string {
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();
  if (index === 0 || role === "establishing" || role === "arrival") return "new_fact";
  if (index === total - 1 || role === "payoff" || role === "release") return "payoff";
  if (role === "reveal" || attention.includes("recontext") || attention.includes("contrast")) return "reframe";
  if (attention.includes("escalat")) return "escalation";
  if (attention.includes("question")) return "question";
  if (attention.includes("consequence")) return "consequence";
  return "discovery";
}

function makeSequence(
  selected: ReturnType<typeof selectBestMouthSequence>,
  beats: MouthCandidateBeat[],
  subject: string,
  movie: LatentMovieCandidate,
  baselineFacts: string[],
): SequencePlay {
  let momentum = initialMomentum(subject, baselineFacts);
  let established = false;
  const cuts: SequenceCut[] = [];

  selected.candidates.forEach((candidate, index) => {
    const beat = beats[index];
    const change = clean(beat?.change) || clean(candidate.text);
    const next = clean(beat?.next || beat?.frontier);
    const gainKind = gainKindForBeat(beat, index, selected.candidates.length);
    const transition = buildSequenceTransition(
      momentum,
      change,
      next,
      gainKind,
      subject,
      established,
      index + 1,
      clean(beat?.change) || "advances approved reality",
    );

    established = established || Boolean(subject);
    const viewerBefore: ViewerState = {
      known: momentum.known,
      expected: momentum.expected,
      unresolved: momentum.unresolved,
      currentWant: momentum.currentWant,
      recentChange: momentum.predictionShift,
    };
    const viewerAfter: ViewerState = {
      known: transition.after.known,
      expected: transition.after.expected,
      unresolved: transition.after.unresolved,
      currentWant: transition.after.currentWant,
      recentChange: transition.after.predictionShift,
    };

    cuts.push({
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: (beat?.role ?? "discovery") as ViewerAttentionRole,
      gainKind: gainKind as SequenceCut["gainKind"],
      sourceIds: unique(beat?.eventIds ?? []),
      informationGain: clean(candidate.text),
      attentionDelta: transition.nextPressure || clean(beat?.change) || clean(candidate.text),
      viewerBefore,
      viewerAfter,
      momentum: transition,
      necessity: transition.after.magnet
        ? transition.after.magnet.magnetStrength >= 0.36 || index === selected.candidates.length - 1
          ? transition.after.magnet.magnetStrength >= 0.36 || index === selected.candidates.length - 1
          ? transition.after.magnet.magnetStrength >= 0.36 || index === selected.candidates.length - 1
          ? transition.after.magnet.magnetStrength >= 0.36 || index === selected.candidates.length - 1
          : false : false : false : false : false,
      nextPromise: transition.nextPressure,
      noveltyScore: transition.after.magnet?.novelty,
      payoffConnection: index === selected.candidates.length - 1 ? clean(movie.payoff) : undefined,
      confidence: metric(candidate.score),
    });

    const current = cuts[cuts.length - 1];
    current.necessity = transition.after.magnet
      ? {
          necessary: index === selected.candidates.length - 1 || transition.after.magnet.magnetStrength >= 0.36,
          reason: clean(beat?.change) || "advances approved reality",
          removalDamage: transition.after.magnet.nextNeed
            ? `Weakens the next unresolved need: ${transition.after.magnet.nextNeed}`
            : `Removes the current change: ${change}`,
        }
      : {
          necessary: index === selected.candidates.length - 1,
          reason: clean(beat?.change) || "advances approved reality",
        };

    momentum = transition.after;
  });

  return {
    subject,
    premise: cuts[0]?.informationGain ?? movie.unresolvedQuestion ?? "",
    openingState: cuts[0]?.viewerBefore ?? { known: baselineFacts },
    baselineFacts,
    openingMomentum: cuts[0]?.momentum?.before,
    cuts,
    closingMomentum: momentum,
    closingState: cuts.length ? cuts[cuts.length - 1].viewerAfter : undefined,
    continuity: [
      "The subject remains active across the sequence without requiring repeated naming.",
      "Known reality is not re-counted as new attention unless its significance changes.",
    ],
    antiCrutch: [
      "Do not use explanation as a substitute for discovery.",
      "Do not spend cuts repeating already-known evidence.",
    ],
    continuation: cuts.length ? "The world can continue with another approved change or return." : undefined,
  };
}

export type CanonicalAuthorResult = {
  scenes: AuthorScene[];
  sequence: SequencePlay;
  movie?: LatentMovieCandidate;
  realizationMode: AuthorRealizationMode;
  brief: AuthorCreativeBrief;
  diagnostics: {
    model: string;
    modelCalls: number;
    candidateSequences: number;
    acceptedCandidates: number;
    recoveryUsed: boolean;
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
    memoryContext: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
  });
  const cognition = buildCognition({ ...input, facts, sourceMoments }, graph);
  const realizationMode = classifyAuthorRealizationMode({
    prompt: clean(input.prompt),
    facts,
    sourceMoments,
    relationKinds: graph.relations.map((relation) => relation.kind),
    movieMode: input.movieMode,
  });
  const lens = lensFrom(input, cognition);
  const movie = chooseMovie(input, cognition);

  if (!movie || movie.trajectory.length < 1) {
    return {
      scenes: [],
      sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
      movie,
      realizationMode,
      brief: {
        angle: lens,
        engine: `source reality → ${realizationMode} → canonical movie → universal sequence intelligence → Mouth`,
        question: "What supplied change should land next?",
        strongestImage: graph.events.find((event) => !looksLikeIdentityAssertion(event.label))?.label ?? "",
        tension: "novelty → uncertainty → significance → payoff",
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
        recoveryUsed: false,
        qualityStatus: "REJECTED",
        renderable: false,
        complete: false,
        selectedScore: 0,
        rejectedCandidates: [{ reason: "no-supplied-sequence-material" }],
      },
    };
  }

  const envelope = buildAuthorRealityEnvelope({ graph, subject });
  const beats = mouthBeats(movie).map((beat, index, allBeats) => ({
    ...beat,
    viewerState: deriveViewerStateCut(beat, index, allBeats, envelope),
  }));

  const messages = buildMouthCandidateMessages({
    envelope,
    beats,
    lens,
    domainContext: input.domainContext,
  });

  let modelName = process.env.QRE_AUTHOR_FAST_MODEL || process.env.QRE_LOCAL_MODEL || "unknown";
  let modelCalls = 0;
  let pools: MouthCandidatePool[] = [];

  try {
    const generated = await localModelGenerate(messages, "json", {
      numPredict: 2048,
      temperature: 0.7,
      jsonSchema: {
        type: "object",
        properties: {
          variantsByBeat: {
            type: "array",
            items: {
              type: "object",
              properties: {
                order: { type: "integer" },
                variants: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
              },
              required: ["order", "variants"],
              additionalProperties: false,
            },
          },
        },
        required: ["variantsByBeat"],
        additionalProperties: false,
      },
    });
    modelCalls = 1;
    modelName = generated.model || modelName;
    const parsed = parseMouthCandidateBatch(generated.text);
    if (parsed) {
      pools = beats.map((beat) => ({
        order: beat.order,
        viewerState: beat.viewerState,
        nextPromise: clean(beat.next),
        frontier: clean(beat.frontier),
        candidates: (parsed.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [])
          .map((text) => scoreMouthCandidate({ text, beat, envelope }))
          .filter((candidate) => candidate.text.length > 0),
      }));
    }
  } catch {
    modelCalls = 1;
  }

  let recoveryUsed = false;
  const usablePools = beats.map((beat) => {
    const generatedPool = pools.find((pool) => pool.order === beat.order);
    if (generatedPool && generatedPool.candidates.some(isAuthorizedMouthCandidate)) return generatedPool;
    recoveryUsed = true;
    const source = beat.eventIds?.map((id) => clean(envelope.events.find((event) => event.id === id)?.label)).find(Boolean);
    return {
      order: beat.order,
      viewerState: beat.viewerState,
      nextPromise: clean(beat.next),
      frontier: clean(beat.frontier),
      candidates: source ? [scoreMouthCandidate({ text: source, beat, envelope })] : [],
    };
  });

  const selected = selectBestMouthSequence(usablePools, { width: 12, candidatesPerBeat: 8 });
  const baselineFacts = facts.slice(0, 16);
  const sequence = makeSequence(selected, beats, subject, movie, baselineFacts);

  const attention = editAttentionSequence({
    beats: selected.candidates.map((candidate, index) => ({
      order: index + 1,
      role: beats[index]?.role,
      gainKind: index === 0 ? "baseline" : index === selected.candidates.length - 1 ? "payoff" : "new_fact",
      text: candidate.text,
      sourceIds: [...(beats[index]?.eventIds ?? [])],
      attentionFunction: beats[index]?.attentionFunction,
      next: beats[index]?.next,
      frontier: beats[index]?.frontier,
      setsUp: [],
      paysOff: index === selected.candidates.length - 1 ? [movie.payoff] : [],
    })),
    evidence: movie.evidence,
  });

  const arc = selected.candidates.length >= 3
    ? evaluateSequenceArc(selected.candidates.map((candidate, index) => ({
        order: index + 1,
        role: beats[index]?.role,
        attentionFunction: beats[index]?.attentionFunction,
        creativeMove: beats[index]?.creativeMove,
        text: candidate.text,
        change: beats[index]?.change,
        next: beats[index]?.next,
        frontier: beats[index]?.frontier,
        setsUp: [],
        paysOff: index === selected.candidates.length - 1 ? [movie.payoff] : [],
      })))
    : { accepted: true };

  const scenes: AuthorScene[] = selected.candidates.map((candidate, index) => ({
    text: clean(candidate.text),
    kind: (index === selected.candidates.length - 1 ? "payoff" : index === 0 ? "hook" : "turn") as AuthorScene["kind"],
  }));

  const minimumCuts = realizationMode === "sequence-film" ? 3 : 1;
  const sequenceSourcesComplete = sequence.cuts.every((cut) => cut.sourceIds.length > 0);
  const complete = scenes.length >= minimumCuts &&
    scenes.length === sequence.cuts.length &&
    sequenceSourcesComplete &&
    attention.accepted === true &&
    arc.accepted === true;

  return {
    scenes,
    sequence,
    movie,
    realizationMode,
    brief: {
      angle: lens,
      engine: `source reality → ${realizationMode} → canonical movie → universal viewer momentum → Mouth realization → sequence selection → validation`,
      question: movie.unresolvedQuestion,
      strongestImage: movie.evidence[0] ?? "",
      tension: movie.storyThesis?.semanticTurn ? "semantic turn → realization → consequence → payoff" : "novelty → uncertainty → information value → payoff",
      payoff: movie.payoff,
      callback: "none",
      rhythm: selected.candidates.map((candidate) => {
        const count = clean(candidate.text).split(/\s+/).filter(Boolean).length;
        return count <= 7 ? "short" : count <= 20 ? "standard" : "long";
      }),
      avoid: ["invented event", "unsupported bridge", "generic summary", "repeated known facts"],
    },
    diagnostics: {
      model: modelName,
      modelCalls,
      candidateSequences: 1,
      acceptedCandidates: selected.candidates.length,
      recoveryUsed,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: selected.score,
      rejectedCandidates: [],
    },
  };
}
