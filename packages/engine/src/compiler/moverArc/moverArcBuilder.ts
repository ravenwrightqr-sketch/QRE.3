/**
 * =====================================================
 * QRE MOVER ARC BUILDER
 * =====================================================
 *
 * Builds transformation movement topology.
 *
 * Inputs:
 *
 * SemanticIR
 * Genome
 * NUVO
 * REVIK
 *
 * Output:
 *
 * MoverArc
 *
 *
 * SemanticIR:
 * "Meaning"
 *
 * Genome:
 * "Existence"
 *
 * NUVO:
 * "Possibility"
 *
 * REVIK:
 * "Evolution"
 *
 * MoverArc:
 * "Movement"
 *
 *
 * NO DATABASE.
 * NO RUNTIME.
 * NO EXECUTION.
 *
 * =====================================================
 */


import type {

  SemanticIR,

  ExperienceGenome,

  MoverArc,

  MoverNode,

  MoverTransition,

  MoverIdentityShift,

  MoverArcQuestion

} from "@qre/contracts";


import type {

  RevikField

} from "../revik/index.js";





function unique(
 values:string[]
){

 return [

  ...new Set(

    values.filter(Boolean)

  )

 ];

}

function createNode(

 label:string,

 stage:MoverNode["stage"],

 meaning:string

):MoverNode {


 return {

  id:

   `${stage}_${

    label

     .toLowerCase()

     .replace(/\s+/g,"_")

   }`,

  label,

  state:label,

  stage,

  meaning,


  identity:

   `${label} identity state`,


  emotionalWeight:.5,


  possibilityWeight:.5,


  confidence:.8

};


}


function buildNodes(

 revik:RevikField

):MoverNode[]{


const nodes:MoverNode[]=[];



for(
 const chain of revik.evolutionChains
){


chain.forEach(

 (item,index)=>{


  nodes.push(

   createNode(

    item,

    index === 0

     ? "origin"

     :

     index === chain.length - 1

     ? "legacy"

     :

     "shift",

    `Movement state: ${item}`

   )

  );


 }

);


}



return nodes;

}

function buildTransitions(

 nodes:MoverNode[]

):MoverTransition[]{


const transitions:MoverTransition[]=[];



for(
 let i = 0;

 i < nodes.length - 1;

 i++

){


 transitions.push({

  from:nodes[i].id,

  to:nodes[i+1].id,


  movement:"transformation",


  trigger:"semantic evolution",


  meaning:

   `${nodes[i].label} becomes ${nodes[i+1].label}`,


  emotionalForce:

   "identity movement",


  transformationReason:

   "evolution discovered through REVIK topology",


  possibilityWeight:.7,


  evolutionWeight:.8,


  strength:.8

});


}



return transitions;

}

function buildIdentityShifts(

 revik:RevikField

):MoverIdentityShift[]{


return revik.identityShifts.map(

 shift => {


 const parts =

  shift.split("→");



 return {


  before:

   parts[0]?.trim()
   ??
   "unknown",


  after:

   parts[1]?.trim()
   ??
   "unknown",


  reason:

   "Transformation discovered by REVIK",


  emotionalChange:

   "identity evolution"


 };


 }

);


}


function buildQuestions(

 revik:RevikField

):MoverArcQuestion[]{


return revik.unansweredPaths.map(

 question => ({


  question,


  purpose:

   "future discovery path",


  unresolved:true


 })

);


}


export function buildMoverArc(

 input:{

  semanticIR:SemanticIR;

  genome:ExperienceGenome;

  revik:RevikField;

 }

):MoverArc {



const nodes =

 buildNodes(

  input.revik

 );




const transitions =

 buildTransitions(

  nodes

 );




const identityShifts =

 buildIdentityShifts(

  input.revik

 );




const unansweredQuestions =

 buildQuestions(

  input.revik

 );

return {


 origin:

  nodes[0]?.label
  ??

  "unknown",



 destination:

  nodes[nodes.length - 1]?.label
  ??

  "unknown",



 nodes,


 transitions,


 identityShifts,



 emotionalMovements:

  unique(

   input.revik.emotionalMovements

  ),



 dominantDirection:

  input.revik.transformations.length

   ? "transformation"

   : "discovery",



 unansweredQuestions,



 futureStates:

  unique(

   input.revik.futureStates

  ),



 /**
  * =====================================================
  *
  * TRANSFORMATION FIELD INTELLIGENCE
  *
  * MOVER ARC upgraded:
  *
  * Not only where movement goes.
  * Why movement exists.
  * =====================================================
  */



 transformationForce:

  input.revik.transformations.length

   ?

   input.revik.transformations[0].meaning

   :

   "emergent transformation",




 movementVector:

  input.revik.dominantMotion
  ??

  "unknown",


 possibilityCount:

    input.revik.futureStates.length,



 transformationStrength:

  input.revik.evolutionStrength,



 confidence:

  input.revik.evolutionStrength,



 version:1


};


}


