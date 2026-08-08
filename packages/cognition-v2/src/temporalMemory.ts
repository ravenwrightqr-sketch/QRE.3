export type CognitiveMemoryPhase =
  | "origin"
  | "active"
  | "transition"
  | "milestone"
  | "legacy"
  | "current";

export type CognitiveMemoryPoint = {
  id: string;

  subjectId: string;

  phase: CognitiveMemoryPhase;

  title: string;

  description?: string;

  occurredAt: string;

  placeId?: string;

  eventId?: string;

  relatedEntityIds: string[];

  evidenceIds: string[];

  significance: number;

  metadata?: Record<string, unknown>;
};

export type CognitiveTemporalMemory = {
  subjectId: string;

  points: CognitiveMemoryPoint[];

  firstObservedAt?: string;

  lastObservedAt?: string;

  currentPhase?: CognitiveMemoryPhase;
};

export function createTemporalMemory(
  subjectId: string,
  points: CognitiveMemoryPoint[] = []
): CognitiveTemporalMemory {
  const ordered = [...points].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() -
      new Date(b.occurredAt).getTime()
  );

  return {
    subjectId,

    points: ordered,

    firstObservedAt:
      ordered[0]?.occurredAt,

    lastObservedAt:
      ordered.at(-1)?.occurredAt,

    currentPhase:
      ordered.at(-1)?.phase
  };
}

export function addMemoryPoint(
  memory: CognitiveTemporalMemory,
  point: CognitiveMemoryPoint
): CognitiveTemporalMemory {
  const points = [
    ...memory.points,
    point
  ].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() -
      new Date(b.occurredAt).getTime()
  );

  return {
    ...memory,

    points,

    firstObservedAt:
      points[0]?.occurredAt,

    lastObservedAt:
      points.at(-1)?.occurredAt,

    currentPhase:
      points.at(-1)?.phase
  };
}

export function getMemoryTimeline(
  memory: CognitiveTemporalMemory
): CognitiveMemoryPoint[] {
  return [...memory.points].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() -
      new Date(b.occurredAt).getTime()
  );
}

export function getMemoryPointsBetween(
  memory: CognitiveTemporalMemory,
  start: string,
  end: string
): CognitiveMemoryPoint[] {
  const startTime =
    new Date(start).getTime();

  const endTime =
    new Date(end).getTime();

  return memory.points.filter(point => {
    const time =
      new Date(point.occurredAt).getTime();

    return (
      time >= startTime &&
      time <= endTime
    );
  });
}

export function getRelatedMemoryPoints(
  memory: CognitiveTemporalMemory,
  entityId: string
): CognitiveMemoryPoint[] {
  return memory.points.filter(point =>
    point.relatedEntityIds.includes(entityId)
  );
}

export function calculateMemorySpan(
  memory: CognitiveTemporalMemory
): number {
  if (
    !memory.firstObservedAt ||
    !memory.lastObservedAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    new Date(
      memory.lastObservedAt
    ).getTime() -
    new Date(
      memory.firstObservedAt
    ).getTime()
  );
}

export function calculateMemoryDensity(
  memory: CognitiveTemporalMemory
): number {
  const span =
    calculateMemorySpan(memory);

  if (span <= 0) {
    return memory.points.length;
  }

  const days =
    span /
    (1000 * 60 * 60 * 24);

  return (
    memory.points.length /
    Math.max(days, 1)
  );
}

export function findMilestones(
  memory: CognitiveTemporalMemory
): CognitiveMemoryPoint[] {
  return memory.points.filter(
    point =>
      point.phase === "milestone" ||
      point.significance >= 0.8
  );
}

export function findFirsts(
  memory: CognitiveTemporalMemory
): CognitiveMemoryPoint[] {
  return memory.points.filter(
    point =>
      point.phase === "origin"
  );
}

export function findTransitions(
  memory: CognitiveTemporalMemory
): CognitiveMemoryPoint[] {
  return memory.points.filter(
    point =>
      point.phase === "transition"
  );
}
