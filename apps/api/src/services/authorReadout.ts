import type {
  AuthorExperienceState,
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";

import type { AuthorBehaviorProfile } from "./authorBehaviorProfile.js";

export type AuthorReadoutCandidate = {
  id: string;
  score: number;
  distinctiveness: number;
  lens: string;
  relationKinds: string[];
  operations: string[];
  evidence: string[];
  payoff?: string;
  truthRisk: number;
};

export type AuthorReadoutGate = {
  name: string;
  passed: boolean;
  reason: string;
};

export type AuthorReadout = {
  version: 1;
  identity: {
    experienceId?: string;
    assetId?: string;
    subject?: string;
    round: number;
  };
  sourceTruth: {
    eventCount: number;
    relationCount: number;
    entityCount: number;
    recurringSignals: string[];
    unresolvedTensions: string[];
    eventLabels: string[];
  };
  learnedProfile: {
    confidence: number;
    compressionPreference: number;
    explanationAversion: number;
    callbackAffinity: number;
    surprisePreference: number;
    accelerationPreference: number;
    revisitAffinity: number;
    learnedSignals: string[];
  };
  movieSearch: {
    candidateCount: number;
    candidates: AuthorReadoutCandidate[];
    selected?: AuthorReadoutCandidate;
  };
  experienceState?: {
    tempo: AuthorExperienceState["tempo"];
    continuationValue: number;
    lookaheadValue: number;
    attentionPotential: number;
    endpointPressure: number;
    establishedEventIds: string[];
    changedEventIds: string[];
    revisitedEventIds: string[];
    activeTensionKeys: string[];
    resolvedTensionKeys: string[];
    futureThreadKeys: string[];
    retiredFutureThreadKeys: string[];
    unresolvedQuestions: string[];
  };
  realization: {
    mouthLines: string[];
    finalScenes: string[];
  };
  gates: AuthorReadoutGate[];
  invariants: {
    truthPreserved: boolean;
    learnedPreferenceOnly: boolean;
    movieSelectedBeforeMouth: boolean;
    noPlannerLanguage: boolean;
    noPartialSuccess: boolean;
  };
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[], limit = 64): string[] =>
  [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

const operationsOf = (candidate: LatentMovieCandidate): string[] =>
  unique(candidate.trajectory.map((step) => clean(step.operation)), 16);

const candidateReadout = (candidate: LatentMovieCandidate): AuthorReadoutCandidate => ({
  id: candidate.id,
  score: candidate.score,
  distinctiveness: candidate.distinctiveness,
  lens: clean(candidate.lens) || "neutral",
  relationKinds: unique(candidate.supportingRelationKinds, 16),
  operations: operationsOf(candidate),
  evidence: unique(candidate.evidence, 24),
  payoff: clean(candidate.payoff) || undefined,
  truthRisk: candidate.truthRisk,
});

const plannerLeak = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|round\s*\d|cognitive(?: plan| brain)?|information frontier|narrative engagement|authoring process|planning language|viewer-facing)\b/i;

export function buildAuthorReadout(input: {
  experienceId?: string;
  assetId?: string;
  subject?: string;
  round?: number;
  graph: RealityGraph;
  learnedProfile: AuthorBehaviorProfile;
  movieCandidates: readonly LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  experienceState?: AuthorExperienceState;
  mouthLines?: readonly string[];
  finalScenes?: readonly string[];
  gates?: readonly AuthorReadoutGate[];
}): AuthorReadout {
  const candidates = input.movieCandidates
    .map(candidateReadout)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const selected = input.selectedMovie
    ? candidateReadout(input.selectedMovie)
    : candidates[0];

  const mouthLines = unique(input.mouthLines ?? [], 32);
  const finalScenes = unique(input.finalScenes ?? [], 32);
  const learned = input.learnedProfile;

  const gates: AuthorReadoutGate[] = [
    {
      name: "source_truth_present",
      passed: input.graph.events.length > 0,
      reason: `${input.graph.events.length} source events available`,
    },
    {
      name: "movie_selected_before_mouth",
      passed: Boolean(selected),
      reason: selected ? `selected ${selected.id}` : "no selected movie",
    },
    {
      name: "learned_preference_is_bounded",
      passed: learned.confidence >= 0 && learned.confidence <= 1,
      reason: `confidence=${learned.confidence}`,
    },
    {
      name: "mouth_has_no_planner_language",
      passed: !mouthLines.some((line) => plannerLeak.test(line)),
      reason: mouthLines.some((line) => plannerLeak.test(line))
        ? "planner vocabulary detected in mouth output"
        : "no planner vocabulary detected",
    },
    {
      name: "final_scene_count_is_consistent",
      passed: finalScenes.length === 0 || mouthLines.length === 0 || finalScenes.length === mouthLines.length,
      reason:
        finalScenes.length === 0 || mouthLines.length === 0
          ? "insufficient scene/readout material to compare"
          : `mouth=${mouthLines.length}, scenes=${finalScenes.length}`,
    },
    ...(input.gates ?? []),
  ];

  const truthPreserved =
    Boolean(selected) &&
    selected!.truthRisk < 0.9 &&
    input.graph.events.length > 0;

  const learnedPreferenceOnly =
    learned.confidence >= 0 &&
    learned.confidence <= 1 &&
    [
      learned.compressionPreference,
      learned.explanationAversion,
      learned.callbackAffinity,
      learned.surprisePreference,
      learned.accelerationPreference,
      learned.revisitAffinity,
    ].every((value) => value >= 0 && value <= 1);

  const movieSelectedBeforeMouth = Boolean(selected);
  const noPlannerLanguage = !mouthLines.some((line) => plannerLeak.test(line));
  const noPartialSuccess = gates.every((gate) => gate.passed);

  return {
    version: 1,
    identity: {
      experienceId: clean(input.experienceId) || undefined,
      assetId: clean(input.assetId) || undefined,
      subject: clean(input.subject) || undefined,
      round: Math.max(1, Math.floor(input.round ?? 1)),
    },
    sourceTruth: {
      eventCount: input.graph.events.length,
      relationCount: input.graph.relations.length,
      entityCount: new Set(input.graph.events.flatMap((item) => item.entities)).size,
      recurringSignals: unique(input.graph.recurringSignals, 16),
      unresolvedTensions: unique(input.graph.unresolvedTensions, 16),
      eventLabels: input.graph.events.map((item) => clean(item.label)).filter(Boolean).slice(0, 32),
    },
    learnedProfile: {
      confidence: learned.confidence,
      compressionPreference: learned.compressionPreference,
      explanationAversion: learned.explanationAversion,
      callbackAffinity: learned.callbackAffinity,
      surprisePreference: learned.surprisePreference,
      accelerationPreference: learned.accelerationPreference,
      revisitAffinity: learned.revisitAffinity,
      learnedSignals: unique(learned.learnedSignals, 16),
    },
    movieSearch: {
      candidateCount: input.movieCandidates.length,
      candidates,
      selected,
    },
    experienceState: input.experienceState
      ? {
          tempo: input.experienceState.tempo,
          continuationValue: input.experienceState.continuationValue,
          lookaheadValue: input.experienceState.lookaheadValue,
          attentionPotential: input.experienceState.attentionPotential,
          endpointPressure: input.experienceState.endpointPressure,
          establishedEventIds: unique(input.experienceState.establishedEventIds, 24),
          changedEventIds: unique(input.experienceState.changedEventIds, 24),
          revisitedEventIds: unique(input.experienceState.revisitedEventIds, 24),
          activeTensionKeys: unique(input.experienceState.activeTensionKeys, 24),
          resolvedTensionKeys: unique(input.experienceState.resolvedTensionKeys, 24),
          futureThreadKeys: unique(input.experienceState.futureThreadKeys, 24),
          retiredFutureThreadKeys: unique(input.experienceState.retiredFutureThreadKeys, 24),
          unresolvedQuestions: unique(input.experienceState.unresolvedQuestions, 16),
        }
      : undefined,
    realization: {
      mouthLines,
      finalScenes,
    },
    gates,
    invariants: {
      truthPreserved,
      learnedPreferenceOnly,
      movieSelectedBeforeMouth,
      noPlannerLanguage,
      noPartialSuccess,
    },
  };
}

export function summarizeAuthorReadout(readout: AuthorReadout): string[] {
  const lines: string[] = [
    `AUTHOR READOUT · round=${readout.identity.round}`,
    `WORLD · events=${readout.sourceTruth.eventCount} relations=${readout.sourceTruth.relationCount} entities=${readout.sourceTruth.entityCount}`,
    `LEARNING · confidence=${readout.learnedProfile.confidence} compression=${readout.learnedProfile.compressionPreference} explanationAversion=${readout.learnedProfile.explanationAversion}`,
    `LEARNING · callback=${readout.learnedProfile.callbackAffinity} surprise=${readout.learnedProfile.surprisePreference} acceleration=${readout.learnedProfile.accelerationPreference} revisit=${readout.learnedProfile.revisitAffinity}`,
    `MOVIE SEARCH · candidates=${readout.movieSearch.candidateCount} selected=${readout.movieSearch.selected?.id ?? "none"}`,
  ];

  if (readout.movieSearch.selected) {
    lines.push(
      `MOVIE · score=${readout.movieSearch.selected.score} distinctiveness=${readout.movieSearch.selected.distinctiveness} relations=${readout.movieSearch.selected.relationKinds.join(",") || "none"}`,
      `MOVIE · operations=${readout.movieSearch.selected.operations.join(" → ") || "none"}`,
      `MOVIE · evidence=${readout.movieSearch.selected.evidence.join(" | ") || "none"}`,
      `MOVIE · payoff=${readout.movieSearch.selected.payoff ?? "none"}`,
    );
  }

  if (readout.experienceState) {
    lines.push(
      `STATE · tempo=${readout.experienceState.tempo.mode} urgency=${readout.experienceState.tempo.urgency} pull=${readout.experienceState.tempo.nextBeatPull}`,
      `STATE · continuation=${readout.experienceState.continuationValue} lookahead=${readout.experienceState.lookaheadValue} attention=${readout.experienceState.attentionPotential}`,
      `STATE · changed=${readout.experienceState.changedEventIds.join(",") || "none"} revisited=${readout.experienceState.revisitedEventIds.join(",") || "none"}`,
      `STATE · future=${readout.experienceState.futureThreadKeys.join(",") || "none"} retired=${readout.experienceState.retiredFutureThreadKeys.join(",") || "none"}`,
    );
  }

  lines.push(`MOUTH · lines=${readout.realization.mouthLines.length}`);
  for (const [index, line] of readout.realization.mouthLines.entries()) {
    lines.push(`MOUTH ${index + 1} · ${line}`);
  }
  lines.push(`SCENES · count=${readout.realization.finalScenes.length}`);

  for (const gate of readout.gates) {
    lines.push(`${gate.passed ? "PASS" : "FAIL"} · ${gate.name} · ${gate.reason}`);
  }

  lines.push(
    `INVARIANTS · truth=${readout.invariants.truthPreserved} preferenceOnly=${readout.invariants.learnedPreferenceOnly} movieBeforeMouth=${readout.invariants.movieSelectedBeforeMouth} noPlannerLanguage=${readout.invariants.noPlannerLanguage}`,
  );

  return lines;
}
