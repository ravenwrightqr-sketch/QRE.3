
/**
 * =====================================================
 * QRE EXPERIENCE MEANING CONTEXT ENGINE
 * =====================================================
 *
 * Responsibility:
 *
 * Convert analyzed signals into higher-level
 * human creative meaning.
 *
 *
 * Pipeline:
 *
 * Prompt
 *   ↓
 * Analyzers
 *   ↓
 * Meaning Context Engine
 *   ↓
 * ExperienceMeaningContext
 *   ↓
 * Experience Genome
 *
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */


import type {
  ExperienceMeaningContext,
  ExperienceUnderstanding,
} from "@qre/contracts";





const intentMeanings:

Record<string, {

  theme:string;

  meaning:string;

}> = {


 remember:{
  theme:"memory_preservation",
  meaning:"human_history_matters"
 },


 celebrate:{
  theme:"milestone",
  meaning:"shared_human_moment"
 },


 discover:{
  theme:"exploration",
  meaning:"curiosity_driven_experience"
 },


 connect:{
  theme:"human_connection",
  meaning:"relationship_strengthening"
 },


 sell:{
  theme:"value_exchange",
  meaning:"commercial_relationship"
 },


 reward:{
  theme:"recognition",
  meaning:"exclusive_participation"
 },


 teach:{
  theme:"knowledge_transfer",
  meaning:"understanding_growth"
 },


 protect:{
  theme:"security",
  meaning:"care_and_trust"
 }


};






const emotionDirections:

Record<string,string> = {


 nostalgia:
 "cinematic_memory",


 wonder:
 "mystery_and_discovery",


 love:
 "emotional_intimacy",


 joy:
 "playful_energy",


 fear:
 "dark_atmosphere",


 trust:
 "confidence_and_safety",


 excitement:
 "high_energy_engagement"

};

function resolveEmotions(
  understanding: ExperienceUnderstanding
): string[] {

  const emotions:any =
    understanding.emotions;


  if(!emotions){

    return [];

  }


  if(Array.isArray(emotions)){

    return emotions;

  }


  return [

    ...(emotions.primary ?? []),

    ...(emotions.secondary ?? [])

  ];

}






function resolveWorld(

 understanding:ExperienceUnderstanding

):string {


 const world:any =
   understanding.world;


 if(!world){

  return "";

 }


 if(typeof world === "string"){

  return world;

 }


 return (

  world.name ??

  world.type ??

  world.domain ??

  ""

 );

}








export function buildMeaningContext(

 understanding:ExperienceUnderstanding

):ExperienceMeaningContext {



const themes = new Set<string>();

const meanings = new Set<string>();

const creativeDirection = new Set<string>();

const emotionalGravity = new Set<string>();

const humanDesires = new Set<string>();

const symbolicForces = new Set<string>();

const narrativePotential = new Set<string>();





//
// INTENT → HUMAN MEANING
//

for(

 const intent of understanding.intent

){


 const mapping =

 intentMeanings[intent];


 if(mapping){


  themes.add(
   mapping.theme
  );


  meanings.add(
   mapping.meaning
  );


 }



 switch(intent){


  case "remember":

   humanDesires.add(
    "preserve_meaning"
   );

   symbolicForces.add(
    "legacy"
   );

   narrativePotential.add(
    "memory_journey"
   );

  break;



  case "discover":

   humanDesires.add(
    "understand_the_unknown"
   );

   symbolicForces.add(
    "exploration"
   );

   narrativePotential.add(
    "revelation_story"
   );

  break;



  case "connect":

   humanDesires.add(
    "strengthen_relationships"
   );

   symbolicForces.add(
    "connection"
   );

  break;



  case "celebrate":

   humanDesires.add(
    "honor_milestones"
   );

   symbolicForces.add(
    "achievement"
   );

  break;



  case "protect":

   humanDesires.add(
    "create_security"
   );

   symbolicForces.add(
    "trust"
   );

  break;


 }


}






//
// EMOTION → CREATIVE LANGUAGE
//

for(

 const emotion of resolveEmotions(
  understanding
 )

){


 const direction =

 emotionDirections[emotion];


 if(direction){

  creativeDirection.add(
   direction
  );

 }



 switch(emotion){


  case "nostalgia":

   emotionalGravity.add(
    "memory_and_time"
   );

   narrativePotential.add(
    "reflection"
   );

  break;



  case "wonder":

   emotionalGravity.add(
    "unknown_and_discovery"
   );

   narrativePotential.add(
    "exploration"
   );

  break;



  case "love":

   emotionalGravity.add(
    "human_connection"
   );

   humanDesires.add(
    "belonging"
   );

  break;



  case "joy":

   emotionalGravity.add(
    "celebration_energy"
   );

   humanDesires.add(
    "shared_experience"
   );

  break;



  case "trust":

   emotionalGravity.add(
    "safety_and_confidence"
   );

   humanDesires.add(
    "reliability"
   );

  break;



  case "excitement":

   emotionalGravity.add(
    "energy_and_momentum"
   );

  break;


 }


}








//
// WORLD → CREATIVE CONTEXT
//

switch(

 resolveWorld(
  understanding
 )

){


 case "memory_world":

  creativeDirection.add(
   "heritage_storytelling"
  );

  symbolicForces.add(
   "legacy"
  );

 break;



 case "discovery_world":

  creativeDirection.add(
   "exploration_journey"
  );

  symbolicForces.add(
   "curiosity"
  );

 break;



 case "relationship_world":

  creativeDirection.add(
   "human_centered_design"
  );

  symbolicForces.add(
   "belonging"
  );

 break;



 case "commerce_world":

  creativeDirection.add(
   "trust_driven_experience"
  );

  symbolicForces.add(
   "value_exchange"
  );

 break;


}








return {


 themes:

 [...themes],


 meanings:

 [...meanings],


 creativeDirection:

 [...creativeDirection],


 emotionalGravity:

 [...emotionalGravity],


 humanDesires:

 [...humanDesires],


 symbolicForces:

 [...symbolicForces],


 narrativePotential:

 [...narrativePotential]


};


}