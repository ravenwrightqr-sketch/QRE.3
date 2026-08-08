export type CognitiveConnectionKind =
  | "related"
  | "shared_event"
  | "shared_place"
  | "shared_person"
  | "shared_object"
  | "temporal"
  | "causal"
  | "recurring"
  | "discovered";

export type CognitiveGraphNode = {
  id: string;
  kind: string;
  label: string;
  metadata?: Record<string, unknown>;
};

export type CognitiveGraphEdge = {
  id: string;

  from: string;

  to: string;

  kind: CognitiveConnectionKind;

  weight: number;

  firstObservedAt?: string;

  lastObservedAt?: string;

  evidenceIds: string[];

  metadata?: Record<string, unknown>;
};

export type CognitiveConnectionGraph = {
  nodes: CognitiveGraphNode[];

  edges: CognitiveGraphEdge[];
};

export function createConnectionGraph(
  nodes: CognitiveGraphNode[] = [],
  edges: CognitiveGraphEdge[] = []
): CognitiveConnectionGraph {
  return {
    nodes: [...nodes],
    edges: [...edges]
  };
}

export function addGraphNode(
  graph: CognitiveConnectionGraph,
  node: CognitiveGraphNode
): CognitiveConnectionGraph {
  if (
    graph.nodes.some(existing => existing.id === node.id)
  ) {
    return graph;
  }

  return {
    ...graph,

    nodes: [
      ...graph.nodes,
      node
    ]
  };
}

export function addGraphEdge(
  graph: CognitiveConnectionGraph,
  edge: CognitiveGraphEdge
): CognitiveConnectionGraph {
  const existingIndex =
    graph.edges.findIndex(existing =>
      existing.from === edge.from &&
      existing.to === edge.to &&
      existing.kind === edge.kind
    );

  if (existingIndex === -1) {
    return {
      ...graph,

      edges: [
        ...graph.edges,
        edge
      ]
    };
  }

  const existing =
    graph.edges[existingIndex];

  const merged: CognitiveGraphEdge = {
    ...existing,

    weight:
      existing.weight + edge.weight,

    firstObservedAt:
      existing.firstObservedAt ??
      edge.firstObservedAt,

    lastObservedAt:
      edge.lastObservedAt ??
      existing.lastObservedAt,

    evidenceIds: [
      ...new Set([
        ...existing.evidenceIds,
        ...edge.evidenceIds
      ])
    ]
  };

  const edges = [
    ...graph.edges
  ];

  edges[existingIndex] = merged;

  return {
    ...graph,
    edges
  };
}

export function getNode(
  graph: CognitiveConnectionGraph,
  nodeId: string
): CognitiveGraphNode | undefined {
  return graph.nodes.find(
    node => node.id === nodeId
  );
}

export function getConnections(
  graph: CognitiveConnectionGraph,
  nodeId: string
): CognitiveGraphEdge[] {
  return graph.edges.filter(
    edge =>
      edge.from === nodeId ||
      edge.to === nodeId
  );
}

export function getConnectedNodes(
  graph: CognitiveConnectionGraph,
  nodeId: string
): CognitiveGraphNode[] {
  const connections =
    getConnections(graph, nodeId);

  const ids = new Set<string>();

  for (const connection of connections) {
    if (connection.from !== nodeId) {
      ids.add(connection.from);
    }

    if (connection.to !== nodeId) {
      ids.add(connection.to);
    }
  }

  return graph.nodes.filter(
    node => ids.has(node.id)
  );
}

export function getConnectionsByKind(
  graph: CognitiveConnectionGraph,
  nodeId: string,
  kind: CognitiveConnectionKind
): CognitiveGraphEdge[] {
  return getConnections(
    graph,
    nodeId
  ).filter(
    edge => edge.kind === kind
  );
}

export function getStrongConnections(
  graph: CognitiveConnectionGraph,
  nodeId: string,
  threshold = 1
): CognitiveGraphEdge[] {
  return getConnections(
    graph,
    nodeId
  ).filter(
    edge => edge.weight >= threshold
  );
}

export function findSharedConnections(
  graph: CognitiveConnectionGraph,
  firstNodeId: string,
  secondNodeId: string
): CognitiveGraphNode[] {
  const first =
    new Set(
      getConnectedNodes(
        graph,
        firstNodeId
      ).map(node => node.id)
    );

  return getConnectedNodes(
    graph,
    secondNodeId
  ).filter(node =>
    first.has(node.id)
  );
}

export function findPath(
  graph: CognitiveConnectionGraph,
  startNodeId: string,
  targetNodeId: string
): string[] {
  if (startNodeId === targetNodeId) {
    return [startNodeId];
  }

  const queue: string[][] = [
    [startNodeId]
  ];

  const visited = new Set<string>([
    startNodeId
  ]);

  while (queue.length) {
    const path = queue.shift();

    if (!path) {
      continue;
    }

    const current =
      path[path.length - 1];

    for (
      const connection
      of getConnections(graph, current)
    ) {
      const next =
        connection.from === current
          ? connection.to
          : connection.from;

      if (visited.has(next)) {
        continue;
      }

      const nextPath = [
        ...path,
        next
      ];

      if (next === targetNodeId) {
        return nextPath;
      }

      visited.add(next);

      queue.push(nextPath);
    }
  }

  return [];
}
