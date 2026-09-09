import { analyzePattern, type PatternObservation } from "@qre/engine";

export type KnowledgeObservationLike = {
  observedAt: Date | string;
  value: unknown;
  confidence?: number | null;
};

export type TemporalKnowledgeResult = {
  numeric: PatternObservation[];
  analysis: ReturnType<typeof analyzePattern>;
};

function extractNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9+\-.eE]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of ["numericValue", "quantity", "amount", "count", "price", "value"]) {
      const candidate = extractNumber(record[key]);
      if (candidate !== null) return candidate;
    }
  }
  return null;
}

export function analyzeKnowledgeTimeSeries(
  observations: KnowledgeObservationLike[],
): TemporalKnowledgeResult {
  const numeric = observations
    .map((observation) => {
      const value = extractNumber(observation.value);
      if (value === null) return null;
      const timestamp = new Date(observation.observedAt).toISOString();
      return { timestamp, value } satisfies PatternObservation;
    })
    .filter((value): value is PatternObservation => Boolean(value));

  return { numeric, analysis: analyzePattern(numeric) };
}

export function recommendationFromTemporalSignal(analysis: ReturnType<typeof analyzePattern>) {
  const strongest = analysis.signals[0];
  if (!strongest || strongest.confidence < 0.65) return null;

  if (strongest.kind === "anomaly") {
    return { type: "INVESTIGATE", priority: strongest.score, reason: strongest.statement };
  }
  if (strongest.kind === "trend" && strongest.direction === "down") {
    return { type: "WATCH_DOWNWARD_TRAJECTORY", priority: strongest.score, reason: strongest.statement, forecast: analysis.forecast };
  }
  if (strongest.kind === "trend" && strongest.direction === "up") {
    return { type: "CAPTURE_OPPORTUNITY", priority: strongest.score, reason: strongest.statement, forecast: analysis.forecast };
  }
  if (strongest.kind === "acceleration") {
    return { type: "MONITOR_ACCELERATION", priority: strongest.score, reason: strongest.statement, forecast: analysis.forecast };
  }
  return null;
}
