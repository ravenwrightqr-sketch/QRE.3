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
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;
  judgment?: RealizedFilmJudgment;
  reason?: string;
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
const metric = (value: number): number => Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3))));

function overlap(left: string, right: string): number {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}
function subjectNames(subject: string): string[] {
  return clean(subject).split(/\s*(?:\+|&|,|\/|\band\b)\s*/i).map(clean).filter(Boolean).sort((a, b) => b.length - a.length);
}
function leadingSubject(text: string, subject: string): boolean {
  const names = subjectNames(subject); if (!names.length) return false;
  return names.some((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    return new RegExp(`^(?:the|a|an)?\\s*${escaped}(?:\\b|:)`, "i").test(clean(text));
  });
}
function subjectLedRatio(scenes: readonly RealizedScene[], subject: string): number {
  return scenes.length ? scenes.filter((scene) => leadingSubject(scene.text, subject)).length / scenes.length : 1;
}
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids);
  return graph.relations.some((relation) => set.has(relation.from) && set.has(relation.to));
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
    const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
    } catch { return undefined; }
  }
}
function bindProvenance(rawIds: unknown, index: number, total: number, movie: LatentMovieCandidate, graph: RealityGraph): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const supplied = Array.isArray(rawIds)
    ? unique(rawIds.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id))
    : [];
  if (supplied.length) return supplied;
  const anchors = unique([
    ...movie.anchorEventIds,
    ...movie.trajectory.flatMap((step) => step.eventIds),
  ].filter((id) => valid.has(id)));
  if (index === total - 1 && anchors.length >= 2) return anchors.slice(0, 2);
  if (index > 0 && anchors.length >= 2) return anchors.slice(0, 2);
  return anchors.slice(0, 1);
}
function bridgeVisible(text: string, scenes: readonly RealizedScene[], graph: RealityGraph): boolean {
  const relevant = unique(scenes.flatMap((scene) => scene.sourceEventIds));
  if (relevant.length < 2) return false;
  const eventBodies = relevant
    .map((id) => graph.events.find((event) => event.id === id))
    .filter(Boolean)
    .map((event) => ({ id: event!.id, text: eventText(event!) }));
  return eventBodies.filter((event) => overlap(text, event.text) >= 0.18).length >= 2;
}
function validateSet(raw: unknown, input: { graph: RealityGraph; subject: string; movie: LatentMovieCandidate }): ValidationResult {
  if (!raw || typeof raw !== "object") return { reason: "set is not an object" };
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes)) return { reason: "set.scenes is missing" };
  if (row.scenes.length < 2) return { reason: "film needs at least 2 cuts" };
  if (row.scenes.length > 10) return { reason: "film exceeds 10 cuts" };

  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return { reason: `cut ${index + 1} is not an object` };
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text) return { reason: `cut ${index + 1} is empty` };
    if (text.length > 180) return { reason: `cut ${index + 1} exceeds 180 characters` };
    if (INTERNAL.test(text)) return { reason: `cut ${index + 1} leaks internal architecture` };
    if (EXPLANATION.test(text)) return { reason: `cut ${index + 1} explains instead of dramatizing` };
    if (GENERIC.test(text)) return { reason: `cut ${index + 1} is generic` };

    const sourceEventIds = bindProvenance(scene.sourceEventIds, index, row.scenes.length, input.movie, input.graph);
    if (input.graph.events.length && !sourceEventIds.length) return { reason: `cut ${index + 1} lost provenance` };

    if (index < row.scenes.length - 1) {
      const sourceTexts = input.graph.events
        .filter((event) => sourceEventIds.includes(event.id))
        .map(eventText);
      if (!sourceTexts.some((source) => overlap(text, source) >= 0.18)) {
        return { reason: `cut ${index + 1} invents concrete language outside supplied source material` };
      }
    }

    const kind = ALLOWED_KINDS.has(clean(scene.kind))
      ? clean(scene.kind) as AuthorScene["kind"]
      : index === 0 ? "hook" : index === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }

  if (scenes.length >= 3 && subjectLedRatio(scenes, input.subject) > 0.5) {
    return { reason: "subject is dominating the film grammar" };
  }

  const used = new Set(scenes.flatMap((scene) => scene.sourceEventIds));
  if (input.graph.events.length >= 2 && !relationExists(input.graph, input.movie.anchorEventIds)) {
    return { reason: "selected Movie has no grounded graph relation" };
  }
  if (input.graph.events.length >= 2 && used.size < 2) return { reason: "film uses fewer than two supplied events" };

  const bridge = scenes.some((scene) => {
    if (scene.sourceEventIds.length < 2) return false;
    return bridgeVisible(scene.text, [scene], input.graph);
  });
  if (input.graph.events.length >= 2 && !bridge) return { reason: "film never visibly combines two supplied relationship-bearing details" };
  return { scenes };
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, priorScenes: string[], subject: string, domainContext?: AuthorDomainContext): number {
  const judgment = judgeRealizedFilm({ scenes, movie, graph });
  const allText = scenes.map((scene) => scene.text).join(" ");
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const subjectPenalty = subjectLedRatio(scenes, subject);
  const domainFit = domainContext ? overlap(allText, [domainContext.category, domainContext.businessType, domainContext.businessName, domainContext.serviceType, domainContext.serviceName, ...(domainContext.knownCapabilities ?? [])].filter(Boolean).join(" ")) : 0;
  return metric(judgment.score * 0.72 + movie.distinctiveness * 0.08 + movie.specificity * 0.06 + novelty * 0.06 + domainFit * 0.02 + (1 - subjectPenalty) * 0.01 + (1 - judgment.dimensions.captionReelRisk) * 0.05);
}
function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }) {
  const relevantIds = unique([
    ...input.movie.anchorEventIds,
    ...input.movie.trajectory.flatMap((step) => step.eventIds),
  ].filter((id) => input.graph.events.some((event) => event.id === id)));
  const relevantEvents = relevantIds
    .map((id) => input.graph.events.find((event) => event.id === id))
    .filter(Boolean)
    .map((event) => ({ id: event!.id, text: eventText(event!) }));
  return {
    creativeTask: clean(input.prompt),
    subjectReference: clean(input.subject),
    subjectRole: "referent only; never narrator; never a required grammatical anchor",
    frame: clean(input.lens) || "NONE",
    memory: (input.memoryContext ?? []).slice(0, 20),
    priorFilms: (input.priorScenes ?? []).slice(-8),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 20),
    selectedStructure: {
      eventIds: relevantIds,
      relationKinds: input.movie.supportingRelationKinds,
      operations: input.movie.trajectory.map((step) => ({ order: step.order, operation: step.operation, eventIds: step.eventIds })),
    },
    sourcePalette: relevantEvents,
    sourcePaletteRule: "Concrete language in every non-final cut must come from or be a minimal rearrangement of this supplied language. Art is created by selection, compression, juxtaposition, order, repetition, omission, rhythm and the final landing.",
  };
}
function prompt(repair: boolean): string {
  return [
    repair ? "You are QRE's finishing artist repairing a rejected film." : "You are QRE's ONE CREATIVE REALIZER.",
    "You are not a storyteller summarizing a person. You are an editor/composer turning supplied reality into a felt piece.",
    "REALITY: absolute. Never invent a concrete person, object, place, action, reaction, dialogue, chronology or sensory detail.",
    "SUBJECT: reference only. It is not the narrator. It does not need to appear in every cut.",
    "SOURCE PALETTE: use the supplied event language as your physical material. In every cut before the final landing, stay inside that palette or make only a minimal grammatical rearrangement of it.",
    "ARTISTIC FREEDOM: choose what to show, what to omit, what to repeat, what to collide, what to place beside what, where to interrupt, where to compress, and how to land. You may create implication without creating a new fact.",
    "Do not describe imaginary cinematography. No invented textures, scents, sounds, lighting, rooms, colors, bodily reactions or visual objects unless supplied.",
    "Do not write a recap or one-screen-per-fact sequence. Make at least one cut make two supplied details interact.",
    "Let the selected relationship be FELT through arrangement, not explained.",
    "The final cut may leave the source vocabulary and become a short artistic landing. It may be 1-5 words when that is strongest.",
    "Do not force three beats. Use the number of cuts the idea actually needs, from 2 to 10.",
    "Create three genuinely different films when the reality permits it. Difference must be structural: different omission, order, compression, repetition, collision, or rhythm — not synonym swaps.",
    "Never mention cognition, planning, the viewer, audience, narrative, relationship, evidence, movie, sequence, meaning or interpretation.",
    "JSON ONLY: {sets:[{scenes:[{text,kind}]}]}. No commentary. No source IDs; QRE binds provenance.",
    repair ? "The previous attempt failed because it left the supplied language. Stay brutally concrete until the final landing." : "Before you write, mentally select the strongest source fragments. Then compose the film from those fragments.",
  ].join("\n");
}

export async function realizeAuthorExperience(input: {
  prompt: string;
  subject: string;
  lens: string;
  graph: RealityGraph;
  movie: LatentMovieCandidate;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  priorScenes?: string[];
  creativeLearningContext?: string[];
}): Promise<AuthorRealizationResult> {
  const ctx = context(input);
  let model = "fallback";
  let modelCalls = 0;
  let rejectedSets = 0;
  let lastJudgment: RealizedFilmJudgment | undefined;
  const rejectedReasons: string[] = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await localModelGenerate(
        [{ role: "system", content: prompt(attempt === 1) }, { role: "user", content: JSON.stringify(ctx) }],
        "json",
        { numPredict: 3000, temperature: attempt === 0 ? 0.95 : 0.82 },
      );
      model = result.model;
      modelCalls += 1;
      const parsed = parseJson(result.text);
      const rawSets = attempt === 0
        ? (Array.isArray(parsed?.sets) ? parsed.sets : [])
        : (parsed ? [parsed] : []);
      if (attempt === 1 && parsed && !Array.isArray(parsed.sets) && Array.isArray((parsed as Record<string, unknown>).scenes)) {
        rawSets.push(parsed);
      }

      const judged: Array<{ scenes: RealizedScene[]; judgment: RealizedFilmJudgment; score: number }> = [];
      for (const raw of rawSets) {
        const validation = validateSet(raw, input);
        if (!validation.scenes) {
          rejectedSets += 1;
          if (validation.reason) rejectedReasons.push(validation.reason);
          continue;
        }
        const judgment = judgeRealizedFilm({ scenes: validation.scenes, movie: input.movie, graph: input.graph });
        lastJudgment = judgment;
        if (!judgment.accepted) {
          rejectedSets += 1;
          rejectedReasons.push(`film judge: ${judgment.reasons.join("; ")}`);
          continue;
        }
        judged.push({
          scenes: validation.scenes,
          judgment,
          score: scoreSet(validation.scenes, input.movie, input.graph, input.priorScenes ?? [], clean(input.subject), input.domainContext),
        });
      }

      judged.sort((a, b) => b.score - a.score);
      const best = judged[0];
      if (!best) continue;
      best.scenes.forEach((scene) => { scene.score = best.score; });
      return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets, judgment: best.judgment };
    } catch (error) {
      rejectedReasons.push(`model error: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  return {
    scenes: [],
    score: 0,
    model,
    modelCalls,
    rejectedSets,
    judgment: lastJudgment,
    reason: `Mouth rejected visible film after two attempts: ${rejectedReasons.slice(0, 8).join(" | ")}`,
  };
}
