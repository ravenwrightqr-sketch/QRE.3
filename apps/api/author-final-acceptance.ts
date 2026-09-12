import "dotenv/config";
import assert from "node:assert/strict";
import type { AuthorMetamorphicRelationSet, AuthorTreatmentId, SequenceCandidate } from "@qre/contracts";
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

const mechanicFacts = [
  "A truck arrived with an intermittent starting problem.",
  "The diagnosis found the battery connection was unstable.",
  "The connection was repaired.",
  "The truck started normally after the repair.",
  "The repair was tested before the truck left.",
];

function candidateFromRelations(graph: ReturnType<typeof buildAuthorRealityGraph>): SequenceCandidate {
  const relations = searchAuthorMetamorphicRelations(graph).relations;
  const relation = relations.find((value) => value.mechanism === "recurrence") ?? relations[0];
  assert.ok(relation, "Reality must expose at least one meaningful relationship");
  const eventIds = relation.evidenceEventIds;
  return {
    id: "acceptance-candidate", lens: "priority hierarchy", anchorEventIds: eventIds,
    supportingRelationKinds: ["priority", "recurrence", "competition", relation.mechanism],
    trajectory: [
      { order: 1, operation: "establish", eventIds: [eventIds[0]!], viewerChange: "register the concrete starting condition", nextQuestion: "Which preference wins when they conflict?" },
      { order: 2, operation: "contrast", eventIds, viewerChange: "recognize competing preferences", nextQuestion: "Which one breaks the tie?" },
      { order: 3, operation: "reframe", eventIds, viewerChange: "see the events as a priority system", nextQuestion: "Does the highest priority override the others?" },
      { order: 4, operation: "payoff", eventIds, viewerChange: "recognize the overriding preference", nextQuestion: "What happens when the priority returns?" },
    ],
    payoff: "the strongest preference overrides another preference",
    unresolvedQuestion: "which preference wins when they conflict",
    evidence: [relation.before, relation.after], hypothesis: ["Coco has a priority system: one preference can override another."],
    truthRisk: 0, novelty: Math.max(0.72, relation.score), specificity: 0.92, informationValue: 0.9,
    uncertainty: 0.65, attentionPotential: 0.9, consequencePotential: 0.82, callbackPotential: 0.8,
    compressionPotential: 0.8, repetitionRisk: 0, distinctiveness: 0.92, score: Math.max(0.72, relation.score),
  };
}

function acceptanceProposition(graph: ReturnType<typeof buildAuthorRealityGraph>, candidate: SequenceCandidate, treatmentId: AuthorTreatmentId) {
  const relations = searchAuthorMetamorphicRelations(graph).relations;
  const relationIds = relations
    .filter((relation) => relation.evidenceEventIds.some((id) => candidate.anchorEventIds.includes(id)))
    .slice(0, 4).map((relation) => relation.id);
  const treatment = chooseFallbackTreatment({
    relations: { version: 1, sourceEventIds: graph.events.map((event) => event.id), relations,
      strongestRelationId: relations[0]?.id, relationCount: relations.length, evidenceClosed: true },
    preferred: treatmentId,
  });
  return {
    text: "Coco has a priority system: one preference can override another.",
    pattern: "priority hierarchy",
    orderingRule: "Reveal the priority system through concrete preferences first, then the interaction that shows one preference outranking another.",
    sourceEventIds: candidate.anchorEventIds,
    candidateId: candidate.id, relationIds, treatment,
  };
}

function assertReality(name: string, facts: string[]) {
  const graph = buildAuthorRealityGraph({ prompt: facts.join(" "), subject: name, facts, sourceMoments: [], memoryContext: [], trajectory: [] });
  assert.ok(graph.events.length >= facts.length - 1, `${name}: evidence collapsed`);
  assert.ok(graph.relations.length > 0, `${name}: no relationships discovered`);
  assert.ok((graph.patterns?.length ?? 0) > 0, `${name}: no semantic patterns discovered`);
  return graph;
}

function syntheticTreatmentSet(signals: string[]): AuthorMetamorphicRelationSet {
  return {
    version: 1, sourceEventIds: ["event-a", "event-b"],
    relations: [{ id: "meta-test", type: "contrast_reversal", mechanism: signals.includes("recurrence") ? "recurrence" : "contrast",
      evidenceEventIds: ["event-a", "event-b"], beforeEventIds: ["event-a"], afterEventIds: ["event-b"],
      before: "A real starting condition exists.", after: "The later condition changes its meaning.",
      relation: { kind: "semantic", fromEventId: "event-a", toEventId: "event-b" }, realizationMove: "hold_contrast",
      creativeOpportunity: signals.join(" "), feltEffect: signals.join(" "), viewerShift: "reconsider the first condition",
      languageAim: signals.join(" "), confidence: 0.92, score: 0.92 }],
    strongestRelationId: "meta-test", relationCount: 1, evidenceClosed: true,
  };
}

const coco = assertReality("Coco", cocoFacts);
const cocoRelations = searchAuthorMetamorphicRelations(coco);
assert.ok(cocoRelations.relations.length >= 1, "Coco: no metamorphic opportunities");
assert.ok(cocoRelations.relations.every((relation) => relation.evidenceEventIds.every((id) => coco.events.some((event) => event.id === id))));

const syntheticHorror = chooseFallbackTreatment({ relations: syntheticTreatmentSet(["danger", "relationship", "normalization"]) });
assert.equal(syntheticHorror.id, "horror-romance", "danger + relationship should resolve to horror-romance");
const syntheticGame = chooseFallbackTreatment({ relations: syntheticTreatmentSet(["priority", "recurrence", "competition", "escalation"]) });
assert.equal(syntheticGame.id, "game-fierce", "priority + recurrence should resolve to game-fierce");

const cocoCandidate = candidateFromRelations(coco);
const cocoProposition = acceptanceProposition(coco, cocoCandidate, syntheticGame.id);
const cocoSequence = buildSequencePlay({
  subject: "Coco", proposition: cocoProposition, candidate: cocoCandidate,
  cuts: [
    { text: "Walk first.", sourceEventIds: [coco.events[1]!.id] },
    { text: "Grass: inspect.", sourceEventIds: [coco.events[5]!.id] },
    { text: "Squirrels: investigate.", sourceEventIds: [coco.events[4]!.id] },
    { text: "Apple: acquire.", sourceEventIds: [coco.events[2]!.id] },
    { text: "Bacon: override priorities.", sourceEventIds: [coco.events[3]!.id] },
  ],
});
assert.notEqual(cocoSequence.cuts[0]?.informationGain, cocoProposition.text, "sequence must demonstrate the proposition instead of stating it first");
assert.ok(cocoSequence.cuts.at(-1)?.informationGain.toLowerCase().includes("bacon"), "payoff must use supplied evidence");
assert.ok(cocoSequence.cuts.some((cut) => cut.gainKind === "discovery" || cut.role === "discovery" || cut.role === "consequence"), "sequence must contain a semantic turn");
const cocoJudgment = judgeAuthorSequence({ graph: coco, candidate: cocoCandidate, proposition: cocoProposition, sequence: cocoSequence });
console.log(`DEBUG Coco Judge: relation=${cocoJudgment.relationFidelity.toFixed(3)} treatment=${cocoJudgment.treatmentFidelity.toFixed(3)} genericity=${cocoJudgment.genericity.toFixed(3)} movement=${cocoJudgment.movement.toFixed(3)} info=${cocoJudgment.informationPerCut.toFixed(3)} necessity=${cocoJudgment.necessity.toFixed(3)}`);
assert.equal(cocoJudgment.status, "ACCEPT", `Coco sequence acceptance failed: ${cocoJudgment.reasons.join(", ")}`);
assert.ok(cocoJudgment.informationPerCut >= 0.52);
assert.ok(cocoSequence.cuts.every((cut) => cut.sourceIds.length > 0 && cut.sourceIds.every((id) => coco.events.some((event) => event.id === id))));

const rejectedSequence = buildSequencePlay({
  subject: "Coco", proposition: cocoProposition, candidate: cocoCandidate,
  cuts: [
    { text: "Coco has priorities.", sourceEventIds: [coco.events[0]!.id] },
    { text: "Coco has priorities.", sourceEventIds: [coco.events[0]!.id] },
    { text: "Coco has priorities.", sourceEventIds: [coco.events[0]!.id] },
    { text: "Coco has priorities.", sourceEventIds: [coco.events[0]!.id] },
  ],
});
const rejectedJudgment = judgeAuthorSequence({ graph: coco, candidate: cocoCandidate, proposition: cocoProposition, sequence: rejectedSequence });
assert.equal(rejectedJudgment.status, "REJECT", "Judge must reject repeated non-moving realization");

const visitOneState = buildExperienceState({
  graph: coco, candidate: cocoCandidate, lens: cocoProposition.pattern,
  memoryContext: ["Coco has a priority system.", "Bacon previously overrode other preferences."],
  priorExperienceStates: [], round: 1,
});
const visitOneBatch = experienceStateToMemoryBatch({ assetId: "acceptance-asset", state: visitOneState, sourceRef: "author-final-acceptance" });
assert.equal(visitOneBatch.events.length, 1);
assert.equal(visitOneBatch.events[0]?.type, "experience_state");
assert.ok(visitOneBatch.events[0]?.metadata?.experienceState);

const visitTwoState = buildExperienceState({
  graph: coco, candidate: cocoCandidate, lens: cocoProposition.pattern,
  memoryContext: ["Coco has a priority system.", "Bacon previously overrode other preferences."],
  priorExperienceStates: [visitOneState], round: 2,
});
assert.ok(visitTwoState.revisitedEventIds.length > 0, "return visit must create an explicit callback/revisit state");
assert.ok(visitTwoState.continuationValue >= visitOneState.continuationValue, "return visit must not lose continuation pressure");
assert.ok(visitTwoState.memoryHooks.some((hook) => hook.startsWith("return:")));

const merged = mergeExperienceStates([visitOneState, visitTwoState]);
assert.ok(merged);
const memoryLines = experienceMemoryContext({ entities: [], facts: [], relations: [], events: visitOneBatch.events });
assert.ok(memoryLines.length > 0, "memory projection must produce reusable context");

const mechanic = assertReality("truck", mechanicFacts);
const mechanicRelations = searchAuthorMetamorphicRelations(mechanic);
assert.ok(mechanicRelations.relations.some((relation) => ["consequence", "state_change", "recurrence", "convergence"].includes(relation.mechanism)), "mechanic reality must expose a semantic relationship without an industry-specific Author");
assert.ok(mechanic.patterns?.some((pattern) => ["transition", "thread", "motif"].includes(pattern.kind)), "mechanic reality must expose a reusable semantic pattern");

console.log("AUTHOR FINAL ACCEPTANCE");
console.log(`PASS reality: Coco events=${coco.events.length} relations=${cocoRelations.relations.length}`);
console.log(`PASS treatments: horror=${syntheticHorror.id} game=${syntheticGame.id}`);
console.log(`PASS Coco sequence: judgment=${cocoJudgment.status} information=${cocoJudgment.informationPerCut.toFixed(3)}`);
console.log(`PASS Judge rejection: reasons=${rejectedJudgment.reasons.join(",")}`);
console.log(`PASS return state: revisited=${visitTwoState.revisitedEventIds.length} continuation=${visitTwoState.continuationValue.toFixed(3)}`);
console.log(`PASS mechanic semantic discovery: relations=${mechanicRelations.relations.length} patterns=${mechanic.patterns?.length ?? 0}`);

if (process.env.QRE_AUTHOR_ACCEPTANCE_LIVE === "true") {
  const { authorBrainCanonical } = await import("./src/services/authorBrainCanonical.js");
  const liveVisitOne = await authorBrainCanonical({ prompt: "Create a surprising short experience about Coco from the supplied reality.", subject: "Coco", facts: cocoFacts, sourceMoments: [], memoryContext: [], trajectory: [], creativeLearningContext: [], returning: false, visitNumber: 1 });
  const liveVisitTwo = await authorBrainCanonical({ prompt: "Continue the Coco experience from the supplied reality without resetting what the visitor already learned.", subject: "Coco", facts: cocoFacts, sourceMoments: [], memoryContext: [...liveVisitOne.memoryDelta.carryThreads, ...liveVisitOne.memoryDelta.unresolvedQuestions, "The visitor previously saw this relationship."], trajectory: liveVisitOne.sequence.cuts.map((cut) => cut.informationGain), creativeLearningContext: liveVisitOne.learningDelta.signals, returning: true, visitNumber: 2 });
  assert.ok(liveVisitOne.selectedCandidateId);
  assert.equal(liveVisitOne.judgment.status, "ACCEPT");
  assert.ok(liveVisitOne.memoryDelta.relationIds.length > 0);
  assert.equal(liveVisitOne.learningDelta.status, "accepted");
  assert.ok(liveVisitOne.continuationState.returnCue);
  assert.equal(liveVisitTwo.judgment.status, "ACCEPT");
  assert.ok(liveVisitTwo.continuationState.returnCue?.includes("returned"));
  console.log(`PASS live Author visit 1: candidate=${liveVisitOne.selectedCandidateId} treatment=${liveVisitOne.proposition.treatment.id} cuts=${liveVisitOne.sequence.cuts.length}`);
  console.log(`PASS live Author visit 2: candidate=${liveVisitTwo.selectedCandidateId} treatment=${liveVisitTwo.proposition.treatment.id} cuts=${liveVisitTwo.sequence.cuts.length}`);
}

console.log("AUTHOR FINAL ACCEPTANCE: PASS");
