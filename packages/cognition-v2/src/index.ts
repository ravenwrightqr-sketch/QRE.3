export { understandPrompt } from "./mind/understandPrompt.js";
export { buildExperienceUnderstanding } from "./experienceUnderstanding.js";
export { COGNITION_V2_MASTER_PROMPT } from "./masterPrompt.js";

export type { CognitiveIntent, CognitiveUnderstanding } from "./types.js";

export type {
  CognitiveEntity,
  CognitiveEvent,
  CognitiveRelationship,
  CognitivePlace,
  CognitiveTemporal,
  CognitiveNarrative,
  CognitiveWorldModel
} from "./worldModel.js";

export {
  createTemporalMemory,
  addMemoryPoint,
  getMemoryTimeline,
  getMemoryPointsBetween,
  getRelatedMemoryPoints,
  calculateMemorySpan,
  calculateMemoryDensity,
  findMilestones,
  findFirsts,
  findTransitions
} from "./temporalMemory.js";

export type {
  CognitiveMemoryPhase,
  CognitiveMemoryPoint,
  CognitiveTemporalMemory
} from "./temporalMemory.js";

export {
  createConnectionGraph,
  addGraphNode,
  addGraphEdge,
  getNode,
  getConnections,
  getConnectedNodes,
  getConnectionsByKind,
  getStrongConnections,
  findSharedConnections,
  findPath
} from "./connectionGraph.js";

export type {
  CognitiveConnectionKind,
  CognitiveGraphNode,
  CognitiveGraphEdge,
  CognitiveConnectionGraph
} from "./connectionGraph.js";

export {
  createEvidenceStore,
  addEvidence,
  addClaim,
  getEvidenceForClaim
} from "./evidence.js";

export type {
  CognitiveEvidenceType,
  CognitiveEvidence,
  CognitiveClaim,
  CognitiveEvidenceStore
} from "./evidence.js";

export {
  getSupportingEvidence,
  getConflictingEvidence,
  calculateClaimConfidence,
  evaluateClaim,
  evaluateAllClaims
} from "./claimEngine.js";
