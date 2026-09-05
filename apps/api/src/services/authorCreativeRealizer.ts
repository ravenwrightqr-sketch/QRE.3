/*
STATUS: CANONICAL
ROLE: The single customer-facing creative realizer (QRE's Mouth).
INPUT: One selected latent movie, immutable RealityGraph, selected lens, prior experience context.
OUTPUT: One ranked set of human-facing scenes with event provenance and natural pacing.
AUTHORITY: The selected Movie supplies semantic intent; RealityGraph supplies factual evidence.
MUST NOT: Invent concrete events, participants, places, times, dialogue, reactions, chronology, or outcomes; expose compiler vocabulary; turn metaphor into world truth.
UPSTREAM: Canonical Cognition.
DOWNSTREAM: Canonical Author orchestration and runtime Moment projection.
REPLACEMENT: Replaces the previous Mouth, Critic, Interpretation, Truth-Gate, sequence-search, and realization layers.
*/
import type { AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };
export type AuthorRealizationResult = { scenes: RealizedScene[]; score: number; model: string; modelCalls: number; rejectedSets: number; reason?: string };

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type RawSet = { scenes?: unknown };

const INTERNAL = /\b(?:cognition|planner|planning|candidate|semantic|trajectory|viewer|audience|objective|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was)\.?$/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function unique(values: readonly string[]): string[] { return [...new Set(values.map(clean).filter(Boolean))]; }
function words(text: string): string[] { return clean(text).match(WORDS) ?? []; }
function tokenSet(text: string): Set<string> { return new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2)); }
function overlap(left: string, right: string): number {
  const a = tokenSet(left); const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0; for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}
function metric(value: number): number { return Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3)))); }
function parseJson(text: string): Record<string, unknown> | undefined {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { const parsed = JSON.parse(cleaned); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; }
  catch {
    const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try { const parsed = JSON.parse(cleaned.slice(start, end + 1)); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; }
    catch { return undefined; }
  }
}

function validateSet(raw: unknown, graph: RealityGraph): RealizedScene[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes)) return undefined;
  const validIds = new Set(graph.events.map((event) => event.id));
  const conceptual = graph.events.length === 0;
  const scenes: RealizedScene[] = [];
  for (const item of row.scenes.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text || text.length > 220 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text)) return undefined;
    const sourceEventIds = Array.isArray(scene.sourceEventIds) ? unique(scene.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id)) : [];
    if (!conceptual && !sourceEventIds.length) return undefined;
    const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : scenes.length === 0 ? "hook" : scenes.length === (row.scenes.length - 1) ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  return scenes.length > 0 ? scenes : undefined;
}

function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, lens: string, priorScenes: string[]): number {
  const evidence = movie.evidence.join(" ");
  const allText = scenes.map((scene) => scene.text).join(" ");
  const starts = scenes.map((scene) => words(scene.text).slice(0, 3).join(" ").toLowerCase()).filter(Boolean);
  const repeatedStarts = starts.length - new Set(starts).size;
  const uniqueSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size;
  const sourceCoverage = graph.events.length ? Math.min(1, uniqueSources / Math.max(1, Math.min(graph.events.length, 5))) : 1;
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const rhythm = scenes.length === 1 ? 0.7 : scenes.length >= 3 ? 0.95 : 0.82;
  const shortness = metric(scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / Math.max(1, scenes.length));
  const compactness = shortness <= 10 ? 1 : shortness <= 16 ? 0.86 : shortness <= 24 ? 0.65 : 0.3;
  const lensBonus = lens && lens !== "LET QRE DECIDE" ? 0.08 : 0;
  const surprisingMove = /\b(?:apparently|anyway|finally|still|again|same|different|somehow|until|then|already|for now|temporary|like|seems)\b/i.test(allText) ? 0.08 : 0;
  const evidenceFit = metric(scenes.reduce((sum, scene) => sum + overlap(scene.text, evidence), 0) / Math.max(1, scenes.length));
  return metric(sourceCoverage * 0.2 + evidenceFit * 0.22 + novelty * 0.16 + rhythm * 0.12 + compactness * 0.14 + lensBonus + surprisingMove + Math.max(0, 0.1 - repeatedStarts * 0.08));
}

export async function realizeAuthorExperience(input: {
  prompt: string;
  subject: string;
  lens: string;
  graph: RealityGraph;
  movie: LatentMovieCandidate;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
}): Promise<AuthorRealizationResult> {
  const eventTable = input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities }));
  const context = {
    prompt: clean(input.prompt), subject: clean(input.subject), lens: clean(input.lens) || "LET QRE DECIDE",
    memory: (input.memoryContext ?? []).slice(0, 40), priorScenes: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40),
    movie: {
      thesis: input.movie.hypothesis,
      payoff: input.movie.payoff,
      question: input.movie.unresolvedQuestion,
      trajectory: input.movie.trajectory,
      evidence: input.movie.evidence,
      supportingRelations: input.movie.supportingRelationKinds,
      sourceEventIds: input.movie.trajectory.flatMap((step) => step.eventIds),
    },
    realityEvents: eventTable,
  };

  let model = "fallback";
  let modelCalls = 0;
  let parsed: Record<string, unknown> | undefined;
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's ONE CREATIVE REALIZER. Perform the already-selected experience; do not redesign the world or the Movie.",
          "SOURCE TRUTH IS ABSOLUTE. Every concrete statement must be supported by the supplied event IDs you cite.",
          "Creative freedom is high in framing, attitude, implication, personification, status, irony, understatement, juxtaposition, callback, rhetorical questions and genre performance. Reality freedom is zero.",
          "A figurative frame such as 'contacted legal counsel' may creatively frame an actual supplied event; it must not imply that a lawyer literally existed, arrived, spoke, or acted unless the event evidence says so.",
          "Never invent a person, place, time, object, action, reaction, dialogue, chronology, result or physical event. Do not explain the meaning. FEEL IT. DO NOT EXPLAIN IT.",
          "Never use compiler vocabulary or mention cognition, prompts, beats, candidates, trajectories, semantic turns, viewers, audiences, evidence IDs, planners, or narrative structure.",
          "Do not force six acts. Produce a naturally sized set from 1 to 12 scenes. Vary sentence openings and grammatical focus. Do not repeat the subject in every sentence.",
          "Search for the HOLY SHIT move: an unexpected interpretation, contrast, callback, escalation, emotional turn, status inversion or final image. Do not force one if unsupported.",
          "For concrete reality, each scene must include at least one existing sourceEventId. For conceptual reality with an empty event graph, sourceEventIds may be empty.",
          "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets. No prose outside JSON.",
        ].join("\n"),
      },
      { role: "user", content: JSON.stringify(context) },
    ], "json", { numPredict: 5000, temperature: 0.86 });
    model = result.model;
    modelCalls = 1;
    parsed = parseJson(result.text);
  } catch {
    parsed = undefined;
  }

  const rawSets = Array.isArray(parsed?.sets) ? parsed?.sets : [];
  const sets = rawSets.map((item) => validateSet(item, input.graph)).filter((set): set is RealizedScene[] => Boolean(set));
  if (!sets.length) {
    const fallbackText = input.graph.events[0]?.label || clean(input.movie.payoff) || clean(input.prompt) || "Something worth remembering.";
    const fallback: RealizedScene[] = [{ text: fallbackText, kind: "hook", sourceEventIds: input.graph.events[0] ? [input.graph.events[0].id] : [], score: 0 }];
    return { scenes: fallback, score: input.graph.events.length ? 0.25 : 0.55, model, modelCalls, rejectedSets: rawSets.length, reason: "no valid model realization; used conservative single-cut fallback" };
  }
  const scored = sets.map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.lens, input.priorScenes ?? []) })).sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  best.scenes.forEach((scene) => { scene.score = best.score; });
  return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets: rawSets.length - sets.length };
}
