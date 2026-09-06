import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { judgeRealizedFilm } from "./src/services/authorRealizedFilmJudge.js";
import type { AuthorScene, LatentMovieCandidate, RealityRelation } from "@qre/contracts";

/**
 * Diagnostic acceptance only.
 *
 * The visible-film Judge is not an artistic authority. It cannot reject, rank,
 * or select the film. This script verifies that its diagnostics still detect
 * obvious source-copy / unsupported-concrete risks without turning those
 * diagnostics into a creative gate.
 */
function movie(graph: ReturnType<typeof buildAuthorRealityGraph>): LatentMovieCandidate {
  const ids = graph.events.slice(0, 2).map((event) => event.id);
  return {
    id: "acceptance-movie", lens: "NONE", anchorEventIds: ids, supportingRelationKinds: ["recontextualizes"],
    trajectory: [
      { order: 1, operation: "establish", eventIds: [ids[0]!], viewerChange: "hold the first supplied detail", nextQuestion: "What changes the reading?" },
      { order: 2, operation: "reframe", eventIds: ids, viewerChange: "the second detail changes the first", nextQuestion: "What remains?" },
      { order: 3, operation: "payoff", eventIds: ids, viewerChange: "land the reading", nextQuestion: "" },
    ],
    payoff: "Land it.", unresolvedQuestion: "What remains?", evidence: graph.events.slice(0, 2).map((event) => event.label),
    hypothesis: ["A grounded relationship changes the reading."], truthRisk: 0, novelty: 0.8, specificity: 0.9,
    informationValue: 0.85, uncertainty: 0.2, attentionPotential: 0.85, consequencePotential: 0.7,
    callbackPotential: 0.2, compressionPotential: 0.8, repetitionRisk: 0, distinctiveness: 0.9, score: 0.9,
  };
}
function withGroundedRelationship<T extends ReturnType<typeof buildAuthorRealityGraph>>(graph: T): T {
  const [first, second] = graph.events;
  if (first && second && !graph.relations.some((r) => r.from === first.id && r.to === second.id && r.kind === "recontextualizes")) {
    graph.relations.push({ from: first.id, to: second.id, kind: "recontextualizes", strength: 0.8 } satisfies RealityRelation);
  }
  return graph;
}
function judge(facts: string[], scenes: Array<{ text: string; sourceEventIds: string[]; kind?: AuthorScene["kind"] }>) {
  const graph = withGroundedRelationship(buildAuthorRealityGraph({ prompt: facts.join(". "), subject: "the subject", facts, sourceMoments: facts }));
  return judgeRealizedFilm({ scenes, movie: movie(graph), graph });
}

const unsupported = judge(
  ["Maria cleaned the kitchen", "Maria cleaned bathroom two"],
  [
    { text: "Crimson dragon roared through the marble atrium at midnight.", sourceEventIds: ["event-1"] },
    { text: "A meteor shower shattered every window in the building.", sourceEventIds: ["event-1", "event-2"] },
    { text: "Reality keeps the receipts.", sourceEventIds: ["event-1", "event-2"], kind: "payoff" },
  ],
);
if (unsupported.dimensions.inventionRisk <= 0) {
  throw new Error(`UNSUPPORTED-CONCRETE MATERIAL WAS NOT DETECTED DIAGNOSTICALLY: ${JSON.stringify(unsupported)}`);
}

const copied = judge(
  ["Coco came in for grooming", "Coco stole an apple from the counter"],
  [
    { text: "Coco came in for grooming", sourceEventIds: ["event-1"] },
    { text: "Coco stole an apple from the counter", sourceEventIds: ["event-1", "event-2"] },
    { text: "Coco came in for grooming", sourceEventIds: ["event-1", "event-2"], kind: "payoff" },
  ],
);
if (copied.dimensions.sourceCopyRisk <= 0) {
  throw new Error(`SOURCE COPY WAS NOT DETECTED DIAGNOSTICALLY: ${JSON.stringify(copied)}`);
}

const good = judge(
  ["Coco came in for grooming", "Coco stole an apple from the counter"],
  [
    { text: "Grooming.", sourceEventIds: ["event-1"] },
    { text: "The gleam of forbidden fruit.", sourceEventIds: ["event-1", "event-2"] },
    { text: "Coco got away with it.", sourceEventIds: ["event-1", "event-2"], kind: "payoff" },
  ],
);
if (good.dimensions.inventionRisk > 0.35 || good.dimensions.sourceCopyRisk > 0.5) {
  throw new Error(`ARTISTIC FILM FAILED DIAGNOSTIC REALITY BOUNDARY: ${JSON.stringify(good)}`);
}

console.log("PASS unsupported-concrete diagnostic");
console.log("PASS literal source-copy diagnostic");
console.log("PASS figurative artistic transformation diagnostic");
console.log("REALIZED FILM DIAGNOSTICS: PASS");
