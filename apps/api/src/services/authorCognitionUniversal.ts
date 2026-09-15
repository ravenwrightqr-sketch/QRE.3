/* QRE UNIVERSAL COGNITION ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· semantic interpretation only */
import type {
  AuthorDomainContext,
  AuthorMetamorphicRelationSet,
  CreativeFrameSelection,
  RealityGraph,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import {
  buildAuthorCreativeSpine,
  type AuthorCreativeSpine,
} from "./authorCreativeSpine.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph: RealityGraph;
  creativeSpine?: AuthorCreativeSpine;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  trajectory?: string[];
  creativeLearningContext?: string[];
  returning?: boolean;
  visitNumber?: number;
};

export type AuthorCreativeInterpretation = {
  id: string;
  thesis: string;
  creativeOpportunity: string;
  rationale: string;
  evidenceEventIds: string[];
  confidence: number;
};

export type AuthorAdaptiveQuestion = {
  kind: "who" | "where" | "when" | "event" | "detail";
  question: string;
  reason: string;
};

export type AuthorCognitionPlan = {
  selectedLens: string;
  frame: CreativeFrameSelection;
  interpretations: AuthorCreativeInterpretation[];
  semanticRelations: AuthorMetamorphicRelationSet;
  selectedRelationId?: string;
  adaptiveQuestions: AuthorAdaptiveQuestion[];
  attentionStrategy: string;
  reasoningSummary: string[];
  model: string;
  modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n)
    ? Number(Math.max(0, Math.min(1, n)).toFixed(3))
    : fallback;
};
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const FRAMES = new Set([
  "comedy", "funny", "noir", "romance", "romantic", "horror", "heist", "game",
  "fierce", "courtroom", "military", "documentary", "deadpan", "tender", "surreal",
  "wild", "spy", "mission", "speedrun", "tournament", "investigation", "backstage",
  "transformation", "race", "restoration", "expedition", "quest", "countdown", "archive",
]);
const PSYCH = /\b(?:happy|happiness|sad|sadness|anxious|anxiety|contentment|motive|motivation|personality|felt|feeling)\b/i;
const INTERNAL = /\b(?:cognition|planner|candidate|trajectory|viewer state|semantic turn|compiler|realizer|provenance|evidence id|metamorphic)\b/i;
const GENERIC = /\b(?:a day|the journey|something special|special moment|good times|beautiful moment|the experience)\b/i;

function parse(text: string): Record<string, unknown> | undefined {
  const cleaned = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(cleaned);
    return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const value = JSON.parse(cleaned.slice(start, end + 1));
      return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
}

function validIds(value: unknown, graph: RealityGraph): string[] {
  const known = new Set(graph.events.map((event) => event.id));
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? [value]
      : [];
  return unique(raw.map(clean).filter((id) => known.has(id)));
}
const COGNITION_LENS_ALIASES: Record<string, string> = {
  funny: "comedy",
  romantic: "romance",
  affectionate: "tender",
  lovingly: "tender",
  playful: "comedy",
  intense: "fierce",
};

const COGNITION_LENS_WORDS = new Set([
  "comedy",
  "romance",
  "horror",
  "heist",
  "game",
  "fierce",
  "courtroom",
  "military",
  "documentary",
  "deadpan",
  "tender",
  "surreal",
  "wild",
  "spy",
  "mission",
  "speedrun",
  "tournament",
  "investigation",
  "backstage",
  "transformation",
  "race",
  "restoration",
  "expedition",
  "quest",
  "countdown",
  "archive",
]);

function canonicalExplicitLens(value: string): string {
  const parts = clean(value)
    .toLowerCase()
    .split(/\s*(?:\+|>|\/|,|;|\band\b)\s*/i)
    .map((part) =>
      part
        .split(/\s+/)
        .filter((word) => !["slightly", "very", "really", "somewhat", "specific"].includes(word))
        .join(" "),
    )
    .map((part) => COGNITION_LENS_ALIASES[part] ?? part)
    .filter((part) => COGNITION_LENS_WORDS.has(part));

  return unique(parts).join("+");
}
function chooseFrame(
  parsed: Record<string, unknown> | undefined,
  explicit: string,
  graph: RealityGraph,
): CreativeFrameSelection {
  const rawFrame = parsed?.frame && typeof parsed.frame === "object"
    ? parsed.frame as Record<string, unknown>
    : {};
   const explicitLens = clean(explicit);
const explicitCanonical = canonicalExplicitLens(explicitLens);

const requested = clean(
  rawFrame.frame ??
  parsed?.selectedLens ??
  explicitCanonical,
).toLowerCase();

const normalized = requested.replace(/[^a-z0-9_+-]/g, "");

  const evidenceEventIds = validIds(
    rawFrame.evidenceEventIds ?? parsed?.frameEvidenceEventIds,
    graph,
  );

  const explicitChosen =
  explicitCanonical && explicitLens.toLowerCase() !== "let qre decide"
    ? explicitCanonical
    : "";

  const modelText = [
    clean(parsed?.selectedLens),
    clean(rawFrame.coreTension),
    clean(rawFrame.creativeGain),
    clean(rawFrame.templateRisk),
    ...(Array.isArray(parsed?.interpretations)
      ? parsed.interpretations
          .filter((value): value is Record<string, unknown> =>
            Boolean(value) && typeof value === "object",
          )
          .flatMap((value) => [
            clean(value.thesis),
            clean(value.creativeOpportunity),
            clean(value.rationale),
          ])
      : []),
  ].join(" ");

  const literalPlotLeak =
    /\b(?:target|targets|thieves|thief|team|weapon|victim|vulnerability|vulnerabilities|lure|control|exploit|exploited|mission|enemy|attack|attacker)\b/i.test(
      modelText,
    );

  const modelChosen =
    !explicitChosen &&
    FRAMES.has(normalized) &&
    graph.events.length > 0 &&
    !literalPlotLeak
      ? normalized
      : "";
  const chosen = explicitChosen || modelChosen;

  return {
    mode: chosen ? "frame" : "none",
    frame: chosen || "NONE",
    confidence: clamp(
      rawFrame.confidence ?? parsed?.frameConfidence,
      chosen ? 1 : 0.4,
    ),
    coreTension: clean(rawFrame.coreTension ?? parsed?.coreTension),
    creativeGain: clean(rawFrame.creativeGain ?? parsed?.creativeGain),
    templateRisk: clean(rawFrame.templateRisk ?? parsed?.templateRisk),
    evidenceEventIds,
  };
}
function fallbackInterpretations(spine: AuthorCreativeSpine): AuthorCreativeInterpretation[] {
  return spine.relationSet.relations.slice(0, 6).map((relation, index) => ({
    id: `interpretation-${relation.id}`,
    thesis: relation.feltEffect,
    creativeOpportunity: relation.creativeOpportunity,
    rationale: `${relation.viewerShift}; ${relation.languageAim}.`,
    evidenceEventIds: relation.evidenceEventIds,
    confidence: clamp(relation.confidence, 0.5 - index * 0.03),
  }));
}

function fallbackQuestions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const out: AuthorAdaptiveQuestion[] = [];
  if (!clean(input.subject)) out.push({ kind: "who", question: "Who or what is this about?", reason: "The focal subject is missing." });
  if (!clean(input.place) && !input.realityGraph.events.some((event) => event.place)) out.push({ kind: "where", question: "Where did this happen?", reason: "Place may add meaningful context." });
  if (!input.realityGraph.events.some((event) => event.time) && !/(today|yesterday|tomorrow|morning|afternoon|evening|night|\d{1,2}:\d{2}|\d{4})/i.test(input.prompt)) {
    out.push({ kind: "when", question: "When did this happen?", reason: "Time may establish useful continuity." });
  }
  return out.slice(0, 3);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const spine = input.creativeSpine ?? buildAuthorCreativeSpine({
    graph: input.realityGraph,
    subject: input.subject,
    lens: input.lens,
    returning,
  });
  const explicitLens = clean(input.lens);
const compact = {
    subject: clean(input.subject) || "unknown",
    place: clean(input.place) || "unknown",
    prompt: clean(input.prompt),
    lens: explicitLens || "NONE",
    creatorContext: input.domainContext ?? null,
    returning,
    memory: (input.memoryContext ?? []).slice(0, 20),
    learning: (input.creativeLearningContext ?? []).slice(0, 20),
    events: input.realityGraph.events.map((event) => ({
      id: event.id,
      label: event.label,
      salient: Boolean(event.salient),
      place: event.place,
      time: event.time,
      entities: event.entities,
    })),
    relations: input.realityGraph.relations.map((relation) => ({
      from: relation.from,
      to: relation.to,
      kind: relation.kind,
      strength: relation.strength,
    })),
    selectedRelationId: spine.selectedRelationId,
  };

  let parsed: Record<string, unknown> | undefined;
  let model = "deterministic";
  let modelCalls = 0;

 
try {
const result = await localModelGenerate(
[
{
role: "system",
content: [
"You are QRE universal cognition.",
"RealityGraph is authoritative. Never invent concrete facts, people, actions, outcomes, chronology, motives, emotions, capabilities, locations, or events.",
"Creative Spine contains grounded semantic relationships discovered from the supplied reality. Treat those relationships as evidence, not fiction.",
"A lens is selective pressure. It may change language, emphasis, rhythm, attitude, framing, humor, or intensity, but never the underlying facts.",
"Your primary job is to find the most interesting grounded meaning in the supplied reality.",
"Look for connections between supplied facts, especially contrasts, recurrence, continuation, consequence, recognition, and changes in meaning.",
"Use non-adjacent facts when they create a stronger grounded reading.",
"Prefer a surprising interpretation that is actually supported by the supplied evidence over a generic theme.",
"When no lens is supplied, evaluate whether a creative frame would materially improve the realization.",
"If a frame would materially improve the realization, select one grounded frame. If not, return selectedLens as null and frame as null.",
"A frame may change emphasis, language, rhythm, humor or attitude, but it must never create plot or new reality.",
"When several readings are plausible, choose genuinely different grounded interpretations.",
"Do not invent motives, missions, targets, bait, enemies, crimes, weapons, or events.",
"Do not optimize for event coverage. Optimize for the strongest grounded creative possibility.",
"Do not force intensity. A precise observation is better than invented drama.",
"Return compact JSON only with selectedLens, frame, and interpretations.",
"Each interpretation must contain evidenceEventIds and a plain-language thesis describing the meaning discovered in the supplied reality.",
"Do not describe how the experience should be produced. Do not write customer-facing prose.",
"Each interpretation should state the discovered meaning in plain language. Do not lead with or repeat an internal mechanism label.",
"Keep it compact. Interpretations are semantic guidance to the Artist, not visible prose or production directions.",
"Never leak internal architecture language to customer-facing output.",
].join("\n"),
},
{
role: "user",
content: JSON.stringify({
reality: compact,
selectedRelationship: (() => {
const relation = spine.relationSet.relations.find(
(item) => item.id === spine.selectedRelationId,
);
return relation
? {
evidenceEventIds: relation.evidenceEventIds,
feltEffect: relation.feltEffect,
viewerShift: relation.viewerShift,
languageAim: relation.languageAim,
}
: null;
})(),
lens: explicitLens || "NONE",
}),
},
],
"json",
{
  numPredict: 1000,
  temperature: 0.9,
  jsonSchema: {
    type: "object",
    additionalProperties: false,
    required: ["selectedLens", "frame", "interpretations"],
    properties: {
      selectedLens: {
        type: "string",
        minLength: 1,
      },
      frame: {
        type: "string",
        minLength: 1,
      },
      interpretations: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["evidenceEventIds", "thesis"],
          properties: {
            evidenceEventIds: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: { type: "string" },
            },
            thesis: {
              type: "string",
              minLength: 1,
              maxLength: 500,
            },
            creativeOpportunity: {
              type: "string",
              maxLength: 300,
            },
            rationale: {
              type: "string",
              maxLength: 300,
            },
          },
        },
      },
    },
  },
} as const,
);

parsed = parse(result.text);
model = result.model;
modelCalls = 1;
} catch {
// Deterministic semantic relations remain sufficient for Author to continue.
}

  const frame = chooseFrame(parsed, explicitLens, input.realityGraph);
  const selectedLens = frame.frame;
  const interpretations = Array.isArray(parsed?.interpretations)
    ? parsed.interpretations.slice(0, 10).flatMap((value, index) => {
        if (!value || typeof value !== "object") return [];
        const row = value as Record<string, unknown>;
        const thesis = clean(row.thesis ?? row.meaning);
        const creativeOpportunity = clean(row.creativeOpportunity);
        const rationale = clean(row.rationale);
        if (!thesis || GENERIC.test(thesis) || INTERNAL.test(thesis) || PSYCH.test(thesis)) return [];
        const evidenceEventIds = validIds(row.evidenceEventIds, input.realityGraph);
        if (!evidenceEventIds.length) return [];
        return [{
          id: clean(row.id) || `interpretation-${index + 1}`,
          thesis,
          creativeOpportunity: creativeOpportunity || "grounded semantic opportunity",
          rationale: rationale || "grounded in supplied evidence",
          evidenceEventIds,
          confidence: clamp(row.confidence, 0.6),
        } satisfies AuthorCreativeInterpretation];
      })
    : [];

  const adaptiveQuestions = Array.isArray(parsed?.adaptiveQuestions)
    ? parsed.adaptiveQuestions.flatMap((value) => {
        if (!value || typeof value !== "object") return [];
        const row = value as Record<string, unknown>;
        const kind = clean(row.kind) as AuthorAdaptiveQuestion["kind"];
        const question = clean(row.question);
        const reason = clean(row.reason);
        if (!question || !["who", "where", "when", "event", "detail"].includes(kind) || PSYCH.test(question)) return [];
        return [{ kind, question, reason: reason || "Additional supplied detail may sharpen the experience." }];
      })
    : [];

  return {
    selectedLens,
    frame: { ...frame, frame: selectedLens },
    interpretations: interpretations.length ? interpretations : fallbackInterpretations(spine),
    semanticRelations: spine.relationSet,
    selectedRelationId: spine.selectedRelationId,
    adaptiveQuestions: unique(
      [...adaptiveQuestions, ...fallbackQuestions(input)].map((value) => JSON.stringify(value)),
    ).map((value) => JSON.parse(value) as AuthorAdaptiveQuestion).slice(0, 4),
    attentionStrategy: clean(parsed?.attentionStrategy) || spine.lensTreatment.languageAim,
    reasoningSummary: Array.isArray(parsed?.reasoningSummary)
      ? parsed.reasoningSummary.filter((value): value is string => typeof value === "string").map(clean).filter(Boolean).slice(0, 10)
      : spine.relationSet.relations.slice(0, 5).map((relation) => `${relation.type}: ${relation.feltEffect}`),
    model,
    modelCalls,
  };
}


