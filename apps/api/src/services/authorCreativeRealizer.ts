/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Cognition discovers a grounded relationship. Gemma performs it.
 * Reality owns concrete truth. The artist owns form and visible language.
 * QRE binds provenance after creation and independently judges the film.
 */
import type { AuthorDomainContext, AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { judgeRealizedFilm, type RealizedFilmJudgment } from "./authorRealizedFilmJudge.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };
export type AuthorRealizationResult = {
  scenes: RealizedScene[]; score: number; model: string; modelCalls: number; rejectedSets: number;
  judgment?: RealizedFilmJudgment; reason?: string;
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type RawSet = { scenes?: unknown };
type ValidationResult = { scenes?: RealizedScene[]; reason?: string };

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity|semantic turn|semanticRealization)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|let the supplied detail|the relationship between|changes what is worth noticing)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).match(WORDS) ?? [];
const tokens = (text: string): Set<string> => new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2));
const overlap = (left: string, right: string): number => {
  const a = tokens(left); const b = tokens(right); if (!a.size || !b.size) return 0;
  let hits = 0; for (const token of a) if (b.has(token)) hits += 1; return hits / Math.max(1, a.size);
};
function subjectNames(subject: string): string[] {
  return clean(subject).split(/\s*(?:\+|&|,|\/|\band\b)\s*/i).map(clean).filter(Boolean).sort((a, b) => b.length - a.length);
}
function leadingSubject(text: string, subject: string): boolean {
  const names = subjectNames(subject); if (!names.length) return false;
  return names.some((name) => new RegExp(`^(?:the|a|an)?\\s*${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?:\\b|:)`, "i").test(clean(text)));
}
function subjectLedRatio(scenes: readonly RealizedScene[], subject: string): number {
  return scenes.length ? scenes.filter((scene) => leadingSubject(scene.text, subject)).length / scenes.length : 1;
}
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids); return graph.relations.some((relation) => set.has(relation.from) && set.has(relation.to));
}
function eventText(event: RealityGraph["events"][number]): string {
  return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ");
}
function parseJson(text: string): Record<string, unknown> | undefined {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { const parsed = JSON.parse(cleaned); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; }
  catch { const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}"); if (start < 0 || end <= start) return undefined; try { const parsed = JSON.parse(cleaned.slice(start, end + 1)); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { return undefined; } }
}
function bindProvenance(rawIds: unknown, index: number, total: number, movie: LatentMovieCandidate, graph: RealityGraph): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const supplied = Array.isArray(rawIds) ? unique(rawIds.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id)) : [];
  if (supplied.length) return supplied;
  const anchors = unique([...movie.anchorEventIds, ...movie.trajectory.flatMap((step) => step.eventIds)].filter((id) => valid.has(id)));
  if (index === total - 1 && anchors.length >= 2) return anchors.slice(0, 2);
  if (index > 0 && anchors.length >= 2) return anchors.slice(0, 2);
  return anchors.slice(0, 1);
}
function validateSet(raw: unknown, input: { graph: RealityGraph; subject: string; movie: LatentMovieCandidate }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "set is not an object" };
  const row = raw as RawSet; if (!Array.isArray(row.scenes)) return { reason: "set.scenes is missing" };
  if (row.scenes.length < 2) return { reason: "film needs at least 2 cuts" }; if (row.scenes.length > 10) return { reason: "film exceeds 10 cuts" };
  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is not an object` };
    const scene = item as RawScene; const text = clean(scene.text);
    if (!text) return { reason: `cut ${index + 1} is empty` }; if (text.length > 180) return { reason: `cut ${index + 1} exceeds 180 characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains instead of dramatizing` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };
    const sourceEventIds = bindProvenance(scene.sourceEventIds, index, row.scenes.length, input.movie, input.graph);
    if (input.graph.events.length && !sourceEventIds.length) return { reason: `cut ${index + 1} lost provenance` };
    const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : index === 0 ? "hook" : index === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  if (scenes.length >= 3 && subjectLedRatio(scenes, input.subject) > 0.5) return { reason: "subject is dominating the film grammar" };
  const used = new Set(scenes.flatMap((scene) => scene.sourceEventIds));
  if (input.graph.events.length >= 2 && !relationExists(input.graph, input.movie.anchorEventIds)) return { reason: "selected Movie has no grounded graph relation" };
  if (input.graph.events.length >= 2 && used.size < 2) return { reason: "film uses fewer than two supplied events" };
  return { scenes };
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph): number {
  return judgeRealizedFilm({ scenes, movie, graph }).score;
}
function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }) {
  const relevantIds = unique([...input.movie.anchorEventIds, ...input.movie.trajectory.flatMap((step) => step.eventIds)].filter((id) => input.graph.events.some((event) => event.id === id)));
  const relevantEvents = relevantIds.map((id) => input.graph.events.find((event) => event.id === id)).filter(Boolean).map((event) => ({ id: event!.id, text: eventText(event!) }));
  return {
    creativeTask: clean(input.prompt), subjectReference: clean(input.subject), subjectRole: "referent only; never narrator; never a required grammatical anchor", frame: clean(input.lens) || "NONE",
    memory: (input.memoryContext ?? []).slice(0, 20), priorFilms: (input.priorScenes ?? []).slice(-8), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
    selectedStructure: { eventIds: relevantIds, relationKinds: input.movie.supportingRelationKinds, operations: input.movie.trajectory.map((step) => ({ order: step.order, operation: step.operation, eventIds: step.eventIds })) },
    sourceReality: relevantEvents,
    artistRule: "Preserve the factual reality, not the client's sentence. You may compress, fragment, nominalize, reorder, juxtapose, repeat, omit, invert or poetically transform supplied facts. You may introduce abstract or emotional interpretive language when it is clearly artistic rather than a new concrete event. Never invent concrete people, objects, places, actions, chronology or sensory facts. A supplied fact such as 'stole an apple' may become 'Apple acquired.' The artist may then land on something like 'Sudden ecstasy' when the chosen relationship earns that feeling.",
  };
}
function prompt(repair: boolean): string {
  return [
    repair ? "You are QRE's finishing artist repairing a rejected film." : "You are QRE's ONE CREATIVE REALIZER.",
    "Reality is absolute; wording is not. Preserve what happened, not the client's sentence structure.",
    "Do not summarize the person. Discover what is interesting in the supplied reality and make it felt.",
    "SUBJECT is a referent, never a default narrator.",
    "Concrete facts must remain true. You may artistically compress, fragment, nominalize, reorder, juxtapose, repeat, omit or grammatically transform them.",
    "Abstract and emotional artistic language is allowed, especially for the final landing. Treat it as interpretation, not as newly discovered fact.",
    "For example, a supplied fact 'Coco stole an apple from the counter' may become 'Apple acquired.' It may be followed by an earned artistic landing such as 'Sudden ecstasy.' Do not copy the whole sentence just because it is supplied.",
    "Do not invent concrete objects, actions, places, sensory details, dialogue, chronology or bodily reactions.",
    "Do not write imagined cinematography. Do not write a caption reel. Make supplied details interact through arrangement.",
    "The film form must be earned by this world. Different worlds may use different rhythm, omission, collision, repetition, interruption, compression, callback or silence.",
    "Do not force three beats. Use 2-10 cuts according to the idea.",
    "Do not explain the interpretation. Let the arrangement and final language carry it.",
    "Never mention cognition, planning, the viewer, audience, narrative, relationship, evidence, movie, sequence, meaning or interpretation.",
    "JSON ONLY: {sets:[{scenes:[{text,kind}]}]}. No commentary. No source IDs; QRE binds provenance.",
    repair ? "The previous attempt copied or recapped the supplied wording. Transform the fact without changing the fact." : "Choose the strongest semantic pressure first. Then make the smallest, strangest, most memorable film that expresses it.",
  ].join("\n");
}

export async function realizeAuthorExperience(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }): Promise<AuthorRealizationResult> {
  const ctx = context(input); let model = "fallback"; let modelCalls = 0; let rejectedSets = 0; let lastJudgment: RealizedFilmJudgment | undefined; const rejectedReasons: string[] = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await localModelGenerate([{ role: "system", content: prompt(attempt === 1) }, { role: "user", content: JSON.stringify(ctx) }], "json", { numPredict: 3000, temperature: attempt === 0 ? 0.95 : 0.82 });
      model = result.model; modelCalls += 1; const parsed = parseJson(result.text); const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : parsed ? [parsed] : [];
      const judged: Array<{ scenes: RealizedScene[]; judgment: RealizedFilmJudgment; score: number }> = [];
      for (const raw of rawSets) {
        const validation = validateSet(raw, input); if (!validation.scenes) { rejectedSets += 1; if (validation.reason) rejectedReasons.push(validation.reason); continue; }
        const judgment = judgeRealizedFilm({ scenes: validation.scenes, movie: input.movie, graph: input.graph }); lastJudgment = judgment;
        if (!judgment.accepted) { rejectedSets += 1; rejectedReasons.push(`film judge: ${judgment.reasons.join("; ")}`); continue; }
        judged.push({ scenes: validation.scenes, judgment, score: scoreSet(validation.scenes, input.movie, input.graph) });
      }
      if (judged.length) { judged.sort((a, b) => b.score - a.score); const winner = judged[0]!; return { scenes: winner.scenes, score: winner.judgment.score, model, modelCalls, rejectedSets, judgment: winner.judgment, reason: rejectedReasons.length ? rejectedReasons.join(" | ") : undefined }; }
    } catch (error) { rejectedSets += 1; rejectedReasons.push(error instanceof Error ? error.message : "creative realizer call failed"); }
  }
  return { scenes: [], score: 0, model, modelCalls, rejectedSets, judgment: lastJudgment, reason: rejectedReasons.join(" | ") || "no realized film survived validation" };
}
