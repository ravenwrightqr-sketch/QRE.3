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
 * Score Analyzer
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
  ExperienceUnderstanding
} from "../models/understandingTypes.js";






export function understandExperience(

 prompt:string

):ExperienceUnderstanding {



if(!prompt.trim()){

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