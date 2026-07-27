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
 * The Semantic Cortex asks:
 *
 * "What is this experience really about?"
 *
 * RESPONSIBILITIES:
 *
 * - extract human meaning
 * - identify emotional gravity
 * - classify experience archetype
 * - create semantic interpretation
 *
 * DOES NOT KNOW:
 *
 * - database
 * - products
 * - industries
 * - runtime execution
 *
 * =====================================================
 */


import type {

  ExperienceUnderstanding

} from "../models/understandingTypes.js";


import type {

  SemanticInterpretation

} from "@qre/contracts";





export type CortexInterpretation = {


  /**
   * Human reason behind
   * the experience.
   */
  coreNeed:string;



  /**
   * Experience archetype.
   */
  archetype:string;



  /**
   * Emotional progression.
   */
  emotionalArc:string[];



  /**
   * World classification.
   */
  world:string;



  /**
   * Dominant meaning force.
   */
  gravity:string;



  /**
   * Why this experience exists.
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

      cortex.emotionalArc,



    worldSignals:[

      cortex.world

    ],



    cognitiveSignals:[

      cortex.purpose

    ],



    confidence:

      1


  };


}









export function buildSemanticCortex(

  understanding:ExperienceUnderstanding

):CortexInterpretation {


  const emotions =

    understanding.emotions.emotions;



  const memory =

    understanding.memory;



  let archetype =

    "discovery";



  let coreNeed =

    "exploration";



  let gravity =

    "experience";



  let purpose =

    "create meaningful interaction";






  /**
   * MEMORY EXPERIENCES
   */

  if (

    memory.timeCapsule

    ||

    memory.replay

    ||

    memory.legacy

  ) {


    archetype =

      "legacy_memory";



    coreNeed =

      "preserve_connection";



    gravity =

      "memory";



    purpose =

      "turn moments into lasting stories";


  }







  /**
   * EMOTIONAL EXPERIENCES
   */

  if (

    emotions.includes("love")

    ||

    emotions.includes("nostalgia")

  ) {


    gravity =

      "human_connection";


  }







  /**
   * COMMUNITY EXPERIENCES
   */

  if (

    understanding.audience.social ===

      "community"

  ) {


    coreNeed =

      "shared_belonging";



    gravity =

      "collective_experience";


  }







  return {


    coreNeed,


    archetype,



    emotionalArc:[


      "arrival",


      "discovery",


      "connection",


      "reflection"


    ],



    world:

      understanding.world.primary,



    gravity,



    purpose


  };


}