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
  AuthorPlayoutMode,
  AuthorScene,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  MouthCandidate,
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
import { buildMouthRealizationAuthority } from "./authorMouthRealizationAuthority.js";
import { buildCreativeLensBrief } from "./authorCreativeLensBrief.js";
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

function playoutModeFor(
  input: AuthorBrainTruth,
): AuthorPlayoutMode {
  if (input.playoutMode) return input.playoutMode;
  return input.movieMode === false ? "operational" : "experience";
}

function lensFrom(
  input: AuthorBrainTruth,
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
): string {
  const requested = clean(input.lens);
  const explicit =
    requested &&
    requested.toLowerCase() !== "let qre decide"
      ? requested
      : "";

  return explicit || clean(cognition.selectedFrame) || "NONE";
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
    playoutMode: input.playoutMode,
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

function scopedSemanticRealization(
  movie: LatentMovieCandidate,
  eventIds: readonly string[],
): NonNullable<LatentMovieCandidate["storyThesis"]>["semanticRealization"] {
  const semantic = movie.storyThesis?.semanticRealization;
  if (!semantic) return undefined;

  const scope = new Set(unique(eventIds));
  const evidenceEventIds = unique(semantic.evidenceEventIds ?? []).filter((id) =>
    scope.has(id),
  );

  if (!evidenceEventIds.length) return undefined;

  const beforeEventIds = unique(semantic.beforeEventIds ?? []).filter((id) =>
    scope.has(id),
  );
  const afterEventIds = unique(semantic.afterEventIds ?? []).filter((id) =>
    scope.has(id),
  );
  const relation =
    semantic.relation &&
    scope.has(semantic.relation.fromEventId) &&
    scope.has(semantic.relation.toEventId)
      ? semantic.relation
      : undefined;

  return {
    ...semantic,
    evidenceEventIds,
    beforeEventIds,
    afterEventIds,
    relation,
  };
}

function synthesizeGroupChange(
  movie: LatentMovieCandidate,
  group: readonly LatentMovieTrajectoryStep[],
  final: boolean,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): string {
  const eventIds = unique(
    group.flatMap((step) => step.eventIds ?? []),
  );

  const suppliedLabels = unique(
    eventIds
      .map((id) =>
        clean(
          envelope.events.find(
            (event) => event.id === id,
          )?.label,
        ),
      )
      .filter(Boolean),
  );

  const thesisEventIds = unique([
    ...(movie.storyThesis?.beforeEventIds ?? []),
    ...(movie.storyThesis?.afterEventIds ?? []),
  ]);

  if (
    movie.storyThesis?.semanticTurn &&
    eventIds.some((id) => thesisEventIds.includes(id))
  ) {
    return movie.storyThesis.semanticTurn;
  }

  if (suppliedLabels.length) {
    return suppliedLabels.join(" / ");
  }

  const changes = unique(
    group
      .map((step) => clean(step.viewerChange))
      .filter(Boolean),
  );

  if (!changes.length) {
    return "approved supplied reality";
  }

  if (final) {
    return changes[changes.length - 1];
  }

  return changes.join(" / ");
}

function semanticEvidenceUnitGroups(
  movie: LatentMovieCandidate,
): LatentMovieTrajectoryStep[][] | undefined {
  const semantic = movie.storyThesis?.semanticRealization;
  if (!semantic) return undefined;

  const evidenceIds = unique(semantic.evidenceEventIds ?? []);
  if (evidenceIds.length < 2) return undefined;

  const evidence = new Set(evidenceIds);
  const relevantSteps = movie.trajectory.filter((step) =>
    step.eventIds.some((id) => evidence.has(id)),
  );
  if (!relevantSteps.length) return undefined;

  /*
   * The selected semantic realization, not parser granularity, owns the
   * minimum authored unit.
   *
   * Convergence / continuation are one perceptual recognition: separate
   * supplied details become meaningful together.
   *
   * Change / contrast / expectation / recurrence / consequence preserve a
   * before-vs-after viewer update when the semantic evidence provides one.
   */
  if (semantic.mechanism === "continuation") {
    return [relevantSteps];
  }

  if (semantic.mechanism === "convergence") {
    /*
     * Convergence is a viewer-recognition problem, not a batching problem.
     *
     * Do not hand Mouth a first cut containing several source facts: that
     * structurally invites a fact parade ("walks. bacon. small dogs.").
     *
     * Stage one grounded anchor first. Then give the landing beat the complete
     * approved evidence set so it can realize what the details mean together.
     * Evidence may therefore participate in more than one viewer-update beat;
     * concrete truth remains unchanged and provenance remains explicit.
     */
    if (relevantSteps.length === 1) {
      return [relevantSteps];
    }

    return [
      relevantSteps.slice(0, 1),
      relevantSteps,
    ];
  }

  const before = new Set(unique(semantic.beforeEventIds ?? []));
  const after = new Set(unique(semantic.afterEventIds ?? []));

  const beforeSteps = relevantSteps.filter((step) =>
    step.eventIds.some((id) => before.has(id)),
  );
  const afterSteps = relevantSteps.filter((step) =>
    step.eventIds.some((id) => after.has(id)),
  );

  if (beforeSteps.length && afterSteps.length) {
    const used = new Set([...beforeSteps, ...afterSteps]);
    const middle = relevantSteps.filter((step) => !used.has(step));

    return [
      [...beforeSteps, ...middle],
      afterSteps,
    ].filter((group) => group.length > 0);
  }

  return [relevantSteps];
}

function inferenceChangeForGroup(input: {
  semantic?: NonNullable<LatentMovieCandidate["storyThesis"]>["semanticRealization"];
  groupIndex: number;
  groupCount: number;
  fallback: string;
}): string {
  const semantic = input.semantic;
  if (!semantic) return clean(input.fallback);

  if (input.groupCount <= 1) {
    return (
      clean(
        semantic.viewerShift ||
        semantic.feltEffect ||
        semantic.languageAim,
      ) ||
      clean(input.fallback)
    );
  }

  if (input.groupIndex === 0) {
    return "Supplied evidence establishes a partial reading while leaving the larger relationship for the observer to infer.";
  }

  if (input.groupIndex === input.groupCount - 1) {
    return (
      clean(
        semantic.viewerShift ||
        semantic.feltEffect ||
        semantic.languageAim,
      ) ||
      "The final supplied evidence changes how the earlier evidence is understood and lets recognition land."
    );
  }

  return "New supplied evidence sharpens or recontextualizes the observer's current hypothesis without stating the conclusion.";
}

export function composeTrajectoryBeats(
  movie: LatentMovieCandidate,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): MouthCandidateBeat[] {
  const steps = [...movie.trajectory];
  if (!steps.length) return [];

  const semanticGroups = semanticEvidenceUnitGroups(movie);

  /*
   * A selected semantic relation is allowed to omit supplied material that
   * does not participate in the winning interpretation. Reality remains
   * persisted; visible playback follows meaning rather than fact count.
   */
  const groups: LatentMovieTrajectoryStep[][] =
    semanticGroups ??
    (() => {
      if (steps.length <= 1) return [steps];

      const result: LatentMovieTrajectoryStep[][] = [];
      let index = 0;

      while (index < steps.length) {
        const group: LatentMovieTrajectoryStep[] = [steps[index]!];
        const remaining = steps.length - index;
        const maxGroupSize =
          remaining >= 8 ? 3 :
          remaining >= 4 ? 2 :
          1;

        while (
          group.length < maxGroupSize &&
          index + group.length < steps.length
        ) {
          const current = group[group.length - 1];
          const next = steps[index + group.length];

          if (!current || !next) break;

          const sameOperation =
            current.operation === next.operation;
          const textSimilarity = overlap(
            words(clean(current.viewerChange)),
            words(clean(next.viewerChange)),
          );
          const contextual = [
            "reveal",
            "establish",
            "contrast",
            "recur",
          ].includes(next.operation);
          const complementary =
            Boolean(current.eventIds.length) &&
            Boolean(next.eventIds.length) &&
            remaining >= 5;

          if (
            !(
              sameOperation ||
              textSimilarity >= 0.34 ||
              contextual ||
              complementary
            )
          ) {
            break;
          }

          group.push(next);
        }

        result.push(group);
        index += group.length;
      }

      return result;
    })();

  return groups.map((group, groupIndex) => {
    const final = groupIndex === groups.length - 1;
    const first = group[0];
    const last = group[group.length - 1];
    const eventIds = unique(
      group.flatMap((step) => step.eventIds ?? []),
    );
    const semanticRealization =
      scopedSemanticRealization(movie, eventIds);
    const semanticUnit =
      Boolean(semanticRealization) &&
      (semanticRealization?.evidenceEventIds.length ?? 0) > 1;

    const fallbackChange =
      synthesizeGroupChange(
        movie,
        group,
        final,
        envelope,
      );

    const change = inferenceChangeForGroup({
      semantic: semanticRealization,
      groupIndex,
      groupCount: groups.length,
      fallback:
        clean(
          movie.storyThesis?.semanticTurn,
        ) ||
        fallbackChange,
    });

    const viewerObjective = semanticRealization
      ? [
          "Change the viewer's interpretation using the approved relationship.",
          "Never spend a cut saying what the observer can discover.",
          "Maximize meaningful inference space while maintaining grounding.",
          "Create productive ambiguity, not confusion.",
          "The viewer should infer the relationship before QRE explains it.",
        ]
      : [
          "Advance the viewer's understanding using only supplied reality.",
          "Do not spend a cut merely repeating already-known evidence.",
        ];

    return {
      order: groupIndex + 1,
      role:
        final
          ? "payoff"
          : groupIndex === 0
            ? "establishing"
            : "reveal",
      attentionFunction: [
        ...viewerObjective,
        clean(first?.viewerChange),
      ]
        .filter(Boolean)
        .join(" "),
      creativeMove: semanticUnit
        ? `semantic-${clean(semanticRealization?.mechanism)}`
        : group.length > 1
          ? "synthesis"
          : clean(last?.operation) || undefined,
      eventIds,
      change,
      next: clean(last?.nextQuestion),
      frontier: clean(last?.nextQuestion),
      paysOff: final ? [movie.payoff] : [],
      relationKinds: unique([
        ...movie.supportingRelationKinds,
        ...group.flatMap((step) =>
          step.operation ? [step.operation] : [],
        ),
        ...(semanticRealization?.mechanism
          ? [semanticRealization.mechanism]
          : []),
      ]),
      semanticRealization,
      observerExperience: semanticRealization
        ? movie.storyThesis?.observerExperience
        : undefined,
      obligations: [
        "All source event IDs in this cut remain approved evidence.",
        "Visible beat count follows the selected meaning, not parsed fact count.",
        "Do not turn every source event into a separate sentence.",
        "Do not merely concatenate, enumerate, or chronologically connect source labels.",
        "The cut must change what the viewer can infer.",
        "Do not state a conclusion the viewer can construct from the evidence.",
        ...(semanticUnit
          ? [
              "This is one semantic authorship unit spanning multiple evidence items. Realize the joint perception, not the component facts one-by-one.",
            ]
          : []),
        ...(final
          ? [
              "Stop when the recognition lands. Do not append explanatory closure.",
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
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): MouthCandidateBeat {
  const final = index === total - 1;

  const suppliedChange = unique(
    step.eventIds
      .map(
        (id) =>
          clean(
            envelope.events.find(
              (event) => event.id === id,
            )?.label,
          ),
      )
      .filter(Boolean),
  ).join(" / ");
  const semanticRealization = scopedSemanticRealization(movie, step.eventIds);

  return {
    order: index + 1,
    role: final
      ? "payoff"
      : index === 0
        ? "establishing"
        : "reveal",
    attentionFunction: [
      clean(step.viewerChange),
    ]
      .filter(Boolean)
      .join(" "),
    eventIds: unique(step.eventIds),
    change:
      movie.storyThesis?.semanticTurn &&
      step.eventIds.some(
        (id) =>
          movie.storyThesis?.beforeEventIds?.includes(id) ||
          movie.storyThesis?.afterEventIds?.includes(id),
      )
        ? movie.storyThesis.semanticTurn
        : suppliedChange || clean(step.viewerChange),
    next: clean(step.nextQuestion),
    frontier: clean(step.nextQuestion),
    paysOff: final ? [movie.payoff] : [],
    relationKinds: unique(movie.supportingRelationKinds),
    semanticRealization,
    observerExperience:
      semanticRealization ? movie.storyThesis?.observerExperience : undefined,
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

function normalizedTokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  );
}

function tokenOverlapRatio(left: string, right: string): number {
  const a = normalizedTokens(left);
  const b = normalizedTokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }
  return hits / Math.max(1, a.size);
}

export function evaluateAuthorSourceReplay(
  selected: ReturnType<typeof selectBestMouthSequence>,
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
): {
  truthSafe: boolean;
  authored: boolean;
  sourceReplayScore: number;
  replayedCuts: number;
  reason: string;
} {
  const sourceLabels = envelope.events.map((event) => clean(event.label)).filter(Boolean);
  const candidates = selected.candidates;
  const truthSafe = candidates.every(
    (candidate) =>
      candidate.inventionRisk < 0.35 &&
      candidate.forbiddenMoveRisk < 0.35,
  );

  if (!candidates.length || !sourceLabels.length) {
    return {
      truthSafe,
      authored: false,
      sourceReplayScore: 1,
      replayedCuts: candidates.length,
      reason: "no visible authored sequence or no source labels available",
    };
  }

  const replayScores = candidates.map((candidate) => {
    const text = clean(candidate.text);
    const directReason =
      candidate.reasons.includes("literal-source-restatement") ||
      candidate.reasons.includes("direct-source-grounded");
    const lexical = Math.max(
      ...sourceLabels.map((label) => {
        const normalizedText = text.replace(/[.!?]+$/g, "").toLowerCase();
        const normalizedLabel = clean(label).replace(/[.!?]+$/g, "").toLowerCase();
        if (normalizedText === normalizedLabel) return 1;
        return tokenOverlapRatio(text, label);
      }),
    );

    return Math.max(lexical, directReason ? 0.86 : 0);
  });

  const sourceReplayScore = metric(
    replayScores.reduce((sum, value) => sum + value, 0) /
      Math.max(1, replayScores.length),
  );
  const replayedCuts = replayScores.filter((score) => score >= 0.82).length;
  const replayDominant =
    replayedCuts / Math.max(1, replayScores.length) >= 0.67 ||
    sourceReplayScore >= 0.78;

  return {
    truthSafe,
    authored: truthSafe && !replayDominant,
    sourceReplayScore,
    replayedCuts,
    reason: replayDominant
      ? "final sequence is materially source replay or trivial normalization"
      : "final sequence materially realizes authorized meaning beyond source replay",
  };
}

export type AuthorAuthorshipQuality = {
  score: number;
  sourceContentCoverage: number;
  semanticRealizationCoverage: number;
  viewerUpdateScore: number;
  inferenceSpaceScore: number;
  stagnantCutRisk: number;
  factParadeRisk: number;
  trivialTransformationRisk: number;
  predicateEnumerationRisk: number;
  subjectPrefixRisk: number;
  semanticUnderRealizationRisk: number;
  explanatoryLabelRisk: number;
  meaningfulInferenceScore: number;
  accepted: boolean;
  reasons: string[];
};

const AUTHORSHIP_STOP = new Set([
  "the", "and", "that", "this", "with", "from", "into", "onto",
  "for", "are", "was", "were", "has", "had", "have", "is",
  "likes", "like", "loves", "love", "prefers", "prefer", "enjoys",
  "enjoy", "then", "now", "next", "finally", "after", "before",
  "follows", "follow", "following", "complete", "completes", "completed",
  "begin", "begins", "beginning", "it", "its", "his", "her", "their",
]);

const TRIVIAL_CONNECTIVE =
  /^(?:then|now|next|finally|after that|and then)\b|\b(?:follows|followed|completes?|completed|begins?|beginning)\b/i;

const EXPLANATORY_LABEL =
  /^(?:a|an|the)?\s*(?:preference|pattern|transformation|connection|relationship|change|shift|moment|memory|meaning|journey|experience|theme|status|contrast|convergence)\.?$/i;

function authorshipTokens(
  value: string,
  subject?: string,
): Set<string> {
  const subjectTokens = normalizedTokens(subject ?? "");
  return new Set(
    [...normalizedTokens(value)].filter(
      (token) =>
        !AUTHORSHIP_STOP.has(token) &&
        !subjectTokens.has(token),
    ),
  );
}

function coverage(
  left: Set<string>,
  right: Set<string>,
): number {
  if (!right.size) return 0;
  let hits = 0;
  for (const token of right) {
    if (left.has(token)) hits += 1;
  }
  return metric(hits / right.size);
}

export function evaluateAuthorAuthorshipQuality(input: {
  texts: readonly string[];
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>;
  movie?: LatentMovieCandidate;
  subject?: string;
  candidates?: ReturnType<typeof selectBestMouthSequence>["candidates"];
  beats?: readonly MouthCandidateBeat[];
}): AuthorAuthorshipQuality {
  const texts = input.texts.map(clean).filter(Boolean);
  const sourceLabels = input.envelope.events
    .map((event) => clean(event.label))
    .filter(Boolean);

  const outputTokens = authorshipTokens(
    texts.join(" "),
    input.subject,
  );
  const sourceTokens = authorshipTokens(
    sourceLabels.join(" "),
    input.subject,
  );

  const sourceContentCoverage =
    coverage(outputTokens, sourceTokens);

  const perCutSourceOverlap = texts.map((text) =>
    Math.max(
      0,
      ...sourceLabels.map((label) =>
        tokenOverlapRatio(text, label),
      ),
    ),
  );

  const highlySourceShapedCuts = perCutSourceOverlap.filter(
    (value) => value >= 0.58,
  ).length;

  const candidateFactParadeRisk = input.candidates?.length
    ? metric(
        input.candidates.filter((candidate) =>
          candidate.reasons.includes("fact-parade-like"),
        ).length / Math.max(1, input.candidates.length),
      )
    : 0;

  const factParadeRisk = metric(
    Math.max(
      candidateFactParadeRisk,
      texts.length >= 2
        ? highlySourceShapedCuts / Math.max(1, texts.length)
        : 0,
      sourceContentCoverage >= 0.72
        ? sourceContentCoverage * 0.9
        : 0,
    ),
  );

  const trivialTransformationRisk = metric(
    texts.filter((text) => TRIVIAL_CONNECTIVE.test(text)).length /
      Math.max(1, texts.length) *
      0.72 +
    (sourceContentCoverage >= 0.7 ? 0.28 : 0),
  );

  const subjectName = clean(input.subject).toLowerCase();
  const subjectPrefixRisk = subjectName
    ? metric(
        texts.filter((text) =>
          clean(text).toLowerCase().startsWith(subjectName),
        ).length / Math.max(1, texts.length),
      )
    : 0;

  const explanatoryLabelRisk = metric(
    texts.filter((text) => EXPLANATORY_LABEL.test(text)).length /
      Math.max(1, texts.length),
  );

  const predicateEnumerationRisk = metric(
    sourceContentCoverage *
      (texts.length >= 2 ? 0.55 : 0.35) +
    subjectPrefixRisk * 0.25 +
    trivialTransformationRisk * 0.2,
  );

  const candidates = input.candidates ?? [];
  const semanticRealizationCoverage = candidates.length
    ? metric(
        candidates.reduce(
          (sum, candidate) =>
            sum +
            candidate.meaningScore * 0.45 +
            candidate.observerDiscoveryScore * 0.55,
          0,
        ) / candidates.length,
      )
    : metric(
        input.movie?.storyThesis?.semanticRealization
          ? 0.62
          : 0.35,
      );

  const semanticUnderRealizationRisk = metric(
    input.movie?.storyThesis?.semanticRealization
      ? Math.max(
          0,
          0.78 - semanticRealizationCoverage,
        ) /
        0.78
      : 0,
  );

  const viewerStates = (input.beats ?? [])
    .map((beat) => beat.viewerState)
    .filter(
      (state): state is NonNullable<MouthCandidateBeat["viewerState"]> =>
        Boolean(state),
    );

  const viewerUpdateScore = viewerStates.length
    ? metric(
        viewerStates.reduce(
          (sum, state) =>
            sum +
            state.stateShift * 0.32 +
            state.predictionError * 0.24 +
            state.contrast * 0.18 +
            state.curiosityPressure * 0.14 +
            state.payoffPressure * 0.12,
          0,
        ) / viewerStates.length,
      )
    : metric(
        input.movie?.storyThesis?.semanticRealization
          ? 0.5
          : 0.3,
      );

  const inferenceSpaceScore = viewerStates.length
    ? metric(
        viewerStates.reduce(
          (sum, state) =>
            sum + Number(state.inferenceSpace ?? 0),
          0,
        ) / viewerStates.length,
      )
    : metric(
        input.movie?.storyThesis?.semanticRealization
          ? 0.52
          : 0.28,
      );

  const stagnantCutRisk = viewerStates.length
    ? metric(
        viewerStates.filter(
          (state) =>
            state.stateShift < 0.4 &&
            state.predictionError < 0.35 &&
            state.contrast < 0.35,
        ).length / viewerStates.length,
      )
    : 0;

  /*
   * Meaningful inference rewards a grounded semantic realization that
   * materially changes the observer's model. Source vocabulary may remain;
   * what matters is that the sequence causes recognition rather than merely
   * restating or connecting facts.
   */
  const meaningfulInferenceScore = metric(
    semanticRealizationCoverage * 0.3 +
    viewerUpdateScore * 0.22 +
    inferenceSpaceScore * 0.14 +
    (1 - stagnantCutRisk) * 0.07 +
    (1 - factParadeRisk) * 0.1 +
    (1 - trivialTransformationRisk) * 0.06 +
    (1 - semanticUnderRealizationRisk) * 0.06 +
    (1 - explanatoryLabelRisk) * 0.05,
  );

  const score = metric(
    meaningfulInferenceScore * 0.62 +
    (1 - predicateEnumerationRisk) * 0.12 +
    (1 - subjectPrefixRisk) * 0.08 +
    (1 - explanatoryLabelRisk) * 0.08 +
    (1 - Math.min(1, sourceContentCoverage * 0.72)) * 0.1,
  );

  const reasons: string[] = [];
  if (factParadeRisk >= 0.68) reasons.push("fact-parade");
  if (trivialTransformationRisk >= 0.6) {
    reasons.push("trivial-connective-transformation");
  }
  if (predicateEnumerationRisk >= 0.66) {
    reasons.push("predicate-object-enumeration");
  }
  if (subjectPrefixRisk >= 0.67) {
    reasons.push("repeated-subject-prefix");
  }
  if (semanticUnderRealizationRisk >= 0.58) {
    reasons.push("semantic-under-realization");
  }
  if (explanatoryLabelRisk >= 0.5) {
    reasons.push("explanatory-labeling");
  }
  if (stagnantCutRisk >= 0.5) {
    reasons.push("viewer-state-stagnation");
  }
  if (
    input.movie?.storyThesis?.semanticRealization &&
    viewerUpdateScore < 0.4
  ) {
    reasons.push("weak-viewer-update");
  }
  if (
    input.movie?.storyThesis?.semanticRealization &&
    inferenceSpaceScore < 0.34
  ) {
    reasons.push("weak-inference-space");
  }

  const accepted =
    score >= 0.54 &&
    meaningfulInferenceScore >= 0.5 &&
    factParadeRisk < 0.78 &&
    trivialTransformationRisk < 0.78 &&
    semanticUnderRealizationRisk < 0.82 &&
    explanatoryLabelRisk < 0.75 &&
    stagnantCutRisk < 0.75 &&
    (
      !input.movie?.storyThesis?.semanticRealization ||
      (
        viewerUpdateScore >= 0.4 &&
        inferenceSpaceScore >= 0.34
      )
    );

  return {
    score,
    sourceContentCoverage,
    semanticRealizationCoverage,
    viewerUpdateScore,
    inferenceSpaceScore,
    stagnantCutRisk,
    factParadeRisk,
    trivialTransformationRisk,
    predicateEnumerationRisk,
    subjectPrefixRisk,
    semanticUnderRealizationRisk,
    explanatoryLabelRisk,
    meaningfulInferenceScore,
    accepted,
    reasons,
  };
}

export function buildLiteralRecoveryCandidate(input: {
  beat: MouthCandidateBeat;
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>;
}): MouthCandidate | undefined {
  const sourceLabels = unique(
    (input.beat.eventIds ?? [])
      .map((id) =>
        clean(
          input.envelope.events.find(
            (event) => event.id === id,
          )?.label,
        ),
      )
      .filter(Boolean),
  );

  if (!sourceLabels.length) {
    return undefined;
  }

  /*
   * Recovery is not authorship.
   *
   * The text below is assembled only from exact supplied labels already
   * authorized for this beat. The separator contributes no world claim.
   * This guarantees a renderable truth-safe floor when model generation or
   * parsing fails without widening creative authority.
   */
  const text = sourceLabels.join(" / ");
  const scored = scoreMouthCandidate({
    text,
    beat: input.beat,
    envelope: input.envelope,
  });

  return {
    ...scored,
    authorization: {
      realitySafe: true,
      semanticAuthorized: false,
      directGrounded: true,
      authorized: true,
      reasons: [
        "reality-safe",
        "direct-grounded",
        "literal-recovery-grounded",
      ],
    },
    supportedEventIds: [...(input.beat.eventIds ?? [])],
    groundingScore: 1,
    forbiddenMoveRisk: 0,
    inventionRisk: 0,
    score: Math.max(0.01, scored.score),
    reasons: unique([
      ...scored.reasons,
      "literal-source-restatement",
      "literal-recovery-grounded",
    ]),
  };
}

function operationalAuthorResult(input: {
  graph: ReturnType<typeof buildAuthorRealityGraph>;
  subject: string;
  realizationMode: AuthorRealizationMode;
  playoutMode: AuthorPlayoutMode;
}): CanonicalAuthorResult {
  const events = input.graph.events
    .map((event) => ({
      id: event.id,
      text: clean(event.label),
    }))
    .filter((event) => Boolean(event.text));

  const scenes: AuthorScene[] = events.map((event, index) => ({
    text: event.text,
    kind:
      index === events.length - 1
        ? "payoff"
        : index === 0
          ? "hook"
          : "movement",
  }));

  const cuts: SequenceCut[] = events.map((event, index) => {
    const prior = events.slice(0, index).map((item) => item.text);
    const known = [...prior, event.text];

    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role:
        index === events.length - 1
          ? "payoff"
          : index === 0
            ? "arrival"
            : "discovery",
      gainKind:
        index === events.length - 1
          ? "payoff"
          : "new_fact",
      sourceIds: [event.id],
      informationGain: event.text,
      attentionDelta: event.text,
      viewerBefore: {
        known: prior,
      },
      viewerAfter: {
        known,
        recentChange: event.text,
      },
      confidence: 1,
    };
  });

  const sequence: SequencePlay = {
    subject: input.subject,
    premise: events[0]?.text ?? "",
    openingState: { known: [] },
    baselineFacts: [],
    cuts,
    closingState: {
      known: events.map((event) => event.text),
      recentChange: events[events.length - 1]?.text,
    },
    continuity: [
      "Operational playout preserves supplied reality in source order.",
      "No creative interpretation is promoted into factual output.",
    ],
    antiCrutch: [
      "Do not invent unsupplied people, roles, ownership, tenancy, clients, objects, actions, places, or chronology.",
    ],
  };

  const complete = scenes.length > 0 && scenes.length === cuts.length;

  return {
    scenes,
    sequence,
    realizationMode: input.realizationMode,
    brief: {
      angle: "operational",
      engine: "source reality → factual sequence play",
      question: "What was actually supplied?",
      strongestImage: events[0]?.text ?? "",
      tension: "none",
      payoff: events[events.length - 1]?.text ?? "",
      callback: "none",
      rhythm: scenes.map(() => "short"),
      avoid: [
        "invented event",
        "invented relationship",
        "creative interpretation presented as fact",
      ],
    },
    diagnostics: {
      model: "none",
      modelCalls: 0,
      candidateSequences: 0,
      acceptedCandidates: scenes.length,
      recoveryUsed: false,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: complete ? 1 : 0,
      rejectedCandidates: [],
      truthSafe: true,
      authored: false,
      sourceReplay: {
        truthSafe: true,
        authored: false,
        sourceReplayScore: 1,
        replayedCuts: scenes.length,
        reason:
          "operational playout intentionally preserves supplied factual reality",
      },
      authorshipQuality: {
        mode: input.playoutMode,
        required: false,
        accepted: true,
        reason:
          "operational playout is evaluated for factual fidelity, not creative authorship",
      },
      qualitySignals: {
        playoutMode: input.playoutMode,
        operational: true,
        sequenceSourcesComplete: cuts.every((cut) => cut.sourceIds.length > 0),
      },
      trace: {
        playoutMode: input.playoutMode,
        input: {
          subject: input.subject,
        },
        realityReadout: {
          events: input.graph.events,
          relations: input.graph.relations,
          eventStructure: input.graph.eventStructure ?? [],
        },
        finalSequence: sequence,
        finalScenes: scenes,
        provenance: cuts.map((cut) => ({
          order: cut.order,
          sourceIds: cut.sourceIds,
        })),
      },
    },
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
    truthSafe?: boolean;
    authored?: boolean;
    sourceReplay?: unknown;
    authorshipQuality?: unknown;
    qualitySignals?: unknown;
    trace?: unknown;
  };
};

export async function authorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const facts = unique(input.facts);
  const sourceMoments = unique(input.sourceMoments);
  const playoutMode = playoutModeFor(input);

  /*
   * Operational playout is a current-job factual readout.
   * Durable facts and remembered history remain stored context, but they are
   * not replayed as if they occurred in this service/job/receipt round.
   */
  const operationalCurrentReality =
    sourceMoments.length > 0
      ? sourceMoments
      : facts;

  const graph = buildAuthorRealityGraph({
    prompt: clean(input.prompt),
    subject,
    place: clean(input.place),
    facts:
      playoutMode === "operational"
        ? []
        : facts,
    sourceMoments:
      playoutMode === "operational"
        ? operationalCurrentReality
        : sourceMoments,
    memoryContext:
      playoutMode === "operational"
        ? []
        : input.memoryContext ?? [],
    trajectory:
      playoutMode === "operational"
        ? []
        : input.trajectory ?? [],
  });

  const realizationMode = classifyAuthorRealizationMode({
    prompt: clean(input.prompt),
    facts,
    sourceMoments,
    relationKinds: graph.relations.map((relation) => relation.kind),
    movieMode: playoutMode === "experience",
  });

  if (playoutMode === "operational") {
    return operationalAuthorResult({
      graph,
      subject,
      realizationMode,
      playoutMode,
    });
  }

  const cognition = buildCognition(
    {
      ...input,
      facts,
      sourceMoments,
      playoutMode,
    },
    graph,
  );
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
  const creativeLensBrief = buildCreativeLensBrief({
    lens,
    movie,
    envelope,
  });
  const composedBeats = composeTrajectoryBeats(movie, envelope);
  const authorityBeats = composedBeats.map((beat) => ({
    ...beat,
    realizationAuthority: buildMouthRealizationAuthority({
      beat,
      envelope,
      treatment: {
        label: creativeLensBrief.lens.label,
        intensity: creativeLensBrief.lens.intensity,
        framingBias: creativeLensBrief.lens.framingBias,
        realizationPreferences:
          creativeLensBrief.lens.realizationPreferences,
        forbiddenRealityMoves:
          creativeLensBrief.forbiddenRealityMoves,
      },
    }),
  }));
  const beats = authorityBeats.map((beat, index, allBeats) => ({
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
    creativeLensBrief,
    domainContext: input.domainContext,
  });

  let modelName =
    process.env.QRE_AUTHOR_FAST_MODEL ||
    process.env.QRE_LOCAL_MODEL ||
    "unknown";
  let modelCalls = 0;
  let pools: MouthCandidatePool[] = [];
  let rawSequenceVariants: string[][] = [];
  let rawMouthOutput = "";
  let mouthParseAccepted = false;
  let mouthGenerationError = "";
  const rejectedCandidates: unknown[] = [];

  try {
    /*
     * Keep the transport in plain JSON mode.  The full nested schema caused
     * Gemma/Qwen structured decoding to stop after the opening array, which
     * made a valid creative response look like a generation failure.  The
     * canonical parser and authorization layer remain the contract.
     */
    const generated = await localModelGenerate(messages, "json", {
      numPredict: 2048,
      temperature: 0.7,
    });

    modelCalls = 1;
    modelName = generated.model || modelName;
    rawMouthOutput = generated.text;

    const parsed = parseMouthCandidateBatch(generated.text, beats.length);
    mouthParseAccepted = Boolean(parsed);

    if (!parsed) {
      rejectedCandidates.push({
        phase: "mouth-batch-parse",
        reason: "model-output-did-not-match-required-whole-sequence-schema",
        expectedBeatCount: beats.length,
        rawOutput: generated.text,
      });
    }

    if (parsed) {
      rawSequenceVariants = parsed.sequenceVariants ?? [];
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
      pools.forEach((pool) => {
        pool.candidates
          .filter((candidate) => !isAuthorizedMouthCandidate(candidate))
          .forEach((candidate) =>
            rejectedCandidates.push({
              phase: "mouth-candidate-authorization",
              beatOrder: pool.order,
              text: candidate.text,
              reasons: candidate.reasons,
              inventionRisk: candidate.inventionRisk,
              forbiddenMoveRisk: candidate.forbiddenMoveRisk,
              authorization: candidate.authorization,
              groundingScore: candidate.groundingScore,
              meaningScore: candidate.meaningScore,
            }),
          );
      });
    }
  } catch (error) {
    modelCalls = 1;
    mouthGenerationError =
      error instanceof Error
        ? error.message
        : clean(error);

    rejectedCandidates.push({
      phase: "mouth-generation",
      reason: "model-generation-failed",
      error: mouthGenerationError,
    });
  }

  let recoveryUsed = false;
  const usablePools = beats.map((beat) => {
        const generatedPool = pools.find((pool) => pool.order === beat.order);
        const hasAuthorizedCandidate =
          generatedPool?.candidates.some(isAuthorizedMouthCandidate) ?? false;

        if (generatedPool && hasAuthorizedCandidate) return generatedPool;

        recoveryUsed = true;

        const recoveryCandidate =
          buildLiteralRecoveryCandidate({
            beat,
            envelope,
          });

        if (recoveryCandidate) {
          rejectedCandidates.push({
            phase: "mouth-recovery",
            beatOrder: beat.order,
            reason:
              "using-literal-source-recovery; renderable truth floor only, not authored success",
            text: recoveryCandidate.text,
          });
        }

        return {
          order: beat.order,
          viewerState: beat.viewerState,
          nextPromise: clean(beat.next),
          frontier: clean(beat.frontier),
          candidates: recoveryCandidate
            ? [recoveryCandidate]
            : [],
        };
      });

  const selected =
    selectBestMouthSequence(usablePools, {
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
  const sourceReplay = evaluateAuthorSourceReplay(selected, envelope);
  const authorshipQuality = evaluateAuthorAuthorshipQuality({
    texts: selected.texts,
    envelope,
    movie,
    subject,
    candidates: selected.candidates,
    beats,
  });

  /*
   * Cut count is owned by semantic composition. A one-cut recognition can be
   * complete when Cognition selected one semantic authorship unit.
   */
  const sequenceSourcesComplete = sequence.cuts.every(
    (cut) => cut.sourceIds.length > 0,
  );
  const complete =
    scenes.length >= 1 &&
    scenes.length === beats.length &&
    scenes.length === sequence.cuts.length &&
    sequenceSourcesComplete &&
    attention.accepted === true &&
    arc.accepted === true;
  /*
   * Truth safety and renderability are different questions.
   * No-output/incomplete output is not a truth violation; it is a completeness
   * failure. A literal recovery may therefore be truth-safe + renderable while
   * still failing authored quality.
   */
  const truthSafe = sourceReplay.truthSafe;
  const renderable = complete && truthSafe;
  const authored =
    renderable &&
    sourceReplay.authored &&
    authorshipQuality.accepted;

  if (process.env.QRE_AUTHOR_DEBUG_MOVIE === "true") {
    console.log("\n--- QRE AUTHOR COMPLETENESS ---");
    console.log(`semanticBeatCount=${beats.length}`);
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
      candidateSequences: rawSequenceVariants.length || pools.length,
      acceptedCandidates: selected.candidates.length,
      recoveryUsed,
      qualityStatus: authored ? "ACCEPTED" : "REJECTED",
      renderable,
      complete,
      selectedScore: selected.score,
      rejectedCandidates,
      truthSafe,
      authored,
      sourceReplay,
      authorshipQuality,
      qualitySignals: {
        playoutMode,
        attentionAccepted: attention.accepted,
        arcAccepted: arc.accepted,
        sequenceSourcesComplete,
        selectedScore: selected.score,
        sourceReplayScore: sourceReplay.sourceReplayScore,
        authorshipQuality: authorshipQuality.score,
        meaningfulInferenceScore: authorshipQuality.meaningfulInferenceScore,
        factParadeRisk: authorshipQuality.factParadeRisk,
        trivialTransformationRisk: authorshipQuality.trivialTransformationRisk,
        predicateEnumerationRisk: authorshipQuality.predicateEnumerationRisk,
        subjectPrefixRisk: authorshipQuality.subjectPrefixRisk,
        semanticRealizationCoverage: authorshipQuality.semanticRealizationCoverage,
        viewerUpdateScore: authorshipQuality.viewerUpdateScore,
        inferenceSpaceScore: authorshipQuality.inferenceSpaceScore,
        stagnantCutRisk: authorshipQuality.stagnantCutRisk,
        semanticUnderRealizationRisk: authorshipQuality.semanticUnderRealizationRisk,
        explanatoryLabelRisk: authorshipQuality.explanatoryLabelRisk,
        authorshipReasons: authorshipQuality.reasons,
        mouthParseAccepted,
        mouthGenerationError: mouthGenerationError || undefined,
        recoveryUsed,
      },
      trace: {
        input: {
          prompt: clean(input.prompt),
          playoutMode,
          lens,
          subject,
          facts,
          sourceMoments,
          domainContext: input.domainContext,
        },
        realityReadout: {
          events: graph.events,
          relations: graph.relations,
          unresolvedTensions: graph.unresolvedTensions,
          recurringSignals: graph.recurringSignals,
          sensorySignals: graph.sensorySignals,
          eventStructure: graph.eventStructure ?? [],
        },
        actionMechanics: cognition.actionMechanics,
        selectedActionMechanics:
          cognition.selectedActionMechanics,
        semanticCandidates: cognition.latentMovieCandidates.map((candidate) => ({
          id: candidate.id,
          score: candidate.score,
          evidence: candidate.evidence,
          supportingRelationKinds: candidate.supportingRelationKinds,
          trajectory: candidate.trajectory,
          storyThesis: candidate.storyThesis,
          viewerStateDynamics: candidate.viewerStateDynamics,
        })),
        rejectedSemanticCandidates: cognition.latentMovieCandidates
          .filter((candidate) => candidate.id !== movie.id)
          .map((candidate) => ({
            id: candidate.id,
            reason: "not selected by current movie ordering",
            score: candidate.score,
          })),
        selectedThesis: movie.storyThesis,
        selectedLens: lens,
        creativeLensBrief,
        composedBeats: beats.map((beat) => ({
          order: beat.order,
          role: beat.role,
          attentionFunction: beat.attentionFunction,
          creativeMove: beat.creativeMove,
          eventIds: beat.eventIds,
          change: beat.change,
          next: beat.next,
          frontier: beat.frontier,
          relationKinds: beat.relationKinds,
          semanticRealization: beat.semanticRealization,
          observerExperience: beat.observerExperience,
          viewerState: beat.viewerState,
          realizationAuthority: beat.realizationAuthority,
        })),
        mouthGeneration: {
          parseAccepted: mouthParseAccepted,
          error: mouthGenerationError || undefined,
          rawOutput: rawMouthOutput,
          recoveryUsed,
        },
        rawSequenceVariants,
        candidateScores: [
          ...pools.flatMap((pool) =>
            pool.candidates.map((candidate) => ({
              ...candidate,
            })),
          ),
          ...selected.candidates.map((candidate) => ({
            selected: true,
            ...candidate,
          })),
        ],
        beamWinner: selected,
        finalSequence: sequence,
        finalScenes: scenes,
        provenance: sequence.cuts.map((cut) => ({
          order: cut.order,
          sourceIds: cut.sourceIds,
        })),
      },
    },
  };
}

function beatAt(
  beats: MouthCandidateBeat[],
  index: number,
): MouthCandidateBeat | undefined {
  return beats[index];
}
