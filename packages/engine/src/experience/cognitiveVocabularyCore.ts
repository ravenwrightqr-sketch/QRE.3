import type { CognitiveExperiencePlan, StoryBeatKind } from "@qre/contracts";
import type { ExperienceMechanic, MechanicSignal } from "./cognitiveMechanics.js";

/**
 * GOAL
 * ----
 * Give Mega Cog a rich, domain-neutral vocabulary for observable experience.
 *
 * PURPOSE
 * -------
 * Expand coarse mechanics into experiential primitives that survive from
 * cognition through trajectory and into concrete realization.
 *
 * ARCHITECTURAL POSITION
 * ----------------------
 * Cognitive Plan → Mechanics → Vocabulary → Trajectory → Realization
 *
 * INVARIANTS
 * ---------
 * - No industry/domain templates.
 * - No invented facts.
 * - Upstream semantic commitments remain authoritative.
 * - Vocabulary describes causal behavior, intensification, and payoff.
 * - Feel-good is not synonymous with wholesome care; it can be excessive,
 *   luxurious, absurd, triumphant, spectacular, mischievous, or indulgent.
 */

export type CognitiveVocabulary =
  | "anticipation" | "curiosity" | "suspense" | "tease" | "misdirection"
  | "surprise" | "discovery" | "revelation" | "wonder" | "awe"
  | "delight" | "play" | "absurdity" | "whimsy" | "spectacle"
  | "prestige" | "status" | "indulgence" | "excess" | "empowerment"
  | "mastery" | "challenge" | "competition" | "rivalry" | "participation"
  | "contribution" | "collection" | "accumulation" | "progression"
  | "escalation" | "reversal" | "transformation" | "recognition"
  | "reward" | "relief" | "belonging" | "identity" | "memory"
  | "legacy" | "nostalgia" | "personalization" | "adaptation"
  | "continuity" | "celebration" | "triumph";

export type CognitiveVocabularySignal = {
  vocabulary: CognitiveVocabulary;
  confidence: number;
  mechanics: ExperienceMechanic[];
  operations: StoryBeatKind[];
  intensifiers: CognitiveVocabulary[];
  resolutions: CognitiveVocabulary[];
  evidence: string[];
};

const OPS: Record<CognitiveVocabulary, StoryBeatKind[]> = {
  anticipation: ["hook", "threshold", "encounter"],
  curiosity: ["hook", "discovery", "encounter"],
  suspense: ["threshold", "encounter", "escalation", "reveal"],
  tease: ["hook", "threshold", "encounter"],
  misdirection: ["hook", "encounter", "reveal"],
  surprise: ["reveal", "payoff"],
  discovery: ["encounter", "discovery", "reveal"],
  revelation: ["reveal", "payoff"],
  wonder: ["discovery", "reveal", "payoff"],
  awe: ["escalation", "transformation", "payoff"],
  delight: ["feedback", "transformation", "payoff"],
  play: ["action", "feedback", "payoff"],
  absurdity: ["encounter", "escalation", "transformation", "payoff"],
  whimsy: ["hook", "encounter", "discovery", "payoff"],
  spectacle: ["encounter", "escalation", "transformation", "payoff"],
  prestige: ["encounter", "transformation", "payoff"],
  status: ["challenge", "transformation", "payoff"],
  indulgence: ["encounter", "escalation", "transformation", "payoff"],
  excess: ["escalation", "payoff"],
  empowerment: ["action", "feedback", "transformation", "payoff"],
  mastery: ["instruction", "action", "feedback", "milestone", "payoff"],
  challenge: ["threshold", "challenge", "action", "feedback"],
  competition: ["challenge", "action", "feedback", "milestone", "payoff"],
  rivalry: ["encounter", "challenge", "escalation", "payoff"],
  participation: ["instruction", "action", "feedback"],
  contribution: ["encounter", "contribution", "feedback"],
  collection: ["discovery", "contribution", "milestone", "payoff"],
  accumulation: ["contribution", "milestone", "payoff"],
  progression: ["milestone", "next_step", "transformation", "payoff"],
  escalation: ["escalation", "milestone", "payoff"],
  reversal: ["reveal", "transformation", "payoff"],
  transformation: ["transformation", "payoff"],
  recognition: ["feedback", "milestone", "payoff"],
  reward: ["milestone", "unlock", "payoff"],
  relief: ["reveal", "payoff", "reflection"],
  belonging: ["encounter", "contribution", "reflection", "continuation"],
  identity: ["origin", "encounter", "transformation", "reflection"],
  memory: ["origin", "reflection", "payoff"],
  legacy: ["origin", "contribution", "milestone", "continuation"],
  nostalgia: ["origin", "reflection", "payoff"],
  personalization: ["feedback", "next_step", "transformation"],
  adaptation: ["feedback", "next_step", "transformation"],
  continuity: ["reflection", "next_step", "continuation"],
  celebration: ["contribution", "milestone", "payoff", "continuation"],
  triumph: ["milestone", "transformation", "payoff"],
};

const MAP: Record<ExperienceMechanic, CognitiveVocabulary[]> = {
  uncertainty: ["anticipation", "curiosity", "suspense", "tease", "surprise", "relief"],
  discovery: ["curiosity", "discovery", "wonder", "revelation", "surprise"],
  participation: ["participation", "play", "empowerment", "delight", "mastery"],
  competition: ["challenge", "competition", "rivalry", "mastery", "triumph", "status"],
  contribution: ["contribution", "accumulation", "recognition", "legacy", "belonging"],
  accumulation: ["collection", "accumulation", "progression", "legacy", "reward"],
  escalation: ["anticipation", "escalation", "spectacle", "absurdity", "awe", "triumph"],
  transformation: ["reversal", "transformation", "recognition", "identity", "delight", "triumph"],
  contrast: ["surprise", "reversal", "whimsy", "absurdity", "transformation"],
  reveal: ["tease", "misdirection", "revelation", "surprise", "recognition"],
  memory: ["memory", "nostalgia", "recognition", "legacy", "belonging"],
  pampering: ["indulgence", "prestige", "status", "spectacle", "delight", "excess"],
  excess: ["excess", "indulgence", "absurdity", "spectacle", "awe", "delight"],
  adaptation: ["personalization", "adaptation", "progression", "mastery", "recognition"],
  continuation: ["continuity", "legacy", "progression", "belonging", "celebration"],
};

const INTENSIFIERS: Partial<Record<CognitiveVocabulary, CognitiveVocabulary[]>> = {
  anticipation: ["tease", "suspense"],
  curiosity: ["tease", "anticipation"],
  suspense: ["anticipation", "misdirection", "escalation"],
  discovery: ["curiosity", "anticipation", "wonder"],
  revelation: ["tease", "suspense", "misdirection"],
  delight: ["surprise", "play", "spectacle", "indulgence"],
  play: ["challenge", "absurdity", "rivalry"],
  absurdity: ["excess", "spectacle", "escalation"],
  spectacle: ["awe", "prestige", "excess"],
  prestige: ["status", "spectacle", "indulgence"],
  status: ["prestige", "competition", "recognition"],
  indulgence: ["excess", "spectacle", "prestige"],
  excess: ["absurdity", "spectacle", "escalation"],
  mastery: ["challenge", "progression", "competition"],
  competition: ["rivalry", "escalation", "status"],
  contribution: ["accumulation", "progression", "recognition"],
  accumulation: ["progression", "escalation", "collection"],
  progression: ["escalation", "mastery", "accumulation"],
  escalation: ["absurdity", "spectacle", "rivalry", "suspense"],
  transformation: ["spectacle", "excess", "status"],
  memory: ["recognition", "nostalgia", "legacy"],
  legacy: ["accumulation", "recognition", "belonging"],
  adaptation: ["personalization", "mastery", "progression"],
  continuity: ["legacy", "progression", "personalization"],
};

const RESOLUTIONS: Partial<Record<CognitiveVocabulary, CognitiveVocabulary[]>> = {
  anticipation: ["surprise", "revelation", "reward"],
  curiosity: ["discovery", "revelation"],
  suspense: ["revelation", "relief", "surprise"],
  tease: ["revelation", "surprise"],
  misdirection: ["reversal", "revelation"],
  surprise: ["delight", "wonder", "relief", "reversal"],
  discovery: ["revelation", "reward"],
  revelation: ["wonder", "recognition", "relief"],
  wonder: ["recognition", "delight"],
  awe: ["wonder", "recognition"],
  delight: ["reward", "celebration", "triumph"],
  play: ["reward", "delight", "triumph"],
  absurdity: ["delight", "surprise", "celebration"],
  spectacle: ["wonder", "delight", "recognition"],
  prestige: ["recognition", "reward"],
  status: ["reward", "recognition", "triumph"],
  indulgence: ["delight", "reward"],
  excess: ["delight", "awe", "surprise"],
  empowerment: ["triumph", "recognition"],
  mastery: ["recognition", "triumph", "reward"],
  challenge: ["mastery", "triumph", "reward"],
  competition: ["triumph", "recognition", "reward"],
  rivalry: ["triumph", "recognition", "reversal"],
  participation: ["reward", "recognition", "belonging"],
  contribution: ["legacy", "belonging", "reward"],
  accumulation: ["recognition", "legacy", "reward"],
  progression: ["transformation", "triumph", "continuity"],
  escalation: ["transformation", "triumph", "relief", "delight"],
  reversal: ["recognition", "delight", "relief"],
  transformation: ["recognition", "delight", "triumph"],
  recognition: ["belonging", "reward", "triumph"],
  reward: ["delight", "triumph", "recognition"],
  relief: ["reward", "delight", "recognition"],
  belonging: ["reward", "continuity"],
  identity: ["continuity", "belonging"],
  memory: ["continuity", "belonging", "celebration"],
  legacy: ["continuity", "celebration"],
  nostalgia: ["belonging", "continuity", "celebration"],
  personalization: ["delight", "reward", "belonging"],
  adaptation: ["recognition", "reward", "continuity"],
  continuity: ["celebration", "belonging", "recognition"],
  celebration: ["delight", "belonging", "triumph"],
  triumph: ["recognition", "celebration", "reward"],
};

const CUES: Array<[RegExp, CognitiveVocabulary[]]> = [
  [/\b(fun|funny|playful|play|game|joke|laugh|humou?r)\b/i, ["play", "whimsy", "delight"]],
  [/\b(absurd|ridiculous|wild|bizarre|outrageous)\b/i, ["absurdity", "excess", "escalation"]],
  [/\b(luxury|lavish|opulent|billionaire|indulgent|royal|vip|premium)\b/i, ["indulgence", "prestige", "status", "spectacle"]],
  [/\b(terrifying|horror|haunted|dread|fear|threat|danger|creepy)\b/i, ["anticipation", "suspense", "tease", "reversal", "relief"]],
  [/\b(surprise|unexpected|astonish)\b/i, ["anticipation", "surprise", "wonder", "reversal"]],
  [/\b(discover|discovery|explore|hunt|clue|mystery|hidden|secret)\b/i, ["curiosity", "discovery", "revelation"]],
  [/\b(remember|memory|nostalgia|grandmother|grandfather|legacy|keepsake|family history)\b/i, ["memory", "nostalgia", "recognition", "legacy"]],
  [/\b(add|adding|contribute|contribution|collect|collection|keep adding)\b/i, ["contribution", "accumulation", "progression", "legacy"]],
  [/\b(competition|compete|race|versus|winner|score|rival)\b/i, ["challenge", "competition", "rivalry", "triumph"]],
  [/\b(change|changing|adaptive|adapt|personalized|preference|learns|previous)\b/i, ["adaptation", "personalization", "progression"]],
  [/\b(transform|transformation|before and after|makeover|restore|become)\b/i, ["transformation", "recognition", "reversal"]],
  [/\b(wedding|birthday|anniversary|celebration|party|festival)\b/i, ["celebration", "belonging", "participation", "delight"]],
];

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function planCorpus(plan?: CognitiveExperiencePlan): string {
  return [
    plan?.centralSubject, plan?.purpose, plan?.direction,
    ...(plan?.emotionalIntent ?? []), ...(plan?.interactionModel ?? []),
    ...(plan?.storyStructure ?? []), ...(plan?.memoryModel ?? []),
    ...(plan?.socialModel ?? []), ...(plan?.discoveryModel ?? []),
    ...(plan?.rewardModel ?? []), ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []), ...(plan?.dynamicBehavior ?? []),
    ...(plan?.futureEvolution ?? []), ...(plan?.creativePossibilities ?? []),
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").toLowerCase();
}

function add(
  out: Map<CognitiveVocabulary, CognitiveVocabularySignal>,
  vocabulary: CognitiveVocabulary,
  confidence: number,
  mechanics: ExperienceMechanic[],
  evidence: string,
): void {
  const existing = out.get(vocabulary);
  const nextMechanics = unique(mechanics);
  const nextEvidence = [evidence, `observable behavior: ${vocabulary}`];

  if (!existing) {
    out.set(vocabulary, {
      vocabulary,
      confidence: Math.min(1, confidence),
      mechanics: nextMechanics,
      operations: [...OPS[vocabulary]],
      intensifiers: [...(INTENSIFIERS[vocabulary] ?? [])],
      resolutions: [...(RESOLUTIONS[vocabulary] ?? [])],
      evidence: nextEvidence,
    });
    return;
  }

  existing.confidence = Math.min(1, existing.confidence + confidence * 0.3);
  existing.mechanics = unique([...existing.mechanics, ...nextMechanics]);
  existing.operations = unique([...existing.operations, ...OPS[vocabulary]]);
  existing.intensifiers = unique([...existing.intensifiers, ...(INTENSIFIERS[vocabulary] ?? [])]);
  existing.resolutions = unique([...existing.resolutions, ...(RESOLUTIONS[vocabulary] ?? [])]);
  existing.evidence = unique([...existing.evidence, ...nextEvidence]);
}

/** Expand conserved mechanics into expressive, evidence-backed vocabulary. */
export function inferCognitiveVocabulary(args: {
  plan?: CognitiveExperiencePlan;
  mechanics: MechanicSignal[];
}): CognitiveVocabularySignal[] {
  const out = new Map<CognitiveVocabulary, CognitiveVocabularySignal>();

  for (const mechanic of args.mechanics.filter((item) => item.confidence >= 0.55)) {
    for (const vocabulary of MAP[mechanic.mechanic] ?? []) {
      add(out, vocabulary, mechanic.confidence * 0.82, [mechanic.mechanic], `derived from ${mechanic.mechanic}`);
    }
  }

  const text = planCorpus(args.plan);
  for (const [pattern, vocabulary] of CUES) {
    if (!pattern.test(text)) continue;
    for (const item of vocabulary) {
      add(out, item, 0.78, ["participation"], `explicit plan evidence matches ${pattern.source}`);
    }
  }

  if (args.plan?.direction === "memory") {
    add(out, "memory", 0.92, ["memory"], "selected cognitive direction is memory");
  }

  if ((args.plan?.dynamicBehavior?.length ?? 0) > 0) {
    add(out, "adaptation", 0.84, ["adaptation"], "dynamic behavior changes future state");
    add(out, "personalization", 0.7, ["adaptation"], "dynamic behavior can personalize later realization");
  }

  if ((args.plan?.futureEvolution?.length ?? 0) > 0) {
    add(out, "continuity", 0.9, ["continuation"], "future evolution preserves a next state");
  }

  const has = (vocabulary: CognitiveVocabulary) => out.has(vocabulary);

  if (has("curiosity") && has("discovery")) add(out, "revelation", 0.74, ["discovery", "reveal"], "curiosity resolves through discovery into revelation");
  if (has("anticipation") && has("revelation")) add(out, "surprise", 0.72, ["uncertainty", "reveal"], "anticipation creates room for surprise");
  if (has("excess") && has("transformation")) {
    add(out, "spectacle", 0.84, ["excess", "transformation"], "disproportionate transformation creates spectacle");
    add(out, "delight", 0.72, ["excess", "transformation"], "oversized positive transformation can land as delight");
  }
  if (has("accumulation") && has("contribution")) add(out, "progression", 0.84, ["accumulation", "contribution"], "each contribution changes accumulated state");
  if (has("competition") && has("escalation")) add(out, "rivalry", 0.86, ["competition", "escalation"], "opposing performance intensifies");
  if (has("memory") && has("continuity")) add(out, "legacy", 0.82, ["memory", "continuation"], "remembered experience persists into later states");
  if (has("participation") && has("transformation")) add(out, "empowerment", 0.78, ["participation", "transformation"], "participant action visibly changes the subject or world");
  if (has("uncertainty") && has("escalation")) add(out, "suspense", 0.86, ["uncertainty", "escalation"], "uncertainty becomes suspense as pressure rises");

  return [...out.values()].sort((a, b) => b.confidence - a.confidence || a.vocabulary.localeCompare(b.vocabulary));
}

export function vocabularyBrief(signals: CognitiveVocabularySignal[], limit = 18): CognitiveVocabulary[] {
  return signals.slice(0, limit).map((signal) => signal.vocabulary);
}
