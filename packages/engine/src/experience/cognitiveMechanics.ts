/**
 * =============================================================================
 * COGNITIVE EXPERIENCE MECHANICS
 * =============================================================================
 *
 * GOAL
 * ----
 * Convert conserved cognitive meaning into reusable experiential forces that
 * can drive any prompt into concrete experience without domain templates.
 *
 * PURPOSE
 * -------
 * This is the behavioral vocabulary layer between cognition and trajectory.
 * Mechanics describe what an experience does to a participant or how its state
 * evolves: discovery, agency, suspense, spectacle, indulgence, mastery,
 * memory, consequence, legacy, and so on.
 *
 * The compiler must never need a new dog/concert/spa/birthday branch merely
 * because a new noun appears. New nouns inherit these forces compositionally.
 * Lexical evidence is a signal; conserved premise structure remains the source
 * of truth and no mechanic is permission to invent facts.
 */

import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  ExperienceTone,
} from "@qre/contracts";

import { COGNITIVE_VOCABULARY } from "./cognitiveVocabulary.js";

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
  | "adaptation"
  | "anticipation"
  | "suspense"
  | "surprise"
  | "agency"
  | "mastery"
  | "novelty"
  | "spectacle"
  | "indulgence"
  | "delight"
  | "euphoria"
  | "celebration"
  | "prestige"
  | "ritual"
  | "authorship"
  | "reciprocity"
  | "resonance"
  | "intimacy"
  | "catharsis"
  | "relief"
  | "reversal"
  | "momentum"
  | "scarcity"
  | "curation"
  | "embodiment"
  | "immersion"
  | "ownership"
  | "consequence"
  | "recognition"
  | "legacy"
  | "wonder"
  | "awe";

export type MechanicSignal = {
  mechanic: ExperienceMechanic;
  confidence: number;
  evidence: string[];
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

function unique(values: readonly unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function planValues(plan: CognitiveExperiencePlan | undefined): string[] {
  if (!plan) return [];

  return unique([
    plan.centralSubject,
    plan.purpose,
    plan.direction,
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
    result.push("contrast", "escalation", "participation", "surprise", "delight");
  }

  if (tone.includes("energetic")) {
    result.push("escalation", "participation", "momentum", "euphoria");
  }

  if (tone.includes("mysterious")) {
    result.push("uncertainty", "discovery", "reveal", "suspense", "anticipation", "wonder");
  }

  if (tone.includes("emotional")) {
    result.push("memory", "continuation", "resonance", "catharsis", "intimacy");
  }

  return result;
}

/**
 * Derive reusable experiential operations from conserved semantics.
 *
 * The original semantic detectors remain deliberately explicit because they
 * encode higher-order relationships. The vocabulary pass supplies a broad,
 * extensible lexical layer without creating subject-specific branches.
 *
 * Prompt evidence is accepted separately from the plan because cognition may
 * normalize away adjectives or phrases that still carry important experiential
 * commitments. Preserving that evidence here prevents semantic loss between
 * understanding and concrete trajectory generation.
 */
export function inferExperienceMechanics(args: {
  plan?: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  prompt?: string;
  tone?: ExperienceTone[];
}): MechanicSignal[] {
  const { plan, premise = plan?.premise, prompt = "", tone = [] } = args;

  const corpus = lower([
    prompt,
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

  if (has(corpus, /\b(?:add(?:s|ed|ing)?|contribut(?:e|es|ed|ing|ion|ions)|accumulate|accumulates|accumulated|accumulating|grow|grows|grew|growing|versions?|folklore|mythology)\b/)) {
    add("accumulation", 0.95, "material compounds or competing versions can grow");
    add("contribution", 0.8, "participants can add material");
  }

  if (has(corpus, /\b(?:escalat|increasingly|more and more|wild|ridiculous|bigger|worse|extreme|over the top)\b/)) {
    add("escalation", 0.96, "the premise explicitly asks for increasing intensity");
  }

  if (
    has(corpus, /\b(?:versions?|folklore|mythology|legend|tall tale|rumou?rs?)\b/) &&
    has(corpus, /\b(?:add(?:s|ed|ing)?|contribut(?:e|es|ed|ing|ion|ions)|accumulate|accumulates|accumulated|accumulating|grow|grows|grew|growing|compound(?:s|ed|ing)?|compet(?:e|es|ed|ing)?)\b/)
  ) {
    add("escalation", 0.88, "compounding versions or contributions are meant to intensify the shared story");
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

  if (
    scores.has("uncertainty") &&
    has(corpus, /\b(?:threat|danger|terror|terrifying|haunted|horror|dread|fear|unknown|uncertain|uncertainty)\b/)
  ) {
    add(
      "suspense",
      0.9,
      "uncertainty is sustained around an active threat, creating unresolved anticipation",
    );
  }

  if (has(corpus, /\b(?:absurd|billionaire|luxury|lavish|opulent|ridiculous|excess|indulgent|over the top)\b/)) {
    add("excess", 0.97, "the premise rewards disproportion and indulgence");
  }

  if (
    scores.has("excess") &&
    has(corpus, /\b(?:luxury|lavish|opulent|indulgent|indulgence|extravagant|decadent|billionaire|no expense spared)\b/)
  ) {
    add(
      "indulgence",
      0.9,
      "luxury is framed as active disproportionate indulgence rather than background setting",
    );
  }

  if (has(corpus, /\b(?:spa|groom|groomer|pamper|poodle|princess|royal|treatments?)\b/)) {
    add("pampering", 0.92, "care is part of the premise and should become an experiential behavior");
  }

  if (
    scores.has("excess") &&
    (scores.has("pampering") || has(corpus, /\b(?:care|indulgence|indulgent|pamper|pampering|treatment|treatments)\b/))
  ) {
    add(
      "escalation",
      0.86,
      "excessive treatment should intensify through progressively more disproportionate experience",
    );
  }

  if (has(corpus, /\b(?:memor(?:y|ies)|remember(?:s|ed|ing)?|reminisc|history|legacy|photograph|folklore|nostalgia|keepsake|memorial)\b/)) {
    add("memory", 0.96, "past experience should affect present meaning");
  }

  if (has(corpus, /\b(?:again|return|next time|future|later|continues?|grows?|evolv|revisit|over time)\b/)) {
    add("continuation", 0.95, "the experience has an explicit future state");
  }

  if (has(corpus, /\b(?:adaptive|adapt|preference|prefers?|history|previous|remembered|changes based|learns?|personalize|personalized)\b/)) {
    add("adaptation", 0.96, "prior state should change the next realization");
  }

  if (
    has(corpus, /\b(?:again|return(?:s|ed|ing)?|revisit|next time|previous|prior|before)\b/) &&
    has(corpus, /\b(?:preference|preferences|preferred|remember(?:s|ed|ing)?|previous|prior|history|past|adapt(?:s|ed|ing|ive)?|learn(?:s|ed|ing)?)\b/)
  ) {
    add("memory", 0.84, "returning interaction is explicitly shaped by prior experience");
  }

  if (plan?.direction === "memory") {
    add("memory", 0.88, "selected cognitive direction is memory");

    if ((plan.memoryModel?.length ?? 0) > 0 || (plan.futureEvolution?.length ?? 0) > 0) {
      add("continuation", 0.82, "memory direction carries future continuity");
    }

    if ((plan.dynamicBehavior?.length ?? 0) > 0 || (plan.futureEvolution?.length ?? 0) > 0) {
      add("adaptation", 0.78, "memory direction exposes accumulated state to later interactions");
    }
  }

  if ((plan?.dynamicBehavior?.length ?? 0) > 0) {
    const dynamic = lower(plan?.dynamicBehavior?.join(" ") ?? "");
    if (has(dynamic, /\b(?:adapt|change|previous|history|accumulat|progress|state|preference|context)\b/)) {
      add("adaptation", 0.9, "dynamic behavior explicitly changes future experience state");
    }
  }

  if ((plan?.futureEvolution?.length ?? 0) > 0) {
    const future = lower(plan?.futureEvolution?.join(" ") ?? "");
    if (has(future, /\b(?:continue|future|again|return|later|new|evolv|grow|accumulat|chapter|event)\b/)) {
      add("continuation", 0.88, "future evolution explicitly preserves a next state");
    }
  }

  if (
    scores.has("accumulation") &&
    scores.has("contribution") &&
    (scores.has("memory") || scores.has("continuation"))
  ) {
    add("escalation", 0.82, "repeated contributions compound accumulated state into increasing experiential intensity");
  }

  if (roleCorpus.includes("transformation")) {
    add("transformation", 0.5, "conserved premise explicitly contains transformation evidence");
  }

  for (const entry of COGNITIVE_VOCABULARY) {
    if (entry.patterns.some((pattern) => pattern.test(corpus))) {
      add(
        entry.mechanic as ExperienceMechanic,
        entry.score,
        entry.evidence,
      );
    }
  }

  for (const mechanic of toneMechanics(tone)) {
    add(mechanic, 0.45, `tone implies ${mechanic} behavior`);
  }

  return [...scores.entries()]
    .map(([mechanic, value]) => ({
      mechanic,
      confidence: Math.min(1, value.score),
      evidence: unique(value.evidence),
    }))
    .sort(
      (a, b) =>
        b.confidence - a.confidence ||
        a.mechanic.localeCompare(b.mechanic),
    );
}

export function mechanicBrief(
  signals: MechanicSignal[],
): string[] {
  return signals
    .filter((signal) => signal.confidence >= 0.7)
    .map((signal) => signal.mechanic);
}