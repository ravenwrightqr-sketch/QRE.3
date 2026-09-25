/**
 * QRE LATENT MOVIE CONVERGENCE · DETERMINISTIC HELPER
 *
 * One responsibility only: find forward/backward paths through supplied
 * RealityGraph evidence and measure whether they converge on the same signals.
 *
 * This helper never knows about domains, examples, Qwen, or prose.
 * Lexical classes are intentionally absent from endpoint/opening detection.
 * Source position, explicit time, graph structure, and relation strength carry
 * the decision.
 */
import type {
  RealityGraph,
  RealityRelation,
} from "@qre/contracts";

export type LatentMovieConvergence = {
  endpointId: string;
  forwardPath: string[];
  backwardPath: string[];
  sharedIds: string[];
  convergence: number;
  endpointCandidates: string[];
  openingCandidates: string[];
};

export type LatentMovieConvergenceOptions = {
  preferredRelationKinds?: readonly RealityRelation["kind"][];
  maxDepth?: number;
  maxEndpoints?: number;
  maxOpenings?: number;
};

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

const metric = (value: number): number =>
  Number(clamp01(value).toFixed(3));

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function eventById(graph: RealityGraph, id: string) {
  return graph.events.find(
    (event) => event.id === id,
  );
}

function explicitClock(text: string): number | undefined {
  const match = text.match(
    /\b(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
  );

  if (!match) return undefined;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return hour * 60 + minute;
}

function incidentRelations(
  graph: RealityGraph,
  eventId: string,
): RealityRelation[] {
  return graph.relations.filter(
    (relation) =>
      relation.from === eventId ||
      relation.to === eventId,
  );
}

function relationPreference(
  relation: RealityRelation,
  preferredKinds: readonly RealityRelation["kind"][],
): number {
  const index = preferredKinds.indexOf(
    relation.kind,
  );

  if (index >= 0) {
    return clamp01(
      1 - index * 0.12,
    );
  }

  return relation.kind === "before" ||
    relation.kind === "after"
    ? 0.34
    : 0.16;
}

function endpointCandidatesForGraph(
  graph: RealityGraph,
  maxEndpoints: number,
): string[] {
  const explicitTimes = graph.events
    .map((event) => ({
      id: event.id,
      time: explicitClock(event.label),
    }))
    .filter(
      (item): item is {
        id: string;
        time: number;
      } => item.time !== undefined,
    );

  const latestTime = explicitTimes.length
    ? Math.max(
        ...explicitTimes.map(
          (item) => item.time,
        ),
      )
    : undefined;

  return graph.events
    .map((event, index) => {
      const incident = incidentRelations(
        graph,
        event.id,
      );

      const outgoing = incident.filter(
        (relation) =>
          relation.from === event.id,
      );

      const incoming = incident.filter(
        (relation) =>
          relation.to === event.id,
      );

      const positionScore =
        graph.events.length <= 1
          ? 0.8
          : index /
            Math.max(1, graph.events.length - 1);

      const latestTimeScore =
        latestTime !== undefined &&
        explicitClock(event.label) === latestTime
          ? 0.4
          : 0;

      const terminalStructure =
        (outgoing.length === 0 ? 0.22 : 0) +
        Math.min(0.18, incoming.length * 0.04);

      return {
        id: event.id,
        score: metric(
          positionScore * 0.52 +
          latestTimeScore +
          terminalStructure,
        ),
      };
    })
    .sort(
      (a, b) => b.score - a.score,
    )
    .slice(
      0,
      Math.min(
        maxEndpoints,
        graph.events.length,
      ),
    )
    .map((item) => item.id);
}

function openingCandidatesForGraph(
  graph: RealityGraph,
  endpointIds: Set<string>,
  maxOpenings: number,
): string[] {
  const explicitTimes = graph.events
    .map((event) => ({
      id: event.id,
      time: explicitClock(event.label),
    }))
    .filter(
      (item): item is {
        id: string;
        time: number;
      } => item.time !== undefined,
    );

  const earliestTime = explicitTimes.length
    ? Math.min(
        ...explicitTimes.map(
          (item) => item.time,
        ),
      )
    : undefined;

  return graph.events
    .filter(
      (event) =>
        !endpointIds.has(event.id),
    )
    .map((event, index) => {
      const incoming = incidentRelations(
        graph,
        event.id,
      ).filter(
        (relation) =>
          relation.to === event.id,
      );

      const positionScore =
        graph.events.length <= 1
          ? 0.8
          : 1 -
            index /
              Math.max(1, graph.events.length - 1);

      const earliestTimeScore =
        earliestTime !== undefined &&
        explicitClock(event.label) === earliestTime
          ? 0.4
          : 0;

      const incomingPenalty = Math.min(
        0.18,
        incoming.length * 0.04,
      );

      return {
        id: event.id,
        score: metric(
          positionScore * 0.56 +
          earliestTimeScore -
          incomingPenalty,
        ),
      };
    })
    .sort(
      (a, b) => b.score - a.score,
    )
    .slice(
      0,
      Math.min(
        Math.max(1, maxOpenings),
        graph.events.length,
      ),
    )
    .map((item) => item.id);
}

function nextForward(
  graph: RealityGraph,
  currentId: string,
  used: Set<string>,
  preferredKinds: readonly RealityRelation["kind"][],
): Array<{
  id: string;
  relation: RealityRelation;
  score: number;
}> {
  const candidates: Array<{
    id: string;
    relation: RealityRelation;
    score: number;
  }> = [];

  for (const relation of graph.relations) {
    let nextId: string | undefined;

    if (relation.from === currentId) {
      nextId = relation.to;
    } else if (
      relation.to === currentId &&
      [
        "contrasts",
        "converges",
        "recontextualizes",
        "changes",
        "repeats",
        "involves",
      ].includes(relation.kind)
    ) {
      nextId = relation.from;
    }

    if (!nextId || used.has(nextId)) continue;

    candidates.push({
      id: nextId,
      relation,
      score: metric(
        relation.strength * 0.62 +
        relationPreference(
          relation,
          preferredKinds,
        ) * 0.3,
      ),
    });
  }

  return candidates.sort(
    (a, b) => b.score - a.score,
  );
}

function previousBackward(
  graph: RealityGraph,
  currentId: string,
  used: Set<string>,
  preferredKinds: readonly RealityRelation["kind"][],
): Array<{
  id: string;
  relation: RealityRelation;
  score: number;
}> {
  const candidates: Array<{
    id: string;
    relation: RealityRelation;
    score: number;
  }> = [];

  for (const relation of graph.relations) {
    let predecessor: string | undefined;

    if (relation.to === currentId) {
      predecessor = relation.from;
    } else if (
      relation.from === currentId &&
      [
        "contrasts",
        "converges",
        "recontextualizes",
        "changes",
        "repeats",
        "involves",
      ].includes(relation.kind)
    ) {
      predecessor = relation.to;
    }

    if (!predecessor || used.has(predecessor)) {
      continue;
    }

    candidates.push({
      id: predecessor,
      relation,
      score: metric(
        relation.strength * 0.62 +
        relationPreference(
          relation,
          preferredKinds,
        ) * 0.3,
      ),
    });
  }

  return candidates.sort(
    (a, b) => b.score - a.score,
  );
}

function walkForward(
  graph: RealityGraph,
  openingId: string,
  endpointId: string,
  preferredKinds: readonly RealityRelation["kind"][],
  maxDepth: number,
): string[] {
  const path = [openingId];
  const used = new Set(path);

  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (path[path.length - 1] === endpointId) break;

    const next = nextForward(
      graph,
      path[path.length - 1] ?? openingId,
      used,
      preferredKinds,
    )[0];

    if (!next) break;

    used.add(next.id);
    path.push(next.id);
  }

  return path;
}

function walkBackward(
  graph: RealityGraph,
  endpointId: string,
  openingId: string,
  preferredKinds: readonly RealityRelation["kind"][],
  maxDepth: number,
): string[] {
  const path = [endpointId];
  const used = new Set(path);

  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (path[path.length - 1] === openingId) break;

    const next = previousBackward(
      graph,
      path[path.length - 1] ?? endpointId,
      used,
      preferredKinds,
    )[0];

    if (!next) break;

    used.add(next.id);
    path.push(next.id);
  }

  return path.reverse();
}

function scoreConvergence(
  forwardPath: readonly string[],
  backwardPath: readonly string[],
  endpointId: string,
): {
  sharedIds: string[];
  convergence: number;
} {
  const forward = new Set(
    forwardPath,
  );
  const sharedIds = backwardPath.filter(
    (id) => forward.has(id),
  );

  const unionSize =
    new Set([
      ...forwardPath,
      ...backwardPath,
    ]).size;

  const endpointBonus =
    forwardPath.includes(endpointId) &&
    backwardPath.includes(endpointId)
      ? 0.18
      : 0;

  return {
    sharedIds: unique(sharedIds),
    convergence: metric(
      (sharedIds.length /
        Math.max(1, unionSize)) *
        0.82 +
      endpointBonus,
    ),
  };
}

export function findLatentMovieConvergence(
  graph: RealityGraph,
  options: LatentMovieConvergenceOptions = {},
): LatentMovieConvergence {
  if (!graph.events.length) {
    return {
      endpointId: "",
      forwardPath: [],
      backwardPath: [],
      sharedIds: [],
      convergence: 0,
      endpointCandidates: [],
      openingCandidates: [],
    };
  }

  const maxEndpoints = Math.max(
    1,
    Math.min(
      options.maxEndpoints ?? 3,
      graph.events.length,
    ),
  );

  const maxOpenings = Math.max(
    1,
    Math.min(
      options.maxOpenings ?? 4,
      graph.events.length,
    ),
  );

  const maxDepth = Math.max(
    1,
    Math.min(
      options.maxDepth ?? 4,
      Math.max(1, graph.events.length - 1),
    ),
  );

  const preferredKinds = unique(
    options.preferredRelationKinds?.length
      ? [...options.preferredRelationKinds]
      : graph.relations
          .slice()
          .sort(
            (a, b) =>
              b.strength - a.strength,
          )
          .map(
            (relation) =>
              relation.kind,
          ),
  );

  const endpointCandidates =
    endpointCandidatesForGraph(
      graph,
      maxEndpoints,
    );

  const endpointIds = new Set(
    endpointCandidates,
  );

  const openingCandidates =
    openingCandidatesForGraph(
      graph,
      endpointIds,
      maxOpenings,
    );

  const endpointId =
    endpointCandidates[0] ??
    graph.events[graph.events.length - 1]?.id ??
    "";

  let best: LatentMovieConvergence | undefined;

  for (const openingId of openingCandidates) {
    for (const candidateEndpointId of endpointCandidates) {
      const forwardPath = walkForward(
        graph,
        openingId,
        candidateEndpointId,
        preferredKinds,
        maxDepth,
      );

      const backwardPath = walkBackward(
        graph,
        candidateEndpointId,
        openingId,
        preferredKinds,
        maxDepth,
      );

      const scored = scoreConvergence(
        forwardPath,
        backwardPath,
        candidateEndpointId,
      );

      const candidate: LatentMovieConvergence = {
        endpointId: candidateEndpointId,
        forwardPath,
        backwardPath,
        sharedIds: scored.sharedIds,
        convergence: scored.convergence,
        endpointCandidates,
        openingCandidates,
      };

      if (
        !best ||
        candidate.convergence >
          best.convergence
      ) {
        best = candidate;
      }
    }
  }

  return (
    best ?? {
      endpointId,
      forwardPath: [],
      backwardPath: [],
      sharedIds: [],
      convergence: 0,
      endpointCandidates,
      openingCandidates,
    }
  );
}
