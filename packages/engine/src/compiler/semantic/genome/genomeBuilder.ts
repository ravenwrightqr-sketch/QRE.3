/**
 * =====================================================
 * QRE EXPERIENCE GENOME BUILDER
 * =====================================================
 *
 * Human Prompt
 *        ↓
 * Semantic Understanding
 *        ↓
 * Experience Genome
 *
 * Genome = Creative DNA
 *
 * NO DATABASE
 * NO EXECUTION
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */

import {
  buildSemanticCortex,
  toSemanticInterpretation,
} from "../../cortex/index.js";


import {
  awakenConcepts,
  meaningConstellation,
} from "../../concepts/index.js";


import {
  extractEntities,
} from "../entityExtractor.js";
import {
  compileObjectGenome
} from "../../object/index.js";

import type {
  ExperienceGenome,
  ExperienceRelationship,
  ExperienceJourney,
} from "@qre/contracts";
import type {
  ExperienceMeaningContext,
} from "@qre/contracts";

import {
  understandExperience,
  buildMeaningContext,
} from "@qre/cognition";

import {
 compileLifecycle
} from "../../lifecycle/lifecycleCompiler.js";





function buildDNA(
 understanding:any
):string[] {


 const dna =
 new Set<string>();



 dna.add(
  "adaptive"
 );



 for(
  const trait of understanding.dna.traits ?? []
 ){

  dna.add(
   trait
  );

 }



 for(
  const behavior of understanding.audience.behaviors ?? []
 ){

  dna.add(
   behavior
  );

 }


 if(
  understanding.memory.timeCapsule
 ){

  dna.add(
   "memory_driven"
  );

 }




 if(
  understanding.world.domains.includes(
   "discovery_world"
  )
 ){

  dna.add(
   "exploration"
  );

 }




 if(
  understanding.audience.social !== "solo"
 ){

  dna.add(
   "human_connection"
  );

 }


 return [
  ...dna
 ];

}



function buildRelationships(

 concepts:string[]

):ExperienceRelationship[] {


 const relationships:ExperienceRelationship[]=[];



 const constellation =
 meaningConstellation(
  concepts as any
 );



 for(
  const connection of constellation.connections
 ){

  relationships.push({

   subject:
    connection.from,


   predicate:

    connection.relationship === "preserves"

    ?

    "remembered_at"


    :


    connection.relationship === "reveals"

    ?

    "visited"


    :


    connection.relationship === "creates"

    ?

    "celebrates"


    :

    "belongs_to",


   object:
    connection.to,


   confidence:
    1

  });


 }



 return relationships;

}









function resolveEnergy(
 understanding:any
){


 if(
  understanding.dna.traits?.includes(
   "cinematic"
  )
 ){

  return "mysterious";

 }



 if(
  understanding.emotions.emotions.includes(
   "joy"
  )
 ){

  return "playful";

 }



 return "emotional";

}



function resolvePacing(
 understanding:any
){


 if(
  understanding.dna.traits?.includes(
   "cinematic"
  )
 ){

  return "slow";

 }



 if(
  understanding.audience.behaviors.includes(
   "interaction"
  )
 ){

  return "fast";

 }



 return "medium";

}



function buildJourney(
 understanding:any
):ExperienceJourney[] {


 const journey:ExperienceJourney[]=[

  "arrival",

  "discovery",

  "reveal",

  "return"

 ];



 if(
  understanding.dna.traits?.includes(
   "transformation"
  )
 ){

  journey.splice(
   3,
   0,
   "transformation"
  );

 }



 if(
  understanding.memory.replay
 ){

  journey.splice(
   3,
   0,
   "memory"
  );

 }



 return journey;

}

function buildDesireDNA(
 understanding:any
):string[] {

 const dna = new Set<string>();


 for(
  const desire of understanding.desire.desires ?? []
 ){

  dna.add(
   desire
  );

 }


 for(
  const motivation of understanding.desire.motivations ?? []
 ){

  dna.add(
   motivation.replaceAll(
    " ",
    "_"
   )
  );

 }


 for(
  const goal of understanding.desire.goals ?? []
 ){

  dna.add(
   goal.replaceAll(
    " ",
    "_"
   )
  );

 }


 return [
  ...dna
 ];

}





function buildSensoryDNA(
 understanding:any
):string[] {

 const sensory = new Set<string>();


 for(
  const item of understanding.sensory.visual ?? []
 ){

  sensory.add(
   `visual_${item}`
  );

 }


 for(
  const item of understanding.sensory.audio ?? []
 ){

  sensory.add(
   `audio_${item}`
  );

 }


 for(
  const item of understanding.sensory.physical ?? []
 ){

  sensory.add(
   `physical_${item}`
  );

 }


 for(
  const item of understanding.sensory.environmental ?? []
 ){

  sensory.add(
   `environment_${item}`
  );

 }


 return [
  ...sensory
 ];

}





function buildPotentialDNA(
 understanding:any
):string[] {

 const potential = new Set<string>();


 for(
  const possibility of understanding.potential.possibilities ?? []
 ){

  potential.add(
   possibility.replaceAll(
    " ",
    "_"
   )
  );

 }


 for(
  const opportunity of understanding.potential.opportunities ?? []
 ){

  potential.add(
   opportunity.replaceAll(
    " ",
    "_"
   )
  );

 }


 return [
  ...potential
 ];

}





function buildTone(
 understanding:any
):string[] {

 const tone = new Set<string>();


 for(
  const emotion of understanding.emotions.emotions ?? []
 ){

  tone.add(emotion);

 }


 if(
  understanding.memory.replay ||
  understanding.memory.timeCapsule
 ){

  tone.add("nostalgic");

 }


 if(
  understanding.dna.traits?.includes("cinematic")
 ){

  tone.add("cinematic");

 }


 if(
  understanding.world.domains.includes("discovery_world")
 ){

  tone.add("wonder");

 }


 return [
  ...tone
 ];

}





function buildSensory(
 understanding:any
):string[] {

 const sensory = new Set<string>();


 if(
  understanding.dna.traits?.includes("cinematic")
 ){

  sensory.add("visual_storytelling");
  sensory.add("atmosphere");

 }


 if(
  understanding.audience.behaviors?.includes(
   "interaction"
  )
 ){

  sensory.add("interactive");

 }


 if(
  understanding.memory.timeCapsule
 ){

  sensory.add("emotional_memory");

 }


 return [
  ...sensory
 ];

}





function buildSymbols(
 understanding:any
):string[] {

 const symbols = new Set<string>();


 for(
  const trait of understanding.dna.traits ?? []
 ){

  symbols.add(
   trait
  );

 }


 for(
  const domain of understanding.world.domains ?? []
 ){

  symbols.add(
   domain
  );

 }


 return [
  ...symbols
 ];

}





function buildTransformation(
 understanding:any
):string[] {

 const transformation = new Set<string>();


 if(
  understanding.dna.traits?.includes(
   "transformation"
  )
 ){

  transformation.add(
   "personal_change"
  );

 }


 if(
  understanding.memory.timeCapsule
 ){

  transformation.add(
   "preserve_meaning"
  );

 }


 if(
  understanding.audience.social === "community"
 ){

  transformation.add(
   "create_connection"
  );

 }


 return [
  ...transformation
 ];

}

export function buildExperienceGenome(

prompt: string,
understanding: any,
meaningContext: ExperienceMeaningContext
):ExperienceGenome {



 if(
  !prompt.trim()
 ){

  throw new Error(
   "Experience prompt cannot be empty"
  );

 }


 const awakenedConcepts =
 awakenConcepts({

  emotions:
   understanding.emotions.emotions,


  themes:
   understanding.world.domains,


  dna:
   understanding.dna.traits,


  intent:
   understanding.intent

 });






 const cortex =
 buildSemanticCortex(
  understanding
 );





 const interpretation = {

  ...toSemanticInterpretation(
   cortex
  ),


  concepts:
   awakenedConcepts.concepts

 };





 const constellation =
 meaningConstellation(
  awakenedConcepts.concepts
 );






 const entities =
 extractEntities(
  prompt
 );

const meaning = {

 why:
  meaningContext.meanings,

 emotions:
  understanding.emotions.emotions,

 memories:
  meaningContext.symbolicForces.includes(
    "legacy"
  )
  ?
  [
   "preserved meaning"
  ]
  :
  [],

 desiredFeeling:
  meaningContext.humanDesires,

 transformation:
   meaningContext.narrativePotential

};





 const relationships =
 buildRelationships(
  awakenedConcepts.concepts
 );

 const objectGenome =
 compileObjectGenome({

  prompt,

  entities:
   understanding.entities,

  meaning:
 {
   desiredFeeling:
    understanding.emotions.emotions,

   symbols:
    understanding.dna.traits,

 },

  emotions:
   understanding.emotions,
  
  dna:
   understanding.dna,
   
  memory:
   understanding.memory,

  relationships:
   understanding.relationships

});

const lifecycle =
 compileLifecycle({

  prompt,

  memory:
   understanding.memory,

  entities:
   understanding.entities,

  relationships:
   understanding.relationships,

  world:
   understanding.world

});


 return {

     worlds:
    understanding.world.domains
    ?? [],
  intent:
   understanding.intent,

     tone:

   buildTone(
    understanding
   ),

   object:
  objectGenome,

   lifecycle,

  sensory:

   buildSensory(
    understanding
   ),


  symbols:

   buildSymbols(
    understanding
   ),


  transformation:

   buildTransformation(
    understanding
   ),

  interpretation,

  dna:

[
 ...new Set([

  ...buildDNA(
   understanding
  ),

  ...buildDesireDNA(
   understanding
  ),

  ...buildSensoryDNA(
   understanding
  ),

  ...buildPotentialDNA(
   understanding
  ),

  ...constellation.concepts,

...meaningContext.symbolicForces,

...meaningContext.humanDesires,

...meaningContext.narrativePotential

 ])
],



  archetypes:
   constellation.concepts,



  themes:
   meaningContext.themes,



  emotions:
   understanding.emotions.emotions,



  meaning,



  relationships,



  entities,



  energy:
   resolveEnergy(
    understanding
   ),



  pacing:
   resolvePacing(
    understanding
   ),



  social:
   understanding.audience.social,



  journey:
   buildJourney(
    understanding
   ),



  discovery:
   understanding.world.domains.includes(
    "discovery_world"
   )
   ?
   1
   :
   0.5,



  memory:
   understanding.memory.timeCapsule
   ?
   1
   :
   0.5,



  commerce:
   0,



  immersion:
   understanding.dna.traits?.includes(
    "cinematic"
   )
   ?
   1
   :
   0.5,



  interaction:

   understanding.audience.behaviors.includes(
    "interaction"
   )
   ?
   1
   :
   0.5,



  replay:
   understanding.memory.replay
   ?
   1
   :
   0.5,



  environments:
   understanding.world.domains,



  audience:

   [
    ...new Set([

     ...understanding.audience.types,

     ...understanding.audience.roles,

     ...understanding.audience.behaviors,

     ...understanding.audience.expectations

    ])
   ]

 };

}


export const genomeBuilder =
 buildExperienceGenome;