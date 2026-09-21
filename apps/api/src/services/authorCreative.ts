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
  const contextRecord = (domainContext ?? {}) as Record<string, unknown>;
  const contextText = clean(JSON.stringify(contextRecord)).toLowerCase();
  const isDogTag =
    /\bdog[\s_-]*tag\b/.test(contextText) ||
    /\bliving[\s_-]*dog[\s_-]*tag\b/.test(contextText);
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const isIdentity = experienceMode === "IDENTITY";

  if (!isDogTag || !isIdentity) return "";

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
    "Use this affordance only because DOG TAG + IDENTITY context is present. DOG TAG memories do not use this affordance; they return to universal memory behavior.",
  ].join("\n");
}

async function chooseCreativeDraft(input: {
  suppliedReality: readonly AuthorCreativeEvent[];
  firstBeats: string[];
  firstGrounding: unknown[];
  retryBeats: string[];
  retryGrounding: unknown[];
}): Promise<{ bestDraft: 0 | 1; model: string; modelCalls: number }> {
  const result = await localModelGenerate(
    [
      {
        role: "system",
        content: [
          "You are QRE Creative Draft Critic.",
          "Choose which complete draft better realizes the SAME supplied reality.",
          "Truth is mandatory, but bland literalism is not enough.",
          "Reward: source-specific attitude, implication, juxtaposition, compression, character, perceptual reframe, afterimage, and lines that could only plausibly come from this supplied material.",
          "Penalize: generic summaries, one-label-per-fact structure, decorative imagery, cute/domain clichés, imported scenery, weather, light, body parts, sensory detail, objects, motives, causes, outcomes, or physical actions not supplied.",
          "Creative transformation may change perception, framing, attitude, metaphor, status, or emotional pressure. It may not become a new concrete fact.",
          "A simpler grounded line beats a prettier invented line.",
          "Judge the draft as a sequence, not isolated vocabulary.",
          "Return bestDraft=0 for FIRST_DRAFT or bestDraft=1 for RETRY_DRAFT.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          SUPPLIED_REALITY: input.suppliedReality,
          FIRST_DRAFT: {
            beats: input.firstBeats,
            grounding: input.firstGrounding,
          },
          RETRY_DRAFT: {
            beats: input.retryBeats,
            grounding: input.retryGrounding,
          },
          instruction:
            "Pick the draft with the strongest grounded creative force. Do not prefer novelty merely because it is more poetic.",
        }),
      },
    ],
    "json",
    {
      numPredict: 220,
      temperature: 0.08,
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["bestDraft", "reason"],
        properties: {
          bestDraft: { type: "integer", minimum: 0, maximum: 1 },
          reason: { type: "string", maxLength: 220 },
        },
      },
    },
  );

  const parsed = parseJson(result.text);
  return {
    bestDraft: Number(parsed?.bestDraft) === 1 ? 1 : 0,
    model: result.model,
    modelCalls: 1,
  };
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
  const contextRecord = (input.domainContext ?? {}) as Record<string, unknown>;
  const experienceMode = clean(contextRecord.experienceMode).toUpperCase();
  const isMemoryExperience = experienceMode === "MEMORY";
  const realityDirect =
    clean(input.creativeDiscovery.selected.id).toLowerCase() === "reality-direct";

  const system = [
    "You are QRE Creative.",
    "Reality is fixed. Interpretation is free.",
    "",
    "MAKE THE EXPERIENCE FIRST.",
    realityDirect
      ? "DISCOVERY FOUND NO SAFE HIDDEN THESIS. Do not use the fallback's meta wording as creative content. Shape the supplied reality itself: notice the strongest tension, attitude, contrast, reaction, status shift, or strange little turn already present and make that felt."
      : "Treat the selected perception as the creative seed, then use the supplied reality freely to make the strongest grounded experience before thinking about provenance.",
    "The beats are the creative act.",
    ...(presentationContext ? ["", presentationContext, ""] : [""]),
    "QRE WRITING:",
    isMemoryExperience
      ? "This is a moving text-by-text memory experience. Each beat is one screen moment, not a paragraph or caption."
      : "This is a moving text-by-text experience. Each beat is one screen moment, not a paragraph or caption.",
    "Prefer compact bursts that can be felt in motion; most beats should land in roughly 2 to 7 words. A slightly longer line is allowed only when it clearly hits harder than splitting it.",
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
    "Do not assign one beat to every fact. Facts may disappear, fuse, echo, or become setup for another beat.",
    "Do not label the facts when you can stage their attitude. Prefer a lived reaction, turn, or implication over abstract nouns such as resistance, contentment, transformation, freedom, or victory.",
    "Do not force novelty for its own sake. If the supplied reality already has a clean playable turn, use it instead of adding decorative imagery or unrelated texture.",
    "Contextual texture must grow directly out of the physical envelope of a supplied event. It may intensify what is already inherent in that event, but it may not import unrelated scenery, weather, light, body parts, sensory details, objects, or surroundings merely to make a state feel prettier or more cinematic.",
    "A strong beat may be simple. Prefer specific, grounded attitude over ornamental wording.",
    "Do not pad the sequence. Small memories usually need only enough beats to create movement and a residue; stop once the experience lands.",
    "A later beat can change how an earlier beat feels.",
    "End on the line that leaves the strongest residue. Do not append explanatory, reflective, rhetorical-question, or maybe/finally epilogues after the payoff.",
    "",
    "CREATIVE FREEDOM:",
    "Metaphor, idiom, personification, double meaning, swagger, absurd seriousness, playfulness, and dramatic status are available tools.",
    "Use the supplied entities and actions as the real-world cast.",
    "The selected perception leads the experience; it does not forbid other supplied facts from becoming useful material.",
    "Keep literal reality anchored to SUPPLIED_REALITY while allowing interpretation to move freely around it.",
    "When a supplied fact is an emotion or state, do not turn it into an unsupplied bodily manifestation or physical behavior. Happy is not wagging, smiling, jumping, moving, or posture unless those actions are supplied. If you want to dramatize a state, use voice, attitude, compression, metaphor, or reaction instead of inventing body behavior.",
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
          instruction: realityDirect
            ? "Write the viewer-facing beats first from the supplied reality itself. There is no approved hidden thesis, so do not invent one and do not repeat the fallback meta wording. Find the strongest playable movement already inside the facts. Use attitude, reaction, implication, compression, hyperbole, and contextual story texture where they do not rewrite material history. Do not simply rename every fact, but do not force extra creativity either: prefer a clean grounded turn over decorative imagery. Let some facts disappear or fuse if that makes the experience stronger. If the ending fact is an emotion or state, realize that state through language or attitude, not an invented bodily action. Do not end in abstract labels, and do not pad after the strongest landing. Then ground each beat from the supplied reality actually used."
            : "Write the viewer-facing beats first as a moving sequence of compact screen moments. Use the selected read as the creative seed and the full supplied reality as material. Let supplied facts arrive across the sequence rather than dumping them together. Prefer lived voice, reaction, fragments, and compressed identity over explanation. Follow the most alive possibility, shift status, surprise, and land. After the beats are finished, ground each one from the supplied reality actually used.",
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

  let selectedResult = result;
  let extraModelCalls = 0;
  let parsed = parseJson(result.text);
  let beats = Array.isArray(parsed?.beats)
    ? parsed!.beats.map(clean).filter(Boolean).slice(0, 10)
    : [];
  let rawGrounding = Array.isArray(parsed?.grounding)
    ? parsed!.grounding
    : [];
  const firstParsed = parsed;
  const firstBeats = [...beats];
  const firstGrounding = [...rawGrounding];

  const flatSequenceGrounding = rawGrounding.filter((value) => {
    if (!value || typeof value !== "object") return false;
    const grounding = value as RawGrounding;
    const beatIndex = Number(grounding.beatIndex);
    const support = clean(grounding.support).toUpperCase();
    const sourceEventIds = Array.isArray(grounding.sourceEventIds)
      ? grounding.sourceEventIds.filter((id): id is string => typeof id === "string")
      : [];
    return (
      Number.isInteger(beatIndex) &&
      beatIndex >= 0 &&
      beatIndex < beats.length &&
      support === "FACT" &&
      sourceEventIds.length === 1
    );
  }).length;

  const flatSequence =
    realityDirect &&
    beats.length >= 4 &&
    flatSequenceGrounding >= Math.ceil(beats.length * 0.8);

  if (flatSequence) {
    const retry = await localModelGenerate(
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
            FLAT_DRAFT: {
              beats,
              grounding: rawGrounding,
            },
            instruction:
              "Revise the FLAT_DRAFT; do not reimagine it from scratch. Its problem is one-beat-per-fact structure, not lack of decoration. Preserve any clean grounded beats that already work, then improve only the weak transitions or combinations. Use fewer, stronger moves when possible. Do not solve flatness by importing imagery. Do not invent new physical events, body behavior, causes, motives, places, outcomes, scenery, weather, light, body parts, sensory details, or objects. Contextual texture is allowed only when it directly intensifies the physical envelope of a supplied event. Prefer attitude, implication, juxtaposition, voice, compression, callback, or recontextualization of supplied material over new imagery. Let facts fuse or disappear when stronger. Stop when the memory lands. Return only the revised beats and their grounding.",
          }),
        },
      ],
      "json",
      {
        numPredict: 700,
        temperature: 0.76,
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

    const retryParsed = parseJson(retry.text);
    const retryBeats = Array.isArray(retryParsed?.beats)
      ? retryParsed!.beats.map(clean).filter(Boolean).slice(0, 10)
      : [];
    const retryGrounding = Array.isArray(retryParsed?.grounding)
      ? retryParsed!.grounding
      : [];

    if (retryBeats.length && retryGrounding.length) {
      const choice = await chooseCreativeDraft({
        suppliedReality: input.suppliedReality,
        firstBeats,
        firstGrounding,
        retryBeats,
        retryGrounding,
      });
      extraModelCalls += choice.modelCalls;

      if (choice.bestDraft === 1) {
        selectedResult = retry;
        parsed = retryParsed;
        beats = retryBeats;
        rawGrounding = retryGrounding;
      } else {
        selectedResult = result;
        parsed = firstParsed;
        beats = firstBeats;
        rawGrounding = firstGrounding;
      }
    }
  }

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
    model: selectedResult.model,
    modelCalls: (flatSequence ? 2 : 1) + extraModelCalls,
  };
}
