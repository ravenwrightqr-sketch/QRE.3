/**
 * =====================================================
 * QRE EXPERIENCE COMPILER
 * =====================================================
 *
 * Prompt
 *      ↓
 * Prompt Parser
 *      ↓
 * Intent Detection
 *      ↓
 * Entity Extraction
 *      ↓
 * Blueprint Composer
 *      ↓
 * Flow Builder
 *      ↓
 * Executable FlowSteps
 *      ↓
 * Runtime Moments
 *      ↓
 * Cinematic Scenes
 *
 * =====================================================
 */


import {
  buildFlowSteps,
} from "./flowBuilder.js";


import {
  parseExperiencePrompt,
  type ExperienceIntent,
} from "./promptParser.js";


import {
  detectIntent,
} from "./parser/intentDetector.js";


import {
  extractEntities,
} from "./parser/entityExtractor.js";


import {
  composeBlueprint,
} from "./blueprint/composer.js";


import {
  flowToMoment,
} from "../moments/flowToMoments.js";


import {
  cinematicRuntime,
} from "../runtime/cinematic/cinematicRuntime.js";


import type {
  FlowStep,
  ExperienceBlueprint,
  Moment,
  CinematicScene,
} from "@qre/contracts";



export type CompiledExperience = {

  title: string;

  industry:
    ExperienceIntent["industry"];

  blueprint:
    ExperienceBlueprint;

  flowSteps:
    FlowStep[];

  moments:
    Moment[];

  cinematicScenes:
    CinematicScene[];

  estimatedDuration:
    number;

  momentCount:
    number;

};







function estimateDuration(
  steps: FlowStep[]
): number {


  let total = 0;



  for (const step of steps) {


    switch(step.type) {


      case "message":

        total += 1800;

        break;



      case "redirect":

        total += 2500;

        break;



      case "location":

        total += 2200;

        break;



      case "timer":

        total += Number(
          step.payload.duration ?? 0
        );

        break;



      case "payment":

        total += 3000;

        break;



      default:

        total += 1000;

        break;

    }

  }


  return total;

}









/**
 * =====================================================
 * PUBLIC COMPILER ENTRY
 * =====================================================
 */

export function experienceCompiler(
  prompt: string
): CompiledExperience {



  if (!prompt.trim()) {

    throw new Error(
      "Experience prompt cannot be empty"
    );

  }







  /**
   * 1.
   * Human language
   * structured industry + instructions
   */

  const intent =
    parseExperiencePrompt(
      prompt
    );









  /**
   * 2.
   * Detect deeper intent signals
   */

  const detected =
    detectIntent(
      prompt
    );









  /**
   * 3.
   * Extract entities
   */

  const entities =
    extractEntities(
      prompt
    );









  /**
   * 4.
   * Industry template selection
   */

  const blueprint =
    composeBlueprint(
       
      detected,

      entities,

      prompt

    );
     








  /**
   * 5.
   * Blueprint → executable runtime steps
   */

  const flowSteps =
    buildFlowSteps(
      blueprint
    );

console.log("\nFLOW STEPS");

console.table(
  flowSteps.map(step => ({
    type: step.type,
    component: (step.payload as any)?.component,
    momentType: (step.payload as any)?.momentType,
    action: (step.payload as any)?.action,
  }))
);






  /**
   * 6.
   * Runtime preview generation
   *
   * SAME PIPELINE AS SCAN ENGINE
   */

  const moments =
    flowToMoment(
      flowSteps
    );

   console.log("\nRUNTIME MOMENTS");

console.table(
  moments.map(moment => ({
    type: moment.type,
    order: moment.order,
  }))
);

  const cinematicScenes =
    cinematicRuntime({

      moments,

      geoStory:
        null,

    });









  return {


    title:
      intent.title,



    industry:
      detected.industry,



    blueprint,



    flowSteps,



    moments,



    cinematicScenes,



    estimatedDuration:
      estimateDuration(
        flowSteps
      ),



    momentCount:
      flowSteps.length,


  };


}