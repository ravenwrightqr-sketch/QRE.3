import type { LatentMovieCandidate, RealityGraph, RealityRelation } from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const EXCLUDED = new Set(["before", "after", "involves", "belongs_to"]);
const STRUCTURAL = new Set(["repeats", "recontextualizes", "contrasts", "changes", "causes", "converges"]);

function relationBetween(graph: RealityGraph, left: string, right: string): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        ((relation.from === left && relation.to === right) ||
          (relation.from === right && relation.to === left)) &&
        !EXCLUDED.has(relation.kind),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((item) => item.id === id)?.label);
}

function objects(graph: RealityGraph, id: string): string[] {
  return unique(graph.eventStructure?.find((item) => item.eventId === id)?.objects ?? [])
    .map((value) => value.toLowerCase());
}

function sharedObjects(graph: RealityGraph, left: string, right: string): string[] {
  const a = new Set(objects(graph, left));
  return objects(graph, right).filter((value) => a.has(value));
}

function eventIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function span(graph: RealityGraph, ids: readonly string[]): number {
  const positions = ids.map((id) => position(graph, id)).filter((value) => value >= 0);
  if (positions.length < 2 || graph.events.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, graph.events.length - 1));
}

function relationshipScore(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 0;
  let total = 0;
  let count = 0;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      if (!relation || !STRUCTURAL.has(relation.kind)) continue;
      total += relation.strength;
      count += 1;
    }
  }
  return metric(total / Math.max(1, count));
}

function continuityConstellations(graph: RealityGraph): Array<{ ids: string[]; score: number }> {
  const proposals: Array<{ ids: string[]; score: number }> = [];
  for (const entity of graph.entityContinuity ?? []) {
    const ids = unique(entity.eventIds)
      .filter((id) => Boolean(label(graph, id)))
      .sort((a, b) => position(graph, a) - position(graph, b));
    if (ids.length < 2) continue;

    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const left = ids[i]!;
        const right = ids[j]!;
        const intervening = ids.slice(i + 1, j);
        if (intervening.length < 1) continue;

        const changed = intervening.filter((id) => {
          const structure = graph.eventStructure?.find((item) => item.eventId === id);
          return Boolean(
            structure?.actions.length ||
              structure?.states.length ||
              (structure?.transitionScore ?? 0) >= 0.45,
          );
        }).length;
        const surrounding = intervening.filter((id) => {
          const structure = graph.eventStructure?.find((item) => item.eventId === id);
          return Boolean(structure?.salienceScore && structure.salienceScore >= 0.45);
        }).length;
        if (!changed && !surrounding) continue;

        const direct = relationBetween(graph, left, right);
        const objectLink = sharedObjects(graph, left, right).length ? 0.1 : 0;
        const spread = span(graph, [left, ...intervening, right]);
        const persistence = Math.min(1, entity.mentionCount / 4) * 0.28;
        const score = metric(
          0.42 +
            persistence +
            Math.min(0.18, changed * 0.06) +
            Math.min(0.1, surrounding * 0.04) +
            spread * 0.18 +
            (direct ? direct.strength * 0.12 : 0) +
            objectLink,
        );
        proposals.push({ ids: [left, ...intervening, right], score });
      }
    }
  }
  return proposals;
}

/**
 * Search RealityGraph for compact evidence constellations before Movie Search
 * commits to the ordinary full chronology.
 *
 * This function does not invent facts. It proposes subsets of existing event IDs
 * using both structural relations and entity continuity. Entity continuity is
 * important because a persistent object can carry meaning even when later event
 * wording does not repeat the object's exact lexical token.
 */
export function searchSatanicoEvidenceSubsets(
  graph: RealityGraph,
  limit = 8,
): string[][] {
  const eventIdsList = graph.events.map((item) => item.id).filter((id) => label(graph, id));
  if (eventIdsList.length < 3) return [];

  const seeds = graph.relations
    .filter((relation) => !EXCLUDED.has(relation.kind) && STRUCTURAL.has(relation.kind))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 16);

  const proposals: Array<{ ids: string[]; score: number }> = [];

  for (const continuity of continuityConstellations(graph)) {
    proposals.push(continuity);
  }

  for (const seed of seeds) {
    const base = [seed.from, seed.to];
    const related = eventIdsList
      .filter((id) => !base.includes(id))
      .map((id) => {
        const links = base
          .map((anchor) => relationBetween(graph, anchor, id))
          .filter((relation): relation is RealityRelation => Boolean(relation));
        return {
          id,
          strength: links.length
            ? Math.max(...links.map((relation) => relation.strength))
            : 0,
          objects: sharedObjects(graph, base[0]!, id).length + sharedObjects(graph, base[1]!, id).length,
        };
      })
      .filter((entry) => entry.strength >= 0.55 || entry.objects > 0)
      .sort((a, b) => b.strength - a.strength || b.objects - a.objects)
      .slice(0, 3);

    const ids = unique([...base, ...related.map((entry) => entry.id)]).sort(
      (a, b) => position(graph, a) - position(graph, b),
    );
    if (ids.length < 3) continue;

    const score = metric(
      seed.strength * 0.5 +
        relationshipScore(graph, ids) * 0.3 +
        span(graph, ids) * 0.2,
    );
    proposals.push({ ids, score });
  }

  const seen = new Set<string>();
  return proposals
    .sort((a, b) => b.score - a.score)
    .filter((proposal) => {
      const key = proposal.ids.join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.max(1, Math.min(12, limit)))
    .map((proposal) => proposal.ids);
}

/** Exposed for acceptance diagnostics without exposing internal graph objects. */
export function satanicoSubsetDiagnostics(graph: RealityGraph, subsets: readonly string[][]): Array<{
  ids: string[];
  labels: string[];
  relationshipScore: number;
  span: number;
}> {
  return subsets.map((ids) => ({
    ids: [...ids],
    labels: ids.map((id) => label(graph, id)),
    relationshipScore: relationshipScore(graph, ids),
    span: span(graph, ids),
  }));
}
