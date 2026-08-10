import type {
  CognitiveExperiencePlan,
  StoryBeatKind,
} from "@qre/contracts";

import {
  inferExperienceMechanics,
  type ExperienceMechanic,
  type MechanicSignal,
} from "./cognitiveMechanics.js";
import {
  inferCognitiveVocabulary,
  type CognitiveVocabularySignal,
} from "./cognitiveVocabularyCore.js";

/**
 * GOAL
 * ----
 * Turn conserved cognitive mechanics into a causally ordered experiential
 * trajectory while preserving a richer expressive vocabulary for realization.
 *
 * PURPOSE
 * -------
 * Keep cognition upstream of language. Mechanics establish what behavioral
 * forces exist; vocabulary explains how those forces can feel and intensify;
 * trajectory decides which observable operations must occur and in what phase.
 *
 * ARCHITECTURAL POSITION
 * ----------------------
 * Cognitive Plan → Mechanics → Vocabulary → Trajectory → Realization
 *
 * INVARIANTS
 * ---------
 * - Explicit cognitive realization directives can never be erased.
 * - Vocabulary may enrich sparse trajectories but cannot override semantics.
 * - No subject-specific story branches belong here.
 * - A trajectory is causal structure, not prose.
 */

export type CognitiveTrajectory = {
  beats: StoryBeatKind[];
  mechanics: MechanicSignal[];
  vocabulary: CognitiveVocabularySignal[];
  score: number;
  rationale: string[];
};

type MechanicRule = {
  mechanic: ExperienceMechanic;
  operations: StoryBeatKind[];
  weight: number;
};

const RULES: MechanicRule[] = [
  { mechanic: "uncertainty", operations: ["threshold", "encounter", "reveal"], weight: 1.4 },
  { mechanic: "discovery", operations: ["discovery", "reveal"], weight: 1.35 },
  { mechanic: "participation", operations: ["action", "feedback"], weight: 1.15 },
  { mechanic: "competition", operations: ["challenge", "escalation"], weight: 1.3 },
  { mechanic: "contribution", operations: ["encounter", "contribution", "feedback"], weight: 1.2 },
  { mechanic: "accumulation", operations: ["contribution", "milestone"], weight: 1.2 },
  { mechanic: "escalation", operations: ["escalation"], weight: 1.45 },
  { mechanic: "transformation", operations: ["transformation"], weight: 1.5 },
  { mechanic: "contrast", operations: ["orientation", "transformation"], weight: 1.0 },
  { mechanic: "reveal", operations: ["reveal"], weight: 1.3 },
  { mechanic: "memory", operations: ["origin", "reflection"], weight: 1.25 },
  { mechanic: "pampering", operations: ["encounter", "transformation"], weight: 1.15 },
  { mechanic: "excess", operations: ["escalation"], weight: 1.2 },
  { mechanic: "adaptation", operations: ["feedback", "next_step"], weight: 1.2 },
  { mechanic: "continuation", operations: ["continuation"], weight: 1.35 },
];

const PHASE: Record<StoryBeatKind, number> = {
  orientation: 10,
  hook: 15,
  need: 18,
  threshold: 20,
  origin: 22,
  encounter: 30,
  challenge: 35,
  discovery: 40,
  reveal: 45,
  instruction: 30,
  action: 35,
  feedback: 50,
  contribution: 38,
  escalation: 55,
  transformation: 60,
  reflection: 65,
  provenance: 66,
  identity: 30,
  milestone: 68,
  unlock: 70,
  payoff: 80,
  earned_access: 82,
  next_step: 88,
  continuation: 95,
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];

function activeSignals(signals: MechanicSignal[]): MechanicSignal[] {
  return signals
    .filter((signal) => signal.confidence >= 0.7)
    .sort((a, b) => b.confidence - a.confidence);
}

function deriveOperations(
  signals: MechanicSignal[],
  vocabulary: CognitiveVocabularySignal[],
  plan?: CognitiveExperiencePlan,
): StoryBeatKind[] {
  const operations: StoryBeatKind[] = [];

  for (const signal of activeSignals(signals)) {
    const rule = RULES.find((candidate) => candidate.mechanic === signal.mechanic);
    if (rule) operations.push(...rule.operations);
  }

  /*
   * Cognitive realization directives are semantic commitments, not a canned
   * story template. Mechanics and vocabulary may derive additional operations,
   * but they may never erase an operation cognition explicitly decided must occur.
   */
  operations.push(
    ...(plan?.realization?.directives?.map((directive) => directive.kind) ?? []),
  );

  /*
   * Vocabulary is allowed to enrich genuinely sparse trajectories. Complex
   * trajectories already have enough mechanical structure and should not be
   * inflated into a beat pile merely because the vocabulary is expressive.
   */
  if (operations.length < 6) {
    for (const signal of vocabulary.slice(0, 5)) {
      for (const operation of signal.operations) {
        if (operations.length >= 8) break;
        if (!operations.includes(operation)) operations.push(operation);
      }
    }
  }

  if (!operations.some((beat) =>
    ["orientation", "hook", "threshold", "origin"].includes(beat),
  )) {
    operations.unshift("orientation");
  }

  if (!operations.some((beat) =>
    [
      "encounter",
      "action",
      "challenge",
      "discovery",
      "contribution",
      "transformation",
      "escalation",
    ].includes(beat),
  )) {
    operations.push("encounter");
  }

  if (!operations.includes("payoff")) {
    operations.push("payoff");
  }

  return unique(operations).sort((a, b) => PHASE[a] - PHASE[b]);
}

function scoreTrajectory(
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
  vocabulary: CognitiveVocabularySignal[],
): number {
  const active = activeSignals(signals);
  let score = 0;

  for (const signal of active) {
    const rule = RULES.find((candidate) => candidate.mechanic === signal.mechanic);
    if (!rule) continue;

    const coverage = rule.operations.filter((operation) => beats.includes(operation)).length;
    score += signal.confidence * rule.weight * (coverage / rule.operations.length);
  }

  /*
   * Reward vocabulary whose observable operations survive into the trajectory.
   * This measures semantic conservation rather than stylistic richness.
   */
  for (const signal of vocabulary.slice(0, 12)) {
    const coverage = signal.operations.filter((operation) => beats.includes(operation)).length;
    if (coverage > 0) score += signal.confidence * 0.12 * (coverage / signal.operations.length);
  }

  if (beats.includes("payoff")) score += 0.75;
  if (beats.length >= 3 && beats.length <= 7) score += 0.5;

  for (let index = 1; index < beats.length; index += 1) {
    if (PHASE[beats[index]] > PHASE[beats[index - 1]]) score += 0.08;
  }

  return Number(score.toFixed(3));
}

function rationale(
  signals: MechanicSignal[],
  vocabulary: CognitiveVocabularySignal[],
): string[] {
  const mechanicRationale = activeSignals(signals).map(
    (signal) => `${signal.mechanic}: ${signal.evidence.join("; ")}`,
  );

  const vocabularyRationale = vocabulary.slice(0, 12).map(
    (signal) => `vocabulary ${signal.vocabulary}: ${signal.evidence.join("; ")}`,
  );

  return [...mechanicRationale, ...vocabularyRationale];
}

/**
 * Derive narrative structure from experiential mechanics and expressive
 * vocabulary. This is downstream of cognition and upstream of language.
 *
 * The compiler does NOT ask "What industry is this?". It asks what behavioral
 * forces exist, how those forces can be experienced, and what observable
 * sequence lets them causally unfold.
 */
export function composeCognitiveTrajectory(args: {
  plan?: CognitiveExperiencePlan;
}): CognitiveTrajectory {
  const mechanics = inferExperienceMechanics({
    plan: args.plan,
    premise: args.plan?.premise,
  });

  const vocabulary = inferCognitiveVocabulary({
    plan: args.plan,
    mechanics,
  });

  const beats = deriveOperations(vocabulary.length ? mechanics : mechanics, vocabulary, args.plan);

  return {
    beats,
    mechanics,
    vocabulary,
    score: scoreTrajectory(beats, mechanics, vocabulary),
    rationale: rationale(mechanics, vocabulary),
  };
}
