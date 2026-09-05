/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * One customer-facing creative realization path.
 * Reality is immutable. The lens may radically change how supplied reality
 * feels through metaphor, genre framing, personification, compression and
 * implication, but it may not add factual world events.
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
  const rhythm = scenes.length === 1 ? 0.72 : scenes.length <= 5 ? 0.98 : scenes.length <= 8 ? 0.9 : 0.78;
  const averageWords = scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / Math.max(1, scenes.length);
  const compactness = averageWords <= 9 ? 1 : averageWords <= 14 ? 0.88 : averageWords <= 20 ? 0.62 : 0.34;
  const lensBonus = lens && lens !== "LET QRE DECIDE" ? 0.1 : 0;
  const feltMove = /\b(?:somehow|apparently|still|again|finally|anyway|meanwhile|didn't matter|didn't stand a chance|game over|round|tko|mission|case closed|lights out|wide open|quiet|louder|survived|won|lost)\b/i.test(allText) ? 0.1 : 0;
  const evidenceFit = metric(scenes.reduce((sum, scene) => sum + overlap(scene.text, evidence), 0) / Math.max(1, scenes.length));
  return metric(sourceCoverage * 0.2 + evidenceFit * 0.2 + novelty * 0.14 + rhythm * 0.14 + compactness * 0.14 + lensBonus + feltMove + Math.max(0, 0.08 - repeatedStarts * 0.06));
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
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    lens: clean(input.lens) || "LET QRE DECIDE",
    memory: (input.memoryContext ?? []).slice(0, 40),
    priorScenes: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40),
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
          "You are QRE's ONE CREATIVE REALIZER. The Movie is already selected. Your job is to make the supplied reality FEEL like a short, sharp experience.",
          "The supplied reality is the only world. Never add a factual event, person, place, object, action, reaction, dialogue, time, relationship, chronology, or outcome.",
          "The subject/star is the focus. Keep the subject at the center. Context such as a house, restaurant, receipt, venue, service, weather, or location is the arena around the subject, not permission to invent people or events.",
          "The lens is powerful. It may radically change tone and perceived meaning through genre framing, metaphor, personification, status language, juxtaposition, irony, exaggeration, surreal imagery, rhetorical questions, and cinematic compression.",
          "Lens language may be fictional in FRAME but must not create a new factual event. 'Kitchen TKO', 'round 2', 'super power up', 'chairs on the ceiling', 'case closed', 'the house surrendered' are acceptable when they are clearly rhetorical/metaphorical readings of supplied reality. A literal new person or physical action is not.",
          "A restaurant can feel haunted without inventing a ghost. A romance can make an impossible-looking room feel irrelevant to the people in it. A house can feel like an arena or battlefield. A pet can feel like the star of its own tiny universe. Do not turn the metaphor into literal world truth.",
          "Do not explain. Do not summarize what the experience means. Write the feeling directly. Shortish cuts. Favor 2-10 words per line. Some one-word or fragment lines are excellent. Let silence and juxtaposition do work.",
          "Do not force a six-act story. Find the latent story already in the material: the strongest relationship, contrast, recurring detail, status shift, irony, progression, sensory image, or emotional truth that the supplied reality earns.",
          "The receipt itself may be the world. For service receipts, the house/place/work can be the arena; the worker or customer can be the star depending on the supplied subject. Never manufacture a customer, coworker, resident, or observer merely because the setting implies one.",
          "Do not repeat the same sentence shape. Do not restate every fact. Select and compose. If five facts are supplied, you may use three if those three create the strongest experience.",
          "For concrete reality, every scene must include at least one existing sourceEventId. Source IDs prove provenance; they do not authorize claims beyond the event's supplied content.",
          "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets. No prose outside JSON.",
        ].join("\n"),
      },
      { role: "user", content: JSON.stringify(context) },
    ], "json", { numPredict: 5000, temperature: 0.92 });
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
