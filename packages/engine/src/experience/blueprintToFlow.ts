/**
 * =====================================================
 * QRE BLUEPRINT → FLOW COMPILER
 * =====================================================
 *
 * Experience Blueprint
 *        ↓
 * Experience Director
 *        ↓
 * Creative Direction
 *        ↓
 * Runtime Flow Instructions
 *
 *
 * Responsibilities:
 *
 * - translate moments into flow steps
 * - attach creative intent
 * - preserve emotional direction
 * - preserve cinematic pacing
 *
 *
 * NO DATABASE
 * NO PRISMA
 * NO EXECUTION
 * NO PLAYER LOGIC
 *
 * =====================================================
 */


import type {

  ExperienceBlueprint,

  ExperienceMomentType,

  FlowStep,

  FlowStepType,

} from "@qre/contracts";


import {

  experienceDirector,

} from "./director.js";





/**
 * =====================================================
 *
 * MOMENT → FLOW TYPE RESOLUTION
 *
 * Semantic conversion only.
 *
 * =====================================================
 */


function resolveFlowType(

  momentType:ExperienceMomentType

):FlowStepType {



const mapping:

Partial<

Record<

ExperienceMomentType,

FlowStepType

>

> = {



welcome:
"hero",


introduction:
"hero",


story:
"story",


memory:
"story",


timeline:
"timeline",


photos:
"gallery",


video:
"video",


soundtrack:
"soundtrack",


location:
"location",


product:
"product",


menu:
"menu",


offer:
"offer",


reward:
"reward",


payment:
"payment",


booking:
"booking",


review:
"review",


social:
"social",


share:
"share",


profile:
"profile",


guestbook:
"guestbook",


interaction:
"timer",


completion:
"message",


reveal:
"story",


legacy:
"story",


future:
"story",


milestone:
"timeline",


};




return (

mapping[momentType]

??

"message"

);


}









/**
 * =====================================================
 *
 * DIRECTOR CONTEXT
 *
 * Attaches creative intelligence.
 *
 * =====================================================
 */


function buildDirectorContext(

 blueprint:ExperienceBlueprint

){


return experienceDirector(

 blueprint

);


}









/**
 * =====================================================
 *
 * FLOW COMPILER
 *
 * Blueprint → FlowStep[]
 *
 * =====================================================
 */


export function blueprintToFlow(


  blueprint:ExperienceBlueprint


):FlowStep[] {



if(

!blueprint ||

!Array.isArray(

blueprint.moments

)

){

return [];

}




const direction =

buildDirectorContext(

 blueprint

);






return blueprint.moments.map(


(moment,index)=>(


{


/**
 * Stable readable runtime id
 */

id:

`experience-${moment.type}-${index}`,


/**
 * Player ordering
 */

order:

index,



/**
 * Runtime action type
 */

type:

resolveFlowType(

moment.type

),




payload:{



/**
 * =================================================
 * CREATIVE DIRECTION
 * =================================================
 */


direction,





/**
 * =================================================
 * EXPERIENCE MOMENT
 * =================================================
 */


experience:{



component:

moment.component,



momentType:

moment.type,



title:

moment.title,



subtitle:

moment.subtitle,



description:

moment.description,



icon:

moment.icon,



animation:

moment.animation,



editable:

moment.editable,



demo:

moment.demo,



order:

moment.order,



},





/**
 * =================================================
 * SOURCE PAYLOAD
 *
 * Preserve original semantic data.
 *
 * =================================================
 */


...moment.payload,





/**
 * =================================================
 * SCENE INTENT
 *
 * Future cinematic compiler consumes this.
 *
 * =================================================
 */


intent:{



phase:

direction.emotionalArc[index]?.phase

??

moment.type,




emotion:

direction.emotionalArc[index]?.emotion

??

[],




purpose:

direction.emotionalArc[index]?.intention

??

"continue experience",



},

}

}


)

);


}

export const experienceFlowCompiler =

blueprintToFlow;