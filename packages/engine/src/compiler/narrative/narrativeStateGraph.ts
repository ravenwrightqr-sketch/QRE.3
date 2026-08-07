/**
 * =====================================================
 * QRE NARRATIVE STATE GRAPH
 * =====================================================
 *
 * Adaptive emotional state reasoning layer.
 *
 * NOT:
 *
 * ❌ chapters
 * ❌ UI sections
 * ❌ fixed story templates
 *
 *
 * IS:
 *
 * ✅ experience states
 * ✅ emotional transitions
 * ✅ meaning movement
 * ✅ adaptive transformation logic
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint
} from "@qre/contracts";

import type {
  NarrativeIntent
} from "./narrativeIntentEngine.js";

export interface NarrativeState {


  id:string;


  state:string;


  emotion:string;


  meaning:string;


  transitions:string[];


}



export interface NarrativeStateGraph {


  states:NarrativeState[];


  beginning:string;


  transformation:string;


  ending:string;


}





function createState(

id:string,

state:string,

emotion:string,

meaning:string,

transitions:string[]

):NarrativeState {


return {

 id,

 state,

 emotion,

 meaning,

 transitions

};


}





function detectExperiencePattern(

genome:ExperienceGenome

):string {


const text =

JSON.stringify(genome)

.toLowerCase();



if(
 text.includes("pet")
 ||
 text.includes("dog")
 ||
 text.includes("care")
){

 return "care";

}



if(
 text.includes("home")
 ||
 text.includes("house")
 ||
 text.includes("property")
){

 return "belonging";

}



if(
 text.includes("memory")
 ||
 text.includes("family")
){

 return "memory";

}



if(
 text.includes("discover")
 ||
 text.includes("journey")
){

 return "discovery";

}



return "connection";


}





export function buildNarrativeStateGraph(


 intent:NarrativeIntent,


 genome:ExperienceGenome,


 world:ExperienceWorld,


 blueprint:ExperienceBlueprint


):NarrativeStateGraph {



const pattern =

detectExperiencePattern(

 genome

);





let states:NarrativeState[];





switch(pattern){



case "care":


states = [

createState(
"arrival",
"arrival",
"trust",
"Something precious arrives and places itself in another's care.",
[
"attention"
]
),


createState(
"attention",
"care",
"comfort",
"The experience reveals patience, connection, and care.",
[
"renewal"
]
),


createState(
"renewal",
"transformation",
"joy",
"A change takes place that can be felt.",
[
"reunion"
]
),


createState(
"reunion",
"memory",
"belonging",
"The moment returns as a shared emotional memory.",
[]
)

];

break;






case "belonging":


states = [

createState(
"threshold",
"arrival",
"curiosity",
"A new possibility opens.",
[
"imagination"
]
),


createState(
"imagination",
"vision",
"hope",
"A future begins taking shape.",
[
"belonging"
]
),


createState(
"belonging",
"connection",
"identity",
"The place becomes part of someone's story.",
[
"memory"
]
),


createState(
"memory",
"legacy",
"belonging",
"The experience becomes part of life.",
[]
)

];

break;






default:


states = [

createState(
"origin",
"beginning",
"curiosity",
"A meaningful moment begins.",
[
"connection"
]
),


createState(
"connection",
"interaction",
"connection",
"A relationship forms through experience.",
[
"transformation"
]
),


createState(
"transformation",
"change",
"wonder",
"The ordinary becomes significant.",
[
"memory"
]
),


createState(
"memory",
"reflection",
"belonging",
"The experience becomes something worth carrying forward.",
[]
)

];

}





return {


states,


beginning:

states[0].id,



transformation:

states[Math.floor(states.length / 2)].id,



ending:

states[states.length - 1].id


};


}