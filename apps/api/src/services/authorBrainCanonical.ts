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

function lensFrom(
  input: AuthorBrainTruth,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
): string {
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

function chooseMovie(
  input: AuthorBrainTruth,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
): LatentMovieCandidate | undefined {
  return input.movieMode === false ? undefined : cognition.selectedMovie;
}

function realizationAuthorityForBeat(
  movie: LatentMovieCandidate,
  step: LatentMovieTrajectoryStep,
): string {
  const thesis = movie.storyThesis;
  if (!thesis) return "";

  const semanticTurn = clean(thesis.semanticTurn);
  const relationKind = clean(thesis.relationKind);
  const beforeMeaning = unique(thesis.beforeMeaning ?? []);
  const afterMeaning = unique(thesis.afterMeaning ?? []);
  const payoffDependency = clean(thesis.payoffDependency);
  const observerExperience = thesis.observerExperience;
  const thesisEventIds = unique([
    ...(thesis.beforeEventIds ?? []),
    ...(thesis.afterEventIds ?? []),
  ]);
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
    lines.push(
      "CURRENT CUT PARTICIPATES IN THE APPROVED SEMANTIC TURN: realize the change in meaning rather than merely restating the source event.",
    );
  } else if (step.operation === "payoff") {
    lines.push(
      "CURRENT CUT IS THE APPROVED ENDPOINT: preserve the supplied endpoint and let earlier movement earn it.",
    );
  } else {
    lines.push(
      "CURRENT CUT IS SUPPORTING SEQUENCE MATERIAL: preserve the approved thesis as context without forcing this cut to perform the entire turn.",
    );
    if (observerExperience) {
      lines.push(
        `OBSERVER EXPERIENCE OBJECTIVE: ${observerExperience.objective}`,
        `OBSERVER SURPRISE: ${observerExperience.surprise}`,
        `OBSERVER CURIOSITY: ${observerExperience.curiosity}`,
        `OBSERVER ATTENTION: ${observerExperience.attention.join(" -> ")}`,
        `OBSERVER LANDING: ${observerExperience.landing}`,
        "OBSERVER RULE: cause discovery; do not explain the meaning.",
        ...(observerExperience.explanationForbidden
          ? [
              "EXPLANATION FORBIDDEN: do not state the thesis, significance, relationship, lesson, or conclusion.",
            ]
          : []),
      );
    }
  }

  lines.push(
    "This authority changes language realization only. It never authorizes a new concrete event.",
  );
  return lines.join(" ");
}

function synthesizeGroupChange(
  movie: LatentMovieCandidate,
  group: readonly LatentMovieTrajectoryStep[],
  final: boolean,
): string {
  const changes = unique(group.map((step) => step.viewerChange));
  if (!changes.length) return "advances approved reality";
  if (changes.length === 1) return changes[0];

  const eventIds = unique(group.flatMap((step) => step.eventIds ?? []));
  const thesisEventIds = unique([
    ...(movie.storyThesis?.beforeEventIds ?? []),
    ...(movie.storyThesis?.afterEventIds ?? []),
  ]);

  if (movie.storyThesis?.semanticTurn && eventIds.some((id) => thesisEventIds.includes(id))) {
    return movie.storyThesis.semanticTurn;
  }

  const first = changes[0];
  const last = changes[changes.length - 1];
  if (final) {
    return `The approved changes converge on the supplied ending: ${last}`;
  }
  return `The approved evidence changes significance from ${first} to ${last}.`;
}

function composeTrajectoryBeats(
  movie: LatentMovieCandidate,
): MouthCandidateBeat[] {
  if (movie.id === "memory-material") {
    return unique(
      movie.trajectory.flatMap((step) => step.eventIds ?? []),
    ).map((eventId, index, ids) => ({
      order: index + 1,
      role: index === ids.length - 1 ? "payoff" : "material",
      attentionFunction:
        "Realize approved Living Memory detail with maximum specificity and minimum explanation.",
      eventIds: [eventId],
      change: "Make supplied material interesting without inventing an occurrence.",
      next: "",
      frontier: "",
      paysOff: index === ids.length - 1 ? [movie.payoff] : [],
      relationKinds: unique(movie.supportingRelationKinds),
      semanticRealization: movie.storyThesis?.semanticRealization,
      observerExperience: movie.storyThesis?.observerExperience,
    }));
  }

  const steps = [...movie.trajectory];
  if (steps.length <= 1) {
    return steps.map((step) => stepToBeat(movie, step, 0, 1));
  }

  const groups: LatentMovieTrajectoryStep[][] = [];
  const total = steps.length;
  let index = 0;

  while (index < total) {
    const group: LatentMovieTrajectoryStep[] = [steps[index]];
    const remaining = total - index;
    const maxGroupSize = remaining >= 8 ? 3 : remaining >= 4 ? 2 : 1;

    while (group.length < maxGroupSize && index + group.length < total - 1) {
      const current = group[group.length - 1];
      const next = steps[index + group.length];
      const sameOperation =
        Boolean(current?.operation) &&
        Boolean(next?.operation) &&
        current.operation === next.operation;
      const textSimilarity = overlap(
        words(clean(current?.viewerChange)),
        words(clean(next?.viewerChange)),
      );
      const contextual =
        next.operation === "reveal" ||
        next.operation === "establish" ||
        next.operation === "contrast" ||
        next.operation === "recur";
      const complementary =
        Boolean(current?.eventIds?.length) &&
        Boolean(next?.eventIds?.length) &&
        remaining >= 5;
      const nextIsEndpoint = index + group.length === total - 1;

      if (nextIsEndpoint) break;
      if (!(sameOperation || textSimilarity >= 0.34 || contextual || complementary)) break;
      group.push(next);
    }

    groups.push(group);
    index += group.length;
  }

  /*
   * Never compress a sequence into a single cut once there is enough
   * evidence for a filmic arc. Preserve at least hook / turn / landing.
   */
  if (groups.length < 3 && total >= 4) {
    const first = steps.slice(0, 1);
    const last = steps.slice(-1);
    const middle = steps.slice(1, -1);
    groups.length = 0;
    groups.push(first);
    if (middle.length) groups.push(middle);
    groups.push(last);
  }

  return groups.map((group, groupIndex) => {
    const final = groupIndex === groups.length - 1;
    const first = group[0];
    const last = group[group.length - 1];
    const eventIds = unique(group.flatMap((step) => step.eventIds ?? []));
    const canonicalAuthority = realizationAuthorityForBeat(movie, last);
    const change = synthesizeGroupChange(movie, group, final);

    return {
      order: groupIndex + 1,
      role: final ? "payoff" : groupIndex === 0 ? "establishing" : "reveal",
      attentionFunction: [
        clean(first?.viewerChange),
        canonicalAuthority,
        group.length > 1
          ? "This cut is a semantic synthesis of adjacent approved evidence. Realize their joint significance, not a list of source facts."
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      creativeMove:
        group.length > 1
          ? "synthesis"
          : clean(last?.operation) || undefined,
      eventIds,
      change,
      next: clean(last?.nextQuestion),
      frontier: clean(last?.nextQuestion),
      paysOff: final ? [movie.payoff] : [],
      relationKinds: unique([
        ...movie.supportingRelationKinds,
        ...group.flatMap((step) => (step.operation ? [step.operation] : [])),
      ]),
      semanticRealization: movie.storyThesis?.semanticRealization,
      observerExperience: movie.storyThesis?.observerExperience,
      obligations: [
        "All source event IDs in this cut remain approved evidence.",
        "Do not turn every source event into a separate sentence.",
        "Preserve source order while allowing adjacent evidence to share one dramatic function.",
        ...(group.length > 1
          ? [
              "The realization must express what the grouped evidence means together; do not merely concatenate or enumerate the source details.",
            ]
          : []),
        ...(final
          ? [
              "The final cut must preserve the source-derived endpoint and must not append earlier evidence to the endpoint line.",
            ]
          : []),
      ],
    };
  });
}

function stepToBeat(
  movie: LatentMovieCandidate,
  step: LatentMovieTrajectoryStep,
  index: number,
  total: number,
): MouthCandidateBeat {
  const canonicalAuthority = realizationAuthorityForBeat(movie, step);
  const final = index === total - 1;
  return {
    order: index + 1,
    role: final ? "payoff" : index === 0 ? "establishing" : "reveal",
    attentionFunction: [clean(step.viewerChange), canonicalAuthority].filter(Boolean).join(" "),
    eventIds: unique(step.eventIds),
    change:
      movie.storyThesis?.semanticTurn &&
      step.eventIds.some(
        (id) =>
          movie.storyThesis?.beforeEventIds?.includes(id) ||
          movie.storyThesis?.afterEventIds?.includes(id),
      )
        ? movie.storyThesis.semanticTurn
        : clean(step.viewerChange),
    next: clean(step.nextQuestion),
    frontier: clean(step.nextQuestion),
    paysOff: final ? [movie.payoff] : [],
    relationKinds: unique(movie.supportingRelationKinds),
    semanticRealization: movie.storyThesis?.semanticRealization,
    observerExperience: movie.storyThesis?.observerExperience,
  };
}

function gainKindForBeat(
  beat: MouthCandidateBeat | undefined,
  index: number,
  total: number,
): string {
  const role = clean(beat?.role).toLowerCase();
  const attention = clean(beat?.attentionFunction).toLowerCase();
  if (index === 0 || role === "establishing" || role === "arrival") return "new_fact";
  if (index === total - 1 || role === "payoff" || role === "release") return "payoff";
  if (attention.includes("recontext") || attention.includes("contrast")) return "reframe";
  if (attention.includes("escalat")) return "escalation";
  if (attention.includes("question")) return "question";
  if (attention.includes("consequence")) return "consequence";
  return "discovery";
}

function viewerState(
  known: readonly string[],
  expected: string | undefined,
  unresolved: string | undefined,
  currentWant: string | undefined,
  recentChange: string | undefined,
): ViewerState {
  return {
    known: [...new Set(known.filter(Boolean))],
    expected,
    unresolved,
    currentWant,
    recentChange,
  };
}

function makeSequence(
  selected: ReturnType<typeof selectBestMouthSequence>,
  beats: MouthCandidateBeat[],
  subject: string,
  movie: LatentMovieCandidate,
): SequencePlay {
  let momentum = initialMomentum(subject, []);
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

    established = true;

    const nextKnown = unique([
      ...momentum.known,
      clean(candidate.text),
    ]);
    transition.after.known = nextKnown;
    if (transition.after.informationFrontier) {
      transition.after.informationFrontier.known = nextKnown;
    }

    const before = viewerState(
      momentum.known,
      momentum.expected,
      momentum.unresolved,
      momentum.currentWant,
      momentum.predictionShift,
    );
    const after = viewerState(
      transition.after.known,
      transition.after.expected,
      transition.after.unresolved,
      transition.after.currentWant,
      transition.after.predictionShift,
    );

    cuts.push({
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role: (beat?.role ?? "discovery") as ViewerAttentionRole,
      gainKind: gainKind as SequenceCut["gainKind"],
      sourceIds: unique(beat?.eventIds ?? []),
      informationGain: clean(candidate.text),
      attentionDelta:
        transition.after.magnet?.attention?.toString() ||
        transition.nextPressure ||
        clean(candidate.text),
      viewerBefore: before,
      viewerAfter: after,
      momentum: transition,
      necessity: transition.necessity,
      nextPromise: transition.nextPressure,
      noveltyScore: transition.after.magnet?.novelty,
      payoffConnection:
        index === selected.candidates.length - 1
          ? clean(movie.payoff)
          : undefined,
      confidence: metric(candidate.score),
    });

    momentum = transition.after;
  });

  return {
    subject,
    premise: cuts[0]?.informationGain ?? movie.unresolvedQuestion ?? "",
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: [],
    openingMomentum: cuts[0]?.momentum?.before,
    cuts,
    closingMomentum: momentum,
    closingState: cuts.length
      ? cuts[cuts.length - 1].viewerAfter
      : undefined,
    continuity: [
      "The subject remains active without requiring repeated naming.",
      "Known reality is not treated as new attention unless its significance changes.",
    ],
    antiCrutch: [
      "Do not use explanation as a substitute for discovery.",
      "Do not spend cuts repeating already-known evidence.",
      "Do not convert supplied concrete nouns into different concrete nouns.",
    ],
    continuation: cuts.length
      ? "The world can continue with another approved change or return."
      : undefined,
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

export async function authorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<CanonicalAuthorResult> {
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
      sequence: {
        subject,
        premise: "",
        openingState: { known: [] },
        cuts: [],
      },
      movie,
      realizationMode,
      brief: {
        angle: lens,
        engine: `source reality → ${realizationMode} → canonical movie → adaptive composition → universal sequence intelligence → Mouth`,
        question: "What supplied change should land next?",
        strongestImage:
          graph.events.find((event) => !looksLikeIdentityAssertion(event.label))?.label ?? "",
        tension: "novelty → uncertainty → significance → payoff",
        payoff: movie?.payoff ?? "",
        callback: "none",
        rhythm: ["hit", "standard", "hit", "short"],
        avoid: ["fact parade", "invented events", "planner prose"],
      },
      diagnostics: {
        model:
          process.env.QRE_AUTHOR_FAST_MODEL ||
          process.env.QRE_LOCAL_MODEL ||
          "unknown",
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
  const composedBeats = composeTrajectoryBeats(movie);
  const beats = composedBeats.map((beat, index, allBeats) => ({
    ...beat,
    viewerState: deriveViewerStateCut(beat, index, allBeats, envelope),
  }));

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
    lens,
    domainContext: input.domainContext,
  });

  let modelName =
    process.env.QRE_AUTHOR_FAST_MODEL ||
    process.env.QRE_LOCAL_MODEL ||
    "unknown";
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
                variants: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 3,
                },
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
        candidates: (
          parsed.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? []
        )
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
    const hasAuthorizedCandidate =
      generatedPool?.candidates.some(isAuthorizedMouthCandidate) ?? false;

    if (generatedPool && hasAuthorizedCandidate) return generatedPool;

    recoveryUsed = true;
    const source = beat.eventIds
      ?.map((id) => clean(envelope.events.find((event) => event.id === id)?.label))
      .find(Boolean);

    return {
      order: beat.order,
      viewerState: beat.viewerState,
      nextPromise: clean(beat.next),
      frontier: clean(beat.frontier),
      candidates: source
        ? [scoreMouthCandidate({ text: source, beat, envelope })]
        : [],
    };
  });

  const selected = selectBestMouthSequence(usablePools, {
    width: 12,
    candidatesPerBeat: 8,
  });

  const sequence = makeSequence(selected, beats, subject, movie);

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
      paysOff:
        index === selected.candidates.length - 1 ? [movie.payoff] : [],
    })),
    evidence: movie.evidence,
  });

  const arc =
    selected.candidates.length >= 3
      ? evaluateSequenceArc(
          selected.candidates.map((candidate, index) => ({
            order: index + 1,
            role: beats[index]?.role,
            attentionFunction: beats[index]?.attentionFunction,
            creativeMove: beats[index]?.creativeMove,
            text: candidate.text,
            change: beats[index]?.change,
            next: beats[index]?.next,
            frontier: beats[index]?.frontier,
            setsUp: [],
            paysOff:
              index === selected.candidates.length - 1 ? [movie.payoff] : [],
          })),
        )
      : { accepted: true };

  const scenes: AuthorScene[] = selected.candidates.map((candidate, index) => ({
    text: clean(candidate.text),
    kind: (
      index === selected.candidates.length - 1
        ? "payoff"
        : index === 0
          ? "hook"
          : "turn"
    ) as AuthorScene["kind"],
  }));

  const minimumCuts = realizationMode === "sequence-film" ? 3 : 1;
  const sequenceSourcesComplete = sequence.cuts.every((cut) => cut.sourceIds.length > 0);
  const complete =
    scenes.length >= minimumCuts &&
    scenes.length === sequence.cuts.length &&
    sequenceSourcesComplete &&
    attention.accepted === true &&
    arc.accepted === true;

  if (process.env.QRE_AUTHOR_DEBUG_MOVIE === "true") {
    console.log("\n--- QRE AUTHOR COMPLETENESS ---");
    console.log(`minimumCuts=${minimumCuts}`);
    console.log(`sceneCount=${scenes.length}`);
    console.log(`sequenceCutCount=${sequence.cuts.length}`);
    console.log(`sequenceSourcesComplete=${sequenceSourcesComplete}`);
    console.log(`attentionAccepted=${attention.accepted}`);
    console.log(`arcAccepted=${arc.accepted}`);
    console.log(`complete=${complete}`);
    console.log("--- END QRE AUTHOR COMPLETENESS ---\n");
  }

  return {
    scenes,
    sequence,
    movie,
    realizationMode,
    brief: {
      angle: lens,
      engine:
        `source reality → ${realizationMode} → canonical movie → adaptive composition → universal sequence intelligence → Mouth realization → validation`,
      question: movie.unresolvedQuestion,
      strongestImage: movie.evidence[0] ?? "",
      tension: movie.storyThesis?.semanticTurn
        ? "semantic turn → realization → consequence → payoff"
        : "novelty → uncertainty → significance → payoff",
      payoff: movie.payoff,
      callback: "none",
      rhythm: selected.candidates.map((candidate) => {
        const count = clean(candidate.text).split(/\s+/).filter(Boolean).length;
        return count <= 7 ? "short" : count <= 20 ? "standard" : "long";
      }),
      avoid: ["invented event", "unsupported bridge", "generic summary"],
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

function beatAt(
  beats: MouthCandidateBeat[],
  index: number,
): MouthCandidateBeat | undefined {
  return beats[index];
}
