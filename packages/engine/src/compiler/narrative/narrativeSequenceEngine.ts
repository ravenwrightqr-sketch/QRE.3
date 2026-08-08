/**
 * =====================================================
 * QRE NARRATIVE SEQUENCE ENGINE
 * =====================================================
 *
 * Converts selected narrative possibility
 * into emotional movement.
 *
 * NOT:
 *
 * ❌ chapters
 * ❌ scenes
 * ❌ UI steps
 * ❌ captions
 * ❌ fixed stories
 *
 *
 * IS:
 *
 * ✅ experience progression
 * ✅ emotional transformation
 * ✅ narrative movement
 * ✅ story physics
 * ✅ adaptive sequencing
 * ✅ contextual meaning generation
 * ✅ world-aware cognition
 * ✅ memory intelligence
 *
 *
 * Pipeline:
 *
 * Selected Narrative Path
 *          ↓
 * World Intelligence
 *          ↓
 * Narrative Sequence
 *          ↓
 * Cinematic Runtime
 *
 * =====================================================
 */


import type {
  ExperienceGenome,
  ExperienceWorld,
  ExperienceBlueprint
} from "@qre/contracts";


import type {
  NarrativePath
} from "./narrativePathGenerator.js";

import {
  createHumanNarrativeExpression
} from "./humanNarrativeExpressionEngine.js";



export interface NarrativeSequenceMoment {


    order:number;


    state:string;


    emotion:string;


    meaning:string;


    intensity:number;


    purpose:string;


    transition:string;


    expectation:string;


    revelation:string;


    memoryAnchor:string;


    momentum:number;


    /**
     * World influence.
     */
    worldForce:string;


    /**
     * Emotional physics applied.
     */
    emotionalLaw:string;


    /**
     * Future evolution signal.
     */
    futurePossibility:string;


}


export interface NarrativeSequence {

moments:NarrativeSequenceMoment[];

transformation:string;

worldIdentity:string;

}


function calculateIntensity(

 index:number,

 total:number

):number {


if(total <= 1){

 return 1;

}


return Math.min(

1,

.25 +

(
 index /
 (total - 1)
)
*
.75

);


}







function calculateMomentum(

 index:number,

 total:number

):number {


if(total <= 1){

 return 1;

}


return Math.min(

1,

index /

Math.max(

 total - 1,

 1

)

);


}








function getWorldCore(

 world:ExperienceWorld

):string {


return world.worldIdentity.emotionalCore;

}








function getWorldPromise(

 world:ExperienceWorld

):string {


return world.worldIdentity.promise;

}








function getWorldLaw(

 world:ExperienceWorld

):string {


return (

world.worldLaws[0]?.principle

??

world.emotionalPhysics[0]

??

"The world follows its own emotional logic."

);


}








function getFuturePossibility(

 world:ExperienceWorld

):string {


return (

world.evolution?.nextPossibleStates?.join(", ")

??

"continued emotional evolution"

);


}









function createPurpose(

 index:number,

 total:number

):string {


if(index === 0){

return "establish emotional entry into the world";

}


if(index === total - 1){

return "create lasting memory imprint";

}


return "advance emotional transformation";


}









function createMeaning(


 state:string,


 index:number,


 path:NarrativePath,


 world:ExperienceWorld,


 blueprint:ExperienceBlueprint


):string {



const title =

blueprint.title

??

"experience";



const worldCore =

getWorldCore(world);



if(index === 0){

return (

`${title} begins through ${state}, entering a world shaped by ${worldCore}.`

);

}




if(index === path.states.length - 1){


return (

`${title} reaches ${state}, where the experience becomes a lasting memory.`

);


}




return (

`${title} evolves through ${state}, revealing deeper meaning inside ${worldCore}.`

);


}









function createRevelation(


state:string,


emotion:string,


world:ExperienceWorld


):string {


return (

`${state} reveals the philosophy of ${world.worldIdentity.philosophy}, while ${emotion} deepens the transformation.`

);


}









function createExpectation(


next:string | undefined


):string {


if(next){


return (

"The human naturally moves toward the next emotional state: " +

next

);


}



return (

"The transformation settles into memory."

);


}









function createMemoryAnchor(


state:string,


path:NarrativePath,


world:ExperienceWorld


):string {



if(world.transformation){


return (

`${state} represents movement from ${world.transformation.before} through ${world.transformation.journey} toward ${world.transformation.after}.`

);


}



return (

`${world.worldIdentity.promise}. ${path.meaning}`

);


}









function createTransition(

previous:string | undefined,

current:string

):string {


if(!previous){

return "experience origin";

}



return (

`movement from ${previous} into ${current}`

);


}









export function buildNarrativeSequence(


path:NarrativePath,


genome:ExperienceGenome,


world:ExperienceWorld,


blueprint:ExperienceBlueprint


):NarrativeSequence {


const moments:NarrativeSequenceMoment[] =


path.states.map(

(state,index)=>{



const emotion =


path.emotions[index]

??

genome.emotions?.[0]

??

"connection";


const humanExpression =
createHumanNarrativeExpression(
  state,
  emotion,
  path.meaning,
  genome,
  world
);


return {


order:index,


state,


emotion,

expression:
  humanExpression.expression,


dramaticShift:
  humanExpression.dramaticShift,


memoryImpact:
  humanExpression.memoryImpact,

intensity:

calculateIntensity(

index,

path.states.length

),



purpose:

createPurpose(

index,

path.states.length

),



meaning:

createMeaning(

state,

index,

path,

world,

blueprint

),



transition:

createTransition(

path.states[index - 1],

state

),



expectation:

createExpectation(

path.states[index + 1]

),



revelation:

createRevelation(

state,

emotion,

world

),



memoryAnchor:

createMemoryAnchor(

state,

path,

world

),



momentum:

calculateMomentum(

index,

path.states.length

),



worldForce:

`${world.domain} | ${world.role} | ${world.worldIdentity.name}`,



emotionalLaw:

getWorldLaw(world),



futurePossibility:

getFuturePossibility(world)



};


}

);






return {


moments,



transformation:


world.transformation

?

`${world.transformation.before} → ${world.transformation.after}`

:

path.meaning,




worldIdentity:

world.worldIdentity.name


};


}