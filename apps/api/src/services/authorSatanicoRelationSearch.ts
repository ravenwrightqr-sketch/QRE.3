import type { RealityGraph, RealityRelation } from "@qre/contracts";

/**
 * SATANICO RELATION SEARCH
 *
 * Find unusual, grounded relationships already latent in RealityGraph.
 *
 * This is discovery, not generation:
 * - no new event is created
 * - no concrete fact is added
 * - no chronology is invented
 * - inferred relationships must be supported by multiple existing signals
 *
 * Satanico asks:
 *   "Which real details become stranger or more meaningful when they are seen
 *    together, and can we prove that relationship from the graph?"
 */

export type SatanicoMechanism =
  | "recontextualization"
  | "contrast"
  | "recurrence"
  | "transformation"
  | "convergence"
  | "identity-echo";

export type SatanicoRelationCandidate = {
  eventIds: [string, string];
  mechanism: SatanicoMechanism;
  score: number;
  evidence: string[];
  reason: string;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3),
  );

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

function event(graph: RealityGraph, id: string) {
  return graph.events.find((item) => item.id === id);
}

function structure(graph: RealityGraph, id: string) {
  return graph.eventStructure?.find((item) => item.eventId === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(event(graph, id)?.label);
}

function tokens(text: string): Set<string> {
  return new Set(
    clean(text)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4),
  );
}

function overlap(left: readonly string[], right: readonly string[]): number {
  const a = new Set(left.map((value) => clean(value).toLowerCase()).filter(Boolean));
  const b = new Set(right.map((value) => clean(value).toLowerCase()).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function textOverlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function relationBetween(
  graph: RealityGraph,
  left: string,
  right: string,
): RealityRelation | undefined {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === left && relation.to === right) ||
        (relation.from === right && relation.to === left),
    )
    .sort((a, b) => b.strength - a.strength)[0];
}

function position(graph: RealityGraph, id: string): number {
  return graph.events.findIndex((item) => item.id === id);
}

function subjectMention(text: string, subject?: string): boolean {
  const target = clean(subject).toLowerCase();
  return Boolean(target) && clean(text).toLowerCase().includes(target);
}

function mechanismFor(
  relation: RealityRelation | undefined,
  sharedObjects: number,
  sharedSubjects: number,
  stateContrast: number,
  recurrence: number,
  transition: number,
  anomaly: number,
  textSimilarity: number,
): SatanicoMechanism | undefined {
  switch (relation?.kind) {
    case "recontextualizes":
      return "recontextualization";
    case "contrasts":
      return "contrast";
    case "repeats":
      return "recurrence";
    case "changes":
      return "transformation";
    case "converges":
      return "convergence";
  }

  if (recurrence >= 0.72) return "recurrence";
  if (transition >= 0.72 && stateContrast >= 0.42) return "transformation";
  if (stateContrast >= 0.65) return "contrast";
  if (anomaly >= 0.72 && (sharedObjects > 0 || sharedSubjects > 0)) return "recontextualization";
  if (sharedSubjects >= 1 && sharedObjects >= 1 && textSimilarity < 0.45) return "identity-echo";
  if (sharedObjects >= 1 && transition >= 0.55) return "convergence";
  return undefined;
}

function stateContrast(graph: RealityGraph, left: string, right: string): number {
  const a = structure(graph, left)?.states ?? [];
  const b = structure(graph, right)?.states ?? [];
  if (!a.length || !b.length) return 0;
  const same = overlap(a, b);
  return metric(1 - same);
}

export function searchSatanicoRelations(input: {
  graph: RealityGraph;
  subject?: string;
  limit?: number;
}): SatanicoRelationCandidate[] {
  const events = input.graph.events.filter((item) => clean(item.label));
  const limit = Math.max(3, Math.min(12, input.limit ?? 8));
  const candidates: SatanicoRelationCandidate[] = [];

  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const left = events[i]!;
      const right = events[j]!;
      const leftStructure = structure(input.graph, left.id);
      const rightStructure = structure(input.graph, right.id);
      const relation = relationBetween(input.graph, left.id, right.id);

      const sharedSubjects = overlap(
        leftStructure?.subjects ?? left.entities ?? [],
        rightStructure?.subjects ?? right.entities ?? [],
      );
      const sharedObjects = overlap(
        leftStructure?.objects ?? [],
        rightStructure?.objects ?? [],
      );
      const sharedActions = overlap(
        leftStructure?.actions ?? [],
        rightStructure?.actions ?? [],
      );
      const sharedTags = overlap(
        leftStructure?.semanticTags ?? [],
        rightStructure?.semanticTags ?? [],
      );
      const stateShift = stateContrast(input.graph, left.id, right.id);
      const recurrence = Math.max(
        leftStructure?.recurrenceScore ?? 0,
        rightStructure?.recurrenceScore ?? 0,
      );
      const transition = Math.max(
        leftStructure?.transitionScore ?? 0,
        rightStructure?.transitionScore ?? 0,
      );
      const anomaly = Math.max(
        leftStructure?.anomalyScore ?? 0,
        rightStructure?.anomalyScore ?? 0,
      );
      const salience = Math.max(
        leftStructure?.salienceScore ?? 0,
        rightStructure?.salienceScore ?? 0,
        left.salient ? 1 : 0,
        right.salient ? 1 : 0,
      );
      const lexical = textOverlap(left.label, right.label);
      const gap = Math.abs(position(input.graph, left.id) - position(input.graph, right.id));
      const normalizedGap = events.length > 1
        ? gap / Math.max(1, events.length - 1)
        : 0;

      const explicitStrength = relation?.strength ?? 0;
      const explicitBonus = explicitStrength * 0.44;
      const structuralSupport = Math.min(
        1,
        sharedSubjects * 0.28 +
          sharedObjects * 0.22 +
          sharedActions * 0.12 +
          sharedTags * 0.14 +
          stateShift * 0.18 +
          recurrence * 0.14 +
          transition * 0.14,
      );
      const oddness = metric(
        (1 - lexical) * 0.34 +
          normalizedGap * 0.14 +
          anomaly * 0.18 +
          salience * 0.16 +
          stateShift * 0.18,
      );

      const mechanism = mechanismFor(
        relation,
        sharedObjects,
        sharedSubjects,
        stateShift,
        recurrence,
        transition,
        anomaly,
        lexical,
      );

      if (!mechanism) continue;

      const subjectAnchor = input.subject
        ? Number(subjectMention(left.label, input.subject) || subjectMention(right.label, input.subject))
        : 1;

      const supportCount = [
        sharedSubjects > 0.49,
        sharedObjects > 0.49,
        sharedActions > 0.49,
        sharedTags > 0.49,
        stateShift >= 0.49,
        recurrence >= 0.65,
        transition >= 0.65,
        Boolean(relation),
      ].filter(Boolean).length;

      // Satanico refuses a clever-looking pair when the graph supplies only one
      // weak signal. Two independent structural signals are the minimum for an
      // inferred relationship; an explicit strong relation may stand alone.
      if (!relation && supportCount < 2) continue;
      if (input.subject && subjectAnchor === 0) continue;

      const evidence = unique([
        relation ? `explicit:${relation.kind}` : "",
        sharedSubjects > 0.49 ? "shared-subject" : "",
        sharedObjects > 0.49 ? "shared-object" : "",
        sharedActions > 0.49 ? "shared-action" : "",
        sharedTags > 0.49 ? "shared-semantic-tag" : "",
        stateShift >= 0.49 ? "state-shift" : "",
        recurrence >= 0.65 ? "recurrence-signal" : "",
        transition >= 0.65 ? "transition-signal" : "",
        anomaly >= 0.65 ? "anomaly-signal" : "",
      ].filter(Boolean));

      const score = metric(
        explicitBonus * 0.44 +
          structuralSupport * 0.24 +
          oddness * 0.2 +
          subjectAnchor * 0.08 +
          (supportCount >= 3 ? 0.04 : 0) -
          lexical * 0.06,
      );

      const reason =
        `The supplied details "${left.label}" and "${right.label}" acquire a ${mechanism} reading supported by ${evidence.join(", ")}.`;

      candidates.push({
        eventIds: [left.id, right.id],
        mechanism,
        score,
        evidence,
        reason,
      });
    }
  }

  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => {
      const key = [
        ...candidate.eventIds,
        candidate.mechanism,
      ].sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
