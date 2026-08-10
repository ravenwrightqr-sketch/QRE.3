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

const RULES: MechanicRule[] = [
  {
    mechanic: "uncertainty",
    operations: ["threshold", "encounter", "reveal"],
    weight: 1.4,
  },
  {
    mechanic: "discovery",
    operations: ["discovery", "reveal"],
    weight: 1.35,
  },
  {
    mechanic: "participation",
    operations: ["action", "feedback"],
    weight: 1.15,
  },
  {
    mechanic: "competition",
    operations: ["challenge", "escalation"],
    weight: 1.3,
  },
  {
    mechanic: "contribution",
    operations: ["encounter", "contribution", "feedback"],
    weight: 1.2,
  },
  {
    mechanic: "accumulation",
    operations: ["contribution", "milestone"],
    weight: 1.2,
  },
  {
    mechanic: "escalation",
    operations: ["escalation"],
    weight: 1.45,
  },
  {
    mechanic: "transformation",
    operations: ["transformation"],
    weight: 1.5,
  },
  {
    mechanic: "contrast",
    operations: ["orientation", "transformation"],
    weight: 1.0,
  },
  {
    mechanic: "reveal",
    operations: ["reveal"],
    weight: 1.3,
  },
  {
    mechanic: "memory",
    operations: ["origin", "reflection"],
    weight: 1.25,
  },
  {
    mechanic: "pampering",
    operations: ["encounter", "transformation"],
    weight: 1.15,
  },
  {
    mechanic: "excess",
    operations: ["escalation"],
    weight: 1.2,
  },
  {
    mechanic: "adaptation",
    operations: ["feedback", "next_step"],
    weight: 1.2,
  },
  {
    mechanic: "continuation",
    operations: ["continuation"],
    weight: 1.35,
  },
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

function activeSignals(
  signals: MechanicSignal[],
): MechanicSignal[] {
  return signals
    .filter((signal) => signal.confidence >= 0.7)
    .sort((a, b) => b.confidence - a.confidence);
}

function deriveOperations(
  signals: MechanicSignal[],
): StoryBeatKind[] {
  const active = activeSignals(signals);
  const operations: StoryBeatKind[] = [];

  for (const signal of active) {
    const rule = RULES.find(
      (candidate) => candidate.mechanic === signal.mechanic,
    );

    if (!rule) continue;

    operations.push(...rule.operations);
  }

  /*
   * Every trajectory needs an experiential entry point.
   * This is not a domain template: it is the minimum causal condition
   * required before an experience can begin moving.
   */
  if (!operations.some((beat) =>
    ["orientation", "hook", "threshold", "origin"].includes(beat),
  )) {
    operations.unshift("orientation");
  }

  /*
   * Every meaningful trajectory needs a state-changing middle.
   * Prefer the operation actually implied by the mechanics.
   */
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

  /*
   * A derived experience should resolve unless the semantics explicitly
   * describe an open-ended continuation.
   */
  if (!operations.includes("payoff")) {
    operations.push("payoff");
  }

  return unique(operations)
    .sort((a, b) => PHASE[a] - PHASE[b]);
}

function scoreTrajectory(
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
): number {
  const active = activeSignals(signals);
  let score = 0;

  for (const signal of active) {
    const rule = RULES.find(
      (candidate) => candidate.mechanic === signal.mechanic,
    );

    if (!rule) continue;

    const coverage = rule.operations.filter((operation) =>
      beats.includes(operation),
    ).length;

    score +=
      signal.confidence *
      rule.weight *
      (coverage / rule.operations.length);
  }

  if (beats.includes("payoff")) {
    score += 0.75;
  }

  if (beats.length >= 3 && beats.length <= 7) {
    score += 0.5;
  }

  /*
   * Reward causal development rather than a pile of disconnected beats.
   */
  for (let index = 1; index < beats.length; index += 1) {
    if (PHASE[beats[index]] > PHASE[beats[index - 1]]) {
      score += 0.08;
    }
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
 *
 * The compiler does NOT ask:
 *
 *   "What industry is this?"
 *
 * It asks:
 *
 *   "What behavioral forces are present?"
 *   "What operations do those forces require?"
 *   "What sequence lets those operations causally unfold?"
 *
 * Consequently, novel domains are handled through combinations of mechanics
 * rather than domain-specific templates.
 */
export function composeCognitiveTrajectory(args: {
  plan?: CognitiveExperiencePlan;
}): CognitiveTrajectory {
  const mechanics = inferExperienceMechanics({
    plan: args.plan,
    premise: args.plan?.premise,
  });

  const beats = deriveOperations(mechanics);

  return {
    beats,
    mechanics,
    score: scoreTrajectory(beats, mechanics),
    rationale: rationale(mechanics),
  };
}