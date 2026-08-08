import {
  compileExperience as compileExperienceEngine,
  compileExperienceNarrative
} from "@qre/engine";


import type {
  ExperienceBlueprint,
  ExperienceNarrative
} from "@qre/contracts";


import type {
  CompiledExperience,

  ExperienceCompilerIntelligence,
  ExperienceGenome,
} from "@qre/contracts";
/**
 * =====================================================
 *
 * QRE EXPERIENCE SERVICE
 *
 * API APPLICATION BOUNDARY
 *
 * Route
 *   ↓
 * Experience Service
 *   ↓
 * Canonical Compiler
 *   ↓
 * Narrative Intelligence
 *   ↓
 * Experience Response
 *
 * =====================================================
 */




export interface CompiledExperienceResult {

  compiled:
    CompiledExperience;


  intelligence:
    ExperienceCompilerIntelligence;


  genome:
    ExperienceGenome;


  blueprint:
    ExperienceBlueprint;


  narrative:
    ExperienceNarrative;

}




/**
 * =====================================================
 *
 * COMPILE EXPERIENCE
 *
 * Human Prompt
 *
 *        ↓
 *
 * Canonical Compiler
 *
 *        ↓
 *
 * Experience Intelligence
 *
 *        ↓
 *
 * Narrative Compiler
 *
 * =====================================================
 */



export async function compileExperience(

  prompt:string

):Promise<CompiledExperienceResult>{



  if(

    typeof prompt !== "string"

    ||

    prompt.trim().length === 0

  ){

    throw new Error(

      "Experience prompt required."

    );

  }




  const compiled =

    compileExperienceEngine(

      prompt.trim()

    );





  if(

    !compiled?.blueprint

  ){

    throw new Error(

      "Compiler did not produce experience blueprint."

    );

  }





  const blueprint =

    compiled.blueprint;






  if(

    !compiled.genome

    ||

    !compiled.world

  ){

    throw new Error(

      "Compiler did not produce experience intelligence."

    );

  }






  const narrative =

    compileExperienceNarrative(

      compiled.genome,

      compiled.world,

      blueprint

    );



  return {

  compiled,


  intelligence:
    compiled.intelligence,


  genome:
    compiled.genome!,


  blueprint,


  narrative

};


}