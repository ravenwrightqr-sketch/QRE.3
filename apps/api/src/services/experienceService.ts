import {
  runCompilerBrain,
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
 * Compiler Brain
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
 * Compiler Brain
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




  const result =

    runCompilerBrain(

      prompt.trim()

    );





  if(

    !result.compiled?.blueprint

  ){

    throw new Error(

      "Compiler did not produce experience blueprint."

    );

  }





  const blueprint =

    result.compiled.blueprint;






  if(

    !result.compiled.genome

    ||

    !result.compiled.world

  ){

    throw new Error(

      "Compiler did not produce experience intelligence."

    );

  }






  const narrative =

    compileExperienceNarrative(

      result.compiled.genome,

      result.compiled.world,

      blueprint

    );



  return {

  compiled:
    result.compiled,


  intelligence:
    result.compiled.intelligence,


  genome:
    result.compiled.genome!,


  blueprint,


  narrative

};


}