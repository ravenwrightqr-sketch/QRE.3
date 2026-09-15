/**
 * QRE CANONICAL ARTIST / CREATIVE REALIZER
 *
 * RealityGraph owns concrete truth.
 * Cognition discovers grounded meaning.
 * Creative Spine may influence lens pressure internally, but its taxonomy never
 * becomes Artist-facing language.
 *
 * The Artist owns the visible experience: language, rhythm, ordering, omission,
 * repetition, contrast, callback and final landing.
 */
import type { AuthorDomainContext, AuthorScene, RealityGraph } from "@qre/contracts";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";
import type { AuthorCreativeSpine } from "./authorCreativeSpine.js";
import type { AuthorCreativeInterpretation } from "./authorCognitionUniversal.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };

export type AuthorRealizationResult = {
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;
  selectedSetIndex?: number;
  reason?: string;
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type ValidationResult = { scenes?: RealizedScene[]; reason?: string };

const INTERNAL = new RegExp(
  "\\b(?:cognition|planner|candidate|trajectory|evidenceEventIds|semantic turn|future thread|creative opportunity|viewer state|compiler|realizer|SequencePlay|Mouth|Author|metamorphic|creative spine|realization move|mechanism)\\b",
  "i",
);

const EXPLANATION = new RegExp(
  "\\b(?:this means|which means|the point is|the meaning is|in other words|this shows|which shows|because this|the reason is)\\b",
  "i",
);

const GENERIC = new RegExp(
  "^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|worth noticing|it was meaningful|it was special)\\.?$",
  "i",
);

const SCREENPLAY = /^(?:close(?:\\s+in)?(?:\\s+on)?|quick\\s+cut|cut\\s+to|sound\\s*:|camera\\s*:|wide\\s+shot|medium\\s+shot|tight\\s+shot|fade(?:\\s+(?:in|out|to))?|angle(?:\\s+on)?|montage|dissolve(?:\\s+to)?|smash\\s+cut)\\b/i;
const SCREENPLAY_INLINE = /\\b(?:camera|close-up|wide shot|medium shot|tight shot|sound design|sound effect|sfx|voice-over|voiceover)\\s*:/i;
const PRODUCTION_DIRECTION =
  /^\\s*(?:\\[|\\()\\s*(?:visual|camera|shot|scene direction|b-roll|edit|editing|time-lapse|timelapse|rapid-cut|rapid cut|montage|sfx|sound design|voice-over|voiceover)\\b/i;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);
const MAX_CUTS = 24;
const MAX_BEAT_CHARS = 140;

const clean = (value: unknown): string => String(value ?? "").replace(/\\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).toLowerCase().match(/[a-z0-9]+/g) ?? [];

function overlap(a: string, b: string): number {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return (2 * intersection) / (left.size + right.size);
}

function canonicalText(text: string): string {
  return clean(text)
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

function eventText(event: RealityGraph["events"][number]): string {
  return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ");
}

function parseJson(text: string): Record<string, unknown> | undefined {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
}

function bindProvenance(
  rawIds: unknown,
  graph: RealityGraph,
  sceneText: string,
): string[] {
  const valid = new Set(graph.events.map((event) => event.id));

  const supplied = Array.isArray(rawIds)
    ? unique(
        rawIds
          .filter((id): id is string => typeof id === "string")
          .filter((id) => valid.has(id)),
      )
    : [];

  if (supplied.length) return supplied.slice(0, 3);

  const scored = graph.events
    .map((event) => ({ id: event.id, score: overlap(sceneText, eventText(event)) }))
    .filter((item) => item.score >= 0.18)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const best = scored[0]!.score;
  return scored
    .filter((item) => item.score >= Math.max(0.22, best * 0.55))
    .slice(0, 2)
    .map((item) => item.id);
}

function isDuplicateLine(text: string, previous: readonly string[]): boolean {
  const canonical = canonicalText(text);
  if (!canonical) return false;
  return previous.some((item) => {
    const other = canonicalText(item);
    return other === canonical || overlap(canonical, other) >= 0.86;
  });
}

function stronglyGroundedToOneEvent(text: string, graph: RealityGraph): boolean {
  const best = graph.events.reduce((score, event) => Math.max(score, overlap(text, eventText(event))), 0);
  return best >= 0.74;
}

function sharesSingleFactPattern(text: string, graph: RealityGraph): boolean {
  return stronglyGroundedToOneEvent(text, graph) && words(text).length <= 5;
}

function looksLikeFlatFactList(scenes: readonly RealizedScene[], graph: RealityGraph): boolean {
  if (scenes.length < 3) return false;

  const averageWords =
    scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / scenes.length;

  const singleFactLines = scenes.filter((scene) => sharesSingleFactPattern(scene.text, graph)).length;
  const tinyLines = scenes.filter((scene) => words(scene.text).length <= 3).length;

  if (singleFactLines >= Math.ceil(scenes.length * 0.6) && tinyLines >= Math.ceil(scenes.length * 0.5)) {
    return true;
  }

  if (scenes.length >= 5 && averageWords <= 4.2 && singleFactLines / scenes.length >= 0.7) {
    return true;
  }

  const eventCoverage = new Map<string, number>();
  for (const scene of scenes) {
    const eventIds = scene.sourceEventIds;
    if (eventIds.length === 1) {
      eventCoverage.set(eventIds[0]!, (eventCoverage.get(eventIds[0]!) ?? 0) + 1);
    }
  }

  const maxRepeatedEvent = Math.max(0, ...eventCoverage.values());
  return scenes.length >= 5 && maxRepeatedEvent >= 3;
}

function hasRealizationMovement(scenes: readonly RealizedScene[], graph: RealityGraph): boolean {
  if (scenes.length <= 2) return true;

  const relational = scenes.some((scene) => {
    if (scene.sourceEventIds.length >= 2) return true;
    if (words(scene.text).length >= 5 && !stronglyGroundedToOneEvent(scene.text, graph)) return true;
    return /\\b(?:but|yet|still|apparently|somehow|turns out|except|instead|apparently|actually|even)\\b/i.test(scene.text);
  });

  const landing = scenes.some((scene, index) => {
    if (index < 1) return false;
    return scene.kind === "turn" || scene.kind === "payoff" || scene.kind === "afterglow";
  });

  return relational || landing;
}

function validateSet(raw: unknown, input: { graph: RealityGraph }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "treatment is not an object" };

  const row = raw as { scenes?: unknown };
  if (!Array.isArray(row.scenes)) return { reason: "treatment.scenes is missing" };
  if (row.scenes.length < 1) return { reason: "treatment contains no screens" };
  if (row.scenes.length > MAX_CUTS) return { reason: `treatment exceeds ${MAX_CUTS} screens` };

  const scenes: RealizedScene[] = [];
  const previousTexts: string[] = [];

  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `screen ${index + 1} is not an object` };

    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text) return { reason: `screen ${index + 1} is empty` };
    if (text.length > MAX_BEAT_CHARS) return { reason: `screen ${index + 1} exceeds ${MAX_BEAT_CHARS} characters` };
    if (INTERNAL.test(text)) return { reason: `screen ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `screen ${index + 1} explains instead of expressing` };
    if (GENERIC.test(text)) return { reason: `screen ${index + 1} is generic` };
    if (SCREENPLAY.test(text) || SCREENPLAY_INLINE.test(text)) return { reason: `screen ${index + 1} contains production direction` };
    if (
      PRODUCTION_DIRECTION.test(text) ||
      /\\b(?:time-lapse|timelapse|rapid-cut|rapid cut|b-roll|camera angle|camera shot)\\b/i.test(text)
    ) {
      return { reason: `screen ${index + 1} contains production direction` };
    }
    if (isDuplicateLine(text, previousTexts)) return { reason: `screen ${index + 1} repeats an earlier screen` };

    const rawKind = clean(scene.kind);
    const kind = ALLOWED_KINDS.has(rawKind)
      ? rawKind as AuthorScene["kind"]
      : index === 0
        ? "hook"
        : index === row.scenes.length - 1
          ? "payoff"
          : "line";

    const sourceEventIds = bindProvenance(scene.sourceEventIds, input.graph, text);
    if (!sourceEventIds.length) return { reason: `screen ${index + 1} could not be grounded to supplied reality` };

    scenes.push({ text, kind, sourceEventIds, score: 1 });
    previousTexts.push(text);
  }

  if (looksLikeFlatFactList(scenes, input.graph)) {
    return { reason: "treatment is a fact collage instead of a realized experience" };
  }

  if (!hasRealizationMovement(scenes, input.graph)) {
    return { reason: "treatment does not create a change in how the supplied reality is noticed" };
  }

  return { scenes };
}

function context(input: {
  prompt: string;
  subject: string;
  lens: string;
  graph: RealityGraph;
  spine: AuthorCreativeSpine;
  interpretations: readonly AuthorCreativeInterpretation[];
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
}) {
  const creatorContext = input.domainContext
    ? {
        category: clean(input.domainContext.category),
        businessType: clean(input.domainContext.businessType),
        businessName: clean(input.domainContext.businessName),
        businessDescription: clean(input.domainContext.businessDescription),
        serviceType: clean(input.domainContext.serviceType),
        serviceName: clean(input.domainContext.serviceName),
        subjectKind: clean(input.domainContext.subjectKind),
        specialties: unique(input.domainContext.specialties ?? []).slice(0, 24),
        contextualSignals: unique(input.domainContext.contextualSignals ?? []).slice(0, 24),
        creatorRole: clean(input.domainContext.creatorRole),
        audience: unique(input.domainContext.audience ?? []).slice(0, 24),
        objective: clean(input.domainContext.objective),
        desiredAction: clean(input.domainContext.desiredAction),
        creativePreferences: unique(input.domainContext.creativePreferences ?? []).slice(0, 24),
      }
    : null;

  return {
    creativeTask: clean(input.prompt),
    creatorContext,
    creatorContextRule: "Creator context shapes intent and emphasis only. It never creates reality or unsupported claims.",
    subjectReference: clean(input.subject),
    lens: clean(input.lens) || "NONE",
    sourceReality: input.graph.events.map((event) => ({
      id: event.id,
      text: eventText(event),
      entities: event.entities,
      place: event.place,
      time: event.time,
    })),
    lensTreatment: {
      primary: clean(input.spine.lensTreatment.primary),
      secondary: clean(input.spine.lensTreatment.secondary),
      feltEffect: clean(input.spine.lensTreatment.feltEffect),
    },
    interpretations: input.interpretations.slice(0, 3).map((interpretation) => ({
      evidenceEventIds: interpretation.evidenceEventIds.slice(0, 4),
      thesis: clean(interpretation.thesis),
    })),
    realityPriority: "The supplied reality is the entire factual palette. Every concrete claim must remain grounded in it.",
    memory: (input.memoryContext ?? []).slice(0, 20),
    priorScreens: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
  };
}

function artistPrompt(attempt: number, feedback: string): string {
  const attacks = [
    "Commit to one realization. Do not provide alternatives.",
    "Throw away the safest fact-list treatment. Find the strongest earned relationship already present in the supplied reality and build the whole experience around it.",
    "Make the viewer recognize something new about this subject. Start where attention naturally catches, let details accumulate toward a changed meaning, and land the strongest line.",
  ];

  return [
    "You are QRE's ONE CREATIVE ARTIST.",
    "Reality is sacred. Concrete supplied reality cannot be changed.",
    "Use the supplied reality as the entire factual palette.",
    "Cognition has already discovered grounded meaning. You are not being asked to classify or explain it.",
    "The meaning is fuel, not copy. Realize it in visible language.",
    "A lens is pressure on treatment, not permission to invent reality.",
    "Make something people would actually want to watch.",
    "Write ONE treatment only. Never create three treatments, alternatives, variants, drafts, or repeated versions inside one response.",
    "Usually fewer than eight screens is stronger. Do not pad the experience. There is no required screen count.",
    "Every screen must earn the next one. The sequence should accumulate toward a recognition, reversal, joke, contrast, callback, consequence or other changed meaning that is actually supported by the supplied reality.",
    "Do not simply walk through the supplied facts.",
    "Do not spend most of the experience naming attributes one at a time.",
    "Do not repeat a fact in slightly different words just to add screens.",
    "Do not use isolated labels such as 'Poodle.', 'Grass.', 'Apples.' as the main structure of the experience.",
    "A detail may return only when the return changes how the viewer understands it.",
    "When several supplied details belong together, connect them through the realization instead of listing them.",
    "Prefer concrete details that earn a changed meaning.",
    "Prefer implication over explanation.",
    "Prefer recognition over repetition.",
    "Use fragments when they create pull, not merely because fragments are short.",
    "A line can be longer when its length earns the landing.",
    "Never invent people, actions, objects, dialogue, motives, threats, targets, missions, enemies, locations, outcomes or chronology.",
    "Never turn figurative language into a literal event.",
    "Never write production directions.",
    "Never output internal analysis, architecture terms, mechanism names, field names, or descriptions of your reasoning.",
    "Return JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook\",\"sourceEventIds\":[\"...\"]}]}.",
    "Allowed kinds: line, hook, movement, discovery, turn, payoff, afterglow.",
    `Creative attack ${attempt + 1} of 3.`,
    feedback || attacks[Math.min(attempt, attacks.length - 1)]!,
  ].join("\\n");
}

export async function realizeAuthorExperience(input: {
  prompt: string;
  subject: string;
  lens: string;
  graph: RealityGraph;
  creativeSpine: AuthorCreativeSpine;
  interpretations: readonly AuthorCreativeInterpretation[];
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
}): Promise<AuthorRealizationResult> {
  let model = "deterministic";
  let modelCalls = 0;
  let rejectedSets = 0;
  const rejectedReasons: string[] = [];

  const schema: LocalModelJsonSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scenes"],
    properties: {
      scenes: {
        type: "array",
        minItems: 1,
        maxItems: MAX_CUTS,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "kind"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: MAX_BEAT_CHARS },
            kind: {
              type: "string",
              enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"],
            },
            sourceEventIds: {
              type: "array",
              items: { type: "string" },
              maxItems: 3,
            },
          },
        },
      },
    },
  } as const;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const feedback = rejectedReasons.slice(-3).join(" | ");

    try {
      const result = await localModelGenerate(
        [
          { role: "system", content: artistPrompt(attempt, feedback) },
          {
            role: "user",
            content: JSON.stringify(
              context({
                prompt: input.prompt,
                subject: input.subject,
                lens: input.lens,
                graph: input.graph,
                spine: input.creativeSpine,
                interpretations: input.interpretations,
                domainContext: input.domainContext,
                memoryContext: input.memoryContext,
                priorScenes: input.priorScenes,
                creativeLearningContext: input.creativeLearningContext,
              }),
            ),
          },
        ],
        "json",
        { numPredict: 2600, temperature: [1.05, 1.1, 1.15][attempt]!, jsonSchema: schema },
      );

      model = result.model;
      modelCalls += 1;

      const parsed = parseJson(result.text);
      const validation = validateSet(parsed, { graph: input.graph });

      if (!validation.scenes) {
        rejectedSets += 1;
        if (validation.reason) rejectedReasons.push(validation.reason);
        continue;
      }

      return {
        scenes: validation.scenes,
        score: validation.scenes.reduce((sum, scene) => sum + scene.score, 0) / validation.scenes.length,
        model,
        modelCalls,
        rejectedSets,
        selectedSetIndex: 0,
        reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined,
      };
    } catch (error) {
      rejectedSets += 1;
      rejectedReasons.push(error instanceof Error ? error.message : "artist realization failed");
    }
  }

  return {
    scenes: [],
    score: 0,
    model,
    modelCalls,
    rejectedSets,
    reason: rejectedReasons.join(" | ") || "no realized treatment survived validation",
  };
}
