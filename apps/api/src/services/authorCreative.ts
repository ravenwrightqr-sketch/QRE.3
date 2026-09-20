import type { AuthorDomainContext, AuthorScene } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorCreativeDiscovery } from "./authorCreativeDiscovery.js";

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

type RawGrounding = {
  beatIndex?: unknown;
  support?: unknown;
  sourceEventIds?: unknown;
};

export type AuthorCreativeEvent = {
  id: string;
  text: string;
};

export async function createAuthorExperience(input: {
  subject: string;
  suppliedReality: readonly AuthorCreativeEvent[];
  creativeDiscovery: AuthorCreativeDiscovery;
  memory?: readonly string[];
  domainContext?: AuthorDomainContext;
}): Promise<{
  scenes: Array<AuthorScene & { sourceEventIds: string[] }>;
  model: string;
  modelCalls: number;
}> {
  const system = [
    "You are QRE Creative.",
    "Reality is fixed. Interpretation is free.",
    "",
    "MAKE THE EXPERIENCE FIRST.",
    "Treat the selected perception as the creative seed, then use the supplied reality freely to make the strongest grounded experience before thinking about provenance.",
    "The beats are the creative act.",
    "",
    "QRE WRITING:",
    "Find the fun, tension, attitude, character, excess, reversal, status, implication, or strange little truth already present in the material.",
    "Let the strongest detail carry more weight when it deserves it.",
    "Use compression. Let several facts become one move when that creates a stronger line.",
    "Let different moments use different creative moves: attitude, status, callback, reversal, implication, understatement, overstatement, or afterimage.",
    "Give the viewer room to complete the thought.",
    "Use bold, short, memorable language.",
    "Let the sequence develop rather than merely enumerate.",
    "A later beat can change how an earlier beat feels.",
    "End on the line that leaves the strongest residue.",
    "",
    "CREATIVE FREEDOM:",
    "Metaphor, idiom, personification, double meaning, swagger, absurd seriousness, playfulness, and dramatic status are available tools.",
    "Use the supplied entities and actions as the real-world cast.",
    "The selected perception leads the experience; it does not forbid other supplied facts from becoming useful material.",
    "Keep literal reality anchored to SUPPLIED_REALITY while allowing interpretation to move freely around it.",
    "",
    "GROUND AFTER WRITING:",
    "Once the beats are complete, map each beat to the evidence that supports it.",
    "FACT means one supplied fact carries the beat.",
    "RELATION means the beat is carried by a relationship, accumulation, callback, status shift, or whole-read metaphor across two or more supplied facts.",
    "Use only sourceEventIds from SUPPLIED_REALITY.",
    "Give RELATION beats at least two supporting sourceEventIds.",
    "",
    "Return JSON with beats first and grounding second.",
    "Shape: {\"beats\":[\"...\",\"...\"],\"grounding\":[{\"beatIndex\":0,\"support\":\"RELATION\",\"sourceEventIds\":[\"event-1\",\"event-2\"]}]}",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          subject: input.subject,
          SUPPLIED_REALITY: input.suppliedReality,
          MEMORY: (input.memory ?? []).slice(0, 20),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_DISCOVERY: {
            selected: input.creativeDiscovery.selected,
            lens: input.creativeDiscovery.lens,
          },
          instruction: "Write the viewer-facing beats first. Use the selected read as the creative seed and the full supplied reality as material. Follow the most alive possibility, compress freely, shift status, surprise, and land. After the beats are finished, ground each one from the supplied reality actually used.",
        }),
      },
    ],
    "json",
    {
      numPredict: 800,
      temperature: 0.88,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["beats", "grounding"],
        properties: {
          beats: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: { type: "string", maxLength: 120 },
          },
          grounding: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["beatIndex", "support", "sourceEventIds"],
              properties: {
                beatIndex: { type: "integer", minimum: 0, maximum: 9 },
                support: { type: "string", enum: ["FACT", "RELATION"] },
                sourceEventIds: {
                  type: "array",
                  minItems: 1,
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
  const beats = Array.isArray(parsed?.beats)
    ? parsed!.beats.map(clean).filter(Boolean).slice(0, 10)
    : [];
  const rawGrounding = Array.isArray(parsed?.grounding)
    ? parsed!.grounding
    : [];

  const eventIds = new Set(input.suppliedReality.map((event) => event.id));
  const groundingByBeat = new Map<number, { support: "FACT" | "RELATION"; sourceEventIds: string[] }>();

  for (const value of rawGrounding) {
    if (!value || typeof value !== "object") continue;
    const grounding = value as RawGrounding;
    const beatIndex = Number(grounding.beatIndex);
    if (!Number.isInteger(beatIndex) || beatIndex < 0 || beatIndex >= beats.length) continue;

    const support: "FACT" | "RELATION" =
      clean(grounding.support).toUpperCase() === "RELATION"
        ? "RELATION"
        : "FACT";

    const sourceEventIds = Array.isArray(grounding.sourceEventIds)
      ? unique(
          grounding.sourceEventIds
            .filter((id): id is string => typeof id === "string")
            .filter((id) => eventIds.has(id)),
        )
      : [];

    if (!sourceEventIds.length) continue;

    groundingByBeat.set(beatIndex, { support, sourceEventIds });
  }

  const scenes = beats.map((text, index): AuthorScene & { sourceEventIds: string[] } => {
    const grounding = groundingByBeat.get(index);

    return {
      text,
      kind: index === 0 ? "hook" : index === beats.length - 1 ? "payoff" : "line",
      sourceEventIds: grounding?.sourceEventIds ?? [],
    };
  });

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}
