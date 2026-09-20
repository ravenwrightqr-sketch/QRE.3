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
    "Separate the beat into its literal anchor and its figurative overlay.",
    "A figurative beat may be grounded even when its exact words never appear in reality, as long as its metaphor clearly transforms one or more supplied entities, actions, states, or relations and does not smuggle in a new concrete fact.",
    "The concrete carrier of a metaphor must come from supplied reality. Figurative freedom may personify or reframe supplied material; it may not introduce a new physical object, body part, actor, action, sensory detail, inhabitant, sound, smell, taste, or texture merely as decoration.",
    "If a beat contains any concrete noun, bodily action, or sensory event not established by supplied reality, treat that concrete content as a new claim even when the surrounding line is playful or metaphorical.",
    "Preserve metaphor, personification, idiom, status language, exaggeration, attitude, and playful framing when a reasonable viewer reads them as nonliteral.",
    "A beat is grounded only when every concrete real-world claim inside it is supported by SUPPLIED_REALITY.",
    "Figurative framing does not excuse an embedded unsupported literal claim.",
    "A supplied action proves the action occurred; it does not by itself prove an unseen prior condition, cause, motive, history, sensory state, or aftermath.",
    "A beat may freely add figurative meaning around supplied facts.",
    "Mark grounded=false when any concrete claim in the beat goes beyond supplied reality, even if other words in the same beat are metaphorical.",
    "",
    "For every grounded beat, cite the supplied event IDs that carry its literal anchor or, for a purely figurative beat, the supplied events being transformed by the metaphor.",
    "Purely figurative lines do not need a literal noun or verb match; they do need a clear semantic anchor in supplied reality.",
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
            "Verify every beat in the same order. groundingHint is only a clue from the writer; correct it when needed. For each beat, identify the supplied entity, action, state, or relation that carries the metaphor, then separate the figurative overlay. Preserve figurative language when its concrete carrier is supplied. Scan the actual words for newly introduced concrete nouns, bodily actions, sounds, smells, tastes, textures, and other sensory events. Return grounded=false when any such concrete content is unsupported by supplied reality.",
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
