import type { AuthorScene, LatentMovieCandidate, RealityGraph } from "@qre/contracts";

type RealizedScene = AuthorScene & { sourceEventIds: string[]; score?: number };

/**
 * Independent judge for the VISIBLE film.
 *
 * Cognition judges the latent Movie. This judge ignores that judgment and asks
 * whether the actual rendered scenes themselves are grounded, progressive,
 * relational, non-explanatory, and worth showing.
 */
export type RealizedFilmJudgment = {
  accepted: boolean;
  score: number;
  reasons: string[];
  dimensions: {
    concreteGrounding: number;
    relationBridge: number;
    progression: number;
    landing: number;
    formDiversity: number;
    inventionRisk: number;
    explanationRisk: number;
    captionReelRisk: number;
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const tokenSet = (text: string): Set<string> => new Set((clean(text).toLowerCase().match(/\b[\w’'-]+\b/g) ?? []).filter((token) => token.length > 2));

function overlap(left: string, right: string): number {
  const a = tokenSet(left); const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function relationExists(graph: RealityGraph, ids: readonly string[]): boolean {
  const set = new Set(ids);
  return graph.relations.some((relation) =>
    (set.has(relation.from) && set.has(relation.to)) ||
    (set.has(relation.to) && set.has(relation.from)),
  );
}

function eventCorpus(graph: RealityGraph): string {
  return graph.events.flatMap((event) => [event.label, ...event.entities, event.place, event.time]).filter(Boolean).join(" ");
}

function sceneGrounding(scene: RealizedScene, graph: RealityGraph): number {
  const source = scene.sourceEventIds
    .map((id: string) => graph.events.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));
  if (!source.length) return 0;
  const sourceText = source.flatMap((event) => [event.label, ...event.entities, event.place, event.time]).filter(Boolean).join(" ");
  return overlap(scene.text, sourceText);
}

function concreteGrounding(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!scenes.length || graph.events.length === 0) return 1;
  const nonFinal = scenes.slice(0, -1);
  if (!nonFinal.length) return 0;
  const scores = nonFinal.map((scene) => sceneGrounding(scene, graph));
  const anchored = scores.filter((score) => score >= 0.18).length;
  return clamp((anchored / nonFinal.length) * 0.75 + (scores.reduce((sum, score) => sum + score, 0) / nonFinal.length) * 0.25);
}

function relationBridge(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (graph.events.length < 2) return 1;
  return scenes.some((scene) => scene.sourceEventIds.length >= 2 && relationExists(graph, scene.sourceEventIds)) ? 1 : 0;
}

function progression(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (scenes.length < 2) return 0;
  const nonFinal = scenes.slice(0, -1);
  const grounded = nonFinal.map((scene) => sceneGrounding(scene, graph));
  const bridgeIndex = scenes.findIndex((scene) => scene.sourceEventIds.length >= 2 && relationExists(graph, scene.sourceEventIds));
  const bridgeBonus = bridgeIndex >= 1 ? 0.35 : 0;
  const distinctSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size;
  const sourceGain = graph.events.length > 1 ? Math.min(1, distinctSources / 2) : 1;
  const anchorQuality = grounded.length ? grounded.reduce((sum, value) => sum + value, 0) / grounded.length : 0;
  return clamp(bridgeBonus + sourceGain * 0.35 + anchorQuality * 0.3);
}

function landing(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const last = scenes.at(-1);
  if (!last || scenes.length < 2) return 0;
  const finalTokens = tokenSet(last.text);
  const factTokens = tokenSet(eventCorpus(graph));
  let shared = 0;
  for (const token of finalTokens) if (factTokens.has(token)) shared += 1;
  const overlapRatio = finalTokens.size ? shared / finalTokens.size : 1;
  const wordCount = (last.text.match(/\b[\w’'-]+\b/g) ?? []).length;
  const compact = wordCount <= 4 ? 1 : wordCount <= 7 ? 0.8 : wordCount <= 11 ? 0.55 : 0.2;
  const nonParaphrase = overlapRatio < 0.85 ? 1 : 0;
  const interpretive = /\b(?:this|means|shows|because|therefore|so that|the meaning|the point)\b/i.test(last.text) ? 0 : 1;
  const multiSource = last.sourceEventIds.length >= 2 && relationExists(graph, last.sourceEventIds) ? 1 : 0;
  return clamp(compact * 0.28 + nonParaphrase * 0.25 + interpretive * 0.15 + multiSource * 0.32);
}

function formDiversity(scenes: readonly RealizedScene[]): number {
  if (scenes.length < 3) return 0.55;
  const lengths = scenes.map((scene) => (scene.text.match(/\b[\w’'-]+\b/g) ?? []).length);
  const uniqueLengths = new Set(lengths).size;
  const kinds = unique(scenes.map((scene) => scene.kind ?? "")).length;
  return clamp(Math.min(1, uniqueLengths / Math.min(4, scenes.length)) * 0.55 + Math.min(1, kinds / 3) * 0.45);
}

function inventionRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  let unsupported = 0;
  let checked = 0;
  for (const [index, scene] of scenes.entries()) {
    if (index === scenes.length - 1) continue;
    checked += 1;
    if (sceneGrounding(scene, graph) < 0.1 && tokenSet(scene.text).size > 1) unsupported += 1;
  }
  return checked ? clamp(unsupported / checked) : 0;
}

function explanationRisk(scenes: readonly RealizedScene[]): number {
  const explanation = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|the relationship|the viewer|the audience|changes what is worth noticing|because this)\b/i;
  return clamp(scenes.filter((scene) => explanation.test(scene.text)).length / Math.max(1, scenes.length));
}

function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (scenes.length < 3) return 0;
  const oneEvent = scenes.filter((scene) => scene.sourceEventIds.length === 1).length / scenes.length;
  const paraphrases = scenes.filter((scene) => scene.sourceEventIds.length === 1 && sceneGrounding(scene, graph) >= 0.58).length / scenes.length;
  const bridge = scenes.filter((scene) => scene.sourceEventIds.length >= 2 && relationExists(graph, scene.sourceEventIds)).length / scenes.length;
  return clamp(oneEvent * 0.28 + paraphrases * 0.52 + (1 - bridge) * 0.2);
}

export function judgeRealizedFilm(input: {
  scenes: readonly RealizedScene[];
  movie: LatentMovieCandidate;
  graph: RealityGraph;
}): RealizedFilmJudgment {
  const scenes = input.scenes;
  const dimensions = {
    concreteGrounding: concreteGrounding(scenes, input.graph),
    relationBridge: relationBridge(scenes, input.graph),
    progression: progression(scenes, input.graph),
    landing: landing(scenes, input.graph),
    formDiversity: formDiversity(scenes),
    inventionRisk: inventionRisk(scenes, input.graph),
    explanationRisk: explanationRisk(scenes),
    captionReelRisk: captionReelRisk(scenes, input.graph),
  };
  const reasons: string[] = [];
  if (scenes.length < 2) reasons.push("film needs at least two cuts to create visible movement");
  if (dimensions.concreteGrounding < 0.5 && input.graph.events.length > 1) reasons.push("middle cuts are not grounded enough in supplied reality");
  if (dimensions.relationBridge < 1 && input.graph.events.length > 1) reasons.push("visible film never bridges the discovered relationship");
  if (dimensions.progression < 0.55 && input.graph.events.length > 1) reasons.push("visible film does not create enough change in attention");
  if (dimensions.landing < 0.65) reasons.push("ending does not earn an interpretive landing");
  if (dimensions.inventionRisk > 0.35) reasons.push("visible film introduces unsupported concrete material");
  if (dimensions.explanationRisk > 0) reasons.push("visible film explains instead of letting the meaning be felt");
  if (dimensions.captionReelRisk >= 0.65) reasons.push("visible film collapses toward a caption reel");

  const score = clamp(
    dimensions.concreteGrounding * 0.18 +
    dimensions.relationBridge * 0.2 +
    dimensions.progression * 0.2 +
    dimensions.landing * 0.24 +
    dimensions.formDiversity * 0.08 +
    (1 - dimensions.inventionRisk) * 0.06 +
    (1 - dimensions.explanationRisk) * 0.02 +
    (1 - dimensions.captionReelRisk) * 0.02,
  );
  return { accepted: reasons.length === 0 && score >= 0.68, score, reasons, dimensions };
}
