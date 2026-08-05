/**
 * =====================================================
 * QRE KAIVO FIELD
 * =====================================================
 *
 * Meaning Relationship Intelligence.
 *
 * REVIK:
 * "How does something evolve?"
 *
 * KAIVO:
 * "What gives it meaning?"
 *
 * Discovers:
 *
 * - relationship networks
 * - emotional resonance
 * - identity connections
 * - memory bonds
 * - symbolic meaning
 * - meaning gravity
 *
 * NO DATABASE.
 * NO EXECUTION.
 *
 * =====================================================
 */
import type {
  CompilerMind,
  RevikField,
  KaivoField,
  KaivoConnection,
  KaivoMeaningCluster,
  KaivoResonance,
  MoverArc,
  MoverTopology,
} from "@qre/contracts";

export type {
  KaivoField,
  KaivoConnection,
  KaivoMeaningCluster,
  KaivoResonance,
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


function determineForce(

 value:string

):KaivoConnection["force"] {


if(
 value.includes("memory")
){

 return "memory";

}


if(
 value.includes("legacy")
){

 return "legacy";

}


if(
 value.includes("identity")
){

 return "identity";

}


if(
 value.includes("emotion")
){

 return "emotion";

}


if(
 value.includes("symbol")
){

 return "symbol";

}


return "growth";


}


function buildConnections(

 chains:string[][]

):KaivoConnection[]{


const connections:KaivoConnection[]=[];



for(
 const chain of chains
){


for(
 let i = 0;
 i < chain.length - 1;
 i++
){


connections.push({


from:
 chain[i],



to:
 chain[i + 1],



force:

 determineForce(

  chain[i + 1]

 ),



strength:

 Math.min(

 1,

 (i + 1) /

 chain.length

 )


});


}


}



return connections;


}


function buildResonance(

 connections:KaivoConnection[]

):KaivoResonance[]{



return connections.map(

 connection => ({


 node:

  connection.to,



 influence:

  `${connection.from} influences ${connection.to}`,



 weight:

  connection.strength



 })


);


}

function buildMeaningClusters(

 revik:RevikField

):KaivoMeaningCluster[]{


const clusters:KaivoMeaningCluster[]=[];



if(
 revik.identityShifts.length
){

clusters.push({

 name:
  "identity_transformation",


 nodes:
  revik.identityShifts,


 intensity:
  .9


});


}




if(
 revik.emotionalMovements.length
){

clusters.push({

 name:
  "emotional_journey",


 nodes:
  revik.emotionalMovements,


 intensity:
  .85


});


}


if(
 revik.futureStates.length
){

clusters.push({

 name:
  "future_reality",


 nodes:
  revik.futureStates,


 intensity:
  .8


});


}


return clusters;

}
function buildMoverInfluence(

 moverArc:MoverArc,

 moverTopology:MoverTopology

):string[] {


return unique([

 ...moverArc.identityShifts.map(

  shift =>

   `${shift.before} → ${shift.after}`

 ),


 ...moverTopology.dominantPath.map(

  node =>

   `transformation gravity: ${node}`

 )

]);


}

export function awakenKaivo(
  mind: CompilerMind
): KaivoField {

  const revik = mind.revik;

  if (!revik) {
    throw new Error(
      "CompilerMind.revik must exist before awakenKaivo()."
    );
  }


  const moverArc = mind.moverArc;

  if (!moverArc) {
    throw new Error(
      "CompilerMind.moverArc must exist before awakenKaivo()."
    );
  }


  const moverTopology = mind.moverTopology;

  if (!moverTopology) {
    throw new Error(
      "CompilerMind.moverTopology must exist before awakenKaivo()."
    );
  }

const connections =

 buildConnections(

  revik.evolutionChains

 );


const resonanceNodes = [

 ...new Set(

  connections.flatMap(

   connection => [

    connection.from,

    connection.to

   ]

  )

 )

];


const resonances =

 buildResonance(

  connections

 );


const meaningClusters =

 buildMeaningClusters(

  revik

 );

const dominantForce =


connections.length


?


connections

 .sort(

  (a,b)=>

   b.strength -

   a.strength

 )[0].force


:


"growth";

const moverInfluence =

 buildMoverInfluence(

  moverArc,

  moverTopology

);


return {


 connections,


 resonanceNodes,


 resonances,


 meaningClusters,


 moverInfluence,


 dominantForce,



 coherence:

 Math.min(

 1,

 (

  connections.length +

  meaningClusters.length +

  moverInfluence.length

 )

 / 10

 )


};



}