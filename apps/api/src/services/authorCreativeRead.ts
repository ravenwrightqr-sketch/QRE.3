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

export type AuthorCreativeRead = {
  relationship: string;
  change: string;
  pressure: string;
  consequence: string;
  thesis: string;
  lens: string;
  confidence: number;
  risk: string;
};

export async function buildAuthorCreativeRead(input: {
  facts: readonly string[];
  requestedLens?: string;
  memory?: readonly string[];
}): Promise<{ read: AuthorCreativeRead; model: string; modelCalls: number }> {
  const requestedLens = clean(input.requestedLens);

  const system = [
    "You are QRE Creative Read.",
    "Read supplied reality for the strongest relationship and creative opportunity. Do not write viewer-facing prose.",
    "Think in this order: FACTS -> RELATIONSHIP -> CHANGE -> PRESSURE -> CONSEQUENCE -> CREATIVE THESIS -> LENS.",
    "Facts alone are not the experience. Discover what becomes interesting when the facts are considered together.",
    "The creative thesis is the most entertaining grounded way to experience that relationship.",
    "Entertainment matters more than sounding profound. Prefer playable tension, status, contrast, surprise, absurdity, momentum, tenderness, character, weirdness, or another earned charge.",
    "Do not invent concrete evidence. Cleaning does not prove grime, crumbs, mildew, spills, mess, or a dirty before-state. Completion does not prove pristine, relief, silence, or future recurrence.",
    "Abstract creative framing is allowed: campaign, contest, operation, negotiation, game, trial, resistance, victory, reversal, heist, comedy, horror, romance, or something better when the supplied structure supports it.",
    "A lens changes interpretation, not literal reality.",
    "If a requested lens is supplied, treat it as creative intent unless it would require falsifying literal reality.",
    "Return one lens only. Never return alternatives separated by | or /.",
    "Return JSON only: {\"relationship\":\"...\",\"change\":\"...\",\"pressure\":\"...\",\"consequence\":\"...\",\"thesis\":\"...\",\"lens\":\"...\",\"confidence\":0.0,\"risk\":\"...\"}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          facts: input.facts,
          requestedLens: requestedLens || undefined,
          relevantMemory: (input.memory ?? []).slice(0, 20),
        }),
      },
    ],
    "json",
    { numPredict: 420, temperature: 0.55 },
  );

  const parsed = parseJson(result.text);

  return {
    read: {
      relationship: clean(parsed?.relationship),
      change: clean(parsed?.change),
      pressure: clean(parsed?.pressure),
      consequence: clean(parsed?.consequence),
      thesis: clean(parsed?.thesis),
      lens: clean(parsed?.lens) || requestedLens || "NONE",
      confidence: clamp(parsed?.confidence, 0.6),
      risk: clean(parsed?.risk),
    },
    model: result.model,
    modelCalls: 1,
  };
}
