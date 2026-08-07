import type {
HumanStoryContext
} from "./humanStoryArchetypeResolver.js";

import type {
HumanStoryArc
} from "./humanStoryArcResolver.js";

import type {
HumanStory
} from "@qre/contracts";


interface ExpressionContext {

entity:string;

stage:string;

emotion:string;

index:number;

archetype:string;

}


export function createHumanExpressions(
context:HumanStoryContext,
arc:HumanStoryArc
):HumanStory[] {


return arc.stages.map(
(stage,index)=>

createExpression({

entity:
context.entity,

stage,

emotion:
arc.emotionalMovement[index]
??
"meaning",

index,

archetype:
context.archetype

})

);


}



function createExpression(
context:ExpressionContext
):HumanStory {


const emotionalMovement =
resolveMovement(
context.stage,
context.emotion
);


const meaning =
resolveMeaning(
context.entity,
context.stage,
context.archetype
);



return {


text:

`${context.entity} ${emotionalMovement}, revealing ${meaning}.`,



emotion:[

context.emotion

]

};

}



function resolveMovement(
stage:string,
emotion:string
):string {


const movements:Record<string,string>={


arrival:
"entered a moment that carried unexpected possibility",


care:
"discovered that attention could become connection",


connection:
"found a bond forming through shared experience",


trust:
"began transforming a simple interaction into something meaningful",


memory:
"carried forward a moment that refused to disappear",


return:
"returned changed by what the experience revealed",


discovery:
"uncovered meaning hidden beneath the surface",


belonging:
"recognized a place where identity and connection could grow",


legacy:
"became part of a story larger than the moment itself"

};



return (

movements[stage]

??

`moved through ${emotion} toward deeper understanding`

);

}



function resolveMeaning(
entity:string,
stage:string,
archetype:string
):string {


if(archetype==="companion_journey"){

return (

`the relationship between ${entity} and those who cared for them`

);

}



if(archetype==="place_story"){

return (

`the memories created within that place`

);

}



if(archetype==="artifact_story"){

return (

`the human meaning carried beyond its physical form`

);

}



if(archetype==="brand_story"){

return (

`the connection created between people and purpose`

);

}



return (

`a transformation created through ${stage}`

);

}