/**
 * =====================================================
 * QRE SEMANTIC CORTEX
 * =====================================================
 *
 * Understanding
 *       ↓
 * Meaning
 *       ↓
 * Interpretation
 *
 *
 * The Semantic Cortex extracts meaning signals.
 *
 * It does not invent experience categories.
 *
 *
 * NO DATABASE
 * NO PRODUCTS
 * NO INDUSTRIES
 * NO RUNTIME
 *
 * =====================================================
 */

import type {

  ExperienceUnderstanding

} from "@qre/contracts"


import type {

  SemanticInterpretation

} from "@qre/contracts";



export type CortexInterpretation = {


  /**
   * Primary human motivation signal.
   */
  coreNeed:string;



  /**
   * Confidence of interpretation.
   */
  confidence:number;



  /**
   * Semantic archetype signal.
   */
  archetype:string;



  /**
   * Existing emotional signals.
   */
  

  experienceTrajectory:string[];

  /**
   * Experience world.
   */
  world:string;



  /**
   * Dominant semantic gravity.
   */
  gravity:string;



  /**
   * Human purpose signal.
   */
  purpose:string;


};


export function toSemanticInterpretation(

  cortex:CortexInterpretation

):SemanticInterpretation {


return {


  intent:[

    cortex.coreNeed

  ],



  concepts:[

    cortex.archetype,

    cortex.gravity

  ],



  emotionalSignals:

    cortex.experienceTrajectory,



  worldSignals:[

    cortex.world

  ],



  cognitiveSignals:[

    cortex.purpose

  ],



  confidence:

    cortex.confidence


};


}









export function buildSemanticCortex(

 understanding:ExperienceUnderstanding

):CortexInterpretation {


if(!understanding){

 throw new Error(

  "Experience understanding required."

 );

}





const emotions =

  understanding.emotions.emotions
  ??
  [];





let archetype =

  "experience";





let coreNeed =

  "create meaning";





let gravity =

  "human significance";





let purpose =

  "express discovered meaning";








/**
 * =====================================================
 *
 * MEMORY SIGNAL
 *
 * Uses discovered memory information.
 *
 * =====================================================
 */


if(

 understanding.memory.timeCapsule

 ||

 understanding.memory.replay

 ||

 understanding.memory.legacy

){


 archetype =

  "memory";



 coreNeed =

  "preserve meaning";



 gravity =

  "memory significance";



 purpose =

  "extend meaning beyond the original moment";


}

/**
 * =====================================================
 *
 * SOCIAL SIGNAL
 *
 * =====================================================
 */


if(

 understanding.audience.social === "community"

){


 coreNeed =

  "shared meaning";



 gravity =

  "collective significance";


}

/**
 * =====================================================
 *
 * EMOTION SIGNAL
 *
 * Adds weight without replacing meaning.
 *
 * =====================================================
 */


if(

 emotions.length

){


 gravity =

  emotions.join(",");


}

return {


coreNeed,


confidence:

  emotions.length

  ?

  0.7

  :

  0.5,



archetype,



experienceTrajectory:

  emotions,



world:

  understanding.world.primary,



gravity,



purpose



};


}