import assert from "node:assert/strict";
import {
  analyzeTemporalLearning,
  deriveLearningRecommendations,
  deriveLearningSignals,
  detectLearningContradictions,
  resolveLearningEntity,
} from "@qre/engine";

const resolution = resolveLearningEntity(
  {
    id: "observed",
    kind: "product",
    name: "Fogger Strawberry Watermelon",
    brand: "Fogger",
    category: "vape",
    attributes: { sku: "48391", size: "30ml" },
  },
  [
    {
      id: "catalog",
      kind: "product",
      name: "Fogger Strawberry Watermelon",
      brand: "Fogger",
      category: "vape",
      attributes: { sku: "48391", size: "30 ml" },
    },
  ],
);
assert.equal(resolution.decision, "match");

const contradiction = detectLearningContradictions([
  { field: "stock", value: "27", source: "spreadsheet", timestamp: "2026-09-01T10:00:00Z", confidence: 0.99 },
  { field: "stock", value: "5", source: "photo", timestamp: "2026-09-02T10:00:00Z", confidence: 0.82 },
]);
assert.equal(contradiction.length, 1);

const observations = [1, 2, 3, 4].map((stock, index) => ({
  timestamp: `2026-09-0${index + 1}T10:00:00Z`,
  source: "inventory",
  values: { stock },
  confidence: 0.95,
  evidenceId: `e${index + 1}`,
}));
const temporal = analyzeTemporalLearning(observations, "stock");
assert.ok(temporal);
assert.equal(temporal?.direction, "up");

const signals = deriveLearningSignals(temporal, observations.map((item) => item.evidenceId!), contradiction);
const recommendations = deriveLearningRecommendations(signals, observations.map((item) => item.evidenceId!));
assert.ok(signals.length >= 2);
assert.ok(recommendations.length >= 1);
console.log("API UNIVERSAL LEARNING ACCEPTANCE: PASS");
