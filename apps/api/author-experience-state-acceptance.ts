import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { buildAuthorExperienceState } from "./src/services/authorExperienceState.js";

const graph: RealityGraph = {
  evidence: [],
  events: [
    { id: "coco", label: "Coco", sourceIds: ["e1"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "nervous", label: "nervous", sourceIds: ["e2"], entities: ["Coco"], emotionalState: "nervous", salient: true, provenance: "explicit" },
    { id: "bath", label: "bath", sourceIds: ["e3"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "bows", label: "pink bows", sourceIds: ["e4"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "mirror", label: "approved mirror", sourceIds: ["e5"], entities: ["Coco"], salient: true, provenance: "explicit" },
    { id: "fabulous", label: "fabulous", sourceIds: ["e6"], entities: ["Coco"], emotionalState: "happy", salient: true, provenance: "explicit" },
  ],
  relations: [
    { from: "nervous", to: "bath", kind: "changes", strength: 0.82 },
    { from: "bath", to: "bows", kind: "recontextualizes", strength: 0.78 },
    { from: "bows", to: "mirror", kind: "changes", strength: 0.76 },
    { from: "mirror", to: "fabulous", kind: "converges", strength: 0.86 },
    { from: "nervous", to: "fabulous", kind: "recontextualizes", strength: 0.81 },
  ],
  unresolvedTensions: ["peace is temporary"],
  recurringSignals: ["Coco"],
  sensorySignals: [],
};

const movie: LatentMovieCandidate = {
  id: "movie-coco",
  lens: "natural, specific, emotionally intelligent",
  anchorEventIds: ["coco", "nervous"],
  supportingRelationKinds: ["changes", "recontextualizes", "converges"],
  trajectory: [
    { order: 1, operation: "establish", eventIds: ["coco"], viewerChange: "Establish Coco.", nextQuestion: "What changes?" },
    { order: 2, operation: "reveal", eventIds: ["coco", "nervous"], viewerChange: "Coco arrives carrying nervousness.", nextQuestion: "What changes now?" },
    { order: 3, operation: "reframe", eventIds: ["nervous", "bath"], viewerChange: "The nervousness no longer gets the final word.", nextQuestion: "What does this unlock?" },
    { order: 4, operation: "reframe", eventIds: ["bath", "bows"], viewerChange: "The bows turn the whole thing playful.", nextQuestion: "What becomes newly meaningful?" },
    { order: 5, operation: "converge", eventIds: ["mirror", "fabulous"], viewerChange: "Now fabulous feels earned.", nextQuestion: "What is true at the ending?" },
    { order: 6, operation: "payoff", eventIds: ["fabulous"], viewerChange: "fabulous", nextQuestion: "What comes next?" },
  ],
  payoff: "fabulous",
  unresolvedQuestion: "What comes next?",
  evidence: ["Coco", "nervous", "bath", "pink bows", "approved mirror", "fabulous"],
  hypothesis: ["Coco's meaning changes through the supplied path."],
  truthRisk: 0.1,
  novelty: 0.9,
  specificity: 0.8,
  informationValue: 0.9,
  uncertainty: 0.7,
  attentionPotential: 0.9,
  consequencePotential: 0.85,
  callbackPotential: 0.8,
  compressionPotential: 0.85,
  repetitionRisk: 0.05,
  distinctiveness: 0.9,
  score: 0.88,
};

const state = buildAuthorExperienceState({
  graph,
  movie,
  lens: movie.lens,
  round: 2,
  memoryContext: ["Coco remains part of the world after this chapter."],
});

const failures: string[] = [];
if (!state.establishedEventIds.includes("coco")) failures.push("missing-established-coco");
if (!state.changedEventIds.includes("bath")) failures.push("missing-changed-bath");
if (!state.carrierEventIds.includes("bows")) failures.push("missing-carrier-bows");
if (!state.semanticTurnKeys.length) failures.push("missing-semantic-turns");
if (!state.relationKinds.includes("recontextualizes")) failures.push("missing-recontextualization");
if (!state.payoffEventIds.includes("fabulous")) failures.push("missing-payoff");
if (!state.unresolvedQuestions.length) failures.push("missing-open-question");
if (state.continuationValue <= 0) failures.push("missing-continuation-value");
if (state.attentionPotential <= 0) failures.push("missing-attention-potential");
if (!state.chapter.operations.includes("payoff")) failures.push("missing-payoff-operation");

if (failures.length) {
  console.error("AUTHOR EXPERIENCE STATE ACCEPTANCE: FAIL");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("AUTHOR EXPERIENCE STATE ACCEPTANCE: PASS");
console.log(`operations=${state.chapter.operations.join(">")}`);
console.log(`continuation=${state.continuationValue}`);
console.log(`lookahead=${state.lookaheadValue}`);
console.log(`attention=${state.attentionPotential}`);
console.log(`futureThreads=${state.futureThreadKeys.length}`);
