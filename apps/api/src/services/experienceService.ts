import {
  experienceCompiler,
} from "@qre/engine";


/**
 * =====================================================
 *
 * EXPERIENCE SERVICE
 *
 * API application boundary
 *
 * Route
 *   ↓
 * Experience Service
 *   ↓
 * Engine Compiler
 *
 * Routes do not directly own
 * experience generation.
 *
 * =====================================================
 */


export type CompiledExperienceResult = {

  title:string;

  blueprint:any;

  flowSteps:any[];

  moments:any[];

  cinematicScenes:any[];

  estimatedDuration:number;

  momentCount:number;

  [key:string]:unknown;

};




/**
 * =====================================================
 *
 * COMPILE EXPERIENCE
 *
 * Human prompt
 *       ↓
 * Experience Compiler
 *       ↓
 * Runtime-ready experience data
 *
 * No database writes.
 *
 * =====================================================
 */


export async function compileExperience(
  prompt:string
):Promise<CompiledExperienceResult>{


  if(
    typeof prompt !== "string" ||
    prompt.trim().length === 0
  ){

    throw new Error(
      "Experience prompt required"
    );

  }



  const result =
    await experienceCompiler(
      prompt.trim()
    );



  return result as CompiledExperienceResult;

}