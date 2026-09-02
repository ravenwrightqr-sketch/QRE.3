/**
 * QRE UNIVERSAL AUTHOR BRAIN · CANONICAL
 *
 * truth → reality graph → cognition → latent movie → adaptive composition
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
  ViewerStateCut,
} from "@qre/contracts";

import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";
import { deriveViewerStateCut } from "./authorViewerStateCut.js";
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

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3),
  );

const unique = (values: readonly unknown[] = []): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const words = (value: string): Set<string> =>
  new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 4),
  );

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }
  return hits / Math.max(a.size, b.size);
}

function looksLikeIdentityAssertion(text: string): boolean {
  return /^(?:\w+\s+)?(?:is|are|was|were)\s+(?:a|an|the)\b/i.test(
    clean(text),
  );
}

function looksLikeGenericPlannerText(text: string): boolean {
  return /\b(?:the viewer|the audience|the author|cognition|planner|candidate|trajectory|sequence|objective|attention function|curiosity pressure|state shift)\b/i.test(
    clean(text),
  );
}

function sourceEventIdsForStep(step: LatentMovieTrajectoryStep): string[] {
  return unique(step.eventIds ?? []);
}

function sourceLabelsForStep(
  step: LatentMovieTrajectoryStep,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): string[] {
  return unique(
    sourceEventIdsForStep(step).map(
      (eventId) => envelope.events.find((event) => event.id === eventId)?.label,
    ),
  );
}

function composeTrajectoryBeats(movie: LatentMovieCandidate): MouthCandidateBeat[] {
  return movie.trajectory.map((step, index, trajectory) => ({
    order: index + 1,
    role: step.role,
    change: clean(step.change),
    next: clean(step.next),
    frontier: clean(step.frontier),
    attentionFunction: clean(step.attentionFunction),
    creativeMove: clean(step.creativeMove),
    realizationMode: clean(step.realizationMode),
    subject: clean(step.subject),
    eventIds: sourceEventIdsForStep(step),
    relationKinds: unique(step.relationKinds ?? []),
    sourceLabels: [],
    paysOff: index === trajectory.length - 1 ? [clean(movie.payoff)] : [],
    terminal: index === trajectory.length - 1,
    viewerState: deriveViewerStateCut(
      {
        order: index + 1,
        role: step.role,
        change: clean(step.change),
        next: clean(step.next),
        frontier: clean(step.frontier),
        attentionFunction: clean(step.attentionFunction),
        creativeMove: clean(step.creativeMove),
        realizationMode: clean(step.realizationMode),
        subject: clean(step.subject),
        eventIds: sourceEventIdsForStep(step),
        relationKinds: unique(step.relationKinds ?? []),
        sourceLabels: [],
        paysOff: index === trajectory.length - 1 ? [clean(movie.payoff)] : [],
        terminal: index === trajectory.length - 1,
        viewerState: {
          beforeState: "",
          afterState: "",
          attentionMove: "orient",
          curiosityPressure: 0,
          contrast: 0,
          interruption: 0,
          accumulation: 0,
          tempo: 0,
          payoffPressure: 0,
          stateShift: 0,
          predictionError: 0,
          evidenceEventIds: sourceEventIdsForStep(step),
        },
      },
      index,
      trajectory.map((item, itemIndex) => ({
        order: itemIndex + 1,
        role: item.role,
        change: clean(item.change),
        next: clean(item.next),
        frontier: clean(item.frontier),
        attentionFunction: clean(item.attentionFunction),
        creativeMove: clean(item.creativeMove),
        realizationMode: clean(item.realizationMode),
        subject: clean(item.subject),
        eventIds: sourceEventIdsForStep(item),
        relationKinds: unique(item.relationKinds ?? []),
        sourceLabels: [],
        paysOff: itemIndex === trajectory.length - 1 ? [clean(movie.payoff)] : [],
        terminal: itemIndex === trajectory.length - 1,
        viewerState: {
          beforeState: "",
          afterState: "",
          attentionMove: "orient",
          curiosityPressure: 0,
          contrast: 0,
          interruption: 0,
          accumulation: 0,
          tempo: 0,
          payoffPressure: 0,
          stateShift: 0,
          predictionError: 0,
          evidenceEventIds: sourceEventIdsForStep(item),
        },
      })),
      buildAuthorRealityEnvelope,
    ),
  }));
}

export type AuthorBrainCanonicalResult = {
  truth: AuthorBrainTruth;
  movie: LatentMovieCandidate | null;
  sequence: SequencePlay | null;
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
    rejectedCandidates: { reason: string }[];
  };
};

// The canonical implementation continues below; this declaration is replaced
// by the repository's generated implementation during normal builds.
export async function buildAuthorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<AuthorBrainCanonicalResult> {
  const graph = buildAuthorRealityGraph(input);
  const cognition = buildAuthorCognitivePlan({ ...input, realityGraph: graph });
  const movie = cognition.selectedMovie;
  if (!movie) {
    return {
      truth: { ...input, realityGraph: graph, cognitivePlan: cognition.plan },
      movie: null,
      sequence: null,
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

  const envelope = buildAuthorRealityEnvelope({ graph, subject: input.subject ?? "" });
  const composedBeats = composeTrajectoryBeats(movie);
  const beats: MouthCandidateBeat[] = composedBeats.map((beat, index, allBeats) => {
    const decision = cognition.readoutPlan[index];
    const experience = cognition.experienceObjective?.trajectory[index];
    const fallback = deriveViewerStateCut(beat, index, allBeats, envelope);
    if (!decision) return { ...beat, viewerState: fallback };

    const before = decision.experienceViewerBefore;
    const after = decision.experienceViewerAfter;
    const attentionMove: ViewerStateCut["attentionMove"] = decision.purpose === "establish"
      ? "orient"
      : decision.purpose === "payoff"
        ? "land"
        : decision.purpose === "recontextualize"
          ? "recontextualize"
          : experience?.curiosity
            ? "tighten"
            : "escalate";

    return {
      ...beat,
      change: experience?.desiredViewerChange || beat.change,
      next: decision.nextPressure || beat.next,
      frontier: decision.nextPressure || beat.frontier,
      attentionFunction: [
        beat.attentionFunction,
        experience ? `ADDITION=${experience.addition}` : "",
        experience ? `ATTENTION=${experience.attentionMovement}` : "",
        experience ? `CURIOSITY=${experience.curiosity}` : "",
      ].filter(Boolean).join(" "),
      viewerState: before && after
        ? {
            beforeState: decision.viewerStateBefore,
            afterState: decision.viewerStateAfter,
            attentionMove,
            curiosityPressure: experience?.curiosity ?? 0,
            contrast: experience?.attentionMovement ?? 0,
            interruption: experience?.attentionMovement ?? 0,
            accumulation: experience?.addition ?? 0,
            tempo: experience?.attentionMovement ?? 0,
            payoffPressure: decision.terminal ? 1 : experience?.curiosity ?? 0,
            stateShift: Math.max(experience?.addition ?? 0, experience?.attentionMovement ?? 0, experience?.curiosity ?? 0),
            predictionError: experience?.curiosity ?? 0,
            evidenceEventIds: [...decision.eventIds],
          }
        : fallback,
    };
  });

  if (process.env.QRE_AUTHOR_DEBUG_MOVIE === "true") {
    console.log("\n--- QRE AUTHOR COMPOSITION ---");
    console.log(`movieId=${movie.id}`);
    console.log(`trajectorySteps=${movie.trajectory.length}`);
    console.log(`composedCuts=${beats.length}`);
    beats.forEach((beat) => {
      console.log(
        `[${beat.order}] ${beat.role} | events=${(beat.eventIds ?? []).join(",")} | change=${clean(beat.change)} | next=${clean(beat.next)}`,
      );
    });
    console.log("--- END QRE AUTHOR COMPOSITION ---\n");
  }

  const messages = buildMouthCandidateMessages({
    envelope,
    beats,
    lens: input.lens,
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
  const usablePools: MouthCandidatePool[] = beats.map((beat) => {
    const generatedPool = pools.find((pool) => pool.order === beat.order);
    const hasAuthorizedCandidate = generatedPool?.candidates.some(isAuthorizedMouthCandidate) ?? false;
    if (generatedPool && hasAuthorizedCandidate) return generatedPool;

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
  const sequence = makeSequence(selected, beats, input.subject ?? "", movie);
  const attention = editAttentionSequence({
    beats: selected.candidates.map((candidate, index) => ({
      order: index + 1,
      role: beats[index]?.role,
      gainKind: gainKindForBeat(beatAt(beats, index), index, selected.candidates.length),
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
        text: candidate.text,
        sourceIds: [...(beats[index]?.eventIds ?? [])],
        gainKind: gainKindForBeat(beatAt(beats, index), index, selected.candidates.length),
        attentionFunction: beats[index]?.attentionFunction,
        next: beats[index]?.next,
        frontier: beats[index]?.frontier,
        setsUp: [],
        paysOff: index === selected.candidates.length - 1 ? [movie.payoff] : [],
      })))
    : { accepted: true, score: 1, reasons: ["single-cut-or-short-sequence"] };

  const score = metric(selected.score);
  const complete = selected.candidates.length > 0 && Boolean(movie.payoff);
  const qualityStatus = complete && attention.accepted && arc.accepted ? "ACCEPTED" : "REJECTED";

  return {
    truth: {
      ...input,
      realityGraph: graph,
      cognitivePlan: cognition.plan,
      trajectory: movie.trajectory.map((step) => clean(step.change)).filter(Boolean),
    },
    movie,
    sequence,
    diagnostics: {
      model: modelName,
      modelCalls,
      candidateSequences: pools.length,
      acceptedCandidates: selected.candidates.length,
      recoveryUsed,
      qualityStatus,
      renderable: complete,
      complete,
      selectedScore: score,
      rejectedCandidates: qualityStatus === "ACCEPTED" ? [] : [{ reason: "canonical-sequence-quality" }],
    },
  };
}

function beatAt(beats: readonly MouthCandidateBeat[], index: number): MouthCandidateBeat {
  return beats[Math.max(0, Math.min(beats.length - 1, index))]!;
}

function gainKindForBeat(beat: MouthCandidateBeat, index: number, length: number): string {
  if (beat.role === "payoff" || index === length - 1) return "payoff";
  if (beat.role === "establishing" || index === 0) return "establish";
  if (beat.viewerState?.attentionMove === "recontextualize") return "recontextualize";
  if (beat.viewerState?.attentionMove === "interrupt") return "interrupt";
  return "reveal";
}

function makeSequence(
  selected: ReturnType<typeof selectBestMouthSequence>,
  beats: readonly MouthCandidateBeat[],
  subject: string,
  movie: LatentMovieCandidate,
): SequencePlay {
  const cuts: SequenceCut[] = selected.candidates.map((candidate, index) => {
    const beat = beatAt(beats, index);
    return {
      order: index + 1,
      role: beat.role,
      text: candidate.text,
      subject,
      eventIds: [...(beat.eventIds ?? [])],
      evidence: [...candidate.evidence],
      attentionFunction: beat.attentionFunction,
      viewerState: beat.viewerState,
    };
  });
  return {
    id: `sequence-${movie.id}`,
    subject,
    cuts,
    payoff: movie.payoff,
    score: metric(selected.score),
  };
}
