/**
 * QRE CANONICAL ARTIST / CREATIVE REALIZER
 *
 * RealityGraph owns concrete truth.
 * Cognition discovers grounded meaning.
 * Creative Spine may discover additional creative leverage, but its
 * internal taxonomy never becomes Artist-facing language.
 * The Artist owns visible language, rhythm, ordering and treatment.
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
type RawSet = { scenes?: unknown };
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

const SCREENPLAY = /^(?:close(?:\s+in)?(?:\s+on)?|quick\s+cut|cut\s+to|sound\s*:|camera\s*:|wide\s+shot|medium\s+shot|tight\s+shot|fade(?:\s+(?:in|out|to))?|angle(?:\s+on)?|montage|dissolve(?:\s+to)?|smash\s+cut)\b/i;
const SCREENPLAY_INLINE = /\b(?:camera|close-up|wide shot|medium shot|tight shot|sound design|sound effect|sfx|voice-over|voiceover)\s*:/i;
const PRODUCTION_DIRECTION =
  /^\s*(?:\[|\()\s*(?:visual|camera|shot|scene direction|b-roll|edit|editing|time-lapse|timelapse|rapid-cut|rapid cut|montage|sfx|sound design|voice-over|voiceover)\b/i;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);
const MAX_CUTS = 24;
const MAX_BEAT_CHARS = 140;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
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

function looksLikeFlatFactList(scenes: readonly RealizedScene[], graph: RealityGraph): boolean {
  if (scenes.length < 4) return false;

  const averageWords =
    scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / scenes.length;
  if (averageWords > 2.1) return false;

  const groundedLabels = scenes.filter((scene) => {
    const text = scene.text;
    return graph.events.some((event) => overlap(text, eventText(event)) >= 0.5);
  }).length;

  return groundedLabels / scenes.length >= 0.75;
}

function validateSet(raw: unknown, input: { graph: RealityGraph }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "treatment is not an object" };
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes)) return { reason: "treatment.scenes is missing" };
  if (row.scenes.length < 1) return { reason: "treatment contains no screens" };
  if (row.scenes.length > MAX_CUTS) return { reason: `treatment exceeds ${MAX_CUTS} screens` };

  const scenes: RealizedScene[] = [];
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
      /\b(?:time-lapse|timelapse|rapid-cut|rapid cut|b-roll|camera angle|camera shot)\b/i.test(text)
    ) {
      return { reason: `screen ${index + 1} contains production direction` };
    }

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
  }

  if (looksLikeFlatFactList(scenes, input.graph)) {
    return { reason: "treatment is a flat fact list instead of a realized experience" };
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

  const creativeLeverage = input.spine.relationSet.relations
    .slice(0, 3)
    .map((relation) => ({
      feltEffect: clean(relation.feltEffect),
      viewerShift: clean(relation.viewerShift),
      evidenceEventIds: relation.evidenceEventIds.slice(0, 3),
    }))
    .filter((item) => item.feltEffect || item.viewerShift);

  const lensTreatment = {
    primary: clean(input.spine.lensTreatment.primary),
    secondary: clean(input.spine.lensTreatment.secondary),
    feltEffect: clean(input.spine.lensTreatment.feltEffect),
  };

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
    creativeLeverage,
    lensTreatment,
    interpretations: input.interpretations.slice(0, 6).map((interpretation) => ({
      evidenceEventIds: interpretation.evidenceEventIds.slice(0, 4),
      thesis: clean(interpretation.thesis),
    })),
    realityPriority: "The supplied reality is the creative palette. Every concrete claim must remain grounded in it.",
    memory: (input.memoryContext ?? []).slice(0, 20),
    priorScreens: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
  };
}

function artistPrompt(attempt: number, feedback: string): string {
  const attacks = [
    "Find the strongest creative idea hidden anywhere in the supplied material and commit to it.",
    "Reject the safest treatment. Search for the unusual relationship, contradiction, rhythm, detail, joke, tension, callback or surprise that makes this subject itself.",
    "Make the result memorable tomorrow. Let the scanner discover the connection rather than explaining it.",
  ];

  return [
    "You are QRE's ONE CREATIVE ARTIST.",
    "Reality is sacred. Concrete supplied reality cannot be changed.",
    "Use the supplied reality as the entire creative palette.",
    "Cognition and Creative Spine have already done the semantic discovery. You are not being asked to classify it.",
    "You receive only grounded creative leverage in plain language. Never reproduce internal field names, architecture terms, or analysis vocabulary in the visible text.",
    "Use the supplied meaning as creative fuel, not as a sentence to paraphrase.",
    "The meaning is not the output. Realize it.",
    "A lens is pressure on treatment, not permission to invent reality.",
    "Make something people would actually want to watch.",
    "Memory can accumulate meaning. A returning established detail may carry more weight when it comes back.",
    "Never invent people, actions, objects, dialogue, motives, threats, targets, missions, enemies, locations, outcomes or chronology.",
    "Never turn figurative language into a literal event.",
    "Do not report supplied facts one by one unless that is genuinely the strongest realization.",
    "The supplied facts are the palette, not a checklist.",
    "A strong cut should make the viewer notice the supplied reality differently, create pull toward what follows, or land a realization.",
    "Do not explain the discovered meaning. Make it felt through language, ordering, omission, repetition, contrast, interruption, callback or payoff.",
    "Use fewer screens when fewer screens make the experience stronger.",
    "Do not make every screen merely name a supplied fact or attribute.",
    "Avoid label-like fragments such as a subject name followed by disconnected nouns or traits.",
    "When several supplied details belong together, connect them through the realization instead of listing them.",
    "Prefer implication over explanation.",
    "Prefer recognition over repetition.",
    "Prefer a discovered relationship over a labeled concept.",
    "Prefer concrete details that earn a changed meaning.",
    "You own visible language, ordering, rhythm, number of screens and final treatment.",
    "Write the actual words the scanner experiences.",
    "Prefer fragments, short sentences, deliberate gaps and unexpected ordering when they strengthen the treatment.",
    "A longer line is allowed only when it earns its length.",
    "Never write production directions.",
    "Never output labels such as VISUAL, CAMERA, SHOT, EDIT, B-ROLL, TIME-LAPSE, RAPID-CUT, SCENE DIRECTION or similar.",
    "Do not output internal analysis, explanations, mechanism names, field names, or descriptions of your reasoning.",
    "Create three genuinely different treatments.",
    "Vary the hook, central relationship, ordering, rhythm, framing, callback, contrast, interruption and payoff.",
    "After creating the three treatments, select the strongest one yourself using selectedSetIndex.",
    "Return JSON only: {\"selectedSetIndex\":0,\"sets\":[{\"scenes\":[{\"text\":\"...\",\"kind\":\"hook\",\"sourceEventIds\":[\"...\"]}]}]}",
    "selectedSetIndex is zero-based and refers only to the three generated treatments.",
    "Allowed kinds: line, hook, movement, discovery, turn, payoff, afterglow.",
    `Creative attack ${attempt + 1} of 3.`,
    feedback || attacks[Math.min(attempt, attacks.length - 1)]!,
  ].join("\n");
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
    required: ["selectedSetIndex", "sets"],
    properties: {
      selectedSetIndex: { type: "integer", minimum: 0, maximum: 2 },
      sets: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
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
        { numPredict: 4200, temperature: [1.05, 1.1, 1.15][attempt]!, jsonSchema: schema },
      );

      model = result.model;
      modelCalls += 1;

      const parsed = parseJson(result.text);
      const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
      const rawSelected = Number(parsed?.selectedSetIndex);
      const selectedSetIndex =
        Number.isInteger(rawSelected) && rawSelected >= 0 && rawSelected < rawSets.length
          ? rawSelected
          : undefined;

      const validSets = rawSets.flatMap((raw, index) => {
        const validation = validateSet(raw, { graph: input.graph });
        if (!validation.scenes) {
          rejectedSets += 1;
          if (validation.reason) rejectedReasons.push(`treatment ${index + 1}: ${validation.reason}`);
          return [];
        }
        return [{ index, scenes: validation.scenes }];
      });

      if (!validSets.length) continue;

      const chosen =
        validSets.find((candidate) => candidate.index === selectedSetIndex) ??
        validSets[validSets.length - 1]!;

      return {
        scenes: chosen.scenes,
        score: chosen.scenes.reduce((sum, scene) => sum + scene.score, 0) / chosen.scenes.length,
        model,
        modelCalls,
        rejectedSets,
        selectedSetIndex: chosen.index,
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
