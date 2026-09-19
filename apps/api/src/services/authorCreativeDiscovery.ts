import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!source) return undefined;

  try {
    const value = JSON.parse(source);
    return value && typeof value === "object"
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(source.slice(start, end + 1));
      return value && typeof value === "object"
        ? value as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

const clamp = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Number(Math.max(0, Math.min(1, number)).toFixed(3))
    : fallback;
};

export type AuthorCreativeDiscovery = {
  relationship: string;
  change: string;
  organizingIdea: string;
  subjectPattern: string;
  tension: string;
  surprisePotential: string;
  payoffPotential: string;
  thesis: string;
  lens: string;
  confidence: number;
  risk: string;
};

export async function discoverAuthorCreativeDirection(input: {
  facts: readonly string[];
  requestedLens?: string;
  memory?: readonly string[];
}): Promise<{
  discovery: AuthorCreativeDiscovery;
  model: string;
  modelCalls: number;
}> {
  const requestedLens = clean(input.requestedLens);

  const system = [
    "You are QRE Creative Discovery.",
    "You do NOT write the final experience. You discover the strongest creative idea hidden in supplied reality.",
    "Start from relationships among facts, not from genre vocabulary.",
    "Ask what makes this particular subject recognizable, what pattern the viewer can connect for themselves, and what supplied fact changes the meaning of another supplied fact.",
    "Look freely for an organizing idea: a subject-specific system, rule, habit, priority hierarchy, contradiction, status ladder, recurring pattern, competition, negotiation, mystery, progression, transformation, relationship, or another structure you discover. None is mandatory.",
    "A creative mechanic is a way of ORGANIZING reality. It is not a physical mechanism that changes reality.",
    "Think: REALITY -> CHARACTER/IDENTITY -> PATTERN -> CONNECTION -> SURPRISE -> MEMORY.",
    "Also think: FACT -> RELATIONSHIP -> CONSEQUENCE -> MEANING.",
    "The best discovery gives QRE something the viewer can mentally continue filling in.",
    "Entertainment matters more than sounding profound. Prefer a specific idea over a generic tone.",
    "Do not write scenes, captions, camera directions, dialogue, or final prose.",
    "Do not invent concrete people, objects, actions, conditions, operations, reactions, sensory evidence, before-states, after-states, or future events.",
    "Interpretive language is allowed. You may say the facts behave like a hierarchy, campaign, contest, negotiation, game, trial, resistance, victory, reversal, heist, comedy, horror, romance, or something else when that describes the relationship rather than asserting a literal event.",
    "Do not infer grime from cleaning, happiness from completion, or any plausible condition not supplied.",
    "A requested lens is creative intent, not permission to falsify reality.",
    "Return ONE lens only, or NONE.",
    "Return JSON only: {\"relationship\":\"...\",\"change\":\"...\",\"organizingIdea\":\"...\",\"subjectPattern\":\"...\",\"tension\":\"...\",\"surprisePotential\":\"...\",\"payoffPotential\":\"...\",\"thesis\":\"...\",\"lens\":\"...\",\"confidence\":0.0,\"risk\":\"...\"}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          facts: input.facts,
          requestedLens: requestedLens || undefined,
          relevantMemory: (input.memory ?? []).slice(0, 24),
          instruction: "Discover the idea worth creating from. Do not write the experience.",
        }),
      },
    ],
    "json",
    { numPredict: 560, temperature: 0.68 },
  );

  const parsed = parseJson(result.text);

  return {
    discovery: {
      relationship: clean(parsed?.relationship),
      change: clean(parsed?.change),
      organizingIdea: clean(parsed?.organizingIdea),
      subjectPattern: clean(parsed?.subjectPattern),
      tension: clean(parsed?.tension),
      surprisePotential: clean(parsed?.surprisePotential),
      payoffPotential: clean(parsed?.payoffPotential),
      thesis: clean(parsed?.thesis),
      lens: clean(parsed?.lens) || requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.65),
      risk: clean(parsed?.risk),
    },
    model: result.model,
    modelCalls: 1,
  };
}
