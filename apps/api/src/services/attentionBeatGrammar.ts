export type AttentionBeatPlan = {
  rhythm: string[];
  beatRules: string[];
  payoffRules: string[];
};

export function buildAttentionBeatPlan(round = 1): AttentionBeatPlan {
  const rhythm = round > 1
    ? ["JOLT", "JOLT", "JOLT", "PAYOFF"]
    : ["JOLT", "JOLT", "JOLT", "PAYOFF"];

  const beatRules = [
    "One beat per scene.",
    "Keep the beats physically separate but causally unified.",
    "Prefer 4–7 words per beat.",
    "Use 8–12 words only when a moment genuinely needs them.",
    "A short fragment is allowed when it lands harder.",
    "Every jolt must change what the viewer notices, expects, or believes.",
    "Do not explain a jolt after delivering it.",
    "Do not combine multiple locations or actions into one beat.",
    "Do not repeat the same emotional beat in different words.",
  ];

  const payoffRules = [
    "The payoff completes the same attention thread.",
    "The payoff may reframe the previous jolts.",
    "The payoff should feel earned, not appended.",
    "Prefer a final image, status inversion, callback, reveal, or sharp joke.",
  ];

  return { rhythm, beatRules, payoffRules };
}
