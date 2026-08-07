import type {
  HumanStoryContext
} from "./humanStoryArchetypeResolver.js";


export interface HumanLanguageMoment {

  title:string;

  text:string;

}



export function createHumanLanguageMoment(

  context:HumanStoryContext,

  stage:string,

  index:number

):HumanLanguageMoment {



const entity =
  context.entity;



switch(
context.archetype
){



case "companion_journey":

return companionMoment(
  entity,
  stage,
  index
);



case "place_story":

return placeMoment(
  entity,
  stage,
  index
);



case "artifact_story":

return artifactMoment(
  entity,
  stage,
  index
);



case "brand_story":

return brandMoment(
  entity,
  stage,
  index
);



case "human_journey":

return humanMoment(
  entity,
  stage,
  index
);



default:

return discoveryMoment(
  entity,
  stage,
  index
);



}

}





function companionMoment(
entity:string,
stage:string,
index:number
){

const moments = [

[
"Where it began",
`${entity} began a journey filled with care, trust, and connection.`
],

[
"The care and connection",
`${entity} shared moments of attention, comfort, and belonging.`
],

[
"The bond created",
`${entity}'s experience became a story built through kindness and trust.`
],

[
"A memory to keep",
`${entity} left with a memory that became part of their story.`
]

];


return {

title:
moments[index]?.[0] ?? "A meaningful moment",

text:
moments[index]?.[1]
?? `${entity} experienced a moment worth remembering.`

};

}





function placeMoment(
entity:string,
stage:string,
index:number
){

const moments=[

[
"Where it began",
`${entity} became the beginning of a new chapter.`
],

[
"The moments created",
`${entity} became a place where memories and connections grew.`
],

[
"The story inside",
`${entity} carried the moments that made it meaningful.`
],

[
"A place remembered",
`${entity} became part of a lasting story.`
]

];


return {

title:
moments[index]?.[0] ?? "A meaningful place",

text:
moments[index]?.[1] 
?? `${entity} became a place worth remembering.`

};

}





function artifactMoment(
entity:string,
stage:string,
index:number
){

const moments=[

[
"Where it began",
`${entity} began as something created with purpose.`
],

[
"The meaning behind it",
`${entity} gained meaning through human connection.`
],

[
"The story it carries",
`${entity} became connected to personal moments and memories.`
],

[
"A story preserved",
`${entity} became something worth carrying forward.`
]

];


return {

title:
moments[index]?.[0] ?? "A meaningful object",

text:
moments[index]?.[1]
?? `${entity} became part of someone's story.`

};

}





function brandMoment(
entity:string,
stage:string,
index:number
){

const moments=[

[
"Where it began",
`${entity} began with a vision to create meaningful experiences.`
],

[
"The connection created",
`${entity} connected people through shared moments.`
],

[
"The experience grows",
`${entity} became more than a service — it became a relationship.`
],

[
"The story continues",
`${entity} continues creating moments people remember.`
]

];


return {

title:
moments[index]?.[0] ?? "A meaningful experience",

text:
moments[index]?.[1]
?? `${entity} created something worth remembering.`

};

}





function humanMoment(
entity:string,
stage:string,
index:number
){

const moments=[

[
"Where it began",
`${entity} began a journey shaped by meaningful moments.`
],

[
"The path forward",
`${entity} discovered new connections and possibilities.`
],

[
"The transformation",
`${entity} experienced growth through the journey.`
],

[
"The reflection",
`${entity} carried the experience forward.`

]

];


return {

title:
moments[index]?.[0] ?? "A meaningful moment",

text:
moments[index]?.[1]
?? `${entity} experienced a meaningful chapter.`

};

}





function discoveryMoment(
entity:string,
stage:string,
index:number
){

return {

title:
[
"Arrival",
"Discovery",
"Revelation",
"Memory"
][index] ?? "Moment",

text:
`${entity} discovered a moment filled with meaning and possibility.`

};

}