import type { LatentMovieCandidate, MouthCandidateBeat, RealityGraph } from "@qre/contracts";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildMouthRealizationAuthority } from "./src/services/authorMouthRealizationAuthority.js";
import { deriveLatentStoryThesis } from "./src/services/authorLatentStoryThesis.js";
import { selectDistinctMovieCandidates } from "./src/services/authorMovieDifferentiation.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR METAMORPHIC PIPELINE FAILED: ${message}`);
}

const graph: RealityGraph = {
  events: [
    {
      id: "groom",
      label: "Coco was groomed at Elm Street Grooming",
      entities: ["Coco"],
      sourceIds: [],
      salient: true,
    },
    {
      id: "bow",
      label: "Coco stole the red bow",
      entities: ["Coco"],
      sourceIds: [],
      salient: true,
    },
  ],
  relations: [],
  eventStructure: [
    {
      eventId: "groom",
      subjects: ["Coco"],
      actions: ["groomed"],
      objects: [],
      states: ["clean", "polished"],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["service"],
      recurrenceScore: 0,
      transitionScore: 0.3,
      anomalyScore: 0.2,
      salienceScore: 0.9,
    },
    {
      eventId: "bow",
      subjects: ["Coco"],
      actions: ["stole"],
      objects: ["red bow"],
      states: [],
      temporalMarkers: [],
      sensoryMarkers: [],
      semanticTags: ["outcome", "ownership"],
      recurrenceScore: 0,
      transitionScore: 0.6,
      anomalyScore: 0.8,
      salienceScore: 0.95,
    },
  ],
  entityContinuity: [
    { name: "Coco", eventIds: ["groom", "bow"], salienceScore: 0.98 },
  ],
  unresolvedTensions: [],
  recurringSignals: [],
  patterns: [],
} as RealityGraph;

const candidate = {
  id: "pipeline-candidate",
  lens: "NONE",
  anchorEventIds: ["groom", "bow"],
  supportingRelationKinds: [],
  trajectory: [
    { order: 1, operation: "establish", eventIds: ["groom"], viewerChange: "presentation established", nextQuestion: "What changes the reading?" },
    { order: 2, operation: "contrast", eventIds: ["bow"], viewerChange: "behavior collides with presentation", nextQuestion: "What remains when they meet?" },
    { order: 3, operation: "payoff", eventIds: ["bow"], viewerChange: "the supplied endpoint lands", nextQuestion: "" },
  ],
  payoff: "Coco stole the red bow.",
  unresolvedQuestion: "What remains when the pieces meet?",
  evidence: ["Coco was groomed at Elm Street Grooming", "Coco stole the red bow"],
  hypothesis: ["The polished presentation changes the reading of the supplied theft."],
  truthRisk: 0,
  novelty: 0.8,
  specificity: 0.9,
  informationValue: 0.8,
  uncertainty: 0.5,
  attentionPotential: 0.9,
  consequencePotential: 0.8,
  callbackPotential: 0.2,
  compressionPotential: 0.8,
  repetitionRisk: 0,
  distinctiveness: 1,
  score: 0.72,
} as LatentMovieCandidate;

const thesis = deriveLatentStoryThesis(graph, candidate);
assert(thesis.metamorphicRelationSet.version === 1, "thesis has no sealed relation set");
assert(thesis.metamorphicRelationSet.relationCount > 0, "thesis relation set is empty");
assert(thesis.metamorphicRelationSet.evidenceClosed, "thesis relation set is not evidence-closed");

const enriched = { ...candidate, storyThesis: thesis } as LatentMovieCandidate;
const selected = selectDistinctMovieCandidates([enriched], 1, "NONE");
assert(selected.length === 1, "movie candidate was not selected");

const selectedSet = (selected[0] as LatentMovieCandidate & {
  metamorphicRelationSet?: typeof thesis.metamorphicRelationSet;
}).metamorphicRelationSet;
assert(selectedSet === thesis.metamorphicRelationSet, "movie selection replaced or recomputed the sealed relation set");

const semantic = thesis.semanticRealization;
assert(semantic, "thesis did not carry semantic realization");
assert(semantic.metamorphicRelationSet === thesis.metamorphicRelationSet, "semantic realization lost the sealed relation set");

const envelope = buildAuthorRealityEnvelope({ graph, subject: "Coco" });
const beat: MouthCandidateBeat = {
  order: 1,
  role: "establishing",
  eventIds: thesis.metamorphicRelationSet.sourceEventIds,
  change: thesis.semanticTurn,
  semanticRealization: semantic,
};

const authority = buildMouthRealizationAuthority({ beat, envelope });
assert(authority.metamorphicRelationSet === thesis.metamorphicRelationSet, "Mouth did not receive the sealed relation set");
assert(authority.metamorphicRelationSet.strongestRelationId === thesis.metamorphicRelationSet.strongestRelationId, "strongest relation identity changed before Mouth");

let bypassRejected = false;
try {
  selectDistinctMovieCandidates([candidate], 1, "NONE");
} catch (error) {
  bypassRejected = error instanceof Error && /METAMORPHIC PIPELINE SEALED/i.test(error.message);
}
assert(bypassRejected, "movie selection allowed a candidate to bypass metamorphic cognition");

let mouthBypassRejected = false;
try {
  buildMouthRealizationAuthority({
    beat: { order: 1, role: "establishing", eventIds: ["groom"], change: "direct" },
    envelope,
  });
} catch (error) {
  mouthBypassRejected = error instanceof Error && /METAMORPHIC PIPELINE SEALED/i.test(error.message);
}
assert(mouthBypassRejected, "Mouth accepted a beat without a sealed metamorphic relation set");

console.log("AUTHOR METAMORPHIC PIPELINE ACCEPTANCE: PASS");
console.log("REALITY_GRAPH_TO_THESIS_SET=TRUE");
console.log("THESIS_TO_MOVIE_SELECTION_SET_IDENTITY=TRUE");
console.log("MOVIE_TO_MOUTH_SET_IDENTITY=TRUE");
console.log("BYPASS_SELECTION_REJECTED=TRUE");
console.log("BYPASS_MOUTH_REJECTED=TRUE");
