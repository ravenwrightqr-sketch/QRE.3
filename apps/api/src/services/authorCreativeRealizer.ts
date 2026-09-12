/**
 * QRE CANONICAL CREATIVE REALIZER / MOUTH — SEQUENCE-TEXT ONLY
 *
 * Current artifact: text moving as a sequence of attention-changing screens.
 * This layer owns visible language, rhythm, compression, and realization only.
 * It must never grow audiovisual production, genre, shot, camera, soundtrack,
 * transition, screenplay, or other presentation abstractions.
 *
 * Reality owns truth. Cognition discovers relationships. Artist chooses the
 * proposition. Mouth realizes it. Judge diagnoses the result and never chooses art.
 */
import type { AuthorDomainContext, AuthorScene, AuthorCreativeProposition, RealityGraph, SequenceCandidate } from "@qre/contracts";
import type { AuthorArtistDirection } from "./authorArtistChoice.js";
import { localModelGenerate, type LocalModelJsonSchema } from "./localModelRuntime.js";
import { judgeRealizedSequence, type RealizedSequenceJudgment } from "./authorRealizedFilmJudge.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };
export type AuthorRealizationResult = {
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;
  selectedSetIndex?: number;
  judgment?: RealizedSequenceJudgment;
  reason?: string;
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): Set<string> => new Set(clean(text).toLowerCase().match(/[a-z0-9]+/g) ?? []);
const overlap = (left: string, right: string): number => { const a = words(left); const b = words(right); if (!a.size || !b.size) return 0; let hits = 0; for (const token of a) if (b.has(token)) hits += 1; return hits / Math.max(1, a.size); };
const MAX_CUTS = 24; const MAX_CHARS = 140;
const INTERNAL = /\b(?:cognition|planner|candidate|trajectory|viewer state|compiler|realizer|provenance|evidence ids?|sequence semantics|attention strategy|creative proposition|source event)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|the point is|the meaning is|in other words|the relationship between|the viewer|the audience)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|it was meaningful|it was special|it was important|worth noticing)\.?$/i;
const PRODUCTION = /\b(?:camera|close[- ]?up|wide shot|medium shot|tight shot|zoom|pan|dolly|tracking shot|montage|dissolve|smash cut|sound design|sound effect|sfx|voice[- ]?over|voiceover|score|soundtrack|music cue|lighting cue|transition|shoot|footage)\b/i;
const FORBIDDEN_DIRECTION = /\b(?:shoot|film this|film the|cut to|fade in|fade out|show the viewer|tell the viewer)\b/i;
const KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

function parseResponse(text: string): { scenes?: unknown } | undefined {
  const normalized = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { const value = JSON.parse(normalized) as unknown; return value && typeof value === "object" ? value as { scenes?: unknown } : undefined; } catch {
    const start = normalized.indexOf("{"), end = normalized.lastIndexOf("}"); if (start < 0 || end <= start) return undefined;
    try { const value = JSON.parse(normalized.slice(start, end + 1)) as unknown; return value && typeof value === "object" ? value as { scenes?: unknown } : undefined; } catch { return undefined; }
  }
}
function eventText(event: RealityGraph["events"][number]): string { return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" "); }
function validSourceIds(raw: unknown, graph: RealityGraph, text: string, fallback: readonly string[]): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const explicit = Array.isArray(raw) ? unique(raw.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id)) : [];
  if (explicit.length) return explicit.slice(0, 3);
  const inferred = graph.events.map((event) => ({ id: event.id, score: overlap(text, eventText(event)) })).filter((row) => row.score >= .2).sort((a, b) => b.score - a.score).slice(0, 2).map((row) => row.id);
  return (inferred.length ? inferred : unique(fallback).filter((id) => valid.has(id)).slice(0, 2));
}
function validateScenes(raw: unknown, graph: RealityGraph, fallbackSourceIds: readonly string[]): { scenes?: RealizedScene[]; reason?: string } {
  if (!raw || typeof raw !== "object") return { reason: "sequence realization response is invalid" };
  const source = raw as { scenes?: unknown };
  if (!Array.isArray(source.scenes)) return { reason: "sequence realization returned no scenes" };
  if (source.scenes.length < 2) return { reason: "sequence needs at least two cuts" };
  if (source.scenes.length > MAX_CUTS) return { reason: `sequence exceeds ${MAX_CUTS} cuts` };
  const scenes: RealizedScene[] = [];
  for (const [index, item] of source.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is invalid` };
    const row = item as RawScene; const text = clean(row.text);
    if (!text) return { reason: `cut ${index + 1} is empty` };
    if (text.length > MAX_CHARS) return { reason: `cut ${index + 1} exceeds ${MAX_CHARS} characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains the idea instead of realizing it` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };
    if (PRODUCTION.test(text) || FORBIDDEN_DIRECTION.test(text)) return { reason: `cut ${index + 1} contains presentation direction` };
    const rawKind = clean(row.kind); const kind = KINDS.has(rawKind) ? rawKind as AuthorScene["kind"] : index === 0 ? "hook" : index === source.scenes.length - 1 ? "payoff" : "line";
    const sourceEventIds = validSourceIds(row.sourceEventIds, graph, text, fallbackSourceIds); if (!sourceEventIds.length) return { reason: `cut ${index + 1} cannot be grounded` };
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  return { scenes };
}
function fallbackScenes(input: { subject: string; proposition: AuthorCreativeProposition; graph: RealityGraph }): RealizedScene[] {
  const events = input.graph.events.filter((event) => input.proposition.sourceEventIds.includes(event.id));
  const first = events[0]?.label || input.subject; const second = events[1]?.label;
  const lines = [
    { text: first, kind: "hook" as const, ids: events[0] ? [events[0].id] : input.proposition.sourceEventIds.slice(0, 1) },
    { text: input.proposition.text, kind: "discovery" as const, ids: input.proposition.sourceEventIds.slice(0, 2) },
    ...(second ? [{ text: second, kind: "turn" as const, ids: [events[1]!.id] }] : []),
    { text: input.proposition.text, kind: "payoff" as const, ids: input.proposition.sourceEventIds.slice(0, 2) },
  ];
  return lines.map((line, index) => ({ text: line.text.slice(0, MAX_CHARS), kind: line.kind, sourceEventIds: line.ids, score: Math.min(1, .6 + index * .08) }));
}
const schema: LocalModelJsonSchema = { type: "object", additionalProperties: false, required: ["scenes"], properties: { scenes: { type: "array", minItems: 2, maxItems: MAX_CUTS, items: { type: "object", additionalProperties: false, required: ["text", "kind", "sourceEventIds"], properties: { text: { type: "string", minLength: 1, maxLength: MAX_CHARS }, kind: { type: "string", enum: ["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"] }, sourceEventIds: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } } } } } } };

export async function realizeAuthorExperience(input: { prompt: string; subject: string; lens?: string; graph: RealityGraph; sequences?: readonly SequenceCandidate[]; sequence?: SequenceCandidate; artistDirection: AuthorArtistDirection; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }): Promise<AuthorRealizationResult> {
  const available = input.sequences ?? (input.sequence ? [input.sequence] : []); const sequence = available[0]; const proposition = input.artistDirection.creativeProposition;
  const context = {
    subject: input.subject, task: clean(input.prompt), centralProposition: proposition, artistDirection: input.artistDirection,
    suppliedReality: input.graph.events.slice(0, 40).map((event) => ({ id: event.id, text: eventText(event), salient: event.salient })),
    relationships: input.graph.relations.slice(0, 40), patterns: input.graph.patterns?.slice(0, 20) ?? [],
    memories: (input.memoryContext ?? []).slice(0, 20), priorSequenceText: (input.priorScenes ?? []).slice(-12),
    sequenceContext: sequence ? { id: sequence.id, anchors: sequence.anchorEventIds, relations: sequence.supportingRelationKinds, trajectory: sequence.trajectory } : null,
  };
  try {
    const response = await localModelGenerate([
      { role: "system", content: "You are QRE Mouth. Realize one Artist-selected creative proposition as moving screen text. Every cut must change the read. Use supplied reality, relationships, patterns, and memory only. Do not serialize facts one by one. Do not add unsupported events, people, motives, presentation directions, production language, or genre conventions. Return only visible text with grounded sourceEventIds." },
      { role: "user", content: JSON.stringify(context) },
    ], "json", { numPredict: 1400, temperature: .82 }, schema);
    const parsed = parseResponse(response.text); const validated = validateScenes(parsed, input.graph, proposition.sourceEventIds);
    if (!validated.scenes) {
      const fallback = fallbackScenes({ subject: input.subject, proposition, graph: input.graph }); const judgment = judgeRealizedSequence({ scenes: fallback, sequence, graph: input.graph, creativeProposition: proposition });
      return { scenes: fallback, score: judgment.score, model: response.model, modelCalls: 1, rejectedSets: 1, selectedSetIndex: 0, judgment, reason: validated.reason };
    }
    const judgment = judgeRealizedSequence({ scenes: validated.scenes, sequence, graph: input.graph, creativeProposition: proposition });
    return { scenes: validated.scenes, score: judgment.score, model: response.model, modelCalls: 1, rejectedSets: judgment.accepted ? 0 : 1, selectedSetIndex: 0, judgment };
  } catch (error) {
    const fallback = fallbackScenes({ subject: input.subject, proposition, graph: input.graph }); const judgment = judgeRealizedSequence({ scenes: fallback, sequence, graph: input.graph, creativeProposition: proposition });
    return { scenes: fallback, score: judgment.score, model: "fallback", modelCalls: 0, rejectedSets: judgment.accepted ? 0 : 1, selectedSetIndex: 0, judgment, reason: error instanceof Error ? error.message : "sequence realization failed" };
  }
}
