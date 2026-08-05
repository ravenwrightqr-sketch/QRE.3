/**
 * =====================================================
 * ORIGIN FIELD EXPORTS
 * =====================================================
 *
 * The foundational cognition layer.
 *
 * Origin
 *    ↓
 * World Model
 *    ↓
 * Reflection
 *    ↓
 * Evolution
 *
 * Public boundary only.
 *
 * =====================================================
 */

export {

 evolve,

} from "./evolutionEngine.js";


export type {

 EvolutionState,

} from "./evolutionEngine.js";
export type {
  OriginField,
} from "./originField.js";


export {
  buildBeginningModel,
} from "./beginningModel.js";


export type {
  BeginningModel,
} from "./beginningModel.js";


export {
  reflect,
} from "./reflectionEngine.js";


export type {
  ReflectionResult,
} from "./reflectionEngine.js";

export {
  buildMemoryField,
} from "./memoryField.js";


export type {
  MemoryField,
} from "./memoryField.js";

export {
 runOriginLoop,
} from "./originLoop.js";


export type {
 OriginState,
} from "./originLoop.js";

export {
 synthesizeOrigin,
} from "./synthesisEngine.js";


export type {
 OriginSynthesis,
} from "./synthesisEngine.js";

export {
 generateVoice,
} from "./voiceEngine.js";


export type {
 OriginVoice,
} from "./voiceEngine.js";

export {

 createContextVoice

} from "./contextVoice.js";


export type {

 ContextVoice

} from "./contextVoice.js";

export {

 createNarrative

} from "./narrativeEngine.js";


export type {

 OriginNarrative

} from "./narrativeEngine.js";

export {

 createScenes

} from "./sceneEngine.js";


export type {

 OriginScene

} from "./sceneEngine.js";

export {

 evolveScene

} from "./stateEngine.js";


export type {

 ExperienceState

} from "./stateEngine.js";

export {

 createMemory

} from "./memoryEngine.js";


export type {

 OriginMemory

} from "./memoryEngine.js";

export {

 analyzeResonance

} from "./resonanceEngine.js";


export type {

 MemoryResonance

} from "./resonanceEngine.js";

export {

 evolveMeaning

} from "./adaptiveEngine.js";


export type {

 AdaptiveEvolution

} from "./adaptiveEngine.js";

export {

 generateFuture

} from "./generationEngine.js";


export type {

 GeneratedFuture

} from "./generationEngine.js";

export {

 evaluateExperience

} from "./evaluationEngine.js";


export type {

 ExperienceEvaluation

} from "./evaluationEngine.js";

export {

 runOrigin

} from "./originEngine.js";