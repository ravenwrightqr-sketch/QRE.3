/**
 * QRE UNIVERSAL CREATIVE LENS FIELD
 *
 * Lenses are perception mechanisms, not domain authors.
 * They may change framing, rhythm, implication, status, or pressure.
 * They may never add concrete reality.
 *
 * The field deliberately contains both perceptual styles and familiar
 * mechanics because "spy", "speedrun", "mission", and "game" can be
 * useful ways to experience supplied reality without becoming literal events.
 */

export type CreativeLensFamily = "perceptual" | "mechanic";

export type CreativeLensDefinition = {
  id: string;
  label: string;
  family: CreativeLensFamily;
  framingBias: readonly string[];
  realizationMoves: readonly string[];
  forbiddenRealityMoves: readonly string[];
  preferredSignals: readonly string[];
  intensity: number;
};

export type CreativeLensCandidate = {
  lens: string;
  score: number;
  family: CreativeLensFamily | "none" | "compound";
  reason: string;
  supportedSignals: string[];
  forbiddenRealityMoves: string[];
};

const LENS = (
  id: string,
  family: CreativeLensFamily,
  framingBias: readonly string[],
  realizationMoves: readonly string[],
  preferredSignals: readonly string[],
  intensity: number,
): CreativeLensDefinition => ({
  id,
  label: id,
  family,
  framingBias,
  realizationMoves,
  preferredSignals,
  forbiddenRealityMoves: [
    "invented concrete event",
    "invented actor or object interaction",
    "changed chronology",
    "literalized metaphor",
    "genre cliche unsupported by reality",
  ],
  intensity,
});

export const UNIVERSAL_CREATIVE_LENSES: readonly CreativeLensDefinition[] = [
  LENS("comedy", "perceptual", ["status contradiction", "understatement", "specificity", "reversal", "social collision"], ["contrast", "understatement", "double_meaning", "reversal", "timing"], ["contrast", "contradiction", "oddity", "specificity", "status"], .72),
  LENS("romance", "perceptual", ["recurrence", "restraint", "private significance", "recognition", "intimacy"], ["callback", "implication", "understatement", "recontextualization"], ["recurrence", "care", "memory", "recognition", "relationship"], .62),
  LENS("horror", "perceptual", ["ordinary wrongness", "watching", "absence", "uncertainty", "unresolved signal"], ["implication", "withholding", "recontextualization", "reversal", "callback"], ["uncertainty", "absence", "watching", "anomaly", "repetition"], .82),
  LENS("tenderness", "perceptual", ["specific detail", "care", "restraint", "quiet consequence", "private significance"], ["understatement", "callback", "implication", "recontextualization"], ["care", "memory", "closeness", "specificity", "return"], .48),
  LENS("nostalgia", "perceptual", ["recurrence", "memory echo", "distance", "changed meaning", "sensory detail"], ["callback", "recontextualization", "understatement", "compression"], ["memory", "recurrence", "past", "return", "change"], .56),
  LENS("chaos", "perceptual", ["juxtaposition", "speed", "volatility", "status reversal", "collision"], ["compression", "reversal", "contrast", "interruption", "escalation"], ["rapid_change", "interruption", "collision", "volatility", "accumulation"], .9),
  LENS("fierce", "perceptual", ["status", "defiance", "attitude", "self-possession", "controlled escalation"], ["status_inversion", "compression", "understatement", "contrast", "reversal"], ["status", "attitude", "defiance", "strength", "scale_contrast"], .84),
  LENS("absurd", "perceptual", ["mismatch", "incongruity", "deadpan juxtaposition", "specificity", "double meaning"], ["double_meaning", "contrast", "personification", "understatement", "reversal"], ["mismatch", "oddity", "contrast", "personification", "unexpected"], .86),
  LENS("dramatic", "perceptual", ["stakes", "consequence", "pressure", "reversal", "earned payoff"], ["recontextualization", "reversal", "contrast", "callback", "compression"], ["change", "consequence", "pressure", "completion", "loss"], .74),
  LENS("quiet", "perceptual", ["restraint", "specificity", "implication", "absence", "afterimage"], ["understatement", "implication", "callback", "compression"], ["absence", "memory", "specificity", "stillness", "recurrence"], .32),
  LENS("noir", "perceptual", ["implication", "omission", "status", "unease", "observation"], ["omission", "double_meaning", "recontextualization", "understatement"], ["uncertainty", "observation", "status", "absence", "clue"], .7),
  LENS("deadpan", "perceptual", ["understatement", "contrast", "dry timing", "implication", "specificity"], ["compression", "understatement", "contrast", "double_meaning"], ["contrast", "specificity", "absurdity", "status"], .68),
  LENS("documentary", "perceptual", ["observation", "specificity", "distance", "accumulation", "detail"], ["accumulation", "juxtaposition", "compression", "callback"], ["specificity", "accumulation", "recurrence", "observation"], .4),
  LENS("wild", "perceptual", ["velocity", "surprise", "escalation", "compression", "volatility"], ["speed", "interruption", "escalation", "compression", "reversal"], ["rapid_change", "speed", "interruption", "accumulation"], .88),

  LENS("mission", "mechanic", ["objective", "stages", "progress", "completion", "status"], ["sequence", "escalation", "checkpoint", "payoff", "completion"], ["ordered_actions", "progress", "completion", "stages", "objective"], .72),
  LENS("operation", "mechanic", ["procedure", "territory", "deployment", "progress", "completion"], ["stage_progression", "compression", "status", "completion", "callback"], ["ordered_actions", "territory", "stages", "completion"], .7),
  LENS("spy", "mechanic", ["observation", "suspicion", "secrecy", "objective", "extraction"], ["withholding", "clue", "recontextualization", "status_shift", "reveal"], ["observation", "uncertainty", "clue", "hidden", "watching"], .78),
  LENS("extraction", "mechanic", ["target", "pressure", "route", "retrieval", "completion"], ["progress", "obstacle_by_fact_only", "escalation", "release", "payoff"], ["retrieval", "movement", "completion", "deadline", "pressure"], .74),
  LENS("investigation", "mechanic", ["clue", "uncertainty", "question", "discovery", "reveal"], ["clue_chain", "withholding", "recontextualization", "reveal", "callback"], ["clue", "observation", "uncertainty", "repetition", "discovery"], .8),
  LENS("heist", "mechanic", ["plan", "sequence", "risk", "execution", "payoff"], ["setup", "execution", "interruption", "escalation", "payoff"], ["ordered_actions", "risk", "timing", "retrieval", "completion"], .76),
  LENS("speedrun", "mechanic", ["time", "optimization", "progress", "compression", "completion"], ["compression", "progression", "checkpoint", "repetition", "finish"], ["ordered_actions", "repeat", "speed", "completion", "optimization"], .82),
  LENS("game", "mechanic", ["state", "progression", "levels", "status", "reward"], ["state_change", "progression", "checkpoint", "unlock", "payoff"], ["state", "progress", "levels", "unlock", "completion"], .7),
  LENS("quest", "mechanic", ["goal", "journey", "stages", "discovery", "completion"], ["progression", "discovery", "checkpoint", "callback", "payoff"], ["journey", "stages", "goal", "discovery", "completion"], .66),
  LENS("boss-fight", "mechanic", ["confrontation", "pressure", "status", "attempt", "victory"], ["escalation", "rounds", "reversal", "payoff"], ["repeated_attempt", "pressure", "resistance", "consequence", "completion"], .74),
  LENS("countdown", "mechanic", ["deadline", "compression", "anticipation", "progress", "payoff"], ["shortening beats", "escalation", "checkpoint", "payoff"], ["deadline", "time", "completion", "pressure", "approach"], .8),
  LENS("race", "mechanic", ["pace", "progress", "comparison", "finish", "status"], ["acceleration", "contrast", "checkpoint", "finish", "reversal"], ["speed", "progress", "comparison", "competition", "finish"], .76),
  LENS("restoration", "mechanic", ["before", "change", "repair", "after", "payoff"], ["before_after", "progression", "recontextualization", "reveal"], ["transformation", "repair", "change", "before_after", "completion"], .7),
  LENS("transformation", "mechanic", ["before", "shift", "contrast", "after", "new status"], ["compression", "before_after", "status_flip", "reveal", "payoff"], ["change", "transformation", "contrast", "new_state", "completion"], .74),
  LENS("negotiation", "mechanic", ["positions", "pressure", "concession", "status", "resolution"], ["contrast", "reversal", "implication", "resolution"], ["competing_preferences", "pressure", "choice", "tradeoff", "resolution"], .64),
];

const ALIASES: Record<string, string> = {
  funny: "comedy",
  comedic: "comedy",
  humor: "comedy",
  humour: "comedy",
  romantic: "romance",
  scary: "horror",
  spooky: "horror",
  weird: "absurd",
  spycraft: "spy",
  operation: "operation",
  speed: "speedrun",
  restoration: "restoration",
  makeover: "transformation",
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const normalize = (value: string): string => ALIASES[clean(value).toLowerCase()] ?? clean(value).toLowerCase();

function bag(values: readonly string[]): Set<string> {
  return new Set(
    values
      .flatMap((value) => clean(value).toLowerCase().split(/[^a-z0-9-]+/i))
      .filter((token) => token.length >= 3),
  );
}

function definitionScore(
  definition: CreativeLensDefinition,
  signals: readonly string[],
  strongSignals: readonly string[],
): { score: number; hits: string[] } {
  const signalBag = bag(signals);
  const strongBag = bag(strongSignals);
  const hits = unique([
    ...definition.preferredSignals.filter((signal) => signalBag.has(signal)),
    ...definition.preferredSignals.filter((signal) => strongBag.has(signal)),
  ]);

  const preferredHit = hits.length / Math.max(1, definition.preferredSignals.length);
  const framingHit = definition.framingBias.filter((value) => signalBag.has(value)).length / Math.max(1, definition.framingBias.length);
  const strongHit = definition.preferredSignals.filter((value) => strongBag.has(value)).length / Math.max(1, definition.preferredSignals.length);

  return {
    score: metric(preferredHit * .42 + framingHit * .18 + strongHit * .24 + definition.intensity * .16),
    hits,
  };
}

function compoundScore(
  first: CreativeLensDefinition,
  second: CreativeLensDefinition,
  signals: readonly string[],
  strongSignals: readonly string[],
): number {
  const left = definitionScore(first, signals, strongSignals).score;
  const right = definitionScore(second, signals, strongSignals).score;
  if (first.family === second.family) return metric((left + right) / 2 * .88);
  return metric((left + right) / 2 * 1.03);
}

export function resolveCreativeLens(value?: string): CreativeLensDefinition | undefined {
  const key = normalize(value ?? "");
  if (!key || key === "none") return undefined;
  const definition = UNIVERSAL_CREATIVE_LENSES.find((candidate) => candidate.id === key);
  return definition;
}

export function rankCreativeLensCandidates(input: {
  signals?: readonly string[];
  strongSignals?: readonly string[];
  businessSignals?: readonly string[];
  requestedLens?: string;
  maxCandidates?: number;
}): CreativeLensCandidate[] {
  const signals = unique([
    ...(input.signals ?? []),
    ...(input.businessSignals ?? []),
  ]);
  const strongSignals = unique(input.strongSignals ?? []);

  const scored = UNIVERSAL_CREATIVE_LENSES.map((definition) => {
    const result = definitionScore(definition, signals, strongSignals);
    const requested = normalize(input.requestedLens ?? "");
    const requestBoost = requested && requested === definition.id ? .32 : 0;
    const score = metric(result.score + requestBoost);
    return {
      lens: definition.label,
      score,
      family: definition.family,
      reason: result.hits.length
        ? `Supported by ${result.hits.slice(0, 4).join(", ")}.`
        : `Potentially useful because it can change perception without changing reality.`,
      supportedSignals: result.hits.slice(0, 8),
      forbiddenRealityMoves: [...definition.forbiddenRealityMoves],
    } satisfies CreativeLensCandidate;
  });

  const topDefinitions = [...UNIVERSAL_CREATIVE_LENSES]
    .map((definition) => ({
      definition,
      score: definitionScore(definition, signals, strongSignals).score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  const compounds: CreativeLensCandidate[] = [];
  for (let i = 0; i < topDefinitions.length; i += 1) {
    for (let j = i + 1; j < topDefinitions.length; j += 1) {
      const first = topDefinitions[i]!.definition;
      const second = topDefinitions[j]!.definition;
      if (first.id === second.id) continue;
      const score = compoundScore(first, second, signals, strongSignals);
      if (score < .48) continue;
      compounds.push({
        lens: `${first.label} + ${second.label}`,
        score: metric(score - .08),
        family: "compound",
        reason: `Combines ${first.label}'s framing pressure with ${second.label}'s realization mechanics.`,
        supportedSignals: unique([
          ...definitionScore(first, signals, strongSignals).hits,
          ...definitionScore(second, signals, strongSignals).hits,
        ]).slice(0, 8),
        forbiddenRealityMoves: unique([
          ...first.forbiddenRealityMoves,
          ...second.forbiddenRealityMoves,
        ]),
      });
    }
  }

  const nativeScore = input.strongSignals?.length
    ? metric(.5 + Math.min(.4, strongSignals.length * .03))
    : .55;

  scored.push({
    lens: "NONE",
    score: nativeScore,
    family: "none",
    reason: "Preserve native reality when a treatment does not materially improve the discovered meaning.",
    supportedSignals: [],
    forbiddenRealityMoves: [
      "do not force a frame",
      "do not add concrete reality",
      "do not rewrite chronology",
    ],
  });

  return [...scored, ...compounds]
    .sort((a, b) => b.score - a.score || a.lens.localeCompare(b.lens))
    .slice(0, Math.max(3, input.maxCandidates ?? 10));
}
