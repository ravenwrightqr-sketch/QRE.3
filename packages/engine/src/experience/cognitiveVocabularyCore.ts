import type { CognitiveExperiencePlan, StoryBeatKind } from "@qre/contracts";
import type { ExperienceMechanic, MechanicSignal } from "./cognitiveMechanics.js";

/**
 * GOAL
 * ----
 * Give Mega Cog a rich, domain-neutral vocabulary for observable experience.
 *
 * PURPOSE
 * -------
 * Expand coarse mechanics into experiential primitives that can survive from
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
 * - Vocabulary describes behavior, causal pressure, and experiential payoff.
 * - Feel-good behavior may be luxurious, absurd, excessive, triumphant,
 *   spectacular, mischievous, or otherwise non-wholesome.
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

export type CognitiveVocabularyDefinition = {
  vocabulary: CognitiveVocabulary;
  mechanics: ExperienceMechanic[];
  operations: StoryBeatKind[];
  intensifiers: CognitiveVocabulary[];
  resolutions: CognitiveVocabulary[];
  evidence: string;
};

export type CognitiveVocabularySignal = {
  vocabulary: CognitiveVocabulary;
  confidence: number;
  mechanics: ExperienceMechanic[];
  operations: StoryBeatKind[];
  intensifiers: CognitiveVocabulary[];
  resolutions: CognitiveVocabulary[];
  evidence: string[];
};

const D: Record<CognitiveVocabulary, CognitiveVocabularyDefinition> = {
  anticipation: { vocabulary: "anticipation", mechanics: ["uncertainty", "discovery", "escalation"], operations: ["hook", "threshold", "encounter"], intensifiers: ["tease", "suspense"], resolutions: ["surprise", "revelation", "reward"], evidence: "something is expected before it arrives" },
  curiosity: { vocabulary: "curiosity", mechanics: ["discovery", "uncertainty"], operations: ["hook", "discovery", "encounter"], intensifiers: ["tease", "anticipation"], resolutions: ["discovery", "revelation"], evidence: "an information gap invites investigation" },
  suspense: { vocabulary: "suspense", mechanics: ["uncertainty", "escalation"], operations: ["threshold", "encounter", "escalation", "reveal"], intensifiers: ["anticipation", "tease", "misdirection"], resolutions: ["revelation", "relief", "surprise"], evidence: "uncertainty persists while pressure rises" },
  tease: { vocabulary: "tease", mechanics: ["uncertainty", "discovery", "reveal"], operations: ["hook", "threshold", "encounter"], intensifiers: ["curiosity", "anticipation", "misdirection"], resolutions: ["revelation", "surprise"], evidence: "partial evidence is shown without giving away the payoff" },
  misdirection: { vocabulary: "misdirection", mechanics: ["uncertainty", "contrast", "reveal"], operations: ["hook", "encounter", "reveal"], intensifiers: ["tease", "suspense"], resolutions: ["reversal", "revelation"], evidence: "attention is pointed toward an incomplete interpretation" },
  surprise: { vocabulary: "surprise", mechanics: ["reveal", "contrast", "discovery"], operations: ["reveal", "payoff"], intensifiers: ["anticipation", "tease"], resolutions: ["delight", "wonder", "relief", "reversal"], evidence: "the outcome differs from the immediate expectation" },
  discovery: { vocabulary: "discovery", mechanics: ["discovery"], operations: ["encounter", "discovery", "reveal"], intensifiers: ["curiosity", "anticipation", "wonder"], resolutions: ["revelation", "reward"], evidence: "something previously unavailable becomes accessible" },
  revelation: { vocabulary: "revelation", mechanics: ["reveal", "discovery"], operations: ["reveal", "payoff"], intensifiers: ["tease", "suspense", "misdirection"], resolutions: ["wonder", "recognition", "relief"], evidence: "withheld information becomes explicit and changes interpretation" },
  wonder: { vocabulary: "wonder", mechanics: ["discovery", "reveal", "excess"], operations: ["discovery", "reveal", "payoff"], intensifiers: ["spectacle", "awe", "surprise"], resolutions: ["recognition", "delight"], evidence: "the realized world exceeds the expected frame" },
  awe: { vocabulary: "awe", mechanics: ["excess", "escalation", "transformation"], operations: ["escalation", "transformation", "payoff"], intensifiers: ["spectacle", "prestige", "excess"], resolutions: ["wonder", "recognition"], evidence: "scale or consequence overwhelms the prior frame" },
  delight: { vocabulary: "delight", mechanics: ["transformation", "participation", "excess", "reveal"], operations: ["feedback", "transformation", "payoff"], intensifiers: ["surprise", "play", "spectacle", "indulgence"], resolutions: ["reward", "celebration", "triumph"], evidence: "the realized outcome is pleasurable or satisfying" },
  play: { vocabulary: "play", mechanics: ["participation", "contrast", "competition"], operations: ["action", "feedback", "payoff"], intensifiers: ["challenge", "absurdity", "rivalry"], resolutions: ["reward", "delight", "triumph"], evidence: "the participant actively manipulates or responds" },
  absurdity: { vocabulary: "absurdity", mechanics: ["excess", "contrast", "escalation"], operations: ["encounter", "escalation", "transformation", "payoff"], intensifiers: ["excess", "spectacle", "reversal"], resolutions: ["delight", "surprise", "celebration"], evidence: "the experience intentionally exceeds ordinary proportionality" },
  whimsy: { vocabulary: "whimsy", mechanics: ["contrast", "discovery", "participation"], operations: ["hook", "encounter", "discovery", "payoff"], intensifiers: ["play", "surprise", "absurdity"], resolutions: ["delight", "wonder"], evidence: "playful details bend ordinary expectations" },
  spectacle: { vocabulary: "spectacle", mechanics: ["excess", "escalation", "transformation"], operations: ["encounter", "escalation", "transformation", "payoff"], intensifiers: ["awe", "prestige", "excess"], resolutions: ["wonder", "delight", "recognition"], evidence: "the experience builds toward a visible or felt high point" },
  prestige: { vocabulary: "prestige", mechanics: ["excess", "transformation", "memory"], operations: ["encounter", "transformation", "payoff"], intensifiers: ["status", "spectacle", "indulgence"], resolutions: ["recognition", "reward"], evidence: "the subject is elevated into a distinguished state" },
  status: { vocabulary: "status", mechanics: ["transformation", "competition", "excess"], operations: ["challenge", "transformation", "payoff"], intensifiers: ["prestige", "spectacle", "recognition"], resolutions: ["reward", "recognition", "triumph"], evidence: "relative position or treatment changes" },
  indulgence: { vocabulary: "indulgence", mechanics: ["excess", "transformation"], operations: ["encounter", "escalation", "transformation", "payoff"], intensifiers: ["excess", "spectacle", "prestige"], resolutions: ["delight", "reward"], evidence: "the experience grants disproportionate luxury, attention, or reward" },
  excess: { vocabulary: "excess", mechanics: ["excess", "escalation"], operations: ["escalation", "payoff"], intensifiers: ["absurdity", "spectacle", "indulgence"], resolutions: ["delight", "awe", "surprise"], evidence: "the experience deliberately crosses an ordinary ceiling" },
  empowerment: { vocabulary: "empowerment", mechanics: ["participation", "adaptation", "transformation"], operations: ["action", "feedback", "transformation", "payoff"], intensifiers: ["mastery", "progression", "status"], resolutions: ["triumph", "recognition"], evidence: "participant agency visibly changes what can happen" },
  mastery: { vocabulary: "mastery", mechanics: ["participation", "competition", "adaptation"], operations: ["instruction", "action", "feedback", "milestone", "payoff"], intensifiers: ["challenge", "progression", "competition"], resolutions: ["recognition", "triumph", "reward"], evidence: "feedback enables increasingly capable performance" },
  challenge: { vocabulary: "challenge", mechanics: ["competition", "participation", "uncertainty"], operations: ["threshold", "challenge", "action", "feedback"], intensifiers: ["rivalry", "escalation", "suspense"], resolutions: ["mastery", "triumph", "reward"], evidence: "a meaningful obstacle or test must be overcome" },
  competition: { vocabulary: "competition", mechanics: ["competition", "participation"], operations: ["challenge", "action", "feedback", "milestone", "payoff"], intensifiers: ["rivalry", "escalation", "status"], resolutions: ["triumph", "recognition", "reward"], evidence: "performance is compared against another participant or standard" },
  rivalry: { vocabulary: "rivalry", mechanics: ["competition", "escalation"], operations: ["encounter", "challenge", "escalation", "payoff"], intensifiers: ["competition", "status", "suspense"], resolutions: ["triumph", "recognition", "reversal"], evidence: "opposing goals make each move matter more" },
  participation: { vocabulary: "participation", mechanics: ["participation"], operations: ["instruction", "action", "feedback"], intensifiers: ["play", "challenge", "contribution"], resolutions: ["reward", "recognition", "belonging"], evidence: "the participant does something that affects the experience" },
  contribution: { vocabulary: "contribution", mechanics: ["contribution", "accumulation"], operations: ["encounter", "contribution", "feedback"], intensifiers: ["accumulation", "progression", "recognition"], resolutions: ["legacy", "belonging", "reward"], evidence: "participant-added material persists" },
  collection: { vocabulary: "collection", mechanics: ["accumulation", "discovery", "participation"], operations: ["discovery", "contribution", "milestone", "payoff"], intensifiers: ["progression", "accumulation", "discovery"], resolutions: ["reward", "recognition", "legacy"], evidence: "distinct pieces gather into a larger whole" },
  accumulation: { vocabulary: "accumulation", mechanics: ["accumulation", "contribution"], operations: ["contribution", "milestone", "payoff"], intensifiers: ["progression", "escalation", "collection"], resolutions: ["recognition", "legacy", "reward"], evidence: "each contribution changes the total state" },
  progression: { vocabulary: "progression", mechanics: ["accumulation", "adaptation", "escalation"], operations: ["milestone", "next_step", "transformation", "payoff"], intensifiers: ["escalation", "mastery", "accumulation"], resolutions: ["transformation", "triumph", "continuity"], evidence: "state visibly changes across steps" },
  escalation: { vocabulary: "escalation", mechanics: ["escalation", "excess", "competition"], operations: ["escalation", "milestone", "payoff"], intensifiers: ["absurdity", "spectacle", "rivalry", "suspense"], resolutions: ["transformation", "triumph", "relief", "delight"], evidence: "each stage raises intensity, scale, stakes, or consequence" },
  reversal: { vocabulary: "reversal", mechanics: ["contrast", "reveal", "transformation"], operations: ["reveal", "transformation", "payoff"], intensifiers: ["misdirection", "surprise", "absurdity"], resolutions: ["recognition", "delight", "relief"], evidence: "the apparent direction changes and reinterprets what came before" },
  transformation: { vocabulary: "transformation", mechanics: ["transformation"], operations: ["transformation", "payoff"], intensifiers: ["spectacle", "excess", "status"], resolutions: ["recognition", "delight", "triumph"], evidence: "a concrete subject changes state" },
  recognition: { vocabulary: "recognition", mechanics: ["transformation", "memory", "contribution"], operations: ["feedback", "milestone", "payoff"], intensifiers: ["status", "prestige", "legacy"], resolutions: ["belonging", "reward", "triumph"], evidence: "a person, contribution, or changed state is explicitly noticed" },
  reward: { vocabulary: "reward", mechanics: ["participation", "accumulation", "transformation"], operations: ["milestone", "unlock", "payoff"], intensifiers: ["prestige", "status", "indulgence"], resolutions: ["delight", "triumph", "recognition"], evidence: "participation or progress produces a concrete consequence" },
  relief: { vocabulary: "relief", mechanics: ["uncertainty", "escalation", "reveal"], operations: ["reveal", "payoff", "reflection"], intensifiers: ["suspense", "anticipation"], resolutions: ["reward", "delight", "recognition"], evidence: "tension is released by a concrete change" },
  belonging: { vocabulary: "belonging", mechanics: ["contribution", "participation", "memory", "continuation"], operations: ["encounter", "contribution", "reflection", "continuation"], intensifiers: ["recognition", "legacy", "celebration"], resolutions: ["reward", "continuity"], evidence: "participation creates a visible place in a shared experience" },
  identity: { vocabulary: "identity", mechanics: ["transformation", "memory", "contrast"], operations: ["origin", "encounter", "transformation", "reflection"], intensifiers: ["recognition", "status", "legacy"], resolutions: ["continuity", "belonging"], evidence: "the experience changes or clarifies who the subject is" },
  memory: { vocabulary: "memory", mechanics: ["memory"], operations: ["origin", "reflection", "payoff"], intensifiers: ["recognition", "nostalgia", "legacy"], resolutions: ["continuity", "belonging", "celebration"], evidence: "past experience remains active in present action or meaning" },
  legacy: { vocabulary: "legacy", mechanics: ["memory", "contribution", "continuation", "accumulation"], operations: ["origin", "contribution", "milestone", "continuation"], intensifiers: ["accumulation", "recognition", "belonging"], resolutions: ["continuity", "celebration"], evidence: "what happened can outlive the immediate interaction" },
  nostalgia: { vocabulary: "nostalgia", mechanics: ["memory", "contrast"], operations: ["origin", "reflection", "payoff"], intensifiers: ["recognition", "legacy"], resolutions: ["belonging", "continuity", "celebration"], evidence: "past and present are compared through a concrete remembered subject" },
  personalization: { vocabulary: "personalization", mechanics: ["adaptation", "participation", "memory"], operations: ["feedback", "next_step", "transformation"], intensifiers: ["recognition", "status", "mastery"], resolutions: ["delight", "reward", "belonging"], evidence: "later realization reflects known participant-specific state" },
  adaptation: { vocabulary: "adaptation", mechanics: ["adaptation"], operations: ["feedback", "next_step", "transformation"], intensifiers: ["personalization", "mastery", "progression"], resolutions: ["recognition", "reward", "continuity"], evidence: "what happens next changes because of what happened before" },
  continuity: { vocabulary: "continuity", mechanics: ["continuation", "memory", "adaptation"], operations: ["reflection", "next_step", "continuation"], intensifiers: ["legacy", "progression", "personalization"], resolutions: ["celebration", "belonging", "recognition"], evidence: "the experience leaves a next state" },
  celebration: { vocabulary: "celebration", mechanics: ["participation", "memory", "excess", "contribution"], operations: ["contribution", "milestone", "payoff", "continuation"], intensifiers: ["spectacle", "excess", "recognition"], resolutions: ["delight", "belonging", "triumph"], evidence: "the realized outcome is collectively marked as a high point" },
  triumph: { vocabulary: "triumph", mechanics: ["competition", "transformation", "escalation", "participation"], operations: ["milestone", "transformation", "payoff"], intensifiers: ["mastery", "status", "spectacle"], resolutions: ["recognition", "celebration", "reward"], evidence: "a difficult or meaningful state is visibly overcome" },
};

const MAP: Record<ExperienceMechanic, CognitiveVocabulary[]> = {
  uncertainty: ["anticipation", "curiosity", "suspense", "tease", "surprise", "relief"],
  discovery: ["curiosity", "discovery", "wonder", "revelation", "surprise"],
  participation: ["participation", "play", "empowerment", "delight", "mastery"],
  competition: ["challenge", "competition", "rivalry", "mastery", "triumph", "status"],
  contribution: ["contribution", "accumulation", "recognition", "legacy", "belonging"],
  accumulation: ["collection", "accumulation", "progression", "legacy", "reward"],
  escalation: ["anticipation", "escalation", "spectacle", "absurdity", "awe", "triumph"],
  transformation: ["contrast" as CognitiveVocabulary, "transformation", "recognition", "identity", "delight", "triumph"],
  contrast: ["surprise", "reversal", "whimsy", "absurdity", "transformation"],
  reveal: ["tease", "misdirection", "revelation", "surprise", "recognition"],
  memory: ["memory", "nostalgia", "recognition", "legacy", "belonging"],
  pampering: ["indulgence", "prestige", "status", "spectacle", "delight", "excess"],
  excess: ["excess", "indulgence", "absurdity", "spectacle", "awe", "delight"],
  adaptation: ["personalization", "adaptation", "progression", "mastery", "recognition"],
  continuation: ["continuity", "legacy", "progression", "belonging", "celebration"],
};

const PLAN_CUES: Array<[RegExp, CognitiveVocabulary[]]> = [
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
  [/\b(transform|transformation|before and after|makeover|restore|become)\b/i, ["transformation", "recognition", "contrast"]],
  [/\b(wedding|birthday|anniversary|celebration|party|festival)\b/i, ["celebration", "belonging", "participation", "delight"]],
];

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const corpus = (plan?: CognitiveExperiencePlan): string => [
  plan?.centralSubject, plan?.purpose, plan?.direction,
  ...(plan?.emotionalIntent ?? []), ...(plan?.interactionModel ?? []),
  ...(plan?.storyStructure ?? []), ...(plan?.memoryModel ?? []),
  ...(plan?.socialModel ?? []), ...(plan?.discoveryModel ?? []),
  ...(plan?.rewardModel ?? []), ...(plan?.progressionModel ?? []),
  ...(plan?.contentModel ?? []), ...(plan?.dynamicBehavior ?? []),
  ...(plan?.futureEvolution ?? []), ...(plan?.creativePossibilities ?? []),
].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().toLowerCase();

function signal(
  out: Map<CognitiveVocabulary, CognitiveVocabularySignal>,
  vocabulary: CognitiveVocabulary,
  confidence: number,
  mechanics: ExperienceMechanic[],
  evidence: string,
): void {
  const definition = D[vocabulary];
  const existing = out.get(vocabulary);
  if (!existing) {
    out.set(vocabulary, {
      vocabulary,
      confidence: Math.min(1, confidence),
      mechanics: unique(mechanics),
      operations: [...definition.operations],
      intensifiers: [...definition.intensifiers],
      resolutions: [...definition.resolutions],
      evidence: [evidence, definition.evidence],
    });
    return;
  }
  existing.confidence = Math.min(1, existing.confidence + confidence * 0.3);
  existing.mechanics = unique([...existing.mechanics, ...mechanics]);
  existing.operations = unique([...existing.operations, ...definition.operations]);
  existing.intensifiers = unique([...existing.intensifiers, ...definition.intensifiers]);
  existing.resolutions = unique([...existing.resolutions, ...definition.resolutions]);
  existing.evidence = unique([...existing.evidence, evidence, definition.evidence]);
}

/** Expand conserved mechanics into expressive, evidence-backed vocabulary. */
export function inferCognitiveVocabulary(args: {
  plan?: CognitiveExperiencePlan;
  mechanics: MechanicSignal[];
}): CognitiveVocabularySignal[] {
  const out = new Map<CognitiveVocabulary, CognitiveVocabularySignal>();

  for (const mechanic of args.mechanics.filter((item) => item.confidence >= 0.55)) {
    for (const vocabulary of MAP[mechanic.mechanic]) {
      signal(out, vocabulary, mechanic.confidence * 0.82, [mechanic.mechanic], `derived from ${mechanic.mechanic}`);
    }
  }

  const text = corpus(args.plan);
  for (const [pattern, vocabulary] of PLAN_CUES) {
    if (!pattern.test(text)) continue;
    for (const item of vocabulary) {
      signal(out, item, 0.78, D[item].mechanics, `explicit plan evidence matches ${pattern.source}`);
    }
  }

  if (args.plan?.direction === "memory") {
    signal(out, "memory", 0.92, ["memory"], "selected cognitive direction is memory");
  }
  if ((args.plan?.dynamicBehavior?.length ?? 0) > 0) {
    signal(out, "adaptation", 0.84, ["adaptation"], "dynamic behavior changes future state");
    signal(out, "personalization", 0.7, ["adaptation"], "dynamic behavior can personalize later realization");
  }
  if ((args.plan?.futureEvolution?.length ?? 0) > 0) {
    signal(out, "continuity", 0.9, ["continuation"], "future evolution preserves a next state");
  }

  const has = (v: CognitiveVocabulary) => out.has(v);
  if (has("curiosity") && has("discovery")) signal(out, "revelation", 0.74, ["discovery", "reveal"], "curiosity resolves through discovery into revelation");
  if (has("anticipation") && has("revelation")) signal(out, "surprise", 0.72, ["uncertainty", "reveal"], "anticipation creates room for surprise");
  if (has("excess") && has("transformation")) signal(out, "spectacle", 0.84, ["excess", "transformation"], "disproportionate transformation creates spectacle");
  if (has("excess") && has("transformation")) signal(out, "delight", 0.72, ["excess", "transformation"], "oversized positive transformation can land as delight");
  if (has("accumulation") && has("contribution")) signal(out, "progression", 0.84, ["accumulation", "contribution"], "each contribution changes accumulated state");
  if (has("competition") && has("escalation")) signal(out, "rivalry", 0.86, ["competition", "escalation"], "opposing performance intensifies");
  if (has("memory") && has("continuity")) signal(out, "legacy", 0.82, ["memory", "continuation"], "remembered experience persists into later states");
  if (has("participation") && has("transformation")) signal(out, "empowerment", 0.78, ["participation", "transformation"], "participant action visibly changes the world or subject");
  if (has("uncertainty") && has("escalation")) signal(out, "suspense", 0.86, ["uncertainty", "escalation"], "uncertainty becomes suspense as pressure rises");

  return [...out.values()].sort((a, b) => b.confidence - a.confidence || a.vocabulary.localeCompare(b.vocabulary));
}

export function vocabularyDefinition(vocabulary: CognitiveVocabulary): CognitiveVocabularyDefinition {
  return D[vocabulary];
}

export function vocabularyBrief(signals: CognitiveVocabularySignal[], limit = 18): CognitiveVocabulary[] {
  return signals.slice(0, limit).map((item) => item.vocabulary);
}
