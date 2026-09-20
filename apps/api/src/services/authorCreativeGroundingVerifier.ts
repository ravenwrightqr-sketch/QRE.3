import type { AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function parseJson(text: string): Record<string, unknown> | undefined {
  const source = clean(text)
    .replace(/^\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`$/i, "")
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

type Verification = {
  grounded?: unknown;
  sourceEventIds?: unknown;
};

export async function verifyAuthorCreativeGrounding(input: {
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  suppliedReality: readonly { id: string; text: string }[];
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
}> {
  if (!input.scenes.length) {
    return {
      scenes: [],
      model: "none",
      modelCalls: 0,
    };
  }

  const system = [
    "You are QRE Semantic Grounding.",
    "Protect literal truth without flattening creative language.",
    "",
    "Read each finished beat in context.",
    "Preserve metaphor, personification, idiom, status language, exaggeration, attitude, and playful framing when a reasonable viewer reads them as nonliteral.",
    "A beat is grounded when every concrete real-world claim it makes is supported by SUPPLIED_REALITY.",
    "A beat may freely add figurative meaning around supplied facts.",
    "Mark grounded=false only when the beat materially asserts a new concrete person, object, action, condition, sensory fact, motive, chronology, or outcome that is not supplied.",
    "",
    "For every grounded beat, cite the supplied event IDs that actually carry its literal anchor.",
    "The writer may provide groundingHint IDs. Treat them as clues, not authority; keep, replace, or expand them based on the actual words.",
    "Do not judge style, quality, humor, or taste.",
    "Do not rewrite the beat.",
    "Return exactly one verification entry per beat, in the same order as BEATS.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          BEATS: input.scenes.map((scene) => ({
            text: scene.text,
            groundingHint: scene.sourceEventIds,
          })),
          instruction:
            "Verify every beat in the same order. groundingHint is only a clue from the writer; correct it when needed. Preserve figurative freedom. Return grounded=true whenever the line is supported literally or is clearly figurative around supplied reality. Return grounded=false only for unsupported concrete claims.",
        }),
      },
    ],
    "json",
    {
      numPredict: 420,
      temperature: 0.12,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["verifications"],
        properties: {
          verifications: {
            type: "array",
            minItems: input.scenes.length,
            maxItems: input.scenes.length,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["grounded", "sourceEventIds"],
              properties: {
                grounded: { type: "boolean" },
                sourceEventIds: {
                  type: "array",
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  const raw = Array.isArray(parsed?.verifications)
    ? parsed!.verifications
    : [];

  const allowedIds = new Set(input.suppliedReality.map((event) => event.id));
  const scenes = input.scenes.flatMap((scene, index) => {
    const value = raw[index];
    if (!value || typeof value !== "object") return [];

    const item = value as Verification;
    if (item.grounded !== true) return [];

    const sourceEventIds = Array.isArray(item.sourceEventIds)
      ? unique(
          item.sourceEventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedIds.has(id)),
        )
      : [];

    if (!sourceEventIds.length) return [];

    return [{
      ...scene,
      sourceEventIds,
    }];
  });

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}
