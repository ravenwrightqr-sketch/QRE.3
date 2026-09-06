/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * Reality is immutable. Cognition selects an earned Movie. Gemma realizes
 * that meaning as customer-facing art. QRE owns provenance bookkeeping.
 * Internal cognition is never a customer fallback.
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
function subjectMentioned(text: string, subject: string): boolean {
  const textTokens = tokens(text);
  return subjectNames(subject).flatMap((name) => [...tokens(name)]).some((name) => textTokens.has(name));
}
function subjectNamePenalty(scenes: readonly RealizedScene[], subject: string): number {
  if (!scenes.length || !subjectNames(subject).length) return 0;
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
function suppliedActions(graph: RealityGraph): Set<string> {
  return new Set([...graph.events.map((event) => event.label).join(" ").matchAll(new RegExp(ACTION_WORD.source, "gi"))].map((match) => match[0].toLowerCase()));
}
function unsupportedAction(text: string, graph: RealityGraph): boolean {
  const match = text.match(ACTION_WORD); if (!match || REALIZATION_ACTION.test(text)) return false;
  return !suppliedActions(graph).has(match[0].toLowerCase());
}
function unsupportedActor(text: string, subject: string): boolean {
  const actor = leadingContextActor(text); if (!actor) return false;
  return !subjectNames(subject).some((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i").test(actor));
}
function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids);
  return graph.relations.some((relation) => set.has(relation.from) && set.has(relation.to));
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
function bindProvenance(rawIds: unknown, index: number, total: number, movie: LatentMovieCandidate, graph: RealityGraph): string[] {
  const valid = new Set(graph.events.map((event) => event.id));
  const supplied = Array.isArray(rawIds) ? unique(rawIds.filter((id): id is string => typeof id === "string")).filter((id) => valid.has(id)) : [];
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
  if (!Array.isArray(row.scenes) || row.scenes.length < 2) return undefined;
  const scenes: RealizedScene[] = [];
  for (const [index, item] of row.scenes.slice(0, 12).entries()) {
    if (!item || typeof item !== "object") return undefined;
    const scene = item as RawScene;
    const text = clean(scene.text);
    if (!text || text.length > 180 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text)) return undefined;
    if (input.graph.events.length && (unsupportedActor(text, input.subject) || unsupportedAction(text, input.graph))) return undefined;
    const sourceEventIds = bindProvenance(scene.sourceEventIds, index, row.scenes.length, input.movie, input.graph);
    if (input.graph.events.length && !sourceEventIds.length) return undefined;
    const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : index === 0 ? "hook" : index === row.scenes.length - 1 ? "payoff" : "line";
    scenes.push({ text, kind, sourceEventIds, score: 0 });
  }
  const anchors = scenes.length ? new Set(scenes.flatMap((scene) => scene.sourceEventIds)) : new Set<string>();
  if (input.graph.events.length >= 2 && !relationExists(input.graph, [...input.movie.anchorEventIds])) return undefined;
  if (input.graph.events.length >= 2 && [...anchors].length < 2) return undefined;
  return scenes;
}
function bridgeScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 2) return 1;
  return scenes.some((scene) => scene.sourceEventIds.length >= 2 && relationExists(graph, scene.sourceEventIds)) ? 1 : 0;
}
function landingScore(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const last = scenes.at(-1); if (!last) return 0;
  const count = words(last.text).length;
  const compact = count <= 4 ? 1 : count <= 7 ? 0.8 : count <= 11 ? 0.5 : 0.2;
  const fragment = /^[^,;!?]{1,80}[.!?]$/.test(last.text) && !/\b(?:is|are|was|were|means|shows|because)\b/i.test(last.text) ? 1 : 0.45;
  const abstract = overlap(last.text, graphText(graph)) < 0.35 ? 1 : 0.45;
  const articlePenalty = /^(?:a|an)\s+[a-z]+(?:\s+[a-z]+){0,3}[.!?]?$/i.test(last.text) ? 0.15 : 0;
  return metric(compact * 0.46 + fragment * 0.27 + abstract * 0.17 + (1 - articlePenalty) * 0.1);
}
function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 3 || scenes.length < 3) return 0;
  const oneEvent = scenes.filter((scene) => scene.sourceEventIds.length === 1).length / scenes.length;
  const bridge = scenes.filter((scene) => scene.sourceEventIds.length >= 2).length / scenes.length;
  const direct = scenes.reduce((sum, scene) => {
    if (scene.sourceEventIds.length !== 1) return sum;
    const source = graph.events.find((event) => event.id === scene.sourceEventIds[0]);
    return sum + Number(Boolean(source && overlap(scene.text, source.label) >= 0.58));
  }, 0) / scenes.length;
  return metric(oneEvent * 0.42 + direct * 0.38 + (1 - bridge) * 0.2);
}
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, priorScenes: string[], subject: string, domainContext?: AuthorDomainContext): number {
  const allText = scenes.map((scene) => scene.text).join(" ");
  const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1;
  const landing = landingScore(scenes, graph);
  const bridge = bridgeScore(scenes, graph);
  const anchors = graph.events.length ? Math.min(1, new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size / Math.min(3, graph.events.length)) : 1;
  const rhythm = scenes.length <= 6 ? 1 : scenes.length <= 8 ? 0.8 : 0.55;
  const subjectPenalty = subjectNamePenalty(scenes, subject);
  const domainFit = domainContext ? overlap(allText, domainText(domainContext)) : 0;
  const reel = captionReelRisk(scenes, graph);
  return metric(bridge * 0.25 + landing * 0.28 + anchors * 0.16 + movie.specificity * 0.08 + movie.distinctiveness * 0.08 + rhythm * 0.05 + novelty * 0.05 + (1 - subjectPenalty) * 0.02 + domainFit * 0.01 + (1 - reel) * 0.02);
}
function context(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; domainContext?: AuthorDomainContext; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }) {
  const ids = unique(input.movie.anchorEventIds.filter((id) => input.graph.events.some((event) => event.id === id)));
  const relationEvents = ids.map((id) => input.graph.events.find((event) => event.id === id)).filter(Boolean).map((event) => ({ id: event!.id, label: event!.label }));
  return {
    prompt: clean(input.prompt), subject: clean(input.subject), lens: clean(input.lens) || "NONE", domainContext: input.domainContext ?? {},
    memory: (input.memoryContext ?? []).slice(0, 30), priorScenes: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 30),
    selectedRelationship: { eventIds: ids, events: relationEvents, relationKinds: input.movie.supportingRelationKinds, discoveredEvidence: input.movie.evidence, semanticQuestion: input.movie.unresolvedQuestion },
    movie: { hypothesis: input.movie.hypothesis, payoff: input.movie.payoff, trajectory: input.movie.trajectory },
    realityEvents: input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities })),
  };
}
function prompt(repair: boolean): string {
  const lines = repair ? [
    "You are QRE's final creative repair pass.",
    "Create customer-facing art from the selected relationship. Do not explain the relationship.",
    "Never repeat internal reasoning, Movie thesis, planner language or metadata.",
    "Use one or two concrete supplied anchors, let them interact, then land on the earned artistic interpretation.",
    "Bare fragments are excellent. 'Playful defiance.' is valid when earned. Do not add an article merely because grammar permits it.",
    "Do not invent actions, people, dialogue, motives, reactions, outcomes, places or chronology.",
    "Return exactly {scenes:[{text,kind}]}. Do not include commentary.",
  ] : [
    "You are QRE's ONE CREATIVE REALIZER.",
    "Reality is factual authority. The selected relationship is already discovered. Your job is to make it FELT.",
    "GOLD RULE: never explain an earned meaning when you can present it.",
    "Facts are evidence. Relationship creates the reading. The final feeling is the art.",
    "A strong ending may be a new artistic phrase that does not copy the facts. Provenance is handled by QRE.",
    "Example: stolen apple + fierce subject → 'Playful defiance.' Do not write 'this shows playful defiance' and do not write 'A playful defiance.' when the bare fragment lands harder.",
    "The visible film may use collision, contrast, callback, recontextualization, irony, status, metaphor, omission, rhythm or a tiny final realization.",
    "Do not invent concrete events, actions, people, dialogue, motives, reactions, outcomes, places or chronology.",
    "Do not force one screen per fact. Different worlds should produce radically different structures.",
    "Keep the first beats concrete enough for the viewer to discover the relationship. Then stop explaining.",
    "Usually 2-10 words per screen. 2-6 screens is normal, but the evidence decides.",
    "Return JSON only: {sets:[{scenes:[{text,kind}]}]} with 3 materially different complete sets. Do not include source IDs; QRE binds provenance.",
  ];
  return lines.join("\n");
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
        [{ role: "system", content: prompt(attempt === 1) }, { role: "user", content: JSON.stringify(ctx) }],
        "json",
        { numPredict: 3000, temperature: attempt === 0 ? 1.0 : 0.92 },
      );
      model = result.model;
      modelCalls += 1;
      const parsed = parseJson(result.text);
      const rawSets = attempt === 0 ? (Array.isArray(parsed?.sets) ? parsed.sets : []) : (parsed ? [parsed] : []);
      rejectedSets += rawSets.length;
      const validSets = rawSets.map((raw) => validateSet(raw, input)).filter((set): set is RealizedScene[] => Boolean(set));
      const acceptable = validSets.filter((set) => {
        const anchors = new Set(set.flatMap((scene) => scene.sourceEventIds)).size;
        return anchors >= (input.graph.events.length > 2 ? 2 : 2) && landingScore(set, input.graph) >= 0.55 && (input.graph.events.length < 2 || bridgeScore(set, input.graph) >= 1);
      });
      if (!acceptable.length) continue;
      const scored = acceptable.map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.priorScenes ?? [], clean(input.subject), input.domainContext) })).sort((a, b) => b.score - a.score);
      const best = scored[0]!;
      best.scenes.forEach((scene) => { scene.score = best.score; });
      rejectedSets -= acceptable.length;
      return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets };
    } catch {
      // Fail closed. Never expose cognition as customer language.
    }
  }
  return { scenes: [], score: 0, model, modelCalls, rejectedSets, reason: "Mouth did not produce an earned customer-facing creation after two attempts; rejected rather than exposing cognition scaffolding" };
}
