import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  ExperienceTone,
} from "@qre/contracts";

/**
 * COGNITIVE EXPERIENCE MECHANICS
 *
 * This module is deliberately domain-neutral.
 *
 * A mechanic describes how an experience behaves, not what industry or noun it
 * belongs to. New prompts should be explainable through combinations of these
 * operations rather than by adding a new dog/concert/spa/birthday branch.
 */

export type ExperienceMechanic =
  | "accumulation"
  | "escalation"
  | "transformation"
  | "reveal"
  | "discovery"
  | "contrast"
  | "participation"
  | "competition"
  | "contribution"
  | "uncertainty"
  | "excess"
  | "pampering"
  | "memory"
  | "continuation"
  | "adaptation";

export type MechanicSignal = {
  mechanic: ExperienceMechanic;
  confidence: number;
  evidence: string[];
};

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const lower = (value: string) => clean(value).toLowerCase();

function unique(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function planValues(plan: CognitiveExperiencePlan | undefined): string[] {
  if (!plan) return [];

  return unique([
    plan.centralSubject,
    plan.purpose,
    ...(plan.audience ?? []),
    ...(plan.emotionalIntent ?? []),
    ...(plan.interactionModel ?? []),
    ...(plan.storyStructure ?? []),
    ...(plan.memoryModel ?? []),
    ...(plan.socialModel ?? []),
    ...(plan.discoveryModel ?? []),
    ...(plan.rewardModel ?? []),
    ...(plan.progressionModel ?? []),
    ...(plan.contentModel ?? []),
    ...(plan.dynamicBehavior ?? []),
    ...(plan.futureEvolution ?? []),
    ...(plan.creativePossibilities ?? []),
  ]);
}

function premiseValues(
  premise: CognitivePremise | undefined,
  role?: CognitivePremiseRole,
): string[] {
  return unique(
    premise?.slots
      .filter((slot) => !role || slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function toneMechanics(tone: ExperienceTone[]): ExperienceMechanic[] {
  const result: ExperienceMechanic[] = [];

  if (tone.includes("playful")) {
    result.push("contrast", "escalation", "participation");
  }

  if (tone.includes("energetic")) {
    result.push("escalation", "participation");
  }

  if (tone.includes("mysterious")) {
    result.push("uncertainty", "discovery", "reveal");
  }

  if (tone.includes("emotional")) {
    result.push("memory", "continuation");
  }

  return result;
}

/**
 * Derive reusable experiential operations from conserved semantics.
 * The result is ranked and evidence-backed so downstream trajectory selection
 * can inspect why a mechanic was selected.
 *
 * IMPORTANT:
 * Explicit cognitive-plan semantics outrank lexical guesses. If cognition has
 * already decided that an experience adapts, remembers, or continues, that
 * decision must survive this boundary even when the surface wording changes.
 */
export function inferExperienceMechanics(args: {
  plan?: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  tone?: ExperienceTone[];
}): MechanicSignal[] {
  const { plan, premise = plan?.premise, tone = [] } = args;

  const corpus = lower([
    ...planValues(plan),
    ...premiseValues(premise),
    ...tone,
  ].join(" "));

  const roleCorpus = lower([
    ...premiseValues(premise, "transformation"),
    ...premiseValues(premise, "outcome"),
    ...premiseValues(premise, "emotion"),
    ...premiseValues(premise, "affordance"),
    ...premiseValues(premise, "temporal"),
    ...premiseValues(premise, "social"),
  ].join(" "));

  const scores = new Map<ExperienceMechanic, { score: number; evidence: string[] }>();

  const add = (
    mechanic: ExperienceMechanic,
    score: number,
    evidence: string,
  ) => {
    const current = scores.get(mechanic) ?? { score: 0, evidence: [] };
    current.score += score;
    current.evidence.push(evidence);
    scores.set(mechanic, current);
  };

  // Cognitive-plan commitments are hard semantic signals. They must survive
  // realization even when the prompt's lexical surface does not repeat them.
  if (plan?.memoryModel?.length || plan?.direction === "memory") {
    add("memory", 1, "cognitive plan explicitly carries memory semantics");
  }

  if (plan?.dynamicBehavior?.length) {
    add("adaptation", 1, "cognitive plan explicitly requires adaptive behavior");
  }

  if (plan?.futureEvolution?.length) {
    add("continuation", 1, "cognitive plan explicitly carries future evolution");
  }

  if (plan?.progressionModel?.length) {
    add("escalation", 0.55, "cognitive plan explicitly defines progression");
  }

  if (plan?.interactionModel?.length) {
    add("participation", 0.35, "cognitive plan defines participant interaction");
  }

  if (has(corpus, /\b(?:add|adding|contribute|contribution|accumulate|accumulating|grows?|versions?|folklore|mythology)\b/)) {
    add("accumulation", 0.95, "material compounds or competing versions can grow");
    add("contribution", 0.8, "participants can add material");
  }

  if (has(corpus, /\b(?:escalat|increasingly|more and more|wild|ridiculous|bigger|worse|extreme|over the top)\b/)) {
    add("escalation", 0.96, "the premise explicitly asks for increasing intensity");
  }

  if (has(corpus, /\b(?:transform|change|before and after|becomes?|turn(?:s|ed)? .* into|groom|clean|restore|makeover|pamper)\b/)) {
    add("transformation", 0.95, "a state change is central to the premise");
  }

  if (has(corpus, /\b(?:reveal|hidden|secret|uncover|unknown|expose|forgotten)\b/)) {
    add("reveal", 0.94, "information is intentionally withheld then exposed");
    add("discovery", 0.82, "the participant must encounter something not initially visible");
  }

  if (has(corpus, /\b(?:discover|explore|find|hunt|clue|mystery|portal|encounter)\b/)) {
    add("discovery", 0.94, "the premise asks for exploration or finding");
  }

  if (has(corpus, /\b(?:boring|ordinary|routine|mundane|before|after|unexpected|surprise)\b/)) {
    add("contrast", 0.84, "the experience gains force from a baseline or reversal");
  }

  if (has(corpus, /\b(?:scan|participate|join|play|interact|touch|choose|vote|share)\b/)) {
    add("participation", 0.9, "the participant performs an action that changes the experience");
  }

  if (has(corpus, /\b(?:compete|competition|race|versus|vs\.?|winner|challenge|score)\b/)) {
    add("competition", 0.95, "participants are compared against a challenge or one another");
  }

  if (has(corpus, /\b(?:terror|terrifying|haunted|horror|dread|fear|threat|danger|creepy|unknown)\b/)) {
    add("uncertainty", 0.96, "threat or uncertainty should intensify over time");
    add("escalation", 0.72, "horror gains force from increasing threat");
  }

  if (has(corpus, /\b(?:absurd|billionaire|luxury|lavish|opulent|ridiculous|excess|indulgent|over the top)\b/)) {
    add("excess", 0.97, "the premise rewards disproportion and indulgence");
  }

  if (has(corpus, /\b(?:spa|groom|groomer|pamper|poodle|princess|royal|treatments?)\b/)) {
    add("pampering", 0.92, "care is part of the premise and should become an experiential behavior");
  }

  if (has(corpus, /\b(?:memory|remember|history|legacy|photograph|folklore|nostalgia|keepsake|memorial)\b/)) {
    add("memory", 0.96, "past experience should affect present meaning");
  }

  if (has(corpus, /\b(?:again|return|next time|future|later|continues?|grows?|evolv|revisit)\b/)) {
    add("continuation", 0.95, "the experience has an explicit future state");
  }

  if (has(corpus, /\b(?:adaptive|preference|prefers?|history|previous|remembered|changes based|learns?)\b/)) {
    add("adaptation", 0.96, "prior state should change the next realization");
  }

  for (const mechanic of toneMechanics(tone)) {
    add(mechanic, 0.45, `tone implies ${mechanic} behavior`);
  }

  if (roleCorpus.includes("transformation")) {
    add("transformation", 0.5, "conserved premise explicitly contains transformation evidence");
  }

  return [...scores.entries()]
    .map(([mechanic, value]) => ({
      mechanic,
      confidence: Math.min(1, value.score),
      evidence: unique(value.evidence),
    }))
    .sort((a, b) => b.confidence - a.confidence || a.mechanic.localeCompare(b.mechanic));
}

/**
 * Produce a compact behavioral brief for trajectory generation.
 */
export function mechanicBrief(signals: MechanicSignal[]): string[] {
  return signals
    .filter((signal) => signal.confidence >= 0.7)
    .map((signal) => signal.mechanic);
}
