/**
 * QRE CANONICAL ARTIST / CREATIVE REALIZER
 *
 * RealityGraph owns concrete truth.
 * Creative Spine exposes grounded semantic leverage and lens pressure.
 * Cognition supplies interpretations.
 * The Artist owns visible language, rhythm, ordering and treatment.
 *
 * The output is moving screen text. No Movie object, film ontology,
 * screenplay directions, production metadata, or deterministic taste judge
 * participates in the creative choice.
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

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer state|compiler|realizer|provenance|evidence id|metamorphic|semantic turn|author architecture|creative spine)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|the relationship between|changes what is worth noticing)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
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
  _index: number,
  _spine: AuthorCreativeSpine,
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
    .map((event) => ({
      id: event.id,
      score: overlap(sceneText, eventText(event)),
    }))
    .filter((item) => item.score >= 0.18)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];

  const best = scored[0]!.score;

  return scored
    .filter((item) => item.score >= Math.max(0.22, best * 0.55))
    .slice(0, 2)
    .map((item) => item.id);
}
function validateSet(raw: unknown, input: { graph: RealityGraph; spine: AuthorCreativeSpine }): ValidationResult {
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
    const sourceEventIds = bindProvenance(scene.sourceEventIds, index, input.spine, input.graph, text);
    if (!sourceEventIds.length) return { reason: `screen ${index + 1} could not be grounded to supplied reality` };
    scenes.push({ text, kind, sourceEventIds, score: 1 });
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
        knownCapabilities: unique(input.domainContext.knownCapabilities ?? []).slice(0, 24),
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
    frame: clean(input.lens) || "NONE",
    sourceReality: input.graph.events.map((event) => ({ id: event.id, text: eventText(event), entities: event.entities, place: event.place, time: event.time })),
    metamorphicRelations: input.spine.relationSet.relations.slice(0, 12).map((relation) => ({
      id: relation.id,
      mechanism: relation.mechanism,
      creativeOpportunity: relation.creativeOpportunity,
      realizationMove: relation.realizationMove,
      before: relation.before,
      after: relation.after,
      evidenceEventIds: relation.evidenceEventIds,
      feltEffect: relation.feltEffect,
      viewerShift: relation.viewerShift,
    })),
    creativeOpportunities: input.spine.opportunities.slice(0, 8),
    lensTreatment: input.spine.lensTreatment,
    interpretations: input.interpretations.slice(0, 8),
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
    "Creative Spine exposes grounded semantic leverage discovered from that reality.",
    "Metamorphic relations are invisible creative mechanics. Use them; never name them, explain them or turn them into plot.",
    "Recurrence can create rhythm or a callback.",
    "Continuation can create return or progression.",
    "Contrast can create juxtaposition.",
    "Convergence can create a reveal or payoff.",
    "Expectation shift can create a delayed landing.",
    "Consequence can create a final landing.",
    "State change can create transition.",
    "Make something people would actually want to watch.",
    "Recognition can bring an established detail back with changed meaning.",
    "A metamorphic relation never authorizes a new concrete event.",
    "Never turn a semantic mechanism into unsupported people, actions, objects, dialogue, motives, threats, targets, missions, enemies or plot.",
    "Memory can accumulate meaning. When an established detail returns, use that return when it creates recognition, contrast, accumulation or payoff.",
    "Cognition contains interpretations. They are inspiration, not instructions.",
    "An explicit lens is optional creative pressure. When supplied, use it. When absent, discover the strongest grounded creative pressure yourself from reality, memory and metamorphic relations.",
    "Business or service context can push creative intent, audience and desired effect, but it never creates reality.",
    "Make ordinary material worth watching. Find the hidden relationship inside mundane details.",
    "Let the scanner connect the dots.",
    "Do not explain a connection when ordering, omission, repetition, juxtaposition, interruption or payoff can make it felt.",
    "You own visible language, ordering, rhythm, number of screens and final treatment.",
    "Write the actual words the scanner experiences.",
    "Prefer fragments, short sentences, deliberate gaps and unexpected ordering when they strengthen the treatment.",
    "A longer line is allowed only when it earns its length.",
    "When an idea is visual, express it through the actual visible language. Never describe how it should be produced.",
    "Never output labels such as VISUAL, CAMERA, SHOT, EDIT, B-ROLL, TIME-LAPSE, RAPID-CUT, SCENE DIRECTION or similar.",
    "Never write production directions.",
    "Never add concrete reality that was not supplied.",
    "Do not reinterpret ordinary preferences as vulnerabilities, targets, threats, leverage, lures, control, thieves, teams, missions, enemies or attacks unless the supplied reality explicitly supports those ideas.",
    "Never turn a figurative lens into a literal plot.",
    "Do not produce a summary or list of facts unless that is genuinely the strongest creative treatment.",
    "One screen is one attention beat, not necessarily one fact.",
    "Create four genuinely different treatments.",
    "Vary the hook, central relationship, ordering, rhythm, framing, callback, contrast, interruption and payoff.",
    "Prefer implication over explanation.",
    "Prefer recognition over repetition.",
    "Prefer a discovered relationship over a labeled concept.",
    "After creating the four treatments, select the strongest one yourself using selectedSetIndex.",
    "Return JSON only: {\"selectedSetIndex\":0,\"sets\":[{\"scenes\":[{\"text\":\"...\",\"kind\":\"hook\",\"sourceEventIds\":[\"...\"]}]}]}",
    "selectedSetIndex is zero-based and refers only to the generated treatments.",
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
      selectedSetIndex: { type: "integer", minimum: 0, maximum: 3 },
      sets: {
        type: "array",
        minItems: 4,
        maxItems: 4,
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
                  kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] },
                  sourceEventIds: { type: "array", items: { type: "string" }, maxItems: 3 },
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
          { role: "user", content: JSON.stringify(context({ prompt: input.prompt, subject: input.subject, lens: input.lens, graph: input.graph, spine: input.creativeSpine, interpretations: input.interpretations, domainContext: input.domainContext, memoryContext: input.memoryContext, priorScenes: input.priorScenes, creativeLearningContext: input.creativeLearningContext })) },
        ],
        "json",
        { numPredict: 10000, temperature: [1.05, 1.15, 1.1][attempt]!, jsonSchema: schema },
      );
      model = result.model;
      modelCalls += 1;

      const parsed = parseJson(result.text);
      const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
      const rawSelected = Number(parsed?.selectedSetIndex);
      const selectedSetIndex = Number.isInteger(rawSelected) && rawSelected >= 0 && rawSelected < rawSets.length ? rawSelected : undefined;

      const validSets = rawSets.flatMap((raw, index) => {
        const validation = validateSet(raw, { graph: input.graph, spine: input.creativeSpine });
        if (!validation.scenes) {
          rejectedSets += 1;
          if (validation.reason) rejectedReasons.push(`treatment ${index + 1}: ${validation.reason}`);
          return [];
        }
        return [{ index, scenes: validation.scenes }];
      });

      if (!validSets.length) continue;
      const chosen = validSets.find((candidate) => candidate.index === selectedSetIndex) ?? validSets[validSets.length - 1]!;
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
