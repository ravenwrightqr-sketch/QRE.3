import type { RealityEvent, RealityGraph, LatentMovieCandidate } from "@qre/contracts";

type RealizedScene = import("@qre/contracts").AuthorScene & { sourceEventIds: string[]; score?: number };

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
    artisticTransformation: number;
    sourceCopyRisk: number;
    inventionRisk: number;
    explanationRisk: number;
    captionReelRisk: number;
  };
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const tokens = (text: string): string[] => clean(text).toLowerCase().match(/[a-z0-9’'-]+/g) ?? [];
const tokenSet = (text: string): Set<string> => new Set(tokens(text));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const STOP = new Set(["the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "as", "is", "are", "was", "were", "be", "been", "being", "this", "that", "it", "its"]);
const UNSUPPORTED_PAST_ACTION = /\b(?:walked|ran|went|took|arrived|left|ate|drank|chased|cleaned|finished|started|opened|closed|drove|met|talked|spoke|said|bought|sold|built|fixed|painted|wore|stayed|called|laughed|cried|looked|became|changed|returned|rescued|adopted|watched|heard|danced)\b/i;
const EXPLANATION = /\b(?:this means|which means|this shows|which shows|the point is|the meaning is|in other words|the viewer|the audience|the relationship between|what this means)\b/i;

function sourceEvents(scenes: readonly RealizedScene[], graph: RealityGraph): RealityEvent[] {
  return unique(scenes.flatMap((scene) => scene.sourceEventIds)).map((id) => graph.events.find((event) => event.id === id)).filter((event): event is RealityEvent => Boolean(event));
}

function role(event: RealityEvent, graph: RealityGraph): string {
  if (event.semanticRole) return event.semanticRole;
  const tags = graph.eventStructure?.find((item) => item.eventId === event.id)?.semanticTags ?? [];
  return tags.find((tag) => tag.startsWith("role:"))?.slice(5) ?? "general-fact";
}

function authorized(event: RealityEvent, graph: RealityGraph): boolean {
  if (event.eventAuthorized !== undefined) return event.eventAuthorized;
  return role(event, graph) === "observed-event" || event.provenance === "memory";
}

function overlap(left: string, right: string): number {
  const a = tokenSet(left); const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function concreteGrounding(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!scenes.length || !graph.events.length) return 0;
  const scores = scenes.map((scene) => {
    const sources = sourceEvents([scene], graph);
    if (!sources.length) return 0;
    return Math.max(...sources.map((event) => Math.max(0.35, overlap(scene.text, [event.label, ...event.entities, event.place, event.time].filter(Boolean).join(" ")))));
  });
  return clamp(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function relationBridge(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  const hasExplicit = scenes.some((scene) => {
    const ids = new Set(scene.sourceEventIds);
    return scene.sourceEventIds.length >= 2 && graph.relations.some((relation) => ids.has(relation.from) && ids.has(relation.to));
  });
  if (hasExplicit) return 1;

  const source = sourceEvents(scenes, graph);
  const allDescriptive = source.length > 0 && source.every((event) => !authorized(event, graph));
  const distinctSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size;
  if (allDescriptive && distinctSources >= 2) return 0.82;
  if (distinctSources >= 2) return 0.55;
  return scenes.length <= 1 ? 0.7 : 0;
}

function progression(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (scenes.length <= 1) return 1;
  const distinctSources = new Set(scenes.flatMap((scene) => scene.sourceEventIds)).size;
  const multiSourceCuts = scenes.filter((scene) => scene.sourceEventIds.length >= 2).length;
  const roles = new Set(sourceEvents(scenes, graph).map((event) => role(event, graph)));
  const roleMovement = Math.min(1, roles.size / 3);
  return clamp(
    Math.min(1, distinctSources / 4) * 0.55 +
    Math.min(1, multiSourceCuts / 2) * 0.25 +
    roleMovement * 0.2,
  );
}

function landing(scenes: readonly RealizedScene[]): number {
  const last = scenes.at(-1);
  if (!last) return 0;
  if (EXPLANATION.test(last.text)) return 0;
  const count = tokens(last.text).length;
  return count <= 4 ? 1 : count <= 8 ? 0.85 : count <= 14 ? 0.65 : 0.35;
}

function formDiversity(scenes: readonly RealizedScene[]): number {
  if (scenes.length <= 1) return 0.8;
  const lengths = new Set(scenes.map((scene) => tokens(scene.text).length)).size;
  const kinds = unique(scenes.map((scene) => scene.kind ?? "line")).length;
  return clamp(Math.min(1, lengths / Math.min(4, scenes.length)) * 0.5 + Math.min(1, kinds / 3) * 0.5);
}

function sourceCopyRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!scenes.length) return 1;
  const risks = scenes.map((scene) => {
    const source = sourceEvents([scene], graph);
    if (!source.length) return 1;
    return Math.max(...source.map((event) => overlap(scene.text, event.label)) >= 0.85 ? overlap(scene.text, event.label) : 0);
  });
  return clamp(risks.reduce((sum, value) => sum + value, 0) / risks.length);
}

function artisticTransformation(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!scenes.length) return 0;
  const copy = sourceCopyRisk(scenes, graph);
  const transformed = scenes.filter((scene) => {
    const source = sourceEvents([scene], graph);
    return source.length > 0 && overlap(scene.text, source[0]!.label) < 0.75;
  }).length / scenes.length;
  return clamp((1 - copy) * 0.65 + transformed * 0.35);
}

function inventionRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (!scenes.length) return 1;
  const risks = scenes.map((scene) => {
    const source = sourceEvents([scene], graph);
    if (!source.length) return 1;
    const descriptiveOnly = source.every((event) => !authorized(event, graph));
    if (descriptiveOnly && UNSUPPORTED_PAST_ACTION.test(scene.text)) return 0.95;
    const sourceWords = new Set(source.flatMap((event) => tokens(event.label)));
    const concreteUnknowns = tokens(scene.text).filter((token) => !STOP.has(token) && !sourceWords.has(token));
    return concreteUnknowns.length >= 4 ? 0.5 : concreteUnknowns.length >= 2 ? 0.2 : 0;
  });
  return clamp(risks.reduce((sum, value) => sum + value, 0) / risks.length);
}

function explanationRisk(scenes: readonly RealizedScene[]): number {
  return clamp(scenes.filter((scene) => EXPLANATION.test(scene.text)).length / Math.max(1, scenes.length));
}

function captionReelRisk(scenes: readonly RealizedScene[], graph: RealityGraph): number {
  if (scenes.length <= 1) return 0;
  let risk = 0;
  for (const scene of scenes) {
    const source = sourceEvents([scene], graph);
    if (!source.length) { risk += 1; continue; }
    const copy = Math.max(...source.map((event) => overlap(scene.text, event.label)));
    if (scene.sourceEventIds.length === 1 && copy >= 0.65) risk += 1;
  }
  return clamp(risk / scenes.length);
}

export function judgeRealizedFilm(input: { scenes: readonly RealizedScene[]; movie: LatentMovieCandidate; graph: RealityGraph }): RealizedFilmJudgment {
  const dimensions = {
    concreteGrounding: concreteGrounding(input.scenes, input.graph),
    relationBridge: relationBridge(input.scenes, input.graph),
    progression: progression(input.scenes, input.graph),
    landing: landing(input.scenes),
    formDiversity: formDiversity(input.scenes),
    artisticTransformation: artisticTransformation(input.scenes, input.graph),
    sourceCopyRisk: sourceCopyRisk(input.scenes, input.graph),
    inventionRisk: inventionRisk(input.scenes, input.graph),
    explanationRisk: explanationRisk(input.scenes),
    captionReelRisk: captionReelRisk(input.scenes, input.graph),
  };

  const descriptiveOnly = sourceEvents(input.scenes, input.graph).length > 0 && sourceEvents(input.scenes, input.graph).every((event) => !authorized(event, input.graph));
  const reasons: string[] = [];
  if (!input.scenes.length) reasons.push("film has no cuts");
  if (input.scenes.length > 1 && dimensions.relationBridge < 0.45) reasons.push("visible film never connects supplied reality");
  if (input.scenes.length > 1 && dimensions.progression < 0.25) reasons.push("visible film does not move attention");
  if (dimensions.inventionRisk > 0.5) reasons.push("visible film introduces unsupported concrete material");
  if (dimensions.explanationRisk > 0) reasons.push("visible film explains instead of letting the art speak");
  if (dimensions.landing < 0.45) reasons.push("ending does not earn a landing");
  if (!descriptiveOnly && input.scenes.length > 1 && dimensions.concreteGrounding < 0.18) reasons.push("visible film loses contact with supplied reality");

  const score = clamp(
    dimensions.concreteGrounding * 0.18 +
    dimensions.relationBridge * 0.16 +
    dimensions.progression * 0.12 +
    dimensions.landing * 0.2 +
    dimensions.formDiversity * 0.08 +
    dimensions.artisticTransformation * 0.14 +
    (1 - dimensions.sourceCopyRisk) * 0.04 +
    (1 - dimensions.inventionRisk) * 0.05 +
    (1 - dimensions.explanationRisk) * 0.01 +
    (1 - dimensions.captionReelRisk) * 0.02,
  );

  return { accepted: reasons.length === 0 && score >= 0.58, score, reasons, dimensions };
}
