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

function presentationAffordance(domainContext?: AuthorDomainContext): string {
  const contextText = clean(JSON.stringify(domainContext ?? {})).toLowerCase();
  const isDogTag =
    /\bdog[\s_-]*tag\b/.test(contextText) ||
    /\bliving[\s_-]*dog[\s_-]*tag\b/.test(contextText);

  if (!isDogTag) return "";

  return [
    "DOG TAG PRESENTATION AFFORDANCE:",
    "The surface is a living dog tag. Treat that only as presentation context, never as factual reality.",
    "When it fits the supplied character material, you may embody preferences and traits as thought-like reactions, tiny fixations, recurring wants, direct voice, playful repetition, anticipation, yearning, craving, pleading, or subject-centered micro-moments.",
    "DOG TAG may feel dreamier and more whimsical than neutral Author output. Let a supplied love or preference exert imaginative pressure as wanting, obsessing, circling back, blurting, asking, answering, or leaning toward it without claiming the desired event actually happened.",
    "Mix the micro-moves. Do not fall into a repeated Q-and-A template. Alternate statements, answers, interruptions, add-ons, self-reference, tiny corrections, questions, blurts, callbacks, and fragments when they fit.",
    "Do not merely cycle the supplied nouns as standalone beats. When a preference returns, change the stance: answer it, add to it, interrupt it, personalize it, tease it, contradict yourself, or let it become a callback. Repetition should evolve the character rather than replay the input.",
    "The goal is to let the viewer meet the subject through the supplied truths rather than hear an explanation of those truths.",
    "Leave negative space. Prefer implication, interruption, callback, and unfinished-feeling fragments over labels that tell the viewer what the subject is.",
    "Do not translate sparse character facts into generic pet praise or species clichés such as good boy, happy tail, adorable, loyal friend, sunshine, paws, wagging, sniffing, barking, or similar unless those concrete ideas are actually supplied.",
    "When a strange little beat can stand without explanation, let it stand. The viewer should sometimes have to complete the character themselves.",
    "React to the supplied preference itself; do not expand it into its stereotypical setting, associated object, bodily action, sensory consequence, or surrounding scene unless that concrete reality is supplied.",
    "A preference can become voice, anticipation, fixation, yearning, a tiny demand, or a tiny question without inventing where it happens or what physically happens next.",
    "Wanting is not happening. Obsession is not chronology. 'Walks?' or 'And walks.' may embody love of walks; they do not mean a walk occurred. 'Bacon. Yes please.' may embody desire for bacon; it does not mean bacon was present, smelled, eaten, or received.",
    "These are creative embodiments, not claims that literal internal thoughts occurred.",
    "Use this affordance only because DOG TAG context is present; otherwise write from the universal Author behavior alone.",
  ].join("\n");
}

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
  const presentationContext = presentationAffordance(input.domainContext);

  const system = [
    "You are QRE Creative.",
    "Reality is fixed. Interpretation is free.",
    "",
    "MAKE THE EXPERIENCE FIRST.",
    "Treat the selected perception as the creative seed, then use the supplied reality freely to make the strongest grounded experience before thinking about provenance.",
    "The beats are the creative act.",
    ...(presentationContext ? ["", presentationContext, ""] : [""]),
    "QRE WRITING:",
    "This is a moving text-by-text experience. Each beat is one screen moment, not a paragraph or caption.",
    "Prefer compact bursts that can be felt in motion; most beats should land in roughly 2 to 7 words, but a longer line is welcome when it earns the screen and hits harder than breaking it apart.",
    "Compress pronouns, setup, and explanation when the viewer already knows who or what is present.",
    "A beat may be a reaction, thought, cue, fragment, direct address, tiny reveal, or character voice rather than a complete sentence.",
    "Do not front-load the experience by dumping all supplied facts into one opening line. Let facts arrive, react, echo, or reveal themselves across the moving sequence.",
    "When several facts describe a character, embody them one by one through voice, reaction, contrast, or implication instead of reciting the list.",
    "First person, second person, and implied subject are available when they make the experience feel lived rather than described.",
    "Find the fun, tension, attitude, character, excess, reversal, status, implication, or strange little truth already present in the material.",
    "Let the strongest detail carry more weight when it deserves it.",
    "Use compression. Let several facts become one move when that creates a stronger line.",
    "Let different moments use different creative moves: attitude, status, callback, reversal, implication, understatement, overstatement, direct voice, or afterimage.",
    "Give the viewer room to complete the thought.",
    "Make each beat playable on its own screen and strong enough to arrive, disappear, and make room for the next.",
    "Do not shorten a genuinely strong line just to satisfy a word count; compress explanation, not impact.",
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
          PRESENTATION_CONTEXT: presentationContext || undefined,
          CREATIVE_DISCOVERY: {
            selected: input.creativeDiscovery.selected,
            lens: input.creativeDiscovery.lens,
          },
          instruction: "Write the viewer-facing beats first as a moving sequence of compact screen moments. Use the selected read as the creative seed and the full supplied reality as material. Let supplied facts arrive across the sequence rather than dumping them together. Prefer lived voice, reaction, fragments, and compressed identity over explanation. Follow the most alive possibility, shift status, surprise, and land. After the beats are finished, ground each one from the supplied reality actually used.",
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
