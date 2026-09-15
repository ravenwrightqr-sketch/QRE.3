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

type RawSet = { scenes?: unknown };

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
const MAX_CANDIDATES = 4;
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

function validateSet(raw: unknown, input: { graph: RealityGraph }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "treatment is not an object" };

  const row = raw as RawSet;
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

  const creativeSearch = {
    groundedMeaning: input.interpretations.slice(0, 4).map((interpretation) => ({
      evidenceEventIds: interpretation.evidenceEventIds.slice(0, 4),
      thesis: clean(interpretation.thesis),
    })),
    selectedCharge: {
      feltEffect: clean(input.spine.lensTreatment.feltEffect),
      languageAim: clean(input.spine.lensTreatment.languageAim),
      pressureHints: unique(input.spine.lensTreatment.pressure ?? []).slice(0, 10),
      guardrails: unique(input.spine.lensTreatment.guardrails ?? []).slice(0, 12),
    },
    alternateGroundedCharges: input.spine.opportunities.slice(0, 6).map((opportunity) => ({
      evidenceEventIds: opportunity.evidenceEventIds.slice(0, 4),
      whyItWorks: clean(opportunity.whyItWorks),
    })),
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
    creativeSearch,
    realityPriority: "The supplied reality is the entire factual palette. Every concrete claim must remain grounded in it.",
    memory: (input.memoryContext ?? []).slice(0, 20),
    priorScreens: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
  };
}

function artistPrompt(attempt: number, feedback: string): string {
  const attacks = [
    "Search for the latent charge before writing. Then embody it without explaining it.",
    "Destroy the safest fact-list treatment. Rebuild from the strongest grounded relationship and the whole reality palette. Be materially different from the last attempt.",
    "Make the viewer recognize something they did not see coming. Use the strangest useful supplied detail, a sharp contrast, a callback, a status shift, a consequence, a joke, a metaphor, or another earned device.",
  ];

  return [
    "You are QRE's ONE CREATIVE ARTIST.",
    "Reality is sacred. Concrete supplied reality cannot be changed.",
    "The entire supplied RealityGraph is your artistic palette, not a checklist.",
    "Cognition has already searched for grounded meaning. Creative search findings are fuel, not copy.",
    "The selected lens is pressure on treatment, not permission to invent reality.",
    "The supplied facts are sacred. The supplied wording is disposable.",
    "Do not merely translate facts into a sequence of captions. Search for the relationship that makes the facts worth experiencing together.",
    "A minor supplied detail can become the hook, callback, joke, reversal, metaphorical image, pressure point or payoff when the surrounding reality earns it.",
    "The reality palette is not an inventory lock. You may pull a detail from anywhere in the supplied reality when it makes the experience funnier, stranger, clearer, more moving, more vivid or more memorable.",
    "SEARCH ACTIVE PRESSURE BEFORE DEFAULTING TO ATMOSPHERE. Look for obstacle, mission, race, countdown, competition, inspection, interruption, malfunction, recovery, transformation, before/after, status change, handoff, accumulation, escalation, reversal, reveal, absurd task, game-like progression, consequence or completion whenever the supplied reality actually supports one.",
    "These are creative possibilities, not genres. A cleaning job may become a mission. A grooming appointment may become a transformation. A repair may become a rescue. A queue may become a race. An ordinary object may become a rival, trophy, witness or obsession. Use such forms only when the reality earns them.",
    "Active, funny, blunt, kinetic, irreverent, game-like, dramatic, strange, tender, deadpan and lyrical forms are all valid. Do not default to melancholy, generic mystery, atmosphere or poetic sludge simply because it sounds artistic.",
    "Do not explain the meaning. Make it felt through selection, order, rhythm, omission, implication, irony, metaphor, repetition, collision, reversal, abstraction, personification, callback, gamification or another earned device.",
    "Metaphor is allowed. Figurative language may bend imagery without turning that imagery into a literal event.",
    "Ask what would make a human laugh, feel something, or remember this tiny piece tomorrow. Make that piece.",
    "Do not force every supplied fact into the experience. Do not force a fixed screen count. A 2-screen knockout can beat 8 dead screens. Rich reality can deserve a richer experience.",
    "Do not force chronology when a stronger truthful ordering creates a clearer realization. Never invent literal chronology that is contradicted by the source reality.",
    "Concrete truth remains the hard boundary: never invent a literal event, person, object, action, location, time, dialogue, motive, threat, target, mission, enemy, outcome, sensation or circumstance and present it as though it happened.",
    "Never write production directions or internal analysis.",
    "Generate FOUR materially different candidate treatments in one response. Change the core idea, relationship, mechanism, rhythm, ordering, compression, stance, joke, metaphor, callback or structure—not merely adjectives.",
    "At least one candidate should seriously test an active-pressure form when the reality supports it. At least one should test a materially different non-active form. The candidates are exploratory, not a scoring rubric.",
    "Order the candidates from exploration toward the strongest creative choice. Candidate four should be what you would actually ship if it remains truthful. Do not merely restate one idea four ways.",
    "Each candidate may use the supplied reality broadly. Preserve sourceEventIds whenever possible as provenance. Provenance does not restrict artistic selection.",
    "JSON ONLY: {sets:[{scenes:[{text,kind,sourceEventIds:[string]}]}]}. Return 1-4 candidates. Each candidate has 1-24 screens. No commentary.",
    "Allowed kinds: line, hook, movement, discovery, turn, payoff, afterglow.",
    `Creative attack ${attempt + 1} of 3.`,
    feedback ? `Previous attempts were rejected because: ${feedback}. Do not become safer. Become more inventive, more concrete, and more structurally varied.` : "No prior failure. Explore the full artistic space.",
    attacks[Math.min(attempt, attacks.length - 1)]!,
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
    required: ["sets"],
    properties: {
      sets: {
        type: "array",
        minItems: 1,
        maxItems: MAX_CANDIDATES,
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
        { numPredict: 4200, temperature: [1.0, 1.08, 1.15][attempt]!, jsonSchema: schema },
      );

      model = result.model;
      modelCalls += 1;

      const parsed = parseJson(result.text);
      const rawSets = Array.isArray(parsed?.sets)
        ? parsed.sets.slice(0, MAX_CANDIDATES)
        : parsed?.scenes
          ? [parsed]
          : [];

      const validSets: Array<{ scenes: RealizedScene[]; index: number }> = [];
      for (const [index, raw] of rawSets.entries()) {
        const validation = validateSet(raw, { graph: input.graph });
        if (!validation.scenes) {
          rejectedSets += 1;
          if (validation.reason) rejectedReasons.push(`candidate ${index + 1}: ${validation.reason}`);
          continue;
        }
        validSets.push({ scenes: validation.scenes, index });
      }

      if (validSets.length) {
        const winner = validSets[validSets.length - 1]!;
        const score = winner.scenes.reduce((sum, scene) => sum + scene.score, 0) / winner.scenes.length;
        return {
          scenes: winner.scenes,
          score,
          model,
          modelCalls,
          rejectedSets,
          selectedSetIndex: winner.index,
          reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined,
        };
      }
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
