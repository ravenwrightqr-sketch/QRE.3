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
import type { AuthorDomainContext, AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
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
const SAFE_TRANSITION = /\b(?:came\s+back|back\s+again|returned)\b/i;
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
  return clean(subject).split(/\s*(?:\+|&|,|\/|\band\b)\s*/i).map(clean).filter(Boolean).sort((a, b) => b.length - a.length);
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
function domainText(context?: AuthorDomainContext): string {
  if (!context) return "";
  return [context.category, context.businessType, context.businessName, context.businessDescription, context.serviceType, context.serviceName, context.subjectKind, ...(context.knownCapabilities ?? []), ...(context.contextualSignals ?? [])].map(clean).filter(Boolean).join(" ");
}
function leadingContextActor(text: string): string | undefined {
  const match = clean(text).match(new RegExp(`^(?:the|a|an)?\\s*(${CONTEXT_CHARACTER.source.replace(/^\\b|\\b$/g, "")})\\b(?:\\s+[^:]{0,40})?`, "i"));
  return match?.[1];
}
function suppliedActionWords(graph: RealityGraph): Set<string> {
  return new Set([...graph.events.map((event) => event.label).join(" ").matchAll(new RegExp(ACTION_WORD.source, "gi"))].map((match) => match[0].toLowerCase()));
}
function unsupportedAction(text: string, graph: RealityGraph, sourceEventIds: readonly string[]): boolean {
  const match = text.match(ACTION_WORD);
  if (!match || REALIZATION_ACTION.test(text)) return false;
  if (SAFE_TRANSITION.test(text) && sourceEventIds.length >= 2) return false;
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

function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 3 || scenes.length < 3) return 0;
  const eventIds = new Set(graph.events.map((event) => event.id));
  const usable = scenes.filter((scene) => scene.sourceEventIds.some((id) => eventIds.has(id)));
  if (usable.length < 3) return 0;
  const oneEvent = usable.filter((scene) => new Set(scene.sourceEventIds.filter((id) => eventIds.has(id))).size === 1).length / usable.length;
  const bridge = usable.filter((scene) => new Set(scene.sourceEventIds.filter((id) => eventIds.has(id))).size >= 2).length / usable.length;
  const direct = usable.reduce((sum, scene) => {
    const ids = scene.sourceEventIds.filter((id) => eventIds.has(id));
    if (ids.length !== 1) return sum;
    const source = graph.events.find((event) => event.id === ids[0]);
    return sum + Number(Boolean(source && overlap(scene.text, source.label) >= 0.58));
  }, 0) / usable.length;
  const operationLike = usable.filter((scene) => !/[,:;!?]|\b(?:but|yet|still|then|until|again|because|while|now|and)\b/i.test(scene.text)).length / usable.length;
  return metric(oneEvent * 0.42 + direct * 0.38 + (1 - bridge) * 0.12 + operationLike * 0.08);
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
    const sourceEventIds = Array.isArray(scene.sourceEventIds) ? unique(scene.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id)) : [];
    if (!conceptual && !sourceEventIds.length) return undefined;
    if (!conceptual && (unsupportedContextActor(text, subject) || unsupportedAction(text, graph, sourceEventIds))) return undefined;
    const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : scenes.length === 0 ? "hook" : scenes.length === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  if (!scenes.length) return undefined;
  if (scenes.length >= 3 && contextRoleLoad(scenes, graph) > 0.75) return undefined;
  if (captionReelRisk(scenes, graph) >= 0.82) return undefined;
  return scenes;
}

function eventAnchorCount(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const byEvent = new Map(graph.events.map((event) => [event.id, scenes.filter((scene) => scene.sourceEventIds.includes(event.id)).map((scene) => scene.text).join(" ")]));
  return graph.events.reduce((count, event) => count + (overlap(byEvent.get(event.id) ?? "", event.label) >= 0.2 ? 1 : 0), 0);
}
function groundedSignalScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!graph.events.length) return 1;
  const eventCorpus = graphText(graph);
  const allText = scenes.map((scene) => scene.text).join(" ");
  const lexical = overlap(allText, eventCorpus);
  const sourceDiversity = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size / Math.max(1, Math.min(graph.events.length, 5));
  const nonTrivial = scenes.filter((scene) => overlap(scene.text, eventCorpus) >= 0.18).length / Math.max(1, scenes.length);
  return metric(lexical * 0.52 + Math.min(1, sourceDiversity) * 0.28 + nonTrivial * 0.2);
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, lens: string, priorScenes: string[], subject: string, domainContext?: AuthorDomainContext): number {
  const evidence = movie.evidence.join(" ");
  const allText = scenes.map((scene) => scene.text).join(" ");
  const starts = scenes.map((scene) => words(scene.text).slice(0, 3).join(" ").toLowerCase()).filter(Boolean);
  const repeatedStarts = starts.length - new Set(starts).size;
  const uniqueSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size;
  const sourceCoverage = graph.events.length ? Math.min(1, uniqueSources / Math.max(1, Math.min(graph.events.length, 5))) : 1;
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const rhythm = scenes.length === 1 ? 0.78 : scenes.length <= 5 ? 0.98 : scenes.length <= 8 ? 0.9 : 0.78;
  const averageWords = scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / Math.max(1, scenes.length);
  const compactness = averageWords <= 9 ? 1 : averageWords <= 14 ? 0.88 : averageWords <= 20 ? 0.62 : 0.34;
  const evidenceFit = metric(scenes.reduce((sum, scene) => sum + overlap(scene.text, evidence), 0) / Math.max(1, scenes.length));
  const thesisGrounding = movie.storyThesis ? metric((movie.storyThesis.semanticRealization?.evidenceEventIds?.length ?? 0) / Math.max(1, graph.events.length)) : 0;
  const grounded = groundedSignalScore(scenes, graph);
  const domainFit = domainContext ? metric(overlap(allText, domainText(domainContext))) : 0;
  const subjectPenalty = subjectNamePenalty(scenes, subject);
  const omissionBonus = 1 - subjectPenalty;
  const lensBonus = lens && lens !== "LET QRE DECIDE" ? 0.04 : 0;
  const contextPenalty = contextRoleLoad(scenes, graph);
  const reelPenalty = captionReelRisk(scenes, graph);
  const semanticBridgeBonus = scenes.length >= 3 ? scenes.filter((scene) => new Set(scene.sourceEventIds).size >= 2).length / scenes.length * 0.06 : 0;
  return metric(sourceCoverage * 0.15 + evidenceFit * 0.15 + grounded * 0.2 + novelty * 0.11 + rhythm * 0.08 + compactness * 0.07 + thesisGrounding * 0.06 + omissionBonus * 0.10 + domainFit * 0.02 + lensBonus + semanticBridgeBonus - repeatedStarts * 0.045 - subjectPenalty * 0.08 - contextPenalty * 0.12 - reelPenalty * 0.09);
}

function fallbackFromMovie(input: { movie: LatentMovieCandidate; graph: RealityGraph; subject: string }): RealizedScene[] {
  const sourceIds = unique(input.movie.trajectory.flatMap((step) => step.eventIds));
  const semanticLines = unique([
    stripSubjectLead(clean(input.movie.hypothesis[0]), input.subject),
    stripSubjectLead(clean(input.movie.payoff), input.subject),
  ]).filter((text) => text && text.length <= 180 && !INTERNAL.test(text) && !EXPLANATION.test(text) && !GENERIC.test(text));

  if (semanticLines.length) {
    const scenes = semanticLines.map((text, index) => ({
      text,
      kind: index === 0 ? "hook" as const : "payoff" as const,
      sourceEventIds: sourceIds.filter((id) => input.graph.events.some((event) => event.id === id)),
      score: 0,
    }));
    if (captionReelRisk(scenes, input.graph) < 0.82) return scenes;
  }

  const strongest = input.graph.events
    .slice()
    .sort((a, b) => Number(Boolean(b.salient)) - Number(Boolean(a.salient)))[0];
  return strongest
    ? [{ text: stripSubjectLead(strongest.label, input.subject) || "Worth noticing.", kind: "hook", sourceEventIds: [strongest.id], score: 0 }]
    : [{ text: "Worth noticing.", kind: "hook", sourceEventIds: [], score: 0 }];
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
  const eventTable = input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities }));
  const context = {
    prompt: clean(input.prompt), subject: clean(input.subject), lens: clean(input.lens) || "LET QRE DECIDE", domainContext: input.domainContext ?? {}, memory: (input.memoryContext ?? []).slice(0, 40), priorScenes: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40),
    movie: { thesis: input.movie.hypothesis, storyThesis: input.movie.storyThesis, payoff: input.movie.payoff, question: input.movie.unresolvedQuestion, trajectory: input.movie.trajectory, evidence: input.movie.evidence, supportingRelations: input.movie.supportingRelationKinds, sourceEventIds: input.movie.trajectory.flatMap((step) => step.eventIds) }, realityEvents: eventTable,
  };
  let model = "fallback"; let modelCalls = 0; let parsed: Record<string, unknown> | undefined;
  try {
    const result = await localModelGenerate([{ role: "system", content: [
      "You are QRE's ONE CREATIVE REALIZER. The Movie and frame are already selected. Do not redesign them.",
      "Readout is facts. Your job is to realize the selected semantic progression as customer-facing language.",
      "UNIVERSALITY RULE: there is no default author voice for dogs, grooming, restaurants, memories, places, products, weddings or any other domain. Let the supplied reality and supplied arena/context determine the vocabulary, rhythm, attitude and structure.",
      "CONNECT THE DOTS, DON'T EXPLAIN THEM: arrange supplied details so the viewer can recognize the relationship. Do not replace a concrete supplied detail with decorative poetry merely to sound creative.",
      "CONCRETE ANCHOR RULE: across the complete set, preserve multiple unmistakable anchors from the supplied events when those anchors carry the identity of the experience. A creative transformation may compress or rephrase a fact, but it must remain recognizable.",
      "STAR / ARENA: the supplied subject is the star. The house, service, receipt, restaurant, venue, city, object or event is the arena. Business/domain context tells you what kind of world you are in; it does not authorize invented events or employees.",
      "DOMAIN CONTEXT: use supplied business name, type, service, description, capabilities and contextual signals as vocabulary and arena knowledge. Example: if the arena is a grooming business and the supplied reality says the dog arrived dirty, had a bath, got a blue bow and was picked up, a transformation such as 'Came back looking expensive' can be earned. Do not invent grooming steps that were not supplied.",
      "SUBJECT NAME IS SCARCE: the subject name is already known from context. Prefer omission. Never begin consecutive screens with the name. Use it only when identity genuinely needs re-establishing or a deliberate return makes the name meaningful.",
      "FELT OVER RECITED: prefer fragments, status, juxtaposition, callback, omission, rhythm, recontextualization and a clean landing. 'Kitchen cleared.' can feel more alive than 'Maria cleaned the kitchen.'",
      "OBSERVER COMPLETION: do not explain every connection. Give the viewer enough evidence to recognize the pattern, then stop. The punchline may be an implication, comparison, status shift or realization rather than an explanation.",
      "CREATIVE LANGUAGE: metaphor, irony, personification, exaggeration and genre language are allowed when earned by the selected Movie and grounded by the supplied details. Words such as love, beautiful, expensive or wild are not forbidden merely because they are creative; they are allowed when the supplied reality or selected frame earns them. Unsupported psychological states, motives, reactions and factual actions remain forbidden.",
      "Every concrete event remains grounded in cited source events. Do not invent people, dialogue, reactions, actions, motives, tools, movement, arrival, departure, romance, injury or outcomes. A status comparison or opinion can be creative; a new event is not.",
      "Context workers and roles are arena, not characters, unless the supplied reality explicitly makes them part of the subject of the experience.",
      "NONE is valid. Do not force a frame when the supplied facts already create the strongest effect.",
      "ONE SCREEN = ONE BEAT. Usually 2-10 words. Fragments are welcome. Shortness is rhythm, not a hard ceiling.",
      "Do not make every screen sound like poetry. Use the diction the subject, evidence, arena and frame naturally call for. Different domains should produce different structures.",
      "ANTI-CAPTION-REEL: do not map one screen to each supplied event. Multiple events may be compressed into one screen when their relationship matters. An event can remain evidence without becoming visible prose. Prefer semantic movement over coverage.",
      "ANTI-METADATA-REEL: do not turn dates, locations, photos, receipts, GPS or other context into a checklist of screens. They are additive material unless the Movie makes one meaningful.",
      "SEMANTIC-BRIDGE RULE: whenever the selected Movie contains a real relationship between multiple supplied events, let at least one screen carry language that makes those events interact, contrast, recur or recontextualize each other. Do not merely place their captions beside each other.",
      "NEVER OUTPUT AN ABSTRACT SET: for a factual event graph with 3 or more events, at least two scene texts must visibly preserve a concrete noun or distinctive phrase from different supplied events when those anchors carry identity. Provenance IDs alone are not enough.",
      "Never write planning language, compiler language, analysis language, or explanations such as 'this means', 'the viewer sees', or 'the point is'.",
      "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets.",
    ].join("\n") }, { role: "user", content: JSON.stringify(context) }], "json", { numPredict: 3000, temperature: 0.96 });
    model = result.model; modelCalls = 1; parsed = parseJson(result.text);
  } catch { parsed = undefined; }
  const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
  const sets = rawSets.map((item) => validateSet(item, input.graph, clean(input.subject))).filter((set): set is RealizedScene[] => Boolean(set));
  const groundedSets = sets.filter((set) => {
    if (!input.graph.events.length) return true;
    if (set.length < 3) return groundedSignalScore(set, input.graph) >= 0.3;
    const anchorCount = eventAnchorCount(set, input.graph);
    return groundedSignalScore(set, input.graph) >= 0.3 && anchorCount >= Math.min(2, input.graph.events.length);
  });
  if (!groundedSets.length) {
    const fallback = fallbackFromMovie({ movie: input.movie, graph: input.graph, subject: clean(input.subject) });
    return { scenes: fallback, score: input.graph.events.length ? 0.25 : 0.55, model, modelCalls, rejectedSets: rawSets.length, reason: "model realizations lacked sufficient semantic/grounded signal; used semantic Movie fallback without event-by-event caption coverage" };
  }
  const scored = groundedSets.map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.lens, input.priorScenes ?? [], clean(input.subject), input.domainContext) })).sort((a, b) => b.score - a.score);
  const best = scored[0]!; best.scenes.forEach((scene) => { scene.score = best.score; });
  return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets: rawSets.length - groundedSets.length };
}
