import assert from "node:assert/strict";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { evaluateLatentMovie } from "./src/services/authorSemanticGate.js";

const facts = [
  "Maria cleaned the kitchen",
  "Maria cleaned bathroom one",
  "Maria cleaned bathroom two",
  "Maria finished at 11:47 AM",
];

const graph = buildAuthorRealityGraph({
  prompt: facts.join(" / "),
  subject: "Maria",
  facts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

const captionReel = {
  id: "bad-caption-reel",
  lens: "NONE",
  anchorEventIds: graph.events.slice(0, 3).map((event) => event.id),
  supportingRelationKinds: [],
  trajectory: graph.events.slice(0, 3).map((event, index) => ({
    order: index + 1,
    operation: "reveal" as const,
    eventIds: [event.id],
    viewerChange: event.label,
    nextQuestion: "What comes next?",
  })),
  payoff: graph.events[2]?.label ?? "",
  unresolvedQuestion: "What comes next?",
  evidence: graph.events.slice(0, 3).map((event) => event.label),
  hypothesis: ["Each supplied event becomes a separate visible beat."],
  truthRisk: 0,
  novelty: 0.5,
  specificity: 0.9,
  informationValue: 0.7,
  uncertainty: 0.2,
  attentionPotential: 0.5,
  consequencePotential: 0.2,
  callbackPotential: 0.1,
  compressionPotential: 0.4,
  repetitionRisk: 0.8,
  distinctiveness: 0.4,
  score: 0,
};

const semanticProgression = {
  id: "good-semantic-progression",
  lens: "NONE",
  anchorEventIds: graph.events.slice(0, 2).map((event) => event.id),
  supportingRelationKinds: ["changes"],
  trajectory: [
    { order: 1, operation: "establish" as const, eventIds: [graph.events[0]!.id], viewerChange: "the kitchen sets the scale", nextQuestion: "What changes the reading?" },
    { order: 2, operation: "reframe" as const, eventIds: [graph.events[0]!.id, graph.events[1]!.id], viewerChange: "the work extends beyond the first room", nextQuestion: "How far did it go?" },
    { order: 3, operation: "payoff" as const, eventIds: [graph.events[1]!.id, graph.events[2]!.id], viewerChange: "two bathrooms make the reset feel larger", nextQuestion: "What lands now?" },
  ],
  payoff: "the reset reaches two bathrooms",
  unresolvedQuestion: "What lands now?",
  evidence: graph.events.slice(0, 3).map((event) => event.label),
  hypothesis: ["The job expands from one room into a whole reset."],
  truthRisk: 0,
  novelty: 0.75,
  specificity: 0.9,
  informationValue: 0.9,
  uncertainty: 0.2,
  attentionPotential: 0.8,
  consequencePotential: 0.7,
  callbackPotential: 0.2,
  compressionPotential: 0.8,
  repetitionRisk: 0.05,
  distinctiveness: 0.75,
  score: 0,
};

const bad = evaluateLatentMovie(captionReel, graph);
const good = evaluateLatentMovie(semanticProgression, graph);

assert.ok(bad.signals.captionReelRisk >= 0.82, `caption reel risk too low: ${bad.signals.captionReelRisk}`);
assert.equal(bad.accepted, false, "caption reel was accepted");
assert.equal(good.accepted, true, `grounded semantic progression rejected: ${good.reasons.join(" | ")}`);
assert.ok(good.signals.captionReelRisk < bad.signals.captionReelRisk, "semantic progression did not beat caption-reel risk");

console.log(`CAPTION REEL RISK: ${bad.signals.captionReelRisk}`);
console.log(`SEMANTIC PROGRESSION RISK: ${good.signals.captionReelRisk}`);
console.log("CAPTION REEL REJECTED: PASS");
console.log("SEMANTIC PROGRESSION ACCEPTED: PASS");
console.log("ANTI-COLLAPSE ACCEPTANCE: COMPLETE");
