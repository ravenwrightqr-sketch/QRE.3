/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Reality is immutable. Cognition selects the semantic Movie and frame.
 * This is the only customer-language realization path.
 *
 * STAR = the supplied subject / focal identity.
 * ARENA = the place, service, receipt, house, event, object or context around the star.
 * REALIZATION = the felt semantic move between supplied facts.
 */
import type { AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };
export type AuthorRealizationResult = {
  scenes: RealizedScene[];
  score: number;
  model: string;
  modelCalls: number;
  rejectedSets: number;
  reason?: string;
};

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type RawSet = { scenes?: unknown };

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was)\.?$/i;
const CONTEXT_CHARACTER = /\b(?:groomer|owner|customer|client|waiter|server|bartender|barber|driver|agent|lawyer|doctor|nurse|manager|employee|staff|worker|photographer|dj|deejay|police|officer|cop|enemy|opponent|soldier|guard|host)\b/i;
const ACTION_WORD = /\b(?:arrived?|came|left|went|met|talked?|spoke|said|gave?|got|found|lost|cleaned?|finished?|started?|opened|closed|walk(?:ed)?|ran|drove?|ate|drank|kiss(?:ed)?|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|stayed|waited|called|laughed|cried|looked|felt|became|changed|repaired|tested|selected|cut|shaped|polished|delivered|welcomed|checked|booked|reserved|approved|groomed|dyed|tailored|installed|stole|snatched|grabbed|grab|cooed|shrugged|screamed|attacked|fought|hired|watched|heard|sang|danced)\b/i;
const REALIZATION_ACTION = /\b(?:cleared|handled|reset|down|up|survived|won|lost|surrendered|verdict|passed|failed|ready|complete|completed|done|booted|power\s*up|tko|round|mission|case|still\s+standing|stood|made\s+it|changed\s+everything|did(?:n't| not)\s+(?:matter|stand\s+a\s+chance))\b/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function unique(values: readonly string[]): string[] { return [...new Set(values.map(clean).filter(Boolean))]; }
function words(text: string): string[] { return clean(text).match(WORDS) ?? []; }
function tokenSet(text: string): Set<string> { return new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2)); }
function metric(value: number): number { return Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3)))); }
function overlap(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}
function subjectNames(subject: string): string[] {
  return clean(subject)
    .split(/\s*(?:\+|&|,|\/|\band\b)\s*/i)
    .map(clean)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}
function subjectPattern(subject: string): RegExp | undefined {
  const names = subjectNames(subject).map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!names.length) return undefined;
  return new RegExp(`^(?:${names.join("|")})(?:\\s+|[:,–—-]+\\s*)`, "i");
}
function stripSubjectLead(text: string, subject: string): string {
  const pattern = subjectPattern(subject);
  if (!pattern) return clean(text);
  let result = clean(text).replace(pattern, "");
  result = result.replace(/^(?:is|are|was|were)\s+/i, "");
  return clean(result);
}
function subjectMentioned(text: string, subject: string): boolean {
  const names = subjectNames(subject).flatMap((name) => [...tokenSet(name)]);
  const sceneTokens = tokenSet(text);
  return names.some((name) => sceneTokens.has(name));
}
function subjectNamePenalty(scenes: readonly RealizedScene[], subject: string): number {
  if (!subjectNames(subject).length || !scenes.length) return 0;
  const mentions = scenes.map((scene) => subjectMentioned(scene.text, subject));
  const adjacent = mentions.reduce((sum, value, index) => sum + Number(value && Boolean(mentions[index - 1])), 0);
  const density = mentions.filter(Boolean).length / scenes.length;
  return Math.min(1, density * 0.7 + (adjacent / Math.max(1, scenes.length - 1)) * 0.8);
}
function graphText(graph: RealityGraph): string {
  return graph.events.flatMap((event) => [event.label, ...event.entities, ...(event.place ? [event.place] : []), ...(event.time ? [event.time] : [])]).join(" ");
}
function leadingContextActor(text: string): string | undefined {
  const match = clean(text).match(new RegExp(`^(?:the|a|an)?\\s*(${CONTEXT_CHARACTER.source.replace(/^\\b|\\b$/g, "")})\\b(?:\\s+[^:]{0,40})?`, "i"));
  return match?.[1];
}
function suppliedActionWords(graph: RealityGraph): Set<string> {
  return new Set([...graph.events.map((event) => event.label).join(" ").matchAll(new RegExp(ACTION_WORD.source, "gi"))].map((match) => match[0].toLowerCase()));
}
function unsupportedAction(text: string, graph: RealityGraph): boolean {
  const match = text.match(ACTION_WORD);
  if (!match || REALIZATION_ACTION.test(text)) return false;
  return !suppliedActionWords(graph).has(match[0].toLowerCase());
}
function unsupportedContextActor(text: string, subject: string): boolean {
  const actor = leadingContextActor(text);
  if (!actor) return false;
  return !subjectNames(subject).some((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i").test(actor));
}
function contextRoleLoad(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const graphWords = tokenSet(graphText(graph));
  return scenes.reduce((sum, scene) => {
    const match = scene.text.match(CONTEXT_CHARACTER)?.[0];
    if (!match) return sum;
    return sum + (graphWords.has(match.toLowerCase()) ? 0.35 : 1);
  }, 0) / Math.max(1, scenes.length);
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
function validateSet(raw: unknown, graph: RealityGraph, subject: string): RealizedScene[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes) || row.scenes.length === 0) return undefined;
  const validIds = new Set(graph.events.map((event) => event.id));
  const conceptual = graph.events.length === 0;
  const scenes: RealizedScene[] = [];
  for (const item of row.scenes.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text || text.length > 180 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text)) return undefined;
    if (!conceptual && (unsupportedContextActor(text, subject) || unsupportedAction(text, graph))) return undefined;
    const sourceEventIds = Array.isArray(scene.sourceEventIds)
      ? unique(scene.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id))
      : [];
    if (!conceptual && !sourceEventIds.length) return undefined;
    const kind = ALLOWED_KINDS.has(clean(scene.kind))
      ? clean(scene.kind) as AuthorScene["kind"]
      : scenes.length === 0 ? "hook" : scenes.length === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  if (!scenes.length) return undefined;
  if (scenes.length >= 3 && contextRoleLoad(scenes, graph) > 0.75) return undefined;
  return scenes;
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, lens: string, priorScenes: string[], subject: string): number {
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
  const evidenceFit = metric(scenes.reduce((sum, scene) => sum + overlap(scene.text, evidence), 0) / Math.max(1, scenes.length));
  const thesisGrounding = movie.storyThesis ? metric((movie.storyThesis.semanticRealization?.evidenceEventIds?.length ?? 0) / Math.max(1, graph.events.length)) : 0;
  const subjectPenalty = subjectNamePenalty(scenes, subject);
  const omissionBonus = 1 - subjectPenalty;
  const lensBonus = lens && lens !== "LET QRE DECIDE" ? 0.04 : 0;
  const contextPenalty = contextRoleLoad(scenes, graph);
  return metric(
    sourceCoverage * 0.19 +
    evidenceFit * 0.18 +
    novelty * 0.13 +
    rhythm * 0.11 +
    compactness * 0.10 +
    thesisGrounding * 0.09 +
    omissionBonus * 0.14 +
    lensBonus -
    repeatedStarts * 0.045 -
    subjectPenalty * 0.08 -
    contextPenalty * 0.12,
  );
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
      storyThesis: input.movie.storyThesis,
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
          "You are QRE's ONE CREATIVE REALIZER. The Movie and frame are already selected. Do not redesign them.",
          "First principle: Readout is facts. QRE realization is what makes those facts FEEL like an experience.",
          "Do not repeat the Readout sentence by sentence. Compress it, connect it, imply it, and let the selected semantic Movie change how the next beat is read.",
          "STAR / ARENA: the supplied subject is the star. The house, service, receipt, restaurant, venue, city, object or event is the arena. The star can be present without being named.",
          "SUBJECT NAME IS SCARCE: the subject name is already known from context. Prefer omission. Never begin consecutive screens with the name. Do not use the name merely to prove star-focus. Use it only when identity genuinely needs re-establishing or a deliberate return makes the name meaningful.",
          "FELT OVER RECITED: prefer fragments, status, juxtaposition, callback, omission, rhythm, recontextualization and a clean landing. 'Kitchen cleared.' can feel more alive than 'Maria cleaned the kitchen.'",
          "OBSERVER COMPLETION: do not explain every connection. Let adjacent details click together. Give the viewer enough evidence to recognize the pattern, then stop explaining it.",
          "A creative line may change stance without changing reality. Metaphor, irony, personification, exaggeration and genre language are allowed when earned by the Movie. But never use stock mission/round/TKO/verdict language just to sound creative.",
          "Every concrete event remains grounded in the cited source event. Do not invent people, dialogue, reactions, actions, motives, tools, movement, arrival, departure, romance, injury or outcomes.",
          "Context workers and roles are arena, not characters, unless the supplied reality explicitly makes them part of the subject of the experience.",
          "NONE is valid. Do not force a frame when the supplied facts already create the strongest effect.",
          "ONE SCREEN = ONE BEAT. Usually 2-10 words. Fragments are welcome. Shortness is rhythm, not a hard ceiling.",
          "Never write planning language, compiler language, analysis language, or explanations such as 'this means', 'the viewer sees', or 'the point is'.",
          "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets.",
        ].join("\n"),
      },
      { role: "user", content: JSON.stringify(context) },
    ], "json", { numPredict: 3000, temperature: 0.96 });
    model = result.model;
    modelCalls = 1;
    parsed = parseJson(result.text);
  } catch {
    parsed = undefined;
  }

  const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
  const sets = rawSets
    .map((item) => validateSet(item, input.graph, clean(input.subject)))
    .filter((set): set is RealizedScene[] => Boolean(set));

  if (!sets.length) {
    const fallbackSource = input.graph.events[0]?.label || clean(input.movie.payoff) || clean(input.prompt) || "Something worth remembering.";
    const fallbackText = stripSubjectLead(fallbackSource, clean(input.subject));
    const fallback: RealizedScene[] = [{
      text: fallbackText || "Something worth remembering.",
      kind: "hook",
      sourceEventIds: input.graph.events[0] ? [input.graph.events[0].id] : [],
      score: 0,
    }];
    return {
      scenes: fallback,
      score: input.graph.events.length ? 0.25 : 0.55,
      model,
      modelCalls,
      rejectedSets: rawSets.length,
      reason: "no valid model realization; used conservative subject-sparse fallback",
    };
  }

  const scored = sets
    .map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.lens, input.priorScenes ?? [], clean(input.subject)) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  best.scenes.forEach((scene) => { scene.score = best.score; });
  return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets: rawSets.length - sets.length };
}
