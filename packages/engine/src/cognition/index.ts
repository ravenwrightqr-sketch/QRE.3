/**
 * =====================================================
 * QRE COGNITION CORE INDEX
 * =====================================================
 *
 * Public cognition boundary.
 * =====================================================
 */

export { understandExperience } from "./cognitiveEngine.js";

export {
  processCognition,
} from "./cognitionKernel.js";

export type {
  CognitionInput,
  CognitionResult,
} from "./cognitionKernel.js";

export {
  remember,
  recall,
  reflectMemory,
} from "./memory.js";

export type {
  CognitiveMemory,
  MemoryType,
} from "./memory.js";

export { reflect } from "./reflection.js";
export type { CognitiveInsight } from "./reflection.js";

export { adapt } from "./adaptation.js";
export type {
  AdaptationProposal,
  AdaptationType,
} from "./adaptation.js";

export {
  makeDecision,
  chooseBestDecision,
} from "./decisionEngine.js";

export type {
  CognitiveDecision,
  DecisionRisk,
} from "./decisionEngine.js";

export { evaluateDecision } from "./evaluation.js";
export type {
  CognitiveEvaluation,
  EvaluationInput,
} from "./evaluation.js";

export {
  qreSelfModel,
  reflectSelf,
} from "./selfModel.js";
