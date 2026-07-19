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
} from "./../compiler/experienceEnhancer.js";

import {
  analyzeSemanticPrompt,
} from "../semantic/semanticAnalyzer.js";



import {
  detectIntent,
} from "./../compiler/parser/intentDetector.js";


import {
  extractEntities,
} from "./../compiler/parser/entityExtractor.js";


import {
  composeBlueprint,
} from "./../compiler/blueprint/composer.js";


import {
  buildFlowSteps,
} from "./../compiler/flowBuilder.js";


import {
  flowToMoment,
} from "./../moments/flowToMoments.js";


import {
  cinematicRuntime,
} from "./../runtime/cinematic/cinematicRuntime.js";


import type {
  FlowStep,
  ExperienceBlueprint,
  ExperienceModel,
  ExperienceGenome,
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
  entities: ReturnType<typeof extractEntities>,
  prompt: string
): ExperienceGenome {


  const text =
    prompt.toLowerCase();



  function score(
    keywords:string[]
  ):number {


    const matches =
      keywords.filter(
        keyword =>
          text.includes(keyword)
      ).length;


    return Math.min(
      matches / keywords.length,
      1
    );

  }






  function resolveEnergy()
  : ExperienceGenome["energy"] {


    if(
      text.includes("luxury") ||
      text.includes("premium")
    ){

      return "premium";

    }


    if(
      text.includes("mystery") ||
      text.includes("dark") ||
      text.includes("unknown")
    ){

      return "mysterious";

    }


    if(
      text.includes("fun") ||
      text.includes("play")
    ){

      return "playful";

    }


    if(
      text.includes("cinematic") ||
      text.includes("emotional") ||
      text.includes("love")
    ){

      return "emotional";

    }


    if(
      text.includes("intense") ||
      text.includes("extreme")
    ){

      return "intense";

    }


    return "calm";

  }







  function resolvePacing()
  : ExperienceGenome["pacing"] {


    if(
      text.includes("fast") ||
      text.includes("quick")
    ){

      return "fast";

    }


    if(
      text.includes("slow") ||
      text.includes("deep")
    ){

      return "slow";

    }


    return "medium";

  }








  function resolveSocial()
  : ExperienceGenome["social"] {


    if(
      text.includes("community") ||
      text.includes("group") ||
      text.includes("friends")
    ){

      return "community";

    }


    if(
      text.includes("couple") ||
      text.includes("together") ||
      text.includes("partner")
    ){

      return "shared";

    }


    return "solo";

  }








  function resolveJourney()
  : ExperienceGenome["journey"] {


    const journey:
      ExperienceGenome["journey"] =
      [
        "arrival"
      ];



    if(
      score([
        "discover",
        "explore",
        "adventure",
        "journey"
      ]) > 0
    ){

      journey.push(
        "discovery"
      );

    }



    journey.push(
      "reveal"
    );



    if(
      score([
        "memory",
        "story",
        "remember",
        "past"
      ]) > 0
    ){

      journey.push(
        "memory"
      );

    }



    if(
      score([
        "share",
        "community",
        "friends"
      ]) > 0
    ){

      journey.push(
        "share"
      );

    }



    journey.push(
      "return"
    );


    return journey;

  }








  return {


    intent:

      [
        semantic.intent
      ],



    archetypes:

      semantic.themes,



    themes:

      semantic.themes,



    emotions:

      semantic.emotions,



    energy:

      resolveEnergy(),



    pacing:

      resolvePacing(),



    social:

      resolveSocial(),



    journey:

      resolveJourney(),



    discovery:

      score([
        "discover",
        "explore",
        "adventure",
        "mystery"
      ]),



    memory:

      score([
        "memory",
        "remember",
        "story",
        "past"
      ]),



    commerce:

      score([
        "buy",
        "product",
        "shop",
        "restaurant",
        "business"
      ]),



    immersion:

      score([
        "cinematic",
        "world",
        "experience",
        "journey"
      ]),



    interaction:

      score([
        "play",
        "interactive",
        "game",
        "community"
      ]),



    replay:

      score([
        "again",
        "replay",
        "return",
        "share"
      ]),



    entities,



    environments:
      [],



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









export function compileExperienceGenome(
  prompt:string
):CompiledGenomeExperience {


  if(!prompt.trim()){

    throw new Error(
      "Experience prompt cannot be empty"
    );

  }





  const semantic =

    analyzeSemanticPrompt(
      prompt
    );





  const detected =

    detectIntent(
      prompt
    );





  const entities =

    extractEntities(
      prompt
    );





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

      entities,

      prompt

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







export const genomeCompiler =
compileExperienceGenome;