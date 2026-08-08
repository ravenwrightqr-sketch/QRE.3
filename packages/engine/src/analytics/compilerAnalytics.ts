/**
 * Compiler-safe analytics context.
 *
 * Runtime/database analytics stay outside the compiler. Callers may normalize
 * historical scan information and pass the resulting context into authoring.
 * The compiler consumes patterns, not repositories or persistence models.
 */

export type CompilerAnalyticsEvent = {
  type: string;
  timestamp?: string;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type CompilerAnalyticsContext = {
  scanCount: number;
  uniqueSessionCount: number;
  eventCounts: Record<string, number>;
  recentEvents: CompilerAnalyticsEvent[];
};

export function createCompilerAnalyticsContext(
  events: readonly CompilerAnalyticsEvent[] = [],
): CompilerAnalyticsContext {
  const eventCounts: Record<string, number> = {};
  const sessions = new Set<string>();

  for (const event of events) {
    eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
    if (event.sessionId) sessions.add(event.sessionId);
  }

  return {
    scanCount: events.length,
    uniqueSessionCount: sessions.size,
    eventCounts,
    recentEvents: [...events].slice(-50),
  };
}

export function mergeCompilerAnalytics(
  current: CompilerAnalyticsContext,
  incoming: CompilerAnalyticsContext,
): CompilerAnalyticsContext {
  const eventCounts: Record<string, number> = { ...current.eventCounts };

  for (const [type, count] of Object.entries(incoming.eventCounts)) {
    eventCounts[type] = (eventCounts[type] ?? 0) + count;
  }

  const recentEvents = [
    ...current.recentEvents,
    ...incoming.recentEvents,
  ].slice(-50);

  const sessions = new Set(
    recentEvents
      .map(event => event.sessionId)
      .filter((value): value is string => Boolean(value)),
  );

  return {
    scanCount: current.scanCount + incoming.scanCount,
    uniqueSessionCount: Math.max(
      current.uniqueSessionCount,
      incoming.uniqueSessionCount,
      sessions.size,
    ),
    eventCounts,
    recentEvents,
  };
}
