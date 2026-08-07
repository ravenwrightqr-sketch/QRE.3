/**
 * =====================================================
 * QRE COMPILER BRAIN PUBLIC BOUNDARY
 * =====================================================
 *
 * Creative Intelligence Layer.
 *
 * Human Prompt
 *      ↓
 * Understanding
 *      ↓
 * Meaning
 *      ↓
 * World
 *      ↓
 * Experience Architecture
 *
 * NO DATABASE
 * NO RUNTIME
 * NO API
 *
 * This is the creative mind.
 *
 * =====================================================
 */ 

export {
  understandExperience,
  buildMeaningContext,
} from "@qre/cognition";
/**
 * Semantic Intelligence
 */

export * from "./semantic/index.js";


/**
 * Narrative Arc Intelligence
 */


export * from "./arc/index.js";


/**
 * Meaning Intelligence
 */
export * from "./kaivo/index.js";
export * from "./orion/index.js";

export * from "./revik/index.js";

export * from "./nuvo/index.js";
/**
 * Narrative Intelligence
 */

export * from "./mythos/index.js";

export * from "./verse/index.js";


/**
 * Higher Reasoning
 */

export * from "./synthesis/index.js";

export * from "./reflection/index.js";

export * from "./simulation/index.js";

export * from "./thinker/index.js";

/**
 * World Modeling
 */

export * from "./world/index.js";
///MASTER COMPILER BRAIN
export {
  runCompilerBrain,
} from "./compilerBrain.js";

export type {
  CompilerBrainResult,
} from "./compilerBrain.js";
///////////////////////////////////

export {
 createMemoryReveal
} from "./memoryRevealCompiler.js";



export * from "./moverArc/index.js";


export {
  buildMoverArc,
  buildMoverTopology
} from "./moverArc/index.js";

export {
  buildCognitiveTrace
} from "./cognitiveTrace/index.js";

/**
 * Experience Genome Intelligence
 */

export * from "./semantic/genome/index.js";


/**
 * Object Intelligence
 */

export * from "./object/index.js";


/**
 * Lifecycle Intelligence
 */

export * from "./lifecycle/index.js";

export * from "./narrative/index.js";

export * from "./executive/index.js";

export * from "./domain/index.js";

export * from "./cognitionLoop/index.js";


export * from "./experienceRenderer/index.js";