/**
 * =====================================================
 * QRE REVIK FIELD
 * =====================================================
 *
 * Transformation Intelligence Layer.
 *
 * NUVO:
 * "What could become"
 *
 * REVIK:
 * "How does it evolve"
 *
 * Discovers:
 *
 * - transformation chains
 * - evolution paths
 * - future states
 * - identity shifts
 * - emotional movement
 * - narrative progression
 * - human transformation
 *
 * NO DATABASE.
 * NO EXECUTION.
 * NO INDUSTRY.
 *
 * =====================================================
 */


import type {
  CompilerMind,
  NuvoField,
  RevikField,
  RevikTransformation,
} from "@qre/contracts";

export type {
  RevikField,
  RevikTransformation,
} from "@qre/contracts";

function unique(
 values:string[]
){

 return [

  ...new Set(

   values.filter(Boolean)

  )

 ];

}

function discoverTransformations(

 nuvo:NuvoField

):RevikTransformation[]{



const transformations:RevikTransformation[]=[];



for(
 const future of nuvo.futureRealities
){


transformations.push({

 source:

  future.transformation

   .split("→")[0]

   .trim(),



 destination:

  future.name,



 path:

  future.transformation

   .split("→")

   .map(

    item =>

     item.trim()

   ),



 meaning:

  future.description,



 strength:

  future.confidence


});


}




return transformations;


}
function discoverSemanticTransitions(
 nuvo:NuvoField
):string[] {


return unique([

 ...nuvo.semanticPotential,

 ...nuvo.possibilityVectors

]);


}



function discoverRelationshipEvolutions(
 nuvo:NuvoField
):string[] {


return unique(

 nuvo.hiddenRelationships ?? []

);


}



function discoverArchetypeEvolutions(
 nuvo:NuvoField
):string[] {


return unique(

 nuvo.emergentArchetypes ?? []

);

}

function discoverUnansweredPaths(
 nuvo:NuvoField
):string[] {


return unique(

 nuvo.futureQuestions ?? []

);


}
function discoverEvolutionChains(

 nuvo:NuvoField

):string[][] {


const chains:string[][]=[];




if(

 nuvo.transformationPaths.includes(

  "moment_to_story"

 )

){


chains.push([


 "moment",


 "story",


 "memory",


 "legacy"


]);


}





if(

 nuvo.latentWorlds.includes(

  "memory_world"

 )

){


chains.push([


 "memory",


 "experience",


 "world"


]);


}






if(

 nuvo.latentWorlds.includes(

  "cinematic_world"

 )

){


chains.push([


 "idea",


 "atmosphere",


 "cinematic_reality"


]);


}


if(

 nuvo.transformationPaths.includes(

  "individual_to_collective"

 )

){


chains.push([


 "person",


 "community",


 "culture"


]);


}





return chains;


}


function discoverIdentityShifts(

 nuvo:NuvoField

):string[]{


const shifts:string[]=[];


if(

 nuvo.transformationPaths.includes(

  "moment_to_story"

 )

){


shifts.push(

 "memory_holder → storyteller"

);


}





if(

 nuvo.transformationPaths.includes(

  "individual_to_collective"

 )

){


shifts.push(

 "person → community_member"

);


}





if(

 nuvo.latentWorlds.includes(

  "cinematic_world"

 )

){


shifts.push(

 "observer → participant"

);


}





if(

 nuvo.futureRealities.some(

  future =>

   future.name === "adaptive_experience"

 )

){


shifts.push(

 "visitor → creator"

);


}





return unique(shifts);


}


function discoverEmotionalMovements(

 nuvo:NuvoField

):string[]{


const movements:string[]=[];



if(

 nuvo.hiddenForces.includes(

  "love"

 )

){


movements.push(

 "connection → belonging"

);


}





if(

 nuvo.hiddenForces.includes(

  "legacy"

 )

){


movements.push(

 "memory → significance"

);


}





if(

 nuvo.hiddenForces.includes(

  "discovery"

 )

){


movements.push(

 "curiosity → revelation"

);


}





if(

 nuvo.hiddenForces.includes(

  "identity"

 )

){


movements.push(

 "self → transformation"

);


}


return unique(movements);


}

export function awakenRevik(
  mind:CompilerMind
):RevikField {

if (!mind.nuvo) {
  throw new Error("CompilerMind.nuvo must exist before awakenRevik()");
}

const nuvo = mind.nuvo;

const evolutionChains =

 discoverEvolutionChains(

  nuvo

 );

const transformations =

 discoverTransformations(

  nuvo

 );






const futureStates = unique([



 ...nuvo.latentWorlds,




 ...nuvo.futureRealities.map(

  future =>

   future.name

 )



]);


const identityShifts =

 discoverIdentityShifts(

  nuvo

 );


const emotionalMovements =

 discoverEmotionalMovements(

  nuvo

 );
 const semanticTransitions =
 discoverSemanticTransitions(
  nuvo
 );


const relationshipEvolutions =
 discoverRelationshipEvolutions(
  nuvo
 );


const archetypeEvolutions =
 discoverArchetypeEvolutions(
  nuvo
 );


const unansweredPaths =
 discoverUnansweredPaths(
  nuvo
 );

 return {

 evolutionChains,

 transformations,

 identityShifts,

 emotionalMovements,


 dominantMotion:

  transformations.length

   ?

   "evolution"

   :

   "observation",


 futureStates,


 semanticTransitions,


 relationshipEvolutions,


 unansweredPaths,


 archetypeEvolutions,


 evolutionStrength:

  Math.min(

   1,

   (

    transformations.reduce(

     (sum,item) =>

      sum + item.strength,

     0

    )

    /

    Math.max(

     transformations.length,

     1

    )

   )

  )

};




}