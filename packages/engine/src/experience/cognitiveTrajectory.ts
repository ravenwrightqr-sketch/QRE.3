/**
 * =============================================================================
 * COGNITIVE TRAJECTORY
 * =============================================================================
 *
 * GOAL
 * ----
 * Convert discovered experiential mechanics into a causal experience
 * trajectory without collapsing cognition back into domain templates.
 *
 * PURPOSE
 * -------
 * This is the structural bridge between:
 *
 *   cognitive understanding
 *       -> experiential mechanics
 *       -> causal operations
 *       -> concrete realization
 *
 * The trajectory is deliberately variable. It composes primitive story
 * operations from the forces cognition discovered instead of selecting a
 * canned sequence for a subject, industry, genre, or noun.
 *
 * ALIGNMENT RULE
 * --------------
 * Cognitive realization directives are authoritative commitments. Derived
 * mechanics may add useful experiential operations, but they may never erase
 * or replace an operation cognition explicitly decided must happen.
 */

import type {
  CognitiveExperiencePlan,
  StoryBeatKind,
} from "@qre/contracts";

import {
  inferExperienceMechanics,
  type ExperienceMechanic,
  type MechanicSignal,
} from "./cognitiveMechanics.js";

export type CognitiveTrajectory = {
  beats: StoryBeatKind[];
  mechanics: MechanicSignal[];
  score: number;
  rationale: string[];
};

type MechanicRule = {
  mechanic: ExperienceMechanic;
  operations: StoryBeatKind[];
  weight: number;
};

/**
 * Mechanical forces -> primitive experiential operations.
 *
 * These are not genre templates. A single prompt can activate many forces and
 * therefore compose a different trajectory from another prompt using the same
 * nouns. The weights express how strongly a covered operation supports the
 * corresponding mechanic; they are not domain preferences.
 */
const RULES: MechanicRule[] = [
  { mechanic: "anticipation", operations: ["hook", "threshold"], weight: 1.25 },
  { mechanic: "uncertainty", operations: ["threshold", "encounter", "reveal"], weight: 1.4 },
  { mechanic: "suspense", operations: ["threshold", "encounter", "reveal"], weight: 1.45 },
  { mechanic: "discovery", operations: ["discovery", "reveal"], weight: 1.35 },
  { mechanic: "surprise", operations: ["reveal", "transformation"], weight: 1.3 },
  { mechanic: "reversal", operations: ["reveal", "transformation"], weight: 1.35 },
  { mechanic: "participation", operations: ["action", "feedback"], weight: 1.15 },
  { mechanic: "agency", operations: ["action", "feedback", "next_step"], weight: 1.35 },
  { mechanic: "consequence", operations: ["action", "feedback", "transformation"], weight: 1.4 },
  { mechanic: "competition", operations: ["challenge", "escalation"], weight: 1.3 },
  { mechanic: "mastery", operations: ["challenge", "feedback", "milestone"], weight: 1.35 },
  { mechanic: "contribution", operations: ["encounter", "contribution", "feedback"], weight: 1.2 },
  { mechanic: "authorship", operations: ["action", "contribution", "identity"], weight: 1.3 },
  { mechanic: "reciprocity", operations: ["encounter", "action", "feedback"], weight: 1.2 },
  { mechanic: "accumulation", operations: ["contribution", "milestone"], weight: 1.2 },
  { mechanic: "momentum", operations: ["encounter", "escalation", "next_step"], weight: 1.3 },
  { mechanic: "escalation", operations: ["escalation"], weight: 1.45 },
  { mechanic: "transformation", operations: ["transformation"], weight: 1.5 },
  { mechanic: "contrast", operations: ["orientation", "transformation"], weight: 1.0 },
  { mechanic: "reveal", operations: ["reveal"], weight: 1.3 },
  { mechanic: "memory", operations: ["origin", "reflection"], weight: 1.25 },
  { mechanic: "ritual", operations: ["origin", "action", "continuation"], weight: 1.15 },
  { mechanic: "continuation", operations: ["continuation"], weight: 1.35 },
  { mechanic: "adaptation", operations: ["feedback", "next_step"], weight: 1.2 },
  { mechanic: "pampering", operations: ["encounter", "transformation"], weight: 1.15 },
  { mechanic: "indulgence", operations: ["encounter", "escalation", "transformation"], weight: 1.35 },
  { mechanic: "excess", operations: ["escalation", "payoff"], weight: 1.25 },
  { mechanic: "spectacle", operations: ["encounter", "escalation", "payoff"], weight: 1.3 },
  { mechanic: "delight", operations: ["encounter", "transformation", "payoff"], weight: 1.2 },
  { mechanic: "euphoria", operations: ["escalation", "payoff"], weight: 1.3 },
  { mechanic: "celebration", operations: ["encounter", "milestone", "payoff"], weight: 1.15 },
  { mechanic: "prestige", operations: ["threshold", "identity", "payoff"], weight: 1.15 },
  { mechanic: "novelty", operations: ["discovery", "reveal"], weight: 1.1 },
  { mechanic: "curation", operations: ["discovery", "action", "feedback"], weight: 1.0 },
  { mechanic: "scarcity", operations: ["threshold", "challenge", "unlock"], weight: 1.2 },
  { mechanic: "recognition", operations: ["identity", "milestone", "payoff"], weight: 1.15 },
  { mechanic: "ownership", operations: ["identity", "milestone", "payoff"], weight: 1.1 },
  { mechanic: "legacy", operations: ["reflection", "provenance", "continuation"], weight: 1.3 },
  { mechanic: "resonance", operations: ["reflection", "payoff", "continuation"], weight: 1.2 },
  { mechanic: "intimacy", operations: ["encounter", "reflection", "payoff"], weight: 1.05 },
  { mechanic: "catharsis", operations: ["escalation", "transformation", "payoff"], weight: 1.35 },
  { mechanic: "relief", operations: ["challenge", "payoff"], weight: 1.15 },
  { mechanic: "wonder", operations: ["threshold", "discovery", "reveal"], weight: 1.25 },
  { mechanic: "awe", operations: ["encounter", "escalation", "payoff"], weight: 1.25 },
  { mechanic: "embodiment", operations: ["threshold", "action", "feedback"], weight: 1.15 },
  { mechanic: "immersion", operations: ["threshold", "encounter", "transformation"], weight: 1.2 },
];

/**
 * StoryBeatKind is intentionally finite in the shared contract. Vocabulary
 * terms therefore compose through existing primitives rather than inventing a
 * parallel private beat taxonomy. Keep this table explicit so a vocabulary
 * addition cannot silently disappear from trajectory generation.
 */
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

function activeSignals(
  signals: MechanicSignal[],
): MechanicSignal[] {
  return signals
    .filter((signal) => signal.confidence >= 0.7)
    .sort((a, b) => b.confidence - a.confidence);
}

function ruleFor(mechanic: ExperienceMechanic): MechanicRule | undefined {
  return RULES.find((candidate) => candidate.mechanic === mechanic);
}

function deriveOperations(
  signals: MechanicSignal[],
  plan?: CognitiveExperiencePlan,
): StoryBeatKind[] {
  const active = activeSignals(signals);
  const operations: StoryBeatKind[] = [];

  for (const signal of active) {
    const rule = ruleFor(signal.mechanic);
    if (!rule) continue;
    operations.push(...rule.operations);
  }

  /*
   * Cognitive realization directives are semantic commitments, not a canned
   * story template. Mechanics may derive additional operations, but they may
   * never erase an operation cognition explicitly decided must occur.
   */
  operations.push(
    ...(plan?.realization?.directives?.map((directive) => directive.kind) ?? []),
  );

  /* Causal floor: every trajectory needs an experiential entry point. */
  if (!operations.some((beat) =>
    ["orientation", "hook", "threshold", "origin"].includes(beat),
  )) {
    operations.unshift("orientation");
  }

  /*
   * If escalation is active without a grounded interaction, give it a concrete
   * state to act upon. This is a causal safeguard, not a genre insertion.
   */
  if (
    operations.includes("escalation") &&
    !operations.some((beat) => ["encounter", "action", "challenge", "contribution"].includes(beat))
  ) {
    operations.push("encounter");
  }

  /* Every meaningful trajectory needs a state-changing middle. */
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

  /* Resolve unless cognition explicitly describes an open-ended continuation. */
  if (!operations.includes("payoff")) {
    operations.push("payoff");
  }

  return unique(operations)
    .filter((beat) => PHASE[beat] !== undefined)
    .sort((a, b) => PHASE[a] - PHASE[b]);
}

function scoreTrajectory(
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
): number {
  const active = activeSignals(signals);
  let score = 0;

  for (const signal of active) {
    const rule = ruleFor(signal.mechanic);
    if (!rule) continue;

    const coverage = rule.operations.filter((operation) =>
      beats.includes(operation),
    ).length;

    score +=
      signal.confidence *
      rule.weight *
      (coverage / rule.operations.length);
  }

  if (beats.includes("payoff")) score += 0.75;

  /*
   * Reward enough structural room for an actual experience without imposing a
   * seven-beat template. Rich prompts may legitimately produce many operations.
   */
  if (beats.length >= 4) score += 0.35;
  if (beats.length >= 4 && beats.length <= 12) score += 0.25;

  /* Reward causal development rather than a pile of disconnected beats. */
  for (let index = 1; index < beats.length; index += 1) {
    if (PHASE[beats[index]] > PHASE[beats[index - 1]]) {
      score += 0.08;
    }
  }

  /* Reward an actual interaction -> feedback -> state-change chain. */
  if (
    beats.includes("action") &&
    beats.includes("feedback") &&
    (beats.includes("transformation") || beats.includes("payoff"))
  ) {
    score += 0.4;
  }

  return Number(score.toFixed(3));
}

function rationale(
  signals: MechanicSignal[],
): string[] {
  return activeSignals(signals).map(
    (signal) =>
      `${signal.mechanic}: ${signal.evidence.join("; ")}`,
  );
}

/**
 * Derive narrative structure from experiential mechanics.
 *
 * This is intentionally downstream of cognition and upstream of language.
 * The compiler asks what behavioral forces are present, what operations those
 * forces require, and what sequence lets those operations causally unfold.
 *
 * Novel domains are therefore handled through combinations of mechanics rather
 * than domain-specific templates.
 */
export function composeCognitiveTrajectory(args: {
  plan?: CognitiveExperiencePlan;
  prompt?: string;
}): CognitiveTrajectory {
  const mechanics = inferExperienceMechanics({
    plan: args.plan,
    premise: args.plan?.premise,
    prompt: args.prompt,
  });

  const beats = deriveOperations(mechanics, args.plan);

  return {
    beats,
    mechanics,
    score: scoreTrajectory(beats, mechanics),
    rationale: rationale(mechanics),
  };
}