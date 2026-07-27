/**
 * =====================================================
 * QRE EXPERIENCE GENOME COMPILER
 * =====================================================
 *
 * Production Experience Compiler
 *
 * Pipeline:
 *
 * Prompt
 *   ↓
 * Experience Genome
 *   ↓
 * Experience World
 *   ↓
 * Experience Blueprint
 *   ↓
 * Runtime Flow
 *   ↓
 * Moments
 *   ↓
 * Cinematic Runtime
 *
 *
 * Genome = creative DNA
 * World = universe/context
 * Blueprint = composed experience
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 *
 * =====================================================
 */


import {

  composeWorld

} from "../world/worldComposer.js";

import {
  buildExperienceGenome,
} from "../compiler/semantic/genome/genomeBuilder.js";

import type {
  CinematicScene,
} from "@qre/contracts";


import {

  composeBlueprint,

} from "./blueprintComposer.js";


import {

  blueprintToFlow,

} from "./blueprintToFlow.js";


import {

  flowToMoment,

} from "../moments/flowToMoments.js";


import type {

  ExperienceBlueprint,
  ExperienceGenome,
  ExperienceModel,
  ExperienceWorld,
  FlowStep,
  ExperienceMoment,
  
} from "@qre/contracts";








/**
 * =====================================================
 * COMPILED EXPERIENCE RESULT
 * =====================================================
 */


export type CompiledGenomeExperience = {


  genome:
    ExperienceGenome;

   cinematicScenes: CinematicScene[];
  
  
  world:
    ExperienceWorld;

  blueprint:
    ExperienceBlueprint;

  flowSteps:
    FlowStep[];
  
  

  moments:
    ExperienceMoment[];

  model:
    ExperienceModel;

  title:
    string;

  estimatedDuration:
    number;

  momentCount:
    number;


};









/**
 * =====================================================
 * MODEL BUILDER
 * =====================================================
 */


function createExperienceModel(

  blueprint:ExperienceBlueprint,

  prompt:string

):ExperienceModel {


return {

  title:
    blueprint.title,


  description:
    prompt,


  industry:
    "generic",


  goal:
    "welcome",


  tone:
    blueprint.tone,


  moments:
    blueprint.moments,


  metadata:{

    category:
      blueprint.type,


    tags:[

      "compiled",

      "experience-genome",

      "world-engine",

      "cinematic"

    ]

  }

};


}


/**
 * =====================================================
 * MAIN COMPILER
 * =====================================================
 */


export function compileExperienceGenome(

  prompt:string

):CompiledGenomeExperience {



if(
 !prompt.trim()
){

 throw new Error(
  "Experience prompt required."
 );

}

/**
 * =====================================================
 *
 * 1. HUMAN UNDERSTANDING
 *
 * Prompt → Genome
 *
 * =====================================================
 */

const genome =

  buildExperienceGenome(
    prompt
  );

/**
 * =====================================================
 *
 * 2. WORLD CREATION
 *
 * Genome → World
 *
 * =====================================================
 */


const world =

  composeWorld(
    genome
  );

/**
 * =====================================================
 *
 * 3. BLUEPRINT CREATION
 *
 * Genome + World → Blueprint
 *
 * =====================================================
 */


const blueprint =

  composeBlueprint(
    genome
  );

/**
 * =====================================================
 *
 * 4. FLOW COMPILATION
 *
 * Blueprint → Runtime Steps
 *
 * =====================================================
 */


const flowSteps =

  blueprintToFlow(
    blueprint
  );

/**
 * =====================================================
 *
 * 5. MOMENT CREATION
 *
 * Flow → Moments
 *
 * =====================================================
 */


const moments =

  flowToMoment(
    flowSteps
  );

/**
 * =====================================================
 *
 * 6. CINEMATIC RUNTIME
 *
 * Moments → Scenes
 *
 * =====================================================
 */
  const cinematicScenes: CinematicScene[] = [];

/**
 * =====================================================
 *
 * 7. EXPERIENCE MODEL
 *
 * =====================================================
 */

const model =

  createExperienceModel(

    blueprint,

    prompt

  );

return {


  genome,


  world,


  blueprint,


  flowSteps,


  moments,

   cinematicScenes,


  model,

  title:

    blueprint.title,

  estimatedDuration:

    moments.length * 5,

  momentCount:

    moments.length,


};


}









/**
 * =====================================================
 * PUBLIC EXPORT
 * =====================================================
 */


export const genomeCompiler =

  compileExperienceGenome;