/**
 * =====================================================
 * QRE COGNITIVE EXECUTIVE CONTRACT
 * =====================================================
 *
 * ROLE:
 *
 * Defines the decision layer controlling
 * cognition activation.
 *
 *
 * The Executive does not create intelligence.
 *
 * It decides:
 *
 * - what intelligence should run
 * - how deeply cognition should explore
 * - when reflection is needed
 * - when consolidation is justified
 *
 *
 * =====================================================
 */


export interface CognitiveExecutionPlan {


 /**
  * Activate attention analysis.
  */
 runAttention:boolean;



 /**
  * Generate possible interpretations.
  */
 runHypothesis:boolean;



 /**
  * Analyze meaning.
  */
 runReflection:boolean;



 /**
  * Explore unknown possibilities.
  */
 runCuriosity:boolean;



 /**
  * Challenge assumptions.
  */
 runCritic:boolean;



 /**
  * Store important learning.
  */
 runConsolidation:boolean;



 /**
  * Recursive cognition depth.
  */
 depth:number;



 /**
  * Why this strategy was selected.
  */
 reason:string;


}
export interface ExecutiveDecision {

 action:
 | "investigate"
 | "simulate"
 | "explore"
 | "strengthen_memory"
 | "continue"
 | "rewrite"
 | "synthesize";


 reason:string;


 priority:number;


 confidence:number;


 risks:string[];


 alternatives:string[];


 nextSystem?:
 | "curiosity"
 | "simulation"
 | "memory"
 | "narrative"
 | "world"
 | "runtime";


}