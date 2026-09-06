import assert from "node:assert/strict";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { judgeAuthorExperience } from "./src/services/authorExperienceJudge.js";
import type { LatentMovieCandidate } from "@qre/contracts";

function candidate(
  id: string,
  graph: ReturnType<typeof buildAuthorRealityGraph>,
  overrides: Partial<LatentMovieCandidate> = {},
): LatentMovieCandidate {
  const ids = graph.events.slice(0, 3).map((event) => event.id);
  return {
    id,
    lens: "NONE",
    anchorEventIds: ids.slice(0, 2),
    supportingRelationKinds: ["changes", "contrasts"],
    trajectory: [
      { order: 1, operation: "establish", eventIds: [ids[0]!], viewerChange: "one supplied detail sets the reference", nextQuestion: "What changes the reading?" },
      { order: 2, operation: "reframe", eventIds: ids.slice(0, 2), viewerChange: "the second detail changes the first detail's meaning", nextQuestion: "What does the pattern do?" },
      { order: 3, operation: "payoff", eventIds: ids.slice(1, 3), viewerChange: "the later detail makes the earlier detail land differently", nextQuestion: "What remains?" },
    ],
    payoff: "the later detail changes the first reading",
    unresolvedQuestion: "What remains?",
    evidence: graph.events.slice(0, 3).map((event) => event.label),
    hypothesis: ["The details become more interesting together than separately."],
    truthRisk: 0,
    novelty: 0.78,
    specificity: 0.9,
    informationValue: 0.88,
    uncertainty: 0.15,
    attentionPotential: 0.84,
    consequencePotential: 0.72,
    callbackPotential: 0.3,
    compressionPotential: 0.82,
    repetitionRisk: 0.05,
    distinctiveness: 0.82,
    score: 0,
    ...overrides,
  };
}

const realityFacts = [
  "Maria cleaned the kitchen",
  "Maria cleaned bathroom one",
  "Maria cleaned bathroom two",
  "Maria finished at 11:47 AM",
  "There were 22 shampoo bottles",
];
const graph = buildAuthorRealityGraph({
  prompt: realityFacts.join(" / "),
  subject: "Maria",
  facts: realityFacts,
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

const semantic = candidate("semantic", graph);
const caption = candidate("caption", graph, {
  supportingRelationKinds: [],
  trajectory: graph.events.slice(0, 3).map((event, index) => ({
    order: index + 1,
    operation: "reveal" as const,
    eventIds: [event.id],
    viewerChange: event.label,
    nextQuestion: "What comes next?",
  })),
  payoff: graph.events[2]?.label ?? "",
  hypothesis: ["Each supplied event becomes a separate visible beat."],
  novelty: 0.3,
  attentionPotential: 0.4,
  consequencePotential: 0.15,
  distinctiveness: 0.35,
  repetitionRisk: 0.75,
});
const generic = candidate("generic", graph, {
  hypothesis: ["It was a beautiful moment in the journey of life."],
  payoff: "A special memory to cherish forever",
  unresolvedQuestion: "What a meaningful experience this was",
  novelty: 0.2,
  specificity: 0.2,
  distinctiveness: 0.15,
});
const sparse = candidate("sparse", graph, {
  trajectory: [{ order: 1, operation: "reveal", eventIds: [graph.events[4]?.id ?? graph.events[0]!.id], viewerChange: "22 shampoo bottles become the detail that sticks", nextQuestion: "Why that detail?" }],
  hypothesis: ["One strangely specific detail can carry the whole experience."],
  payoff: "22 shampoo bottles",
  informationValue: 0.6,
  attentionPotential: 0.8,
  specificity: 0.95,
  distinctiveness: 0.92,
  consequencePotential: 0.2,
});

const semanticJudgment = judgeAuthorExperience(semantic, graph);
const captionJudgment = judgeAuthorExperience(caption, graph);
const genericJudgment = judgeAuthorExperience(generic, graph);
const sparseJudgment = judgeAuthorExperience(sparse, graph);

assert.equal(semanticJudgment.accepted, true, `semantic candidate rejected: ${semanticJudgment.reasons.join(" | ")}`);
assert.equal(captionJudgment.accepted, false, "caption reel survived the independent judge");
assert.equal(genericJudgment.accepted, false, "generic experience survived the independent judge");
assert.ok(semanticJudgment.score > captionJudgment.score, "semantic candidate did not beat caption reel");
assert.ok(semanticJudgment.score > genericJudgment.score, "semantic candidate did not beat generic candidate");
assert.equal(sparseJudgment.gate.accepted, true, `sparse observation should remain viable: ${sparseJudgment.gate.reasons.join(" | ")}`);
assert.ok(sparseJudgment.dimensions.specificity > 0.8, "sparse observation lost specificity");

const returnCandidate = candidate("return", graph, {
  callbackPotential: 0.92,
  novelty: 0.8,
  repetitionRisk: 0.04,
});
const returnJudgment = judgeAuthorExperience(returnCandidate, graph, { returning: true });
assert.ok(returnJudgment.dimensions.replayValue > 0.7, `return value too low: ${returnJudgment.dimensions.replayValue}`);

console.log(`SEMANTIC SCORE: ${semanticJudgment.score}`);
console.log(`CAPTION SCORE: ${captionJudgment.score}`);
console.log(`GENERIC SCORE: ${genericJudgment.score}`);
console.log(`SPARSE SCORE: ${sparseJudgment.score}`);
console.log(`RETURN REPLAY VALUE: ${returnJudgment.dimensions.replayValue}`);
console.log("INDEPENDENT EXPERIENCE JUDGE: PASS");
console.log("CAPTION / GENERIC COLLAPSE REJECTED: PASS");
console.log("SPARSE REALITY PRESERVED: PASS");
console.log("RETURN VALUE PRESERVED: PASS");
console.log("AUTHOR WAR READINESS: COMPLETE");
