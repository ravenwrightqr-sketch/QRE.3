/*
 * QRE CANONICAL CREATIVE REALIZER
 *
 * One customer-facing creative realization path.
 * Reality is immutable. The selected frame/lens changes how supplied reality
 * feels through metaphor, genre, personification, status, juxtaposition and
 * cinematic compression. It never becomes a source of new facts.
 */
import type { AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";

export type RealizedScene = AuthorScene & { sourceEventIds: string[]; score: number };
export type AuthorRealizationResult = { scenes: RealizedScene[]; score: number; model: string; modelCalls: number; rejectedSets: number; reason?: string };

type RawScene = { text?: unknown; kind?: unknown; sourceEventIds?: unknown };
type RawSet = { scenes?: unknown };

const INTERNAL = /\b(?:cognition|planner|planning|candidate|semantic|trajectory|viewer|audience|objective|curiosity|prediction error|state shift|sequence|author|mouth|canonical|supplied evidence|evidenceEventIds|payoff dependency|memory projection|future thread|latent movie|creative opportunity)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|reveals that|the viewer|the audience|the narrative|the experience was|the significance)\b/i;
const TEMPLATE = /\b(?:mission activated|mission complete|objective complete|target acquired|red carpet ready|styling commenced|final look approved|achievement unlocked|level up|xp|boss defeated|case closed|operation complete|quest complete)\b/i;
const GENERIC = /^(?:something happened|something changed|everything changed|a moment|the moment|a feeling|the feeling|it was meaningful|it was special|it was important|the transformation was|the situation was|the experience was|the result was)\.?$/i;
const CONCRETE_INVENTION = /\b(?:arrived|walked|ran|grabbed|snatched|stole|spoke|said|called|ordered|kissed|hugged|laughed|cried|watched|hired|fired|attacked|escaped|entered|left|picked up|put|threw|opened|closed|turned on|turned off|broke|fixed|exploded|appeared|disappeared)\b/i;
const WORDS = /\b\w+[’'-]*\w*\b/g;
const ALLOWED_KINDS = new Set(["line", "hook", "movement", "discovery", "turn", "payoff", "afterglow"]);

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function unique(values: readonly string[]): string[] { return [...new Set(values.map(clean).filter(Boolean))]; }
function words(text: string): string[] { return clean(text).match(WORDS) ?? []; }
function tokenSet(text: string): Set<string> { return new Set(words(text).map((word) => word.toLowerCase()).filter((word) => word.length > 2)); }
function overlap(left: string, right: string): number { const a = tokenSet(left); const b = tokenSet(right); if (!a.size || !b.size) return 0; let hits = 0; for (const token of a) if (b.has(token)) hits += 1; return hits / Math.max(1, a.size); }
function metric(value: number): number { return Math.max(0, Math.min(1, Number((Number.isFinite(value) ? value : 0).toFixed(3)))); }
function parseJson(text: string): Record<string, unknown> | undefined { const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim(); try { const parsed = JSON.parse(cleaned); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}"); if (start < 0 || end <= start) return undefined; try { const parsed = JSON.parse(cleaned.slice(start, end + 1)); return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined; } catch { return undefined; } } }
function validateSet(raw: unknown, graph: RealityGraph): RealizedScene[] | undefined { if (!raw || typeof raw !== "object") return undefined; const row = raw as RawSet; if (!Array.isArray(row.scenes)) return undefined; const validIds = new Set(graph.events.map((event) => event.id)); const conceptual = graph.events.length === 0; const scenes: RealizedScene[] = []; for (const item of row.scenes.slice(0, 12)) { if (!item || typeof item !== "object") continue; const scene = item as RawScene; const text = clean(scene.text); if (!text || text.length > 180 || INTERNAL.test(text) || EXPLANATION.test(text) || GENERIC.test(text) || TEMPLATE.test(text)) return undefined; const sourceEventIds = Array.isArray(scene.sourceEventIds) ? unique(scene.sourceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => validIds.has(id)) : []; if (!conceptual && !sourceEventIds.length) return undefined; const kind = ALLOWED_KINDS.has(clean(scene.kind)) ? clean(scene.kind) as AuthorScene["kind"] : scenes.length === 0 ? "hook" : scenes.length === (row.scenes.length - 1) ? "payoff" : "line"; scenes.push({ text, kind, sourceEventIds, score: 0 }); } return scenes.length > 0 ? scenes : undefined; }
function scoreSet(scenes: RealizedScene[], movie: LatentMovieCandidate, graph: RealityGraph, lens: string, priorScenes: string[]): number { const evidence = movie.evidence.join(" "); const allText = scenes.map((scene) => scene.text).join(" "); const starts = scenes.map((scene) => words(scene.text).slice(0, 3).join(" ").toLowerCase()).filter(Boolean); const repeatedStarts = starts.length - new Set(starts).size; const uniqueSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size; const sourceCoverage = graph.events.length ? Math.min(1, uniqueSources / Math.max(1, Math.min(graph.events.length, 5))) : 1; const novelty = priorScenes.length ? Math.max(0, 1 - Math.max(...priorScenes.map((prior) => overlap(allText, prior)), 0)) : 1; const rhythm = scenes.length === 1 ? 0.72 : scenes.length <= 5 ? 0.98 : scenes.length <= 8 ? 0.9 : 0.78; const averageWords = scenes.reduce((sum, scene) => sum + words(scene.text).length, 0) / Math.max(1, scenes.length); const compactness = averageWords <= 9 ? 1 : averageWords <= 14 ? 0.88 : averageWords <= 20 ? 0.62 : 0.34; const lensBonus = lens && lens !== "LET QRE DECIDE" ? 0.1 : 0; const feltMove = /\b(?:somehow|apparently|still|again|finally|anyway|meanwhile|didn't matter|didn't stand a chance|round|tko|power up|mission|case|lights out|survived|won|lost)\b/i.test(allText) ? 0.1 : 0; const evidenceFit = metric(scenes.reduce((sum, scene) => sum + overlap(scene.text, evidence), 0) / Math.max(1, scenes.length)); return metric(sourceCoverage * 0.2 + evidenceFit * 0.2 + novelty * 0.14 + rhythm * 0.14 + compactness * 0.14 + lensBonus + feltMove + Math.max(0, 0.08 - repeatedStarts * 0.06)); }

export async function realizeAuthorExperience(input: { prompt: string; subject: string; lens: string; graph: RealityGraph; movie: LatentMovieCandidate; memoryContext?: string[]; priorScenes?: string[]; creativeLearningContext?: string[] }): Promise<AuthorRealizationResult> {
  const eventTable = input.graph.events.map((event) => ({ id: event.id, label: event.label, place: event.place ?? null, time: event.time ?? null, entities: event.entities }));
  const context = { prompt: clean(input.prompt), subject: clean(input.subject), lens: clean(input.lens) || "LET QRE DECIDE", memory: (input.memoryContext ?? []).slice(0, 40), priorScenes: (input.priorScenes ?? []).slice(-12), creativeLearning: (input.creativeLearningContext ?? []).slice(0, 40), movie: { thesis: input.movie.hypothesis, payoff: input.movie.payoff, question: input.movie.unresolvedQuestion, trajectory: input.movie.trajectory, evidence: input.movie.evidence, supportingRelations: input.movie.supportingRelationKinds, sourceEventIds: input.movie.trajectory.flatMap((step) => step.eventIds) }, realityEvents: eventTable };
  let model = "fallback"; let modelCalls = 0; let parsed: Record<string, unknown> | undefined;
  try {
    const result = await localModelGenerate([
      { role: "system", content: [
        "You are QRE's ONE CREATIVE REALIZER. The Movie is already selected. The frame/lens is already selected. Do not redesign either one.",
        "Make the supplied reality FEEL like a short cinematic experience. Do not explain it.",
        "REALITY: The supplied event graph is factual truth. Every concrete claim must be supported by the cited source event. Never invent a concrete event just because the setting makes it plausible.",
        "STAR: Keep the supplied subject central. The place, receipt, house, service, venue, object or context is the arena around the star unless the supplied facts clearly establish another star.",
        "FRAME: A frame is a perspective constraint, not a story template. It tells you WHERE TO LOOK, not WHAT HAPPENS.",
        "The frame can be romance, horror, funny, spy, mission, speedrun, tournament, courtroom, heist, investigation, backstage, transformation, race, restoration, expedition, etc. Use it as pressure on the real facts. Never output stock frame slogans merely because the frame exists.",
        "LENS FREEDOM: You may use metaphor, irony, personification, status moves, exaggeration, juxtaposition, surreal framing, rhetorical questions and genre language. 'Kitchen TKO' can frame completed cleaning. 'Round 2' can frame the next supplied work area. 'The house surrendered' can frame a supplied cleaning result. These are felt readings, not new factual events.",
        "Do not turn metaphor into literal world truth. Do not add a groomer, customer, owner, waiter, lawyer, enemy, spy, soldier, ghost, opponent, dialogue, reaction, theft, grab, chase, arrival, departure, romance, injury, explosion or other new event unless supplied.",
        "ONE SCREEN = ONE BEAT. Prefer shortish lines, usually 2-10 words. Fragments are welcome. Let the next line earn the next line.",
        "Do not restate every fact. Select only the details that create the strongest latent progression. Find the hidden relationship, status shift, escalation, contrast, payoff, callback, sensory image or emotional truth already earned by the material.",
        "Avoid canned genre interfaces. Never use phrases like 'Mission Activated', 'Target Acquired', 'Objective Complete', 'Red Carpet Ready', 'Achievement Unlocked', 'Level Up', 'Boss Defeated' unless those exact words are part of the supplied reality. Build a fresh expression from the actual material.",
        "A beautiful experience can simply be observation. Some realities do not need a frame. NONE is a valid creative decision and the output should then feel natural rather than themed.",
        "For concrete reality, every scene must include at least one existing sourceEventId. Source IDs prove provenance; they do not authorize claims beyond what that event actually supports.",
        "Return JSON only: {sets:[{scenes:[{text,kind,sourceEventIds:[]}]}]} with 3 materially different complete sets. No prose outside JSON.",
      ].join("\n") },
      { role: "user", content: JSON.stringify(context) },
    ], "json", { numPredict: 5000, temperature: 0.94 });
    model = result.model; modelCalls = 1; parsed = parseJson(result.text);
  } catch { parsed = undefined; }
  const rawSets = Array.isArray(parsed?.sets) ? parsed?.sets : [];
  const sets = rawSets.map((item) => validateSet(item, input.graph)).filter((set): set is RealizedScene[] => Boolean(set));
  if (!sets.length) { const fallbackText = input.graph.events[0]?.label || clean(input.movie.payoff) || clean(input.prompt) || "Something worth remembering."; const fallback: RealizedScene[] = [{ text: fallbackText, kind: "hook", sourceEventIds: input.graph.events[0] ? [input.graph.events[0].id] : [], score: 0 }]; return { scenes: fallback, score: input.graph.events.length ? 0.25 : 0.55, model, modelCalls, rejectedSets: rawSets.length, reason: "no valid model realization; used conservative single-cut fallback" }; }
  const scored = sets.map((scenes) => ({ scenes, score: scoreSet(scenes, input.movie, input.graph, input.lens, input.priorScenes ?? []) })).sort((a, b) => b.score - a.score);
  const best = scored[0]!; best.scenes.forEach((scene) => { scene.score = best.score; }); return { scenes: best.scenes, score: best.score, model, modelCalls, rejectedSets: rawSets.length - sets.length };
}
