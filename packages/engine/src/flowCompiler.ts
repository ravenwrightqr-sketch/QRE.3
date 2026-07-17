import type { FlowAction } from "@qre/contracts";

type Tier = "BASIC" | "PRO" | "BUSINESS";

type CompileInput = {
  input: string;
  tier?: Tier;
};

export function compileFlow({
  input,
  tier = "BASIC",
}: CompileInput): { actions: FlowAction[] } {
  const text = input.toLowerCase().trim();

  const actions: FlowAction[] = [];

  const intents = {
    greeting: /(hello|hi|welcome|start|intro)/.test(text),
    delay: /(wait|pause|hold|slow)/.test(text),
    navigation: /(shop|store|menu|browse|products?|go to|visit)/.test(text),
    cta: /(click|button|action|continue|next)/.test(text),
    unlock: /(unlock|premium|vip|access)/.test(text),
    payment: /(pay|checkout|buy|purchase|order)/.test(text),
  };

  if (intents.greeting) {
    actions.push({
      type: "message",
      text: "Welcome to your experience.",
    });
  }

  if (intents.delay) {
    actions.push({
      type: "delay",
      ms: 1500,
    });
  }

  if (intents.navigation) {
    actions.push({
      type: "redirect",
      url: "/store",
    });
  }

  if (intents.cta) {
    actions.push({
      type: "cta",
      text: "Continue",
      url: "/store",
    });
  }

  if (intents.unlock) {
    actions.push({
      type: "unlock",
    });
  }

  if (intents.payment) {
    actions.push({
      type: "payment",
      provider: "stripe",
      amount: 0,
    });
  }

  return applyTierRules(actions, tier);
}

function applyTierRules(
  actions: FlowAction[],
  tier: Tier
): { actions: FlowAction[] } {
  const featureMatrix: Record<Tier, FlowAction["type"][]> = {
    BASIC: ["message", "redirect"],
    PRO: ["message", "redirect", "delay", "cta", "unlock"],
    BUSINESS: ["message", "redirect", "delay", "cta", "unlock", "payment"],
  };

  const depthLimit: Record<Tier, number> = {
    BASIC: 2,
    PRO: 8,
    BUSINESS: Infinity,
  };

  const allowed = featureMatrix[tier];
  const limit = depthLimit[tier];

  const filtered = actions
    .filter((a) => allowed.includes(a.type))
    .slice(0, limit);

  return { actions: filtered };
}