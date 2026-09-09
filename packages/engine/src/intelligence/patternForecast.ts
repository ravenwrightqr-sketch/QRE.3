/**
 * QRE UNIVERSAL PATTERN FORECASTING
 *
 * Pure intelligence primitives for turning accumulated observations into
 * measurable recurrence, change, anomaly, trajectory, forecast, and action
 * signals. No database, network, model, or execution dependencies.
 *
 * The important boundary is deliberate:
 *
 *   observations -> calculations -> intelligence
 *   intelligence -> runtime decides what to do
 *
 * These primitives are domain-agnostic so the same math can reason about
 * inventory, scans, bookings, customer activity, prices, events, services,
 * learning jobs, or any other measurable signal.
 */

export type PatternObservation = {
  timestamp: string;
  value: number;
};

export type PatternSignalKind =
  | "repeated"
  | "trend"
  | "acceleration"
  | "anomaly"
  | "seasonality"
  | "stale"
  | "stable";

export type PatternSignal = {
  kind: PatternSignalKind;
  score: number;
  confidence: number;
  direction: "up" | "down" | "flat";
  statement: string;
  supportingPoints: number;
};

export type PatternForecast = {
  nextValue: number;
  slope: number;
  direction: "up" | "down" | "flat";
  confidence: number;
  horizonPoints: number;
  range: { low: number; high: number };
};

export type PatternAnalysis = {
  count: number;
  latestValue: number;
  baseline: number;
  change: number;
  changeRate: number;
  volatility: number;
  recurrence: number;
  signals: PatternSignal[];
  forecast: PatternForecast | null;
};

export type ScenarioInput = {
  currentValue: number;
  changeRate: number;
  periods: number;
};

export type ScenarioResult = {
  projectedValue: number;
  absoluteChange: number;
  percentageChange: number;
};

function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], center = mean(values)): number {
  if (values.length < 2) return 0;
  const variance = mean(values.map((value) => (value - center) ** 2));
  return Math.sqrt(variance);
}

function finiteObservations(input: PatternObservation[]): PatternObservation[] {
  return input
    .filter((point) => Number.isFinite(point.value) && !Number.isNaN(Date.parse(point.timestamp)))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function linearSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = index - xMean;
    numerator += dx * (values[index] - yMean);
    denominator += dx * dx;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

function directionFromSlope(slope: number, baseline: number): "up" | "down" | "flat" {
  const threshold = Math.max(Math.abs(baseline) * 0.01, 0.000001);
  if (slope > threshold) return "up";
  if (slope < -threshold) return "down";
  return "flat";
}

/**
 * Calculate a deterministic recurrence score from how often values stay
 * meaningfully active and how many observations exist in the window.
 */
export function calculateRecurrence(observations: PatternObservation[]): number {
  const points = finiteObservations(observations);
  if (points.length < 2) return 0;

  const values = points.map((point) => Math.abs(point.value));
  const active = values.filter((value) => value > 0).length / values.length;
  const density = clamp(points.length / 8);
  return clamp(active * 0.65 + density * 0.35);
}

/**
 * Fit a lightweight linear trajectory and project the next N observations.
 * The range is volatility-aware rather than pretending the point estimate is
 * certain.
 */
export function forecastPattern(
  observations: PatternObservation[],
  horizonPoints = 1,
): PatternForecast | null {
  const points = finiteObservations(observations);
  if (points.length < 2) return null;

  const values = points.map((point) => point.value);
  const baseline = mean(values);
  const slope = linearSlope(values);
  const horizon = Math.max(1, Math.floor(horizonPoints));
  const nextValue = Math.max(0, values[values.length - 1] + slope * horizon);
  const volatility = standardDeviation(values, baseline);
  const fitError = mean(values.map((value, index) => Math.abs(value - (baseline + slope * (index - (values.length - 1) / 2)))));
  const uncertainty = Math.max(volatility, fitError, Math.abs(nextValue) * 0.05);
  const confidence = clamp(
    0.35 + clamp((points.length - 2) / 18) * 0.35 + (volatility === 0 ? 0.2 : clamp(Math.abs(slope) / (volatility + 0.000001)) * 0.1),
  );

  return {
    nextValue,
    slope,
    direction: directionFromSlope(slope, baseline),
    confidence,
    horizonPoints: horizon,
    range: {
      low: Math.max(0, nextValue - uncertainty),
      high: nextValue + uncertainty,
    },
  };
}

/**
 * Detect a simple anomaly using the most recent observation against the prior
 * distribution. This is intentionally conservative and explainable.
 */
export function detectPatternAnomaly(observations: PatternObservation[]): PatternSignal | null {
  const points = finiteObservations(observations);
  if (points.length < 5) return null;

  const values = points.map((point) => point.value);
  const latest = values.at(-1) ?? 0;
  const baseline = mean(values.slice(0, -1));
  const deviation = standardDeviation(values.slice(0, -1), baseline);
  if (deviation === 0) return null;

  const zScore = Math.abs(latest - baseline) / deviation;
  if (zScore < 2) return null;

  const direction = latest > baseline ? "up" : "down";
  return {
    kind: "anomaly",
    score: clamp((zScore - 2) / 3),
    confidence: clamp(0.55 + (zScore - 2) * 0.12),
    direction,
    statement: `Latest observation is ${zScore.toFixed(1)} standard deviations ${direction === "up" ? "above" : "below"} its recent baseline.`,
    supportingPoints: points.length - 1,
  };
}

export function analyzePattern(observations: PatternObservation[]): PatternAnalysis {
  const points = finiteObservations(observations);
  if (!points.length) {
    return {
      count: 0,
      latestValue: 0,
      baseline: 0,
      change: 0,
      changeRate: 0,
      volatility: 0,
      recurrence: 0,
      signals: [],
      forecast: null,
    };
  }

  const values = points.map((point) => point.value);
  const latestValue = values.at(-1) ?? 0;
  const baselineWindow = values.slice(0, Math.max(1, values.length - 1));
  const baseline = mean(baselineWindow);
  const change = latestValue - baseline;
  const changeRate = baseline === 0 ? (latestValue === 0 ? 0 : 1) : change / Math.abs(baseline);
  const volatility = baseline === 0 ? standardDeviation(values) : standardDeviation(values) / Math.abs(baseline);
  const slope = linearSlope(values);
  const direction = directionFromSlope(slope, baseline);
  const recurrence = calculateRecurrence(points);
  const signals: PatternSignal[] = [];

  if (recurrence >= 0.65) {
    signals.push({
      kind: "repeated",
      score: recurrence,
      confidence: clamp(0.5 + recurrence * 0.45),
      direction: "flat",
      statement: `This signal has repeated across ${points.length} observations.`,
      supportingPoints: points.length,
    });
  }

  if (direction !== "flat" && Math.abs(changeRate) >= 0.1) {
    signals.push({
      kind: "trend",
      score: clamp(Math.abs(changeRate)),
      confidence: clamp(0.45 + clamp(points.length / 12) * 0.4),
      direction,
      statement: `The signal is trending ${direction} relative to its recent baseline.`,
      supportingPoints: points.length,
    });
  }

  if (points.length >= 4) {
    const firstSlope = linearSlope(values.slice(0, Math.max(2, Math.floor(values.length / 2))));
    const secondSlope = linearSlope(values.slice(Math.floor(values.length / 2)));
    const acceleration = secondSlope - firstSlope;
    if (Math.abs(acceleration) > Math.max(Math.abs(slope) * 0.15, 0.000001)) {
      signals.push({
        kind: "acceleration",
        score: clamp(Math.abs(acceleration) / (Math.abs(baseline) + 0.000001)),
        confidence: clamp(0.45 + clamp(points.length / 16) * 0.3),
        direction: acceleration > 0 ? "up" : "down",
        statement: `The trajectory is accelerating ${acceleration > 0 ? "upward" : "downward"}.`,
        supportingPoints: points.length,
      });
    }
  }

  if (volatility < 0.05 && points.length >= 4) {
    signals.push({
      kind: "stable",
      score: clamp(1 - volatility * 10),
      confidence: clamp(0.55 + recurrence * 0.3),
      direction: "flat",
      statement: "The signal is unusually stable across the observed window.",
      supportingPoints: points.length,
    });
  }

  const anomaly = detectPatternAnomaly(points);
  if (anomaly) signals.push(anomaly);

  const forecast = forecastPattern(points);
  if (forecast && forecast.confidence >= 0.55 && forecast.direction !== "flat") {
    signals.push({
      kind: "trend",
      score: clamp(Math.abs(forecast.slope) / (Math.abs(baseline) + 0.000001)),
      confidence: forecast.confidence,
      direction: forecast.direction,
      statement: `The current trajectory projects ${forecast.direction} movement in the next observation window.`,
      supportingPoints: points.length,
    });
  }

  return {
    count: points.length,
    latestValue,
    baseline,
    change,
    changeRate,
    volatility,
    recurrence,
    signals: signals.sort((a, b) => b.score * b.confidence - a.score * a.confidence),
    forecast,
  };
}

/**
 * Deterministic scenario calculator. It does not claim to predict reality;
 * it answers "what would happen under this assumed rate of change?".
 */
export function projectScenario(input: ScenarioInput): ScenarioResult {
  const periods = Math.max(0, input.periods);
  const projectedValue = Math.max(0, input.currentValue * (1 + input.changeRate) ** periods);
  const absoluteChange = projectedValue - input.currentValue;
  const percentageChange = input.currentValue === 0 ? 0 : absoluteChange / input.currentValue;

  return {
    projectedValue,
    absoluteChange,
    percentageChange,
  };
}
