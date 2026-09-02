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

function continuityEntities(graph: RealityGraph): Array<{ name: string; eventIds: string[]; salience: number }> {
  return (graph.entityContinuity ?? [])
    .map((entity) => ({
      name: clean(entity.name),
      eventIds: unique(entity.eventIds),
      salience: entity.salienceScore,
    }))
    .filter((entity) => entity.name && entity.eventIds.length >= 2)
    .sort((a, b) =>
      b.salience - a.salience ||
      b.eventIds.length - a.eventIds.length,
    )
    .slice(0, 24);
}

function changeLike(graph: RealityGraph, id: string): boolean {
  const structure = graph.eventStructure?.find((item) => item.eventId === id);
  const text = label(graph, id);
  return Boolean(
    structure?.actions.length ||
    structure?.states.length ||
    (structure?.transitionScore ?? 0) >= 0.45 ||
    /\b(?:changed|change|moved|move|renovated|renovate|emptied|empty|painted|paint|boxed|boxes|gone|left|arrived|returned|return|started|finished|ended)\b/i.test(text),
  );
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

/**
 * The strongest persistence primitive is not repeated wording; it is an entity
 * that occupies multiple supplied events while the surrounding reality changes.
 * This is how Satanico can discover the "everything changed, but the table stayed"
 * movie without inventing a meaning for the table.
 */
function persistenceProposals(
  graph: RealityGraph,
): Array<{ ids: string[]; score: number }> {
  const proposals: Array<{ ids: string[]; score: number }> = [];
  for (const entity of continuityEntities(graph)) {
    const orderedEntityIds = [...entity.eventIds].sort(
      (a, b) => position(graph, a) - position(graph, b),
    );
    const first = orderedEntityIds[0];
    const last = orderedEntityIds[orderedEntityIds.length - 1];
    if (!first || !last || first === last) continue;

    const firstPos = position(graph, first);
    const lastPos = position(graph, last);
    if (firstPos < 0 || lastPos <= firstPos) continue;

    const middle = graph.events
      .map((item) => item.id)
      .filter((id) => {
        const pos = position(graph, id);
        return pos > firstPos && pos < lastPos && !orderedEntityIds.includes(id);
      })
      .map((id) => ({
        id,
        score:
          (changeLike(graph, id) ? 0.72 : 0.32) +
          (graph.eventStructure?.find((item) => item.eventId === id)?.salienceScore ?? 0) * 0.28,
      }))
      .sort((a, b) => b.score - a.score || position(graph, a.id) - position(graph, b.id));

    const bridge = middle[0]?.id;
    if (!bridge) continue;

    const ids = [first, bridge, last].sort(
      (a, b) => position(graph, a) - position(graph, b),
    );
    const bridgeIsChange = changeLike(graph, bridge);
    const score = metric(
      0.64 +
        entity.salience * 0.16 +
        span(graph, ids) * 0.1 +
        (bridgeIsChange ? 0.1 : 0),
    );
    proposals.push({ ids, score });
  }
  return proposals;
}

/**
 * Search RealityGraph for compact evidence constellations before Movie Search
 * commits to the ordinary full chronology.
 *
 * This function does not invent facts. It only proposes subsets of existing
 * event IDs joined by graph relationships or entity continuity. The canonical
 * movie search remains responsible for turning those IDs into an ordinary
 * LatentMovieCandidate.
 */
export function searchSatanicoEvidenceSubsets(
  graph: RealityGraph,
  limit = 8,
): string[][] {
  const eventIdsList = graph.events.map((item) => item.id).filter((id) => label(graph, id));
  if (eventIdsList.length < 3) return [];

  const proposals: Array<{ ids: string[]; score: number }> = persistenceProposals(graph);

  const seeds = graph.relations
    .filter((relation) => !EXCLUDED.has(relation.kind) && STRUCTURAL.has(relation.kind))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 16);

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
