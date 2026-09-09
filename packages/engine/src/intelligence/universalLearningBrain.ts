export type LearningEvidence = {
  id: string;
  source: string;
  timestamp: string;
  confidence: number;
  attributes: Record<string, string>;
};

export type LearningEntity = {
  id: string;
  kind: string;
  name: string;
  brand?: string;
  category?: string;
  attributes: Record<string, string>;
};

export type EntityCandidate = {
  entityId: string;
  score: number;
  reasons: string[];
  confidence: number;
};

export type EntityResolution =
  | { decision: "match"; entityId: string; confidence: number; candidates: EntityCandidate[] }
  | { decision: "new"; confidence: number; candidates: EntityCandidate[] }
  | { decision: "ambiguous"; confidence: number; candidates: EntityCandidate[] };

export type LearningObservation = {
  entityId?: string;
  timestamp: string;
  source: string;
  values: Record<string, number>;
  attributes?: Record<string, string>;
  confidence: number;
  evidenceId?: string;
};

export type Contradiction = {
  field: string;
  values: Array<{ value: string; source: string; timestamp: string; confidence: number }>;
  severity: "low" | "medium" | "high";
  statement: string;
};

export type TemporalLearning = {
  count: number;
  latestAt: string;
  priorAt?: string;
  latestValue: number;
  baseline: number;
  change: number;
  changeRate: number;
  velocity: number;
  acceleration: number;
  volatility: number;
  direction: "up" | "down" | "flat";
  confidence: number;
};

export type LearningSignal = {
  kind:
    | "REPEATED"
    | "TREND"
    | "ACCELERATION"
    | "ANOMALY"
    | "STABLE"
    | "STALE"
    | "CONTRADICTION"
    | "OPPORTUNITY"
    | "RISK";
  score: number;
  confidence: number;
  statement: string;
  evidenceIds: string[];
};

export type LearningRecommendation = {
  priority: "low" | "medium" | "high" | "critical";
  action: string;
  reason: string;
  confidence: number;
  evidenceIds: string[];
};

function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalize(value).split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function stringSimilarity(a: string, b: string): number {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  return jaccard(tokenSet(left), tokenSet(right));
}

export function resolveLearningEntity(
  entity: LearningEntity,
  candidates: LearningEntity[],
): EntityResolution {
  const scored: EntityCandidate[] = candidates.map((candidate) => {
    const reasons: string[] = [];
    const nameScore = stringSimilarity(entity.name, candidate.name);
    const brandScore = entity.brand && candidate.brand ? stringSimilarity(entity.brand, candidate.brand) : 0;
    const categoryScore = entity.category && candidate.category && normalize(entity.category) === normalize(candidate.category) ? 1 : 0;
    let attributeMatches = 0;
    let attributeComparable = 0;

    for (const [key, value] of Object.entries(entity.attributes)) {
      const candidateValue = candidate.attributes[key];
      if (!candidateValue) continue;
      attributeComparable += 1;
      if (stringSimilarity(value, candidateValue) >= 0.82) attributeMatches += 1;
    }

    const attributeScore = attributeComparable ? attributeMatches / attributeComparable : 0;
    const score = clamp(
      nameScore * 0.58 +
      brandScore * 0.16 +
      categoryScore * 0.08 +
      attributeScore * 0.18,
    );

    if (nameScore >= 0.8) reasons.push("strong name similarity");
    if (brandScore >= 0.8) reasons.push("brand agrees");
    if (categoryScore === 1) reasons.push("category agrees");
    if (attributeScore >= 0.7) reasons.push("identifying attributes agree");

    return { entityId: candidate.id, score, confidence: score, reasons };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  if (!best) return { decision: "new", confidence: 0.9, candidates: [] };

  const margin = best.score - (second?.score ?? 0);
  if (best.score >= 0.86 && margin >= 0.12) {
    return { decision: "match", entityId: best.entityId, confidence: best.confidence, candidates: scored.slice(0, 5) };
  }

  if (best.score >= 0.58 || (best.score >= 0.48 && margin < 0.12)) {
    return { decision: "ambiguous", confidence: best.confidence, candidates: scored.slice(0, 5) };
  }

  return { decision: "new", confidence: 1 - best.score, candidates: scored.slice(0, 5) };
}

export function detectLearningContradictions(
  fieldValues: Array<{ field: string; value: string; source: string; timestamp: string; confidence: number }>,
): Contradiction[] {
  const byField = new Map<string, typeof fieldValues>();
  for (const value of fieldValues) {
    const list = byField.get(value.field) ?? [];
    list.push(value);
    byField.set(value.field, list);
  }

  const contradictions: Contradiction[] = [];
  for (const [field, values] of byField) {
    const normalized = new Set(values.map((value) => normalize(value.value)).filter(Boolean));
    if (normalized.size < 2) continue;

    const maxConfidence = Math.max(...values.map((value) => clamp(value.confidence)));
    const severity: Contradiction["severity"] = normalized.size >= 3 || maxConfidence >= 0.9 ? "high" : maxConfidence >= 0.65 ? "medium" : "low";
    contradictions.push({
      field,
      values: values.map(({ value, source, timestamp, confidence }) => ({ value, source, timestamp, confidence })),
      severity,
      statement: `Sources disagree about ${field}.`,
    });
  }
  return contradictions;
}

export function analyzeTemporalLearning(
  observations: LearningObservation[],
  valueKey: string,
): TemporalLearning | null {
  const points = observations
    .map((observation) => ({
      ...observation,
      value: observation.values[valueKey],
      time: Date.parse(observation.timestamp),
    }))
    .filter((point) => Number.isFinite(point.value) && Number.isFinite(point.time))
    .sort((a, b) => a.time - b.time);

  if (!points.length) return null;

  const latest = points.at(-1)!;
  const prior = points.at(-2);
  const baselineValues = points.slice(0, -1).map((point) => point.value);
  const baseline = baselineValues.length
    ? baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length
    : latest.value;
  const change = latest.value - baseline;
  const changeRate = baseline === 0 ? (latest.value === 0 ? 0 : 1) : change / Math.abs(baseline);

  const intervalDays = prior ? Math.max((latest.time - prior.time) / 86_400_000, 0.001) : 1;
  const velocity = prior ? (latest.value - prior.value) / intervalDays : 0;

  let acceleration = 0;
  if (points.length >= 3) {
    const a = points.at(-3)!;
    const b = points.at(-2)!;
    const priorVelocity = (b.value - a.value) / Math.max((b.time - a.time) / 86_400_000, 0.001);
    acceleration = velocity - priorVelocity;
  }

  const mean = points.reduce((sum, point) => sum + point.value, 0) / points.length;
  const variance = points.length > 1
    ? points.reduce((sum, point) => sum + (point.value - mean) ** 2, 0) / points.length
    : 0;
  const volatility = mean === 0 ? Math.sqrt(variance) : Math.sqrt(variance) / Math.abs(mean);
  const threshold = Math.max(Math.abs(mean) * 0.01, 0.000001);
  const direction = velocity > threshold ? "up" : velocity < -threshold ? "down" : "flat";
  const confidence = clamp(
    0.35 + clamp(points.length / 12) * 0.4 + clamp(latest.confidence) * 0.25,
  );

  return {
    count: points.length,
    latestAt: latest.timestamp,
    priorAt: prior?.timestamp,
    latestValue: latest.value,
    baseline,
    change,
    changeRate,
    velocity,
    acceleration,
    volatility,
    direction,
    confidence,
  };
}

export function deriveLearningSignals(
  temporal: TemporalLearning | null,
  evidenceIds: string[],
  contradictions: Contradiction[] = [],
): LearningSignal[] {
  const signals: LearningSignal[] = [];
  const ids = [...new Set(evidenceIds.filter(Boolean))];

  if (temporal) {
    if (temporal.count >= 2) {
      signals.push({ kind: "REPEATED", score: clamp(temporal.count / 8), confidence: temporal.confidence, statement: `The signal has been observed ${temporal.count} times.`, evidenceIds: ids });
    }
    if (temporal.direction !== "flat" && Math.abs(temporal.changeRate) >= 0.1) {
      signals.push({ kind: "TREND", score: clamp(Math.abs(temporal.changeRate)), confidence: temporal.confidence, statement: `The signal is trending ${temporal.direction}.`, evidenceIds: ids });
    }
    if (Math.abs(temporal.acceleration) > Math.max(Math.abs(temporal.velocity) * 0.15, 0.000001)) {
      signals.push({ kind: "ACCELERATION", score: clamp(Math.abs(temporal.acceleration) / (Math.abs(temporal.baseline) + 0.000001)), confidence: temporal.confidence * 0.9, statement: `The trajectory is accelerating ${temporal.acceleration > 0 ? "upward" : "downward"}.`, evidenceIds: ids });
    }
    if (temporal.volatility < 0.05 && temporal.count >= 4) {
      signals.push({ kind: "STABLE", score: clamp(1 - temporal.volatility * 10), confidence: temporal.confidence, statement: "The signal is unusually stable.", evidenceIds: ids });
    }
  }

  for (const contradiction of contradictions) {
    signals.push({
      kind: "CONTRADICTION",
      score: contradiction.severity === "high" ? 1 : contradiction.severity === "medium" ? 0.7 : 0.4,
      confidence: contradiction.values.reduce((sum, item) => sum + item.confidence, 0) / contradiction.values.length,
      statement: contradiction.statement,
      evidenceIds: ids,
    });
  }

  return signals.sort((a, b) => b.score * b.confidence - a.score * a.confidence);
}

export function deriveLearningRecommendations(signals: LearningSignal[], evidenceIds: string[]): LearningRecommendation[] {
  const ids = [...new Set(evidenceIds.filter(Boolean))];
  const recommendations: LearningRecommendation[] = [];

  for (const signal of signals) {
    if (signal.kind === "CONTRADICTION" && signal.confidence >= 0.55) {
      recommendations.push({ priority: signal.score >= 0.9 ? "high" : "medium", action: "Resolve the conflicting evidence before treating this value as authoritative.", reason: signal.statement, confidence: signal.confidence, evidenceIds: [...ids, ...signal.evidenceIds] });
    }
    if (signal.kind === "TREND" && signal.score >= 0.35) {
      recommendations.push({ priority: signal.score >= 0.7 ? "high" : "medium", action: "Review the source of the trend and prepare the next operational action.", reason: signal.statement, confidence: signal.confidence, evidenceIds: [...ids, ...signal.evidenceIds] });
    }
    if (signal.kind === "ACCELERATION" && signal.score >= 0.2) {
      recommendations.push({ priority: signal.score >= 0.5 ? "high" : "medium", action: "Investigate the acceleration before the next observation window.", reason: signal.statement, confidence: signal.confidence, evidenceIds: [...ids, ...signal.evidenceIds] });
    }
  }

  return recommendations;
}
