import assert from "node:assert/strict";
import {
  analyzeTemporalLearning,
  deriveLearningRecommendations,
  deriveLearningSignals,
  detectLearningContradictions,
  resolveLearningEntity,
} from "./universalLearningBrain.js";

const evidence = [
  { id: "photo-1", source: "photo", timestamp: "2026-09-01T10:00:00Z", confidence: 0.9, attributes: { sku: "48391" } },
  { id: "sheet-1", source: "spreadsheet", timestamp: "2026-09-02T10:00:00Z", confidence: 0.99, attributes: { sku: "48391" } },
];

assert.equal(evidence.length, 2);

const match = resolveLearningEntity(
  {
    id: "observed-1",
    kind: "product",
    name: "Fogger Strawberry Watermelon",
    brand: "Fogger",
    category: "vape",
    attributes: { sku: "48391", size: "30ml" },
  },
  [
    {
      id: "catalog-1",
      kind: "product",
      name: "Fogger Strawberry Watermelon",
      brand: "Fogger",
      category: "vape",
      attributes: { sku: "48391", size: "30 ml" },
    },
  ],
);
assert.equal(match.decision, "match");
assert.equal(match.entityId, "catalog-1");

const ambiguous = resolveLearningEntity(
  { id: "observed-2", kind: "product", name: "Strawberry", attributes: {} },
  [
    { id: "a", kind: "product", name: "Strawberry Watermelon", attributes: {} },
    { id: "b", kind: "product", name: "Strawberry Kiwi", attributes: {} },
  ],
);
assert.equal(ambiguous.decision, "ambiguous");

const contradictions = detectLearningContradictions([
  { field: "stock", value: "27", source: "sheet", timestamp: "2026-09-01T10:00:00Z", confidence: 0.99 },
  { field: "stock", value: "5", source: "photo", timestamp: "2026-09-02T10:00:00Z", confidence: 0.82 },
]);
assert.equal(contradictions.length, 1);
assert.equal(contradictions[0].field, "stock");

const observations = [
  { timestamp: "2026-08-01T10:00:00Z", source: "inventory", values: { stock: 40 }, confidence: 0.95, evidenceId: "e1" },
  { timestamp: "2026-08-08T10:00:00Z", source: "inventory", values: { stock: 31 }, confidence: 0.95, evidenceId: "e2" },
  { timestamp: "2026-08-15T10:00:00Z", source: "inventory", values: { stock: 20 }, confidence: 0.95, evidenceId: "e3" },
  { timestamp: "2026-08-22T10:00:00Z", source: "inventory", values: { stock: 8 }, confidence: 0.95, evidenceId: "e4" },
];
const temporal = analyzeTemporalLearning(observations, "stock");
assert.ok(temporal);
assert.equal(temporal?.direction, "down");
assert.ok((temporal?.velocity ?? 0) < 0);

const signals = deriveLearningSignals(temporal, observations.map((item) => item.evidenceId!), contradictions);
assert.ok(signals.some((signal) => signal.kind === "TREND"));
assert.ok(signals.some((signal) => signal.kind === "CONTRADICTION"));

const recommendations = deriveLearningRecommendations(signals, observations.map((item) => item.evidenceId!));
assert.ok(recommendations.length >= 2);
assert.ok(recommendations.every((recommendation) => recommendation.confidence >= 0 && recommendation.confidence <= 1));

console.log("UNIVERSAL LEARNING BRAIN ACCEPTANCE: PASS");
