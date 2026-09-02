/**
 * SATANICO EVIDENCE SEARCH
 *
 * RealityGraph is immutable source evidence. This module searches for compact
 * evidence subsets that can support a human-observable latent inference.
 *
 * The search is intentionally domain-neutral. It does not name the conclusion;
 * it only finds relational structures from which an observer could reasonably
 * construct one.
 */
import type { LatentMovieCandidate, RealityGraph, RealityRelation } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const PREFERENCE = /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/i;
const FIRST = /\b(?:first|initial|began|started|opening|origin|once|one|early)\b/i;
const SUCCESS = /\b(?:best[- ]seller|best seller|popular|success|took off|sold out|hit|biggest|most|grew|growth)\b/i;
const EXCLUDED = new Set(["before", "after", "involves", "belongs_to"]);
const STRUCTURAL = new Set(["repeats", "recontextualizes", "contrasts", "changes", "causes", "converges"]);

type OpportunityKind =
  | "preference_constellation"
  | "invariant"
  | "origin_outcome"
  | "callback"
  | "contrast"
  | "state_transformation"
  | "relational_role"
  | "heterogeneous_convergence";

type Opportunity = {
  kind: OpportunityKind;
  ids: string[];
  anchorIds: string[];
  supportIds: string[];
  score: number;
};

function label(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((item) => item.id === id)?.label);
}
function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}
function structure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}
function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter((relation) =>
      ((relation.from === left && relation.to === right) || (relation.from === right && relation.to === left)) &&
      !EXCLUDED.has(relation.kind),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}
function structural(relation: RealityRelation | undefined): boolean {
  return Boolean(relation && STRUCTURAL.has(relation.kind));
}
function tokens(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3));
}
function shared(left: string, right: string): number {
  const a = tokens(left); const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let count = 0; for (const token of a) if (b.has(token)) count += 1;
  return count / Math.max(1, Math.min(a.size, b.size));
}
function objects(graph: RealityGraph, id: string): string[] { return unique(structure(graph, id)?.objects ?? []).map((value) => value.toLowerCase()); }
function actions(graph: RealityGraph, id: string): string[] { return unique(structure(graph, id)?.actions ?? []).map((value) => value.toLowerCase()); }
function states(graph: RealityGraph, id: string): string[] {
  return unique([...(structure(graph, id)?.states ?? []), clean(graph.events.find((item) => item.id === id)?.emotionalState)]).map((value) => value.toLowerCase());
}
function tags(graph: RealityGraph, id: string): string[] { return unique(structure(graph, id)?.semanticTags ?? []).map((value) => value.toLowerCase()); }
function entityNames(graph: RealityGraph, id: string): string[] { return unique(graph.events.find((item) => item.id === id)?.entities ?? []).map((value) => value.toLowerCase()); }
function structuralTokens(graph: RealityGraph, id: string): string[] { return unique([...objects(graph, id), ...actions(graph, id), ...states(graph, id), ...tags(graph, id)]); }
function span(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1));
}
function relationshipDensity(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 0;
  let links = 0;
  let weight = 0;
  let opportunities = 0;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      opportunities += 1;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (relation && structural(relation)) { links += 1; weight += relation.strength; }
      else weight += shared(label(graph, ids[i]!), label(graph, ids[j]!)) * 0.18;
    }
  }
  return metric((weight / Math.max(1, opportunities)) * 0.7 + (links / Math.max(1, opportunities)) * 0.3);
}
function opportunity(ids: readonly string[], kind: OpportunityKind, score: number, anchorIds: readonly string[] = [], supportIds: readonly string[] = []): Opportunity | undefined {
  if (ids.length < 3) return undefined;
  return { kind, ids: unique(ids), anchorIds: unique(anchorIds), supportIds: unique(supportIds), score: metric(score) };
}
function continuityEntities(graph: RealityGraph): Array<{ name: string; eventIds: string[]; salience: number }> {
  return (graph.entityContinuity ?? [])
    .map((entity) => ({ name: clean(entity.name), eventIds: unique(entity.eventIds).sort((a, b) => position(graph, a) - position(graph, b)), salience: entity.salienceScore }))
    .filter((entity) => entity.name && entity.eventIds.length >= 2)
    .sort((a, b) => b.salience - a.salience || b.eventIds.length - a.eventIds.length)
    .slice(0, 32);
}

function preferenceOpportunities(graph: RealityGraph): Opportunity[] {
  const ids = graph.events.map((item) => item.id).filter((id) => label(graph, id));
  const preferenceIds = ids.filter((id) => PREFERENCE.test(label(graph, id)));
  if (preferenceIds.length < 3) return [];
  const out: Opportunity[] = [];
  for (let i = 0; i < preferenceIds.length; i += 1) {
    for (let j = i + 2; j < preferenceIds.length && j < i + 4; j += 1) {
      const subset = preferenceIds.slice(i, j + 1);
      const targetSignals = new Set(subset.flatMap((id) => [...objects(graph, id), ...tags(graph, id)]));
      const subjectHits = subset.filter((id) => entityNames(graph, id).length > 0).length;
      const score = 0.54 + Math.min(0.2, subset.length * 0.055) + Math.min(0.14, targetSignals.size * 0.035) + (subjectHits ? 0.08 : 0) + span(graph, subset) * 0.04;
      const value = opportunity(subset, "preference_constellation", score, subset.slice(0, 1), subset.slice(1));
      if (value) out.push(value);
    }
  }
  return out;
}

function invariantOpportunities(graph: RealityGraph): Opportunity[] {
  const out: Opportunity[] = [];
  for (const entity of continuityEntities(graph)) {
    if (entity.eventIds.length < 2) continue;
    const first = entity.eventIds[0]!;
    const last = entity.eventIds[entity.eventIds.length - 1]!;
    if (first === last) continue;
    const middle = graph.events
      .map((item) => item.id)
      .filter((id) => !entity.eventIds.includes(id) && position(graph, id) > position(graph, first) && position(graph, id) < position(graph, last))
      .sort((a, b) => ((structure(graph, b)?.transitionScore ?? 0) - (structure(graph, a)?.transitionScore ?? 0)))
      .slice(0, 2);
    if (!middle.length) continue;
    const changed = middle.some((id) => (structure(graph, id)?.transitionScore ?? 0) >= 0.45 || states(graph, id).length > 0 || actions(graph, id).length > 0 || /\b(?:changed|moved|renovated|emptied|painted|boxed|gone|left|arrived|started|finished)\b/i.test(label(graph, id)));
    if (!changed) continue;
    const ids = unique([first, ...middle.slice(0, 1), last]).sort((a, b) => position(graph, a) - position(graph, b));
    const value = opportunity(ids, "invariant", 0.58 + entity.salience * 0.12 + span(graph, ids) * 0.16 + (entity.eventIds.length >= 3 ? 0.12 : 0), [first, last], middle);
    if (value) out.push(value);
  }
  return out;
}

function originOutcomeOpportunities(graph: RealityGraph): Opportunity[] {
  const ids = graph.events.map((item) => item.id);
  const out: Opportunity[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    const first = label(graph, ids[i]!);
    if (!FIRST.test(first)) continue;
    for (let j = i + 1; j < ids.length; j += 1) {
      const later = label(graph, ids[j]!);
      if (!SUCCESS.test(later)) continue;
      const linked = shared(first, later);
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (linked < 0.12 && !(relation && structural(relation))) continue;
      const middle = ids.slice(i, j + 1).filter((id) => id !== ids[i] && id !== ids[j]).slice(0, 2);
      const value = opportunity([ids[i]!, ...middle, ids[j]!], "origin_outcome", 0.62 + span(graph, [ids[i]!, ids[j]!] ) * 0.2 + (relation ? relation.strength * 0.12 : linked * 0.08), [ids[i]!, ids[j]!], middle);
      if (value) out.push(value);
    }
  }
  return out;
}

function callbackOpportunities(graph: RealityGraph): Opportunity[] {
  const out: Opportunity[] = [];
  const ids = graph.events.map((item) => item.id);
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 2; j < ids.length; j += 1) {
      const leftTokens = new Set(structuralTokens(graph, ids[i]!));
      const rightTokens = new Set(structuralTokens(graph, ids[j]!));
      const overlap = [...leftTokens].filter((token) => rightTokens.has(token));
      if (!overlap.length) continue;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      const explicit = /\b(?:same|remember(?:ed|s|ing)?|again|returned|return|still|later|repeated)\b/i.test(label(graph, ids[j]!));
      const value = opportunity([ids[i]!, ids[j - 1]!, ids[j]!], "callback", (relation ? 0.63 + relation.strength * 0.19 : 0.5) + (explicit ? 0.12 : 0) + Math.min(0.08, overlap.length * 0.02) + Math.min(0.06, (j - i - 1) * 0.015), [ids[i]!, ids[j]!], [ids[j - 1]!]);
      if (value) out.push(value);
    }
  }
  return out;
}

function contrastOpportunities(graph: RealityGraph): Opportunity[] {
  const out: Opportunity[] = [];
  for (const relation of graph.relations) {
    if (relation.kind !== "contrasts" && relation.kind !== "recontextualizes" && relation.kind !== "changes") continue;
    const left = position(graph, relation.from); const right = position(graph, relation.to);
    if (left < 0 || right < 0 || left === right) continue;
    const ordered = left < right ? [relation.from, relation.to] : [relation.to, relation.from];
    const between = graph.events.map((item) => item.id).filter((id) => { const p = position(graph, id); return p > Math.min(left, right) && p < Math.max(left, right); }).slice(0, 1);
    const value = opportunity([...ordered.slice(0, 1), ...between, ordered[1]!], "contrast", 0.64 + relation.strength * 0.22 + (relation.kind === "recontextualizes" ? 0.08 : 0), ordered, between);
    if (value) out.push(value);
  }
  return out;
}

function transformationOpportunities(graph: RealityGraph): Opportunity[] {
  const out: Opportunity[] = [];
  const ids = graph.events.map((item) => item.id);
  for (let i = 0; i < ids.length; i += 1) {
    if (!states(graph, ids[i]!).length && !(structure(graph, ids[i])?.transitionScore ?? 0)) continue;
    for (let j = i + 1; j < ids.length; j += 1) {
      if (!states(graph, ids[j]!).length && !(structure(graph, ids[j])?.transitionScore ?? 0)) continue;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      const spanScore = span(graph, [ids[i]!, ids[j]!]);
      const middle = ids.slice(i + 1, j).slice(-1);
      const value = opportunity([ids[i]!, ...middle, ids[j]!], "state_transformation", 0.56 + spanScore * 0.16 + (relation?.kind === "changes" || relation?.kind === "recontextualizes" ? 0.18 + relation.strength * 0.08 : 0), [ids[i]!, ids[j]!], middle);
      if (value) out.push(value);
    }
  }
  return out;
}

function relationalRoleOpportunities(graph: RealityGraph): Opportunity[] {
  const out: Opportunity[] = [];
  for (const entity of continuityEntities(graph)) {
    if (entity.eventIds.length < 3) continue;
    const eventIds = entity.eventIds.slice(0, 6);
    const contexts = new Set<string>();
    const relationKinds = new Set<string>();
    for (const id of eventIds) {
      for (const value of [...objects(graph, id), ...actions(graph, id), ...states(graph, id), ...tags(graph, id)]) contexts.add(value);
      for (const other of eventIds) {
        if (id === other) continue;
        const relation = relationBetween(graph, id, other);
        if (relation && structural(relation)) relationKinds.add(relation.kind);
      }
    }
    if (contexts.size < 2) continue;
    const ids = [eventIds[0]!, eventIds[Math.floor(eventIds.length / 2)]!, eventIds[eventIds.length - 1]!];
    const varied = Math.min(1, contexts.size / 6);
    const relationVariety = Math.min(1, relationKinds.size / 3);
    const value = opportunity(ids, "relational_role", 0.5 + entity.salience * 0.14 + varied * 0.22 + relationVariety * 0.12 + span(graph, ids) * 0.08, [eventIds[0]!, eventIds[eventIds.length - 1]!], eventIds.slice(1, -1));
    if (value) out.push(value);
  }
  return out;
}

function heterogeneousConvergenceOpportunities(graph: RealityGraph): Opportunity[] {
  const ids = graph.events.map((item) => item.id).filter((id) => label(graph, id));
  const out: Opportunity[] = [];
  for (let i = 0; i < ids.length - 2; i += 1) {
    for (let j = i + 1; j < Math.min(ids.length - 1, i + 6); j += 1) {
      for (let k = j + 1; k < Math.min(ids.length, j + 6); k += 1) {
        const triple = [ids[i]!, ids[j]!, ids[k]!];
        const relations = [relationBetween(graph, triple[0]!, triple[1]!), relationBetween(graph, triple[1]!, triple[2]!), relationBetween(graph, triple[0]!, triple[2]!)].filter(Boolean) as RealityRelation[];
        const kinds = new Set(relations.filter(structural).map((relation) => relation.kind));
        const semanticOverlap = new Set(structuralTokens(graph, triple[0]!));
        const overlap12 = structuralTokens(graph, triple[1]!).some((token) => semanticOverlap.has(token));
        const overlap13 = structuralTokens(graph, triple[2]!).some((token) => semanticOverlap.has(token));
        if (relations.length < 2 && !(overlap12 && overlap13)) continue;
        const lexicalSeparation = 1 - ((shared(label(graph, triple[0]!), label(graph, triple[1]!)) + shared(label(graph, triple[0]!), label(graph, triple[2]!))) / 2);
        const value = opportunity(triple, "heterogeneous_convergence", 0.46 + Math.min(0.24, relations.reduce((sum, relation) => sum + relation.strength, 0) * 0.08) + Math.min(0.14, kinds.size * 0.05) + lexicalSeparation * 0.16 + span(graph, triple) * 0.08, triple.slice(0, 2), [triple[2]!]);
        if (value) out.push(value);
      }
    }
  }
  return out;
}

export function discoverSatanicoInferenceOpportunities(graph: RealityGraph, limit = 32): Opportunity[] {
  const all = [
    ...preferenceOpportunities(graph),
    ...invariantOpportunities(graph),
    ...originOutcomeOpportunities(graph),
    ...callbackOpportunities(graph),
    ...contrastOpportunities(graph),
    ...transformationOpportunities(graph),
    ...relationalRoleOpportunities(graph),
    ...heterogeneousConvergenceOpportunities(graph),
  ];
  const seen = new Set<string>();
  return all
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = `${item.kind}:${item.ids.join("|")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.max(1, Math.min(64, limit)));
}

export function searchSatanicoEvidenceSubsets(graph: RealityGraph, limit = 8): string[][] {
  const opportunities = discoverSatanicoInferenceOpportunities(graph, Math.max(12, limit * 5));
  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(12, limit)))
    .map((item) => [...item.ids].sort((a, b) => position(graph, a) - position(graph, b)));
}

export function satanicoSubsetDiagnostics(graph: RealityGraph, subsets: readonly string[][]): Array<{
  ids: string[];
  labels: string[];
  relationshipScore: number;
  span: number;
}> {
  return subsets.map((ids) => ({ ids: [...ids], labels: ids.map((id) => label(graph, id)), relationshipScore: relationshipDensity(graph, ids), span: span(graph, ids) }));
}

export type { Opportunity as SatanicoInferenceOpportunity };
