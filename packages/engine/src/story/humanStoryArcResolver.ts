import type {
  HumanStoryContext
} from "./humanStoryArchetypeResolver.js";


export interface HumanStoryArc {

  stages:string[];

  emotionalMovement:string[];

}



export function resolveHumanStoryArc(

  context:HumanStoryContext

):HumanStoryArc {



switch(
context.archetype
){



case "companion_journey":

return {

stages:[

"arrival",

"care",

"bond",

"return"

],

emotionalMovement:[

"trust",

"comfort",

"connection",

"belonging"

]

};



case "place_story":

return {

stages:[

"discovery",

"arrival",

"belonging",

"legacy"

],

emotionalMovement:[

"curiosity",

"comfort",

"attachment",

"memory"

]

};



case "artifact_story":

return {

stages:[

"creation",

"meaning",

"ownership",

"preservation"

],

emotionalMovement:[

"purpose",

"connection",

"value",

"legacy"

]

};



case "brand_story":

return {

stages:[

"discovery",

"interaction",

"relationship",

"return"

],

emotionalMovement:[

"curiosity",

"trust",

"connection",

"loyalty"

]

};



case "human_journey":

return {

stages:[

"beginning",

"challenge",

"growth",

"reflection"

],

emotionalMovement:[

"identity",

"change",

"confidence",

"meaning"

]

};



default:

return {

stages:[

"arrival",

"exploration",

"reveal",

"memory"

],

emotionalMovement:[

"curiosity",

"wonder",

"discovery",

"meaning"

]

};


}

}