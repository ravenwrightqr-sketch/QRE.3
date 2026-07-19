/**
 * =====================================================
 * QRE COGNITION KERNEL
 * =====================================================
 *
 * Central cognition coordinator.
 *
 * Experience
 *      ↓
 * Memory
 *      ↓
 * Reflection
 *      ↓
 * Adaptation
 *      ↓
 * Decision
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * The kernel thinks.
 * Runtime acts.
 *
 * =====================================================
 */
import {
  remember,
  recall,
} from "./memory.js";


import type {
  MemoryType,
} from "./memory.js";



import {

  reflect,

} from "./reflection.js";


import {

  adapt,

} from "./adaptation.js";


import {

  makeDecision,

  chooseBestDecision,

} from "./decisionEngine.js";



export type CognitionInput = {


  type:
    MemoryType;


  summary:
    string;


  context?:
    Record<string, unknown>;


  confidence:
    number;


};






export type CognitionResult = {


  memories:number;


  insights:number;


  adaptations:number;


  decisions:number;


  bestDecision:


    ReturnType<typeof chooseBestDecision>;


};








export function processCognition(

 input:CognitionInput

):CognitionResult {



  remember({

  type:

    input.type,


  summary:

    input.summary,


  confidence:

    input.confidence,


  context:

    input.context,


});





  const memories =

    recall();





  const insights =

    reflect(

      memories

    );





  const adaptations =

    adapt(

      insights

    );





  const decisions =

    makeDecision(

      adaptations

    );





  const bestDecision =

    chooseBestDecision(

      decisions

    );





  return {


    memories:

      memories.length,



    insights:

      insights.length,



    adaptations:

      adaptations.length,



    decisions:

      decisions.length,



    bestDecision,


  };


}