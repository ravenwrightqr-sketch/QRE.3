/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Cognition discovers a grounded relationship. Gemma makes it felt.
 * QRE owns provenance and the hard reality boundary.
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

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity|semantic turn|semanticRealization)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|let the supplied detail|the relationship between|changes what is worth noticing)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
const CONTEXT_CHARACTER = /\b(?:groomer|owner|customer|client|waiter|server|bartender|barber|driver|agent|lawyer|doctor|nurse|manager|employee|staff|worker|photographer|dj|deejay|police|officer|cop|enemy|opponent|soldier|guard|host)\b/i;
const ACTION_WORD = /\b(?:arrived?|came|left|went|met|talked?|spoke|said|gave?|got|found|lost|cleaned?|finished?|started?|opened|closed|walk(?:ed)?|ran|drove?|ate|drank|kiss(?:ed)?|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|stayed|waited|called|laughed|cried|looked|felt|became|changed|repaired|tested|selected|cut|shaped|polished|delivered|welcomed|checked|booked|reserved|approved|groomed|dyed|tailored|installed|stole|snatched|grabbed|grab|cooed|shrugged|screamed|attacked|fought|hired|watched|heard|sang|danced|takes?|taking|submits?|submitted|submit)\b/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const words = (text: string): string[] => clean(text).match(WORDS) ?? [];
const tokens = (text: string): Set<string> => new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2));
const metric = (value: number): number => Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3))));

function overlap(left: string, right: string): number {
  const a = tokens(left); const b = tokens(right); if (!a.size || !b.size) return 0;
  let hits = 0; for (const token of a) if (b.has(token)) hits += 1;
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
function leadingContextActor(text: string): string | undefined {
  return clean(text).match(new RegExp(`^(?:the|a|an)?\\s*(${CONTEXT_CHARACTER.source.replace(/^\\b|\\b$/g, "")})\\b`, "i"))?.[1];
}
function unsupportedActor(text: string, subject: string): boolean {
  const actor = leadingContextActor(text); if (!actor) return false;
  return !subjectNames(subject).some((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i").test(actor));
}
function suppliedActions(graph: RealityGraph): Set<string> {
  return new Set((graph.events.map((event) => event.label).join(" ").match(new RegExp(ACTION_WORD.source, "gi")) ?? []).map((match) => match.toLowerCase()));
}
function unsupportedAction(text: string, graph: RealityGraph): boolean {
  const match = text.match(ACTION_WORD); if (!match) return false;
  return !suppliedActions(graph).has(match[0].toLowerCase());
}
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids);
  return graph.relations.some((relation) => set.has(relation.from) && set.has(relation.to));
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
  const anchors = unique(movie.anchorEventIds.filter((id) => valid.has(id)));
  const trajectoryIds = movie.trajectory[index]?.eventIds?.filter((id) => valid.has(id)) ?? [];
  if (index === total - 1 && anchors.length >= 2) return anchors.slice(0, 2);
  if (index > 0 && anchors.length >= 2) return anchors.slice(0, 2);
  if (trajectoryIds.length) return unique(trajectoryIds);
  return anchors.slice(0, 1);
}
function validateSet(raw: unknown, input: { graph: RealityGraph; subject: string; movie: LatentMovieCandidate }): RealizedScene[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes) || row.scenes.length < 2 || row.scenes.length > 10) return undefined;
  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.entries()) {
    if (!item || typeof item !== "object") return undefined;
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text || text.length > 180 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text)) return undefined;
    if (input.graph.events.length && (unsupportedActor(text, input.subject) || unsupportedAction(text, input.graph))) return undefined;
    const sourceEventIds = bindProvenance(scene.sourceEventIds, index, row.scenes.length, input.movie, input.graph);
    if (input.graph.events.length && !sourceEventIds.length) return undefined;
    if (index < row.scenes.length - 1) {
      const sourceText = input.graph.events
        .filter((event) => sourceEventIds.includes(event.id))
        .flatMap((event) => [event.label, ...event.entities, event.place, event.time])
        .filter(Boolean).join(" ");
      if (overlap(text, sourceText) < 0.18) return undefined;
    }
    const kind = ALLOWED_KINDS.has(clean(scene.kind))
      ? clean(scene.kind) as AuthorScene["kind"]
      : index === 0 ? "hook" : index === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  if (scenes.length >= 3 && subjectLedRatio(scenes, input.subject) > 0.5) return undefined;
  const anchors = new Set(scenes.flatMap((scene) => scene.sourceEventIds));
  if (input.graph.events.length >= 2 && !relationExists(input.graph, input.movie.anchorEventIds)) return undefined;
  if (input.graph.events.length >= 2 && anchors.size < 2) return undefined;
  if (input.graph.events.length >= 2 && !scenes.some((scene) => scene.sourceEventIds.length >= 2 && relationExists(input.graph, scene.sourceEventIds))) return undefined;
  return scenes;
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, priorScenes: string[], subject: string, domainContext?: AuthorDomainContext): number {
  const judgment = judgeRealizedFilm({ scenes, movie, graph });
  const allText = scenes.map((scene) => scene.text).join(" ");
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const subjectPenalty = subjectLedRatio(scenes, subject);
  const domainFit = domainContext ? overlap(allText, [domainContext.category, domainContext.businessType, domainContext.businessName, domainContext.serviceType, domainContext.serviceName, ...(domainContext.knownCapabilities ?? [])].filter(Boolean).join(" ")) : 0;
  return metric(judgment.score * 0.7 + movie.distinctiveness * 0.08 + movie.specificity * 0.07 + novelty * 0.07 + domainFit * 0.02 + (1 - subjectPenalty) * 0.01 + (1 - judgment.dimensions.captionReelRisk) * 0.05);
}
function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }) {
  const ids = unique(input.movie.anchorEventIds.filter((id) => input.graph.events.some((event) => event.id === id)));
  return {
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    subjectRole: "factual referent only; never a required grammatical or narrative anchor",
    lens: clean(input.lens) || "NONE",
    domainContext: input.domainContext ?? {},
    memory: (input.memoryContext ?? []).slice(0, 30),
    priorScenes: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 30),
    selectedRelationship: {
      eventIds: ids,
      events: ids.map((id) => input.graph.events.find((event) => event.id === id)).filter(Boolean).map((event) => ({ id: event!.id, label: event!.label, entities: event!.entities })),
      relationKinds: input.movie.supportingRelationKinds,
      discoveredEvidence: input.movie.evidence,
      semanticQuestion: input.movie.unresolvedQuestion,
    },
    movie: { hypothesis: input.movie.hypothesis, payoff: input.movie.payoff, trajectory: input.movie.trajectory },
    realityEvents: input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities })),
  };
}
function prompt(repair: boolean): string {
  return [
    repair ? "You are repairing QRE's visible film after a strict reality check." : "You are QRE's ONE CREATIVE REALIZER.",
    repair ? "Preserve the strongest artistic idea while correcting the rejected form." : "Reality is factual authority. Cognition has already discovered the selected relationship. Your job is to make it FELT.",
    "Reality is immutable. Do not manufacture plot, people, objects, actions, motives, reactions, chronology or sensory details.",
    "Facts are evidence. The discovered relationship creates the reading. The final feeling is the art.",
    "The subject is a factual referent, NOT the narrator and NOT a required grammatical anchor. Never begin every cut with the subject's name.",
    "Do not organize the film as a person report. Choose the most revealing supplied element for each cut: object, place, time, action, fragment, omission, collision, callback or repetition.",
    "Do not write one sentence per fact. Make the supplied details interact.",
    "Change form when the reality earns it. The film may be two sharp cuts or a longer accumulation. Never force a fixed beat count, opening, rhythm, sentence shape or ending shape.",
    "Prefer compression, juxtaposition and concrete specificity over narration or explanation.",
    "Every cut before the final landing must contain concrete language grounded in supplied reality. The final cut may become abstract when the preceding relationship earns it.",
    "Never explain the interpretation. Never mention the viewer, audience, narrative, relationship, evidence, planning or meaning.",
    "Return JSON only: {sets:[{scenes:[{text,kind}]}]} on the first attempt. Produce 3 genuinely different films when the supplied reality permits it. Do not return source IDs; QRE binds provenance.",
  ].join("\n");
}

export async function realizeAuthorExperience(input: {
  prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[];
}): Promise<AuthorRealizationResult> {
  const ctx = context(input);
  let model = "fallback"; let modelCalls = 0; let rejectedSets = 0; let lastJudgment: RealizedFilmJudgment | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await localModelGenerate(
        [{ role: "system", content: prompt(attempt === 1) }, { role: "user", content: JSON.stringify(ctx) }],
        "json",
        { numPredict: 3000, temperature: attempt === 0 ? 1.0 : 0.92 },
      );
      model = result.model; modelCalls += 1;
      const parsed = parseJson(result.text);
      const rawSets = attempt === 0 ? (Array.isArray(parsed?.sets) ? parsed.sets : []) : (parsed ? [parsed] : []);
      const validSets = rawSets.map((raw) => validateSet(raw, input)).filter((set): set is RealizedScene[] => Boolean(set));
      rejectedSets += rawSets.length - validSets.length;
      const judged = validSets.map((scenes) => {
        const judgment = judgeRealizedFilm({ scenes, movie: input.movie, graph: input.graph });
        lastJudgment = judgment;
        return { scenes, judgment, score: scoreSet(scenes, input.movie, input.graph, input.priorScenes ?? [], clean(input.subject), input.domainContext) };
      }).filter((item) => item.judgment.accepted).sort((a, b) => b.score - a.score);
      if (!judged.length) continue;
      const best = judged[0]!;
      best.scenes.forEach((scene) => { scene.score = best.score; });
      return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets, judgment: best.judgment };
    } catch {
      // Fail closed. Customer output must never fall back to cognition prose.
    }
  }
  return { scenes: [], score: 0, model, modelCalls, rejectedSets, judgment: lastJudgment, reason: "Mouth rejected: visible film failed the independent reality/progression/landing judge after two attempts" };
}
