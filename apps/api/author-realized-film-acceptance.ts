import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { judgeRealizedFilm } from "./src/services/authorRealizedFilmJudge.js";
import type { AuthorScene, LatentMovieCandidate, RealityRelation } from "@qre/contracts";

function movie(graph: ReturnType<typeof buildAuthorRealityGraph>): LatentMovieCandidate {
  const ids = graph.events.slice(0, 2).map((event) => event.id);
  return {
    id: "acceptance-movie",
    lens: "NONE",
    anchorEventIds: ids,
    supportingRelationKinds: ["recontextualizes"],
    trajectory: [
      { order: 1, operation: "establish", eventIds: [ids[0]!], viewerChange: "hold the first supplied detail", nextQuestion: "What changes the reading?" },
      { order: 2, operation: "reframe", eventIds: ids, viewerChange: "the second detail changes the first", nextQuestion: "What remains?" },
      { order: 3, operation: "payoff", eventIds: ids, viewerChange: "land the reading", nextQuestion: "" },
    ],
    payoff: "Land it.",
    unresolvedQuestion: "What remains?",
    evidence: graph.events.slice(0, 2).map((event) => event.label),
    hypothesis: ["A grounded relationship changes the reading."],
    truthRisk: 0,
    novelty: 0.8,
    specificity: 0.9,
    informationValue: 0.85,
    uncertainty: 0.2,
    attentionPotential: 0.85,
    consequencePotential: 0.7,
    callbackPotential: 0.2,
    compressionPotential: 0.8,
    repetitionRisk: 0,
    distinctiveness: 0.9,
    score: 0.9,
  };
}

function withGroundedRelationship<T extends ReturnType<typeof buildAuthorRealityGraph>>(graph: T): T {
  const [first, second] = graph.events;
  if (first && second) {
    const exists = graph.relations.some((relation) =>
      relation.from === first.id && relation.to === second.id && relation.kind === "recontextualizes",
    );
    if (!exists) {
      graph.relations.push({
        from: first.id,
        to: second.id,
        kind: "recontextualizes",
        strength: 0.8,
      } satisfies RealityRelation);
    }
  }
  return graph;
}

function judge(facts: string[], scenes: Array<{ text: string; sourceEventIds: string[]; kind?: AuthorScene["kind"] }>) {
  const graph = withGroundedRelationship(buildAuthorRealityGraph({ prompt: facts.join(". "), subject: "the subject", facts, sourceMoments: facts }));
  return judgeRealizedFilm({ scenes, movie: movie(graph), graph });
}

const bad = judge(
  ["Maria cleaned the kitchen", "Maria cleaned bathroom two"],
  [
    { text: "Sunlight. Dust motes rising.", sourceEventIds: ["event-1"] },
    { text: "A phantom scent of lemon.", sourceEventIds: ["event-1", "event-2"] },
    { text: "Quiet. A stillness remains.", sourceEventIds: ["event-1", "event-2"], kind: "payoff" },
  ],
);

if (bad.accepted || !bad.reasons.some((reason) => /grounded|unsupported/i.test(reason))) {
  throw new Error(`FABRICATED MIDDLE FILM WAS NOT REJECTED: ${JSON.stringify(bad)}`);
}

const good = judge(
  ["Coco came in for grooming", "Coco stole an apple from the counter"],
  [
    { text: "Grooming. Then the apple.", sourceEventIds: ["event-1"] },
    { text: "The counter. The bow. The theft.", sourceEventIds: ["event-1", "event-2"] },
    { text: "Playful defiance.", sourceEventIds: ["event-1", "event-2"], kind: "payoff" },
  ],
);

if (!good.accepted) throw new Error(`GROUNDED ARTISTIC FILM WAS REJECTED: ${JSON.stringify(good)}`);
if (good.dimensions.inventionRisk > 0.35 || good.dimensions.explanationRisk > 0) throw new Error(`GOOD FILM FAILED REALITY/ART BOUNDARY: ${JSON.stringify(good)}`);

console.log("PASS fabricated-middle rejection");
console.log("PASS grounded-bridge plus free-artistic-landing acceptance");
console.log("REALIZED FILM ACCEPTANCE: PASS");
