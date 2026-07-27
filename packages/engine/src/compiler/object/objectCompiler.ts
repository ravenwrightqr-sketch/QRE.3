/**
 * =====================================================
 * QRE OBJECT GENOME COMPILER
 * =====================================================
 *
 * Understanding
 *        ↓
 * Object Genome
 *
 * NO DATABASE
 * NO RUNTIME
 *
 * =====================================================
 */


import type {
  ObjectGenome,
  ObjectMoment,
  ObjectRelationship,
} from "@qre/contracts";



function buildIdentity(
 input:any
){

return {

 name:
  input.entities?.people?.[0]
  ??
  input.entities?.places?.[0]
  ??
  "Unknown Object",


 type:
  resolveObjectType(input.prompt),


 category:
  [],


 attributes:
  input.emotions?.emotions
  ??
  []

};

}




function resolveObjectType(
 prompt:string
):string {


const text =
 prompt.toLowerCase();



if(
 text.includes("dog") ||
 text.includes("cat") ||
 text.includes("pet") ||
 text.includes("animal")
){

 return "living_being";

}



if(
 text.includes("concert") ||
 text.includes("music") ||
 text.includes("festival")
){

 return "event_memory";

}



if(
 text.includes("child") ||
 text.includes("baby") ||
 text.includes("birth")
){

 return "life_story";

}



if(
 text.includes("trip") ||
 text.includes("travel") ||
 text.includes("visit")
){

 return "journey";

}



return "experience_object";

}

function buildMoments(
 input:any
):ObjectMoment[] {


const moments:ObjectMoment[] = [];


function addMoment(
 title:string,
 description:string,
 emotions:string[] = [],
 significance:number = .5
){

moments.push({

 id:
  crypto.randomUUID(),

 title,

 description,

 participants:
  input.entities?.people ?? [],

 emotions,

 significance

});

}



/**
 * UNIVERSAL OBJECT LIFE CYCLE
 */


addMoment(

 "Origin",

 `The beginning of ${input.prompt} `,

 input.emotions?.emotions ?? [],

 .6

);



addMoment(

 "First Encounter",

 "The first meaningful interaction with this object.",

 [
  "curiosity",
  "connection"
 ],

 .7

);



if(
 input.relationships?.length
){

addMoment(

 "Relationship",

 "A connection formed between people and this object.",

 [
  "connection"
 ],

 .8

);

}




if(
 input.memory?.replay ||
 input.memory?.timeCapsule
){

addMoment(

 "Memory Capture",

 "A meaningful moment preserved for future replay.",

 [
  "nostalgia"
 ],

 .9

);

}




if(
 input.entities?.places?.length
){

addMoment(

 "Place Experience",

 "A moment connected to a meaningful location.",

 [
  "discovery"
 ],

 .7

);

}

/**
 * FUTURE
 */

addMoment(

 "Legacy",

 "The meaning this object carries into the future.",

 [
  "continuity"
 ],

 .8

);



return moments;


}

function buildRelationships(
 input:any
):ObjectRelationship[] {


return (

input.relationships
?
input.relationships.map(
(r:any)=>({

 subject:
  r.subject,

 relationship:
  r.predicate,

 object:
  r.object,

 confidence:
  r.confidence ?? .5

})
)

:
[]

);


}





export function compileObjectGenome(

 input:any

):ObjectGenome {


return {


identity:

 buildIdentity(
  input
 ),



history:{

 origin:
  input.prompt,


 timeline:
  [],


 importantMoments:
  []

},



relationships:

 buildRelationships(
  input
 ),



moments:

 buildMoments(
  input
 ),



memory:{

 memories:
  input.memory?.replay
  ?
  ["replayable_memory"]
  :
  [],


 emotionalMarkers:
  input.emotions?.emotions
  ??
  [],


 locations:
  [],


 dates:
  []

},



legacy:{

 meaning:
  input.meaning?.desiredFeeling
  ??
  [],


 impact:
  [],


 preservation:
  []

},



emotionalSignature:

 input.emotions?.emotions
 ??
 [],



symbolicMeaning:

 input.meaning?.symbols
 ??
 [],



futurePossibilities:[

 "future_memory",

 "continued_story"

]


};


}



export const objectCompiler =
compileObjectGenome;