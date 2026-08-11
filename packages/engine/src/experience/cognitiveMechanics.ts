import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  ExperienceTone,
} from "@qre/contracts";
import { COGNITIVE_VOCABULARY } from "./cognitiveVocabulary.js";

/**
 * COGNITIVE MECHANICS
 *
 * Universal behavioral forces. A mechanic says HOW an experience behaves, not
 * WHAT noun or industry it belongs to. This layer must never need a dog,
 * concert, spa, birthday, restaurant, or housekeeper branch.
 */

export type ExperienceMechanic =
  | "accumulation" | "escalation" | "transformation" | "reveal" | "discovery"
  | "contrast" | "participation" | "competition" | "contribution" | "uncertainty"
  | "excess" | "pampering" | "memory" | "continuation" | "adaptation"
  | "anticipation" | "suspense" | "surprise" | "agency" | "mastery" | "novelty"
  | "spectacle" | "indulgence" | "delight" | "euphoria" | "celebration" | "prestige"
  | "ritual" | "authorship" | "reciprocity" | "resonance" | "intimacy" | "catharsis"
  | "relief" | "reversal" | "momentum" | "scarcity" | "curation" | "embodiment"
  | "immersion" | "ownership" | "consequence" | "recognition" | "legacy" | "wonder" | "awe";

export type MechanicSignal = {
  mechanic: ExperienceMechanic;
  confidence: number;
  evidence: string[];
};

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function planValues(plan?: CognitiveExperiencePlan): string[] {
  if (!plan) return [];
  return unique([
    plan.centralSubject, plan.purpose, plan.direction,
    ...plan.audience, ...plan.emotionalIntent, ...plan.interactionModel,
    ...plan.storyStructure, ...plan.memoryModel, ...plan.socialModel,
    ...plan.discoveryModel, ...plan.rewardModel, ...plan.progressionModel,
    ...plan.contentModel, ...plan.dynamicBehavior, ...plan.futureEvolution,
    ...plan.creativePossibilities,
  ]);
}

function premiseValues(premise: CognitivePremise | undefined, role?: CognitivePremiseRole): string[] {
  return unique(premise?.slots.filter((slot) => !role || slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function toneMechanics(tone: ExperienceTone[]): ExperienceMechanic[] {
  const result: ExperienceMechanic[] = [];
  if (tone.includes("playful")) result.push("contrast", "escalation", "participation", "surprise", "delight");
  if (tone.includes("energetic")) result.push("escalation", "participation", "momentum", "euphoria");
  if (tone.includes("mysterious")) result.push("uncertainty", "discovery", "reveal", "suspense", "anticipation", "wonder");
  if (tone.includes("emotional")) result.push("memory", "continuation", "resonance", "catharsis", "intimacy");
  return result;
}

function addPattern(corpus: string, scores: Map<ExperienceMechanic, { score: number; evidence: string[] }>, mechanic: ExperienceMechanic, score: number, pattern: RegExp, evidence: string): void {
  if (!pattern.test(corpus)) return;
  const current = scores.get(mechanic) ?? { score: 0, evidence: [] };
  current.score += score;
  current.evidence.push(evidence);
  scores.set(mechanic, current);
}

export function inferExperienceMechanics(args: {
  plan?: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  prompt?: string;
  tone?: ExperienceTone[];
}): MechanicSignal[] {
  const { plan, premise = plan?.premise, prompt = "", tone = [] } = args;
  const corpus = lower([prompt, ...planValues(plan), ...premiseValues(premise), ...tone].join(" "));
  const roleCorpus = lower([
    ...premiseValues(premise, "transformation"),
    ...premiseValues(premise, "outcome"),
    ...premiseValues(premise, "emotion"),
    ...premiseValues(premise, "affordance"),
    ...premiseValues(premise, "temporal"),
    ...premiseValues(premise, "social"),
  ].join(" "));
  const scores = new Map<ExperienceMechanic, { score: number; evidence: string[] }>();

  addPattern(corpus, scores, "accumulation", 0.95, /\b(?:add|adding|contribut|accumulat|grow|growing|versions?|folklore|mythology)\b/, "material can compound or accumulate");
  addPattern(corpus, scores, "contribution", 0.82, /\b(?:contribut|add|share|participat|author|create)\w*\b/, "participants can add material");
  addPattern(corpus, scores, "escalation", 0.96, /\b(?:escalat|increasingly|more and more|wild|ridiculous|bigger|worse|extreme|over the top)\b/, "intensity is explicitly increasing");
  addPattern(corpus, scores, "transformation", 0.95, /\b(?:transform|change|before and after|becomes?|turn\w*\s+.*\s+into|restore|makeover|pamper|clean\w*)\b/, "a state change is central");
  addPattern(corpus, scores, "reveal", 0.94, /\b(?:reveal|hidden|secret|uncover|expose|forgotten)\b/, "information is withheld then exposed");
  addPattern(corpus, scores, "discovery", 0.94, /\b(?:discover|explore|find|hunt|clue|mystery|portal|encounter)\b/, "exploration or finding drives the experience");
  addPattern(corpus, scores, "contrast", 0.84, /\b(?:boring|ordinary|routine|mundane|before|after|unexpected|surprise|opposite)\b/, "a baseline or reversal creates contrast");
  addPattern(corpus, scores, "participation", 0.9, /\b(?:scan|participate|join|play|interact|touch|choose|vote|share|do|try)\b/, "participant action changes the experience");
  addPattern(corpus, scores, "competition", 0.95, /\b(?:compete|competition|race|versus|vs\.?|winner|challenge|score)\b/, "participants face comparative challenge");
  addPattern(corpus, scores, "uncertainty", 0.96, /\b(?:terror|terrifying|haunted|horror|dread|fear|threat|danger|creepy|unknown|uncertain)\b/, "uncertainty or threat drives intensity");
  addPattern(corpus, scores, "suspense", 0.9, /\b(?:suspense|uncertain|unknown|threat|danger|what happens next|keeps? guessing)\b/, "uncertainty is sustained across time");
  addPattern(corpus, scores, "excess", 0.97, /\b(?:absurd|luxury|lavish|opulent|ridiculous|excess|indulgent|extravagant|decadent|over the top)\b/, "disproportion is part of the experience");
  addPattern(corpus, scores, "pampering", 0.92, /\b(?:pamper|pampering|care|comfort|groom|grooming|treatment|treatments|spoil|spoiled)\b/, "care is realized as an active experiential behavior");
  addPattern(corpus, scores, "indulgence", 0.9, /\b(?:luxury|lavish|opulent|indulgent|extravagant|decadent|no expense spared)\b/, "luxury is expressed as active indulgence");
  addPattern(corpus, scores, "memory", 0.96, /\b(?:memory|memories|remember|history|legacy|photograph|folklore|nostalgia|keepsake|memorial)\b/, "past experience affects present meaning");
  addPattern(corpus, scores, "continuation", 0.95, /\b(?:again|return|next time|future|later|continues?|grows?|evolv|revisit|over time)\b/, "the experience has a future state");
  addPattern(corpus, scores, "adaptation", 0.96, /\b(?:adaptive|adapt|preference|preferred|previous|remembered|changes based|learns?|personalize|personalized)\b/, "prior state changes future experience");
  addPattern(corpus, scores, "surprise", 0.92, /\b(?:surprise|unexpected|suddenly|twist|strange|weird|absurd|ridiculous)\b/, "expectation is deliberately disrupted");
  addPattern(corpus, scores, "novelty", 0.88, /\b(?:novel|brand[- ]new|never seen before|first[- ]ever|fresh|new twist)\b/, "newness is part of the experience");
  addPattern(corpus, scores, "spectacle", 0.94, /\b(?:spectacle|spectacular|showstopper|grand finale|jaw[- ]dropping|showcase)\b/, "the experience should become impressive");
  addPattern(corpus, scores, "delight", 0.9, /\b(?:delight|joy|thrill|pleasure|love every second|fun|funny|hilarious)\b/, "active pleasure is an intended effect");
  addPattern(corpus, scores, "euphoria", 0.95, /\b(?:euphoria|ecstatic|bliss|high point|over the moon)\b/, "payoff reaches unusually intense positive affect");
  addPattern(corpus, scores, "celebration", 0.86, /\b(?:celebrate|celebration|party|toast|festive|commemorate)\b/, "the experience converts an event into celebration");
  addPattern(corpus, scores, "prestige", 0.88, /\b(?:prestige|exclusive|elite|VIP|high[- ]status|first class)\b/, "distinction and status shape the experience");
  addPattern(corpus, scores, "ritual", 0.86, /\b(?:ritual|ceremony|tradition|annual|ceremonial)\b/, "repetition or ceremony structures participation");
  addPattern(corpus, scores, "authorship", 0.9, /\b(?:author|create their own|write their own|make their own|shape)\b/, "participants create part of the evolving experience");
  addPattern(corpus, scores, "reciprocity", 0.84, /\b(?:reciprocity|give and take|give back|in return|responds? to)\b/, "one action produces a meaningful response");
  addPattern(corpus, scores, "resonance", 0.86, /\b(?:resonance|meaningful connection|sticks with you|hits home|deeply personal)\b/, "the experience reverberates beyond the moment");
  addPattern(corpus, scores, "intimacy", 0.82, /\b(?:intimacy|intimate|personal moment|one[- ]on[- ]one|private|close[- ]knit)\b/, "closeness gives the experience force");
  addPattern(corpus, scores, "catharsis", 0.92, /\b(?:catharsis|cathartic|let it out|finally release|release the tension|tearjerker)\b/, "accumulated tension resolves in release");
  addPattern(corpus, scores, "relief", 0.84, /\b(?:relief|relieved|weight off|finally safe|breathe again)\b/, "pressure drops into release");
  addPattern(corpus, scores, "reversal", 0.94, /\b(?:reversal|turns? the tables|opposite of what|not what it seemed|plot twist|flips? the script)\b/, "interpretation or direction deliberately flips");
  addPattern(corpus, scores, "momentum", 0.88, /\b(?:momentum|keeps? going|keeps? building|one thing leads to another|can'?t stop)\b/, "each state creates energy for the next");
  addPattern(corpus, scores, "scarcity", 0.86, /\b(?:scarce|scarcity|limited|only \d+|one[- ]time|rare|hard to get)\b/, "limited availability creates urgency");
  addPattern(corpus, scores, "curation", 0.9, /\b(?:curate|hand[- ]picked|selected just for|tailored|personalized)\b/, "selection itself is part of the experience");
  addPattern(corpus, scores, "embodiment", 0.82, /\b(?:physical|touch|walk through|hold|wear|hands[- ]on)\b/, "physical presence or action matters");
  addPattern(corpus, scores, "immersion", 0.88, /\b(?:immerse|immersive|lost in|fully inside|surround|transported)\b/, "attention is absorbed by the experience");
  addPattern(corpus, scores, "ownership", 0.84, /\b(?:ownership|mine|personal artifact|keep forever|belongs to)\b/, "the participant gains durable possession or authorship");
  addPattern(corpus, scores, "consequence", 0.94, /\b(?:consequence|has an effect|changes the outcome|what happens depends on)\b/, "actions persist as consequences");
  addPattern(corpus, scores, "recognition", 0.86, /\b(?:recognize|recognized|seen|remembered by|gets credit|spotlight)\b/, "a participant or contribution becomes visible");
  addPattern(corpus, scores, "legacy", 0.9, /\b(?:legacy|lives on|passed down|for generations|remembered for years)\b/, "the experience persists beyond the interaction");
  addPattern(corpus, scores, "wonder", 0.9, /\b(?:wonder|magical|marvel|mesmerize|spellbind)\b/, "the experience invites astonishment");
  addPattern(corpus, scores, "awe", 0.9, /\b(?:awe|majestic|epic)\b/, "scale or significance produces awe");

  if (roleCorpus.includes("transformation")) {
    addPattern(roleCorpus, scores, "transformation", 0.5, /transformation/, "the conserved premise contains transformation evidence");
  }
  if (plan?.direction === "memory") {
    addPattern("memory", scores, "memory", 0.88, /memory/, "selected direction is memory");
  }
  if ((plan?.dynamicBehavior?.length ?? 0) > 0) {
    addPattern(plan.dynamicBehavior.join(" "), scores, "adaptation", 0.78, /\b(?:adapt|change|previous|history|accumulat|progress|state|preference|context)\b/, "dynamic behavior changes future state");
  }
  if ((plan?.futureEvolution?.length ?? 0) > 0) {
    addPattern(plan.futureEvolution.join(" "), scores, "continuation", 0.82, /\b(?:continue|future|again|return|later|new|evolv|grow|accumulat|chapter|event)\b/, "future evolution preserves continuity");
  }

  for (const entry of COGNITIVE_VOCABULARY) {
    if (!entry.patterns.some((pattern) => pattern.test(corpus))) continue;
    const mechanic = entry.mechanic as ExperienceMechanic;
    const current = scores.get(mechanic) ?? { score: 0, evidence: [] };
    current.score += entry.score * 0.65;
    current.evidence.push(entry.evidence);
    scores.set(mechanic, current);
  }

  for (const mechanic of toneMechanics(tone)) {
    const current = scores.get(mechanic) ?? { score: 0, evidence: [] };
    current.score += 0.45;
    current.evidence.push(`tone implies ${mechanic} behavior`);
    scores.set(mechanic, current);
  }

  return [...scores.entries()]
    .map(([mechanic, value]) => ({ mechanic, confidence: Math.min(1, value.score), evidence: unique(value.evidence) }))
    .sort((a, b) => b.confidence - a.confidence || a.mechanic.localeCompare(b.mechanic));
}

export function mechanicBrief(signals: MechanicSignal[]): string[] {
  return signals.filter((signal) => signal.confidence >= 0.7).map((signal) => signal.mechanic);
}