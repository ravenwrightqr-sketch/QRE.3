/**
 * =============================================================================
 * COGNITIVE TRAJECTORY
 * =============================================================================
 *
 * Convert experiential mechanics into a causal, variable story trajectory.
 *
 * This layer is deliberately downstream of cognition and upstream of prose.
 * It does not know what a dog, restaurant, concert, spa, wedding, product, or
 * event is. It only knows behavioral forces and the primitive operations that
 * can realize them.
 *
 * NEXT-LEVEL RULE:
 * ----------------
 * Do not select one canned beat sequence. Generate competing trajectories,
 * score them for mechanic coverage and causal coherence, then keep the best
 * one. The same prompt can therefore produce a materially different shape
 * when its cognitive forces differ.
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

export type CognitiveTrajectoryCandidate = {
  id: string;
  beats: StoryBeatKind[];
  score: number;
  rationale: string[];
};

export type CognitiveTrajectory = {
  beats: StoryBeatKind[];
  mechanics: MechanicSignal[];
  score: number;
  rationale: string[];
  candidates: CognitiveTrajectoryCandidate[];
};

type MechanicRule = {
  mechanic: ExperienceMechanic;
  operations: StoryBeatKind[];
  weight: number;
};

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

function ruleFor(mechanic: ExperienceMechanic): MechanicRule | undefined {
  return RULES.find((candidate) => candidate.mechanic === mechanic);
}

function operationAffinity(
  operation: StoryBeatKind,
  signals: MechanicSignal[],
): number {
  let score = 0;

  for (const signal of activeSignals(signals)) {
    const rule = ruleFor(signal.mechanic);
    if (!rule || !rule.operations.includes(operation)) continue;
    score += signal.confidence * rule.weight;
  }

  return score;
}

/**
 * Small causal transition model. It is intentionally expressed in terms of
 * operations rather than genres. The search uses it as a local preference,
 * while mechanic coverage remains the dominant score.
 */
const TRANSITIONS: Partial<Record<StoryBeatKind, Partial<Record<StoryBeatKind, number>>>> = {
  orientation: { hook: 0.8, threshold: 0.7, encounter: 0.45 },
  hook: { threshold: 0.8, encounter: 0.7, challenge: 0.55, discovery: 0.55 },
  need: { threshold: 0.8, action: 0.7, challenge: 0.65 },
  threshold: { encounter: 0.9, discovery: 0.85, action: 0.7, challenge: 0.7 },
  origin: { encounter: 0.7, reflection: 0.65, action: 0.6 },
  encounter: { challenge: 0.75, discovery: 0.8, action: 0.7, contribution: 0.75, escalation: 0.55 },
  challenge: { action: 0.85, discovery: 0.6, escalation: 0.8, feedback: 0.65 },
  discovery: { reveal: 0.9, action: 0.65, encounter: 0.55 },
  reveal: { transformation: 0.8, action: 0.65, escalation: 0.75, reflection: 0.5 },
  action: { feedback: 0.95, consequence: 0.65, transformation: 0.55, discovery: 0.5 },
  feedback: { challenge: 0.6, transformation: 0.85, escalation: 0.7, next_step: 0.75, contribution: 0.6 },
  contribution: { feedback: 0.9, escalation: 0.65, milestone: 0.7 },
  escalation: { transformation: 0.9, payoff: 0.75, reveal: 0.7, challenge: 0.65 },
  transformation: { reflection: 0.65, milestone: 0.75, payoff: 0.9, next_step: 0.55 },
  reflection: { provenance: 0.7, payoff: 0.75, continuation: 0.85 },
  provenance: { identity: 0.55, continuation: 0.85, payoff: 0.65 },
  identity: { milestone: 0.7, payoff: 0.75, action: 0.45 },
  milestone: { unlock: 0.8, payoff: 0.85, continuation: 0.75 },
  unlock: { next_step: 0.8, payoff: 0.75, continuation: 0.65 },
  next_step: { encounter: 0.8, challenge: 0.7, discovery: 0.7, continuation: 0.7 },
  earned_access: { payoff: 0.8, next_step: 0.75 },
};

function transitionBonus(from: StoryBeatKind, to: StoryBeatKind): number {
  return TRANSITIONS[from]?.[to] ?? 0;
}

function deriveOperations(
  signals: MechanicSignal[],
  plan?: CognitiveExperiencePlan,
): StoryBeatKind[] {
  const operations: StoryBeatKind[] = [];

  for (const signal of activeSignals(signals)) {
    const rule = ruleFor(signal.mechanic);
    if (rule) operations.push(...rule.operations);
  }

  operations.push(
    ...(plan?.realization?.directives?.map((directive) => directive.kind) ?? []),
  );

  if (!operations.some((beat) => ["orientation", "hook", "threshold", "origin"].includes(beat))) {
    operations.unshift("orientation");
  }

  if (
    operations.includes("escalation") &&
    !operations.some((beat) => ["encounter", "action", "challenge", "contribution"].includes(beat))
  ) {
    operations.push("encounter");
  }

  if (
    !operations.some((beat) =>
      ["encounter", "action", "challenge", "discovery", "contribution", "transformation", "escalation"].includes(beat),
    )
  ) {
    operations.push("encounter");
  }

  if (!operations.includes("payoff")) operations.push("payoff");

  return unique(operations).filter((beat) => PHASE[beat] !== undefined);
}

function prerequisitePenalty(
  sequence: StoryBeatKind[],
  next: StoryBeatKind,
): number {
  if (next === "payoff" && sequence.length < 3) return -2.5;
  if (next === "transformation" && !sequence.some((beat) =>
    ["encounter", "action", "challenge", "discovery", "contribution", "reveal", "escalation"].includes(beat),
  )) return -1.8;
  if (next === "reflection" && !sequence.some((beat) =>
    ["action", "contribution", "transformation", "escalation", "reveal"].includes(beat),
  )) return -1.4;
  if (next === "continuation" && !sequence.includes("payoff")) return -1.1;
  if (next === "next_step" && !sequence.includes("feedback")) return -1.0;
  if (next === "feedback" && !sequence.some((beat) => ["action", "contribution", "challenge"].includes(beat))) return -1.4;
  return 0;
}

type SearchState = {
  beats: StoryBeatKind[];
  score: number;
};

/**
 * Beam-search a small operation space. This is the important architectural
 * change: trajectory shape is now an emergent result of mechanics + causal
 * compatibility, rather than a single sorted list of beat phases.
 */
function searchTrajectories(
  pool: StoryBeatKind[],
  signals: MechanicSignal[],
  plan?: CognitiveExperiencePlan,
): CognitiveTrajectoryCandidate[] {
  const starts: StoryBeatKind[] = ["orientation", "hook", "threshold", "origin"]
    .filter((beat) => pool.includes(beat));

  let beam: SearchState[] = starts.map((beat) => ({
    beats: [beat],
    score: operationAffinity(beat, signals) + (beat === "hook" ? 0.25 : 0),
  }));

  for (let depth = 1; depth < 10; depth += 1) {
    const next: SearchState[] = [];

    for (const state of beam) {
      const previous = state.beats.at(-1)!;

      for (const operation of pool) {
        if (state.beats.includes(operation)) continue;
        if (operation === "orientation" || operation === "hook" || operation === "origin" || operation === "threshold") {
          if (state.beats.length > 1) continue;
        }
        if (state.beats.includes("payoff") && operation !== "continuation" && operation !== "next_step") continue;

        const score =
          state.score +
          operationAffinity(operation, signals) +
          transitionBonus(previous, operation) +
          prerequisitePenalty(state.beats, operation) +
          (PHASE[operation] > PHASE[previous] ? 0.06 : -0.12);

        next.push({ beats: [...state.beats, operation], score });
      }
    }

    next.sort((a, b) => b.score - a.score);
    beam = next.slice(0, 24);
    if (!beam.length) break;
  }

  const candidates = beam
    .filter((state) => state.beats.length >= 4)
    .filter((state) => state.beats.includes("payoff"))
    .map((state, index) => {
      const score = scoreTrajectory(state.beats, signals, state.score);
      return {
        id: `trajectory-${index + 1}`,
        beats: state.beats,
        score,
        rationale: rationale(signals, state.beats),
      };
    });

  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      const key = candidate.beats.join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function scoreTrajectory(
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
  searchScore = 0,
): number {
  const active = activeSignals(signals);
  let score = searchScore * 0.35;

  for (const signal of active) {
    const rule = ruleFor(signal.mechanic);
    if (!rule) continue;

    const coverage = rule.operations.filter((operation) => beats.includes(operation)).length;
    const completeness = coverage / rule.operations.length;
    score += signal.confidence * rule.weight * completeness;

    // High-confidence mechanics that receive no realization should hurt the
    // trajectory. This is what stops a beautiful but semantically thin arc from
    // beating a less generic one that actually realizes the prompt.
    if (signal.confidence >= 0.85 && coverage === 0) {
      score -= 1.15 * signal.confidence;
    }
  }

  if (beats.includes("payoff")) score += 0.75;
  if (beats.length >= 4) score += 0.35;
  if (beats.length >= 4 && beats.length <= 12) score += 0.25;

  for (let index = 1; index < beats.length; index += 1) {
    if (PHASE[beats[index]] > PHASE[beats[index - 1]]) score += 0.08;
    score += transitionBonus(beats[index - 1], beats[index]) * 0.18;
  }

  if (
    beats.includes("action") &&
    beats.includes("feedback") &&
    (beats.includes("transformation") || beats.includes("payoff"))
  ) {
    score += 0.4;
  }

  if (
    beats.includes("discovery") &&
    beats.includes("reveal") &&
    beats.includes("payoff")
  ) {
    score += 0.35;
  }

  if (
    beats.includes("contribution") &&
    beats.includes("feedback") &&
    (beats.includes("milestone") || beats.includes("transformation"))
  ) {
    score += 0.35;
  }

  return Number(score.toFixed(3));
}

function rationale(
  signals: MechanicSignal[],
  beats: StoryBeatKind[],
): string[] {
  const active = activeSignals(signals);
  const realized = active.filter((signal) => {
    const rule = ruleFor(signal.mechanic);
    return rule?.operations.some((operation) => beats.includes(operation));
  });

  return realized.map(
    (signal) =>
      `${signal.mechanic}: ${signal.evidence.join("; ")}`,
  );
}

/**
 * Derive competing narrative structures from experiential mechanics and keep
 * the strongest causal candidate.
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

  const pool = deriveOperations(mechanics, args.plan);
  const candidates = searchTrajectories(pool, mechanics, args.plan);

  const fallbackBeats = unique(
    pool
      .sort((a, b) => PHASE[a] - PHASE[b])
      .slice(0, 12),
  );

  const selected = candidates[0] ?? {
    id: "trajectory-fallback",
    beats: fallbackBeats,
    score: scoreTrajectory(fallbackBeats, mechanics),
    rationale: rationale(mechanics, fallbackBeats),
  };

  return {
    beats: selected.beats,
    mechanics,
    score: selected.score,
    rationale: selected.rationale,
    candidates: [selected, ...candidates.filter((candidate) => candidate.id !== selected.id)],
  };
}
