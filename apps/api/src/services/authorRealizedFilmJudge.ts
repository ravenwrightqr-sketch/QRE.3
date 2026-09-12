/**
 * QRE SEQUENCE JUDGE — DIAGNOSTIC ONLY
 *
 * The artifact is a sequence-text film: visible text changing the read from
 * cut to cut. This file judges the visible sequence; it never chooses art.
 *
 * Do not introduce audiovisual production concerns here. The Judge measures
 * grounding, semantic relationship, attention movement, landing, transformation,
 * provenance, invention, explanation, caption-reel collapse, and proposition fidelity.
 */
import type { AuthorCreativeProposition, RealityGraph, SequenceCandidate, AuthorScene } from "@qre/contracts";

type RealizedScene = AuthorScene & { sourceEventIds: string[]; score?: number };
export type RealizedSequenceJudgment = {
  accepted: boolean; score: number; reasons: string[];
  dimensions: {
    concreteGrounding: number; relationBridge: number; progression: number; landing: number;
    formDiversity: number; artisticTransformation: number; sourceCopyRisk: number; inventionRisk: number;
    explanationRisk: number; captionReelRisk: number; propositionFidelity: number;
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const tokenList = (text: string): string[] => (clean(text).toLowerCase().match(/\b[\w’'-]+\b/g) ?? []).filter((token) => token.length > 2);
const tokenSet = (text: string): Set<string> => new Set(tokenList(text));
const STOP = new Set(["the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "as", "is", "are", "was", "were", "be", "been", "being", "this", "that", "it", "its"]);
const RELATION_WORDS = /\b(?:because|therefore|so|except|only|instead|until|while|again|back|always|never|first|then|before|after|more|less|same|different|priority|system|rule|rank|matters|counts|belongs|depends|changes|becomes|turns|returns|overrides)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|the point is|the meaning is|in other words|the relationship|the viewer|the audience|changes what is worth noticing|because this)\b/i;

function overlap(left: string, right: string): number { const a = tokenSet(left); const b = tokenSet(right); if (!a.size || !b.size) return 0; let hits = 0; for (const token of a) if (b.has(token)) hits += 1; return hits / Math.max(1, a.size); }
function sequenceMatch(left: string, right: string): number { const a = tokenList(left), b = tokenList(right); if (!a.length || !b.length) return 0; const row = new Array<number>(b.length + 1).fill(0); for (let i = 1; i <= a.length; i += 1) { let diagonal = 0; for (let j = 1; j <= b.length; j += 1) { const prior = row[j]!; row[j] = a[i - 1] === b[j - 1] ? diagonal + 1 : Math.max(row[j]!, row[j - 1]!); diagonal = prior; } } return clamp(row[b.length]! / Math.max(a.length, b.length)); }
function sourceEvents(scene: RealizedScene, graph: RealityGraph) { return scene.sourceEventIds.map((id) => graph.events.find((event) => event.id === id)).filter((event): event is RealityGraph["events"][number] => Boolean(event)); }
function eventText(event: RealityGraph["events"][number]) { return [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" "); }
function eventCorpus(graph: RealityGraph) { return graph.events.map(eventText).join(" "); }
function concreteGrounding(scenes: readonly RealizedScene[], graph: RealityGraph): number { const checked = scenes.slice(0, -1); if (!checked.length) return 0; return clamp(checked.reduce((sum, scene) => { const source = sourceEvents(scene, graph); if (!source.length) return sum; return sum + Math.max(0.48, ...source.map((event) => overlap(scene.text, eventText(event)))); }, 0) / checked.length); }
function relationBridge(scenes: readonly RealizedScene[], graph: RealityGraph): number { if (graph.events.length < 2) return 1; const explicit = scenes.some((scene) => scene.sourceEventIds.length >= 2 && graph.relations.some((relation) => scene.sourceEventIds.includes(relation.from) && scene.sourceEventIds.includes(relation.to))); if (explicit) return 1; if (scenes.some((scene) => scene.sourceEventIds.length >= 2)) return .85; return new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size >= 3 ? .65 : .2; }
function progression(scenes: readonly RealizedScene[]): number { if (scenes.length < 2) return 0; const states = scenes.map((scene) => new Set(scene.sourceEventIds)); let changes = 0; for (let i = 1; i < states.length; i += 1) { for (const id of states[i]!) if (!states[i - 1]!.has(id)) { changes += 1; break; } } const textChanges = scenes.slice(1).filter((scene, index) => clean(scene.text) !== clean(scenes[index]!.text)).length; return clamp(changes / Math.max(1, states.length - 1) * .55 + textChanges / Math.max(1, scenes.length - 1) * .25 + (scenes.some((scene) => RELATION_WORDS.test(scene.text)) ? .2 : 0)); }
function landing(scenes: readonly RealizedScene[], proposition: AuthorCreativeProposition): number { const last = scenes.at(-1); if (!last) return 0; const words = tokenList(last.text).length; const compact = words <= 4 ? 1 : words <= 8 ? .8 : words <= 12 ? .5 : .2; const prop = overlap(last.text, proposition.text); return clamp(compact * .45 + prop * .35 + (EXPLANATION.test(last.text) ? 0 : .2)); }
function formDiversity(scenes: readonly RealizedScene[]): number { if (scenes.length < 3) return .55; const lengths = new Set(scenes.map((scene) => tokenList(scene.text).length)).size; const kinds = unique(scenes.map((scene) => scene.kind ?? "line")).length; return clamp(Math.min(1, lengths / 4) * .5 + Math.min(1, kinds / 3) * .5); }
function sourceCopyRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number { const checked = scenes.slice(0, -1); if (!checked.length) return 0; return clamp(checked.reduce((sum, scene) => { const source = sourceEvents(scene, graph); if (!source.length) return sum + 1; return sum + Math.max(...source.map((event) => sequenceMatch(scene.text, eventText(event)))); }, 0) / checked.length); }
function artisticTransformation(scenes: readonly RealizedScene[], graph: RealityGraph): number { return clamp((1 - sourceCopyRisk(scenes, graph)) * .6 + formDiversity(scenes) * .2 + progression(scenes) * .2); }
function inventionRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number { const corpus = tokenSet(eventCorpus(graph)); const checked = scenes.slice(0, -1); if (!checked.length) return 0; const risks = checked.map((scene) => { const unknown = tokenList(scene.text).filter((token) => !STOP.has(token) && !corpus.has(token)); return clamp(unknown.length / Math.max(3, tokenList(scene.text).length)); }); return clamp(risks.reduce((a, b) => a + b, 0) / risks.length); }
function explanationRisk(scenes: readonly RealizedScene[]): number { return clamp(scenes.filter((scene) => EXPLANATION.test(scene.text)).length / Math.max(1, scenes.length)); }
function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number { if (scenes.length < 3) return 0; const oneSource = scenes.filter((scene) => scene.sourceEventIds.length === 1).length / scenes.length; const paraphrase = scenes.slice(0, -1).filter((scene) => { const source = sourceEvents(scene, graph)[0]; return Boolean(source && overlap(scene.text, eventText(source)) >= .58); }).length / Math.max(1, scenes.length); const bridge = scenes.filter((scene) => scene.sourceEventIds.length >= 2).length / scenes.length; const shift = scenes.filter((scene) => RELATION_WORDS.test(scene.text)).length / scenes.length; return clamp(oneSource * .2 + paraphrase * .55 + (1 - bridge) * .1 + (shift < .12 ? .15 : 0)); }
function propositionFidelity(scenes: readonly RealizedScene[], proposition: AuthorCreativeProposition, graph: RealityGraph): number { if (!proposition.text) return 0; const direct = Math.max(...scenes.map((scene) => overlap(scene.text, proposition.text)), 0); const propositionSources = new Set(proposition.sourceEventIds); const used = new Set(scenes.flatMap((scene) => scene.sourceEventIds)); const evidenceUse = propositionSources.size ? [...propositionSources].filter((id) => used.has(id)).length / propositionSources.size : 0; const final = scenes.at(-1); const landingSupport = final ? overlap(final.text, proposition.text) : 0; return clamp(direct * .35 + evidenceUse * .3 + landingSupport * .35); }

export function judgeRealizedSequence(input: { scenes: readonly RealizedScene[]; sequence?: SequenceCandidate; graph: RealityGraph; creativeProposition: AuthorCreativeProposition }): RealizedSequenceJudgment {
  const dimensions = {
    concreteGrounding: concreteGrounding(input.scenes, input.graph), relationBridge: relationBridge(input.scenes, input.graph), progression: progression(input.scenes),
    landing: landing(input.scenes, input.creativeProposition), formDiversity: formDiversity(input.scenes), artisticTransformation: artisticTransformation(input.scenes, input.graph),
    sourceCopyRisk: sourceCopyRisk(input.scenes, input.graph), inventionRisk: inventionRisk(input.scenes, input.graph), explanationRisk: explanationRisk(input.scenes),
    captionReelRisk: captionReelRisk(input.scenes, input.graph), propositionFidelity: propositionFidelity(input.scenes, input.creativeProposition, input.graph),
  };
  const reasons: string[] = [];
  if (input.scenes.length < 2) reasons.push("sequence needs at least two cuts");
  if (input.graph.events.length > 1 && dimensions.concreteGrounding < .3) reasons.push("visible sequence loses contact with supplied reality");
  if (input.graph.events.length > 1 && dimensions.relationBridge < .5) reasons.push("visible sequence does not connect supplied material into a relationship");
  if (dimensions.progression < .35) reasons.push("visible sequence does not move attention");
  if (dimensions.landing < .6) reasons.push("ending does not land the chosen idea");
  if (dimensions.artisticTransformation < .35 || dimensions.sourceCopyRisk >= .6) reasons.push("visible sequence copies source wording instead of transforming it");
  if (dimensions.inventionRisk > .5) reasons.push("visible sequence introduces unsupported concrete material");
  if (dimensions.explanationRisk > 0) reasons.push("visible sequence explains instead of letting the text carry the idea");
  if (dimensions.captionReelRisk >= .65) reasons.push("visible sequence collapses toward a caption reel");
  if (dimensions.propositionFidelity < .45) reasons.push("visible sequence loses the Artist creative proposition");
  const score = clamp(
    dimensions.concreteGrounding * .12 + dimensions.relationBridge * .14 + dimensions.progression * .14 + dimensions.landing * .18 +
    dimensions.formDiversity * .07 + dimensions.artisticTransformation * .12 + dimensions.propositionFidelity * .15 +
    (1 - dimensions.sourceCopyRisk) * .03 + (1 - dimensions.inventionRisk) * .025 + (1 - dimensions.explanationRisk) * .015 + (1 - dimensions.captionReelRisk) * .015,
  );
  return { accepted: reasons.length === 0 && score >= .68, score, reasons, dimensions };
}
