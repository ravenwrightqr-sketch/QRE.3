/**
 * QRE CANONICAL ARTIST
 *
 * The artifact is a sequence-text film: text moving as a sequence of
 * attention-changing screens. `SequenceCandidate` is a grounded semantic
 * sequence possibility. Artist never picks a conventional movie, genre, shot,
 * soundtrack, camera treatment, or production plan.
 *
 * Cognition discovers relationships. Artist chooses one proposition.
 * Creative Realizer / Mouth makes that proposition visible.
 */
import type { AuthorCreativeProposition, AuthorDomainContext, RealityGraph, SequenceCandidate } from "@qre/contracts";
import type { CreativeLensCandidate } from "./authorCreativeLens.js";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";

export type ArtistDirectionPart = { text: string; sourceEventIds: string[] };

export type AuthorArtistDirection = {
  creativeProposition: AuthorCreativeProposition;
  mechanic: ArtistDirectionPart;
  hook: ArtistDirectionPart;
  openLoop: ArtistDirectionPart;
  tension: ArtistDirectionPart;
  surprise: ArtistDirectionPart;
  payoff: ArtistDirectionPart;
};

export type AuthorArtistChoice = {
  selectedLens: string;
  attentionStrategy: string;
  artistDirection: AuthorArtistDirection;
  model: string;
  modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const partSchema = {
  type: "object", additionalProperties: false, required: ["text", "sourceEventIds"],
  properties: { text: { type: "string", minLength: 1, maxLength: 180 }, sourceEventIds: { type: "array", minItems: 1, maxItems: 6, items: { type: "string" } } },
} as const;
const propositionSchema = {
  type: "object", additionalProperties: false, required: ["text", "pattern", "sourceEventIds"],
  properties: { text: { type: "string", minLength: 1, maxLength: 180 }, pattern: { type: "string", minLength: 1, maxLength: 120 }, sourceEventIds: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } } },
} as const;
const schema: LocalModelJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["selectedLens", "attentionStrategy", "creativeProposition", "artistDirection"],
  properties: {
    selectedLens: { type: "string", minLength: 1, maxLength: 80 },
    attentionStrategy: { type: "string", minLength: 1, maxLength: 240 },
    creativeProposition: propositionSchema,
    artistDirection: { type: "object", additionalProperties: false, required: ["mechanic", "hook", "openLoop", "tension", "surprise", "payoff"], properties: { mechanic: partSchema, hook: partSchema, openLoop: partSchema, tension: partSchema, surprise: partSchema, payoff: partSchema } },
  },
};

const PRODUCTION = /\b(?:camera|close[- ]?up|wide shot|medium shot|tight shot|zoom|pan|dolly|tracking shot|montage|dissolve|smash cut|sound design|sound effect|sfx|voice[- ]?over|voiceover|soundtrack|music cue|lighting cue|transition|shoot|footage)\b/i;
const NEW_ACTOR = /\b(?:employee|employees|worker|workers|customer|customers|staff|manager|crew chief|owner|visitor|audience|viewer)\b/i;
const UNSUPPORTED_CERTAINTY = /\b(?:obviously|definitely|secretly|deliberately|intentionally|purposely|genuinely)\b/i;
const FUTURE = /\b(?:will|would then|next,?\s+the|later,?\s+the)\b/i;
const INSTRUCTION = /^(?:find|show|make|create|use|lead with|begin with|end with|put|let)\b/i;

function risky(text: string): boolean {
  return !clean(text) || PRODUCTION.test(text) || NEW_ACTOR.test(text) || UNSUPPORTED_CERTAINTY.test(text) || FUTURE.test(text) || INSTRUCTION.test(text);
}
function normalizeIds(raw: unknown, valid: Set<string>, max = 6): string[] {
  const values = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : typeof raw === "string" ? [raw] : [];
  return unique(values).filter((id) => valid.has(id)).slice(0, max);
}
function normalizePart(raw: unknown, valid: Set<string>, fallback: string): ArtistDirectionPart {
  const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const text = clean(row.text) || fallback;
  const ids = normalizeIds(row.sourceEventIds, valid);
  return { text: risky(text) || !ids.length ? fallback : text, sourceEventIds: ids };
}

function fallbackDirection(subject: string, events: RealityGraph["events"]): AuthorArtistDirection {
  const ids = events.slice(0, 2).map((event) => event.id);
  const details = events.slice(0, 3).map((event) => clean(event.label)).filter(Boolean);
  const proposition: AuthorCreativeProposition = {
    text: details.length >= 2 ? `${subject}: ${details[0]} changes the meaning of ${details[1]}.` : `${subject} is more specific than it first appears.`,
    pattern: details.length >= 2 ? "relationship" : "specificity",
    sourceEventIds: ids,
  };
  return {
    creativeProposition: proposition,
    mechanic: { text: proposition.text, sourceEventIds: ids },
    hook: { text: details[0] || subject, sourceEventIds: ids.slice(0, 1) },
    openLoop: { text: details[1] || "What changes the reading?", sourceEventIds: ids },
    tension: { text: details.length >= 2 ? `${details[0]} / ${details[1]}` : proposition.text, sourceEventIds: ids },
    surprise: { text: "The later detail should make the earlier detail mean more.", sourceEventIds: ids },
    payoff: { text: proposition.text, sourceEventIds: ids },
  };
}

export async function chooseArtistDirection(input: {
  prompt: string;
  subject: string;
  graph: RealityGraph;
  subjectMaterial?: Record<string, string[]>;
  sequences: readonly SequenceCandidate[];
  lensCandidates: readonly CreativeLensCandidate[];
  domainContext?: AuthorDomainContext;
}): Promise<AuthorArtistChoice> {
  const valid = new Set(input.graph.events.map((event) => event.id));
  const fallback = fallbackDirection(input.subject, input.graph.events);
  const lenses = input.lensCandidates.slice(0, 8).map((candidate, index) => ({ index, lens: clean(candidate.lens), family: candidate.family, reason: clean(candidate.reason), score: candidate.score }));
  const sequenceOptions = input.sequences.slice(0, 10).map((candidate, index) => ({ index, id: candidate.id, hypothesis: clean(candidate.hypothesis[0]), relations: unique(candidate.supportingRelationKinds), anchors: unique(candidate.anchorEventIds), unresolvedQuestion: clean(candidate.unresolvedQuestion), payoff: clean(candidate.payoff) }));

  try {
    const response = await localModelGenerate(
      [
        {
          role: "system",
          content: [
            "You are QRE Artist.",
            "The output is a sequence-text film: moving text across attention-changing screens. It is not a conventional movie.",
            "Cognition has already discovered grounded relationships. You choose one central creative proposition from those relationships and supplied subject material.",
            "Do not choose a movie, genre, camera, shot, soundtrack, transition, production method, or filmmaker trope.",
            "A proposition is the one specific idea that makes these supplied details belong together. It is not a topic, mood, instruction, slogan, or noun list.",
            "Examples of proposition form: 'Coco has a priority system.' 'People don't store things. They postpone decisions.' 'The job turns problems into tests.' 'The small detail everybody remembers.' These are examples of structural form, not templates.",
            "Look for actual organizing relationships: priority, hierarchy, contradiction, recurrence, transformation, dependency, accumulation, precision, scarcity, excess, identity, hidden complexity, recurring failure or success, or another pattern directly supported by the supplied reality.",
            "Memory is additional reality. It may create recurrence, recognition, changed charge, callback, or continuity, but never invent a fact.",
            "A boring service is not a template. Discover what its real details imply about the work itself.",
            "Return only the selected lens, attention strategy, central proposition, and six short direction parts around that same proposition. Every text part must cite supplied event ids.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            subject: input.subject,
            prompt: clean(input.prompt),
            subjectMaterial: input.subjectMaterial ?? null,
            suppliedReality: input.graph.events.slice(0, 40).map((event) => ({ id: event.id, label: event.label, entities: event.entities, place: event.place, time: event.time, salient: event.salient })),
            relations: input.graph.relations.slice(0, 40),
            patterns: input.graph.patterns?.slice(0, 20) ?? [],
            memories: input.graph.events.filter((event) => event.provenance === "memory").slice(0, 20).map((event) => ({ id: event.id, label: event.label })),
            existingSequencePossibilities: sequenceOptions,
            lensCandidates: lenses,
          }),
        },
      ],
      "json",
      { numPredict: 1200, temperature: 0.8 },
      schema,
    );
    const parsed = JSON.parse(clean(response.text)) as Record<string, unknown>;
    const rawProp = parsed.creativeProposition && typeof parsed.creativeProposition === "object" ? parsed.creativeProposition as Record<string, unknown> : {};
    const mechanicRaw = parsed.artistDirection && typeof parsed.artistDirection === "object" ? parsed.artistDirection as Record<string, unknown> : {};
    const selectedLens = clean(parsed.selectedLens) || "NONE";
    const propositionText = clean(rawProp.text) || fallback.creativeProposition.text;
    const propositionIds = normalizeIds(rawProp.sourceEventIds, valid, 8);
    normalizePart(mechanicRaw.mechanic, valid, propositionText);
    const proposition: AuthorCreativeProposition = {
      text: propositionIds.length && !risky(propositionText) ? propositionText : fallback.creativeProposition.text,
      pattern: clean(rawProp.pattern) || fallback.creativeProposition.pattern,
      sourceEventIds: propositionIds.length ? propositionIds : fallback.creativeProposition.sourceEventIds,
    };
    const direction: AuthorArtistDirection = {
      creativeProposition: proposition,
      mechanic: { text: proposition.text, sourceEventIds: proposition.sourceEventIds },
      hook: normalizePart(mechanicRaw.hook, valid, fallback.hook.text),
      openLoop: normalizePart(mechanicRaw.openLoop, valid, fallback.openLoop.text),
      tension: normalizePart(mechanicRaw.tension, valid, fallback.tension.text),
      surprise: normalizePart(mechanicRaw.surprise, valid, fallback.surprise.text),
      payoff: normalizePart(mechanicRaw.payoff, valid, fallback.payoff.text),
    };
    return { selectedLens, attentionStrategy: clean(parsed.attentionStrategy) || proposition.text, artistDirection: direction, model: response.model, modelCalls: 1 };
  } catch {
    return { selectedLens: "NONE", attentionStrategy: fallback.creativeProposition.text, artistDirection: fallback, model: "fallback", modelCalls: 0 };
  }
}
