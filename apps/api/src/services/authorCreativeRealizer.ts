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

const INTERNAL = /\b(?:cognition|planner|planning|candidate|semantic|trajectory|viewer|audience|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was)\.?$/i;
const CONTEXT_CHARACTER = /\b(?:groomer|owner|customer|client|waiter|server|bartender|barber|driver|agent|lawyer|doctor|nurse|manager|employee|staff|worker|photographer|dj|deejay|police|officer|cop|enemy|opponent|soldier|guard|host)\b/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function unique(values: readonly string[]): string[] { return [...new Set(values.map(clean).filter(Boolean))]; }
function words(text: string): string[] { return clean(text).match(WORDS) ?? []; }
function tokenSet(text: string): Set<string> { return new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2)); }
function overlap(left: string, right: string): number { const a = tokenSet(left); const b = tokenSet(right); if (!a.size || !b.size) return 0; let hits = 0; for (const token of a) if (b.has(token)) hits += 1; return hits / Math.max(1, a.size); }
function metric(value: number): number { return Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3)))); }
function parseJson(text: string): Record<string, unknown> | undefined { const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim(); try { const parsed = JSON.parse(cleaned); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}"); if (start < 0 || end <= start) return undefined; try { const parsed = JSON.parse(cleaned.slice(start, end + 1)); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { return undefined; } } }
function subjectPresence(scenes: readonly RealizedScene[], subject: string): number { const tokens = tokenSet(subject); if (!tokens.size) return 0; return scenes.reduce((sum, scene) => sum + ([...tokens].some((token) => tokenSet(scene.text).has(token)) ? 1 : 0), 0) / Math.max(1, scenes.length); }
function contextRoleLoad(scenes: readonly RealizedScene[], subject: string, graph: RealityGraph): number { if (CONTEXT_CHARACTER.test(subject)) return 0; const graphText = graph.events.flatMap((event) => [event.label, ...event.entities]).join(" "); return scenes.reduce((sum, scene) => { const match = scene.text.match(CONTEXT_CHARACTER)?.[0]; if (!match) return sum; const supplied = new RegExp(`\\b${match}\\b`, "i").test(graphText); return sum + (supplied ? 0.35 : 1); }, 0) / Math.max(1, scenes.length); }
function validateSet(raw: unknown, graph: RealityGraph, subject: string): RealizedScene[] | undefined { if (!raw || typeof raw !== "object") return undefined; const row = raw as RawSet; if (!Array.isArray(row.scenes)) return undefined; const validIds = new Set(graph.events.map((event) => event.id)); const conceptual = graph.events.length === 0; const scenes: RealizedScene[] = []; for (const item of row.scenes.slice(0, 12)) { if (!item || typeof item !== "object") continue; const scene = item as RawScene; const text = clean(scene.text); if (!text || text.length > 180 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text)) return undefined; const sourceEventIds = Array.isArray(scene.sourceEventIds) ? unique(scene.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id)) : []; if (!conceptual && !sourceEventIds.length) return undefined; const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : scenes.length === 0 ? "hook" : scenes.length === (row.scenes.length - 1) ? "payoff" : "line"; scenes.push({ text, kind, sourceEventIds, score: 0 }); } const starLoad = subjectPresence(scenes, subject); const roleLoad = contextRoleLoad(scenes, subject, graph); if (scenes.length >= 3 && starLoad < 0.2 && roleLoad > 0.45) return undefined; return scenes.length > 0 ? scenes : undefined; }
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, lens: string, priorScenes: string[], subject: string): number { const evidence = movie.evidence.join(" "); const allText = scenes.map((scene) => scene.text).join(" "); const starts = scenes.map((scene) => words(scene.text).slice(0, 3).join(" ").toLowerCase()).filter(Boolean); const repeatedStarts = starts.length - new Set(starts).size; const uniqueSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size; const sourceCoverage = graph.events.length ? Math.min(1, uniqueSources / Math.max(1, Math.min(graph.events.length, 5))) : 1; const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1; const rhythm = scenes.length === 1 ? 0.72 : scenes.length <= 5 ? 0.98 : scenes.length <= 8 ? 0.9 : 0.78; const averageWords = scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / Math.max(1, scenes.length); const compactness = averageWords <= 9 ? 1 : averageWords <= 14 ? 0.88 : averageWords <= 20 ? 0.62 : 0.34; const lensBonus = lens && lens !== "LET QRE DECIDE" ? 0.07 : 0; const semanticLanguage = /\b(?:somehow|apparently|still|again|finally|anyway|meanwhile|didn't matter|didn't stand a chance|round|tko|power up|mission|case|lights out|survived|won|lost|surrendered|verdict|approved|temporary)\b/i.test(allText) ? 0.11 : 0; const evidenceFit = metric(scenes.reduce((sum, scene) => sum + overlap(scene.text, evidence), 0) / Math.max(1, scenes.length)); const star = subjectPresence(scenes, subject); const contextPenalty = contextRoleLoad(scenes, subject, graph); return metric(sourceCoverage * 0.17 + evidenceFit * 0.15 + novelty * 0.12 + rhythm * 0.12 + compactness * 0.11 + star * 0.17 + lensBonus + semanticLanguage - repeatedStarts * 0.045 - contextPenalty * 0.12); }

export async function realizeAuthorExperience(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }): Promise<AuthorRealizationResult> {
  const eventTable = input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities }));
  const context = { prompt: clean(input.prompt), subject: clean(input.subject), lens: clean(input.lens) || "LET QRE DECIDE", memory: (input.memoryContext ?? []).slice(0, 40), priorScenes: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40), movie: { thesis: input.movie.hypothesis, payoff: input.movie.payoff, question: input.movie.unresolvedQuestion, trajectory: input.movie.trajectory, evidence: input.movie.evidence, supportingRelations: input.movie.supportingRelationKinds, sourceEventIds: input.movie.trajectory.flatMap((step) => step.eventIds) }, realityEvents: eventTable };
  let model = "fallback"; let modelCalls = 0; let parsed: Record<string, unknown> | undefined;
  try {
    const result = await localModelGenerate([
      { role: "system", content: [
        "You are QRE's ONE CREATIVE REALIZER. The Movie is already selected. The frame/lens is already selected. Do not redesign either one.",
        "You are the last semantic-to-language step. Do not summarize the receipt and do not write a conventional story. Make the supplied reality FEEL alive in a sequence of tiny screens.",
        "STAR / ARENA: The supplied subject is the STAR. The house, service, restaurant, groomer, venue, receipt, city, object or event around the subject is the ARENA. The arena supplies texture and constraints; it is not the protagonist unless it is itself the supplied subject.",
        "Never let a service worker, staff member, customer, owner, lawyer, waiter, driver or other contextual person become a character merely because that role exists in the setting. Do not make the narration about them. Keep looking back at the star and what the star is experiencing.",
        "REALITY: supplied events are factual truth. Every concrete world claim must be supported by the cited source event. Provenance IDs are evidence references, not permission to invent adjacent actions.",
        "REALIZATION: between facts, discover the semantic move. State change can become status. Repetition can become significance. Completion can become victory. Contrast can become attitude. A mundane sequence can become a mission, speedrun, tournament, investigation, restoration, romance, horror, spy frame, etc. But the frame only changes perspective; it never dictates what happened.",
        "LENS FREEDOM: metaphor, irony, personification, status, exaggeration, juxtaposition, surreal framing and genre language are allowed when earned. 'Kitchen TKO', 'round 2', 'super power up', 'the house surrendered', 'mirror verdict: fabulous', 'mission complete' and 'somehow, none of that mattered' are the kind of compressed language QRE may discover. They are readings, not literal new events.",
        "Do not invent people, dialogue, reactions, theft, grab, chase, arrival, departure, romance, injury, tools, camera activity, or any other concrete event that is not supplied.",
        "FACT RESTATEMENT is weaker than SEMANTIC REALIZATION. 'Mirror approved' merely repeats. 'Mirror verdict: fabulous.' carries stance. Do not explain why a line means something; make the line mean it.",
        "FORWARD PULL is earned by the next change in reading, not by fake cliffhangers. The next line should make us want to see what QRE notices next.",
        "ONE SCREEN = ONE BEAT. Usually 2-10 words, sometimes a little longer when the line earns it. Fragments are welcome. Shortness is rhythm, not a hard ceiling.",
        "Do not start every line with the subject's name. Star-centric does not mean repetitive naming: 'Kitchen cleared.' is still Maria's world when Maria is the star.",
        "Do not use explanations, planning language, compiler vocabulary or customer-service narration.",
        "If the supplied reality is already strong without a frame, keep the lens quiet. NONE is a successful creative choice.",
        "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets. No prose outside JSON.",
      ].join("\n") },
      { role: "user", content: JSON.stringify(context) },
    ], "json", { numPredict: 2600, temperature: 0.96 });
    model = result.model; modelCalls = 1; parsed = parseJson(result.text);
  } catch { parsed = undefined; }
  const rawSets = Array.isArray(parsed?.sets) ? parsed.sets : [];
  const sets = rawSets.map((item) => validateSet(item, input.graph, clean(input.subject))).filter((set): set is RealizedScene[] => Boolean(set));
  if (!sets.length) { const fallbackText = input.graph.events[0]?.label || clean(input.movie.payoff) || clean(input.prompt) || "Something worth remembering."; const fallback: RealizedScene[] = [{ text: fallbackText, kind: "hook", sourceEventIds: input.graph.events[0] ? [input.graph.events[0].id] : [], score: 0 }]; return { scenes: fallback, score: input.graph.events.length ? 0.25 : 0.55, model, modelCalls, rejectedSets: rawSets.length, reason: "no valid model realization; used conservative single-cut fallback" }; }
  const scored = sets.map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.lens, input.priorScenes ?? [], clean(input.subject)) })).sort((a, b) => b.score - a.score);
  const best = scored[0]!; best.scenes.forEach((scene) => { scene.score = best.score; }); return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets: rawSets.length - sets.length };
}
