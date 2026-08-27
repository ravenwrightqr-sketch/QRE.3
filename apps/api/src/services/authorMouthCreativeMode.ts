/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: classify viewer-facing creative expression without authoring new reality.
 * LAW: QRE may surprise us.
 * Creative modes are soft scoring signals, never hard templates.
 */

export type MouthCreativeMode =
  | "literal"
  | "frame"
  | "intensify"
  | "obsess"
  | "dream"
  | "payoff";

export type MouthCreativeModeScores = Record<MouthCreativeMode, number>;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const ABSTRACT = /\b(?:thought|dream|dreaming|favorite|obsession|obsessed|fixation|problem|season|finally|apparently|naturally|obviously|serious|ridiculous|fabulous|joyous|again|still|only|always|never|somehow|wonder|wants?|wish(?:es)?|would|could|maybe|feels?|felt|remember|memory|love|loves|devotion|beautiful|strange|wild|perfect)\b/i;
const PAYOFF = /\b(?:finally|at last|and there it is|there it is|worth it|enough|done|the end|case closed|nailed it|perfect|apple)\b/i;
const INTENSITY = /\b(?:so|very|obsession|obsessed|favorite|serious|absolute|nothing but|all|everywhere|dream|devotion|fixation|addicted|love|loves|fabulous|joyous)\b/i;
const CONCRETE_ASSERTION = /\b(?:ran|runs|running|chased|chases|chasing|grabbed|grabs|entered|enters|left|leaves|returned|returns|opened|opens|closed|closes|called|calls|kissed|kisses|hugged|hugs|laughed|laughs|cried|cries|drove|drives|jumped|jumps|sniffed|sniffs|wagged|wags|stared|stares|paused|pauses|appeared|appears|suddenly happened)\b/i;

export function scoreCreativeModes(text: string): MouthCreativeModeScores {
  const value = clean(text);
  if (!value) {
    return { literal: 1, frame: 0, intensify: 0, obsess: 0, dream: 0, payoff: 0 };
  }

  const abstract = ABSTRACT.test(value) ? 1 : 0;
  const payoff = PAYOFF.test(value) ? 1 : 0;
  const intensity = INTENSITY.test(value) ? 1 : 0;
  const concrete = CONCRETE_ASSERTION.test(value) ? 1 : 0;

  const scores: MouthCreativeModeScores = {
    literal: clamp01(1 - abstract * 0.35),
    frame: clamp01(0.34 + abstract * 0.5),
    intensify: clamp01(0.22 + intensity * 0.62),
    obsess: clamp01(abstract * 0.3 + intensity * 0.58),
    dream: clamp01(/\b(?:dream|dreaming|thought|wish|wonder|favorite)\b/i.test(value) ? 0.95 : 0.08),
    payoff: clamp01(0.16 + payoff * 0.78),
  };

  if (concrete) {
    scores.frame = clamp01(scores.frame - 0.28);
    scores.intensify = clamp01(scores.intensify - 0.18);
    scores.obsess = clamp01(scores.obsess - 0.16);
    scores.dream = clamp01(scores.dream - 0.08);
  }

  return Object.fromEntries(
    Object.entries(scores).map(([key, score]) => [key, Number(score.toFixed(3))]),
  ) as MouthCreativeModeScores;
}

export function preferredCreativeMode(scores: MouthCreativeModeScores): MouthCreativeMode {
  const order: MouthCreativeMode[] = ["payoff", "dream", "obsess", "intensify", "frame", "literal"];
  return order.reduce((best, mode) => scores[mode] > scores[best] ? mode : best, "literal");
}
