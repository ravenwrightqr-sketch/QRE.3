/**
 * =====================================================
 * QRE COGNITION CORE INDEX
 * =====================================================
 *
 * Public cognition boundary.
 *
 * The brain has organs.
 * This is the nervous system interface.
 *
 * =====================================================
 */


// Kernel

export {
  processCognition,
} from "./cognitionKernel.js";


export type {
  CognitionInput,
  CognitionResult,
} from "./cognitionKernel.js";




// Memory

export {
  remember,
  recall,
  reflectMemory,
} from "./memory.js";


export type {
  CognitiveMemory,
  MemoryType,
} from "./memory.js";




// Reflection

export {
  reflect,
} from "./reflection.js";


export type {
  CognitiveInsight,
} from "./reflection.js";




// Adaptation

export {
  adapt,
} from "./adaptation.js";


export type {
  AdaptationProposal,
  AdaptationType,
} from "./adaptation.js";




// Decision

export {
  makeDecision,
  chooseBestDecision,
} from "./decisionEngine.js";


export type {
  CognitiveDecision,
  DecisionRisk,
} from "./decisionEngine.js";



// Evaluation

export {
  evaluateDecision,
} from "./evaluation.js";


export type {
  CognitiveEvaluation,
  EvaluationInput,
} from "./evaluation.js";




// Self Model

export {
  qreSelfModel,
  reflectSelf,
} from "./selfModel.js";