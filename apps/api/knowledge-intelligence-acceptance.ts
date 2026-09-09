import assert from "node:assert/strict";
import { reconcileCatalogIdentity } from "./src/services/knowledgeReconciliation.js";
import { analyzeKnowledgeTimeSeries, recommendationFromTemporalSignal } from "./src/services/knowledgeTemporalIntelligence.js";

const candidates = [
  {
    id: "vape-a",
    name: "Fogger Strawberry Watermelon",
    normalizedName: "fogger strawberry watermelon",
    brand: "Fogger",
    category: "vape",
    description: "disposable vape",
    attributes: [{ key: "value", value: "20mg", normalizedValue: "20mg" }],
  },
  {
    id: "vape-b",
    name: "Fogger Coffee",
    normalizedName: "fogger coffee",
    brand: "Fogger",
    category: "vape",
    description: "disposable vape",
    attributes: [{ key: "value", value: "20mg", normalizedValue: "20mg" }],
  },
];

const exact = reconcileCatalogIdentity(
  { label: "Fogger Strawberry Watermelon", value: "20mg", category: "vape" },
  candidates,
);
assert.equal(exact.matchId, "vape-a");
assert.equal(exact.ambiguous, false);

const ambiguous = reconcileCatalogIdentity(
  { label: "Fogger", value: "20mg", category: "vape" },
  candidates,
);
assert.equal(ambiguous.matchId, undefined);
assert.equal(ambiguous.ambiguous, true);

const temporal = analyzeKnowledgeTimeSeries([
  { observedAt: "2026-09-01T10:00:00Z", value: { label: "Stock", value: 80 }, confidence: 0.9 },
  { observedAt: "2026-09-02T10:00:00Z", value: { label: "Stock", value: 70 }, confidence: 0.9 },
  { observedAt: "2026-09-03T10:00:00Z", value: { label: "Stock", value: 55 }, confidence: 0.9 },
  { observedAt: "2026-09-04T10:00:00Z", value: { label: "Stock", value: 35 }, confidence: 0.9 },
  { observedAt: "2026-09-05T10:00:00Z", value: { label: "Stock", value: 15 }, confidence: 0.9 },
]);
assert.equal(temporal.numeric.length, 5);
assert.ok(temporal.analysis.forecast);
assert.equal(temporal.analysis.forecast?.direction, "down");
const recommendation = recommendationFromTemporalSignal(temporal.analysis);
assert.ok(recommendation);

console.log("KNOWLEDGE INTELLIGENCE ACCEPTANCE: PASS");
console.log(JSON.stringify({ reconciliation: { exact, ambiguous }, temporal: { analysis: temporal.analysis, recommendation } }, null, 2));
