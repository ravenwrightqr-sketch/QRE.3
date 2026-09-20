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
  beatIndex?: unknown;
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
    "Do not judge style, quality, humor, or taste.",
    "Do not rewrite the beat.",
    "Return one verification entry for every beat.",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          BEATS: input.scenes.map((scene, beatIndex) => ({
            beatIndex,
            text: scene.text,
          })),
          instruction:
            "Verify literal grounding while preserving figurative freedom. Return grounded=true whenever the line is supported literally or is clearly figurative around supplied reality. Return grounded=false only for unsupported concrete claims.",
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
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["beatIndex", "grounded", "sourceEventIds"],
              properties: {
                beatIndex: { type: "integer", minimum: 0, maximum: 9 },
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
  const verified = new Map<number, string[]>();

  for (const value of raw) {
    if (!value || typeof value !== "object") continue;
    const item = value as Verification;
    const beatIndex = Number(item.beatIndex);
    if (!Number.isInteger(beatIndex) || beatIndex < 0 || beatIndex >= input.scenes.length) continue;
    if (item.grounded !== true) continue;

    const sourceEventIds = Array.isArray(item.sourceEventIds)
      ? unique(
          item.sourceEventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => allowedIds.has(id)),
        )
      : [];

    if (!sourceEventIds.length) continue;
    verified.set(beatIndex, sourceEventIds);
  }

  const scenes = input.scenes.flatMap((scene, index) => {
    const sourceEventIds = verified.get(index);
    if (!sourceEventIds) return [];
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
