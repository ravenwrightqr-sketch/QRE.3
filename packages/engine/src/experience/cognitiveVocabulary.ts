import type {
  CognitiveExperiencePlan,
  StoryBeatKind,
} from "@qre/contracts";

import type { ExperienceMechanic, MechanicSignal } from "./cognitiveMechanics.js";

/**
 * GOAL
 * ----
 * Give Mega Cog an expressive, domain-neutral vocabulary for describing
 * observable experiential behavior without turning cognition into a catalog
 * of subject-specific templates.
 *
 * PURPOSE
 * -------
 * Expand coarse mechanics such as discovery, escalation, transformation,
 * memory, and participation into richer experiential primitives that can
 * survive all the way into trajectory selection and concrete realization.
 *
 * ARCHITECTURAL POSITION
 * ----------------------
 * Cognitive Plan → Mechanics → Vocabulary → Trajectory → Realization
 *
 * INVARIANTS
 * ---------
 * - Vocabulary describes behavior, not industries or nouns.
 * - Vocabulary never invents facts or replaces upstream semantic commitments.
 * - A vocabulary item must have observable realization evidence.
 * - Intensifiers and resolutions describe causal relationships, not prose.
 * - Positive experience is not equated with wholesome care; delight can be
 *   luxurious, absurd, excessive, triumphant, mischievous, spectacular, or
 *   otherwise disproportionate.
 */

export type CognitiveVocabulary =
  | "anticipation"
  | "curiosity"
  | "suspense"
  | "tease"
  | "misdirection"
  | "surprise"
  | "discovery"
  | "revelation"
  | "wonder"
  | "awe"
  | "delight"
  | "play"
  | "absurdity"
  | "whimsy"
  | "spectacle"
  | "prestige"
  | "status"
  | "indulgence"
  | "excess"
  | "empowerment"
  | "mastery"
  | "challenge"
  | "competition"
  | "rivalry"
  | "participation"
  | "contribution"
  | "collection"
  | "accumulation"
  | "progression"
  | "escalation"
  | "reversal"
  | "transformation"
  | "recognition"
  | "reward"
  | "relief"
  | "belonging"
  | "identity"
  | "memory"
  | "legacy"
  | "nostalgia"
  | "personalization"
  | "adaptation"
  | "continuity"
  | "celebration"
  | "triumph";

export type CognitiveVocabularyDefinition = {
  vocabulary: CognitiveVocabulary;
  mechanics: ExperienceMechanic[];
  operations: StoryBeatKind[];
  prerequisites?: CognitiveVocabulary[];
  intensifiers?: CognitiveVocabulary[];
  resolutions?: CognitiveVocabulary[];
  evidence: string[];
};

export type CognitiveVocabularySignal = {
  vocabulary: CognitiveVocabulary;
  confidence: number;
  source: "mechanic" | "plan" | "evidence";
  mechanics: ExperienceMechanic[];
  operations: StoryBeatKind[];
  evidence: string[];
};

const DEFINITIONS: Record<CognitiveVocabulary, CognitiveVocabularyDefinition> = {
  anticipation: {
    vocabulary: "anticipation",
    mechanics: ["uncertainty", "discovery", "escalation"],
    operations: ["hook", "threshold", "encounter"],
    intensifiers: ["tease", "suspense", "reveal"],
    resolutions: ["surprise", "revelation", "reward"],
    evidence: ["something is expected before it arrives"],
  },
  curiosity: {
    vocabulary: "curiosity",
    mechanics: ["discovery", "uncertainty"],
    operations: ["hook", "discovery", "encounter"],
    intensifiers: ["tease", "mystery" as CognitiveVocabulary],
    resolutions: ["discovery", "revelation"],
    evidence: ["an information gap invites investigation"],
  },
  suspense: {
    vocabulary: "suspense",
    mechanics: ["uncertainty", "escalation"],
    operations: ["threshold", "encounter", "escalation", "reveal"],
    intensifiers: ["anticipation", "tease", "misdirection"],
    resolutions: ["revelation", "relief", "surprise"],
    evidence: ["outcome is uncertain while stakes or expectation rise"],
  },
  tease: {
    vocabulary: "tease",
    mechanics: ["uncertainty", "discovery", "reveal"],
    operations: ["hook", "threshold", "encounter"],
    intensifiers: ["curiosity", "anticipation", "misdirection"],
    resolutions: ["revelation", "surprise"],
    evidence: ["partial evidence is shown without giving away the payoff"],
  },
  misdirection: {
    vocabulary: "misdirection",
    mechanics: ["uncertainty", "contrast", "reveal"],
    operations: ["hook", "encounter", "reveal"],
    resolutions: ["reversal", "revelation"],
    evidence: ["attention is deliberately pointed toward an incomplete interpretation"],
  },
  surprise: {
    vocabulary: "surprise",
    mechanics: ["reveal", "contrast", "discovery"],
    operations: ["reveal", "payoff"],
    prerequisites: ["anticipation"],
    resolutions: ["delight", "wonder", "relief", "reversal"],
    evidence: ["the realized outcome differs from the immediate expectation"],
  },
  discovery: {
    vocabulary: "discovery",
    mechanics: ["discovery"],
    operations: ["encounter", "discovery", "reveal"],
    intensifiers: ["curiosity", "anticipation", "wonder"],
    resolutions: ["revelation", "reward"],
    evidence: ["the participant finds or encounters something previously unavailable"],
  },
  revelation: {
    vocabulary: "revelation",
    mechanics: ["reveal", "discovery"],
    operations: ["reveal", "payoff"],
    prerequisites: ["anticipation"],
    intensifiers: ["tease", "suspense", "misdirection"],
    resolutions: ["wonder", "recognition", "relief"],
    evidence: ["withheld information becomes explicit and changes interpretation"],
  },
  wonder: {
    vocabulary: "wonder",
    mechanics: ["discovery", "reveal", "excess"],
    operations: ["discovery", "reveal", "payoff"],
    intensifiers: ["spectacle", "awe", "surprise"],
    resolutions: ["recognition", "delight"],
    evidence: ["the realized world produces fascination beyond the expected baseline"],
  },
  awe: {
    vocabulary: "awe",
    mechanics: ["excess", "escalation", "transformation"],
    operations: ["escalation", "transformation", "payoff"],
    intensifiers: ["spectacle", "prestige", "excess"],
    resolutions: ["wonder", "recognition"],
    evidence: ["scale, power, beauty, or consequence overwhelms the prior frame"],
  },
  delight: {
    vocabulary: "delight",
    mechanics: ["transformation", "participation", "excess", "reveal"],
    operations: ["feedback", "transformation", "payoff"],
    intensifiers: ["surprise", "play", "spectacle", "indulgence"],
    resolutions: ["reward", "celebration", "triumph"],
    evidence: ["the participant receives a pleasurable or satisfying realized outcome"],
  },
  play: {
    vocabulary: "play",
    mechanics: ["participation", "contrast", "competition"],
    operations: ["action", "feedback", "payoff"],
    intensifiers: ["challenge", "absurdity", "rivalry"],
    resolutions: ["reward", "delight", "triumph"],
    evidence: ["the participant actively manipulates or responds to the experience"],
  },
  absurdity: {
    vocabulary: "absurdity",
    mechanics: ["excess", "contrast", "escalation"],
    operations: ["encounter", "escalation", "transformation", "payoff"],
    intensifiers: ["excess", "spectacle", "reversal"],
    resolutions: ["delight", "surprise", "celebration"],
    evidence: ["the experience intentionally exceeds ordinary proportionality"],
  },
  whimsy: {
    vocabulary: "whimsy",
    mechanics: ["contrast", "discovery", "participation"],
    operations: ["hook", "encounter", "discovery", "payoff"],
    intensifiers: ["play", "surprise", "absurdity"],
    resolutions: ["delight", "wonder"],
    evidence: ["unexpected playful details bend ordinary expectations"],
  },
  spectacle: {
    vocabulary: "spectacle",
    mechanics: ["excess", "escalation", "transformation"],
    operations: ["encounter", "escalation", "transformation", "payoff"],
    intensifiers: ["awe", "prestige", "excess"],
    resolutions: ["wonder", "delight", "recognition"],
    evidence: ["the experience deliberately creates a visible or felt high point"],
  },
  prestige: {
    vocabulary: "prestige",
    mechanics: ["excess", "transformation", "recognition" as ExperienceMechanic],
    operations: ["encounter", "transformation", "payoff"],
    intensifiers: ["status", "spectacle", "indulgence"],
    resolutions: ["recognition", "reward"],
    evidence: ["the participant is elevated into a visibly distinguished state"],
  },
  status: {
    vocabulary: "status",
    mechanics: ["transformation", "competition", "excess"],
    operations: ["challenge", "transformation", "payoff"],
    intensifiers: ["prestige", "spectacle", "recognition"],
    resolutions: ["reward", "recognition", "triumph"],
    evidence: ["relative position, rank, or treatment changes"],
  },
  indulgence: {
    vocabulary: "indulgence",
    mechanics: ["excess", "transformation"],
    operations: ["encounter", "escalation", "transformation", "payoff"],
    intensifiers: ["excess", "spectacle", "prestige"],
    resolutions: ["delight", "reward"],
    evidence: ["the experience intentionally grants disproportionate luxury, attention, or reward"],
  },
  excess: {
    vocabulary: "excess",
    mechanics: ["excess", "escalation"],
    operations: ["escalation", "payoff"],
    intensifiers: ["absurdity", "spectacle", "indulgence"],
    resolutions: ["delight", "awe", "surprise"],
    evidence: ["the experience deliberately crosses an ordinary ceiling"],
  },
  empowerment: {
    vocabulary: "empowerment",
    mechanics: ["participation", "adaptation", "transformation"],
    operations: ["action", "feedback", "transformation", "payoff"],
    intensifiers: ["mastery", "progression", "status"],
    resolutions: ["triumph", "recognition"],
    evidence: ["the participant gains meaningful agency or capability"],
  },
  mastery: {
    vocabulary: "mastery",
    mechanics: ["participation", "competition", "adaptation"],
    operations: ["instruction", "action", "feedback", "milestone", "payoff"],
    intensifiers: ["challenge", "progression", "competition"],
    resolutions: ["recognition", "triumph", "reward"],
    evidence: ["repeated feedback allows increasingly capable performance"],
  },
  challenge: {
    vocabulary: "challenge",
    mechanics: ["competition", "participation", "uncertainty"],
    operations: ["threshold", "challenge", "action", "feedback"],
    intensifiers: ["rivalry", "escalation", "suspense"],
    resolutions: ["mastery", "triumph", "reward"],
    evidence: ["the participant must overcome a meaningful obstacle or test"],
  },
  competition: {
    vocabulary: "competition",
    mechanics: ["competition", "participation"],
    operations: ["challenge", "action", "feedback", "milestone", "payoff"],
    intensifiers: ["rivalry", "escalation", "status"],
    resolutions: ["triumph", "recognition", "reward"],
    evidence: ["performance is compared against another participant or standard"],
  },
  rivalry: {
    vocabulary: "rivalry",
    mechanics: ["competition", "escalation"],
    operations: ["encounter", "challenge", "escalation", "payoff"],
    intensifiers: ["competition", "status", "suspense"],
    resolutions: ["triumph", "recognition", "reversal"],
    evidence: ["opposing goals or identities make each move matter more"],
  },
  participation: {
    vocabulary: "participation",
    mechanics: ["participation"],
    operations: ["instruction", "action", "feedback"],
    intensifiers: ["play", "challenge", "contribution"],
    resolutions: ["reward", "recognition", "belonging"],
    evidence: ["the participant does something that affects the experience"],
  },
  contribution: {
    vocabulary: "contribution",
    mechanics: ["contribution", "accumulation"],
    operations: ["encounter", "contribution", "feedback"],
    intensifiers: ["accumulation", "progression", "recognition"],
    resolutions: ["legacy", "belonging", "reward"],
    evidence: ["a participant adds material that persists in the experience"],
  },
  collection: {
    vocabulary: "collection",
    mechanics: ["accumulation", "discovery", "participation"],
    operations: ["discovery", "contribution", "milestone", "payoff"],
    intensifiers: ["progression", "accumulation", "discovery"],
    resolutions: ["reward", "recognition", "legacy"],
    evidence: ["distinct pieces are gathered into a larger whole"],
  },
  accumulation: {
    vocabulary: "accumulation",
    mechanics: ["accumulation", "contribution"],
    operations: ["contribution", "milestone", "payoff"],
    intensifiers: ["progression", "escalation", "collection"],
    resolutions: ["recognition", "legacy", "reward"],
    evidence: ["each contribution persists and changes the total state"],
  },
  progression: {
    vocabulary: "progression",
    mechanics: ["accumulation", "adaptation", "escalation"],
    operations: ["milestone", "next_step", "transformation", "payoff"],
    intensifiers: ["escalation", "mastery", "accumulation"],
    resolutions: ["transformation", "triumph", "continuity"],
    evidence: ["the experience has a visibly changing state across steps"],
  },
  escalation: {
    vocabulary: "escalation",
    mechanics: ["escalation", "excess", "competition"],
    operations: ["escalation", "milestone", "payoff"],
    intensifiers: ["absurdity", "spectacle", "rivalry", "suspense"],
    resolutions: ["transformation", "triumph", "relief", "delight"],
    evidence: ["each stage raises intensity, scale, stakes, or consequence"],
  },
  reversal: {
    vocabulary: "reversal",
    mechanics: ["contrast", "reveal", "transformation"],
    operations: ["reveal", "transformation", "payoff"],
    intensifiers: ["misdirection", "surprise", "absurdity"],
    resolutions: ["recognition", "delight", "relief"],
    evidence: ["the apparent direction changes and reinterprets what came before"],
  },
  transformation: {
    vocabulary: "transformation",
    mechanics: ["transformation"],
    operations: ["transformation", "payoff"],
    prerequisites: ["contrast", "progression"],
    intensifiers: ["spectacle", "excess", "status"],
    resolutions: ["recognition", "delight", "triumph"],
    evidence: ["a concrete subject changes state rather than merely receiving commentary"],
  },
  recognition: {
    vocabulary: "recognition",
    mechanics: ["transformation", "memory", "contribution"],
    operations: ["feedback", "milestone", "payoff"],
    intensifiers: ["status", "prestige", "legacy"],
    resolutions: ["belonging", "reward", "triumph"],
    evidence: ["a person, contribution, or changed state is explicitly noticed"],
  },
  reward: {
    vocabulary: "reward",
    mechanics: ["participation", "accumulation", "transformation"],
    operations: ["milestone", "unlock", "payoff"],
    intensifiers: ["prestige", "status", "indulgence"],
    resolutions: ["delight", "triumph", "recognition"],
    evidence: ["the experience gives a concrete consequence for participation or progress"],
  },
  relief: {
    vocabulary: "relief",
    mechanics: ["uncertainty", "escalation", "reveal"],
    operations: ["reveal", "payoff", "reflection"],
    intensifiers: ["suspense", "anticipation"],
    resolutions: ["reward", "delight", "recognition"],
    evidence: ["tension is released by a concrete change in the situation"],
  },
  belonging: {
    vocabulary: "belonging",
    mechanics: ["contribution", "participation", "memory", "continuation"],
    operations: ["encounter", "contribution", "reflection", "continuation"],
    intensifiers: ["recognition", "legacy", "celebration"],
    resolutions: ["reward", "continuity"],
    evidence: ["participation creates a visible place within a shared experience"],
  },
  identity: {
    vocabulary: "identity",
    mechanics: ["transformation", "memory", "contrast"],
    operations: ["origin", "encounter", "transformation", "reflection"],
    intensifiers: ["recognition", "status", "legacy"],
    resolutions: ["continuity", "belonging"],
    evidence: ["the experience changes or clarifies who the subject is within the story"],
  },
  memory: {
    vocabulary: "memory",
    mechanics: ["memory"],
    operations: ["origin", "reflection", "payoff"],
    intensifiers: ["recognition", "nostalgia", "legacy"],
    resolutions: ["continuity", "belonging", "celebration"],
    evidence: ["past experience remains active in present meaning or action"],
  },
  legacy: {
    vocabulary: "legacy",
    mechanics: ["memory", "contribution", "continuation", "accumulation"],
    operations: ["origin", "contribution", "milestone", "continuation"],
    intensifiers: ["accumulation", "recognition", "belonging"],
    resolutions: ["continuity", "celebration"],
    evidence: ["what happened can outlive the immediate interaction and affect later states"],
  },
  nostalgia: {
    vocabulary: "nostalgia",
    mechanics: ["memory", "contrast"],
    operations: ["origin", "reflection", "payoff"],
    intensifiers: ["recognition", "legacy"],
    resolutions: ["belonging", "continuity", "celebration"],
    evidence: ["past and present are emotionally compared through a concrete remembered object or event"],
  },
  personalization: {
    vocabulary: "personalization",
    mechanics: ["adaptation", "participation", "memory"],
    operations: ["feedback", "next_step", "transformation"],
    intensifiers: ["recognition", "status", "mastery"],
    resolutions: ["delight", "reward", "belonging"],
    evidence: ["the next realization reflects known participant-specific state"],
  },
  adaptation: {
    vocabulary: "adaptation",
    mechanics: ["adaptation"],
    operations: ["feedback", "next_step", "transformation"],
    intensifiers: ["personalization", "mastery", "progression"],
    resolutions: ["recognition", "reward", "continuity"],
    evidence: ["what happens next changes because of what happened before"],
  },
  continuity: {
    vocabulary: "continuity",
    mechanics: ["continuation", "memory", "adaptation"],
    operations: ["reflection", "next_step", "continuation"],
    intensifiers: ["legacy", "progression", "personalization"],
    resolutions: ["celebration", "belonging", "recognition"],
    evidence: ["the experience explicitly leaves a next state rather than ending as a sealed scene"],
  },
  celebration: {
    vocabulary: "celebration",
    mechanics: ["participation", "memory", "excess", "contribution"],
    operations: ["contribution", "milestone", "payoff", "continuation"],
    intensifiers: ["spectacle", "excess", "recognition"],
    resolutions: ["delight", "belonging", "triumph"],
    evidence: ["the realized outcome is collectively marked as a high point"],
  },
  triumph: {
    vocabulary: "triumph",
    mechanics: ["competition", "transformation", "escalation", "participation"],
    operations: ["milestone", "transformation", "payoff"],
    intensifiers: ["mastery", "status", "spectacle"],
    resolutions: ["recognition", "celebration", "reward"],
    evidence: ["a difficult or meaningful state is visibly overcome or achieved"],
  },
};

const MECHANIC_VOCABULARY: Record<ExperienceMechanic, CognitiveVocabulary[]> = {
  uncertainty: ["anticipation", "curiosity", "suspense", "tease", "surprise", "relief"],
  discovery: ["curiosity", "discovery", "wonder", "revelation", "surprise"],
  participation: ["participation", "play", "empowerment", "delight", "mastery"],
  competition: ["challenge", "competition", "rivalry", "mastery", "triumph", "status"],
  contribution: ["contribution", "accumulation", "recognition", "legacy", "belonging"],
  accumulation: ["collection", "accumulation", "progression", "legacy", "reward"],
  escalation: ["anticipation", "escalation", "spectacle", "absurdity", "awe", "triumph"],
  transformation: ["contrast", "transformation", "recognition", "identity", "delight", "triumph"],
  contrast: ["surprise", "reversal", "whimsy", "absurdity", "transformation"],
  reveal: ["tease", "misdirection", "revelation", "surprise", "recognition"],
  memory: ["memory", "nostalgia", "recognition", "legacy", "belonging"],
  pampering: ["indulgence", "prestige", "status", "spectacle", "delight", "excess"],
  excess: ["excess", "indulgence", "absurdity", "spectacle", "awe", "delight"],
  adaptation: ["personalization", "adaptation", "progression", "mastery", "recognition"],
  continuation: ["continuity", "legacy", "progression", "belonging", "celebration"],
};

const PLAN_VOCABULARY: Array<[RegExp, CognitiveVocabulary[]]> = [
  [/\b(fun|funny|playful|play|game|joke|laugh|humou?r)\b/i, ["play", "whimsy", "delight"]],
  [/\b(absurd|ridiculous|wild|bizarre|outrageous)\b/i, ["absurdity", "excess", "escalation"]],
  [/\b(luxury|lavish|opulent|billionaire|indulgent|indulgence|royal|vip|premium)\b/i, ["indulgence", "prestige", "status", "spectacle"]],
  [/\b(terrifying|horror|haunted|dread|fear|threat|danger|creepy)\b/i, ["anticipation", "suspense", "tease", "reversal", "relief"]],
  [/\b(surprise|unexpected|astonish|astonishing)\b/i, ["anticipation", "surprise", "wonder", "reversal"]],
  [/\b(discover|discovery|explore|hunt|clue|mystery|hidden|secret)\b/i, ["curiosity", "discovery", "revelation"]],
  [/\b(remember|memory|nostalgia|grandmother|grandfather|legacy|keepsake|family history)\b/i, ["memory", "nostalgia", "recognition", "legacy"]],
  [/\b(add|adding|contribute|contribution|collect|collection|keep adding)\b/i, ["contribution", "accumulation", "progression", "legacy"]],
  [/\b(competition|compete|race|versus|winner|score|rival)\b/i, ["challenge", "competition", "rivalry", "triumph"]],
  [/\b(change|changes|changing|adaptive|adapt|personalized|preference|learns|previous)\b/i, ["adaptation", "personalization", "progression"]],
  [/\b(transform|transformation|before and after|makeover|restore|become)\b/i, ["contrast", "transformation", "recognition"]],
  [/\b(wedding|birthday|anniversary|celebration|party|festival)\b/i, ["celebration", "belonging", "participation", "delight"]],
];

const UNIQUE = <T>(values: readonly T[]): T[] => [...new Set(values)];

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const corpusFor = (plan?: CognitiveExperiencePlan): string =>
  clean([
    plan?.centralSubject,
    plan?.purpose,
    plan?.direction,
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.storyStructure ?? []),
    ...(plan?.memoryModel ?? []),
    ...(plan?.socialModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.rewardModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.contentModel ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.creativePossibilities ?? []),
  ].filter(Boolean).join(" "));

function addSignal(
  signals: Map<CognitiveVocabulary, CognitiveVocabularySignal>,
  vocabulary: CognitiveVocabulary,
  confidence: number,
  source: CognitiveVocabularySignal["source"],
  mechanics: ExperienceMechanic[],
  evidence: string[],
): void {
  const existing = signals.get(vocabulary);
  if (!existing) {
    const definition = DEFINITIONS[vocabulary];
    signals.set(vocabulary, {
      vocabulary,
      confidence: Math.min(1, confidence),
      source,
      mechanics: UNIQUE(mechanics),
      operations: [...definition.operations],
      evidence: UNIQUE(evidence),
    });
    return;
  }

  existing.confidence = Math.min(1, existing.confidence + confidence * 0.35);
  existing.mechanics = UNIQUE([...existing.mechanics, ...mechanics]);
  existing.operations = UNIQUE([...existing.operations, ...DEFINITIONS[vocabulary].operations]);
  existing.evidence = UNIQUE([...existing.evidence, ...evidence]);
}

/**
 * Expand mechanic signals into expressive experiential vocabulary.
 *
 * This is intentionally conservative: explicit mechanics are the strongest
 * source, while lexical plan evidence can add richer affective behavior.
 * The vocabulary is still downstream of cognition and remains evidence-backed.
 */
export function inferCognitiveVocabulary(args: {
  plan?: CognitiveExperiencePlan;
  mechanics: MechanicSignal[];
}): CognitiveVocabularySignal[] {
  const signals = new Map<CognitiveVocabulary, CognitiveVocabularySignal>();
  const corpus = corpusFor(args.plan);

  for (const signal of args.mechanics.filter((value) => value.confidence >= 0.55)) {
    for (const vocabulary of MECHANIC_VOCABULARY[signal.mechanic] ?? []) {
      const definition = DEFINITIONS[vocabulary];
      const weight = vocabulary === signal.mechanic ? 1 : 0.72;
      addSignal(
        signals,
        vocabulary,
        signal.confidence * weight,
        "mechanic",
        [signal.mechanic],
        [
          `derived from ${signal.mechanic} (${signal.confidence.toFixed(2)})`,
          ...definition.evidence,
        ],
      );
    }
  }

  for (const [pattern, vocabulary] of PLAN_VOCABULARY) {
    if (!pattern.test(corpus)) continue;
    for (const item of vocabulary) {
      addSignal(
        signals,
        item,
        0.78,
        "plan",
        DEFINITIONS[item].mechanics,
        [`plan evidence matches ${pattern.source}`],
      );
    }
  }

  // Explicit cognitive direction should survive lexical normalization.
  if (args.plan?.direction === "memory") {
    addSignal(signals, "memory", 0.92, "plan", ["memory"], ["selected cognitive direction is memory"]);
  }

  if ((args.plan?.dynamicBehavior?.length ?? 0) > 0) {
    addSignal(signals, "adaptation", 0.82, "plan", ["adaptation"], ["dynamic behavior exposes a changing future state"]);
    addSignal(signals, "personalization", 0.68, "plan", ["adaptation"], ["dynamic behavior can personalize later realization"]);
  }

  if ((args.plan?.futureEvolution?.length ?? 0) > 0) {
    addSignal(signals, "continuity", 0.9, "plan", ["continuation"], ["future evolution preserves a next state"]);
  }

  // Causal pairings create richer behavior without becoming templates.
  const has = (value: CognitiveVocabulary) => signals.has(value);
  const promote = (
    vocabulary: CognitiveVocabulary,
    confidence: number,
    mechanics: ExperienceMechanic[],
    evidence: string,
  ) => addSignal(signals, vocabulary, confidence, "evidence", mechanics, [evidence]);

  if (has("curiosity") && has("discovery")) {
    promote("revelation", 0.76, ["discovery", "reveal"], "curiosity resolves through discovery into revelation");
  }

  if (has("anticipation") && has("revelation")) {
    promote("surprise", 0.74, ["uncertainty", "reveal"], "anticipation creates room for a realized surprise");
  }

  if (has("excess") && has("transformation")) {
    promote("spectacle", 0.84, ["excess", "transformation"], "disproportionate transformation creates spectacle");
    promote("delight", 0.72, ["excess", "transformation"], "a deliberately oversized positive transformation can land as delight");
  }

  if (has("accumulation") && has("contribution")) {
    promote("progression", 0.84, ["accumulation", "contribution"], "each contribution changes the accumulated state");
  }

  if (has("competition") && has("escalation")) {
    promote("rivalry", 0.86, ["competition", "escalation"], "competition becomes more compelling as opposing performance intensifies");
  }

  if (has("memory") && has("continuity")) {
    promote("legacy", 0.82, ["memory", "continuation"], "remembered experience persists into later states");
  }

  if (has("participation") && has("transformation")) {
    promote("empowerment", 0.78, ["participation", "transformation"], "participant action visibly changes the world or subject");
  }

  if (has("uncertainty") && has("escalation")) {
    promote("suspense", 0.86, ["uncertainty", "escalation"], "uncertainty becomes suspense when pressure rises toward a reveal or outcome");
  }

  return [...signals.values()]
    .sort((a, b) => b.confidence - a.confidence || a.vocabulary.localeCompare(b.vocabulary));
}

export function vocabularyDefinition(
  vocabulary: CognitiveVocabulary,
): CognitiveVocabularyDefinition {
  return DEFINITIONS[vocabulary];
}

export function vocabularyBrief(
  signals: CognitiveVocabularySignal[],
  limit = 18,
): CognitiveVocabulary[] {
  return signals.slice(0, limit).map((signal) => signal.vocabulary);
}
