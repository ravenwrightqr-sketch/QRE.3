/**
 * =====================================================
 * QRE BEAST REASONING ENGINE
 * =====================================================
 *
 * Understanding
 *        ↓
 * Reasoning
 *        ↓
 * Decision
 *
 * No AI.
 * No database.
 * No execution.
 *
 * The Beast decides what should happen next.
 *
 * =====================================================
 */

import type {
  BeastUnderstanding,
} from "./UnderstandingEngine.js";


export type BeastDecision = {

  action:
    | "continue"
    | "request_information"
    | "reject";


  reason:
    string;


  confidence:
    number;

};




export function reason(

  understanding: BeastUnderstanding

): BeastDecision {


  /**
   * Not enough understanding.
   */
  if(
    understanding.confidence < 0.4
  ){

    return {

      action:
        "request_information",

      reason:
        "The Beast lacks enough context to safely create an experience.",

      confidence:
        understanding.confidence,

    };

  }



  /**
   * Enough context.
   */
  if(
    understanding.confidence >= 0.4
  ){

    return {

      action:
        "continue",

      reason:
        "The Beast understands enough context to continue compilation.",

      confidence:
        understanding.confidence,

    };

  }



  return {

    action:
      "reject",

    reason:
      "Unable to reason from current context.",

    confidence:
      0,

  };

}