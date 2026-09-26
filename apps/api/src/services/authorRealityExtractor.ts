import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

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

export type AuthorRealityReceipt = {
  subject: string;
  facts: string[];
  model: string;
  modelCalls: number;
};

export async function extractAuthorReality(input: {
  prompt: string;
  subject?: string;
  facts?: readonly string[];
  sourceMoments?: readonly string[];
}): Promise<AuthorRealityReceipt> {
  const suppliedFacts = unique(input.facts ?? []);

  // Known factual receipts do not need another model pass.
  if (suppliedFacts.length >= 2) {
    return {
      subject: clean(input.subject) || "the subject",
      facts: suppliedFacts,
      model: "supplied",
      modelCalls: 0,
    };
  }

  const source = unique([
    ...suppliedFacts,
    ...(input.sourceMoments ?? []),
    clean(input.prompt),
  ]).join("\n");

  const system = [
    "You are QRE Reality Extractor.",
    "Your only job is to recover concrete reality explicitly supplied by the user.",
    "Do not create story, meaning, consequence, likely conditions, before-states, after-states, emotion, or creative framing.",
    "User instructions are not facts. Creative requests are not facts.",
    "Split compound input into small independent factual statements when grammar supports the split.",
    "Preserve explicit times, actions, objects, places, states, and relationships.",
    "Never infer dirt from cleaning, mess from housekeeping, happiness from completion, or any plausible condition that was not stated.",
    "Resolve the semantic subject when it is explicit. Do not mistake a date, place, request word, or style instruction for the subject.",
    "Return JSON only: {\"subject\":\"...\",\"facts\":[\"...\"]}.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          suppliedSubject: clean(input.subject) || undefined,
          source,
        }),
      },
    ],
    "json",
    {
      model: process.env.QRE_AUTHOR_UTILITY_MODEL,
      numPredict: 320,
      temperature: 0.18,
    },
  );

  const parsed = parseJson(result.text);
  const extracted = Array.isArray(parsed?.facts)
    ? parsed!.facts.filter((value): value is string => typeof value === "string")
    : [];

  const facts = unique(extracted);

  return {
    subject: clean(parsed?.subject) || clean(input.subject) || "the subject",
    /*
     * Fail closed. If extraction cannot recover explicit facts, do not promote
     * the raw prompt/source moment into current reality: it may contain style,
     * instructions, context, or other non-evidence language.
     */
    facts: facts.length ? facts : suppliedFacts,
    model: result.model,
    modelCalls: 1,
  };
}
