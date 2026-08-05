import {
  composeWorld,
} from "../world/worldComposer.js";

import {
  buildExperienceGenome,
} from "../compiler/semantic/genome/genomeBuilder.js";

import {
  composeBlueprint,
} from "./blueprintComposer.js";

import {
  experienceDirector,
} from "./director.js";

import {
  blueprintToFlow,
} from "./blueprintToFlow.js";


import {
  flowToMoment,
} from "../moments/flowToMoments.js";

import {
  compileCinematicScenes,
} from "../cinematic/cinematicCompiler.js";

import {
  synthesizeCognitiveExperience,
} from "../compiler/cognitiveSynthesis.js";

import {
  understandExperience,
} from "../compiler/understanding/index.js";

import {
  buildMeaningContext,
} from "../compiler/meaningEngines/meaningContextEngine.js";


/**
 * =====================================================
 *
 * CONTRACT TYPES
 *
 * =====================================================
 */

import type {

  CompilerMind,
  CompiledExperience,
  ExperienceBlueprint,
  ExperienceCompilerIntelligence,
  ExperienceGenome,
  ExperienceMeaningContext,
  ExperienceModel,
  ExperienceUnderstanding,
  ExperienceWorld,
  FlowStep,
  ExperienceMoment,
  ExperienceCompileContext,

} from "@qre/contracts";


/**
 * =====================================================
 *
 * MODEL BUILDER
 *
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

  "discovery",


 tone:

  blueprint.tone,


 moments:

  blueprint.moments,


 metadata:{

  category:

   blueprint.type,


  tags:[

   "cognitive-synthesis",

   "semantic-compiler",

   "experience-genome",

   "cinematic-runtime"

  ]

 }

};


}

/**
 * =====================================================
 *
 * ID GENERATOR
 *
 * =====================================================
 */


function createCompilerId():string {


return (

 globalThis.crypto?.randomUUID?.()

 ??

 `experience-${Date.now()}-${Math.random()
 .toString(36)
 .slice(2)}`

);


}

function isExperienceUnderstanding(
  value:unknown
):value is ExperienceUnderstanding {

  return (
    typeof value === "object"
    && value !== null
    && "intent" in value
    && "emotions" in value
    && "world" in value
  );

}

function isExperienceMeaningContext(
  value:unknown
):value is ExperienceMeaningContext {

  return (
    typeof value === "object"
    && value !== null
    && "meanings" in value
    && "humanDesires" in value
    && "narrativePotential" in value
  );

}

function isExperienceGenome(
  value:unknown
):value is ExperienceGenome {

  return (
    typeof value === "object"
    && value !== null
    && "meaning" in value
    && "entities" in value
    && "themes" in value
  );

}

/**
 * =====================================================
 *
 * MAIN COGNITIVE COMPILER
 *
 * =====================================================
 */

export function compileExperienceGenome(

 prompt:string,

 context?:ExperienceCompileContext

):CompiledExperience {



if(!prompt.trim()){

 throw new Error(
  "Experience prompt required."
 );

}
/**
 * =====================================================
 *
 * FOUNDATION COGNITION INPUT
 *
 * Understanding + Meaning Context
 *
 * These are required CompilerMind inputs.
 *
 * Cognitive synthesis owns all downstream intelligence.
 *
 * =====================================================
 */


/**
 * =====================================================
 *
 * 2. EXPERIENCE GENOME
 *
 * Creative DNA.
 *
 * =====================================================
 */
 /**
 * =====================================================
 *
 * EXPERIENCE GENOME
 *
 * Creative DNA Substrate
 *
 * =====================================================
 */
/**
 * =====================================================
 *
 * FOUNDATION COGNITION
 *
 * Prompt
 * ↓
 * Understanding
 * ↓
 * Meaning Context
 * ↓
 * Genome
 *
 * =====================================================
 */

const understanding: ExperienceUnderstanding =

  (context?.metadata?.understanding as ExperienceUnderstanding | undefined)

  ??

  understandExperience(
    prompt
  );



const meaningContext: ExperienceMeaningContext =

  (context?.metadata?.meaningContext as ExperienceMeaningContext | undefined)

  ??

  buildMeaningContext(
    understanding
  );



const genome: ExperienceGenome =

  (context?.metadata?.genome as ExperienceGenome | undefined)

  ??

  buildExperienceGenome(
    prompt,
    understanding,
    meaningContext
  );



/**
 * =====================================================
 *
 * COMPILER MIND
 *
 * Canonical cognitive state
 *
 * =====================================================
 */


const mind: CompilerMind = {

  prompt,

  understanding,

  meaningContext,

  genome,

};



/**
 * =====================================================
 *
 * COGNITIVE SYNTHESIS
 *
 * =====================================================
 */


const cognitiveSynthesis =

  synthesizeCognitiveExperience(
    mind
  );


const {

  semanticIR,

  nuvo,

  revik,

  moverArc,

  moverTopology,

  kaivo,

  orion,

  cognitiveTrace,

} = cognitiveSynthesis;

/**
 * =====================================================
 *
 * WORLD SYNTHESIS
 *
 * Cognitive Intelligence
 * ↓
 * Experience World
 *
 * =====================================================
 */

const world: ExperienceWorld =

  composeWorld(
    genome
  );



/**
 * =====================================================
 *
 * BLUEPRINT
 *
 * World
 * ↓
 * Blueprint
 *
 * =====================================================
 */
 const blueprint: ExperienceBlueprint =

  composeBlueprint(
    genome,
    world
  );


/**
 * =====================================================
 *
 * EXPERIENCE DIRECTION
 *
 * =====================================================
 */

const direction =

  experienceDirector(
    blueprint
  );
/**
 * =====================================================
 *
 * 14. FLOW
 *
 * =====================================================
 */

const flowSteps:FlowStep[] =

 blueprintToFlow(

  blueprint

 );

/**
 * =====================================================
 *
 * 15. MOMENTS
 *
 * =====================================================
 */

const experienceMoments:ExperienceMoment[] =

 flowToMoment(

  flowSteps

 );
/**
 * =====================================================
 *
 * 16. CINEMATIC
 *
 * =====================================================
 */

const cinematicScenes =

 compileCinematicScenes(

  blueprint,

  direction,

  world

 );


/**
 * =====================================================
 *
 * 17. MODEL
 *
 * =====================================================
 */

const model =

 createExperienceModel(

  blueprint,

  prompt

 );

/**
 * =====================================================
 *
 * FINAL COMPILED EXPERIENCE
 *
 * =====================================================
 */


return {


 id:

  createCompilerId(),



 intelligence:{

  understanding,

  meaningContext,

  semanticIR,

  nuvo,

  revik,

  moverArc,

  moverTopology,

  kaivo,

  orion

 },



 cognitiveTrace,



 genome,


 world,


 blueprint,


 direction,


 flowSteps,


 experienceMoments,


 cinematicScenes,


 model,



 context,



 title:

  blueprint.title,



 estimatedDuration:

  experienceMoments.length * 5,



 momentCount:

  experienceMoments.length,



 metadata:{

  compilerVersion:

   "5.0-cognitive-synthesis",


  generatedAt:

   new Date().toISOString(),


  source:

   "qre-cognitive-experience-compiler",


  tags:[

   "semantic",

   "cognitive",

   "world-aware",

   "cinematic",

   "compiler-brain"

  ]

 }


};


}


export const genomeCompiler =

 compileExperienceGenome;