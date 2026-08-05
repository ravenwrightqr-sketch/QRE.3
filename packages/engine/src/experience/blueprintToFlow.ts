/**
 * =====================================================
 * QRE BLUEPRINT → EXPERIENCE FLOW COMPILER
 * =====================================================
 *
 * Experience Blueprint
 *        ↓
 * Runtime Flow Instructions
 *
 *
 * Responsibilities:
 *
 * - translate experience moments into runtime steps
 * - preserve semantic meaning
 * - preserve experience intent
 * - preserve source payload
 *
 *
 * Does NOT:
 *
 * ❌ create stories
 * ❌ create emotional arcs
 * ❌ invent creative direction
 * ❌ access database
 * ❌ execute runtime
 * ❌ control player behavior
 *
 * =====================================================
 */


import type {

  ExperienceBlueprint,

  ExperienceMomentType,

  FlowStep,

  FlowStepType,

} from "@qre/contracts";



/**
 * =====================================================
 *
 * MOMENT TYPE → FLOW TYPE
 *
 * Minimal semantic translation.
 *
 * Runtime decides behavior.
 *
 * =====================================================
 */


function resolveFlowType(

  momentType: ExperienceMomentType

): FlowStepType {


const mapping:

Partial<Record<ExperienceMomentType, FlowStepType>> = {


welcome:
"hero",


introduction:
"hero",


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


milestone:
"timeline",


legacy:
"timeline",


future:
"story",


reveal:
"story",


story:
"story",


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
 * BLUEPRINT → FLOW
 *
 * Pure semantic compilation.
 *
 * =====================================================
 */


export function blueprintToFlow(

  blueprint: ExperienceBlueprint

): FlowStep[] {



if(

  !blueprint ||

  !Array.isArray(blueprint.moments)

){

  return [];

}




return blueprint.moments.map(

(moment,index)=>(


{


id:

`experience-${index}-${moment.type}`,



order:

index,



type:

resolveFlowType(

moment.type

),



payload:{



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




meaning:{


purpose:

moment.description

??

"",


type:

moment.type,


},




source:

moment.payload,



intent:{


type:

moment.type,


meaning:

moment.description

??

"",


}


}



}


)

);


}



export const experienceFlowCompiler =

blueprintToFlow;