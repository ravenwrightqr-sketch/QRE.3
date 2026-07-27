/**
 * =====================================================
 * QRE EXPERIENCE UNDERSTANDING KERNEL
 * =====================================================
 *
 * Prompt
 *   ↓
 * Intent Analyzer
 *   ↓
 * Entity Analyzer
 *   ↓
 * Relationship Analyzer
 *   ↓
 * Emotion Analyzer
 *   ↓
 * Memory Analyzer
 *   ↓
 * Audience Analyzer
 *   ↓
 * World Analyzer
 *   ↓
 * DNA Analyzer
 *   ↓
 * Understanding
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import {
  analyzeIntent
} from "../analyzers/intentAnalyzer.js";


import {
  analyzeEntities
} from "../analyzers/entityAnalyzer.js";


import {
  analyzeRelationships
} from "../analyzers/relationshipAnalyzer.js";


import {
  analyzeEmotion
} from "../analyzers/emotionAnalyzer.js";


import {
  analyzeMemory
} from "../analyzers/memoryAnalyzer.js";


import {
  analyzeAudience
} from "../analyzers/audienceAnalyzer.js";


import {
  analyzeWorld
} from "../analyzers/worldAnalyzer.js";


import {
  analyzeDNA
} from "../analyzers/dnaAnalyzer.js";


import {
  calculateConfidence
} from "../analyzers/confidenceAnalyzer.js";


import type {
  ExperienceUnderstanding,
  HumanDesireUnderstanding,
  SensoryUnderstanding,
  CreationPotentialUnderstanding
} from "../models/understandingTypes.js";




/**
 * =====================================================
 * HUMAN DESIRE ANALYZER
 *
 * Understands what the creator wants.
 *
 * =====================================================
 */


function analyzeDesire(
  prompt:string
):HumanDesireUnderstanding {


 const text =
  prompt.toLowerCase();


 const desires:string[] = [];

 const motivations:string[] = [];

 const goals:string[] = [];

 const fears:string[] = [];

 const aspirations:string[] = [];




 if(
  text.includes("create") ||
  text.includes("make") ||
  text.includes("build") ||
  text.includes("design")
 ){

  desires.push(
   "creation"
  );

  motivations.push(
   "creative expression"
  );

  goals.push(
   "bring an idea into reality"
  );

 }




 if(
  text.includes("memory") ||
  text.includes("remember") ||
  text.includes("legacy")
 ){

  desires.push(
   "preservation"
  );

  motivations.push(
   "protect meaningful moments"
  );

  aspirations.push(
   "create lasting memory"
  );

 }




 if(
  text.includes("experience") ||
  text.includes("feel") ||
  text.includes("emotion")
 ){

  desires.push(
   "emotional experience"
  );

  motivations.push(
   "create human connection"
  );

 }




 if(
  text.includes("fear") ||
  text.includes("risk") ||
  text.includes("danger")
 ){

  fears.push(
   "loss of meaning"
  );

 }




 if(
  !aspirations.length
 ){

  aspirations.push(
   "create something meaningful"
  );

 }




 return {

  desires:
   [...new Set(desires)],


  motivations:
   [...new Set(motivations)],


  goals:
   [...new Set(goals)],


  fears:
   [...new Set(fears)],


  aspirations:
   [...new Set(aspirations)]

 };

}





/**
 * =====================================================
 * SENSORY ANALYZER
 *
 * Converts meaning into perception.
 *
 * =====================================================
 */


function analyzeSensory(
 emotions:any,
 dna:any,
 world:any
):SensoryUnderstanding {


 const visual:string[] = [];

 const audio:string[] = [];

 const physical:string[] = [];

 const environmental:string[] = [];





 if(
  dna.traits?.includes(
   "cinematic"
  )
 ){

  visual.push(
   "cinematic imagery"
  );

 }




 if(
  emotions.emotions.length
 ){

  audio.push(
   "emotional atmosphere"
  );

 }




 if(
  world.domains?.length
 ){

  environmental.push(
   ...world.domains.map(
    (domain:string)=>
     domain.toString()
   )
  );

 }





 return {

  visual:
   [...new Set(visual)],


  audio:
   [...new Set(audio)],


  physical:
   [...new Set(physical)],


  environmental:
   [...new Set(environmental)]

 };

}






/**
 * =====================================================
 * CREATION POTENTIAL ANALYZER
 *
 * Defines possibility space.
 *
 * =====================================================
 */


function analyzePotential(
 prompt:string
):CreationPotentialUnderstanding {


 return {


  possibilities:[

   "creative expression",

   "adaptive experience",

   "human connection",

   "cinematic storytelling"

  ],



  constraints:[],



  opportunities:[

   "memory creation",

   "interactive experience",

   "personal transformation"

  ]


 };

}






/**
 * =====================================================
 * MAIN UNDERSTANDING PIPELINE
 * =====================================================
 */


export function understandExperience(

 prompt:string

):ExperienceUnderstanding {



 if(
  !prompt.trim()
 ){

  throw new Error(
   "Cannot understand empty experience"
  );

 }





 const intent =
  analyzeIntent(prompt);




 const entities =
  analyzeEntities(prompt);




 const relationships =
  analyzeRelationships(
   prompt,
   entities
  );




 const emotions =
  analyzeEmotion(prompt);




 const memory =
  analyzeMemory(prompt);




 const audience =
  analyzeAudience(prompt);




 const world =
  analyzeWorld({

   intent,

   entities,

   emotions,

   memory

  });




 const dna =
  analyzeDNA({

   intent,

   emotions,

   world

  });





 const desire =
  analyzeDesire(
   prompt
  );




 const sensory =
  analyzeSensory(

   emotions,

   dna,

   world

  );




 const potential =
  analyzePotential(
   prompt
  );





 const scores = {

  semantic:1,

  entity:1,

  relationship:1,

  emotional:1,

  memory:1,

  world:1,

  dna:1,

  overall:1

 };






 return {


  prompt,


  intent,


  desire,


  sensory,


  potential,


  entities,


  relationships,


  emotions,


  memory,


  audience,


  world,


  dna,


  scores,


  confidence:

   calculateConfidence({

    intent,

    entities,

    relationships,

    emotions,

    memory,

    audience,

    world,

    dna

   })


 };


}