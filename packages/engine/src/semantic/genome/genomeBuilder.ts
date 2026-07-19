/**
 * =====================================================
 * QRE SEMANTIC GENOME COMPILER
 * =====================================================
 *
 * Prompt
 *    ↓
 * Semantic Understanding
 *    ↓
 * Experience Genome
 *    ↓
 * Intent Intelligence
 *    ↓
 * Entity Intelligence
 *    ↓
 * Blueprint Composer
 *    ↓
 * Flow Builder
 *    ↓
 * Runtime Moments
 *    ↓
 * Cinematic Runtime
 *
 * =====================================================
 */

import {
  enhanceExperience,
} from "../../compiler/experienceEnhancer.js";


import {
  analyzeSemanticPrompt,
} from "../semanticAnalyzer.js";


import {
  detectIntent,
} from "../../compiler/parser/intentDetector.js";


import {
  extractEntities,
} from "../../compiler/parser/entityExtractor.js";


import {
  composeBlueprint,
} from "../../compiler/blueprint/composer.js";


import {
  buildFlowSteps,
} from "../../compiler/flowBuilder.js";


import {
  flowToMoment,
} from "../../moments/flowToMoments.js";


import {
  cinematicRuntime,
} from "../../runtime/cinematic/cinematicRuntime.js";


import type {
  FlowStep,
  ExperienceBlueprint,
  ExperienceModel,
  ExperienceGenome,
  ExperienceEntities,
  Moment,
  CinematicScene,
} from "@qre/contracts";






export type CompiledGenomeExperience = {

  genome: ExperienceGenome;

  model: ExperienceModel;

  blueprint: ExperienceBlueprint;

  flowSteps: FlowStep[];

  moments: Moment[];

  cinematicScenes: CinematicScene[];

};


function createGenome(
  semantic: ReturnType<typeof analyzeSemanticPrompt>,
  entities: ExperienceEntities
): ExperienceGenome {







  return {

    intent: [
      semantic.intent,
    ],


    archetypes:
      semantic.themes,


    themes:
      semantic.themes,


    emotions:
      semantic.emotions,


    energy:
      "emotional",


    pacing:
      "medium",


    social:
      semantic.audience.length
        ? "community"
        : "solo",


    journey: [
      "discovery",
    ],


    discovery: 0.5,

    memory: semantic.themes.includes("memory")
      ? 1
      : 0.5,


    commerce: semantic.themes.includes("commerce")
      ? 1
      : 0,


    immersion: semantic.experienceDNA.includes("cinematic")
      ? 1
      : 0.5,


    interaction: 0.5,


    replay: 0.5,


    entities,


    environments: [],


    audience:
      semantic.audience,


  };

}









function createExperienceModel(
  blueprint: ExperienceBlueprint,
  prompt:string
):ExperienceModel {


  return {

    title:
      blueprint.title,


    description:
      prompt,


    industry:
      blueprint.industry,


    goal:
      blueprint.goal,


    tone:
      blueprint.tone,


    moments:
      blueprint.moments,


    metadata: {

      category:
        blueprint.industry,


      tags:[

        "compiled",

        "semantic",

        "genome"

      ]

    }

  };

}

export function buildExperienceGenome(
  prompt:string
):CompiledGenomeExperience {


  if(!prompt.trim()){

    throw new Error(
      "Experience prompt cannot be empty"
    );

  }

  /**
   * HUMAN MEANING LAYER
   */

  const semantic =
    analyzeSemanticPrompt(
      prompt
    );






  /**
   * BUSINESS / EXPERIENCE INTELLIGENCE
   */

  const detected =
    detectIntent(
      prompt
    );






  /**
   * ENTITY INTELLIGENCE
   */

  const entities =
    extractEntities(
      prompt
    );






  /**
   * EXPERIENCE BLUEPRINT
   */

  const enhancement =
    enhanceExperience({

      prompt,

      industry:
        detected.industry,

      intent:
        detected.goal,

    });





  const blueprint =
    composeBlueprint(

      detected,

      entities,

      prompt,

      enhancement,

      semantic

    );

  const genome =
    createGenome(
      semantic,
      entities
    );

  const flowSteps =
    buildFlowSteps(
      blueprint
    );

  const moments =
    flowToMoment(
      flowSteps
    );


  const cinematicScenes =
    cinematicRuntime({

      moments,

      geoStory:null

    });






  const model =
    createExperienceModel(

      blueprint,

      prompt

    );






  return {

    genome,

    model,

    blueprint,

    flowSteps,

    moments,

    cinematicScenes

  };


}






/**
 * Backwards compatible alias
 */
export const genomeBuilder =
buildExperienceGenome;