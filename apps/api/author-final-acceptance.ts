import assert from "node:assert/strict";
import type { AuthorCreativeProposition, SequenceCandidate } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { searchAuthorMetamorphicRelations } from "./src/services/authorMetamorphicSearch.js";
import { chooseFallbackTreatment } from "./src/services/authorTreatment.js";
import { buildSequencePlay } from "./src/services/authorMouth.js";
import { judgeAuthorSequence } from "./src/services/authorJudge.js";
import { buildExperienceState } from "./src/services/experienceState.js";
import { experienceMemoryContext, experienceStateToMemoryBatch, mergeExperienceStates } from "./src/services/experienceMemory.js";

const cocoFacts = [
  "Coco is a poodle.",
  "Coco loves walks.",
  "Coco loves apples.",
  "Coco loves bacon.",
  "Coco investigates squirrels in the park.",
  "Grass gets inspected before Coco moves on.",
];

const horrorRomanceFacts = [
  "Two people met.",
  "Knives flew past them.",
  "Neither person flinched.",
  "They stayed focused on each other.",
];

function candidateFromRelations(graph: ReturnType<typeof buildAuthorRealityGraph>): SequenceCandidate {
  const relations = searchAuthorMetamorphicRelations(graph).relations;
  const relation = relations[0];
  assert.ok(relation, "Reality must expose at least one meaningful relationship");
  const eventIds = relation.evidenceEventIds;
  return {
    id: "acceptance-candidate",
    lens: relation.creativeOpportunity,
    anchorEventIds: eventIds,
    supportingRelationKinds: [relation.type],
    trajectory: [
      { order: 1, operation: "establish", eventIds: [eventIds[0]!], viewerChange: "register the concrete starting condition", nextQuestion: "What changes its meaning?" },
      { order: 2, operation: "reframe", eventIds, viewerChange: relation.viewerShift, nextQuestion: relation.after },
      { order: 3, operation: "payoff", eventIds, viewerChange: "recognize the relationship connecting the events", nextQuestion: "What else follows from it?" },
    ],
    payoff: relation.after,
    unresolvedQuestion: relation.viewerShift,
    evidence: [relation.before, relation.after],
    hypothesis: [relation.feltEffect],
    truthRisk: 0,
    novelty: relation.score,
    specificity: relation.confidence,
    informationValue: relation.score,
    uncertainty: 1 - relation.confidence,
    attentionPotential: relation.score,
    consequencePotential: relation.score,
    callbackPotential: relation.mechanism === "recurrence" ? 0.9 : 0.25,
    compressionPotential: 0.8,
    repetitionRisk: 0,
    distinctiveness: relation.score,
    score: relation.score,
  };
}

function proposition(graph: ReturnType<typeof buildAuthorRealityGraph>, candidate: SequenceCandidate, treatment: ReturnType<typeof chooseFallbackTreatment>): AuthorCreativeProposition {
  return {
    text: candidate.hypothesis[0] ?? "A real relationship changes the reading.",
    pattern: candidate.lens,
    sourceEventIds: candidate.anchorEventIds,
    candidateId: candidate.id,
    relationIds: searchAuthorMetamorphicRelations(graph).relations
      .filter((relation) => relation.evidenceEventIds.some((id) => candidate.anchorEventIds.includes(id)))
      .slice(0, 4)
      .map((relation) => relation.id),
    treatment,
  };
}

function assertAuthorShape(name: string, facts: string[]) {
  const graph = buildAuthorRealityGraph({ prompt: facts.join(" "), subject: name, facts, sourceMoments: [], memoryContext: [], trajectory: [] });
  assert.ok(graph.events.length >= facts.length - 1, `${name}: evidence collapsed`);
  assert.ok(graph.relations.length > 0, `${name}: no relationships discovered`);
  assert.ok((graph.patterns?.length ?? 0) > 0, `${name}: no semantic patterns discovered`);
  return graph;
}

const coco = assertAuthorShape("Coco", cocoFacts);
const cocoRelations = searchAuthorMetamorphicRelations(coco);
assert.ok(cocoRelations.relations.some((relation) => ["contrast", "consequence", "recurrence"].includes(relation.mechanism)), "Coco: expected nontrivial mechanism");
const cocoTreatment = chooseFallbackTreatment({ relations: cocoRelations });
const cocoCandidate = candidateFromRelations(coco);
const cocoProposition = proposition(coco, cocoCandidate, cocoTreatment);
const cocoSequence = buildSequencePlay({
  subject: "Coco",
  proposition: cocoProposition,
  candidate: cocoCandidate,
  cuts: [
    { text: "Coco has priorities.", sourceEventIds: cocoCandidate.anchorEventIds.slice(0, 1) },
    { text: "Walks get the first vote.", sourceEventIds: cocoCandidate.anchorEventIds.slice(0, 2) },
    { text: "Apples can change the route.", sourceEventIds: cocoCandidate.anchorEventIds.slice(0, 2) },
    { text: "Bacon can overrule it.", sourceEventIds: cocoCandidate.anchorEventIds.slice(0, 2) },
  ],
});
const cocoJudgment = judgeAuthorSequence({ graph: coco, candidate: cocoCandidate, proposition: cocoProposition, sequence: cocoSequence });
assert.equal(cocoJudgment.status, "ACCEPT", `Coco acceptance failed: ${cocoJudgment.reasons.join(", ")}`);
assert.ok(cocoJudgment.informationPerCut >= 0.55);
assert.ok(cocoSequence.cuts.every((cut) => cut.sourceIds.every((id) => coco.events.some((event) => event.id === id))));

const romance = assertAuthorShape("two people", horrorRomanceFacts);
const romanceRelations = searchAuthorMetamorphicRelations(romance);
const horror = chooseFallbackTreatment({ relations: romanceRelations });
assert.equal(horror.id, "horror-romance", "Danger + relationship should resolve to horror-romance treatment");

const nextState = buildExperienceState({
  graph: coco,
  candidate: cocoCandidate,
  lens: cocoProposition.pattern,
  memoryContext: ["Coco has a priority system.", "Bacon previously overrode other preferences."],
  priorExperienceStates: [],
  round: 1,
});
const memoryBatch = experienceStateToMemoryBatch({ assetId: "acceptance-asset", state: nextState, sourceRef: "author-final-acceptance" });
assert.equal(memoryBatch.events.length, 1);
assert.equal(memoryBatch.events[0]?.type, "experience_state");
assert.ok(memoryBatch.events[0]?.metadata?.experienceState);

const merged = mergeExperienceStates([nextState]);
assert.ok(merged);
const memoryLines = experienceMemoryContext({ entities: [], facts: [], relations: [], events: memoryBatch.events });
assert.ok(memoryLines.length > 0, "memory projection must produce reusable context");

console.log("AUTHOR FINAL ACCEPTANCE");
console.log(`PASS reality: events=${coco.events.length} relations=${cocoRelations.relations.length}`);
console.log(`PASS Coco: treatment=${cocoTreatment.id} judgment=${cocoJudgment.status} information=${cocoJudgment.informationPerCut.toFixed(3)}`);
console.log(`PASS lens: ${horror.primary} + ${horror.secondary}`);
console.log(`PASS memory: events=${memoryBatch.events.length} contextLines=${memoryLines.length}`);

if (process.env.QRE_AUTHOR_ACCEPTANCE_LIVE === "true") {
  const { authorBrainCanonical } = await import("./src/services/authorBrainCanonical.js");
  const live = await authorBrainCanonical({
    prompt: "Create a surprising short experience about Coco from the supplied reality.",
    subject: "Coco",
    facts: cocoFacts,
    sourceMoments: [],
    memoryContext: ["Coco has a priority system.", "Bacon previously overrode other preferences."],
    trajectory: [],
    creativeLearningContext: [],
  });
  assert.ok(live.selectedCandidateId);
  assert.ok(live.proposition.treatment.id);
  assert.ok(live.sequence.cuts.length >= 4);
  assert.equal(live.judgment.status, "ACCEPT");
  console.log(`PASS live Author: candidate=${live.selectedCandidateId} treatment=${live.proposition.treatment.id} cuts=${live.sequence.cuts.length}`);
}

console.log("AUTHOR FINAL ACCEPTANCE: PASS");
