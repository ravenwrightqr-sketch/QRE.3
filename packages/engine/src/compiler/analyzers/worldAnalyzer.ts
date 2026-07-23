/**
 * =====================================================
 * QRE EXPERIENCE WORLD ANALYZER
 * =====================================================
 *
 * Responsibility:
 *
 * Determine which human experience
 * domain(s) a prompt belongs to.
 *
 *
 * Input:
 *
 * Intent
 * Entities
 * Emotion
 * Memory
 *
 *
 * Output:
 *
 * WorldUnderstanding
 *
 *
 * Detects:
 *
 * - memory_world
 * - relationship_world
 * - commerce_world
 * - discovery_world
 * - journey_world
 *
 *
 * This analyzer does NOT:
 *
 * - create experiences
 * - execute flows
 * - select templates
 * - run runtime systems
 *
 *
 * Pipeline:
 *
 * Understanding Layers
 *        ↓
 * WorldAnalyzer
 *        ↓
 * ExperienceUnderstanding
 *
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */



import type {

  WorldUnderstanding,

  EmotionUnderstanding,

  MemoryUnderstanding

} from "../models/understandingTypes.js";



import type {

  ExperienceIntent,

  ExperienceEntities

} from "@qre/contracts";









export function analyzeWorld(

input:{

 intent:ExperienceIntent[];

 entities:ExperienceEntities;

 emotions:EmotionUnderstanding;

 memory:MemoryUnderstanding;

}

):WorldUnderstanding {



const domains =

new Set<string>();








//
// DEFAULT HUMAN EXPERIENCE
//

domains.add(

"journey_world"

);









//
// MEMORY WORLD
//

if(

 input.memory.past ||

 input.memory.legacy ||

 input.memory.replay ||

 input.memory.timeCapsule

){

 domains.add(

 "memory_world"

 );

}









//
// RELATIONSHIP WORLD
//

if(

 input.emotions.emotions.includes(

 "love"

 )

){

 domains.add(

 "relationship_world"

 );

}









//
// DISCOVERY WORLD
//

if(

 input.emotions.emotions.includes(

 "wonder"

 )

){

 domains.add(

 "discovery_world"

 );

}









//
// COMMERCE WORLD
//

if(

 input.entities.products.length

){

 domains.add(

 "commerce_world"

 );

}









//
// INTENT SIGNALS
//

for(

const intent of input.intent

){


switch(intent){


case "connect":

domains.add(

"relationship_world"

);

break;



case "discover":

domains.add(

"discovery_world"

);

break;



case "remember":

domains.add(

"memory_world"

);

break;



case "sell":

domains.add(

"commerce_world"

);

break;



}



}









const resolved =

[

...domains

];









return {


domains:

resolved as WorldUnderstanding["domains"],



primary:

resolved[0] as WorldUnderstanding["primary"],



confidence:

Math.min(

1,

0.5 + resolved.length * 0.1

)



};



}