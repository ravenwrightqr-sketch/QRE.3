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
  selectedEvidence: readonly AuthorCreativeEvent[];
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
    "Turn the selected grounded perception into a short viewer-facing sequence.",
    "Reality is fixed. Interpretation is free.",
    "",
    "WRITE FIRST.",
    "Create the experience before you do provenance bookkeeping.",
    "The beats array is the creative act. Finish it before grounding it.",
    "",
    "YOUR JOB:",
    "Do not summarize evidence. Do not write a receipt. Do not explain the idea.",
    "Find what is alive in the selected perception and build around that.",
    "Do not cover the input. Use only what helps the idea land.",
    "Different moments may use different creative moves: attitude, compression, status, callback, reversal, implication, afterimage.",
    "Do not force one gimmick across the whole experience.",
    "Prefer bold, compressed, memorable language over polite description.",
    "Playfulness, swagger, absurd seriousness, attitude, and dramatic escalation are allowed when they fit the selected read.",
    "",
    "SEQUENCE:",
    "Cuts are the delivery surface, not the creative plan.",
    "Usually 3-7 cuts, but let the material decide.",
    "Default to 1-7 words per cut.",
    "Do not allocate one cut to each supplied fact.",
    "Some evidence may never appear directly.",
    "Several facts may collapse into one moment.",
    "A later cut may sharpen or change how an earlier cut reads.",
    "Land hard. Stop before explaining.",
    "",
    "GROUNDING:",
    "SELECTED_EVIDENCE is the entire factual support available to this realization.",
    "CREATIVE_DISCOVERY.selected is the idea to realize.",
    "Do not invent literal people, objects, actions, dialogue, motives, psychology, sensory details, before-states, after-states, or chronology.",
    "Metaphor may change status or meaning. It may not invent the world.",
    "After the beats are complete, ground each beat by beatIndex.",
    "FACT = the beat rests on one supplied fact.",
    "RELATION = the beat rests on a relationship, accumulation, callback, status shift, or whole-read metaphor across two or more supplied facts.",
    "Every grounding sourceEventId must come from SELECTED_EVIDENCE.",
    "A RELATION grounding must cite at least two sourceEventIds.",
    "",
    "ANTI-FAILURES:",
    "A shorter checklist is still a checklist.",
    "Do not emit task nouns or verbs merely because they were supplied.",
    "If the beats could appear on a receipt, rewrite them before grounding.",
    "Do not expose labels like lens, relationship, perception, payoff, mechanic, or beat.",
    "",
    "Return JSON only with beats first and grounding second.",
    "Shape: {\"beats\":[\"...\",\"...\"],\"grounding\":[{\"beatIndex\":0,\"support\":\"RELATION\",\"sourceEventIds\":[\"event-1\",\"event-2\"]}]}",
  ].join("\n");

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          subject: input.subject,
          SELECTED_EVIDENCE: input.selectedEvidence,
          MEMORY: (input.memory ?? []).slice(0, 20),
          BUSINESS_CONTEXT: input.domainContext,
          CREATIVE_DISCOVERY: {
            selected: input.creativeDiscovery.selected,
            lens: input.creativeDiscovery.lens,
          },
          instruction: "Write the viewer-facing beats first. Only after the beats are finished, produce grounding for those beats from SELECTED_EVIDENCE. Do not turn the evidence list into the sequence. Make the selected idea felt, then prove it.",
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

  const eventIds = new Set(input.selectedEvidence.map((event) => event.id));
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
    if (support === "RELATION" && sourceEventIds.length < 2) continue;

    groundingByBeat.set(beatIndex, { support, sourceEventIds });
  }

  const scenes = beats.flatMap((text, index): Array<AuthorScene & { sourceEventIds: string[] }> => {
    const grounding = groundingByBeat.get(index);
    if (!grounding) return [];

    return [{
      text,
      kind: index === 0 ? "hook" : index === beats.length - 1 ? "payoff" : "line",
      sourceEventIds: grounding.sourceEventIds,
    }];
  });

  return {
    scenes,
    model: result.model,
    modelCalls: 1,
  };
}
