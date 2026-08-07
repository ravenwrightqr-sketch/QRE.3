/**
 * =====================================================
 * QRE COGNITION LOOP CONTRACT
 * =====================================================
 *
 * ROLE:
 *
 * The metacognitive substrate of the Experience Compiler.
 *
 *
 * Cognition Loop does not generate experiences.
 *
 * It observes intelligence systems,
 * evaluates them,
 * detects opportunity,
 * and improves future generation.
 *
 *
 * Architecture:
 *
 * Human Signal
 *      ↓
 * Understanding
 *      ↓
 * Meaning
 *      ↓
 * Intelligence Layers
 *      ↓
 * Cognition Loop
 *      ↓
 * Improved Intelligence
 *
 *
 * The loop gives the compiler:
 *
 * - self evaluation
 * - curiosity
 * - reflection
 * - contradiction detection
 * - memory consolidation
 * - evolutionary direction
 *
 * =====================================================
 */
 import type {
 ExecutiveMemory
} from "./executiveMemory.js";

 import type {
 CognitiveGoal
} from "./cognitiveGoal.js";

/**
 * =====================================================
 * COGNITIVE HYPOTHESIS
 * =====================================================
 */

export interface CognitiveHypothesis {


 statement:string;


 confidence:number;


 source:string;


 significance?:number;


 evidence?:string[];


 alternatives?:string[];


}





/**
 * =====================================================
 * COGNITIVE PREDICTION
 * =====================================================
 */

export interface CognitivePrediction {


 outcome:string;


 probability:number;


 reason:string;


 horizon?:
 | "immediate"
 | "future"
 | "long_term";


 impact?:number;


}





/**
 * =====================================================
 * COGNITIVE INTENT
 * =====================================================
 *
 * What the cognition system
 * is currently trying to discover.
 *
 * =====================================================
 */

export interface CognitiveIntent {


 objective:string;


 motivation:string;


 depth:number;


}





/**
 * =====================================================
 * IDENTITY EVOLUTION
 * =====================================================
 */

export interface IdentityEvolution {


 before:string;


 transition:string;


 after:string;


 driver?:string;


}





/**
 * =====================================================
 * EMOTIONAL ENERGY FIELD
 * =====================================================
 *
 * Semantic forces influencing creation.
 *
 * =====================================================
 */

export interface EmotionalEnergyField {


 love:number;


 curiosity:number;


 trust:number;


 wonder:number;


 belonging:number;


 legacy:number;


 resonance?:number;


}





/**
 * =====================================================
 * COGNITIVE ATTENTION
 * =====================================================
 */

export interface CognitiveAttentionState {


 focus:string;


 priority:number;


 reason:string;


}





/**
 * =====================================================
 * UNCERTAINTY FIELD
 * =====================================================
 *
 * Areas where the compiler needs
 * further exploration.
 *
 * =====================================================
 */

export interface CognitiveUncertainty {


 unknown:string;


 risk:number;


 explorationValue:number;


}





/**
 * =====================================================
 * MEMORY TRACE
 * =====================================================
 */

export interface CognitiveMemoryTrace {


 event:string;


 timestamp:string;


 importance:number;


 consequence:string;


}





/**
 * =====================================================
 * REASONING TRANSITION
 * =====================================================
 *
 * Records how thought changed.
 *
 * =====================================================
 */

export interface CognitiveTransition {


 from:string;


 to:string;


 trigger:string;


}





/**
 * =====================================================
 * QUALITY METRICS
 * =====================================================
 */

export interface CognitiveQualityMetrics {


 coherence:number;


 creativity:number;


 originality:number;


 emotionalDepth:number;


 adaptability:number;


}





/**
 * =====================================================
 * EMERGENCE SIGNAL
 * =====================================================
 */

export interface CognitiveEmergenceSignal {


 discovery:string;


 sourceRelationships:string[];


 novelty:number;


 significance:number;


}





/**
 * =====================================================
 * COGNITIVE QUESTION
 * =====================================================
 *
 * Advanced cognition generates questions,
 * not only answers.
 *
 * =====================================================
 */

export interface CognitiveQuestion {

 question:string;


 category:
 | "meaning"
 | "relationship"
 | "future"
 | "emotion"
 | "risk";


 importance:number;

}



/**
 * =====================================================
 * COGNITIVE DECISION
 * =====================================================
 *
 * Executive selection layer.
 *
 * =====================================================
 */

export interface CognitiveDecision {

 decision:string;


 confidence:number;


 alternatives:string[];


 reason:string;

}



/**
 * =====================================================
 * COGNITIVE STATE TRANSITION
 * =====================================================
 *
 * Tracks evolution of ideas.
 *
 * =====================================================
 */

export interface CognitiveStateTransition {


 from:string;


 to:string;


 trigger:string;


 significance:number;


}

/**
 * =====================================================
 * COGNITIVE RECURSION STATE
 * =====================================================
 *
 * Allows cognition to reason about
 * previous cognition cycles.
 *
 * This creates recursive improvement.
 *
 * =====================================================
 */

export interface CognitiveRecursionState {


 /**
  * Current recursive depth.
  */
 depth:number;



 /**
  * Maximum allowed reasoning depth.
  */
 limit:number;



 /**
  * Previous reasoning cycle summaries.
  */
 previousCycles:string[];



 /**
  * Improvement discovered from recursion.
  */
 recursiveInsights:string[];


}



/**
 * =====================================================
 * COGNITIVE CAUSAL MODEL
 * =====================================================
 *
 * Tracks why things matter.
 *
 * Moves cognition beyond association
 * into causal reasoning.
 *
 * =====================================================
 */

export interface CognitiveCausalLink {


 cause:string;


 effect:string;


 confidence:number;


 explanation:string;


}



/**
 * =====================================================
 * COGNITIVE OPPORTUNITY FIELD
 * =====================================================
 *
 * Detects unrealized potential.
 *
 * =====================================================
 */

export interface CognitiveOpportunity {


 opportunity:string;


 value:number;


 difficulty:number;


 reason:string;


}



/**
 * =====================================================
 * COGNITIVE FAILURE SIGNAL
 * =====================================================
 *
 * Allows self correction.
 *
 * =====================================================
 */

export interface CognitiveFailureSignal {


 problem:string;


 severity:number;


 correction:string;


}

/**
 * =====================================================
 * COGNITIVE EVOLUTION STATE
 * =====================================================
 *
 * Complete self-model of compiler cognition.
 *
 * =====================================================
 */

export interface CognitiveEvolutionState {


 /**
  * Current reasoning generation.
  */
 iteration:number;



 /**
  * Overall confidence.
  */
 confidence:number;



 /**
  * Internal coherence.
  */
 stability:number;



 /**
  * Creative novelty.
  */
 novelty:number;



 /**
  * Current cognitive phase.
  */
 phase?:
 | "hypothesis"
 | "reflection"
 | "curiosity"
 | "attention"
 | "critique"
 | "revision"
 | "consolidation"
 | "synthesis"
 | "complete";

   /**
  * Internal optimization targets.
  */
 goals?:
 CognitiveGoal[];



 /**
  * Questions cognition is attempting
  * to answer.
  */
 questions?:
 CognitiveQuestion[];



 /**
  * Executive choices.
  */
 decisions?:
 CognitiveDecision[];



 /**
  * Recursive self improvement.
  */
 recursion?:
 CognitiveRecursionState;



 /**
  * Cause and effect understanding.
  */
 causalModel?:
 CognitiveCausalLink[];



 /**
  * Detected expansion opportunities.
  */
 opportunities?:
 CognitiveOpportunity[];



 /**
  * Self correction signals.
  */
 failures?:
 CognitiveFailureSignal[];



 /**
  * Intelligence operating mode.
  */
 mode?:
 | "exploration"
 | "creation"
 | "evaluation"
 | "optimization"
 | "evolution";


 /**
  * Current cognitive objective.
  */
 intent?:
 CognitiveIntent;



 /**
  * Generated possibilities.
  */
 hypotheses:
 CognitiveHypothesis[];



 /**
  * Future simulations.
  */
 predictions:
 CognitivePrediction[];



 /**
  * Identity transformation.
  */
 identities:
 IdentityEvolution[];



 /**
  * Emotional semantic field.
  */
 energy:
 EmotionalEnergyField;



 /**
  * Active focus.
  */
 attention?:
 CognitiveAttentionState;



 /**
  * Unknown areas.
  */
 uncertainty?:
 CognitiveUncertainty[];



 /**
  * Detected contradictions.
  */
 contradictions:
 string[];



 /**
  * Thought evolution history.
  */
 history:
 string[];



 /**
  * Reasoning transitions.
  */
 transitions?:
 CognitiveTransition[];



 /**
  * Memory created by cognition.
  */
 memoryTrace?:
 CognitiveMemoryTrace[];



 /**
  * Quality evaluation.
  */
 quality?:
 CognitiveQualityMetrics;



 /**
  * Unexpected discoveries.
  */
 emergence?:
 CognitiveEmergenceSignal[];

  /**
  * Previous executive decisions.
  */
 executiveMemory?:
 ExecutiveMemory[];

 /**
  * Curiosity intelligence output.
  */
 curiosity?:
 unknown;



 /**
  * Consolidated learning.
  */
 consolidatedMemory?:
 unknown;



 /**
  * Future improvements.
  */
 improvements?:
 string[];



 /**
  * Reflection notes.
  */
 reflections?:
 string[];



 /**
  * Last cognitive operation.
  */
 lastAction?:
 string;


}