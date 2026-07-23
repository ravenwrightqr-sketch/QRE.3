/**
 * =====================================================
 * QRE EXPERIENCE CONTEXT ENGINE
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
 * ContextEngine
 *   ↓
 * ExperienceContext
 *   ↓
 * Experience Genome
 *
 *
 * Analyzers answer:
 *
 * "What exists?"
 *
 *
 * Context Engine answers:
 *
 * "What does it mean?"
 *
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */



export type ExperienceContext = {


  /**
   * Major conceptual themes
   */

  themes:string[];




  /**
   * Human interpretation
   */

  meanings:string[];




  /**
   * Creative language directions
   */

  creativeDirection:string[];

};









type ContextInput = {


  intent:string[];


  emotions:string[];


  world:string;



};









const intentMeanings:

Record<string,{

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









export function buildContext(

input:ContextInput

):ExperienceContext {



const themes = new Set<string>();

const meanings = new Set<string>();

const creativeDirection = new Set<string>();









//
// INTENT → HUMAN MEANING
//

for(

const intent of input.intent

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


}









//
// EMOTION → CREATIVE LANGUAGE
//

for(

const emotion of input.emotions

){


const direction =

emotionDirections[emotion];


if(direction){


creativeDirection.add(

direction

);


}


}









//
// WORLD → CREATIVE CONTEXT
//

switch(input.world){



case "memory_world":

creativeDirection.add(

"heritage_storytelling"

);

break;



case "discovery_world":

creativeDirection.add(

"exploration_journey"

);

break;



case "relationship_world":

creativeDirection.add(

"human_centered_design"

);

break;



case "commerce_world":

creativeDirection.add(

"trust_driven_experience"

);

break;



}



return {


themes:

[...themes],



meanings:

[...meanings],



creativeDirection:

[...creativeDirection]

};


}