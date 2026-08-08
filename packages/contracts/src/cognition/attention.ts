/**
 * =====================================================
 * QRE COGNITIVE ATTENTION CONTRACT
 * =====================================================
 *
 * ROLE:
 *
 * Defines how the compiler decides what deserves
 * deeper cognitive processing.
 *
 *
 * Attention is the resource allocation layer
 * of intelligence.
 *
 *
 * Signals enter.
 *
 * Attention evaluates:
 *
 * - relevance
 * - novelty
 * - emotional importance
 * - future impact
 * - uncertainty
 * - conflict
 *
 *
 * The cognition loop uses this output to decide
 * where reasoning effort should be applied.
 *
 *
 * Pipeline:
 *
 * Signals
 *    ↓
 * Attention Evaluation
 *    ↓
 * Cognitive Focus
 *    ↓
 * Deeper Reasoning
 *
 * =====================================================
 */



export interface Attention {


 /**
  * All available signals.
  */
 signals:string[];



 /**
  * Signals selected for deeper processing.
  */
 selected:string[];



 /**
  * Overall attention priority.
  *
  * 0 - 1
  */
 priority:number;



 /**
  * Explanation of selection.
  */
 reason:string;




 /**
  * How surprising the signal is.
  *
  * 0 - 1
  */
 novelty:number;



 /**
  * Emotional significance.
  *
  * 0 - 1
  */
 emotionalWeight:number;



 /**
  * Expected future consequence.
  *
  * 0 - 1
  */
 futureImpact:number;



 /**
  * Internal disagreement/conflict.
  *
  * 0 - 1
  */
 conflictLevel:number;



 /**
  * Confidence in attention decision.
  *
  * 0 - 1
  */
 confidence:number;



 /**
  * Ranked focus order.
  */
 ranking?:{


  signal:string;


  score:number;


 }[];


}