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
 *       -> observable event pressure
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

export type CognitiveEventPressure = {
  mechanic: ExperienceMechanic;
  beat: StoryBeatKind;
  force: string;
  observableChange: string;
  causalRequirement: string;
};

export type CognitiveTrajectory = {
  beats: StoryBeatKind[];
  mechanics: MechanicSignal[];
  eventPressure: CognitiveEventPressure[];
  score: number;
  rationale: string[];
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

/**
 * A mechanic is a behavioral constraint, not a prose adjective.
 *
 * These pressures deliberately describe what must change in the world. They
 * contain no domain nouns and therefore remain reusable across dogs, weddings,
 * cars, businesses, memories, horror, luxury, and arbitrary future prompts.
 */
const PRESSURE: Record<ExperienceMechanic, {
  force: string;
  observableChange: string;
  causalRequirement: string;
}> = {
  anticipation: {
    force: "build expectation",
    observableChange: "something approaches or becomes imminent",
    causalRequirement: "the next beat must provide evidence that the expected event is getting closer",
  },
  uncertainty: {
    force: "withhold certainty",
    observableChange: "important information remains unavailable or ambiguous",
    causalRequirement: "the next beat must preserve an unresolved question until evidence changes it",
  },
  suspense: {
    force: "delay resolution under pressure",
    observableChange: "a threat, risk, or unknown condition becomes harder to ignore",
    causalRequirement: "each beat must increase what is at stake or reduce safe options before release",
  },
  discovery: {
    force: "reveal a previously unavailable layer",
    observableChange: "new information changes the current situation",
    causalRequirement: "a concrete clue, object, action, or observation must cause the new knowledge",
  },
  surprise: {
    force: "break the immediate expectation",
    observableChange: "an unexpected but defensible condition appears",
    causalRequirement: "the turn must be caused by evidence already available in the experience",
  },
  reversal: {
    force: "change the meaning or direction of the current state",
    observableChange: "what seemed true no longer governs the situation",
    causalRequirement: "a new fact or consequence must force the reversal",
  },
  participation: {
    force: "require an action from a participant",
    observableChange: "the participant's action changes available state",
    causalRequirement: "a visible response must follow the participant's action",
  },
  agency: {
    force: "make choice consequential",
    observableChange: "different choices produce different immediate conditions",
    causalRequirement: "the world must visibly respond to the chosen action",
  },
  consequence: {
    force: "make action matter through result",
    observableChange: "an earlier action produces a later condition",
    causalRequirement: "the later state must be traceable to the earlier action",
  },
  competition: {
    force: "create comparative pressure",
    observableChange: "one attempt must answer or exceed another",
    causalRequirement: "the next attempt must respond to the current benchmark",
  },
  mastery: {
    force: "increase capability through feedback",
    observableChange: "performance improves or clears a harder threshold",
    causalRequirement: "feedback from the previous attempt must affect the next attempt",
  },
  contribution: {
    force: "let an addition alter the shared result",
    observableChange: "a new contribution becomes part of the available state",
    causalRequirement: "later beats must contain evidence of what was added",
  },
  authorship: {
    force: "make the participant's creation identifiable",
    observableChange: "the result bears evidence of who shaped it",
    causalRequirement: "the authored change must persist into a later beat",
  },
  reciprocity: {
    force: "make interaction produce a response",
    observableChange: "one side responds to what the other did",
    causalRequirement: "the response must reference or alter the preceding action",
  },
  accumulation: {
    force: "stack additions over time",
    observableChange: "the current state contains more than it did before",
    causalRequirement: "each addition must remain available to affect a later state",
  },
  momentum: {
    force: "make the current state propel the next event",
    observableChange: "one event creates pressure for another",
    causalRequirement: "the next beat must follow from the changed current state",
  },
  escalation: {
    force: "increase the magnitude or consequence of the current condition",
    observableChange: "the next condition exceeds the previous condition",
    causalRequirement: "the next event must be measurably more consequential, elaborate, intense, or extreme than what preceded it",
  },
  transformation: {
    force: "change the subject or situation",
    observableChange: "the before-state and after-state are visibly different",
    causalRequirement: "the change must result from events that occurred in the trajectory",
  },
  contrast: {
    force: "make the difference between states visible",
    observableChange: "two conditions are placed against each other",
    causalRequirement: "the later condition must make the earlier condition legible by comparison",
  },
  reveal: {
    force: "make hidden information visible",
    observableChange: "a previously hidden detail becomes available",
    causalRequirement: "the reveal must expose a concrete detail rather than explain its significance",
  },
  memory: {
    force: "let prior evidence alter the present",
    observableChange: "a remembered detail appears and changes what happens now",
    causalRequirement: "the present beat must contain a concrete trace of the prior memory",
  },
  ritual: {
    force: "repeat a recognizable meaningful action",
    observableChange: "a recurring action is performed again or completed",
    causalRequirement: "the repeated action must visibly connect this occurrence to earlier or later occurrences",
  },
  continuation: {
    force: "leave the current state available for another interaction",
    observableChange: "something from this experience remains available afterward",
    causalRequirement: "a later interaction must have something concrete to pick up or change",
  },
  adaptation: {
    force: "change the next action in response to current state",
    observableChange: "the next behavior differs because of what just happened",
    causalRequirement: "the preceding result must be identifiable as the reason for the adaptation",
  },
  pampering: {
    force: "increase care delivered to the subject",
    observableChange: "the subject receives another concrete layer of care",
    causalRequirement: "each care action must produce a visible condition that permits the next one",
  },
  indulgence: {
    force: "add optional luxury beyond necessity",
    observableChange: "the experience gains an unnecessary but desirable layer",
    causalRequirement: "the next indulgence must build on the current level rather than merely rename it",
  },
  excess: {
    force: "push beyond ordinary sufficiency",
    observableChange: "the result becomes conspicuously more elaborate than necessary",
    causalRequirement: "the excess must be visible in an added action, object, scale, or consequence",
  },
  spectacle: {
    force: "make the event increasingly visible or impressive",
    observableChange: "more people, scale, motion, or visual consequence enters the scene",
    causalRequirement: "the spectacle must grow from what has already happened",
  },
  delight: {
    force: "produce an unexpectedly satisfying response",
    observableChange: "the subject or participant reacts positively to a concrete turn",
    causalRequirement: "the response must be caused by the preceding event",
  },
  euphoria: {
    force: "build toward an intensified positive peak",
    observableChange: "energy and response visibly rise toward a peak",
    causalRequirement: "each escalation must increase observable participation or intensity",
  },
  celebration: {
    force: "mark an achieved or shared occasion",
    observableChange: "people perform a recognizable celebratory act",
    causalRequirement: "the celebration must follow a concrete achievement or occasion",
  },
  prestige: {
    force: "increase perceived status or exclusivity",
    observableChange: "access, treatment, setting, or recognition becomes more exclusive",
    causalRequirement: "the elevated status must be shown through changed treatment or access",
  },
  novelty: {
    force: "introduce something not previously encountered",
    observableChange: "a genuinely new element enters the situation",
    causalRequirement: "the new element must alter attention or available action",
  },
  curation: {
    force: "select among available elements deliberately",
    observableChange: "one chosen element changes what follows",
    causalRequirement: "the selection must constrain or shape the next event",
  },
  scarcity: {
    force: "limit availability",
    observableChange: "access becomes narrower or time becomes more constrained",
    causalRequirement: "the limitation must affect the next available choice",
  },
  recognition: {
    force: "identify a person or contribution as significant",
    observableChange: "the subject receives explicit acknowledgment",
    causalRequirement: "the recognition must be tied to a concrete contribution or history",
  },
  ownership: {
    force: "transfer or affirm possession",
    observableChange: "something becomes identifiable as belonging to someone",
    causalRequirement: "the ownership state must persist into a later beat",
  },
  legacy: {
    force: "carry a concrete contribution forward",
    observableChange: "something created or remembered remains available after the original moment",
    causalRequirement: "the later state must contain evidence of what was carried forward",
  },
  resonance: {
    force: "connect the current event to another meaningful state",
    observableChange: "a detail from one state changes how another state is perceived",
    causalRequirement: "the connection must be shown through a concrete shared detail",
  },
  intimacy: {
    force: "narrow attention toward a personal exchange",
    observableChange: "the interaction becomes more specific to the people involved",
    causalRequirement: "a personal detail or response must affect the next beat",
  },
  catharsis: {
    force: "release accumulated emotional pressure",
    observableChange: "a held tension breaks into an observable response or action",
    causalRequirement: "the release must follow the pressure built earlier",
  },
  relief: {
    force: "remove a previously active burden or threat",
    observableChange: "a constrained state becomes easier or safer",
    causalRequirement: "the relief must be caused by the resolution of the earlier problem",
  },
  wonder: {
    force: "expand perceived possibility through discovery",
    observableChange: "a newly revealed condition is more remarkable than expected",
    causalRequirement: "the remarkable turn must come from a concrete discovery",
  },
  awe: {
    force: "increase scale beyond ordinary expectation",
    observableChange: "size, intensity, beauty, or consequence becomes visibly greater",
    causalRequirement: "the increased scale must be shown through a changed scene state",
  },
  embodiment: {
    force: "make the participant physically or behaviorally enact the experience",
    observableChange: "the participant performs an action rather than only observing",
    causalRequirement: "the performed action must alter the next available state",
  },
  immersion: {
    force: "increase environmental involvement",
    observableChange: "more of the surrounding world becomes active in the experience",
    causalRequirement: "the added environment must affect attention or action",
  },
};

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

function deriveEventPressure(
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
): CognitiveEventPressure[] {
  const pressures: CognitiveEventPressure[] = [];

  for (const signal of activeSignals(signals)) {
    const rule = ruleFor(signal.mechanic);
    const pressure = PRESSURE[signal.mechanic];
    if (!rule || !pressure) continue;

    for (const beat of rule.operations) {
      if (!beats.includes(beat)) continue;
      pressures.push({
        mechanic: signal.mechanic,
        beat,
        force: pressure.force,
        observableChange: pressure.observableChange,
        causalRequirement: pressure.causalRequirement,
      });
    }
  }

  return pressures;
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

  operations.push(
    ...(plan?.realization?.directives?.map((directive) => directive.kind) ?? []),
  );

  if (!operations.some((beat) =>
    ["orientation", "hook", "threshold", "origin"].includes(beat),
  )) {
    operations.unshift("orientation");
  }

  if (
    operations.includes("escalation") &&
    !operations.some((beat) => ["encounter", "action", "challenge", "contribution"].includes(beat))
  ) {
    operations.push("encounter");
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
  if (beats.length >= 4) score += 0.35;
  if (beats.length >= 4 && beats.length <= 12) score += 0.25;

  for (let index = 1; index < beats.length; index += 1) {
    if (PHASE[beats[index]] > PHASE[beats[index - 1]]) {
      score += 0.08;
    }
  }

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
    eventPressure: deriveEventPressure(beats, mechanics),
    score: scoreTrajectory(beats, mechanics),
    rationale: rationale(mechanics),
  };
}
