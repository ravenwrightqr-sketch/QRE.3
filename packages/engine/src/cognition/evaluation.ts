/**
 * =====================================================
 * QRE COGNITION EVALUATION ENGINE
 * =====================================================
 *
 * Decision
 *      ↓
 * Outcome
 *      ↓
 * Evaluation
 *      ↓
 * Learning Signal
 *
 * Responsibilities:
 *
 * - Measure decision quality
 * - Compare expectation vs reality
 * - Produce learning feedback
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  CognitiveDecision,
} from "./decisionEngine.js";



export type CognitiveEvaluation = {


  id:string;


  decisionId:string;


  success:boolean;


  score:number;


  lesson:string;


};






export type EvaluationInput = {


  decision:
    CognitiveDecision;


  outcome:
    string;


  success:
    boolean;


};








export function evaluateDecision(

  input:EvaluationInput

):CognitiveEvaluation {


  return {


    id:

      crypto.randomUUID(),



    decisionId:

      input.decision.id,



    success:

      input.success,



    score:

      input.success

        ? input.decision.confidence

        : 1 - input.decision.confidence,



    lesson:

      input.success

        ? "Decision pattern produced positive results."

        : "Decision pattern requires adjustment.",


  };


}