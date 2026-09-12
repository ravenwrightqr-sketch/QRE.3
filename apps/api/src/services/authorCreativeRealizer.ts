/**
 * QRE CANONICAL CREATIVE REALIZER / MOUTH
 *
 * The output is a sequence-text film: text moving as a sequence of
 * attention-changing screens. The historical `LatentMovieCandidate` name is
 * only a compatibility carrier for a possible sequence; it is NOT a movie,
 * screenplay, shot list, camera plan, soundtrack, transition plan, or
 * audiovisual production abstraction.
 *
 * Reality owns concrete truth.
 * Cognition discovers semantic relationships.
 * Artist chooses one creative proposition.
 * Mouth makes that proposition visible as moving text.
 * Judge is diagnostic only and never chooses the art.
 */

import type {
  AuthorDomainContext,
  AuthorScene,
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";
import type { AuthorArtistDirection } from "./authorArtistChoice.js";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";
import { judgeRealizedFilm, type RealizedFilmJudgment } from "./authorRealizedFilmJudge.js";

export type RealizedScene = AuthorScene & {
  sourceEventIds: string[];
  score: number;
};

export type AuthorRealizationResult = {
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;
  /** Historical compatibility only. Artist does not choose a movie. */
  selectedMovieIndex?: number;
  /** The single generated sequence-text realization. */
  selectedSetIndex?: number;
  judgment?: RealizedFilmJudgment;
  reason?: string;
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type Parsed = { scenes?: unknown };

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): Set<string> => new Set(clean(text).toLowerCase().match(/[a-z0-9]+/g) ?? []);
const overlap = (left: string, right: string): number => {
  const a = words(left); const b = words(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};
const clamp = (value: number, fallback = 0): number => {
  const n = Number.isFinite(value) ? value : fallback;
  return Number(Math.max(0, Math.min(1, n)).toFixed(3));
};

const INTERNAL = /\b(?:cognition|planner|candidate|trajectory|viewer state|compiler|realizer|provenance|evidence ids?|latent movie|creative opportunity|semantic turn|selectedMovie|sequence semantics)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|the viewer|the audience|the narrative|the significance|the relationship between)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|it was meaningful|it was special|it was important|worth noticing)\.?$/i;
const PRODUCTION = /\b(?:camera|close[- ]?up|wide shot|medium shot|tight shot|zoom|pan|dolly|tracking shot|montage|dissolve|smash cut|sound design|sound effect|sfx|voice[- ]?over|voiceover|score|soundtrack|music cue|lighting cue|transition)\b/i;
const FORBIDDEN_DIRECTION = /\b(?:shoot|film this|film the|cut to|fade in|fade out|show the viewer|tell the viewer)\b/i;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);
const MAX_CUTS = 24;
const MAX_BEAT_CHARS = 140;

function parseJson(text: string): Parsed | undefined {
  const normalized = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(normalized) as unknown;
    return parsed && typeof parsed === "object" ? parsed as Parsed : undefined;
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(normalized.slice(start, end + 1)) as unknown;
      return parsed && typeof parsed === "object" ? parsed as Parsed : undefined;
    } catch {
      return undefined;
    }
  }
}

function eventText(event: RealityGraph["events"][number]): string {
  return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ");
}

function sourceIdsFor(raw: unknown, graph: RealityGraph, text: string, fallback: readonly string[]): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  if (Array.isArray(raw)) {
    const explicit = unique(raw.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id));
    if (explicit.length) return explicit.slice(0, 3);
  }

  const matches = graph.events
    .map((event) => ({ id: event.id, score: overlap(text, eventText(event)) }))
    .filter((item) => item.score >= 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.id);
  if (matches.length) return matches;
  return unique(fallback).filter((id) => valid.has(id)).slice(0, 2);
}

function validateScenes(raw: unknown, graph: RealityGraph, fallbackSourceIds: readonly string[]): { scenes?: RealizedScene[]; reason?: string } {
  if (!raw || typeof raw !== "object") return { reason: "realizer response is not an object" };
  const parsed = raw as Parsed;
  if (!Array.isArray(parsed.scenes)) return { reason: "realizer response has no scenes" };
  if (parsed.scenes.length < 2) return { reason: "sequence-text film needs at least two cuts" };
  if (parsed.scenes.length > MAX_CUTS) return { reason: `sequence exceeds ${MAX_CUTS} cuts` };

  const scenes: RealizedScene[] = [];
  for (const [index, item] of parsed.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is invalid` };
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text) return { reason: `cut ${index + 1} is empty` };
    if (text.length > MAX_BEAT_CHARS) return { reason: `cut ${index + 1} exceeds ${MAX_BEAT_CHARS} characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks Author internals` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains instead of letting the text carry the idea` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };
    if (PRODUCTION.test(text) || FORBIDDEN_DIRECTION.test(text)) return { reason: `cut ${index + 1} contains production direction` };
    const rawKind = clean(scene.kind);
    const kind = ALLOWED_KINDS.has(rawKind) ? rawKind as AuthorScene["kind"] : index === 0 ? "hook" : index === parsed.scenes.length - 1 ? "payoff" : "line";
    const sourceEventIds = sourceIdsFor(scene.sourceEventIds, graph, text, fallbackSourceIds);
    if (!sourceEventIds.length) return { reason: `cut ${index + 1} cannot be grounded to supplied reality` };
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  return { scenes };
}

function fallbackScenes(input: { graph: RealityGraph; subject: string; proposition: string; sourceIds: string[] }): RealizedScene[] {
  const events = input.graph.events.filter((event) => input.sourceIds.includes(event.id));
  const primary = events[0]?.label || input.subject;
  const secondary = events[1]?.label;
  const lines: Array<{ text: string; kind: AuthorScene["kind"]; ids: string[] }> = [
    { text: primary, kind: "hook", ids: events[0] ? [events[0].id] : input.sourceIds.slice(0, 1) },
    { text: input.proposition, kind: "discovery", ids: input.sourceIds.slice(0, 2) },
  ];
  if (secondary) lines.push({ text: secondary, kind: "turn", ids: events.slice(1, 2).map((event) => event.id) });
  lines.push({ text: primary, kind: "payoff", ids: input.sourceIds.slice(-1) });
  return lines.map((line, index) => ({ text: line.text.slice(0, MAX_BEAT_CHARS), kind: line.kind, sourceEventIds: line.ids, score: clamp(0.6 + index * 0.08) }));
}

const schema: LocalModelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["scenes"],
  properties: {
    scenes: {
      type: "array",
      minItems: 2,
      maxItems: MAX_CUTS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "kind", "sourceEventIds"],
        properties: {
          text: { type: "string", minLength: 1, maxLength: MAX_BEAT_CHARS },
          kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] },
          sourceEventIds: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } },
        },
      },
    },
  },
};

export async function realizeAuthorExperience(input: {
  prompt: string;
  subject: string;
  lens?: string;
  graph: RealityGraph;
  movies?: readonly LatentMovieCandidate[];
  movie?: LatentMovieCandidate;
  artistDirection: AuthorArtistDirection;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
}): Promise<AuthorRealizationResult> {
  const movies = input.movies ?? (input.movie ? [input.movie] : []);
  const compatibilitySequence = movies[0];
  const proposition = input.artistDirection.creativeProposition;
  const sourceIds = unique(proposition.sourceEventIds);
  const context = {
    subject: input.subject,
    task: clean(input.prompt),
    centralProposition: proposition,
    artistDirection: input.artistDirection,
    suppliedReality: input.graph.events.map((event) => ({ id: event.id, text: eventText(event), salient: event.salient })).slice(0, 40),
    groundedRelationships: input.graph.relations.slice(0, 40),
    groundedPatterns: input.graph.patterns?.slice(0, 20) ?? [],
    memories: (input.memoryContext ?? []).slice(0, 20),
    priorSequenceText: (input.priorScenes ?? []).slice(-12),
    creatorContext: input.domainContext ?? null,
    compatibilitySequence: compatibilitySequence ? { id: compatibilitySequence.id, anchors: compatibilitySequence.anchorEventIds, relations: compatibilitySequence.supportingRelationKinds } : null,
    rule: "Generate one sequence-text film realization of the central proposition. Every cut must change what the reader notices. Use only language-level devices grounded in supplied reality. Never create a camera, shot, soundtrack, transition, screenplay, audiovisual instruction, invented event, invented actor, invented motive, or generic genre treatment. Do not serialize the source facts one by one. The proposition is the single creative center.",
  };

  try {
    const response = await localModelGenerate(
      [
        { role: "system", content: "You are QRE Mouth: a language artist realizing one Artist-selected proposition as moving screen text. Reality is immutable. The output is a sequence, not a conventional movie. Write only the visible text and its grounded source ids." },
        { role: "user", content: JSON.stringify(context) },
      ],
      "json",
      { numPredict: 1400, temperature: 0.82 },
      schema,
    );
    const parsed = parseJson(response.text);
    const validation = validateScenes(parsed, input.graph, sourceIds.length ? sourceIds : (compatibilitySequence?.anchorEventIds ?? []));
    if (!validation.scenes) {
      const fallback = fallbackScenes({ graph: input.graph, subject: input.subject, proposition: proposition.text, sourceIds: sourceIds.length ? sourceIds : compatibilitySequence?.anchorEventIds ?? [] });
      const judgment = compatibilitySequence ? judgeRealizedFilm({ scenes: fallback, movie: compatibilitySequence, graph: input.graph }) : undefined;
      return { scenes: fallback, score: judgment?.score ?? 0.5, model: response.model, modelCalls: 1, rejectedSets: 1, selectedSetIndex: 0, judgment, reason: validation.reason };
    }
    const judgment = compatibilitySequence
      ? judgeRealizedFilm({ scenes: validation.scenes, movie: compatibilitySequence, graph: input.graph })
      : undefined;
    return { scenes: validation.scenes, score: judgment?.score ?? 0.8, model: response.model, modelCalls: 1, rejectedSets: judgment?.accepted ? 0 : 1, selectedSetIndex: 0, judgment };
  } catch (error) {
    const fallback = fallbackScenes({ graph: input.graph, subject: input.subject, proposition: proposition.text, sourceIds: sourceIds.length ? sourceIds : compatibilitySequence?.anchorEventIds ?? [] });
    const judgment = compatibilitySequence ? judgeRealizedFilm({ scenes: fallback, movie: compatibilitySequence, graph: input.graph }) : undefined;
    return {
      scenes: fallback,
      score: judgment?.score ?? 0.5,
      model: "fallback",
      modelCalls: 0,
      rejectedSets: judgment?.accepted ? 0 : 1,
      selectedSetIndex: 0,
      judgment,
      reason: error instanceof Error ? error.message : "sequence realizer failed",
    };
  }
}
