/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Reality is immutable. Cognition selects the semantic Movie and frame.
 * This is the only customer-language realization path.
 *
 * The realizer turns an earned relationship into felt language while
 * preserving provenance. Internal cognition is never a customer fallback.
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

const INTERNAL = /\b(?:cognition|planner|planning|candidate|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity|semantic turn|semanticRealization)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance|let the supplied detail|the relationship between|changes what is worth noticing)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was|worth noticing)\.?$/i;
const CONTEXT_CHARACTER = /\b(?:groomer|owner|customer|client|waiter|server|bartender|barber|driver|agent|lawyer|doctor|nurse|manager|employee|staff|worker|photographer|dj|deejay|police|officer|cop|enemy|opponent|soldier|guard|host)\b/i;
const ACTION_WORD = /\b(?:arrived?|came|left|went|met|talked?|spoke|said|gave?|got|found|lost|cleaned?|finished?|started?|opened|closed|walk(?:ed)?|ran|drove?|ate|drank|kiss(?:ed)?|married|celebrated|played|worked|visited|bought|sold|built|fixed|painted|wore|used|stayed|waited|called|laughed|cried|looked|felt|became|changed|repaired|tested|selected|cut|shaped|polished|delivered|welcomed|checked|booked|reserved|approved|groomed|dyed|tailored|installed|stole|snatched|grabbed|grab|cooed|shrugged|screamed|attacked|fought|hired|watched|heard|sang|danced)\b/i;
const REALIZATION_ACTION = /\b(?:cleared|handled|reset|down|up|survived|won|lost|surrendered|verdict|passed|failed|ready|complete|completed|done|booted|power\s*up|tko|round|mission|case|still\s+standing|stood|made\s+it|changed\s+everything|did(?:n't| not)\s+(?:matter|stand\s+a\s+chance))\b/i;
const SAFE_TRANSITION = /\b(?:came\s+back|back\s+again|returned)\b/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const wordList = (text: string): string[] => clean(text).match(WORDS) ?? [];
const tokenSet = (text: string): Set<string> => new Set(wordList(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2));
const metric = (value: number): number => Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3))));

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
  return Math.min(1, mentions.filter(Boolean).length / scenes.length * 0.7 + adjacent / Math.max(1, scenes.length - 1) * 0.8);
}
function graphText(graph: RealityGraph): string {
  return graph.events.flatMap((event) => [event.label, ...event.entities, ...(event.place ? [event.place] : []), ...(event.time ? [event.time] : [])]).join(" ");
}
function domainText(context?: AuthorDomainContext): string {
  if (!context) return "";
  return [context.category, context.businessType, context.businessName, context.businessDescription, context.serviceType, context.serviceName, context.subjectKind, ...(context.knownCapabilities ?? []), ...(context.contextualSignals ?? [])].map(clean).filter(Boolean).join(" ");
}
function leadingContextActor(text: string): string | undefined {
  return clean(text).match(new RegExp(`^(?:the|a|an)?\\s*(${CONTEXT_CHARACTER.source.replace(/^\\b|\\b$/g, "")})\\b`, "i"))?.[1];
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
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids);
  return graph.relations.some((relation) => set.has(relation.from) && set.has(relation.to));
}
function relationalBridgeScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 2) return 1;
  return metric(scenes.some((scene) => {
    const ids = [...new Set(scene.sourceEventIds)];
    return ids.length >= 2 && relationExists(graph, ids);
  }) ? 1 : 0);
}
function artisticLandingScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const last = scenes.at(-1); if (!last) return 0;
  const count = wordList(last.text).length;
  const compact = count <= 4 ? 1 : count <= 7 ? 0.78 : count <= 11 ? 0.5 : 0.2;
  const fragment = /^[^,;!?]{1,60}[.!?]$/.test(last.text) && !/\b(?:is|are|was|were|means|shows|because)\b/i.test(last.text) ? 1 : 0.42;
  const articlePenalty = /^(?:a|an)\s+[a-z]+(?:\s+[a-z]+){0,3}[.!?]?$/i.test(last.text) ? 0.12 : 0;
  const abstractLanding = overlap(last.text, graphText(graph)) < 0.35 ? 1 : 0.45;
  return metric(compact * 0.45 + fragment * 0.25 + abstractLanding * 0.18 + (1 - articlePenalty) * 0.12);
}
function meaningfulRhythm(scenes: readonly RealizedScene[]): number {
  if (!scenes.length) return 0;
  const lengths = scenes.map((scene) => wordList(scene.text).length);
  const average = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
  const distinct = new Set(lengths.map((n) => Math.min(6, n))).size;
  return metric((average <= 10 ? 0.78 : average <= 16 ? 0.55 : 0.3) * 0.72 + distinct / Math.max(1, Math.min(4, lengths.length)) * 0.28);
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, priorScenes: string[], subject: string, domainContext?: AuthorDomainContext): number {
  const allText = scenes.map((scene) => scene.text).join(" ");
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const subjectPenalty = subjectNamePenalty(scenes, subject);
  const domainFit = domainContext ? overlap(allText, domainText(domainContext)) : 0;
  const bridge = relationalBridgeScore(scenes, graph);
  const anchors = concreteAnchorScore(scenes, graph);
  const landing = artisticLandingScore(scenes, graph);
  const rhythm = meaningfulRhythm(scenes);
  const reel = captionReelRisk(scenes, graph);
  const movieSpecificity = metric(movie.specificity * 0.6 + movie.distinctiveness * 0.4);
  return metric(bridge * 0.25 + landing * 0.27 + anchors * 0.16 + movieSpecificity * 0.1 + rhythm * 0.08 + novelty * 0.05 + (1 - subjectPenalty) * 0.04 + domainFit * 0.01 + (1 - reel) * 0.04);
}
function validateSet(raw: unknown, graph: RealityGraph, subject: string): RealizedScene[] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as RawSet;
  if (!Array.isArray(row.scenes) || row.scenes.length < 2) return undefined;
  const validIds = new Set(graph.events.map((event) => event.id));
  const scenes: RealizedScene[] = [];
  for (const item of row.scenes.slice(0, 12)) {
    if (!item || typeof item !== "object") return undefined;
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text || text.length > 180 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text)) return undefined;
    const sourceEventIds = Array.isArray(scene.sourceEventIds)
      ? unique(scene.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id))
      : [];
    if (graph.events.length && !sourceEventIds.length) return undefined;
    if (graph.events.length && (unsupportedContextActor(text, subject) || unsupportedAction(text, graph, sourceEventIds))) return undefined;
    const kind = ALLOWED_KINDS.has(clean(scene.kind))
      ? clean(scene.kind) as AuthorScene["kind"]
      : scenes.length === 0 ? "hook" as const : scenes.length === row.scenes.length - 1 ? "payoff" as const : "line" as const;
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  if (scenes.length < 2) return undefined;
  if (scenes.length >= 3 && captionReelRisk(scenes, graph) >= 0.86) return undefined;
  if (graph.events.length >= 2 && relationalBridgeScore(scenes, graph) < 1) return undefined;
  return scenes;
}
function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }) {
  return {
    prompt: clean(input.prompt), subject: clean(input.subject), lens: clean(input.lens) || "LET QRE DECIDE",
    domainContext: input.domainContext ?? {}, memory: (input.memoryContext ?? []).slice(0, 40), priorScenes: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40),
    movie: { thesis: input.movie.hypothesis, storyThesis: input.movie.storyThesis, payoff: input.movie.payoff, question: input.movie.unresolvedQuestion, trajectory: input.movie.trajectory, evidence: input.movie.evidence, supportingRelations: input.movie.supportingRelationKinds, sourceEventIds: input.movie.trajectory.flatMap((step) => step.eventIds) },
    realityEvents: input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities })),
  };
}
function systemPrompt(repair: boolean): string {
  return (repair
    ? [
        "You are QRE's final creative Mouth repair pass.",
        "The selected Movie is already the intended meaning. Do not explain it, repeat its thesis, or expose reasoning.",
        "Turn the relationship into a tiny piece of customer-facing art.",
        "FAIL CLOSED: never output internal planning language or phrases such as 'the relationship between', 'this means', 'let the supplied detail', 'what is worth noticing', 'the viewer', or 'the meaning is'.",
        "GOLD: establish one or two concrete supplied anchors, let them collide through the selected relationship, then land on the earned interpretation.",
        "A final creative fragment may be bare: 'Playful defiance.' is stronger than 'A playful defiance.' when earned.",
        "Never invent a concrete action, person, dialogue, motive, reaction, outcome, place or chronology. Artistic attitude, metaphor and compressed feeling are allowed when earned by observable supplied facts.",
        "Return exactly one JSON object: {scenes:[{text,kind,sourceEventIds:[]}]}. Usually 2-6 scenes. Short is good; boring is bad.",
      ]
    : [
        "You are QRE's ONE CREATIVE REALIZER. The Movie and frame are selected. Do not redesign them.",
        "Reality is factual authority. Your job is to make the selected relationship FELT as customer-facing art.",
        "GOLD RULE: do not explain an earned meaning when you can simply present it. Facts are the evidence. The final feeling is the art.",
        "Example: supplied reality establishes a stolen apple and a fierce subject. Do not write 'this shows playful defiance'. Make the facts collide and land on 'Playful defiance.' The phrase is an artistic reading, not a newly asserted fact.",
        "BARE-LANDING RULE: when a final abstract noun phrase earns its meaning, prefer the clean fragment without an article.",
        "UNIVERSALITY: no default author voice. Reality + arena + relationship determine diction, rhythm and structure.",
        "RELATION-FIRST: the strongest scene may not paraphrase either event. It can be collision, contrast, callback, recontextualization, status comparison, image, phrase or emotional landing.",
        "OBSERVER COMPLETION: give enough evidence to recognize the relationship, then stop. Never explain the connection.",
        "CONCRETE ANCHORS: preserve one or more unmistakable supplied anchors before the landing. The landing may be substantially new language.",
        "PROVENANCE IS MEANINGFUL: sourceEventIds say what earned the line. Do not force every event into visible prose.",
        "CREATIVE LANGUAGE: metaphor, irony, personification, attitude and compressed feeling are allowed when earned. Unsupported psychology, motives and new factual actions are not.",
        "NO CAPTION REEL. NO METADATA REEL. Different domains may produce radically different structures.",
        "SUBJECT NAME IS SCARCE. Prefer omission after identity is established.",
        "Usually 2-10 words per screen. Fragments are welcome. A clean final landing is welcome.",
        "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets.",
      ]).join("\n");
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

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await localModelGenerate(
        [{ role: "system", content: systemPrompt(attempt === 1) }, { role: "user", content: JSON.stringify(ctx) }],
        "json",
        { numPredict: 3000, temperature: attempt === 0 ? 1.0 : 0.92 },
      );
      model = result.model;
      modelCalls += 1;
      const parsed = parseJson(result.text);
      const rawSets = attempt === 0
        ? (Array.isArray(parsed?.sets) ? parsed.sets : [])
        : (parsed ? [parsed] : []);
      rejectedSets += rawSets.length;
      const validSets = rawSets
        .map((item) => validateSet(item, input.graph, clean(input.subject)))
        .filter((set): set is RealizedScene[] => Boolean(set))
        .filter((set) => concreteAnchorScore(set, input.graph) >= (input.graph.events.length > 2 ? 0.34 : 0.22));
      if (!validSets.length) continue;

      const scored = validSets
        .map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.priorScenes ?? [], clean(input.subject), input.domainContext) }))
        .sort((a, b) => b.score - a.score);
      const best = scored[0]!;
      best.scenes.forEach((scene) => { scene.score = best.score; });
      rejectedSets -= validSets.length;
      return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets };
    } catch {
      // Fail closed. A broken model call never becomes customer-facing cognition.
    }
  }

  return {
    scenes: [],
    score: 0,
    model,
    modelCalls,
    rejectedSets,
    reason: "Mouth failed to produce an earned, grounded customer-facing realization after two attempts; rejected rather than exposing cognition scaffolding",
  };
}
