/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Reality is immutable. Cognition selects the semantic Movie and frame.
 * This is the only customer-language realization path.
 *
 * The realizer's job is not to paraphrase the graph. It turns an earned
 * relationship into felt language while preserving provenance.
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
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
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
  const a = tokenSet(left); const b = tokenSet(right); if (!a.size || !b.size) return 0;
  let hits = 0; for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}
function subjectNames(subject: string): string[] {
  return clean(subject).split(/\s*(?:\+|&|,|\/|\band\b)\s*/i).map(clean).filter(Boolean).sort((a, b) => b.length - a.length);
}
function subjectPattern(subject: string): RegExp | undefined {
  const names = subjectNames(subject).map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return names.length ? new RegExp(`^(?:${names.join("|")})(?:\\s+|[:,–—-]+\\s*)`, "i") : undefined;
}
function stripSubjectLead(text: string, subject: string): string {
  const pattern = subjectPattern(subject); if (!pattern) return clean(text);
  return clean(clean(text).replace(pattern, "").replace(/^(?:is|are|was|were)\s+/i, ""));
}
function subjectMentioned(text: string, subject: string): boolean {
  const sceneTokens = tokenSet(text);
  return subjectNames(subject).flatMap((name) => [...tokenSet(name)]).some((name) => sceneTokens.has(name));
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
  const match = text.match(ACTION_WORD); if (!match || REALIZATION_ACTION.test(text)) return false;
  if (SAFE_TRANSITION.test(text) && sourceEventIds.length >= 2) return false;
  return !suppliedActionWords(graph).has(match[0].toLowerCase());
}
function unsupportedContextActor(text: string, subject: string): boolean {
  const actor = leadingContextActor(text); if (!actor) return false;
  return !subjectNames(subject).some((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i").test(actor));
}
function contextRoleLoad(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const graphWords = tokenSet(graphText(graph));
  return scenes.reduce((sum, scene) => {
    const match = scene.text.match(CONTEXT_CHARACTER)?.[0];
    return sum + (match ? (graphWords.has(match.toLowerCase()) ? 0.35 : 1) : 0);
  }, 0) / Math.max(1, scenes.length);
}
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
function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 3 || scenes.length < 3) return 0;
  const valid = new Set(graph.events.map((event) => event.id));
  const usable = scenes.filter((scene) => scene.sourceEventIds.some((id) => valid.has(id)));
  if (usable.length < 3) return 0;
  const oneEvent = usable.filter((scene) => new Set(scene.sourceEventIds.filter((id) => valid.has(id))).size === 1).length / usable.length;
  const bridge = usable.filter((scene) => new Set(scene.sourceEventIds.filter((id) => valid.has(id))).size >= 2).length / usable.length;
  const direct = usable.reduce((sum, scene) => {
    const ids = scene.sourceEventIds.filter((id) => valid.has(id)); if (ids.length !== 1) return sum;
    const source = graph.events.find((event) => event.id === ids[0]); return sum + Number(Boolean(source && overlap(scene.text, source.label) >= 0.58));
  }, 0) / usable.length;
  return metric(oneEvent * 0.42 + direct * 0.38 + (1 - bridge) * 0.12 + usable.filter((scene) => !/[,:;!?]|\b(?:but|yet|still|then|until|again|because|while|now|and)\b/i.test(scene.text)).length / usable.length * 0.08);
}
function concreteAnchorScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!graph.events.length) return 1;
  const anchors = graph.events.filter((event) => {
    const linked = scenes.filter((scene) => scene.sourceEventIds.includes(event.id)).map((scene) => scene.text).join(" ");
    return overlap(linked, event.label) >= 0.22;
  }).length;
  return metric(anchors / Math.max(1, Math.min(graph.events.length, 3)));
}
function relationalBridgeScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 2) return 1;
  const valid = new Set(graph.events.map((event) => event.id));
  const relations = graph.relations ?? [];
  const bridged = scenes.filter((scene) => {
    const ids = [...new Set(scene.sourceEventIds.filter((id) => valid.has(id)))];
    if (ids.length < 2) return false;
    return ids.some((left, i) => ids.slice(i + 1).some((right) => relations.some((relation) => (relation.from === left && relation.to === right) || (relation.from === right && relation.to === left))));
  }).length;
  return metric(Math.min(1, bridged / 1));
}
function artisticLandingScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const last = scenes.at(-1); if (!last) return 0;
  const wordCount = words(last.text).length;
  const compact = wordCount <= 4 ? 1 : wordCount <= 7 ? 0.78 : wordCount <= 11 ? 0.5 : 0.2;
  const fragment = /[.!?]$/.test(last.text) && !/\b(?:is|are|was|were|means|shows|because)\b/i.test(last.text) ? 0.2 : 0;
  const articlePenalty = /^(?:a|an|the)\s+[a-z]+(?:\s+[a-z]+){0,3}[.!?]?$/i.test(last.text) && wordCount <= 4 ? 0.12 : 0;
  const abstract = overlap(last.text, graphText(graph));
  const multiEvidence = new Set(last.sourceEventIds).size >= 2 ? 0.28 : 0;
  return metric(compact * 0.5 + fragment + (1 - Math.min(1, abstract)) * 0.18 + multiEvidence + (1 - articlePenalty));
}
function meaningfulRhythm(scenes: readonly RealizedScene[]): number {
  if (!scenes.length) return 0;
  const average = scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / scenes.length;
  const varied = new Set(scenes.map((scene) => Math.min(4, words(scene.text).length))).size / Math.max(1, Math.min(4, scenes.length));
  return metric((average <= 10 ? 0.75 : average <= 16 ? 0.52 : 0.28) * 0.7 + varied * 0.3);
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, priorScenes: string[], subject: string, domainContext?: AuthorDomainContext): number {
  const allText = scenes.map((scene) => scene.text).join(" ");
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const compactness = metric(1 - Math.max(0, (scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / Math.max(1, scenes.length) - 8) / 18));
  const subjectPenalty = subjectNamePenalty(scenes, subject);
  const domainFit = domainContext ? overlap(allText, domainText(domainContext)) : 0;
  const bridge = relationalBridgeScore(scenes, graph);
  const anchors = concreteAnchorScore(scenes, graph);
  const landing = artisticLandingScore(scenes, graph);
  const rhythm = meaningfulRhythm(scenes);
  const reel = captionReelRisk(scenes, graph);
  const movieSpecificity = metric(movie.specificity * 0.6 + movie.distinctiveness * 0.4);
  return metric(
    bridge * 0.24 +
    landing * 0.24 +
    anchors * 0.18 +
    movieSpecificity * 0.1 +
    rhythm * 0.08 +
    compactness * 0.05 +
    novelty * 0.04 +
    (1 - subjectPenalty) * 0.03 +
    domainFit * 0.02 +
    (1 - reel) * 0.02,
  );
}
function fallbackFromMovie(input: { movie: LatentMovieCandidate; graph: RealityGraph; subject: string }): RealizedScene[] {
  const sourceIds = unique(input.movie.trajectory.flatMap((step) => step.eventIds)).filter((id) => input.graph.events.some((event) => event.id === id));
  const strongest = input.graph.events.slice().sort((a, b) => Number(Boolean(b.salient)) - Number(Boolean(a.salient)))[0];
  const text = strongest ? stripSubjectLead(strongest.label, input.subject) : "";
  return text
    ? [{ text, kind: "hook", sourceEventIds: [strongest!.id], score: 0 }]
    : [{ text: "", kind: "hook", sourceEventIds: sourceIds.slice(0, 1), score: 0 }];
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
    prompt: clean(input.prompt),
    subject: clean(input.subject),
    lens: clean(input.lens) || "LET QRE DECIDE",
    domainContext: input.domainContext ?? {},
    memory: (input.memoryContext ?? []).slice(0, 40),
    priorScenes: (input.priorScenes ?? []).slice(-12),
    creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40),
    movie: { thesis: input.movie.hypothesis, storyThesis: input.movie.storyThesis, payoff: input.movie.payoff, question: input.movie.unresolvedQuestion, trajectory: input.movie.trajectory, evidence: input.movie.evidence, supportingRelations: input.movie.supportingRelationKinds, sourceEventIds: input.movie.trajectory.flatMap((step) => step.eventIds) },
    realityEvents: eventTable,
  };
  let model = "fallback"; let modelCalls = 0; let parsed: Record<string, unknown> | undefined;
  try {
    const result = await localModelGenerate([{ role: "system", content: [
      "You are QRE's ONE CREATIVE REALIZER. The Movie and frame are selected. Do not redesign the Movie.",
      "Your job is to make the selected relationship FELT. Reality is factual authority; the visible film is artistic interpretation grounded in that reality.",
      "GOLD RULE: do not explain an earned meaning when you can simply present it. Facts are the evidence. The final feeling is the art.",
      "Example: if the supplied reality establishes an apple was stolen and the subject is framed as fierce, do not write 'this shows playful defiance'. Let the facts collide and land on 'Playful defiance.' The phrase is an interpretation, not a newly asserted fact.",
      "BARE-LANDING RULE: when a final abstract noun phrase earns its meaning, prefer the clean fragment without an article: 'Playful defiance.' rather than 'A playful defiance.'",
      "UNIVERSALITY: there is no default author voice for dogs, grooming, restaurants, memories, people, places, products, weddings, businesses or any other domain. Let the supplied reality, arena and selected relationship determine diction, rhythm and structure.",
      "RELATION-FIRST: the strongest scene is often not a paraphrase of either event. It can be a collision, contrast, callback, recontextualization, status comparison, image, phrase or emotional landing that becomes legible only because earlier concrete details were supplied.",
      "OBSERVER COMPLETION: give the viewer enough evidence to recognize the relationship, then stop. Do not explain the connection.",
      "CONCRETE ANCHORS: early or middle beats should preserve distinctive supplied nouns/phrases when they carry identity. The landing may be much more interpretive and need not repeat those nouns if provenance points to the contributing facts.",
      "PROVENANCE IS MEANINGFUL: sourceEventIds say what earned a line. Do not force every source event into visible caption text.",
      "FELT OVER RECITED: fragments, juxtaposition, omission, callback, rhythm, status, irony, personification and genre language are welcome when earned. Do not turn every screen into a complete sentence.",
      "CREATIVE LANGUAGE IS NOT A FACT: a metaphor, opinion, attitude or compressed feeling may be new language. A new concrete action, person, dialogue, motive, reaction, outcome, location or chronology is not allowed.",
      "PSYCHOLOGY: do not assert unsupported internal states or motives as fact. A brief creative landing can express the artistic reading of observable details without claiming privileged access to the subject's mind.",
      "SUBJECT NAME IS SCARCE: do not repeatedly begin screens with the subject name. Omit it when the viewer already knows who the film concerns.",
      "NO CAPTION REEL: do not map one visible screen to every supplied event. Compress when the relationship is stronger than the chronology.",
      "NO METADATA REEL: dates, GPS, receipts and context are material, not mandatory screens. Use them only when they become part of the selected meaning.",
      "Different domains must be allowed to produce radically different structures. A receipt can land like a receipt. A rave can land like a rupture. A pet can land like a character sketch. A place can land like a reveal. Do not normalize them into one story template.",
      "NONE is valid when the facts themselves create the strongest effect.",
      "USUALLY 2-10 WORDS PER SCREEN. One-word or 2-4 word landings are allowed. Shortness is rhythm, not a fixed beat count.",
      "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets. Do not return commentary outside JSON.",
    ].join("\n") }, { role: "user", content: JSON.stringify(context) }], "json", { numPredict: 3000, temperature: 1.0 });
    model = result.model; modelCalls = 1; parsed = parseJson(result.text);
  } catch { parsed = undefined; }

  const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
  const sets = rawSets.map((item) => validateSet(item, input.graph, clean(input.subject))).filter((set): set is RealizedScene[] => Boolean(set));
  const groundedSets = sets.filter((set) => {
    if (!input.graph.events.length) return true;
    const anchors = concreteAnchorScore(set, input.graph);
    const bridge = relationalBridgeScore(set, input.graph);
    return set.length >= 2 && anchors >= Math.min(1, 0.34 * Math.min(3, input.graph.events.length)) && (input.graph.events.length < 2 || bridge >= 1);
  });
  if (!groundedSets.length) {
    const fallback = fallbackFromMovie({ movie: input.movie, graph: input.graph, subject: clean(input.subject) });
    return { scenes: fallback.filter((scene) => Boolean(scene.text)), score: 0.12, model, modelCalls, rejectedSets: rawSets.length, reason: "no model realization earned the relationship/landing contract; deterministic fallback is non-film quality and should not be treated as a gold creation" };
  }
  const scored = groundedSets.map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.priorScenes ?? [], clean(input.subject), input.domainContext) })).sort((a, b) => b.score - a.score);
  const best = scored[0]!; best.scenes.forEach((scene) => { scene.score = best.score; });
  return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets: rawSets.length - groundedSets.length };
}

function validateSet(raw: unknown, graph: RealityGraph, subject: string): RealizedScene[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes) || row.scenes.length < 2) return undefined;
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
  if (scenes.length < 2) return undefined;
  if (scenes.length >= 3 && contextRoleLoad(scenes, graph) > 0.75) return undefined;
  if (captionReelRisk(scenes, graph) >= 0.86) return undefined;
  return scenes;
}
